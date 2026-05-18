'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store/useAppStore';

const bootSequence = [
  "> INITIATING GUEST PROTOCOL... [WELCOME]",
  "> ESTABLISHING SECURE CONNECTION...",
  "> PREPARING DATA ANALYSIS ENGINE...",
  "> SCANNING OPERATOR ARCHIVES: MONTHOL SUKJINDA...",
  "> EXTRACTING TELEMETRY: [OK]",
  "> COMPILING HOLOGRAPHIC INTERFACE...",
  "> SYSTEM AWAITING YOUR COMMAND.",
];

interface TerminalIntroProps {
  onLaunch: () => void;
}

interface GridPulse {
  id: string;
  type: 'h' | 'v';
  fixedPos: number;
  duration: number;
  length: number;
}

const CRYPTO_CHARS = "01X_Y7$@#%&+*<>[]?/\\FILE_SYSTEM_DECRYPT_0452";
const CALLSIGN_RE = /^[A-Z0-9_\-]{1,14}$/;

// All textures that will be needed immediately after launch — preloaded during
// the boot sequence so the first 3D frame has no decode stalls.
const PRELOAD_URLS = [
  '/textures/core_img.png',
  '/textures/me.png',
  '/textures/me2.png',
  '/textures/me3.png',
];

function preloadImages(urls: string[]): Promise<void> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve(); // never block on a missing file
          img.src = url;
        }),
    ),
  ).then(() => {});
}

