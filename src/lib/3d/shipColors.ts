export interface ShipColorPreset {
  name: string;
  hull: string;
  emissiveHull: string;
  accent: string;
  emissiveAccent: string;
  cockpit: string;
  thrusterA: string;
  thrusterB: string;
  beamA: string;
  beamB: string;
}

export const SHIP_COLOR_PRESETS: readonly ShipColorPreset[] = [
  {
    name: 'ELECTRIC CYAN',
    hull: '#0b0f1a', emissiveHull: '#0a1e3a',
    accent: '#0e2244', emissiveAccent: '#0d4898',
    cockpit: '#38bdf8',
    thrusterA: '#22d3ee', thrusterB: '#d946ef',
    beamA: '#22d3ee', beamB: '#d946ef',
  },
  {
    name: 'CYBERPUNK FUCHSIA',
    hull: '#1a0b14', emissiveHull: '#3a0a20',
    accent: '#2d0e24', emissiveAccent: '#780d50',
    cockpit: '#f472b6',
    thrusterA: '#ec4899', thrusterB: '#a855f7',
    beamA: '#ec4899', beamB: '#a855f7',
  },
  {
    name: 'QUANTUM EMERALD',
    hull: '#0a1a0e', emissiveHull: '#0a3a1a',
    accent: '#0e2d18', emissiveAccent: '#0a6030',
    cockpit: '#6ee7b7',
    thrusterA: '#10b981', thrusterB: '#34d399',
    beamA: '#10b981', beamB: '#34d399',
  },
  {
    name: 'VOLT ORANGE',
    hull: '#1a100b', emissiveHull: '#3a1a08',
    accent: '#2d1a0e', emissiveAccent: '#7c3810',
    cockpit: '#fcd34d',
    thrusterA: '#f59e0b', thrusterB: '#f97316',
    beamA: '#f59e0b', beamB: '#fb923c',
  },
  {
    name: 'PLASMA PURPLE',
    hull: '#110b1a', emissiveHull: '#1e0a3a',
    accent: '#1e0e2d', emissiveAccent: '#4a0d78',
    cockpit: '#c084fc',
    thrusterA: '#a855f7', thrusterB: '#7c3aed',
    beamA: '#a855f7', beamB: '#7c3aed',
  },
] as const;

export const PRESET_COUNT = SHIP_COLOR_PRESETS.length;
