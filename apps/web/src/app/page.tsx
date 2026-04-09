'use client';

import { useLiveEvents } from '@/hooks/useLiveEvents';
import { useAppStore } from '@/store/useAppStore';
import dynamic from 'next/dynamic';
import { Globe, Radio, AlertTriangle, Activity } from 'lucide-react';

const PulseMap = dynamic(() => import('@/components/PulseMap'), { ssr: false });

const categories = [
  { id: null,    label: 'All',      icon: Globe },
  { id: 'NEWS',  label: 'News',     icon: Radio },
  { id: 'CYBER', label: 'Cyber',    icon: AlertTriangle },
  { id: 'FLIGHT',label: 'Aviation', icon: Activity },
];

export default function Page() {
  const { events } = useLiveEvents();
  const { selectedCategory, setCategory, selectedEventId, setSelectedEvent } = useAppStore();

  return (
    <div className="flex h-screen w-screen bg-gray-950 text-gray-100 overflow-hidden font-sans">
      <div className="w-80 flex flex-col border-r border-gray-800 bg-gray-900/50 z-10 shadow-2xl">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <h1 className="text-xl font-bold tracking-wider text-white">
              SENTINEL<span className="text-red-500">PULSE</span>
            </h1>
          </div>
          <p className="text-xs text-gray-400 mt-2 font-mono">REAL-TIME INTELLIGENCE</p>
        </div>
        <div className="p-4 border-b border-gray-800 flex gap-2 overflow-x-auto">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id ?? 'all'}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon size={14} />
                {cat.label}
              </button>
            );
          })}
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {events.length === 0 ? (
            <p className="text-center text-gray-500 mt-10 text-sm animate-pulse">
              Waiting for signal...
            </p>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event.id)}
                className={`p-4 rounded-lg border transition-all cursor-pointer hover:bg-gray-800/80 ${
                  selectedEventId === event.id
                    ? 'border-red-500/50 bg-gray-800'
                    : 'border-gray-800 bg-gray-900'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-mono text-gray-400 bg-gray-950 px-2 py-0.5 rounded">
                    {event.category}
                  </span>
                  <span className={`text-xs font-bold ${event.riskScore > 75 ? 'text-red-500' : 'text-yellow-500'}`}>
                    RSK: {event.riskScore?.toFixed(1)}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white leading-tight mb-1">{event.title}</h3>
                <p className="text-xs text-gray-400 line-clamp-2">{event.summary}</p>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="flex-1 relative">
        <PulseMap events={events} />
        <div className="absolute top-4 right-4 bg-gray-900/80 border border-gray-800 backdrop-blur px-4 py-2 rounded-md font-mono text-xs text-gray-300">
          ACTIVE EVENTS: {events.length}
        </div>
      </div>
    </div>
  );
}
