import { getAssetById } from '@/lib/actions/asset-actions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { LifecycleStepper } from '@/components/assets/lifecycle-stepper';
import { LifecycleHistory } from '@/components/assets/lifecycle-history';
import { RightsRecordForm } from '@/components/assets/rights-record-form';
import { SustainabilityRecordForm } from '@/components/assets/sustainability-record-form';
import { PdfDownloadButton } from '@/components/pdf/pdf-download-button';
import { AssetHeader } from '@/components/assets/asset-header';
import { ArrowLeft } from 'lucide-react';

const STAGE_LABELS: Record<string, string> = {
  DESIGN: 'Diseño',
  PRODUCTION: 'Producción',
  SHOOTING: 'Rodaje',
  FINAL_DESTINATION: 'Destino Final',
};

interface AssetDetailPageProps {
  params: { id: string };
}

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const asset = await getAssetById(params.id);

  if (!asset) {
    notFound();
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/projects/${asset.project.id}`}
          className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" /> Volver al Proyecto
        </Link>
        <PdfDownloadButton asset={asset} />
      </div>

      {/* Asset Header Card (with Inline Editing) */}
      <AssetHeader asset={asset} stageLabels={STAGE_LABELS} />

      {/* Lifecycle Transition Stepper */}
      <LifecycleStepper assetId={asset.id} currentStage={asset.currentStage} />

      {/* Grid: Forms & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RightsRecordForm assetId={asset.id} initialData={asset.rightsRecord as any} />
          <SustainabilityRecordForm assetId={asset.id} initialData={asset.sustainabilityRecord as any} />
        </div>

        <div className="space-y-6">
          <LifecycleHistory events={asset.events} />
        </div>
      </div>
    </div>
  );
}
