import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userId = '00000000-0000-0000-0000-000000000001';
  const email = 'admin@trace.com';
  const name = 'trace';

  try {
    // Check if user exists in auth.users
    const existingAuth: any[] = await prisma.$queryRaw`SELECT id FROM auth.users WHERE email = ${email}`;

    let authId = userId;
    if (existingAuth.length > 0) {
      authId = existingAuth[0].id;
      console.log('Usuario de Auth ya existe con ID:', authId);
    } else {
      // Insert into auth.users directly in Postgres
      console.log('Insertando usuario directamente en auth.users de Supabase...');
      await prisma.$executeRawUnsafe(`
        INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000000',
          '${userId}',
          'authenticated',
          'authenticated',
          '${email}',
          crypt('trace123', gen_salt('bf')),
          NOW(),
          '{"provider":"email","providers":["email"]}',
          '{"name":"${name}"}',
          NOW(),
          NOW()
        );
      `);
      console.log('✅ Usuario creado directamente en auth.users!');
    }

    // Upsert into public.users
    await prisma.user.upsert({
      where: { id: authId },
      update: { email, name },
      create: {
        id: authId,
        email,
        name,
      },
    });

    console.log('✅ Tabla public.users sincronizada exitosamente!');
    console.log('\n--- CREDENCIALES DE ACCESO ---');
    console.log(`Email: ${email}`);
    console.log(`Password: trace123`);
  } catch (err: any) {
    console.error('Error al sembrar usuario SQL:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
