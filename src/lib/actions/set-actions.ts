'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function getAuthUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No estás autenticado');
  }
  return user.id;
}

export async function createSet(data: { name: string; location?: string | null; notes?: string | null; projectId: string }) {
  const userId = await getAuthUserId();
  const project = await prisma.project.findUnique({
    where: { id: data.projectId }
  });

  if (!project || project.userId !== userId) {
    throw new Error('Proyecto no encontrado o no autorizado');
  }

  const set = await prisma.set.create({
    data: {
      name: data.name,
      location: data.location || null,
      notes: data.notes || null,
      projectId: data.projectId,
    }
  });

  revalidatePath(`/projects/${data.projectId}`);
  return set;
}

export async function updateSet(id: string, data: { name: string; location?: string | null; notes?: string | null }) {
  const userId = await getAuthUserId();
  const set = await prisma.set.findUnique({
    where: { id },
    include: { project: true }
  });

  if (!set || set.project.userId !== userId) {
    throw new Error('Set no encontrado o no autorizado');
  }

  const updatedSet = await prisma.set.update({
    where: { id },
    data: {
      name: data.name,
      location: data.location || null,
      notes: data.notes || null,
    }
  });

  revalidatePath(`/projects/${set.projectId}`);
  return updatedSet;
}

export async function deleteSet(id: string) {
  const userId = await getAuthUserId();
  const set = await prisma.set.findUnique({
    where: { id },
    include: { project: true }
  });

  if (!set || set.project.userId !== userId) {
    throw new Error('Set no encontrado o no autorizado');
  }

  await prisma.set.delete({
    where: { id }
  });

  revalidatePath(`/projects/${set.projectId}`);
  return { success: true };
}

export async function assignAssetToSet(assetId: string, setId: string | null) {
  const userId = await getAuthUserId();
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    include: { project: true }
  });

  if (!asset || asset.project.userId !== userId) {
    throw new Error('Asset no encontrado o no autorizado');
  }

  if (setId) {
    const set = await prisma.set.findUnique({
      where: { id: setId }
    });
    if (!set || set.projectId !== asset.projectId) {
      throw new Error('Set no válido para este proyecto');
    }
  }

  const updatedAsset = await prisma.asset.update({
    where: { id: assetId },
    data: { setId }
  });

  revalidatePath(`/assets/${assetId}`);
  revalidatePath(`/projects/${asset.projectId}`);
  return updatedAsset;
}
