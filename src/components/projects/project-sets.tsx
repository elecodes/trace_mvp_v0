'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSet, deleteSet } from '@/lib/actions/set-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Plus, Trash2, MapPin, Layers } from 'lucide-react';

interface SetItem {
  id: string;
  name: string;
  location: string | null;
  notes: string | null;
  _count?: {
    assets: number;
  };
  assets?: any[];
}

interface ProjectSetsProps {
  projectId: string;
  sets: SetItem[];
}

export function ProjectSets({ projectId, sets }: ProjectSetsProps) {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const router = useRouter();

  const handleCreateSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await createSet({
        name: name.trim(),
        location: location.trim() || null,
        notes: notes.trim() || null,
        projectId,
      });
      setName('');
      setLocation('');
      setNotes('');
      setShowAddForm(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Error al crear decorado');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSet = async (setId: string) => {
    if (!confirm('¿Estás seguro de que querés eliminar este decorado? Los assets asociados no se eliminarán, solo se quitarán del decorado.')) return;
    try {
      await deleteSet(setId);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar decorado');
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Layers className="h-4.5 w-4.5 text-emerald-600" /> Decorados / Sets ({sets.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Agrupá y ubicá tus elementos en los escenarios de rodaje.
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
          className="h-8 text-xs cursor-pointer gap-1"
        >
          <Plus className="h-3 w-3" /> {showAddForm ? 'Cancelar' : 'Nuevo'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Create Set Form */}
        {showAddForm && (
          <form onSubmit={handleCreateSet} className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3 animate-in fade-in duration-200">
            {error && <p className="text-[10px] text-red-500">{error}</p>}
            <div className="space-y-2">
              <div>
                <Label htmlFor="set-name" className="text-[10px] font-semibold text-slate-500">Nombre del Set *</Label>
                <Input
                  id="set-name"
                  placeholder="Ej: Salón Principal, Habitación B"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label htmlFor="set-location" className="text-[10px] font-semibold text-slate-500">Ubicación / Stage</Label>
                <Input
                  id="set-location"
                  placeholder="Ej: Stage 1, Localización Exterior"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label htmlFor="set-notes" className="text-[10px] font-semibold text-slate-500">Notas</Label>
                <Input
                  id="set-notes"
                  placeholder="Detalles o anotaciones..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !name}
                className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer font-semibold"
              >
                {loading ? 'Creando...' : 'Crear Decorado'}
              </Button>
            </div>
          </form>
        )}

        {/* Sets List */}
        <div className="space-y-2">
          {sets.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No hay decorados creados todavía.</p>
          ) : (
            sets.map((set) => {
              const assetCount = set._count?.assets ?? set.assets?.length ?? 0;
              return (
                <div
                  key={set.id}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors text-xs flex justify-between items-start"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      {set.name}
                      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.2 rounded-full">
                        {assetCount} assets
                      </span>
                    </div>
                    {set.location && (
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" /> {set.location}
                      </div>
                    )}
                    {set.notes && (
                      <div className="text-[10px] text-slate-400 italic">{set.notes}</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteSet(set.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
