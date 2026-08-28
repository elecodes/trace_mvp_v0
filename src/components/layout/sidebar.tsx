'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/components/ui/button';
import { LayoutDashboard, Box, FolderKanban, ShieldCheck, Leaf } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Assets', href: '/assets', icon: Box },
  { name: 'Proyectos', href: '/projects', icon: FolderKanban },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 min-h-screen flex flex-col border-r border-slate-800">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="h-9 w-9 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-wider">TRACE</h1>
          <p className="text-xs text-slate-400 font-medium">Asset Lifecycle MVP</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive ? 'text-emerald-400' : 'text-slate-400')} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 m-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
          <Leaf className="h-4 w-4" /> TRACE Standard
        </div>
        Seguimiento de huella CO₂eq y licencias de derechos verificados.
      </div>
    </aside>
  );
}
