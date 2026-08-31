import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function seedUser(email: string, name: string) {
  const password = 'password123';
  console.log(`Sembrando usuario ${email}...`);

  try {
    // 1. Check if user already exists in public.users (invited member mock user)
    let publicUser = await prisma.user.findUnique({
      where: { email }
    });

    let userId = publicUser?.id || crypto.randomUUID();

    // 2. Check if user already exists in auth.users
    const existingAuth: any[] = await prisma.$queryRawUnsafe(
      `SELECT id FROM auth.users WHERE email = $1`,
      email
    );

    if (existingAuth.length > 0) {
      console.log(`Usuario de Auth para ${email} ya existe en auth.users con ID:`, existingAuth[0].id);
      
      // If public user has a different ID, sync it to match the existing auth ID
      if (publicUser && publicUser.id !== existingAuth[0].id) {
        console.log(`Sincronizando ID en la tabla pública para ${email} a ${existingAuth[0].id}`);
        await prisma.user.update({
          where: { email },
          data: { id: existingAuth[0].id }
        });
      }
      return;
    }

        // 3. Insert directly into auth.users (bypassing GoTrue/verification filters)
    console.log(`Creando registro en auth.users para ${email} con ID: ${userId}`);
    await prisma.$executeRawUnsafe(`
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new, email_change
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        '${userId}',
        'authenticated',
        'authenticated',
        '${email}',
        crypt('${password}', gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"name":"${name}"}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
      );
    `);

    // 4. Also insert identity to ensure login compatibility
    const identityId = crypto.randomUUID();
    await prisma.$executeRawUnsafe(`
      INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
      ) VALUES (
        '${identityId}',
        '${userId}',
        '${userId}',
        json_build_object('sub', '${userId}', 'email', '${email}'),
        'email',
        NOW(),
        NOW(),
        NOW()
      );
    `);

    // 5. Upsert into public.users
    await prisma.user.upsert({
      where: { id: userId },
      update: { email, name },
      create: {
        id: userId,
        email,
        name,
      }
    });

    console.log(`✅ Usuario ${email} sembrado exitosamente en Supabase Auth y base de datos local!`);
    console.log(`   Credenciales: Email: ${email} | Password: ${password}\n`);
  } catch (err: any) {
    console.error(`❌ Error al sembrar usuario ${email}:`, err.message);
  }
}

async function main() {
  await seedUser('art@example.com', 'Carlos (Art)');
  await seedUser('legal@example.com', 'Laura (Legal)');
}

main()
  .catch((err) => {
    console.error('Error general:', err);
  })
  .finally(() => prisma.$disconnect());
