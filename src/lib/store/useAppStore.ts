// lib/store/useAppStore.ts
import { create } from 'zustand';

interface AppState {
  isSystemBooted: boolean; // เช็คว่าผ่านหน้า Terminal Intro หรือยัง
  isSummaryMode: boolean;  // เช็คว่าเปิดโหมดอ่านง่าย (Data Slate) อยู่ไหม
  currentPlanet: string | null; // เก็บ ID ของดาวที่กำลังโฟกัส
  focusedProjectId: string | null; // ID โปรเจกต์ในกลุ่ม Constellation ที่กำลังเปิดดู (sub-view)

  // Actions
  setSystemBooted: (status: boolean) => void;
  toggleSummaryMode: () => void;
  setSummaryMode: (open: boolean) => void;
  setCurrentPlanet: (planetId: string | null) => void;
  setFocusedProjectId: (projectId: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isSystemBooted: false,
  isSummaryMode: false,
  currentPlanet: null,
  focusedProjectId: null,

  setSystemBooted: (status) => set({ isSystemBooted: status }),
  toggleSummaryMode: () => set((state) => ({ isSummaryMode: !state.isSummaryMode })),
  setSummaryMode: (open) => set({ isSummaryMode: open }),
  setCurrentPlanet: (planetId) => set({ currentPlanet: planetId }),
  setFocusedProjectId: (projectId) => set({ focusedProjectId: projectId }),
}));