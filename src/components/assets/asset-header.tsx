'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { updateAsset } from '@/lib/actions/asset-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { FolderKanban, Calendar, Edit2, Loader2, Save, X, Copy, Check } from 'lucide-react';
import { ImageUploader } from '@/components/assets/image-uploader';
import { analyzeAssetImage, analyzeAssetImageUrl } from '@/lib/actions/ai-actions';

interface AssetHeaderProps {
  asset: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    rawImageUrl?: string | null;
    originalImageUrl?: string | null;
    currentStage: string;
    category?: string;
    createdAt: Date | string;
    project: { id: string; name: string };
  };
  stageLabels: Record<string, string>;
}

const CATEGORY_LABELS: Record<string, string> = {
  GENERIC: 'Genérico',
  TYPOGRAPHY: 'Tipografía',
  FURNITURE: 'Mobiliario',
  PROPS: 'Utilería',
  WARDROBE: 'Vestuario',
  EQUIPMENT: 'Equipamiento',
};

export function AssetHeader({ asset, stageLabels }: AssetHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(asset.title);
  const [description, setDescription] = useState(asset.description || '');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleImageSelected = async (base64: string, mimeType: string) => {
    setAnalyzing(true);
    setError(null);
    try {
      const data = await analyzeAssetImage(base64, mimeType);
      if (data && data.description) {
        setDescription(data.description);
      }
    } catch (err) {
      console.error('Error al analizar la imagen:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUrlAnalyze = async () => {
    if (!manualUrl || (!manualUrl.startsWith('http://') && !manualUrl.startsWith('https://'))) {
      setError('Por favor ingresa una URL válida');
      return;
    }
    setAnalyzing(true);
    setError(null);
    try {
      const data = await analyzeAssetImageUrl(manualUrl);
      if (data && data.description) {
        setDescription(data.description);
      }
    } catch (err) {
      console.error('Error al analizar la URL:', err);
      setError('No se pudo analizar la imagen de la URL.');
    } finally {
      setAnalyzing(false);
    }
  };

  const isOriginallyExternal = !!asset.originalImageUrl || (asset.rawImageUrl?.startsWith('http://') || asset.rawImageUrl?.startsWith('https://') || false);
  const [imageUrl, setImageUrl] = useState(isOriginallyExternal ? '' : (asset.rawImageUrl || ''));
  const [manualUrl, setManualUrl] = useState(isOriginallyExternal ? (asset.originalImageUrl || asset.rawImageUrl || '') : '');

  const externalUrl = asset.originalImageUrl || (asset.rawImageUrl?.startsWith('http://') || asset.rawImageUrl?.startsWith('https://') ? asset.rawImageUrl : null);
  const displayUrl = externalUrl || 'Imagen almacenada en TRACE';
  const isExternalUrl = !!externalUrl;

  const handleCopy = () => {
    if (!externalUrl) return;
    navigator.clipboard.writeText(externalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (title.trim().length < 2) {
      setError('El título debe tener al menos 2 caracteres');
      setLoading(false);
      return;
    }

    const finalImageUrl = imageUrl || manualUrl || '';

    try {
      await updateAsset(asset.id, {
        title,
        description: description || undefined,
        imageUrl: finalImageUrl,
      });
      setIsEditing(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error al guardar los cambios');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
      <CardContent className="p-6">
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
            {analyzing && (
              <div className="p-3 text-sm text-blue-700 bg-blue-50 rounded-md border border-blue-200 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span>Analizando imagen con Gemini IA para autocompletar campos...</span>
              </div>
            )}
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="font-semibold text-slate-800">Editar Información del Asset</h3>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsEditing(false);
                    setTitle(asset.title);
                    setDescription(asset.description || '');
                    setImageUrl(isOriginallyExternal ? '' : (asset.rawImageUrl || ''));
                    setManualUrl(isOriginallyExternal ? (asset.originalImageUrl || asset.rawImageUrl || '') : '');
                    setError(null);
                  }}
                  disabled={loading}
                >
                  <X className="h-4 w-4 mr-1" /> Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Save className="h-4 w-4 mr-1" />
                  )}
                  Guardar
                </Button>
              </div>
            </div>

            {error && (
              <div className="p-2.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="edit-title">Título del Asset *</Label>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-description">Descripción</Label>
                <textarea
                  id="edit-description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-4 border-t pt-4">
                <div>
                  <Label className="text-sm font-semibold">Fotografía del Asset</Label>
                  <p className="text-xs text-slate-500 mb-2">Sube una nueva imagen o proporciona una URL manual.</p>
                </div>

                <div className="space-y-2">
                  <Label>Subir Imagen (Compresión automática)</Label>
                  <ImageUploader
                    value={imageUrl}
                    onChange={(url) => setImageUrl(url)}
                    onImageSelected={handleImageSelected}
                    projectId={asset.project.id}
                    assetId={asset.id}
                  />
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-4 text-slate-400 text-xs font-semibold uppercase">O</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-manualUrl">URL de Imagen Manual (Opcional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit-manualUrl"
                      type="url"
                      placeholder="https://ejemplo.com/imagen.jpg"
                      disabled={!!imageUrl}
                      value={manualUrl}
                      onChange={(e) => setManualUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!!imageUrl || !manualUrl || analyzing}
                      onClick={handleUrlAnalyze}
                      className="shrink-0 cursor-pointer"
                    >
                      {analyzing ? 'Analizando...' : 'Autocompletar con IA'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative h-48 w-full md:w-56 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 group">
              {asset.imageUrl ? (
                <>
                  {isExternalUrl ? (
                    <img src={asset.imageUrl} alt={asset.title} className="object-cover h-full w-full" />
                  ) : (
                    <Image src={asset.imageUrl} alt={asset.title} fill className="object-cover" />
                  )}
                  <a
                    href={asset.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 right-2 bg-slate-900/80 hover:bg-slate-950 text-white text-[10px] font-semibold px-2.5 py-1 rounded-md transition-colors opacity-0 group-hover:opacity-100 shadow"
                  >
                    Ver original ↗
                  </a>
                </>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-slate-300 font-bold">
                  TRACE
                </div>
              )}
            </div>

            <div className="space-y-3 flex-1 w-full">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    {stageLabels[asset.currentStage] || asset.currentStage}
                  </span>
                  {asset.category && asset.category !== 'GENERIC' && (
                    <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                      {CATEGORY_LABELS[asset.category] || asset.category}
                    </span>
                  )}
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <FolderKanban className="h-3.5 w-3.5 text-slate-400" /> {asset.project.name}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="gap-1 h-8 text-xs cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Editar
                </Button>
              </div>

              <h1 className="text-2xl font-bold text-slate-900">{asset.title}</h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                {asset.description || 'Sin descripción ingresada.'}
              </p>

              {(asset.originalImageUrl || asset.rawImageUrl) && (
                <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 w-fit max-w-full">
                  <span className="font-semibold text-slate-500 shrink-0">Origen de Imagen:</span>
                  <span className="text-slate-700 truncate select-all max-w-[200px] sm:max-w-[320px] font-mono text-[10px]" title={displayUrl}>
                    {displayUrl}
                  </span>
                  {isExternalUrl && (
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="text-[10px] text-emerald-700 font-semibold hover:text-emerald-800 shrink-0 pl-1 cursor-pointer flex items-center gap-1"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Copiar
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              <div className="text-xs text-slate-400 flex items-center gap-1 pt-2 border-t border-slate-100">
                <Calendar className="h-3.5 w-3.5 text-slate-400" /> Registrado el{' '}
                {new Date(asset.createdAt).toLocaleDateString('es-AR')}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
