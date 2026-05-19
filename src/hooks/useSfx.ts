'use client';

import { useCallback } from 'react';
import { audioManager, type SfxKey } from '@/lib/audio/audioManager';

/**
 * Lightweight hook — call from any component that needs to trigger sounds.
 * Does NOT set up any effects; all global init/BGM/volume sync is in SoundManagerInit.
 *
 * Usage:
 *   const { playClick, playTransition } = useSfx();
 *   <button onClick={playClick}>...</button>
 */
export function useSfx() {
  return {
    playClick:        useCallback(() => audioManager.playClick(),        []),
    playSettingClick: useCallback(() => audioManager.playSettingClick(), []),
    playAlert:        useCallback(() => audioManager.playAlert(),        []),
    playDataSlate:    useCallback(() => audioManager.playDataSlate(),    []),
    playMove:         useCallback(() => audioManager.playMove(),         []),
    playTransition:   useCallback(() => audioManager.playTransition(),   []),
    playSfx:          useCallback((key: SfxKey, vol?: number) => audioManager.playSfx(key, vol), []),
  };
}
