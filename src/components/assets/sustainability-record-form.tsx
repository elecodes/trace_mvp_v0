'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { upsertSustainabilityRecord } from '@/lib/actions/asset-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Leaf, Loader2, CheckCircle2, Scale, Recycle, CloudDrizzle } from 'lucide-react';

const sustainabilitySchema = z.object({
  carbonFootprintKg: z.coerce.number().min(0, 'La huella de carbono debe ser mayor o igual a 0'),
  weightKg: z.coerce.number().min(0, 'El peso debe ser mayor o igual a 0'),
  recyclablePercent: z.coerce.number().min(0).max(100, 'El porcentaje debe ser entre 0 y 100'),
  notes: z.string().optional(),
});

type SustainabilityFormValues = z.infer<typeof sustainabilitySchema>;

interface SustainabilityRecordFormProps {
  assetId: string;
  initialData?: {
    carbonFootprintKg: number;
    weightKg: number;
    recyclablePercent: number;
    notes?: string | null;
  } | null;
}

export function SustainabilityRecordForm({ assetId, initialData }: SustainabilityRecordFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SustainabilityFormValues>({
    resolver: zodResolver(sustainabilitySchema),
    defaultValues: {
      carbonFootprintKg: initialData?.carbonFootprintKg || 0,
      weightKg: initialData?.weightKg || 0,
      recyclablePercent: initialData?.recyclablePercent || 0,
      notes: initialData?.notes || '',
    },
  });

  const currentCarbon = watch('carbonFootprintKg') || 0;
  const currentRecyclable = watch('recyclablePercent') || 0;

  const onSubmit = async (data: SustainabilityFormValues) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await upsertSustainabilityRecord(assetId, data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar registro de sustentabilidad');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-md font-semibold flex items-center gap-2">
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
                <p className="text-sm font-bold text-slate-900">{currentCarbon} kg CO₂eq</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                <Recycle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium">Reciclabilidad</p>
                <p className="text-sm font-bold text-slate-900">{currentRecyclable}%</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="carbonFootprintKg" className="flex items-center gap-1.5">
                <CloudDrizzle className="h-3.5 w-3.5 text-slate-500" /> CO₂eq (kg) *
              </Label>
              <Input
                id="carbonFootprintKg"
                type="number"
                step="0.01"
                {...register('carbonFootprintKg')}
              />
              {errors.carbonFootprintKg && (
                <p className="text-xs text-red-500">{errors.carbonFootprintKg.message}</p>
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
              <Label htmlFor="recyclablePercent" className="flex items-center gap-1.5">
                <Recycle className="h-3.5 w-3.5 text-slate-500" /> % Reciclable
              </Label>
              <Input
                id="recyclablePercent"
                type="number"
                step="1"
                min="0"
                max="100"
                {...register('recyclablePercent')}
              />
              {errors.recyclablePercent && (
                <p className="text-xs text-red-500">{errors.recyclablePercent.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas o Certificaciones Ambientales</Label>
            <textarea
              id="notes"
              rows={2}
              placeholder="Ej: Certificado ISO 14001, cálculo basado en transporte marítimo + materiales..."
              {...register('notes')}
              className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={loading} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar Sustentabilidad'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
