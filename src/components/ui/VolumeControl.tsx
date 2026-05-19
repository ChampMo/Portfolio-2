'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, Volume1 } from 'lucide-react';
import { useThemeStore } from '@/lib/store/useThemeStore';
import { useVolumeStore } from '@/lib/store/useVolumeStore';
import { useAppStore } from '@/lib/store/useAppStore';
import { usePathname } from 'next/navigation';
import { useSfx } from '@/hooks/useSfx';

export default function VolumeControl({ className = '' }: { className?: string }) {
  const volume = useVolumeStore((s) => s.volume);
  const isMuted = useVolumeStore((s) => s.isMuted);
  const setVolume = useVolumeStore((s) => s.setVolume);
  const toggleMute = useVolumeStore((s) => s.toggleMute);
  const theme = useThemeStore((s) => s.theme);
  const isSystemBooted = useAppStore((s) => s.isSystemBooted);
  const pathname = usePathname();
  const isLight = theme === 'light';

  const { playSettingClick } = useSfx();

  const [expanded, setExpanded] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  const isOnIntro = pathname === '/' && !isSystemBooted;
  const isAdmin = pathname?.startsWith('/admin');

  const effectiveVolume = isMuted ? 0 : volume;

  if (!hydrated || isOnIntro || isAdmin) return null;

  // 🌟 ปรับ Radius ให้ใหญ่ขึ้นชิดขอบนอก เพื่อรวมเส้นขอบให้ดูเป็นชิ้นเดียวกัน
  const radius = 18.5; // ขยายจาก 17 เป็น 18.5
  const circumference = 2 * Math.PI * radius;
  const arcOffset = circumference * (1 - effectiveVolume / 100);
  
  // 🌟 ปรับลอจิกสีเส้นขอบให้ดูสม่ำเสมอทั้งชิ้น
  const baseColor = isLight ? '#0891b2' : '#22d3ee';
  const strokeColor = isMuted ? '#ef4444' : baseColor;
  const glowColor = isMuted ? 'rgba(239,68,68,0.85)' : (isLight ? 'rgba(8,145,178,0.85)' : 'rgba(34,211,238,0.85)');
  
  // 🌟 ใช้สีเส้นขอบเดียวกันทั้งตัวแม่และ SVG
  const borderColor = isMuted ? 'rgba(239,68,68,0.5)' : (isLight ? 'rgba(8,145,178,0.45)' : 'rgba(34,211,238,0.5)');
  const shadowColor = isMuted ? 'rgba(239,68,68,0.2)' : (isLight ? 'rgba(8,145,178,0.2)' : 'rgba(34,211,238,0.28)');
  const VolumeIcon = effectiveVolume === 0 ? VolumeX : effectiveVolume < 50 ? Volume1 : Volume2;

  return (
    <div
      className={`fixed top-4 right-28 z-300 flex justify-end ${className}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* 🌟 1. ยาเม็ดหลัก: คอนเทนเนอร์ภายนอก (Framer Motion) */}
      <motion.div
        animate={{ 
          width: expanded ? 180 : 40, // 🌟 ล็อกความกว้างตอนพับเป็น 40px เป๊ะๆ (เท่าความสูง)
          background: expanded 
            ? (isLight ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)') // ตอนกางดู translucent
            : (isLight ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)') // ตอนหดให้ดูเนียนไปกับพื้นหลัง
        }}
        transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
        className="h-10 rounded-full flex items-center overflow-hidden backdrop-blur-md group transition-shadow"
        style={{
          border: `1.5px solid ${borderColor}`,
          boxShadow: expanded ? `0 0 14px ${shadowColor}` : 'none', // 🌟 ตอนหดไม่เน้นเงา เพื่อให้ดูเป็นชิ้นเดียวกัน
        }}
      >
          {/* 🌟 2. ส่วนสไลด์ (ซ้าย): Input + Percent (หด-กาง) */}
        <motion.div
          animate={{ width: expanded ? 140 : 0, opacity: expanded ? 1 : 0 }}
          transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
          className="overflow-hidden shrink-0"
        >
          <div className="flex items-center gap-2.5 pl-4 pr-1 w-35">
            <input
              type="range"
              min={0}
              max={100}
              value={effectiveVolume}
              onMouseDown={playSettingClick}
              onChange={(e) => setVolume(Number(e.target.value))}
              className={`flex-1 h-1 cursor-pointer min-w-0 ${
                isMuted ? 'accent-red-500' : 'accent-cyan-400'
              }`}
            />
            <span className={`font-mono text-[9px] tabular-nums shrink-0 ${
              isMuted 
                ? 'text-red-400' 
                : (isLight ? 'text-sky-500' : 'text-cyan-400')
            }`}>
              {effectiveVolume}%
            </span>
          </div>
        </motion.div>

        {/* 🌟 3. ส่วนหัว (ขวา): วงกลมระดับเสียง (ล็อกขนาดเท่าคอนเทนเนอร์ตอนพับ) */}
        <div className="w-10 h-10 shrink-0 relative flex items-center justify-center -ml-px"> {/* -ml-px เพื่อขจัดช่องว่างเล็กน้อยตอนกาง */}
          <svg
            className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-[1px]" // 🌟 p-[1px] เพื่อให้เส้นส่วนโค้งไม่ทับเส้นขอบตัวแม่สนิทเกินไป
            viewBox="0 0 40 40"
          >
            {/* 🌟❌❌ REMOVED: dim full-circle track (❌ เอาเส้นขอบวงกลมจางๆ ด้านในออก) ❌❌🌟 */}
            {/* เส้นขอบของตัวยาเม็ดแม่ (motion.div) จะทำหน้าที่เป็น Track แทนครับ */}
            
            {/* 🌟 เส้นส่วนโค้งระดับเสียง: brighter with glow (รันอยู่ข้างในเส้นขอบตัวแม่) */}
            <circle
              cx="20" cy="20" r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth="1.5" // 🌟 เพิ่มความหนาเล็กน้อยให้ดูอิ่มขึ้น
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={arcOffset}
              filter={`drop-shadow(0 0 3px ${glowColor})`}
              style={{ transition: 'stroke-dashoffset 0.35s ease, stroke 0.2s ease' }}
              className={expanded ? 'opacity-100' : 'opacity-80'} // 🌟 ตอนพับให้ดูจางลงนิดนึงเพื่อให้ดูกลมกลืน
            />
          </svg>
          <button
            onClick={() => { playSettingClick(); toggleMute(); }}
            title={isMuted ? 'Unmute' : 'Mute'}
            className={`relative z-10 flex items-center justify-center transition-all ${
              expanded ? 'scale-100' : 'scale-95'
            } ${
              isMuted
                ? 'text-red-300'
                : (isLight ? 'text-cyan-700 hover:text-sky-600' : 'text-cyan-300 hover:text-white')
            }`}
          >
            <VolumeIcon size={expanded ? 15 : 13} /> {/* 🌟 ตอนพับให้ไอคอนเล็กหลบข้างในเส้นโค้ง */}
          </button>
        </div>
      </motion.div>
    </div>
  );
}