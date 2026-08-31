import { getProjectById, getProjectPdfData } from '@/lib/actions/project-actions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, ArrowLeft, ArrowUpRight, FolderKanban, Sparkles, ShieldCheck, Leaf, Layers } from 'lucide-react';
import { ProjectPdfDownloadButton } from '@/components/pdf/project-pdf-download-button';
import { DeleteProjectButton } from '@/components/projects/delete-project-button';
import { ProjectSets } from '@/components/projects/project-sets';
import { ProjectTeam } from '@/components/projects/project-team';
import { ProjectHeader } from '@/components/projects/project-header';

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

  // Compute stats
  const totalCo2eq = project.assets.reduce((sum, asset) => {
    const rec = asset.sustainabilityRecord;
    if (!rec) return sum;
    const co2 = rec.estimatedCo2eqKg ?? ((rec.weightKg || 0) * (rec.emissionFactor || 0));
    return sum + co2;
  }, 0);

  const documentedAssets = project.assets.filter(a => a.rightsRecord && a.rightsRecord.licenseType !== 'UNKNOWN').length;
  const legalCoverage = project.assets.length > 0 ? Math.round((documentedAssets / project.assets.length) * 100) : 0;

  const reusableAssets = project.assets.filter(a => a.sustainabilityRecord && a.sustainabilityRecord.circularityOutcome !== 'DISCARDED').length;
  const circularityRate = project.assets.length > 0 ? Math.round((reusableAssets / project.assets.length) * 100) : 0;

  const userRole = project.currentUserRole;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
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
          {userRole === 'PRODUCER' && <DeleteProjectButton projectId={project.id} />}
          {(userRole === 'PRODUCER' || userRole === 'ART') && (
            <Link href={`/projects/${project.id}/assets/new`}>
              <Button className="bg-emerald-600 hover:bg-emerald-700 font-semibold gap-2 cursor-pointer text-white">
                <Plus className="h-4 w-4" /> Nuevo Asset
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Project Info Header */}
      <ProjectHeader project={project} userRole={userRole} />

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Impacto Carbono</span>
            <Leaf className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{totalCo2eq.toFixed(1)} kg</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Huella total estimada de CO₂eq</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verificación Legal</span>
            <ShieldCheck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{legalCoverage}%</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Assets con licencias documentadas</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tasa Circularidad</span>
            <Sparkles className="h-4 w-4 text-amber-600 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-800">{circularityRate}%</div>
            <p className="text-[10px] text-slate-400 mt-0.5">Assets destinados a reutilización/reciclaje</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Assets list */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FolderKanban className="h-5 w-5 text-slate-500" /> Assets de la Producción ({project.assets.length})
            </h2>
          </div>

          {project.assets.length === 0 ? (
            <Card className="border-dashed border-slate-300 p-12 text-center bg-white">
              <CardContent className="space-y-3">
                <p className="text-slate-500 text-sm">Este proyecto no tiene assets todavía.</p>
                {(userRole === 'PRODUCER' || userRole === 'ART') && (
                  <Link href={`/projects/${project.id}/assets/new`}>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer">
                      Crear primer Asset del Proyecto
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.assets.map((asset) => (
                <Card
                  key={asset.id}
                  className="border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-white flex flex-col justify-between"
                >
                  <div>
                    <div className="relative h-36 w-full bg-slate-100 border-b border-slate-200">
                      {asset.imageUrl ? (
                        (asset.rawImageUrl?.startsWith('http://') || asset.rawImageUrl?.startsWith('https://')) ? (
                          <img src={asset.imageUrl} alt={asset.title} className="object-cover h-full w-full" />
                        ) : (
                          <Image src={asset.imageUrl} alt={asset.title} fill className="object-cover" />
                        )
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-300 font-bold text-xl">
                          TRACE
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                        <Badge variant={STAGE_VARIANTS[asset.currentStage] || 'default'} className="text-[9px] px-2 py-0.2">
                          {STAGE_LABELS[asset.currentStage] || asset.currentStage}
                        </Badge>
                        {asset.category && asset.category !== 'GENERIC' && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold text-[8px] px-1.5 py-0.2">
                            {CATEGORY_LABELS[asset.category] || asset.category}
                          </Badge>
                        )}
                        {asset.set && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold text-[8px] px-1.5 py-0.2 flex items-center gap-0.5">
                            <Layers className="h-2.5 w-2.5 text-emerald-600" /> {asset.set.name}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="font-bold text-sm text-slate-800 line-clamp-1">{asset.title}</h3>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                        {asset.description || 'Sin descripción ingresada.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <Link href={`/assets/${asset.id}`}>
                      <Button variant="outline" size="sm" className="gap-1 h-7 text-[10px] cursor-pointer font-semibold">
                        Ver Ficha <ArrowUpRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar: Sets & Team Management */}
        <div className="space-y-6">
          <ProjectSets projectId={project.id} sets={project.sets} userRole={userRole} />
          <ProjectTeam projectId={project.id} members={project.members} userRole={userRole} />
        </div>
      </div>
    </div>
  );
}
