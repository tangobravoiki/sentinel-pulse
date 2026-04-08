import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/store/useAppStore';

export interface PulseEvent {
  id: string;
  category: string;
  title: string;
  summary: string;
  riskScore: number;
  lat: number;
  lon: number;
  metadata?: Record<string, string>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export function useLiveEvents() {
  const [live, setLive] = useState<PulseEvent[]>([]);
  const category = useAppStore((s) => s.selectedCategory);

  const { data: past = [] } = useQuery({
    queryKey: ['events', category],
    queryFn: async () => {
      try {
        const url = `${API_URL}/v1/events${category ? '?category=' + category : ''}`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const d = await res.json();
        return (d.events || []) as PulseEvent[];
      } catch { return []; }
    },
    retry: false,
  });

  const all = [...live, ...past];
  const unique = Array.from(new Map(all.map((item) => [item.id, item])).values());
  return { events: unique };
}
