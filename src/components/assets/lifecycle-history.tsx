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

export function LifecycleHistory({ events }: LifecycleHistoryProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-md font-semibold flex items-center gap-2">
          <History className="h-4 w-4 text-slate-500" /> Historial de Transiciones
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No hay eventos registrados aún.</p>
        ) : (
          <div className="relative border-l border-slate-200 ml-3 space-y-4 py-1">
            {events.map((event) => (
              <div key={event.id} className="relative pl-6">
                <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-white" />
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                  <span>
                    {event.previousStage ? `${event.previousStage} ➔ ` : ''}
                    {event.newStage}
                  </span>
                  <span className="text-[11px] font-normal text-slate-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(event.timestamp).toLocaleString('es-AR')}
                  </span>
                </div>
                {event.notes && (
                  <p className="text-xs text-slate-600 mt-0.5 bg-slate-50 p-2 rounded border border-slate-100">
                    {event.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