export default function TerminalIntro({ onLaunch }: TerminalIntroProps) {
  const callsign = useAppStore((s) => s.callsign);
  const setCallsign = useAppStore((s) => s.setCallsign);

  const [lines, setLines] = useState<string[]>([]);
  const [showCallsign, setShowCallsign] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [draft, setDraft] = useState('');
  const [callsignError, setCallsignError] = useState('');
  const [pulses, setPulses] = useState<GridPulse[]>([]);
  const [assetsReady, setAssetsReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleLaunch = () => {
    if (isLaunching) return;
    setIsLaunching(true);
    setTimeout(onLaunch, 100);
  };

  const handleCallsignChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9_\-]/g, '');
    setDraft(val);
    setCallsignError('');
  };

  const confirmCallsign = () => {
    const value = draft.trim() || callsign;
    if (draft.trim() && !CALLSIGN_RE.test(draft.trim())) {
      setCallsignError('INVALID — USE A-Z, 0-9, - OR _  (MAX 14 CHARS)');
      return;
    }
    setCallsign(value);
    setShowButton(true);
  };

  const handleCallsignKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') confirmCallsign();
  };

  // Start preloading textures immediately — runs in parallel with the boot sequence
  useEffect(() => {
    preloadImages(PRELOAD_URLS).then(() => setAssetsReady(true));
  }, []);

  // Boot sequence line-by-line
  useEffect(() => {
    const interval = setInterval(() => {
      setLines((prev) => {
        const next = prev.length;
        if (next < bootSequence.length) return [...prev, bootSequence[next]];
        clearInterval(interval);
        setTimeout(() => setShowCallsign(true), 500);
        return prev;
      });
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // Focus callsign input when it appears
  useEffect(() => {
    if (showCallsign) setTimeout(() => inputRef.current?.focus(), 80);
  }, [showCallsign]);

  // Pulse streams
  useEffect(() => {
    if (isLaunching) { setPulses([]); return; }
    const spawn = () => {
      const id = Math.random().toString(36).slice(2, 9);
      const type: 'h' | 'v' = Math.random() > 0.4 ? 'v' : 'h';
      const fixedPos = Math.floor(Math.random() * 18 + 1) * 5;
      const duration = (1.5 + Math.random() * 2.0) * 3.0;
      const length = Math.floor(Math.random() * 8) + 5;
      const pulse: GridPulse = { id, type, fixedPos, duration, length };
      setPulses((prev) => [...prev, pulse]);
      setTimeout(() => setPulses((prev) => prev.filter((p) => p.id !== id)), duration * 1000);
    };
    const t = setInterval(() => { if (Math.random() > 0.25) spawn(); }, 400);
    return () => clearInterval(t);
  }, [isLaunching]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a] text-green-500 font-mono overflow-hidden pointer-events-auto will-change-transform"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{
        x: [0, -12, 12, -6, 8, -3, 4, 0],
        opacity: [1, 0.2, 0.8, 0.1, 0.9, 0.3, 0],
        filter: [
          'blur(0px) contrast(1) brightness(1)',
          'blur(3px) contrast(2) brightness(2)',
          'blur(1px) contrast(3) brightness(0.5)',
          'blur(6px) contrast(1.5) brightness(3)',
          'blur(16px) contrast(1) brightness(0)',
        ],
        transition: { duration: 0.6, times: [0, 0.15, 0.35, 0.6, 0.75, 0.9, 1], ease: 'linear' },
      }}
    >
      {/* Grid background */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: isLaunching ? 0.6 : 0.08 }}
        style={{
          backgroundImage:
            'linear-gradient(#00ff00 1px, transparent 1px), linear-gradient(90deg, #00ff00 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
        exit={{
          opacity: [0.1, 0.7, 0.3, 0],
          scale: [1, 1.1, 0.95, 1.3],
          transition: { duration: 0.5, ease: 'linear' },
        }}
      />

      {/* Random char streams */}
      {pulses.map((p) => <RandomCharStream key={p.id} pulse={p} />)}

      <div className="relative z-10 w-full max-w-2xl px-6 space-y-2">
        {/* Boot sequence lines */}
        {lines.map((line, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{
              x: i % 2 === 0 ? '-120%' : '120%',
              opacity: 0,
              filter: 'blur(6px)',
              transition: { duration: 0.45, ease: [0.36, 0, 0.66, -0.56] },
            }}
            className="text-sm md:text-base tracking-widest drop-shadow-[0_0_8px_rgba(0,255,0,0.8)]"
          >
            {line}
          </motion.div>
        ))}

        {/* ── Callsign input ── */}
        <AnimatePresence>
          {showCallsign && !showButton && (
            <motion.div
              key="callsign-block"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="mt-8 space-y-4"
            >
              {/* Prompt line */}
              <div className="text-sm md:text-base tracking-widest text-green-400 drop-shadow-[0_0_8px_rgba(0,255,0,0.8)]">
                {`> OPERATOR CALLSIGN REQUIRED FOR REGISTRY ENTRY...`}
              </div>

              <div className="flex items-stretch gap-2">
                {/* Prefix label */}
                <span className="flex items-center text-green-600 tracking-widest text-sm select-none pr-1">
                  CALLSIGN:
                </span>

                {/* Input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={draft}
                  onChange={handleCallsignChange}
                  onKeyDown={handleCallsignKeyDown}
                  maxLength={14}
                  placeholder={callsign}
                  className="flex-1 bg-transparent border border-green-500/50 px-3 py-2 text-green-300 text-sm tracking-[0.2em] placeholder:text-green-800 outline-none focus:border-green-400 focus:shadow-[0_0_12px_rgba(0,255,0,0.3)] transition-all caret-green-400"
                  spellCheck={false}
                  autoComplete="off"
                />

                {/* Confirm button */}
                <button
                  onClick={confirmCallsign}
                  className="px-4 py-2 border border-green-500 text-green-400 text-xs tracking-widest hover:bg-green-500/15 transition-all"
                >
                  CONFIRM
                </button>
              </div>

              {/* Error or hint */}
              {callsignError ? (
                <p className="text-red-500 text-xs tracking-wider">{`> ERROR: ${callsignError}`}</p>
              ) : (
                <p className="text-green-800 text-xs tracking-wider">
                  {`> LEAVE BLANK TO USE AUTO-GENERATED CALLSIGN [${callsign}]`}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Launch button ── */}
        <AnimatePresence>
          {showButton && (
            <motion.div
              key="launch-block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
              className="mt-6 space-y-3"
            >
              {/* Confirmed callsign echo */}
              <div className="text-sm tracking-widest text-green-400 drop-shadow-[0_0_8px_rgba(0,255,0,0.6)]">
                {`> CALLSIGN CONFIRMED: [${callsign}]`}
              </div>
              <div className="text-sm tracking-widest text-green-600">
                {`> MULTIPLAYER REGISTRY: ONLINE`}
              </div>

              {/* Asset warm-up status — only visible on very slow connections */}
              {!assetsReady && (
                <div className="text-xs tracking-widest text-green-700 animate-pulse">
                  {`> WARMING UP SUBSYSTEMS... PLEASE STAND BY`}
                </div>
              )}
              {assetsReady && (
                <div className="text-xs tracking-widest text-green-600">
                  {`> ASSETS LOADED — ALL SYSTEMS GO`}
                </div>
              )}

              <div className="flex justify-center pt-4">
                <button
                  onClick={handleLaunch}
                  disabled={isLaunching || !assetsReady}
                  className="group relative px-8 py-3 border border-green-500 bg-transparent text-green-500 font-bold tracking-widest uppercase transition-all duration-300 hover:bg-green-500 hover:text-black hover:shadow-[0_0_20px_rgba(0,255,0,0.6)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-green-500 disabled:hover:shadow-none"
                >
                  <span className="relative z-10">
                    {isLaunching ? '[ DECRYPTING CORE... ]' : !assetsReady ? '[ LOADING... ]' : '[ INITIALIZE SYSTEM ]'}
                  </span>
                  <div className="absolute inset-0 bg-green-400 opacity-0 group-hover:opacity-20 group-hover:animate-pulse pointer-events-none" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function RandomCharStream({ pulse }: { pulse: GridPulse }) {
  const [streamText, setStreamText] = useState('');
  useEffect(() => {
    const gen = () => {
      let s = '';
      for (let i = 0; i < pulse.length; i++) {
        s += CRYPTO_CHARS[Math.floor(Math.random() * CRYPTO_CHARS.length)];
      }
      setStreamText(s);
    };
    gen();
    const t = setInterval(gen, 100);
    return () => clearInterval(t);
  }, [pulse.length]);

  return (
    <motion.div
      className="absolute pointer-events-none z-0 font-mono text-green-400/25 whitespace-nowrap select-none drop-shadow-[0_0_6px_rgba(0,255,102,0.4)]"
      style={{
        top: pulse.type === 'h' ? `${pulse.fixedPos}%` : 0,
        left: pulse.type === 'v' ? `${pulse.fixedPos}%` : 0,
        writingMode: pulse.type === 'v' ? 'vertical-lr' : 'horizontal-tb',
        letterSpacing: '0.25em',
      }}
      initial={pulse.type === 'h' ? { left: '-45%' } : { top: '-45%' }}
      animate={pulse.type === 'h' ? { left: '135%' } : { top: '135%' }}
      transition={{ duration: pulse.duration, ease: 'linear' }}
    >
      {streamText}
    </motion.div>
  );
}
