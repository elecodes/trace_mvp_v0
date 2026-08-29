'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { createAsset } from '@/lib/actions/asset-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUploader } from '@/components/assets/image-uploader';
import { Loader2 } from 'lucide-react';
import { AssetCategory } from '@prisma/client';
import { analyzeAssetImage } from '@/lib/actions/ai-actions';

const assetSchema = z.object({
  title: z.string().min(2, 'El título debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  projectId: z.string().min(1, 'Debes seleccionar un proyecto'),
  category: z.nativeEnum(AssetCategory).default(AssetCategory.GENERIC),
});

type AssetFormValues = z.infer<typeof assetSchema>;

interface AssetFormProps {
  projects: { id: string; name: string }[];
}

export function AssetForm({ projects }: AssetFormProps) {
  const [assetId] = useState(() => crypto.randomUUID());
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleImageSelected = async (base64: string, mimeType: string) => {
    setAnalyzing(true);
    setError(null);
    try {
      const data = await analyzeAssetImage(base64, mimeType);
      if (data) {
        if (data.description) setValue('description', data.description);
        if (data.category) setValue('category', data.category as AssetCategory);
      }
    } catch (err) {
      console.error('Error al analizar la imagen:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      title: '',
      description: '',
      imageUrl: '',
      projectId: projects[0]?.id || '',
      category: AssetCategory.GENERIC,
    },
  });

  const imageUrl = watch('imageUrl');
  const projectId = watch('projectId');

  const onSubmit = async (data: AssetFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const asset = await createAsset({
        id: assetId,
        ...data,
      });
      router.push(`/assets/${asset.id}`);
    } catch (err: any) {
      setError(err.message || 'Error al crear el asset');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {analyzing && (
        <div className="p-3 text-sm text-blue-700 bg-blue-50 rounded-md border border-blue-200 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          <span>Analizando imagen con Gemini IA para autocompletar campos...</span>
        </div>
      )}

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Título / Nombre del Asset *</Label>
        <Input id="title" placeholder="Ej: Laptop ThinkPad X1 Carbon" {...register('title')} />
        {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="projectId">Proyecto Perteneciente *</Label>
        <select
          id="projectId"
          {...register('projectId')}
          className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {errors.projectId && <p className="text-xs text-red-500">{errors.projectId.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Categoría del Asset *</Label>
        <select
          id="category"
          {...register('category')}
          className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="GENERIC">Genérico / General</option>
          <option value="TYPOGRAPHY">Tipografía</option>
          <option value="FURNITURE">Mobiliario</option>
          <option value="PROPS">Utilería / Props</option>
          <option value="WARDROBE">Vestuario</option>
          <option value="EQUIPMENT">Equipamiento / Maquinaria</option>
        </select>
        {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción Detallada</Label>
        <textarea
          id="description"
          rows={3}
          placeholder="Especificaciones, modelo, número de serie o descripción general..."
          {...register('description')}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-2">
        <Label>Fotografía del Asset (Compresión automática)</Label>
        <ImageUploader
          value={imageUrl}
          onChange={(url) => setValue('imageUrl', url, { shouldValidate: true })}
          onImageSelected={handleImageSelected}
          projectId={projectId}
          assetId={assetId}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando Asset...
            </>
          ) : (
            'Crear Asset en Fase Concepción'
          )}
        </Button>
      </div>
    </form>
  );
}
