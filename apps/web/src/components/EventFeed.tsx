'use client';

import { useAppStore } from '@/store/useAppStore';
import { useLiveEvents } from '@/hooks/useLiveEvents';
import { AlertTriangle, Plane, Shield, Zap } from 'lucide-react';

const categoryIcons: Record<string, React.ReactNode> = {
  conflict: <AlertTriangle className="w-4 h-4 text-red-400" />,
  NEWS:     <AlertTriangle className="w-4 h-4 text-red-400" />,
  aviation: <Plane className="w-4 h-4 text-yellow-400" />,
  FLIGHT:   <Plane className="w-4 h-4 text-yellow-400" />,
  cyber:    <Shield className="w-4 h-4 text-blue-400" />,
  CYBER:    <Shield className="w-4 h-4 text-blue-400" />,
  disaster: <Zap className="w-4 h-4 text-orange-400" />,
};

const categoryColors: Record<string, string> = {
  conflict: 'border-red-500/30 bg-red-500/5',
  NEWS:     'border-red-500/30 bg-red-500/5',
  aviation: 'border-yellow-500/30 bg-yellow-500/5',
  FLIGHT:   'border-yellow-500/30 bg-yellow-500/5',
  cyber:    'border-blue-500/30 bg-blue-500/5',
  CYBER:    'border-blue-500/30 bg-blue-500/5',
  disaster: 'border-orange-500/30 bg-orange-500/5',
};

export default function EventFeed() {
  const { events } = useLiveEvents();
  const { selectedEventId, setSelectedEvent } = useAppStore();

  const sorted = [...events].sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return tb - ta;
  });

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-white/10">
        <h2 className="text-sm font-semibold text-white/80 uppercase tracking-widest">
          Live Feed
        </h2>
        <p className="text-xs text-white/40 mt-0.5">{events.length} events</p>
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 p-2">
        {sorted.map((event) => (
          <button
            key={event.id}
            onClick={() => setSelectedEvent(event.id)}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
              categoryColors[event.category] ?? 'border-white/10 bg-white/5'
            } ${
              selectedEventId === event.id
                ? 'ring-1 ring-white/30'
                : 'hover:ring-1 hover:ring-white/20'
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0">
                {categoryIcons[event.category] ?? (
                  <span className="w-4 h-4 rounded-full bg-white/20 inline-block" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{event.title}</p>
                <p className="text-xs text-white/50 mt-0.5 line-clamp-2">
                  {event.description ?? event.summary}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {event.timestamp && (
                    <span className="text-xs text-white/30">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                  {event.severity && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-white/10 text-white/60">
                      {event.severity}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
        {events.length === 0 && (
          <div className="flex items-center justify-center h-32 text-white/30 text-sm">
            Waiting for events...
          </div>
        )}
      </div>
    </div>
  );
}
