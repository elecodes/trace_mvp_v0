import { getOrCreateCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserProjects } from '@/lib/actions/project-actions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderKanban, Plus, ArrowRight, Box } from 'lucide-react';

export default async function DashboardPage() {
  const user = await getOrCreateCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const projects = await getUserProjects();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Panel de Control TRACE
          </h1>
          <p className="text-sm text-slate-500">
            Hola, <span className="font-semibold text-slate-700">{user.name || user.email}</span>. Gestioná tus proyectos y assets.
          </p>
        </div>
        <Link href="/projects/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700 font-semibold gap-2 shadow-sm cursor-pointer">
            <Plus className="h-4 w-4" /> Nuevo Proyecto
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <Card className="col-span-full border-dashed border-slate-300 p-12 text-center bg-white">
            <CardContent className="space-y-3">
              <FolderKanban className="h-10 w-10 text-slate-400 mx-auto" />
              <p className="text-slate-500 text-sm">No tenés proyectos creados todavía.</p>
              <Link href="/projects/new">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Crear tu primer Proyecto
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id} className="border-slate-200 shadow-sm bg-white flex flex-col justify-between">
              <CardHeader className="pb-2">
                <CardTitle className="text-md font-bold flex items-center gap-2 text-slate-900">
                  <FolderKanban className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span className="line-clamp-1">{project.name}</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 line-clamp-2 h-8">
                  {project.description || 'Sin descripción'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <Box className="h-3.5 w-3.5 text-slate-400" />
                  {project._count.assets} {project._count.assets === 1 ? 'asset' : 'assets'}
                </span>
                <Link href={`/projects/${project.id}`}>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs text-emerald-600 font-semibold cursor-pointer">
                    Abrir <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
