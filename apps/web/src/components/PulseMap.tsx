'use client';
import Map, { Marker, NavigationControl } from '@vis.gl/react-maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { PulseEvent } from '@/hooks/useLiveEvents';
import { useAppStore } from '@/store/useAppStore';
import { Plane } from 'lucide-react';

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

const getColor = (cat: string) => ({ NEWS: '#3b82f6', FLIGHT: '#eab308', CYBER: '#ef4444' }[cat] || '#10b981');

export default function PulseMap({ events }: { events: PulseEvent[] }) {
  const setSelectedEvent = useAppStore((s) => s.setSelectedEvent);
  return (
    <Map initialViewState={{ longitude: 35.0, latitude: 39.0, zoom: 4.5 }}
      style={{ width: '100%', height: '100%' }} mapStyle={MAP_STYLE}>
      <NavigationControl position="bottom-right" />
      {events.map((event) => {
        if (!event.lat || !event.lon) return null;
        const isFlight = event.category === 'FLIGHT';
        const heading = isFlight && event.metadata?.heading ? parseFloat(event.metadata.heading) : 0;
        return (
          <Marker key={event.id} longitude={event.lon} latitude={event.lat} anchor="center"
            onClick={(e) => { e.originalEvent.stopPropagation(); setSelectedEvent(event.id); }}>
            <div className="relative flex items-center justify-center cursor-pointer group">
              {isFlight ? (
                <div style={{ transform: 'rotate(' + heading + 'deg)' }}
                  className="text-yellow-500">
                  <Plane size={20} fill="currentColor" />
                </div>
              ) : (
                <>
                  <div className="absolute w-6 h-6 rounded-full animate-ping opacity-75"
                    style={{ backgroundColor: getColor(event.category) }} />
                  <div className="relative w-3 h-3 rounded-full"
                    style={{ backgroundColor: getColor(event.category) }} />
                </>
              )}
              <div className="absolute bottom-full mb-2 hidden group-hover:block whitespace-nowrap bg-gray-900 text-white text-xs px-2 py-1 rounded z-50">
                {event.title}
              </div>
            </div>
          </Marker>
        );
      })}
    </Map>
  );
}
