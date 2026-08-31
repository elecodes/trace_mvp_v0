import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { ProjectRole } from '@prisma/client';

export async function getAuthUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('No estás autenticado');
  }
  return user.id;
}

export async function getProjectMemberRole(projectId: string, userId: string): Promise<ProjectRole | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { userId: true }
  });
  if (!project) return null;
  if (project.userId === userId) return 'PRODUCER';
  
  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId,
        userId,
      }
    },
    select: { role: true }
  });
  return member?.role || null;
}

export async function requireProjectMember(projectId: string): Promise<{ projectId: string; role: ProjectRole; userId: string }> {
  const userId = await getAuthUserId();
  const role = await getProjectMemberRole(projectId, userId);
  if (!role) {
    throw new Error('No tenés acceso a este proyecto o no eres miembro');
  }
  return { projectId, role, userId };
}

export async function requireAssetProjectMember(assetId: string): Promise<{ asset: any; projectId: string; role: ProjectRole; userId: string }> {
  const userId = await getAuthUserId();
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    include: { project: true }
  });
  if (!asset) {
    throw new Error('Asset no encontrado');
  }
  const role = await getProjectMemberRole(asset.projectId, userId);
  if (!role) {
    throw new Error('No tenés acceso a este proyecto o no eres miembro');
  }
  return { asset, projectId: asset.projectId, role, userId };
}

export async function requireSetProjectMember(setId: string): Promise<{ set: any; projectId: string; role: ProjectRole; userId: string }> {
  const userId = await getAuthUserId();
  const set = await prisma.set.findUnique({
    where: { id: setId },
    include: { project: true }
  });
  if (!set) {
    throw new Error('Set no encontrado');
  }
  const role = await getProjectMemberRole(set.projectId, userId);
  if (!role) {
    throw new Error('No tenés acceso a este proyecto o no eres miembro');
  }
  return { set, projectId: set.projectId, role, userId };
}

// Helpers for permission checks
export function canManageProject(role: ProjectRole): boolean {
  return role === 'PRODUCER';
}

export function canManageTeam(role: ProjectRole): boolean {
  return role === 'PRODUCER';
}

export function canManageAssets(role: ProjectRole): boolean {
  return role === 'PRODUCER' || role === 'ART';
}

export function canManageSets(role: ProjectRole): boolean {
  return role === 'PRODUCER' || role === 'ART';
}

export function canManageRights(role: ProjectRole): boolean {
  return role === 'PRODUCER' || role === 'LEGAL';
}

export function canManageSustainability(role: ProjectRole): boolean {
  return role === 'PRODUCER' || role === 'ART';
}

export function canManageShooting(role: ProjectRole): boolean {
  return role === 'PRODUCER' || role === 'ART';
}
