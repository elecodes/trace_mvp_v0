import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const emails = ['admin@trace.com', 'admin@example.com'];
  const password = 'trace123'; // Supabase requiere minimo 6 caracteres
  const name = 'trace';

  for (const email of emails) {
    console.log(`Registrando usuario ${email}...`);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (error) {
      console.error(`Resultado ${email}:`, error.message);
    } else {
      console.log(`✅ Usuario ${email} registrado exitosamente en Supabase Auth!`);
    }
  }
}

main();
