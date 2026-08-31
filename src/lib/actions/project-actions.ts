'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import * as z from 'zod';
import {
  getAuthUserId,
  getProjectMemberRole,
  requireProjectMember,
  canManageProject
} from '@/lib/permissions';
import { signAssetImageUrl } from './asset-actions';

const createProjectSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
});

export async function getUserProjects() {
  const userId = await getAuthUserId();
  return prisma.project.findMany({
    where: {
      OR: [
        { userId },
        {
          members: {
            some: { userId }
          }
        }
      ]
    },
    include: {
      _count: {
        select: { assets: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getProjectById(id: string) {
  const userId = await getAuthUserId();
  const role = await getProjectMemberRole(id, userId);

  if (!role) {
    return null;
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      sets: {
        include: {
          _count: {
            select: { assets: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      },
      members: {
        include: {
          user: true
        }
      },
      assets: {
        include: {
          rightsRecord: true,
          sustainabilityRecord: true,
          set: true
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!project) {
    return null;
  }

  // Prepend owner if not already in members
  const owner = await prisma.user.findUnique({
    where: { id: project.userId }
  });

  const memberList = [...project.members];
  if (owner && !project.members.some(m => m.userId === owner.id)) {
    memberList.unshift({
      id: `owner-${owner.id}`,
      projectId: project.id,
      userId: owner.id,
      role: 'PRODUCER',
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      user: owner
    });
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
    members: memberList,
    currentUserRole: role,
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
  const { role } = await requireProjectMember(id);
  if (!canManageProject(role)) {
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

export async function deleteProject(id: string) {
  const { role } = await requireProjectMember(id);
  if (!canManageProject(role)) {
    throw new Error('Proyecto no encontrado o no autorizado');
  }

  await prisma.project.delete({
    where: { id }
  });

  revalidatePath('/dashboard');
  revalidatePath('/projects');
  return { success: true };
}

export async function getProjectPdfData(projectId: string) {
  await requireProjectMember(projectId);
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
          set: true,
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!project) {
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
