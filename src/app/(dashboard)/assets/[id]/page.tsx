import { getAssetById } from '@/lib/actions/asset-actions';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { LifecycleStepper } from '@/components/assets/lifecycle-stepper';
import { LifecycleHistory } from '@/components/assets/lifecycle-history';
import { RightsRecordForm } from '@/components/assets/rights-record-form';
import { SustainabilityRecordForm } from '@/components/assets/sustainability-record-form';
import { PdfDownloadButton } from '@/components/pdf/pdf-download-button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Calendar, FolderKanban } from 'lucide-react';

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
          href="/assets"
          className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" /> Volver a Assets
        </Link>
        <PdfDownloadButton asset={asset} />
      </div>

      {/* Asset Header Card */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative h-48 w-full md:w-56 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
              {asset.imageUrl ? (
                <Image src={asset.imageUrl} alt={asset.title} fill className="object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-slate-400 font-bold">
                  TRACE
                </div>
              )}
            </div>

            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  {asset.status}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <FolderKanban className="h-3.5 w-3.5" /> {asset.project.name}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-slate-900">{asset.title}</h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                {asset.description || 'Sin descripción ingresada.'}
              </p>

              <div className="text-xs text-slate-400 flex items-center gap-1 pt-2">
                <Calendar className="h-3.5 w-3.5" /> Registrado el{' '}
                {new Date(asset.createdAt).toLocaleDateString('es-AR')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lifecycle Transition Stepper */}
      <LifecycleStepper assetId={asset.id} currentStatus={asset.status} />

      {/* Grid: Forms & History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <RightsRecordForm assetId={asset.id} initialData={asset.rightsRecord} />
          <SustainabilityRecordForm assetId={asset.id} initialData={asset.sustainabilityRecord} />
        </div>

        <div className="space-y-6">
          <LifecycleHistory events={asset.events} />
        </div>
      </div>
    </div>
  );
}
