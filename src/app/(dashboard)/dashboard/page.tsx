import { getDashboardMetrics } from '@/lib/actions/asset-actions';
import { MetricsCards } from '@/components/dashboard/metrics-cards';
import { SustainabilityChart } from '@/components/dashboard/sustainability-chart';
import { StatusChart } from '@/components/dashboard/status-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, ArrowRight, ShieldCheck, Leaf } from 'lucide-react';
import Image from 'next/image';

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();

  return (
    <div className="space-y-8">
      {/* Header action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Panel de Control TRACE
          </h1>
          <p className="text-sm text-slate-500">
            Resumen global de huella ambiental, licencias y ciclo de vida.
          </p>
        </div>
        <Link href="/assets/new">
          <Button className="bg-emerald-600 hover:bg-emerald-700 font-semibold gap-2 shadow-sm">
            <Plus className="h-4 w-4" /> Crear Nuevo Asset
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <MetricsCards
        totalAssets={metrics.totalAssets}
        totalCarbonFootprintKg={metrics.totalCarbonFootprintKg}
        rightsDocumentedPercentage={metrics.rightsDocumentedPercentage}
      />

      {/* Recharts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatusChart statusCounts={metrics.statusCounts} />
        <SustainabilityChart assets={metrics.recentAssets} />
      </div>

      {/* Recent Assets List */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg font-semibold">Assets Recientes</CardTitle>
          <Link href="/assets" className="text-xs text-emerald-600 font-semibold flex items-center gap-1 hover:underline">
            Ver Todos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {metrics.recentAssets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500 mb-4">No tenés assets creados todavía.</p>
              <Link href="/assets/new">
                <Button variant="outline" size="sm">
                  Crear tu primer Asset
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {metrics.recentAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="py-3 flex items-center justify-between hover:bg-slate-50/50 rounded-lg px-2 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                      {asset.imageUrl ? (
                        <Image src={asset.imageUrl} alt={asset.title} fill className="object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-xs text-slate-400 font-bold">
                          TR
                        </div>
                      )}
                    </div>
                    <div>
                      <Link
                        href={`/assets/${asset.id}`}
                        className="font-medium text-sm text-slate-900 hover:text-emerald-600"
                      >
                        {asset.title}
                      </Link>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">
                          {asset.status}
                        </span>
                        {asset.sustainabilityRecord && (
                          <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <Leaf className="h-3 w-3" /> {asset.sustainabilityRecord.carbonFootprintKg} kg CO₂
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {asset.rightsRecord?.isDocumented ? (
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> Derechos OK
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                        Sin Derechos
                      </span>
                    )}
                    <Link href={`/assets/${asset.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                        Ver Ficha
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
