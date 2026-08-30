'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { assignAssetToSet } from '@/lib/actions/set-actions';
import { upsertShootingRecord } from '@/lib/actions/shooting-actions';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Film, Layers, CheckCircle2, Loader2, Video, CheckSquare, Square } from 'lucide-react';

interface SetItem {
  id: string;
  name: string;
}

interface AssetProductionFormProps {
  assetId: string;
  currentSetId: string | null;
  sets: SetItem[];
  shootingRecord: {
    usedInShooting: boolean;
    visibleOnCamera: boolean;
    notes: string | null;
  } | null;
}

export function AssetProductionForm({ assetId, currentSetId, sets, shootingRecord }: AssetProductionFormProps) {
  const [setId, setSetId] = useState<string>(currentSetId || 'none');
  const [usedInShooting, setUsedInShooting] = useState<boolean>(shootingRecord?.usedInShooting || false);
  const [visibleOnCamera, setVisibleOnCamera] = useState<boolean>(shootingRecord?.visibleOnCamera || false);
  const [notes, setNotes] = useState<string>(shootingRecord?.notes || '');
  
  const [savingSet, setSavingSet] = useState(false);
  const [savingShooting, setSavingShooting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const router = useRouter();

  const handleSetChange = async (newSetId: string) => {
    setSetId(newSetId);
    setSavingSet(true);
    setSuccessMsg(null);
    try {
      const finalSetId = newSetId === 'none' ? null : newSetId;
      await assignAssetToSet(assetId, finalSetId);
      showNotification('Decorado actualizado con éxito.');
      router.refresh();
    } catch (e: any) {
      alert(e.message || 'Error al actualizar decorado');
    } finally {
      setSavingSet(false);
    }
  };

  const handleShootingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingShooting(true);
    setSuccessMsg(null);
    try {
      await upsertShootingRecord(assetId, {
        usedInShooting,
        visibleOnCamera,
        notes: notes.trim() || null,
      });
      showNotification('Registro de rodaje guardado con éxito.');
      router.refresh();
    } catch (e: any) {
      alert(e.message || 'Error al actualizar rodaje');
    } finally {
      setSavingShooting(false);
    }
  };

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Decorado Card */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Layers className="h-4.5 w-4.5 text-emerald-600" /> Decorado / Set Asignado
          </CardTitle>
          <CardDescription className="text-xs">
            Asigná este elemento a un escenario o set de filmación específico.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="set-selector" className="text-xs font-semibold text-slate-500">Seleccionar Set</Label>
            <div className="flex items-center gap-2">
              <select
                id="set-selector"
                value={setId}
                onChange={(e) => handleSetChange(e.target.value)}
                disabled={savingSet}
                className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="none">Ninguno (Sin asignar)</option>
                {sets.map((set) => (
                  <option key={set.id} value={set.id}>
                    {set.name}
                  </option>
                ))}
              </select>
              {savingSet && <Loader2 className="h-4 w-4 animate-spin text-slate-400 shrink-0" />}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Rodaje / Shooting Card */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Film className="h-4.5 w-4.5 text-emerald-600" /> Control de Rodaje (ShootingRecord)
          </CardTitle>
          <CardDescription className="text-xs">
            Trazabilidad del asset en set: si fue usado y si es visible en cámara.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleShootingSubmit} className="space-y-4">
            {successMsg && (
              <div className="p-3 text-xs text-emerald-700 bg-emerald-50 rounded border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {successMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={() => setUsedInShooting(!usedInShooting)}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer select-none transition-colors"
              >
                {usedInShooting ? (
                  <CheckSquare className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Square className="h-5 w-5 text-slate-300" />
                )}
                <div>
                  <div className="text-xs font-semibold text-slate-800">Usado en Rodaje</div>
                  <div className="text-[10px] text-slate-400">El objeto llegó al set físico.</div>
                </div>
              </div>

              <div
                onClick={() => setVisibleOnCamera(!visibleOnCamera)}
                className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50 hover:bg-slate-50 cursor-pointer select-none transition-colors"
              >
                {visibleOnCamera ? (
                  <Video className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Square className="h-5 w-5 text-slate-300" />
                )}
                <div>
                  <div className="text-xs font-semibold text-slate-800">Visible en Cámara</div>
                  <div className="text-[10px] text-slate-400">El objeto sale en el encuadre final.</div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="shooting-notes" className="text-xs font-semibold text-slate-500">Notas de Continuidad / Escena</Label>
              <textarea
                id="shooting-notes"
                rows={2}
                placeholder="Ej: Aparece en el fondo del salón, escena 3. Cuidado con el reflejo de focos."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={savingShooting}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                {savingShooting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando...
                  </>
                ) : (
                  'Guardar Rodaje'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
