'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { upsertRightsRecord } from '@/lib/actions/asset-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, Loader2, CheckCircle2 } from 'lucide-react';

const LICENSE_TYPES = [
  { value: 'ORIGINAL', label: 'Original (Derechos propios / Obra original)' },
  { value: 'STOCK_LICENSED', label: 'Stock / Licenciado (Adquirido bajo licencia)' },
  { value: 'AI_GENERATED', label: 'Generado por IA (Sujeto a términos de herramienta)' },
  { value: 'PUBLIC_DOMAIN', label: 'Dominio Público / Creative Commons' },
  { value: 'UNKNOWN', label: 'Desconocido / Pendiente de verificación' },
];

const LEGAL_STATUSES = [
  { value: 'PENDING', label: 'Pendiente' },
  { value: 'APPROVED', label: 'Aprobado' },
  { value: 'REJECTED', label: 'Rechazado' },
];

const rightsSchema = z.object({
  licenseType: z.enum(['ORIGINAL', 'STOCK_LICENSED', 'AI_GENERATED', 'PUBLIC_DOMAIN', 'UNKNOWN']),
  sourceName: z.string().min(2, 'Especificá el titular o la fuente de los derechos'),
  licenseDocUrl: z.string().url('Ingresá una URL válida (ej: https://ejemplo.com)').or(z.literal('')),
  isAiGenerated: z.boolean(),
  aiToolName: z.string().optional(),
  legalStatus: z.enum(['APPROVED', 'PENDING', 'REJECTED']),
  notes: z.string().optional(),
}).refine((data) => {
  if (data.isAiGenerated && (!data.aiToolName || data.aiToolName.trim().length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Especificá el nombre de la herramienta de IA utilizada',
  path: ['aiToolName'],
});

type RightsFormValues = z.infer<typeof rightsSchema>;

interface RightsRecordFormProps {
  assetId: string;
  initialData?: {
    licenseType: 'ORIGINAL' | 'STOCK_LICENSED' | 'AI_GENERATED' | 'PUBLIC_DOMAIN' | 'UNKNOWN';
    sourceName?: string | null;
    licenseDocUrl?: string | null;
    isAiGenerated: boolean;
    aiToolName?: string | null;
    legalStatus: 'APPROVED' | 'PENDING' | 'REJECTED';
    notes?: string | null;
  } | null;
}

export function RightsRecordForm({ assetId, initialData }: RightsRecordFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RightsFormValues>({
    resolver: zodResolver(rightsSchema),
    defaultValues: {
      licenseType: initialData?.licenseType || 'UNKNOWN',
      sourceName: initialData?.sourceName || '',
      licenseDocUrl: initialData?.licenseDocUrl || '',
      isAiGenerated: initialData?.isAiGenerated ?? false,
      aiToolName: initialData?.aiToolName || '',
      legalStatus: initialData?.legalStatus || 'PENDING',
      notes: initialData?.notes || '',
    },
  });

  const isAiGenerated = watch('isAiGenerated');

  // Sync initialData changes from background processing
  useEffect(() => {
    if (initialData) {
      reset({
        licenseType: initialData.licenseType,
        sourceName: initialData.sourceName || '',
        licenseDocUrl: initialData.licenseDocUrl || '',
        isAiGenerated: initialData.isAiGenerated,
        aiToolName: initialData.aiToolName || '',
        legalStatus: initialData.legalStatus,
        notes: initialData.notes || '',
      });
    }
  }, [initialData, reset]);

  // Clear AI tool name if checkbox is unchecked
  useEffect(() => {
    if (!isAiGenerated) {
      setValue('aiToolName', '');
    }
  }, [isAiGenerated, setValue]);

  const onSubmit = async (values: RightsFormValues) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await upsertRightsRecord(assetId, {
        ...values,
        licenseDocUrl: values.licenseDocUrl || null,
        aiToolName: values.isAiGenerated ? values.aiToolName : null,
        notes: values.notes || null,
      });
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || 'Error al guardar el registro de derechos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardHeader>
        <CardTitle className="text-md font-semibold flex items-center gap-2 text-slate-800">
          <ShieldCheck className="h-5 w-5 text-emerald-600" /> Registro de Derechos y Licencia (RightsRecord)
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
              <select
                id="licenseType"
                {...register('licenseType')}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {LICENSE_TYPES.map((lt) => (
                  <option key={lt.value} value={lt.value}>
                    {lt.label}
                  </option>
                ))}
              </select>
              {errors.licenseType && (
                <p className="text-xs text-red-500">{errors.licenseType.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sourceName">Titular / Origen de Derechos *</Label>
              <Input
                id="sourceName"
                placeholder="Ej: Netflix España, Diseñador X, Getty Images"
                {...register('sourceName')}
              />
              {errors.sourceName && (
                <p className="text-xs text-red-500">{errors.sourceName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="licenseDocUrl">Enlace al Documento de Licencia / Contrato</Label>
              <Input
                id="licenseDocUrl"
                type="url"
                placeholder="https://drive.google.com/..."
                {...register('licenseDocUrl')}
              />
              {errors.licenseDocUrl && (
                <p className="text-xs text-red-500">{errors.licenseDocUrl.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="legalStatus">Estado de Verificación *</Label>
              <select
                id="legalStatus"
                {...register('legalStatus')}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {LEGAL_STATUSES.map((ls) => (
                  <option key={ls.value} value={ls.value}>
                    {ls.label}
                  </option>
                ))}
              </select>
              {errors.legalStatus && (
                <p className="text-xs text-red-500">{errors.legalStatus.message}</p>
              )}
            </div>
          </div>

          <div className="p-4 rounded-lg border border-slate-100 bg-slate-50/50 space-y-3">
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isAiGenerated')}
                  className="h-4 w-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-800">
                  ¿Este asset fue generado total o parcialmente mediante Inteligencia Artificial?
                </span>
              </label>
            </div>

            {isAiGenerated && (
              <div className="space-y-1.5 animate-in fade-in duration-200">
                <Label htmlFor="aiToolName">Herramienta de IA utilizada *</Label>
                <Input
                  id="aiToolName"
                  placeholder="Ej: Midjourney v6, DALL-E 3, Adobe Firefly"
                  {...register('aiToolName')}
                />
                {errors.aiToolName && (
                  <p className="text-xs text-red-500">{errors.aiToolName.message}</p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas o Restricciones Contractuales</Label>
            <textarea
              id="notes"
              rows={2}
              placeholder="Ej: Válido únicamente para territorio europeo, expiración en emisión original, etc."
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
                'Guardar Derechos'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
