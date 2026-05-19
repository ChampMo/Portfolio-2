// Singleton audio manager — lives outside React, one instance per browser tab.
// Do not import React here.

export type BgmKey = 'main' | 'admin';

export type SfxKey =
  | 'alert'
  | 'logup'
  | 'move'
  | 'normalclick'
  | 'settingclick'
  | 'transition';

const BGM_SRCS: Record<BgmKey, string> = {
  main:  '/sounds/soundeffects/bgm.mp3',
  admin: '/sounds/soundeffects/adminbgm.mp3',
};

const SFX_SRCS: Record<SfxKey, string> = {
  alert:        '/sounds/soundeffects/alert.mp3',
  logup:        '/sounds/soundeffects/logup.ogg',
  move:         '/sounds/soundeffects/move.m4a',
  normalclick:  '/sounds/soundeffects/normalclick.mp3',
  settingclick: '/sounds/soundeffects/settingclick.mp3',
  transition:   '/sounds/soundeffects/transitionpage.mp3',
};

const POOL_SIZE = 3;    // max overlapping plays per SFX
const BGM_VOL   = 0.55; // BGM ceiling relative to master volume
const FADE_MS   = 1200; // BGM crossfade duration

class AudioManager {
  private _bgm:       Partial<Record<BgmKey, HTMLAudioElement>> = {};
  private _activeBgm: BgmKey | null = null;
  private _pool:      Partial<Record<SfxKey, HTMLAudioElement[]>> = {};
  private _poolIdx:   Partial<Record<SfxKey, number>> = {};

  private _vol      = 0.7;   // master 0–1
  private _muted    = false;
  private _unlocked = false;  // true after first user interaction
  private _pendingBgm: BgmKey | null = null;
  private _pendingSfx: SfxKey | null = null; // single SFX queued to play on unlock
  private _ready    = false;

  // ── Init (call once, client-side) ──────────────────────────────────────────

  init() {
    if (this._ready || typeof window === 'undefined') return;
    this._ready = true;

    for (const key of Object.keys(BGM_SRCS) as BgmKey[]) {
      const a    = new Audio(BGM_SRCS[key]);
      a.loop     = true;
      a.volume   = 0;
      a.preload  = 'metadata';
      this._bgm[key] = a;
    }

    for (const key of Object.keys(SFX_SRCS) as SfxKey[]) {
      this._pool[key] = Array.from({ length: POOL_SIZE }, (_, i) => {
        const a  = new Audio(SFX_SRCS[key]);
        a.preload = i === 0 ? 'auto' : 'none';
        return a;
      });
      this._poolIdx[key] = 0;
    }
  }

  // ── Autoplay unlock (call on first user interaction) ───────────────────────

  unlock() {
    if (this._unlocked) return;
    this._unlocked = true;
    if (this._pendingBgm) {
      this._startBgm(this._pendingBgm);
      this._pendingBgm = null;
    }
    if (this._pendingSfx) {
      this.playSfx(this._pendingSfx);
      this._pendingSfx = null;
    }
  }

  // Queue a one-shot SFX to fire at the moment of first user interaction.
  // If already unlocked, plays immediately.
  playOnUnlock(key: SfxKey) {
    if (this._unlocked) { this.playSfx(key); return; }
    this._pendingSfx = key;
  }

  // ── Volume / Mute sync ─────────────────────────────────────────────────────

  setVolume(volume: number, muted: boolean) {
    this._vol   = volume / 100;
    this._muted = muted;
    const el    = this._activeBgm ? this._bgm[this._activeBgm] : null;
    if (el) el.volume = muted ? 0 : this._vol * BGM_VOL;
  }

  // ── BGM ────────────────────────────────────────────────────────────────────

  playBgm(key: BgmKey) {
    if (this._activeBgm === key) return;

    if (!this._unlocked) {
      this._pendingBgm = key;
      return;
    }

    const prevEl = this._activeBgm ? this._bgm[this._activeBgm] : null;
    if (prevEl) {
      this._fade(prevEl, prevEl.volume, 0, FADE_MS, () => {
        prevEl.pause();
        prevEl.currentTime = 0;
        this._startBgm(key);
      });
    } else {
      this._startBgm(key);
    }
  }

  stopBgm() {
    const el  = this._activeBgm ? this._bgm[this._activeBgm] : null;
    const was = this._activeBgm;
    if (!el) return;
    this._fade(el, el.volume, 0, FADE_MS, () => {
      el.pause();
      el.currentTime = 0;
      if (this._activeBgm === was) this._activeBgm = null;
    });
  }

  // ── SFX ────────────────────────────────────────────────────────────────────

  playSfx(key: SfxKey, volMultiplier = 1) {
    if (this._muted || !this._unlocked) return;
    const pool = this._pool[key];
    if (!pool?.length) return;

    const i            = this._poolIdx[key] ?? 0;
    this._poolIdx[key] = (i + 1) % POOL_SIZE;

    const a       = pool[i];
    a.volume      = Math.min(1, this._vol * volMultiplier);
    a.currentTime = 0;
    a.play().catch(() => {});
  }

  // ── Named shortcuts (use these in components) ──────────────────────────────

  playClick()        { this.playSfx('normalclick'); }
  playSettingClick() { this.playSfx('settingclick'); }
  playAlert()        { this.playSfx('alert'); }
  playDataSlate()    { this.playSfx('logup'); }
  playMove()         { this.playSfx('move'); }
  playTransition()   { this.playSfx('transition'); }

  // Play an SFX once and invoke onEnd when it finishes (or immediately on error).
  playWithCallback(key: SfxKey, onEnd: () => void, volMultiplier = 1) {
    if (this._muted || !this._unlocked) { onEnd(); return; }
    const pool = this._pool[key];
    if (!pool?.length) { onEnd(); return; }

    const i            = this._poolIdx[key] ?? 0;
    this._poolIdx[key] = (i + 1) % POOL_SIZE;

    const a       = pool[i];
    a.volume      = Math.max(0, Math.min(1, this._vol * volMultiplier));
    a.currentTime = 0;

    const cleanup = () => { a.onended = null; a.onerror = null; };
    a.onended = () => { cleanup(); onEnd(); };
    a.onerror = () => { cleanup(); onEnd(); };

    a.play().catch(() => { cleanup(); onEnd(); });
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private _startBgm(key: BgmKey) {
    const el = this._bgm[key];
    if (!el) return;
    this._activeBgm  = key;
    el.currentTime   = 0;
    el.volume        = 0;
    el.play().catch(() => {});
    this._fade(el, 0, this._muted ? 0 : this._vol * BGM_VOL, FADE_MS);
  }

  private _fade(
    audio:  HTMLAudioElement,
    from:   number,
    to:     number,
    ms:     number,
    onDone?: () => void,
  ) {
    const start = performance.now();
    const tick  = (now: number) => {
      const t      = Math.min((now - start) / ms, 1);
      audio.volume = Math.max(0, Math.min(1, from + (to - from) * t));
      if (t < 1) requestAnimationFrame(tick);
      else       onDone?.();
    };
    requestAnimationFrame(tick);
  }
}

export const audioManager = new AudioManager();
