import { getProjects } from '@/lib/actions/asset-actions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FolderKanban, Calendar } from 'lucide-react';

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
          <Card key={project.id} className="border-slate-200 shadow-sm bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-md font-bold flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-emerald-600" /> {project.name}
              </CardTitle>
              <CardDescription className="text-xs">
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
        ))}
      </div>
    </div>
  );
}
