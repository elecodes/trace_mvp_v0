'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { updateAsset } from '@/lib/actions/asset-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { FolderKanban, Calendar, Edit2, Loader2, Save, X } from 'lucide-react';

interface AssetHeaderProps {
  asset: {
    id: string;
    title: string;
    description: string | null;
    imageUrl: string | null;
    currentStage: string;
    createdAt: Date | string;
    project: { id: string; name: string };
  };
  stageLabels: Record<string, string>;
}

export function AssetHeader({ asset, stageLabels }: AssetHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(asset.title);
  const [description, setDescription] = useState(asset.description || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (title.trim().length < 2) {
      setError('El título debe tener al menos 2 caracteres');
      setLoading(false);
      return;
    }

    try {
      await updateAsset(asset.id, {
        title,
        description: description || undefined,
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
            </div>
          </form>
        ) : (
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative h-48 w-full md:w-56 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 group">
              {asset.imageUrl ? (
                <>
                  <Image src={asset.imageUrl} alt={asset.title} fill className="object-cover" />
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
