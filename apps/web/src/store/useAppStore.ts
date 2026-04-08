import { create } from 'zustand';

interface AppState {
  selectedCategory: string | null;
  selectedEventId: string | null;
  setCategory: (category: string | null) => void;
  setSelectedEvent: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedCategory: null,
  selectedEventId: null,
  setCategory: (category) => set({ selectedCategory: category }),
  setSelectedEvent: (id) => set({ selectedEventId: id }),
}));
