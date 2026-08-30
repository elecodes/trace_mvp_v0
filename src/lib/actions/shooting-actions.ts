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

export async function upsertShootingRecord(assetId: string, data: { usedInShooting: boolean; visibleOnCamera: boolean; notes?: string | null }) {
  const userId = await getAuthUserId();
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    include: { project: true }
  });

  if (!asset || asset.project.userId !== userId) {
    throw new Error('Asset no encontrado o no autorizado');
  }

  const record = await prisma.shootingRecord.upsert({
    where: { assetId },
    update: {
      usedInShooting: data.usedInShooting,
      visibleOnCamera: data.visibleOnCamera,
      notes: data.notes || null,
    },
    create: {
      assetId,
      usedInShooting: data.usedInShooting,
      visibleOnCamera: data.visibleOnCamera,
      notes: data.notes || null,
    }
  });

  revalidatePath(`/assets/${assetId}`);
  return record;
}
