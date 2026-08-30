import { getAssets } from '@/lib/actions/asset-actions';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, ShieldCheck, Leaf, ArrowUpRight } from 'lucide-react';

const STATUS_VARIANTS: Record<string, 'info' | 'warning' | 'success' | 'secondary'> = {
  DESIGN: 'info',
  PRODUCTION: 'warning',
  SHOOTING: 'success',
  FINAL_DESTINATION: 'secondary',
};

const CATEGORY_LABELS: Record<string, string> = {
  GENERIC: 'Genérico',
  TYPOGRAPHY: 'Tipografía',
  FURNITURE: 'Mobiliario',
  PROPS: 'Utilería',
  WARDROBE: 'Vestuario',
  EQUIPMENT: 'Equipamiento',
};

export default async function AssetsPage() {
  const assets = await getAssets();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gestión de Assets</h1>
          <p className="text-sm text-slate-500">
            Catálogo unificado con ciclo de vida, derechos y sustentabilidad.
          </p>
        </div>
        <Link href="/assets/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700 font-semibold gap-2">
            <Plus className="h-4 w-4" /> Nuevo Asset
          </Button>
        </Link>
      </div>

      {assets.length === 0 ? (
        <Card className="border-dashed border-slate-300 p-12 text-center bg-white">
          <CardContent className="space-y-3">
            <p className="text-slate-500 text-sm">No tenés assets registrados todavía.</p>
            <Link href="/assets/new">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Crear primer Asset
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => (
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
                    <Badge variant={STATUS_VARIANTS[asset.currentStage] || 'default'}>
                      {asset.currentStage}
                    </Badge>
                    {asset.category && asset.category !== 'GENERIC' && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold text-[10px] px-2 py-0.5">
                        {CATEGORY_LABELS[asset.category] || asset.category}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{asset.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {asset.description || 'Sin descripción ingresada'}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Leaf className="h-3.5 w-3.5 text-emerald-600" />
                      {asset.sustainabilityRecord?.estimatedCo2eqKg !== null && asset.sustainabilityRecord?.estimatedCo2eqKg !== undefined
                        ? `${asset.sustainabilityRecord.estimatedCo2eqKg} kg CO₂`
                        : 'Sin CO₂'}
                    </span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                      {asset.rightsRecord ? 'Derechos OK' : 'Sin Derechos'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <Link href={`/assets/${asset.id}`}>
                  <Button variant="outline" size="sm" className="gap-1 text-xs">
                    Ver Detalles <ArrowUpRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
