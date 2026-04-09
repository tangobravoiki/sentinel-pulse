import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppStore, PulseEvent } from '@/store/useAppStore';

export type { PulseEvent };

const API_BASE = '/api/v1';

export function useLiveEvents() {
  const selectedCategory = useAppStore((s) => s.selectedCategory);
  const setConnected = useAppStore((s) => s.setConnected);
  const queryClient = useQueryClient();

  const queryKey = ['events', selectedCategory] as const;

  const { data: events = [] } = useQuery<PulseEvent[]>({
    queryKey,
    queryFn: async () => {
      try {
        const url = `${API_BASE}/events${selectedCategory ? '?category=' + selectedCategory : ''}`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const d = await res.json();
        return (d.events ?? []) as PulseEvent[];
      } catch {
        return [];
      }
    },
    retry: 2,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  const connectedRef = useRef(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (connectedRef.current) return;
    connectedRef.current = true;

    let es: EventSource | null = null;

    const connect = () => {
      es = new EventSource(`${API_BASE}/stream`);

      es.onopen = () => setConnected(true);

      es.onerror = () => {
        setConnected(false);
        es?.close();
        setTimeout(connect, 30_000);
      };

      es.onmessage = (e) => {
        if (e.data.startsWith(':')) return;
        try {
          const event: PulseEvent = JSON.parse(e.data);
          queryClient.setQueryData<PulseEvent[]>(queryKey, (old = []) =>
            [event, ...old.filter((x) => x.id !== event.id)]
          );
        } catch { /* ignore */ }
      };
    };

    connect();

    return () => {
      es?.close();
      connectedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { events };
}
