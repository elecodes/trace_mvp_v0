'use client';

import { useState } from 'react';
import { LifecycleStage, ProjectRole } from '@prisma/client';
import { updateAssetStatus } from '@/lib/actions/asset-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/components/ui/button';

import { useRouter } from 'next/navigation';

interface LifecycleStepperProps {
  assetId: string;
  currentStage: LifecycleStage;
  userRole?: ProjectRole;
}

const STAGES: { key: LifecycleStage; label: string; description: string; stepNumber: number }[] = [
  {
    key: 'DESIGN',
    label: '1. Diseño',
    description: 'Diseño e idea inicial',
    stepNumber: 1,
  },
  {
    key: 'PRODUCTION',
    label: '2. Producción',
    description: 'Fabricación o compra',
    stepNumber: 2,
  },
  {
    key: 'SHOOTING',
    label: '3. Rodaje',
    description: 'En uso en set/rodaje',
    stepNumber: 3,
  },
  {
    key: 'FINAL_DESTINATION',
    label: '4. Destino Final',
    description: 'Reciclaje / Retiro',
    stepNumber: 4,
  },
];

export function LifecycleStepper({ assetId, currentStage, userRole }: LifecycleStepperProps) {
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [targetStage, setTargetStage] = useState<LifecycleStage | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const currentIndex = STAGES.findIndex((s) => s.key === currentStage);

  const canEdit = userRole === 'PRODUCER' || userRole === 'ART';

  const handleStageChange = async (newStage: LifecycleStage) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await updateAssetStatus(assetId, newStage, notes);
      setShowNotesInput(false);
      setNotes('');
      setTargetStage(null);
      router.refresh();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error al cambiar la etapa');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectStage = (stageKey: LifecycleStage) => {
    if (stageKey === currentStage) return;
    setTargetStage(stageKey);
    setShowNotesInput(true);
    setErrorMsg(null);
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-500" /> Ciclo de Vida del Asset
          </CardTitle>
          <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Etapa Actual: {STAGES[currentIndex]?.label}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Visual Stepper */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 my-2">
          {STAGES.map((stage, idx) => {
            const isPassed = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const isTarget = stage.key === targetStage;

            return (
              <button
                key={stage.key}
                type="button"
                onClick={() => handleSelectStage(stage.key)}
                disabled={loading || !canEdit}
                className={cn(
                  'p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between group relative flex flex-col justify-between group',
                  isCurrent
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-sm ring-1 ring-emerald-500'
                    : isPassed
                    ? 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300',
                  isTarget && 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/30',
                  !canEdit && 'cursor-not-allowed opacity-80'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={cn(
                      'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold',
                      isPassed || isCurrent
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    )}
                  >
                    {isPassed ? <Check className="h-4 w-4" /> : stage.stepNumber}
                  </div>
                  {idx < STAGES.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-slate-300 hidden md:block" />
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-sm text-slate-900">{stage.label}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{stage.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mt-4 p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded">
            {errorMsg}
          </div>
        )}

        {/* Notes input when user selects target transition */}
        {showNotesInput && targetStage && (
          <div className="mt-4 p-4 rounded-lg bg-blue-50/60 border border-blue-200 space-y-3">
            <h5 className="text-sm font-semibold text-blue-900">
              Confirmar cambio de etapa a:{' '}
              <span className="font-bold underline">
                {STAGES.find((s) => s.key === targetStage)?.label}
              </span>
            </h5>
            <div>
              <label className="text-xs font-medium text-blue-800 mb-1 block">
                Notas del cambio (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Aprobado por control de calidad, enviado a depósito..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-9 rounded-md border border-blue-300 bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowNotesInput(false);
                  setTargetStage(null);
                  setErrorMsg(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={loading}
                onClick={() => handleStageChange(targetStage)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Transicionar Etapa'
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
