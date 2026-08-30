'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateProject } from '@/lib/actions/project-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FolderKanban, Edit2, Check, X, Loader2 } from 'lucide-react';

interface ProjectHeaderProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date | string;
  };
}

export function ProjectHeader({ project }: ProjectHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await updateProject(project.id, {
        name: name.trim(),
        description: description.trim() || null,
      });
      setIsEditing(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(project.name);
    setDescription(project.description || '');
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between gap-4">
      {isEditing ? (
        <div className="space-y-4 w-full">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Nombre del Proyecto</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="font-semibold text-lg text-slate-800"
              placeholder="Nombre del proyecto..."
              required
              disabled={loading}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 text-slate-600"
              placeholder="Descripción del proyecto..."
              rows={2}
              disabled={loading}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={loading}
              className="gap-1.5 h-8 text-xs cursor-pointer"
            >
              <X className="h-3.5 w-3.5" /> Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={loading || !name.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-8 text-xs cursor-pointer"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
              Guardar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 w-full">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold uppercase tracking-wider">
              <FolderKanban className="h-4 w-4 text-emerald-600" /> Proyecto Audiovisual
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
              <button
                onClick={() => setIsEditing(true)}
                className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                title="Editar Proyecto"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-slate-500">
              {project.description || 'Sin descripción ingresada.'}
            </p>
          </div>
          <div className="text-xs text-slate-400 self-end sm:self-start">
            Registrado el {new Date(project.createdAt).toLocaleDateString('es-AR')}
          </div>
        </div>
      )}
    </div>
  );
}
