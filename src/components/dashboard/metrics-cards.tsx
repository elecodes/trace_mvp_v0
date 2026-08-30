import { Card, CardContent } from '@/components/ui/card';
import { Box, Leaf, ShieldCheck } from 'lucide-react';

interface MetricsCardsProps {
  totalAssets: number;
  totalCarbonFootprintKg: number;
  rightsDocumentedPercentage: number;
}

export function MetricsCards({
  totalAssets,
  totalCarbonFootprintKg,
  rightsDocumentedPercentage,
}: MetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Assets */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total de Assets
            </p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">{totalAssets}</h3>
            <p className="text-xs text-slate-400 mt-1">Registrados en la plataforma</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Box className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>

      {/* CO2eq Total */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Huella Total (CO₂eq)
            </p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">
              {totalCarbonFootprintKg.toLocaleString('es-AR')} <span className="text-sm font-semibold text-slate-500">kg</span>
            </h3>
            <p className="text-xs text-emerald-600 font-medium mt-1">Suma acumulada de impacto</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Leaf className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>

      {/* Rights Documented % */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Derechos Verificados
            </p>
            <h3 className="text-3xl font-bold text-slate-900 mt-1">
              {rightsDocumentedPercentage}%
            </h3>
            <p className="text-xs text-slate-400 mt-1">Assets con RightsRecord activado</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
