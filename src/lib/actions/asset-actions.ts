'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { LifecycleStage, AssetCategory } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import sharp from 'sharp';
import { analyzeAssetImageUrl } from '@/lib/actions/ai-actions';
import { getOrCreateCurrentUser } from '@/lib/auth';
import {
  getProjectMemberRole,
  requireProjectMember,
  requireAssetProjectMember,
  canManageAssets,
  canManageRights,
  canManageSustainability
} from '@/lib/permissions';

async function getAuthUser() {
  const dbUser = await getOrCreateCurrentUser();
  if (!dbUser) {
    throw new Error('No estás autenticado');
  }
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
    where: {
      OR: [
        { userId: user.id },
        { members: { some: { userId: user.id } } }
      ]
    },
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
    where: {
      project: {
        OR: [
          { userId: user.id },
          { members: { some: { userId: user.id } } }
        ]
      }
    },
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
    where: { id },
    include: {
      project: {
        include: {
          sets: true
        }
      },
      set: true,
      shootingRecord: true,
      events: {
        orderBy: { timestamp: 'desc' },
      },
      rightsRecord: true,
      sustainabilityRecord: true,
    },
  });

  if (!asset) return null;

  const role = await getProjectMemberRole(asset.projectId, user.id);
  if (!role) {
    throw new Error('No autorizado para acceder a este asset');
  }

  return {
    ...asset,
    rawImageUrl: asset.imageUrl,
    imageUrl: await signAssetImageUrl(asset.imageUrl),
  };
}

