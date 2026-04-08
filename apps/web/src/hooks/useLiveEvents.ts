import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore, PulseEvent } from '@/store/useAppStore';

export type { PulseEvent };

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function useLiveEvents() {
  const { selectedCategory, setEvents, setConnected } = useAppStore();

  const { data: events = [] } = useQuery({
    queryKey: ['events', selectedCategory],
    queryFn: async () => {
      try {
        const url = `${API_URL}/v1/events${selectedCategory ? '?category=' + selectedCategory : ''}`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const d = await res.json();
        return (d.events || []) as PulseEvent[];
      } catch {
        return [];
      }
    },
    retry: false,
    refetchInterval: 30000,
  });

  useEffect(() => {
    setEvents(events);
  }, [events, setEvents]);

  useEffect(() => {
    if (!API_URL) return;
    let es: EventSource | null = null;
    try {
      es = new EventSource(`${API_URL}/v1/stream`);
      es.onopen = () => setConnected(true);
      es.onerror = () => setConnected(false);
      es.onmessage = (e) => {
        try {
          const event: PulseEvent = JSON.parse(e.data);
          useAppStore.setState((s) => ({
            events: [event, ...s.events.filter((x) => x.id !== event.id)],
          }));
        } catch { /* ignore parse errors */ }
      };
    } catch { /* SSE not available */ }
    return () => { es?.close(); };
  }, [setConnected]);

  return { events };
}
