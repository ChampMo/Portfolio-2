'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const bootSequence = [
  "> INITIATING GUEST PROTOCOL... [WELCOME]",
  "> ESTABLISHING SECURE CONNECTION...",
  "> PREPARING DATA ANALYSIS ENGINE...",
  "> SCANNING OPERATOR ARCHIVES: MONTHOL SUKJINDA...",
  "> EXTRACTING TELEMETRY: [OK]",
  "> COMPILING HOLOGRAPHIC INTERFACE...",
  "> SYSTEM AWAITING YOUR COMMAND."
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

export default function TerminalIntro({ onLaunch }: TerminalIntroProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [showButton, setShowButton] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [pulses, setPulses] = useState<GridPulse[]>([]);

  const handleLaunch = () => {
    if (isLaunching) return;
    setIsLaunching(true);
    setTimeout(onLaunch, 100); 
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setLines((prev) => {
        const nextIndex = prev.length;
        if (nextIndex < bootSequence.length) {
          return [...prev, bootSequence[nextIndex]];
        } 
        clearInterval(interval);
        setTimeout(() => setShowButton(true), 500);
        return prev;
      });
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // 🌟 วงจรปั๊มตัวอักษรวิ่งสุ่ม
  useEffect(() => {
    if (isLaunching) {
      setPulses([]); 
      return;
    }

    const spawnPulse = () => {
      const id = Math.random().toString(36).substring(2, 9);
      const type = Math.random() > 0.4 ? 'v' : 'h'; 
      const fixedPos = Math.floor(Math.random() * 18 + 1) * 5; 
      
      // 🌟 [FIXED] คูณ 2.0 ช้าลงตั้งแต่ต้นขั้วข้อมูล เพื่อให้ระบบจับเวลาลบทำงานสัมพันธ์กัน
      const duration = (1.5 + Math.random() * 2.0) * 3.0;
      const length = Math.floor(Math.random() * 8) + 5; // ล็อกความยาว 5-12 ตัวตั้งแต่เกิด

      const newPulse: GridPulse = { id, type, fixedPos, duration, length };
      setPulses((prev) => [...prev, newPulse]);

      // ตอนนี้เวลาลบข้อมูลจะพอดีกับเวลาที่อนิเมชันวิ่งสุดขอบจอเป๊ะๆ
      setTimeout(() => {
        setPulses((prev) => prev.filter((p) => p.id !== id));
      }, duration * 1000);
    };

    const pulseTimer = setInterval(() => {
      if (Math.random() > 0.25) spawnPulse();
    }, 400);

    return () => clearInterval(pulseTimer);
  }, [isLaunching]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a] text-green-500 font-mono overflow-hidden pointer-events-auto will-change-transform"
      initial={{ opacity: 1, x: 0, filter: 'blur(0px) contrast(1)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px) contrast(1)' }}
      exit={{
        x: [0, -12, 12, -6, 8, -3, 4, 0], 
        opacity: [1, 0.2, 0.8, 0.1, 0.9, 0.3, 0], 
        filter: [
          'blur(0px) contrast(1) brightness(1)',
          'blur(3px) contrast(2) brightness(2)',
          'blur(1px) contrast(3) brightness(0.5)',
          'blur(6px) contrast(1.5) brightness(3)',
          'blur(16px) contrast(1) brightness(0)' 
        ],
        transition: { duration: 0.6, times: [0, 0.15, 0.35, 0.6, 0.75, 0.9, 1], ease: 'linear' },
      }}
    >
      {/* Radar grid */}
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
          transition: { duration: 0.5, ease: 'linear' }
        }}
      />

      {/* RANDOM CHARACTER TELEMETRY STREAMS */}
      {pulses.map((p) => (
        <RandomCharStream key={p.id} pulse={p} />
      ))}

      <div className="relative z-10 w-full max-w-2xl px-6 space-y-2">
        {lines.map((line, index) => {
          const isEven = index % 2 === 0;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{
                x: isEven ? '-120%' : '120%',
                opacity: 0,
                filter: 'blur(6px)',
                transition: { duration: 0.45, ease: [0.36, 0, 0.66, -0.56] } 
              }}
              className="text-sm md:text-base tracking-widest drop-shadow-[0_0_8px_rgba(0,255,0,0.8)]"
            >
              {line}
            </motion.div>
          );
        })}

        <AnimatePresence>
          {showButton && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }} 
              className="mt-12 flex justify-center"
            >
              <button
                onClick={handleLaunch}
                disabled={isLaunching}
                className="group relative px-8 py-3 border border-green-500 bg-transparent text-green-500 font-bold tracking-widest uppercase transition-all duration-300 hover:bg-green-500 hover:text-black hover:shadow-[0_0_20px_rgba(0,255,0,0.6)] disabled:bg-green-500 disabled:text-black disabled:shadow-[0_0_30px_rgba(0,255,0,0.8)]"
              >
                <span className="relative z-10">
                  {isLaunching ? '[ DECRYPTING CORE... ]' : '[ INITIALIZE SYSTEM ]'}
                </span>
                <div className="absolute inset-0 bg-green-400 opacity-0 group-hover:opacity-20 group-hover:animate-pulse pointer-events-none" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// 🌟 ตัวรับข้อมูลสุ่มวิ่งแบบล็อกความยาวและสปีดที่สัมพันธ์กัน
function RandomCharStream({ pulse }: { pulse: GridPulse }) {
  const [streamText, setStreamText] = useState('');

  useEffect(() => {
    const generateText = () => {
      let result = '';
      for (let i = 0; i < pulse.length; i++) {
        result += CRYPTO_CHARS[Math.floor(Math.random() * CRYPTO_CHARS.length)];
      }
      setStreamText(result);
    };

    generateText();
    const textInterval = setInterval(generateText, 100); 

    return () => clearInterval(textInterval);
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
      // 🌟 ขยายระยะเผื่อเริ่มต้น/จุดจบ ให้วิ่งทะลุมิติพ้นขอบจอไปเลยเนียนๆ
      initial={pulse.type === 'h' ? { left: '-45%' } : { top: '-45%' }}
      animate={pulse.type === 'h' ? { left: '135%' } : { top: '135%' }}
      transition={{ duration: pulse.duration, ease: 'linear' }}
    >
      {streamText}
    </motion.div>
  );
}