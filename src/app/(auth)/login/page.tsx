'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    // Existing email/password login
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
      router.refresh();
    }
  };

  // Guest login handler
  const handleGuestLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      setError(error.message);
    } else {
      router.push('/dashboard');
    }
    setLoading(false);
  };

  // Demo user login handler
  const handleDemoLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: 'guest@example.com',
      password: 'password123',
    });
    if (error) {
      setError(error.message);
    } else {
      router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md shadow-lg border-slate-200">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-md">
              <ShieldCheck className="h-7 w-7 text-emerald-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">TRACE</CardTitle>
          <CardDescription>
            Ingresá a tu cuenta para gestionar el ciclo de vida de tus assets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
            {/* Anonymous Guest Login */}
            <Button
              type="button"
              className="w-full mt-2"
              onClick={handleGuestLogin}
              disabled={loading}
            >
              {loading ? (
                <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ingresando como invitado...</>
              ) : (
                'Ingresar como invitado'
              )}
            </Button>


            {/* Demo User Login */}
            <Button
              type="button"
              className="w-full mt-2"
              onClick={handleDemoLogin}
              disabled={loading}
            >
              {loading ? (
                <> <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ingresando demo... </>
              ) : (
                'Login as demo user'
              )}
            </Button>


          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4 text-sm text-muted-foreground">
          ¿No tenés cuenta?{' '}
          <Link href="/register" className="ml-1 text-slate-900 font-semibold hover:underline">
            Registrate acá
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
