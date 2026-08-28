'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { LifecycleStatus } from '@prisma/client';
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
  return prisma.asset.findMany({
    where: { userId: user.id },
    include: {
      project: true,
      rightsRecord: true,
      sustainabilityRecord: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAssetById(id: string) {
  const user = await getAuthUser();
  return prisma.asset.findUnique({
    where: { id, userId: user.id },
    include: {
      project: true,
      events: {
        orderBy: { timestamp: 'desc' },
      },
      rightsRecord: true,
      sustainabilityRecord: true,
    },
  });
}

export async function createAsset(data: {
  title: string;
  description?: string;
  imageUrl?: string;
  projectId: string;
}) {
  const user = await getAuthUser();

  const asset = await prisma.asset.create({
    data: {
      title: data.title,
      description: data.description,
      imageUrl: data.imageUrl,
      projectId: data.projectId,
      userId: user.id,
      status: LifecycleStatus.CONCEPT,
      events: {
        create: {
          previousStatus: null,
          newStatus: LifecycleStatus.CONCEPT,
          notes: 'Asset creado en fase de Concepción / Diseño.',
        },
      },
    },
  });

  revalidatePath('/assets');
  revalidatePath('/dashboard');
  return asset;
}

export async function updateAssetStatus(
  assetId: string,
  newStatus: LifecycleStatus,
  notes?: string
) {
  const user = await getAuthUser();
  const currentAsset = await prisma.asset.findUnique({
    where: { id: assetId, userId: user.id },
  });

  if (!currentAsset) {
    throw new Error('Asset no encontrado');
  }

  if (currentAsset.status === newStatus) {
    return currentAsset;
  }

  const updatedAsset = await prisma.asset.update({
    where: { id: assetId },
    data: {
      status: newStatus,
      events: {
        create: {
          previousStatus: currentAsset.status,
          newStatus,
          notes: notes || `Cambio de estado a ${newStatus}`,
        },
      },
    },
  });

  revalidatePath(`/assets/${assetId}`);
  revalidatePath('/assets');
  revalidatePath('/dashboard');
  return updatedAsset;
}

export async function upsertRightsRecord(
  assetId: string,
  data: {
    licenseType: string;
    ownerName: string;
    terms?: string;
    expirationDate?: string | null;
    isDocumented: boolean;
  }
) {
  const user = await getAuthUser();
  const asset = await prisma.asset.findUnique({ where: { id: assetId, userId: user.id } });
  if (!asset) throw new Error('Asset no encontrado');

  const expDate = data.expirationDate ? new Date(data.expirationDate) : null;

  const rights = await prisma.rightsRecord.upsert({
    where: { assetId },
    update: {
      licenseType: data.licenseType,
      ownerName: data.ownerName,
      terms: data.terms,
      expirationDate: expDate,
      isDocumented: data.isDocumented,
    },
    create: {
      assetId,
      licenseType: data.licenseType,
      ownerName: data.ownerName,
      terms: data.terms,
      expirationDate: expDate,
      isDocumented: data.isDocumented,
    },
  });

  revalidatePath(`/assets/${assetId}`);
  revalidatePath('/assets');
  revalidatePath('/dashboard');
  return rights;
}

export async function upsertSustainabilityRecord(
  assetId: string,
  data: {
    carbonFootprintKg: number;
    weightKg: number;
    recyclablePercent: number;
    notes?: string;
  }
) {
  const user = await getAuthUser();
  const asset = await prisma.asset.findUnique({ where: { id: assetId, userId: user.id } });
  if (!asset) throw new Error('Asset no encontrado');

  const sustainability = await prisma.sustainabilityRecord.upsert({
    where: { assetId },
    update: {
      carbonFootprintKg: data.carbonFootprintKg,
      weightKg: data.weightKg,
      recyclablePercent: data.recyclablePercent,
      notes: data.notes,
    },
    create: {
      assetId,
      carbonFootprintKg: data.carbonFootprintKg,
      weightKg: data.weightKg,
      recyclablePercent: data.recyclablePercent,
      notes: data.notes,
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
    where: { userId: user.id },
  });

  const assetsWithRights = await prisma.rightsRecord.count({
    where: {
      asset: { userId: user.id },
      isDocumented: true,
    },
  });

  const sustainabilityRecords = await prisma.sustainabilityRecord.findMany({
    where: {
      asset: { userId: user.id },
    },
    select: {
      carbonFootprintKg: true,
    },
  });

  const totalCarbonFootprintKg = sustainabilityRecords.reduce(
    (sum, record) => sum + (record.carbonFootprintKg || 0),
    0
  );

  const rightsDocumentedPercentage =
    totalAssets > 0 ? Math.round((assetsWithRights / totalAssets) * 100) : 0;

  const statusCounts = await prisma.asset.groupBy({
    by: ['status'],
    where: { userId: user.id },
    _count: { status: true },
  });

  const assetsList = await prisma.asset.findMany({
    where: { userId: user.id },
    include: {
      sustainabilityRecord: true,
      rightsRecord: true,
    },
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  return {
    totalAssets,
    rightsDocumentedPercentage,
    totalCarbonFootprintKg,
    statusCounts: statusCounts.map((sc) => ({
      status: sc.status,
      count: sc._count.status,
    })),
    recentAssets: assetsList,
  };
}
