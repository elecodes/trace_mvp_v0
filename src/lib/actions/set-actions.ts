'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import {
  requireProjectMember,
  requireSetProjectMember,
  requireAssetProjectMember,
  canManageSets
} from '@/lib/permissions';

export async function createSet(data: { name: string; location?: string | null; notes?: string | null; projectId: string }) {
  const { role } = await requireProjectMember(data.projectId);

  if (!canManageSets(role)) {
    throw new Error('No autorizado para gestionar decorados en este proyecto');
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
  const { role, set } = await requireSetProjectMember(id);

  if (!canManageSets(role)) {
    throw new Error('No autorizado para gestionar decorados en este proyecto');
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
  const { role, set } = await requireSetProjectMember(id);

  if (!canManageSets(role)) {
    throw new Error('No autorizado para eliminar decorados en este proyecto');
  }

  await prisma.set.delete({
    where: { id }
  });

  revalidatePath(`/projects/${set.projectId}`);
  return { success: true };
}

export async function assignAssetToSet(assetId: string, setId: string | null) {
  const { role, asset } = await requireAssetProjectMember(assetId);

  if (!canManageSets(role)) {
    throw new Error('No autorizado para asignar decorados');
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
