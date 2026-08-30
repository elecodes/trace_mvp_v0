'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/components/ui/button';
import { LayoutDashboard, Box, FolderKanban, ShieldCheck, Leaf, FileText } from 'lucide-react';
import Image from 'next/image';

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
        <div className="flex items-center">
          <Image src="/Trace.png" width={36} height={36} alt="TRACE logo" className="h-6 w-6 mr-2" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-wider">TRACE</h1>
          <p className="text-xs text-slate-400 font-medium">Asset Lifecycle MVP</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-6">
        <div>
          <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Control de Impacto
          </div>
          <Link
            href="/dashboard"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              pathname === '/dashboard'
                ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            )}
          >
            <LayoutDashboard className={cn('h-5 w-5', pathname === '/dashboard' ? 'text-emerald-400' : 'text-slate-400')} />
            Dashboard
          </Link>
        </div>

        <div>
          <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Producción Física
          </div>
          <div className="space-y-1">
            <Link
              href="/projects"
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith('/projects')
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              )}
            >
              <FolderKanban className={cn('h-5 w-5', pathname.startsWith('/projects') ? 'text-emerald-400' : 'text-slate-400')} />
              Proyectos
            </Link>
            <Link
              href="/assets"
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                pathname.startsWith('/assets')
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              )}
            >
              <Box className={cn('h-5 w-5', pathname.startsWith('/assets') ? 'text-emerald-400' : 'text-slate-400')} />
              Assets / Catálogo
            </Link>

          </div>
        </div>
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
