'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { ProjectRole } from '@prisma/client';
import {
  getAuthUserId,
  requireProjectMember,
  canManageTeam
} from '@/lib/permissions';

export async function addProjectMember(projectId: string, email: string, role: ProjectRole) {
  const { role: userRole } = await requireProjectMember(projectId);
  
  if (!canManageTeam(userRole)) {
    throw new Error('No autorizado para gestionar el equipo');
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
  const { role: userRole } = await requireProjectMember(projectId);

  if (!canManageTeam(userRole)) {
    throw new Error('No autorizado para gestionar el equipo');
  }

  await prisma.projectMember.delete({
    where: { id: memberId }
  });

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function getProjectMembers(projectId: string) {
  await requireProjectMember(projectId);
  
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: true
    }
  });

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true, createdAt: true, updatedAt: true }
  });

  if (!project) return members;

  const owner = await prisma.user.findUnique({
    where: { id: project.userId }
  });

  const memberList = [...members];
  if (owner && !members.some(m => m.userId === owner.id)) {
    memberList.unshift({
      id: `owner-${owner.id}`,
      projectId,
      userId: owner.id,
      role: 'PRODUCER' as ProjectRole,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      user: owner
    });
  }

  return memberList;
}
