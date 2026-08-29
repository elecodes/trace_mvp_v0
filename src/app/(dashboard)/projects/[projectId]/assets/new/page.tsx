import { getProjectById } from '@/lib/actions/project-actions';
import { notFound } from 'next/navigation';
import { ProjectAssetForm } from './project-asset-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, Box } from 'lucide-react';

interface NewProjectAssetPageProps {
  params: { projectId: string };
}

export default async function NewProjectAssetPage({ params }: NewProjectAssetPageProps) {
  const project = await getProjectById(params.projectId);

  if (!project) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link
          href={`/projects/${project.id}`}
          className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1.5 mb-2"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al Proyecto
        </Link>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Box className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Crear Nuevo Asset</h1>
            <p className="text-sm text-slate-500">
              Registrá un nuevo activo para el proyecto <span className="font-semibold text-slate-700">&ldquo;{project.name}&rdquo;</span>.
            </p>
          </div>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader>
          <CardTitle className="text-lg">Formulario de Asset</CardTitle>
          <CardDescription>
            Cargá los datos primarios y adjuntá su foto (puedes subirla o usar una URL manual).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProjectAssetForm projectId={project.id} />
        </CardContent>
      </Card>
    </div>
  );
}
