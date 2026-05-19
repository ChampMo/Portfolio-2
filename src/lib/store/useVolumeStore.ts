import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface VolumeState {
  volume: number;    // 0–100
  isMuted: boolean;
  setVolume: (v: number) => void;
  toggleMute: () => void;
}

export const useVolumeStore = create<VolumeState>()(
  persist(
    (set) => ({
      volume: 70,
      isMuted: false,
      setVolume: (v) => set({ volume: Math.max(0, Math.min(100, v)), isMuted: false }),
      toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
    }),
    { name: 'portfolio-volume' }
  )
);
