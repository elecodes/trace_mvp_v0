'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { upsertSustainabilityRecord } from '@/lib/actions/asset-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Leaf, Loader2, CheckCircle2, Scale, Recycle, CloudDrizzle, Info } from 'lucide-react';

const CIRCULARITY_OUTCOMES = [
  { value: 'PENDING', label: 'Pendiente (En uso o sin destino final definido)' },
  { value: 'REUSED', label: 'Reutilizado (Trasladado a otra producción / almacén)' },
  { value: 'DONATED', label: 'Donado (Entregado a ONG, escuela u otra entidad)' },
  { value: 'RECYCLED', label: 'Reciclado (Desarmado para recuperación de materiales)' },
  { value: 'DISCARDED', label: 'Desechado / Residuo (Sin recuperación circular)' },
];

const sustainabilitySchema = z.object({
  material: z.string().min(2, 'Especificá el tipo de material principal').or(z.literal('')),
  weightKg: z.coerce.number().min(0, 'El peso debe ser mayor o igual a 0').optional().or(z.literal(0)),
  emissionFactor: z.coerce.number().min(0, 'El factor de emisión debe ser mayor o igual a 0').optional().or(z.literal(0)),
  circularityOutcome: z.enum(['REUSED', 'DONATED', 'RECYCLED', 'DISCARDED', 'PENDING']),
  notes: z.string().optional(),
});

type SustainabilityFormValues = z.infer<typeof sustainabilitySchema>;

interface SustainabilityRecordFormProps {
  assetId: string;
  initialData?: {
    material?: string | null;
    weightKg?: number | null;
    emissionFactor?: number | null;
    estimatedCo2eqKg?: number | null;
    circularityOutcome: 'REUSED' | 'DONATED' | 'RECYCLED' | 'DISCARDED' | 'PENDING';
    notes?: string | null;
  } | null;
}

export function SustainabilityRecordForm({ assetId, initialData }: SustainabilityRecordFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SustainabilityFormValues>({
    resolver: zodResolver(sustainabilitySchema),
    defaultValues: {
      material: initialData?.material || '',
      weightKg: initialData?.weightKg || 0,
      emissionFactor: initialData?.emissionFactor || 0,
      circularityOutcome: initialData?.circularityOutcome || 'PENDING',
      notes: initialData?.notes || '',
    },
  });

  const weightKg = watch('weightKg') || 0;
  const emissionFactor = watch('emissionFactor') || 0;
  const circularityOutcome = watch('circularityOutcome') || 'PENDING';

  // Calculate CO2eq estimation dynamically on client side
  const estimatedCo2eqKg = Number((weightKg * emissionFactor).toFixed(2));

  const onSubmit = async (values: SustainabilityFormValues) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await upsertSustainabilityRecord(assetId, {
        material: values.material || null,
        weightKg: values.weightKg || null,
        emissionFactor: values.emissionFactor || null,
        circularityOutcome: values.circularityOutcome,
        notes: values.notes || null,
      });
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar el registro de sustentabilidad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardHeader>
        <CardTitle className="text-md font-semibold flex items-center gap-2 text-slate-800">
          <Leaf className="h-5 w-5 text-emerald-600" /> Registro de Sustentabilidad (SustainabilityRecord)
        </CardTitle>
        <CardDescription>
          Métricas de impacto ambiental, huella de carbono estimada y grado de reciclabilidad.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="p-3 text-xs text-red-600 bg-red-50 rounded border border-red-200">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-xs text-emerald-700 bg-emerald-50 rounded border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Registro ambiental actualizado con éxito.
            </div>
          )}

          {/* Quick Metrics Banner */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                <CloudDrizzle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Impacto estimado</p>
                <p className="text-sm font-bold text-slate-900">{estimatedCo2eqKg} kg CO₂eq</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                <Recycle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Destino Circular</p>
                <p className="text-xs font-bold text-slate-900 truncate">
                  {CIRCULARITY_OUTCOMES.find((c) => c.value === circularityOutcome)?.label.split(' (')[0]}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="material">Material Principal</Label>
              <Input
                id="material"
                placeholder="Ej: Madera, Plástico, MDF, Acero"
                {...register('material')}
              />
              {errors.material && (
                <p className="text-xs text-red-500">{errors.material.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="weightKg" className="flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5 text-slate-500" /> Peso Total (kg)
              </Label>
              <Input id="weightKg" type="number" step="0.01" {...register('weightKg')} />
              {errors.weightKg && (
                <p className="text-xs text-red-500">{errors.weightKg.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="emissionFactor" className="flex items-center gap-1.5">
                <CloudDrizzle className="h-3.5 w-3.5 text-slate-500" /> Factor de Emisión (CO₂/kg)
              </Label>
              <Input
                id="emissionFactor"
                type="number"
                step="0.001"
                placeholder="Ej: 1.8"
                {...register('emissionFactor')}
              />
              {errors.emissionFactor && (
                <p className="text-xs text-red-500">{errors.emissionFactor.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="circularityOutcome" className="flex items-center gap-1.5">
                <Recycle className="h-3.5 w-3.5 text-slate-500" /> Destino de Circularidad / Resultado *
              </Label>
              <select
                id="circularityOutcome"
                {...register('circularityOutcome')}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {CIRCULARITY_OUTCOMES.map((co) => (
                  <option key={co.value} value={co.value}>
                    {co.label}
                  </option>
                ))}
              </select>
              {errors.circularityOutcome && (
                <p className="text-xs text-red-500">{errors.circularityOutcome.message}</p>
              )}
            </div>

            <div className="flex items-center bg-slate-50 p-3 rounded-lg border border-slate-100 self-end h-9">
              <Info className="h-4 w-4 text-blue-500 mr-2 shrink-0" />
              <p className="text-[11px] text-slate-600">
                La huella de carbono se calcula automáticamente multiplicando el peso por el factor de emisión.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas o Certificaciones Ambientales</Label>
            <textarea
              id="notes"
              rows={2}
              placeholder="Ej: Madera FSC, MDF de bajo formaldehído, certificado de reciclaje adjunto..."
              {...register('notes')}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={loading} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando...
                </>
              ) : (
                'Guardar Sustentabilidad'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
