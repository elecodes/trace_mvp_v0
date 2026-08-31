import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function getOrCreateCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !supabaseUser) {
    return null;
  }

  // Buscar el usuario por su ID de Supabase en Prisma
  let user = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
  });

  if (!user) {
    // Si no se encuentra por ID, buscar si fue invitado previamente por su email
    const existingMockUser = await prisma.user.findUnique({
      where: { email: supabaseUser.email! },
    });

    if (existingMockUser) {
      // Sincronizar: actualizar el id del usuario mock al id real de Supabase
      user = await prisma.user.update({
        where: { email: supabaseUser.email! },
        data: {
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.name || existingMockUser.name,
        },
      });
    } else {
      // Crear nuevo registro si no existía invitación previa
      user = await prisma.user.create({
        data: {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          name: supabaseUser.user_metadata?.name || null,
        },
      });
    }
  }

  return user;
}
