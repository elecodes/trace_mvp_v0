'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { LifecycleStage } from '@prisma/client';
import { revalidatePath } from 'next/cache';

async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No estás autenticado');
  }

  // Ensure user exists in Prisma database
  const dbUser = await prisma.user.upsert({
    where: { id: user.id },
    update: { email: user.email! },
    create: {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || user.email?.split('@')[0],
    },
  });

  return dbUser;
}

export async function signAssetImageUrl(imageUrl: string | null): Promise<string | null> {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.storage
      .from('asset-images')
      .createSignedUrl(imageUrl, 3600); // 1 hour expiration
    
    if (error || !data) {
      console.error('Error generating signed URL:', error);
      return null;
    }
    return data.signedUrl;
  } catch (err) {
    console.error('Error generating signed URL:', err);
    return null;
  }
}

export async function getProjects() {
  const user = await getAuthUser();
  let projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });

  if (projects.length === 0) {
    const defaultProject = await prisma.project.create({
      data: {
        name: 'Proyecto Principal',
        description: 'Proyecto por defecto para gestionar assets',
        userId: user.id,
      },
    });
    projects = [defaultProject];
  }

  return projects;
}

export async function getAssets() {
  const user = await getAuthUser();
  const assets = await prisma.asset.findMany({
    where: { project: { userId: user.id } },
    include: {
      project: true,
      rightsRecord: true,
      sustainabilityRecord: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return Promise.all(
    assets.map(async (asset) => ({
      ...asset,
      rawImageUrl: asset.imageUrl,
      imageUrl: await signAssetImageUrl(asset.imageUrl),
    }))
  );
}

export async function getAssetById(id: string) {
  const user = await getAuthUser();
  const asset = await prisma.asset.findUnique({
    where: { id, project: { userId: user.id } },
    include: {
      project: true,
      events: {
        orderBy: { timestamp: 'desc' },
      },
      rightsRecord: true,
      sustainabilityRecord: true,
    },
  });

  if (!asset) return null;

  return {
    ...asset,
    rawImageUrl: asset.imageUrl,
    imageUrl: await signAssetImageUrl(asset.imageUrl),
  };
}

export async function createAsset(data: {
  id?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  projectId: string;
}) {
  const user = await getAuthUser();

  // Verificar que el proyecto pertenezca al usuario
  const project = await prisma.project.findUnique({
    where: { id: data.projectId }
  });

  if (!project || project.userId !== user.id) {
    throw new Error('Proyecto no encontrado o no autorizado');
  }

  const asset = await prisma.asset.create({
    data: {
      id: data.id,
      title: data.title,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      projectId: data.projectId,
      currentStage: LifecycleStage.DESIGN,
      events: {
        create: {
          previousStage: null,
          newStage: LifecycleStage.DESIGN,
          notes: 'Asset creado en fase de Diseño.',
        },
      },
    },
  });

  revalidatePath(`/projects/${data.projectId}`);
  revalidatePath('/assets');
  revalidatePath('/dashboard');
  return asset;
}

export async function updateAsset(
  assetId: string,
  data: {
    title: string;
    description?: string;
    imageUrl?: string;
  }
) {
  const user = await getAuthUser();
  
  // Verificar que el asset pertenezca al usuario a través de su proyecto
  const currentAsset = await prisma.asset.findUnique({
    where: { id: assetId },
    include: { project: true }
  });

  if (!currentAsset || currentAsset.project.userId !== user.id) {
    throw new Error('Asset no encontrado o no autorizado');
  }

  const updatedAsset = await prisma.asset.update({
    where: { id: assetId },
    data: {
      title: data.title,
      description: data.description || null,
      imageUrl: data.imageUrl !== undefined ? data.imageUrl : currentAsset.imageUrl,
    },
  });

  revalidatePath(`/assets/${assetId}`);
  revalidatePath(`/projects/${currentAsset.projectId}`);
  revalidatePath('/assets');
  revalidatePath('/dashboard');
  return updatedAsset;
}


export async function updateAssetStatus(
  assetId: string,
  newStage: LifecycleStage,
  notes?: string
) {
  const user = await getAuthUser();
  const currentAsset = await prisma.asset.findUnique({
    where: { id: assetId, project: { userId: user.id } },
  });

  if (!currentAsset) {
    throw new Error('Asset no encontrado');
  }

  if (currentAsset.currentStage === newStage) {
    return currentAsset;
  }

  const updatedAsset = await prisma.asset.update({
    where: { id: assetId },
    data: {
      currentStage: newStage,
      events: {
        create: {
          previousStage: currentAsset.currentStage,
          newStage,
          notes: notes || `Cambio de etapa a ${newStage}`,
        },
      },
    },
  });

  revalidatePath(`/assets/${assetId}`);
  revalidatePath('/assets');
  revalidatePath('/dashboard');
  return updatedAsset;
}

const mapLicenseType = (type: any): any => {
  if (!type || typeof type !== 'string') return 'UNKNOWN';
  const t = type.toUpperCase().replace(/\s+/g, '_');
  if (t === 'ORIGINAL' || t === 'COPYRIGHT' || t.includes('PROPIETARIA')) return 'ORIGINAL';
  if (t === 'STOCK_LICENSED' || t.includes('STOCK')) return 'STOCK_LICENSED';
  if (t === 'AI_GENERATED' || t.includes('AI') || t.includes('INTELIGENCIA')) return 'AI_GENERATED';
  if (t === 'PUBLIC_DOMAIN' || t.includes('CC') || t.includes('CREATIVE') || t.includes('PUBLICO')) return 'PUBLIC_DOMAIN';
  return 'UNKNOWN';
};

const mapLegalStatus = (status: any): any => {
  if (!status || typeof status !== 'string') return 'PENDING';
  const s = status.toUpperCase();
  if (s === 'APPROVED' || s === 'APROBADO' || s === 'VERIFICADO') return 'APPROVED';
  if (s === 'REJECTED' || s === 'RECHAZADO') return 'REJECTED';
  return 'PENDING';
};

const mapCircularityOutcome = (outcome: any): any => {
  if (!outcome || typeof outcome !== 'string') return 'PENDING';
  const o = outcome.toUpperCase();
  if (o === 'REUSED' || o === 'REUTILIZADO') return 'REUSED';
  if (o === 'DONATED' || o === 'DONADO') return 'DONATED';
  if (o === 'RECYCLED' || o === 'RECICLADO') return 'RECYCLED';
  if (o === 'DISCARDED' || o === 'DESECHADO') return 'DISCARDED';
  return 'PENDING';
};

export async function upsertRightsRecord(
  assetId: string,
  data: any
) {
  const user = await getAuthUser();
  const asset = await prisma.asset.findUnique({ where: { id: assetId, project: { userId: user.id } } });
  if (!asset) throw new Error('Asset no encontrado');

  const licenseType = mapLicenseType(data.licenseType);
  const legalStatus = mapLegalStatus(data.legalStatus);

  const rights = await prisma.rightsRecord.upsert({
    where: { assetId },
    update: {
      licenseType,
      sourceName: data.sourceName || null,
      licenseDocUrl: data.licenseDocUrl || null,
      isAiGenerated: data.isAiGenerated || false,
      aiToolName: data.aiToolName || null,
      legalStatus,
      notes: data.notes || null,
    },
    create: {
      assetId,
      licenseType,
      sourceName: data.sourceName || null,
      licenseDocUrl: data.licenseDocUrl || null,
      isAiGenerated: data.isAiGenerated || false,
      aiToolName: data.aiToolName || null,
      legalStatus,
      notes: data.notes || null,
    },
  });

  revalidatePath(`/assets/${assetId}`);
  revalidatePath('/assets');
  revalidatePath('/dashboard');
  return rights;
}

export async function upsertSustainabilityRecord(
  assetId: string,
  data: any
) {
  const user = await getAuthUser();
  const asset = await prisma.asset.findUnique({ where: { id: assetId, project: { userId: user.id } } });
  if (!asset) throw new Error('Asset no encontrado');

  const estimatedCo2eqKg = data.weightKg && data.emissionFactor ? data.weightKg * data.emissionFactor : null;
  const circularityOutcome = mapCircularityOutcome(data.circularityOutcome);

  const sustainability = await prisma.sustainabilityRecord.upsert({
    where: { assetId },
    update: {
      material: data.material || null,
      weightKg: data.weightKg || null,
      emissionFactor: data.emissionFactor || null,
      estimatedCo2eqKg,
      circularityOutcome,
      notes: data.notes || null,
    },
    create: {
      assetId,
      material: data.material || null,
      weightKg: data.weightKg || null,
      emissionFactor: data.emissionFactor || null,
      estimatedCo2eqKg,
      circularityOutcome,
      notes: data.notes || null,
    },
  });

  revalidatePath(`/assets/${assetId}`);
  revalidatePath('/assets');
  revalidatePath('/dashboard');
  return sustainability;
}

export async function getDashboardMetrics() {
  const user = await getAuthUser();

  const totalAssets = await prisma.asset.count({
    where: { project: { userId: user.id } },
  });

  const assetsWithRights = await prisma.rightsRecord.count({
    where: {
      asset: { project: { userId: user.id } },
    },
  });

  const sustainabilityRecords = await prisma.sustainabilityRecord.findMany({
    where: {
      asset: { project: { userId: user.id } },
    },
    select: {
      estimatedCo2eqKg: true,
    },
  });

  const totalCarbonFootprintKg = sustainabilityRecords.reduce(
    (sum, record) => sum + (record.estimatedCo2eqKg || 0),
    0
  );

  const rightsDocumentedPercentage =
    totalAssets > 0 ? Math.round((assetsWithRights / totalAssets) * 100) : 0;

  const stageCounts = await prisma.asset.groupBy({
    by: ['currentStage'],
    where: { project: { userId: user.id } },
    _count: { currentStage: true },
  });

  const assetsList = await prisma.asset.findMany({
    where: { project: { userId: user.id } },
    include: {
      sustainabilityRecord: true,
      rightsRecord: true,
    },
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  const signedRecentAssets = await Promise.all(
    assetsList.map(async (asset) => ({
      ...asset,
      rawImageUrl: asset.imageUrl,
      imageUrl: await signAssetImageUrl(asset.imageUrl),
    }))
  );

  return {
    totalAssets,
    rightsDocumentedPercentage,
    totalCarbonFootprintKg,
    statusCounts: stageCounts.map((sc) => ({
      status: sc.currentStage,
      count: sc._count.currentStage,
    })),
    recentAssets: signedRecentAssets,
  };
}
