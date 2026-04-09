import { create } from 'zustand';

export interface PulseEvent {
  id: string;
  category: string;
  title: string;
  summary: string;
  description?: string;
  riskScore: number;
  lat: number;
  lon: number;
  timestamp?: string;
  severity?: string;
  metadata?: Record<string, string>;
}

interface AppState {
  selectedCategory: string | null;
  selectedEventId: string | null;
  isConnected: boolean;
  setCategory: (category: string | null) => void;
  setSelectedEvent: (id: string | null) => void;
  setConnected: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedCategory: null,
  selectedEventId: null,
  isConnected: false,
  setCategory: (category) => set({ selectedCategory: category }),
  setSelectedEvent: (id) => set({ selectedEventId: id }),
  setConnected: (v) => set({ isConnected: v }),
}));
