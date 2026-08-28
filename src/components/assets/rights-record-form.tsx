'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { upsertRightsRecord } from '@/lib/actions/asset-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';

const rightsSchema = z.object({
  licenseType: z.string().min(2, 'Especificar tipo de licencia (ej: Copyright, CC-BY, Propietaria)'),
  ownerName: z.string().min(2, 'Nombre del titular o entidad de derechos'),
  terms: z.string().optional(),
  expirationDate: z.string().optional(),
  isDocumented: z.boolean(),
});

type RightsFormValues = z.infer<typeof rightsSchema>;

interface RightsRecordFormProps {
  assetId: string;
  initialData?: {
    licenseType: string;
    ownerName: string;
    terms?: string | null;
    expirationDate?: Date | null;
    isDocumented: boolean;
  } | null;
}

export function RightsRecordForm({ assetId, initialData }: RightsRecordFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedDate = initialData?.expirationDate
    ? new Date(initialData.expirationDate).toISOString().split('T')[0]
    : '';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RightsFormValues>({
    resolver: zodResolver(rightsSchema),
    defaultValues: {
      licenseType: initialData?.licenseType || 'Licencia Propietaria',
      ownerName: initialData?.ownerName || '',
      terms: initialData?.terms || '',
      expirationDate: formattedDate,
      isDocumented: initialData?.isDocumented ?? true,
    },
  });

  const onSubmit = async (data: RightsFormValues) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await upsertRightsRecord(assetId, data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar registro de derechos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-md font-semibold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-blue-600" /> Registro de Derechos y Licencia (RightsRecord)
        </CardTitle>
        <CardDescription>
          Documentación legal de propiedad intelectual, licencias o titularidad vinculada a este asset.
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
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Registro de derechos actualizado con éxito.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="licenseType">Tipo de Licencia *</Label>
              <Input
                id="licenseType"
                placeholder="Ej: Copyright, Creative Commons, Exclusiva"
                {...register('licenseType')}
              />
              {errors.licenseType && (
                <p className="text-xs text-red-500">{errors.licenseType.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ownerName">Titular / Propietario *</Label>
              <Input
                id="ownerName"
                placeholder="Ej: Empresa S.A. o Nombre de autor"
                {...register('ownerName')}
              />
              {errors.ownerName && (
                <p className="text-xs text-red-500">{errors.ownerName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="expirationDate">Vencimiento (opcional)</Label>
              <Input id="expirationDate" type="date" {...register('expirationDate')} />
            </div>

            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer p-2 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100">
                <input
                  type="checkbox"
                  {...register('isDocumented')}
                  className="h-4 w-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Marcar como Derechos Verificados / Documentados
                </span>
              </label>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="terms">Términos o Restricciones</Label>
            <textarea
              id="terms"
              rows={2}
              placeholder="Detalle de términos contractuales o restricciones de uso..."
              {...register('terms')}
              className="w-full rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={loading} size="sm" className="bg-slate-900 hover:bg-slate-800">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar Derechos'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
