'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useVolumeStore } from '@/lib/store/useVolumeStore';
import { useAppStore } from '@/lib/store/useAppStore';
import { audioManager } from '@/lib/audio/audioManager';

/**
 * Renders nothing. Mount once in the root layout.
 * Responsibilities:
 *  - Init audio manager (browser-side only)
 *  - Register autoplay-unlock listeners on first user interaction
 *  - Sync volume/mute from useVolumeStore → audioManager
 *  - Switch BGM track when route changes (main ↔ admin)
 */
export default function SoundManagerInit() {
  const volume       = useVolumeStore((s) => s.volume);
  const isMuted      = useVolumeStore((s) => s.isMuted);
  const isAdminAuthed = useAppStore((s) => s.isAdminAuthed);
  const pathname = usePathname();

  // Init + autoplay unlock listeners (run once on mount)
  useEffect(() => {
    audioManager.init();

    const unlock = () => audioManager.unlock();
    window.addEventListener('click',      unlock, { once: true });
    window.addEventListener('keydown',    unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });

    return () => {
      window.removeEventListener('click',      unlock);
      window.removeEventListener('keydown',    unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  // Sync volume/mute whenever store changes
  useEffect(() => {
    audioManager.setVolume(volume, isMuted);
  }, [volume, isMuted]);

  // Switch BGM track on route change.
  // Skip intro (handled by playWithCallback in TerminalIntro).
  // Skip admin routes until AdminAuthGate confirms authentication.
  useEffect(() => {
    if (pathname === '/') return;
    if (pathname.startsWith('/admin') && !isAdminAuthed) return;
    audioManager.playBgm(pathname.startsWith('/admin') ? 'admin' : 'main');
  }, [pathname, isAdminAuthed]);

  return null;
}
