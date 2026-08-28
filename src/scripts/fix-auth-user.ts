import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

const prisma = new PrismaClient();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const userId = '00000000-0000-0000-0000-000000000001';
  const identityId = '00000000-0000-0000-0000-000000000002';
  const email = 'admin@trace.com';
  const password = 'trace123';

  console.log('Limpiando usuario anterior...');
  await prisma.$executeRawUnsafe(`DELETE FROM auth.identities WHERE user_id = '${userId}';`);
  await prisma.$executeRawUnsafe(`DELETE FROM auth.users WHERE email = '${email}';`);
  await prisma.user.deleteMany({ where: { email } });

  console.log('Creando usuario en auth.users y auth.identities...');
  await prisma.$executeRawUnsafe(`
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      '${userId}',
      'authenticated',
      'authenticated',
      '${email}',
      crypt('${password}', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"trace"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
  `);

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

  await prisma.user.create({
    data: {
      id: userId,
      email,
      name: 'trace',
    },
  });

  console.log('Probando signInWithPassword a nivel de API...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('❌ Error signInWithPassword:', error.message);
  } else {
    console.log('✅ LOGIN EXITOSO EN SUPABASE AUTH! Sesión creada para:', data.user.email);
  }
}

main().finally(() => prisma.$disconnect());
