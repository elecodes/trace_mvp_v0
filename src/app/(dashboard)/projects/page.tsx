import { getProjects } from '@/lib/actions/asset-actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FolderKanban, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Proyectos</h1>
        <p className="text-sm text-slate-500">
          Organización de assets por proyecto o categoría de negocio.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`} className="block group">
            <Card className="border-slate-200 shadow-sm bg-white hover:border-emerald-500 hover:shadow-md transition-all h-full flex flex-col justify-between cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="text-md font-bold flex items-center justify-between text-slate-900 group-hover:text-emerald-600 transition-colors">
                  <span className="flex items-center gap-2">
                    <FolderKanban className="h-5 w-5 text-emerald-600" /> {project.name}
                  </span>
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600" />
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 line-clamp-2">
                  {project.description || 'Sin descripción'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-slate-400 flex items-center gap-1 mt-2">
                  <Calendar className="h-3.5 w-3.5" /> Creado el{' '}
                  {new Date(project.createdAt).toLocaleDateString('es-AR')}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
