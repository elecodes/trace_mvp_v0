'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { History, Calendar } from 'lucide-react';

interface Event {
  id: string;
  previousStage: string | null;
  newStage: string;
  notes: string | null;
  timestamp: Date;
}

interface LifecycleHistoryProps {
  events: Event[];
}

const STAGE_LABELS: Record<string, string> = {
  DESIGN: 'Diseño',
  PRODUCTION: 'Producción',
  SHOOTING: 'Rodaje',
  FINAL_DESTINATION: 'Destino Final',
};

export function LifecycleHistory({ events }: LifecycleHistoryProps) {
  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardHeader className="pb-3">
        <CardTitle className="text-md font-semibold flex items-center gap-2 text-slate-800">
          <History className="h-4 w-4 text-slate-500" /> Historial de Transiciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No hay eventos registrados aún.</p>
        ) : (
          <div className="relative border-l border-slate-200 ml-3 space-y-5 py-1">
            {events.map((event) => {
              const prevLabel = event.previousStage ? STAGE_LABELS[event.previousStage] || event.previousStage : null;
              const newLabel = STAGE_LABELS[event.newStage] || event.newStage;

              return (
                <div key={event.id} className="relative pl-6">
                  {/* Dot */}
                  <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                  
                  {/* Header info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-semibold text-slate-800">
                    <span className="font-semibold text-emerald-800">
                      {prevLabel ? `${prevLabel} ➔ ` : ''}
                      {newLabel}
                    </span>
                    <span className="text-[11px] font-normal text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(event.timestamp).toLocaleString('es-ES', {
                        timeZone: 'Europe/Madrid',
                      })}
                    </span>
                  </div>
                  
                  {/* Note info */}
                  {event.notes && (
                    <p className="text-xs text-slate-600 mt-1 bg-slate-50 p-2 rounded border border-slate-100 italic">
                      {event.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
