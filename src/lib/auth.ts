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
    // Sincronizar: crear el registro en la base de datos de Prisma
    user = await prisma.user.create({
      data: {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        name: supabaseUser.user_metadata?.name || null,
      },
    });
  }

  return user;
}
