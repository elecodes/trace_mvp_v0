'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

interface HeaderProps {
  userEmail?: string | null;
}

export function Header({ userEmail }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-slate-500">Espacio de trabajo</span>
      </div>

      <div className="flex items-center gap-4">
        {userEmail && (
          <div className="flex items-center gap-2 text-sm text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full">
            <User className="h-4 w-4 text-slate-500" />
            <span className="font-medium">{userEmail}</span>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-600 hover:text-red-600">
          <LogOut className="h-4 w-4 mr-1.5" /> Salir
        </Button>
      </div>
    </header>
  );
}
