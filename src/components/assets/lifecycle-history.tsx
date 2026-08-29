'use client';

import { LifecycleStage } from '@prisma/client';

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

function formatTimestamp(dateInput: Date | string) {
  const date = new Date(dateInput);
  const day = date.getDate();
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const month = months[date.getMonth()];
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day} ${month} ${hours}:${minutes}`;
}

export function LifecycleHistory({ events }: LifecycleHistoryProps) {
  const sortedEvents = [...events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-base font-bold text-slate-800 mb-6">Historial</h3>
      
      {sortedEvents.length === 0 ? (
        <div className="text-center py-6 text-slate-400 border border-dashed border-slate-200 rounded-lg">
          <p className="text-sm italic">No existen eventos todavía.</p>
        </div>
      ) : (
        <div className="relative border-l border-slate-100 ml-2 space-y-6">
          {sortedEvents.map((event) => {
            const stageLabel = STAGE_LABELS[event.newStage] || event.newStage;
            return (
              <div key={event.id} className="relative pl-6">
                {/* Dot indicator */}
                <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-100" />
                
                <div className="space-y-0.5">
                  <div className="text-xs font-semibold text-slate-400">
                    {formatTimestamp(event.timestamp)}
                  </div>
                  <div className="text-sm font-bold text-slate-700">
                    {stageLabel}
                  </div>
                  {event.notes && (
                    <div className="text-xs text-slate-500">
                      {event.notes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

