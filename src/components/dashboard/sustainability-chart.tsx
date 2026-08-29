'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Leaf } from 'lucide-react';

interface SustainabilityChartProps {
  assets: {
    id: string;
    title: string;
    sustainabilityRecord?: {
      estimatedCo2eqKg: number | null;
    } | null;
  }[];
}

export function SustainabilityChart({ assets }: SustainabilityChartProps) {
  const data = assets
    .map((asset) => ({
      name: asset.title.length > 12 ? `${asset.title.substring(0, 12)}...` : asset.title,
      co2: asset.sustainabilityRecord?.estimatedCo2eqKg || 0,
    }))
    .filter((d) => d.co2 > 0);

  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardHeader>
        <CardTitle className="text-md font-semibold flex items-center gap-2">
          <Leaf className="h-5 w-5 text-emerald-600" /> Huella de Carbono por Asset (kg CO₂eq)
        </CardTitle>
        <CardDescription>Comparativa de emisiones estimadas entre tus assets</CardDescription>
      </CardHeader>
      <CardContent className="h-72 pt-2">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
            Agregá registros de sustentabilidad a tus assets para ver la comparativa.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} interval={0} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '8px',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="co2" name="kg CO₂eq" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
