'use client';

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useAppStore, type RemotePlayer } from '@/lib/store/useAppStore';
import { getPusherClient } from '@/lib/pusher/client';

// Re-export so existing imports (SceneCanvas) keep working unchanged.
export type { RemotePlayer };

const SYNC_INTERVAL_MS = 5_000;
const STALE_TIMEOUT_MS = 40_000;

function getOrCreateSessionId(): string {
  const KEY = 'cv-mp-session';
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

export function useMultiplayer() {
  const isSystemBooted = useAppStore((s) => s.isSystemBooted);
  const callsign = useAppStore((s) => s.callsign);
  const shipColorIndex = useAppStore((s) => s.shipColorIndex);
  const remotePlayers = useAppStore((s) => s.remotePlayers);
  const upsertRemotePlayer = useAppStore((s) => s.upsertRemotePlayer);
  const removeRemotePlayer = useAppStore((s) => s.removeRemotePlayer);
  const pruneRemotePlayers = useAppStore((s) => s.pruneRemotePlayers);
  const pathname = usePathname();

  // Stable refs — interval callbacks never capture stale closures
  const sessionIdRef = useRef('');
  const callsignRef = useRef(callsign);
  const pathnameRef = useRef(pathname);
  const colorIndexRef = useRef(shipColorIndex);

  useEffect(() => { callsignRef.current = callsign; }, [callsign]);
  useEffect(() => { pathnameRef.current = pathname; }, [pathname]);
  useEffect(() => { colorIndexRef.current = shipColorIndex; }, [shipColorIndex]);

  // Broadcast our current state to all other clients
  const sendSync = useCallback(async () => {
    if (!sessionIdRef.current) return;
    try {
      await fetch('/api/multiplayer/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          callsign: callsignRef.current,
          planet: pathnameRef.current,
          colorIndex: colorIndexRef.current,
        }),
      });
    } catch { /* non-critical */ }
  }, []);

  // Prune stale players via store action (avoids stale closure over remotePlayers)
  useEffect(() => {
    const id = setInterval(() => {
      pruneRemotePlayers(Date.now() - STALE_TIMEOUT_MS);
    }, 15_000);
    return () => clearInterval(id);
  }, [pruneRemotePlayers]);

  // Main real-time connection — runs once when the system boots
  useEffect(() => {
    if (!isSystemBooted) return;

    sessionIdRef.current = getOrCreateSessionId();

    const pusher = getPusherClient();
    if (!pusher) return; // Pusher not configured — feature degrades gracefully

    const channel = pusher.subscribe('multiplayer-radar');

    channel.bind(
      'player:update',
      (data: RemotePlayer & { timestamp: number }) => {
        if (data.sessionId === sessionIdRef.current) return; // ignore self
        upsertRemotePlayer({
          sessionId: data.sessionId,
          callsign: data.callsign,
          planet: data.planet,
          colorIndex: data.colorIndex ?? 0,
          lastSeen: data.timestamp ?? Date.now(),
        });
      },
    );

    channel.bind('player:leave', ({ sessionId }: { sessionId: string }) => {
      removeRemotePlayer(sessionId);
    });

    // Announce immediately, then heartbeat
    sendSync();
    const interval = setInterval(sendSync, SYNC_INTERVAL_MS);

    // Signal departure on tab close
    const onUnload = () => {
      const blob = new Blob(
        [JSON.stringify({ sessionId: sessionIdRef.current })],
        { type: 'application/json' },
      );
      navigator.sendBeacon('/api/multiplayer/leave', blob);
    };
    window.addEventListener('beforeunload', onUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', onUnload);
      channel.unbind_all();
      pusher.unsubscribe('multiplayer-radar');
    };
  }, [isSystemBooted, sendSync, upsertRemotePlayer, removeRemotePlayer]);

  // Re-announce whenever the visitor navigates to a different route
  useEffect(() => {
    if (!isSystemBooted || !sessionIdRef.current) return;
    sendSync();
  }, [pathname, isSystemBooted, sendSync]);

  return { remotePlayers };
}
