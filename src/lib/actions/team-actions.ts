'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ProjectRole } from '@prisma/client';

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

export async function addProjectMember(projectId: string, email: string, role: ProjectRole) {
  const ownerId = await getAuthUserId();
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project || project.userId !== ownerId) {
    throw new Error('Proyecto no encontrado o no autorizado');
  }

  let targetUser = await prisma.user.findUnique({
    where: { email }
  });

  if (!targetUser) {
    const mockId = crypto.randomUUID();
    targetUser = await prisma.user.create({
      data: {
        id: mockId,
        email,
        name: email.split('@')[0],
      }
    });
  }

  const member = await prisma.projectMember.upsert({
    where: {
      projectId_userId: {
        projectId,
        userId: targetUser.id
      }
    },
    update: {
      role
    },
    create: {
      projectId,
      userId: targetUser.id,
      role
    }
  });

  revalidatePath(`/projects/${projectId}`);
  return member;
}

export async function removeProjectMember(projectId: string, memberId: string) {
  const ownerId = await getAuthUserId();
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project || project.userId !== ownerId) {
    throw new Error('Proyecto no encontrado o no autorizado');
  }

  await prisma.projectMember.delete({
    where: { id: memberId }
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function getProjectMembers(projectId: string) {
  return prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: true
    }
  });
}
