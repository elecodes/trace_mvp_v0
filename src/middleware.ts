'use client';
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

/**
 * Verify that the current user is a member of the specified project.
 * Throws if not authenticated or not authorized.
 */
export async function checkProjectMembership(projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('No estás autenticado');
  }
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== user.id) {
    throw new Error('Proyecto no encontrado o no autorizado');
  }
  return project;
}
