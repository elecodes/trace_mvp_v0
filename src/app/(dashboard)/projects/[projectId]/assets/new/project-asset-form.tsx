'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAsset } from '@/lib/actions/asset-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUploader } from '@/components/assets/image-uploader';
import { Loader2 } from 'lucide-react';

interface ProjectAssetFormProps {
  projectId: string;
}

export function ProjectAssetForm({ projectId }: ProjectAssetFormProps) {
  const [assetId] = useState(() => crypto.randomUUID());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (title.trim().length < 2) {
      setError('El título debe tener al menos 2 caracteres');
      setLoading(false);
      return;
    }

    const finalImageUrl = imageUrl || manualUrl || undefined;

    try {
      const asset = await createAsset({
        id: assetId,
        title,
        description: description || undefined,
        imageUrl: finalImageUrl,
        projectId,
      });
      router.push(`/assets/${asset.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error al crear el asset');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Título / Nombre del Asset *</Label>
        <Input
          id="title"
          placeholder="Ej: Laptop ThinkPad X1 Carbon"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descripción Detallada</Label>
        <textarea
          id="description"
          rows={3}
          placeholder="Especificaciones, modelo, número de serie o descripción general..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-4 border-t pt-4">
        <div>
          <Label className="text-sm font-semibold">Fotografía del Asset</Label>
          <p className="text-xs text-slate-500 mb-2">Sube una imagen o proporciona una URL manual.</p>
        </div>

        <div className="space-y-2">
          <Label>Subir Imagen (Compresión automática)</Label>
          <ImageUploader
            value={imageUrl}
            onChange={(url) => setImageUrl(url)}
            projectId={projectId}
            assetId={assetId}
          />
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-xs font-semibold uppercase">O</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="manualUrl">URL de Imagen Manual (Opcional)</Label>
          <Input
            id="manualUrl"
            type="url"
            placeholder="https://ejemplo.com/imagen.jpg"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            disabled={!!imageUrl}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando Asset...
            </>
          ) : (
            'Crear Asset en Fase Diseño'
          )}
        </Button>
      </div>
    </form>
  );
}
