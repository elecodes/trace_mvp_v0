'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Layers } from 'lucide-react';

interface StatusChartProps {
  statusCounts: { status: string; count: number }[];
}

const STATUS_LABELS: Record<string, string> = {
  CONCEPT: 'Concepción',
  PRODUCTION: 'Producción',
  IN_USE: 'En Uso',
  END_OF_LIFE: 'Fin de Vida',
};

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#64748b'];

export function StatusChart({ statusCounts }: StatusChartProps) {
  const data = statusCounts.map((sc) => ({
    name: STATUS_LABELS[sc.status] || sc.status,
    value: sc.count,
  }));

  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardHeader>
        <CardTitle className="text-md font-semibold flex items-center gap-2">
          <Layers className="h-5 w-5 text-blue-600" /> Distribución por Ciclo de Vida
        </CardTitle>
        <CardDescription>Proporción de assets en cada etapa del pipeline</CardDescription>
      </CardHeader>
      <CardContent className="h-72 pt-2">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
            Crea tu primer asset para ver la distribución por ciclo de vida.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '8px',
                  color: '#fff',
                  border: 'none',
                  fontSize: '12px',
                }}
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
