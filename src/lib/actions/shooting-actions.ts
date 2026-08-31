'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import {
  requireAssetProjectMember,
  canManageShooting
} from '@/lib/permissions';

export async function upsertShootingRecord(assetId: string, data: { usedInShooting: boolean; visibleOnCamera: boolean; notes?: string | null }) {
  const { role } = await requireAssetProjectMember(assetId);

  if (!canManageShooting(role)) {
    throw new Error('No autorizado para modificar registros de rodaje');
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
