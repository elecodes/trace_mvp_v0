'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
});

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

export async function getUserProjects() {
  const userId = await getAuthUserId();
  return prisma.project.findMany({
    where: { userId },
    include: {
      _count: {
        select: { assets: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

import { signAssetImageUrl } from './asset-actions';

export async function getProjectById(id: string) {
  const userId = await getAuthUserId();
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      assets: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!project || project.userId !== userId) {
    return null;
  }

  const signedAssets = await Promise.all(
    project.assets.map(async (asset) => ({
      ...asset,
      rawImageUrl: asset.imageUrl,
      imageUrl: await signAssetImageUrl(asset.imageUrl),
    }))
  );

  return {
    ...project,
    assets: signedAssets,
  };
}

export async function createProject(rawData: unknown) {
  const userId = await getAuthUserId();
  const validated = createProjectSchema.parse(rawData);

  const project = await prisma.project.create({
    data: {
      name: validated.name,
      description: validated.description || null,
      userId,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/projects');
  return project;
}

export async function updateProject(id: string, rawData: unknown) {
  const userId = await getAuthUserId();
  const project = await prisma.project.findUnique({ where: { id } });

  if (!project || project.userId !== userId) {
    throw new Error('No autorizado');
  }

  const validated = updateProjectSchema.parse(rawData);

  const updatedProject = await prisma.project.update({
    where: { id },
    data: {
      name: validated.name,
      description: validated.description || null,
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/projects');
  revalidatePath(`/projects/${id}`);
  return updatedProject;
}

export async function getProjectPdfData(projectId: string) {
  const userId = await getAuthUserId();
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      assets: {
        include: {
          events: {
            orderBy: { timestamp: 'desc' },
          },
          rightsRecord: true,
          sustainabilityRecord: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!project || project.userId !== userId) {
    throw new Error('Proyecto no encontrado o no autorizado');
  }

  const signedAssets = await Promise.all(
    project.assets.map(async (asset) => ({
      ...asset,
      rawImageUrl: asset.imageUrl,
      imageUrl: await signAssetImageUrl(asset.imageUrl),
    }))
  );

  return JSON.parse(
    JSON.stringify({
      ...project,
      assets: signedAssets,
    })
  );
}

