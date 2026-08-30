import { getProjectById, getProjectPdfData } from '@/lib/actions/project-actions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, ArrowLeft, ArrowUpRight, FolderKanban } from 'lucide-react';
import { ProjectPdfDownloadButton } from '@/components/pdf/project-pdf-download-button';
import { DeleteProjectButton } from '@/components/projects/delete-project-button';

const STAGE_VARIANTS: Record<string, 'info' | 'warning' | 'success' | 'secondary'> = {
  DESIGN: 'info',
  PRODUCTION: 'warning',
  SHOOTING: 'success',
  FINAL_DESTINATION: 'secondary',
};

const STAGE_LABELS: Record<string, string> = {
  DESIGN: 'Diseño',
  PRODUCTION: 'Producción',
  SHOOTING: 'Rodaje',
  FINAL_DESTINATION: 'Destino Final',
};

const CATEGORY_LABELS: Record<string, string> = {
  GENERIC: 'Genérico',
  TYPOGRAPHY: 'Tipografía',
  FURNITURE: 'Mobiliario',
  PROPS: 'Utilería',
  WARDROBE: 'Vestuario',
  EQUIPMENT: 'Equipamiento',
};

interface ProjectDetailPageProps {
  params: { projectId: string };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const project = await getProjectById(params.projectId);

  if (!project) {
    notFound();
  }

  const pdfProjectData = await getProjectPdfData(params.projectId);

  return (
    <div className="space-y-6">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <ProjectPdfDownloadButton project={pdfProjectData} />
          <DeleteProjectButton projectId={project.id} />
          <Link href={`/projects/${project.id}/assets/new`}>
            <Button className="bg-emerald-600 hover:bg-emerald-700 font-semibold gap-2 cursor-pointer">
              <Plus className="h-4 w-4" /> Nuevo Asset
            </Button>
          </Link>
        </div>
      </div>

      {/* Project Info Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <FolderKanban className="h-4 w-4 text-emerald-600" /> Proyecto
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
          <p className="text-sm text-slate-500">
            {project.description || 'Sin descripción ingresada.'}
          </p>
        </div>
        <div className="text-xs text-slate-400">
          Registrado el {new Date(project.createdAt).toLocaleDateString('es-AR')}
        </div>
      </div>

      {/* Assets Listing */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Assets del Proyecto ({project.assets.length})</h2>

        {project.assets.length === 0 ? (
          <Card className="border-dashed border-slate-300 p-12 text-center bg-white">
            <CardContent className="space-y-3">
              <p className="text-slate-500 text-sm">Este proyecto no tiene assets todavía.</p>
              <Link href={`/projects/${project.id}/assets/new`}>
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  Crear primer Asset del Proyecto
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {project.assets.map((asset) => (
              <Card
                key={asset.id}
                className="border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-white flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 w-full bg-slate-100 border-b border-slate-200">
                    {asset.imageUrl ? (
                      (asset.rawImageUrl?.startsWith('http://') || asset.rawImageUrl?.startsWith('https://')) ? (
                        <img src={asset.imageUrl} alt={asset.title} className="object-cover h-full w-full" />
                      ) : (
                        <Image src={asset.imageUrl} alt={asset.title} fill className="object-cover" />
                      )
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-300 font-bold text-2xl">
                        TRACE
                      </div>
                    )}
                    <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                      <Badge variant={STAGE_VARIANTS[asset.currentStage] || 'default'}>
                        {STAGE_LABELS[asset.currentStage] || asset.currentStage}
                      </Badge>
                      {asset.category && asset.category !== 'GENERIC' && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold text-[10px] px-2 py-0.5">
                          {CATEGORY_LABELS[asset.category] || asset.category}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{asset.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {asset.description || 'Sin descripción ingresada.'}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                  <Link href={`/assets/${asset.id}`}>
                    <Button variant="outline" size="sm" className="gap-1 text-xs cursor-pointer">
                      Ver Detalles <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