export async function processAndCacheExternalImage(
  assetId: string,
  externalUrl: string,
  userId: string,
  projectId: string
) {
  try {
    console.log(`[Background Image Cache] Fetching image from: ${externalUrl}`);
    
    // Asynchronously call Gemini to parse metadata from the URL
    const aiData = await analyzeAssetImageUrl(externalUrl);
    
    const response = await fetch(externalUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    let optimizedBuffer: Buffer;

    if (contentType.includes('text/html')) {
      const html = await response.text();
      const ogImageRegex = /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i;
      const ogImageMatch = html.match(ogImageRegex);
      if (ogImageMatch && ogImageMatch[1]) {
        const imgRes = await fetch(ogImageMatch[1]);
        if (!imgRes.ok) throw new Error(`Failed to fetch OG image: ${imgRes.statusText}`);
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        optimizedBuffer = await sharp(buffer)
          .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer();
      } else {
        throw new Error('No og:image found on the HTML page');
      }
    } else {
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      optimizedBuffer = await sharp(buffer)
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    }

    const fileName = `cached-${Date.now()}.webp`;
    const filePath = `${userId}/${projectId}/${assetId}/${fileName}`;

    console.log(`[Background Image Cache] Uploading to Supabase Storage: ${filePath}`);
    const supabase = await createClient();
    const { data, error: uploadError } = await supabase.storage
      .from('asset-images')
      .upload(filePath, optimizedBuffer, {
        contentType: 'image/webp',
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload optimized image: ${uploadError.message}`);
    }

    const currentAsset = await prisma.asset.findUnique({
      where: { id: assetId }
    });

    const updateData: any = {
      imageUrl: data.path,
    };

    if (aiData) {
      if (aiData.description && (!currentAsset?.description || currentAsset.description.trim() === '' || currentAsset.description.startsWith('Sin descripción'))) {
        updateData.description = aiData.description;
      }
      if (aiData.category && aiData.category !== 'GENERIC' && (!currentAsset?.category || currentAsset.category === 'GENERIC')) {
        updateData.category = aiData.category;
      }
    }

    console.log(`[Background Image Cache] Updating asset database record for ${assetId} with: ${data.path}`);
    await prisma.asset.update({
      where: { id: assetId },
      data: updateData,
    });

    if (aiData?.rightsRecord) {
      console.log(`[Background Image Cache] Auto-populating RightsRecord for ${assetId}`);
      const existingRights = await prisma.rightsRecord.findUnique({
        where: { assetId }
      });

      const newLicense = aiData.rightsRecord.licenseType || 'UNKNOWN';
      const existingLicense = existingRights?.licenseType;
      const shouldUpdateLicense = !existingLicense || existingLicense === 'UNKNOWN' || newLicense !== 'UNKNOWN';

      await prisma.rightsRecord.upsert({
        where: { assetId },
        update: {
          licenseType: shouldUpdateLicense ? newLicense : existingLicense,
          sourceName: (shouldUpdateLicense || !existingRights?.sourceName) ? (aiData.rightsRecord.sourceName || null) : existingRights.sourceName,
          licenseDocUrl: (shouldUpdateLicense || !existingRights?.licenseDocUrl) ? (aiData.rightsRecord.licenseDocUrl || null) : existingRights.licenseDocUrl,
          notes: (shouldUpdateLicense || !existingRights?.notes) ? (aiData.rightsRecord.notes || null) : existingRights.notes,
        },
        create: {
          assetId,
          licenseType: newLicense,
          sourceName: aiData.rightsRecord.sourceName || null,
          licenseDocUrl: aiData.rightsRecord.licenseDocUrl || null,
          notes: aiData.rightsRecord.notes || null,
        }
      });
    }

    if (aiData?.material || aiData?.weightKg) {
      console.log(`[Background Image Cache] Auto-populating SustainabilityRecord for ${assetId}`);
      await prisma.sustainabilityRecord.upsert({
        where: { assetId },
        update: {
          material: aiData.material || null,
          weightKg: aiData.weightKg || null,
        },
        create: {
          assetId,
          material: aiData.material || null,
          weightKg: aiData.weightKg || null,
        }
      });
    }

    revalidatePath(`/assets/${assetId}`);
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/assets');
    revalidatePath('/dashboard');
    console.log(`[Background Image Cache] Successfully processed and cached image + metadata for asset ${assetId}`);
  } catch (error) {
    console.error(`[Background Image Cache] Error caching image for asset ${assetId}:`, error);
  }
}

export async function createAsset(data: {
  id?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  projectId: string;
  category?: AssetCategory;
  rightsRecord?: {
    licenseType: any;
    sourceName?: string;
    licenseDocUrl?: string;
    notes?: string;
  };
  sustainabilityRecord?: {
    material?: string;
    weightKg?: number;
  };
}) {
  const user = await getAuthUser();
  const { role } = await requireProjectMember(data.projectId);

  if (!canManageAssets(role)) {
    throw new Error('No autorizado para crear assets en este proyecto');
  }

  const isExternal = data.imageUrl?.startsWith('http://') || data.imageUrl?.startsWith('https://');
  const originalImageUrl = isExternal ? data.imageUrl : null;

  const asset = await prisma.asset.create({
    data: {
      id: data.id,
      title: data.title,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      originalImageUrl,
      projectId: data.projectId,
      currentStage: LifecycleStage.DESIGN,
      category: data.category || AssetCategory.GENERIC,
      events: {
        create: {
          previousStage: null,
          newStage: LifecycleStage.DESIGN,
          notes: 'Asset creado en fase de Diseño.',
        },
      },
      rightsRecord: data.rightsRecord ? {
        create: {
          licenseType: data.rightsRecord.licenseType || 'UNKNOWN',
          sourceName: data.rightsRecord.sourceName || null,
          licenseDocUrl: data.rightsRecord.licenseDocUrl || null,
          notes: data.rightsRecord.notes || null,
        }
      } : undefined,
      sustainabilityRecord: (data.sustainabilityRecord?.material || data.sustainabilityRecord?.weightKg) ? {
        create: {
          material: data.sustainabilityRecord.material || null,
          weightKg: data.sustainabilityRecord.weightKg || null,
          circularityOutcome: 'PENDING',
        }
      } : undefined,
    },
  });

  if (isExternal && data.imageUrl) {
    // Process and cache the external image asynchronously in the background
    processAndCacheExternalImage(asset.id, data.imageUrl, user.id, data.projectId);
  }

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
    rightsRecord?: {
      licenseType: any;
      sourceName?: string;
      licenseDocUrl?: string;
      notes?: string;
    };
    sustainabilityRecord?: {
      material?: string;
      weightKg?: number;
    };
  }
) {
  const user = await getAuthUser();
  const { role, projectId } = await requireAssetProjectMember(assetId);

  if (!canManageAssets(role)) {
    throw new Error('No autorizado para modificar assets en este proyecto');
  }

  const currentAsset = await prisma.asset.findUnique({
    where: { id: assetId }
  });

  if (!currentAsset) {
    throw new Error('Asset no encontrado');
  }

  const isExternal = data.imageUrl?.startsWith('http://') || data.imageUrl?.startsWith('https://');
  
  let originalImageUrlUpdate: string | null | undefined = undefined;
  if (data.imageUrl !== undefined) {
    originalImageUrlUpdate = isExternal ? data.imageUrl : null;
  }

  const updatedAsset = await prisma.asset.update({
    where: { id: assetId },
    data: {
      title: data.title,
      description: data.description || null,
      imageUrl: data.imageUrl !== undefined ? (data.imageUrl || null) : currentAsset.imageUrl,
      originalImageUrl: originalImageUrlUpdate !== undefined ? (originalImageUrlUpdate || null) : currentAsset.originalImageUrl,
    },
  });

  if (data.rightsRecord) {
    // Only allow PRODUCER and LEGAL to modify rightsRecord
    if (canManageRights(role)) {
      await prisma.rightsRecord.upsert({
        where: { assetId },
        update: {
          licenseType: data.rightsRecord.licenseType || 'UNKNOWN',
          sourceName: data.rightsRecord.sourceName || null,
          licenseDocUrl: data.rightsRecord.licenseDocUrl || null,
          notes: data.rightsRecord.notes || null,
        },
        create: {
          assetId,
          licenseType: data.rightsRecord.licenseType || 'UNKNOWN',
          sourceName: data.rightsRecord.sourceName || null,
          licenseDocUrl: data.rightsRecord.licenseDocUrl || null,
          notes: data.rightsRecord.notes || null,
        }
      });
    }
  }

  if (data.sustainabilityRecord) {
    // Only allow PRODUCER and ART to modify sustainabilityRecord
    if (canManageSustainability(role)) {
      await prisma.sustainabilityRecord.upsert({
        where: { assetId },
        update: {
          material: data.sustainabilityRecord.material || null,
          weightKg: data.sustainabilityRecord.weightKg || null,
        },
        create: {
          assetId,
          material: data.sustainabilityRecord.material || null,
          weightKg: data.sustainabilityRecord.weightKg || null,
        }
      });
    }
  }

  if (data.imageUrl !== undefined && isExternal) {
    // Process and cache the external image asynchronously in the background
    processAndCacheExternalImage(updatedAsset.id, data.imageUrl, user.id, projectId);
  }

  revalidatePath(`/assets/${assetId}`);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/assets');
  revalidatePath('/dashboard');
  return updatedAsset;
}

export async function deleteAsset(assetId: string) {
  const { role, projectId } = await requireAssetProjectMember(assetId);

  if (!canManageAssets(role)) {
    throw new Error('No autorizado para eliminar assets en este proyecto');
  }

  await prisma.asset.delete({
    where: { id: assetId }
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/assets');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateAssetStatus(
  assetId: string,
  newStage: LifecycleStage,
  notes?: string
) {
  const { role, asset } = await requireAssetProjectMember(assetId);

  if (!canManageAssets(role)) {
    throw new Error('No autorizado para cambiar el ciclo de vida');
  }

  // Prevent moving to PRODUCTION without approved legal status
  if (newStage === LifecycleStage.PRODUCTION) {
    const rightsRecord = await prisma.rightsRecord.findUnique({
      where: { assetId }
    });
    const legalStatus = rightsRecord?.legalStatus ?? 'PENDING';
    if (legalStatus !== 'APPROVED') {
      throw new Error('No se puede mover a Producción: el registro de derechos no está aprobado');
    }
  }

  if (asset.currentStage === newStage) {
    return asset;
  }

  const updatedAsset = await prisma.asset.update({
    where: { id: assetId },
    data: {
      currentStage: newStage,
      events: {
        create: {
          previousStage: asset.currentStage,
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
  const { role } = await requireAssetProjectMember(assetId);

  if (!canManageRights(role)) {
    throw new Error('No autorizado para modificar el registro de derechos');
  }

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
  const { role } = await requireAssetProjectMember(assetId);

  if (!canManageSustainability(role)) {
    throw new Error('No autorizado para modificar el registro de sustentabilidad');
  }

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
  const whereProjectMember = {
    project: {
      OR: [
        { userId: user.id },
        { members: { some: { userId: user.id } } }
      ]
    }
  };

  const totalAssets = await prisma.asset.count({
    where: whereProjectMember,
  });

  const assetsWithRights = await prisma.rightsRecord.count({
    where: {
      asset: whereProjectMember,
    },
  });

  const sustainabilityRecords = await prisma.sustainabilityRecord.findMany({
    where: {
      asset: whereProjectMember,
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
    where: whereProjectMember,
    _count: { currentStage: true },
  });

  const assetsList = await prisma.asset.findMany({
    where: whereProjectMember,
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
