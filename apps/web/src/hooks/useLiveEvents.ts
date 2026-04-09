import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppStore, PulseEvent } from '@/store/useAppStore';

export type { PulseEvent };

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function useLiveEvents() {
  const selectedCategory = useAppStore((s) => s.selectedCategory);
  const setConnected = useAppStore((s) => s.setConnected);
  const queryClient = useQueryClient();

  const queryKey = ['events', selectedCategory] as const;

  const { data: events = [] } = useQuery<PulseEvent[]>({
    queryKey,
    queryFn: async () => {
      if (!API_URL) return [];
      try {
        const url = `${API_URL}/v1/events${selectedCategory ? '?category=' + selectedCategory : ''}`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const d = await res.json();
        return (d.events ?? []) as PulseEvent[];
      } catch {
        return [];
      }
    },
    retry: false,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  const connectedRef = useRef(false);
  useEffect(() => {
    if (!API_URL || connectedRef.current) return;
    connectedRef.current = true;

    const es = new EventSource(`${API_URL}/v1/stream`);
    es.onopen = () => setConnected(true);
    es.onerror = () => { setConnected(false); };
    es.onmessage = (e) => {
      try {
        const event: PulseEvent = JSON.parse(e.data);
        queryClient.setQueryData<PulseEvent[]>(queryKey, (old = []) =>
          [event, ...old.filter((x) => x.id !== event.id)]
        );
      } catch { /* ignore */ }
    };

    return () => { es.close(); connectedRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { events };
}
