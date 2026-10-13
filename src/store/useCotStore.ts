import { create } from 'zustand';

interface CotStore {
  cotStream: string;
  setCot: (text: string) => void;
  clearCot: () => void;
}

export const useCotStore = create<CotStore>((set) => ({
  cotStream: "",
  setCot: (text) => set({ cotStream: text }),
  clearCot: () => set({ cotStream: "" }),
}));