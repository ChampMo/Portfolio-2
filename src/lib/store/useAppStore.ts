import { create } from 'zustand';
import { PRESET_COUNT } from '@/lib/3d/shipColors';

const CALLSIGN_PREFIXES = ['NOVA', 'ORION', 'VEGA', 'SIRIUS', 'CYGNUS', 'LYRA', 'DRACO', 'ALTAIR'];

function generateCallsign(): string {
  const prefix = CALLSIGN_PREFIXES[Math.floor(Math.random() * CALLSIGN_PREFIXES.length)];
  const suffix = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}-${suffix}`;
}

// Exported so useMultiplayer and SceneCanvas can import the type without
// creating a circular dependency (they both import from this module already).
export interface RemotePlayer {
  sessionId: string;
  callsign: string;
  planet: string;
  colorIndex: number;
  lastSeen: number;
}

interface AppState {
  isSystemBooted: boolean;
  isSummaryMode: boolean;
  isAdminAuthed: boolean;
  currentPlanet: string | null;
  focusedProjectId: string | null;
  callsign: string;
  shipColorIndex: number;
  remotePlayers: RemotePlayer[];

  setSystemBooted: (status: boolean) => void;
  setAdminAuthed: (v: boolean) => void;
  toggleSummaryMode: () => void;
  setSummaryMode: (open: boolean) => void;
  setCurrentPlanet: (planetId: string | null) => void;
  setFocusedProjectId: (projectId: string | null) => void;
  setCallsign: (callsign: string) => void;

  // Multiplayer player registry — functional update variants live in the store
  // so closures in useMultiplayer intervals always see current state.
  upsertRemotePlayer: (player: RemotePlayer) => void;
  removeRemotePlayer: (sessionId: string) => void;
  pruneRemotePlayers: (cutoff: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isSystemBooted: false,
  isSummaryMode: false,
  isAdminAuthed: false,
  currentPlanet: null,
  focusedProjectId: null,
  callsign: generateCallsign(),
  shipColorIndex: Math.floor(Math.random() * PRESET_COUNT),
  remotePlayers: [],

  setSystemBooted: (status) => set({ isSystemBooted: status }),
  setAdminAuthed: (v) => set({ isAdminAuthed: v }),
  toggleSummaryMode: () => set((state) => ({ isSummaryMode: !state.isSummaryMode })),
  setSummaryMode: (open) => set({ isSummaryMode: open }),
  setCurrentPlanet: (planetId) => set({ currentPlanet: planetId }),
  setFocusedProjectId: (projectId) => set({ focusedProjectId: projectId }),
  setCallsign: (callsign) => set({ callsign }),

  upsertRemotePlayer: (player) =>
    set((state) => ({
      remotePlayers: state.remotePlayers.some((p) => p.sessionId === player.sessionId)
        ? state.remotePlayers.map((p) => (p.sessionId === player.sessionId ? player : p))
        : [...state.remotePlayers, player],
    })),

  removeRemotePlayer: (sessionId) =>
    set((state) => ({
      remotePlayers: state.remotePlayers.filter((p) => p.sessionId !== sessionId),
    })),

  pruneRemotePlayers: (cutoff) =>
    set((state) => ({
      remotePlayers: state.remotePlayers.filter((p) => p.lastSeen > cutoff),
    })),
}));
