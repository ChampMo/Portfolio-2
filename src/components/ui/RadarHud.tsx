'use client';

import { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/lib/store/useAppStore';
import { useThemeStore } from '@/lib/store/useThemeStore';
import { useSfx } from '@/hooks/useSfx';
import {
  Hexagon,
  Code2,
  Cpu,
  Clock,
  FolderGit2,
  PanelRightOpen,
  PanelRightClose,
  Orbit,
} from 'lucide-react';

const warpCoordinates = [
  { id: 'core', name: 'Core (About)', path: '/about', icon: Hexagon },
  { id: 'skills', name: 'Tech Forge', path: '/skills', icon: Code2 },
  { id: 'services', name: 'Energy Hub', path: '/services', icon: Cpu },
  { id: 'experience', name: 'Chrono-Ring', path: '/experience', icon: Clock },
  { id: 'projects', name: 'Constellation', path: '/projects', icon: FolderGit2 },
];

const menuContainerVariants: Variants = {
  open: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0 }
  },
  closed: {
    opacity: 0,
    transition: { staggerChildren: 0.05, staggerDirection: -1, when: "afterChildren" }
  }
};

const menuItemVariants: Variants = {
  open: { 
    opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)', 
    transition: { type: 'spring', stiffness: 300, damping: 24 } 
  },
  // 🌟 [FIXED] เปลี่ยนทิศทางตอนเก็บเมนู ให้ลอยขึ้นไปซ่อนใต้ปุ่มเรดาร์ (y: -25)
  closed: { 
    opacity: 0, x: 0, y: -25, scale: 0.6, filter: 'blur(4px)',
    transition: { duration: 0.25 } 
  }
};

const dotVariants: Variants = {
  open: (i: number) => ({
    opacity: 0,
    scale: 0,
    transition: { duration: 0.25, ease: 'easeInOut', delay: (4 - i) * 0.1 }
  }),
  closed: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 24, delay: 0.4 + (i * 0.1) }
  })
};

export default function RadarHud() {
  const isSystemBooted = useAppStore((state) => state.isSystemBooted);
  const isSummaryMode = useAppStore((state) => state.isSummaryMode);
  const toggleSummaryMode = useAppStore((state) => state.toggleSummaryMode);
  const theme = useThemeStore((s) => s.theme);
  const isLight = theme === 'light';

  const pathname = usePathname();
  const router = useRouter();
  const { playClick } = useSfx();

  const [isMenuOpen, setIsMenuOpen] = useState(true);

  if (pathname.startsWith('/admin')) return null;

  return (
    <AnimatePresence>
      {isSystemBooted && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
          className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-3 pointer-events-none text-sky-950 dark:text-neutral-400"
        >
          
          {/* 🌟 1. SYSTEM OVERVIEW BUTTON (COMMAND ROOT) - ย้ายมาอยู่บนสุดและไม่ถูกซ่อน */}
          <motion.button 
            whileHover={{ scale: 1.1, x: -10 }}
            onClick={() => { playClick(); router.push('/'); }}
            className={`pointer-events-auto group relative flex items-center p-2.5 rounded-full cursor-pointer backdrop-blur-md transition-all border ${
              pathname === '/' 
                ? (isLight 
                    ? 'bg-sky-400/20 border-sky-400 shadow-[0_0_15px_rgba(2,132,199,0.2)]' // ธีมสว่างใสขึ้น
                    : 'bg-cyan-900/50 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.35)]')
                : (isLight
                    ? 'bg-white/10 border-sky-200/50 hover:bg-sky-100/40 hover:border-sky-300' // ลดความขาวลง
                    : 'bg-neutral-900/60 border-neutral-700 hover:border-cyan-400 hover:bg-neutral-800/80')
            }`}
          >
            <div className={`absolute inset-[2px] rounded-full border border-dashed pointer-events-none animate-spin ${
              isLight ? 'border-sky-500/50' : 'border-cyan-400/50'
            }`} style={{ animationDuration: '15s' }} />

            <span className={`absolute right-full mr-4 text-xs font-mono tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${
              isLight ? 'text-sky-700 font-bold' : 'text-cyan-400 font-bold'
            }`}>
              [ SYSTEM OVERVIEW ]
            </span>
            
            <Orbit 
              size={22} 
              className={`relative z-10 transition-transform duration-500 ${
                pathname === '/' 
                  ? (isLight ? 'text-sky-800' : 'text-cyan-300')
                  : (isLight ? 'text-slate-600 group-hover:text-sky-700' : 'text-neutral-400 group-hover:text-cyan-300')
              } ${pathname === '/' ? 'animate-spin' : 'group-hover:rotate-180 duration-700'}`}
              style={{ animationDuration: pathname === '/' ? '8s' : undefined }}
            />
          </motion.button>

          {/* 🌟 2. RADAR TOGGLE (ปุ่มเปิดปิดเมนู) - ย่อขนาดให้เท่ากับ System Overview (w-[42px]) */}
          <motion.button
            onClick={() => { playClick(); setIsMenuOpen(!isMenuOpen); }}
            whileHover={{ scale: 1.1, x: -10 }}
            whileTap={{ scale: 0.95 }}
            className={`relative w-[44px] h-[44px] rounded-full flex items-center justify-center pointer-events-auto backdrop-blur-md transition-shadow z-20 group ${
              isLight 
                ? 'bg-white/5 border border-sky-300/40 hover:bg-white/20' // จางลงมากในธีมสว่าง
                : 'bg-black/50 border border-cyan-400/80 shadow-[0_0_20px_rgba(34,211,238,0.2)]'
            }`}
          >
            {/* Tooltip Hover ของเรดาร์ */}
            <span className={`absolute right-full mr-4 text-xs font-mono tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${
              isLight ? 'text-sky-700 font-bold' : 'text-cyan-400 font-bold'
            }`}>
              [ TOGGLE SCANNER ]
            </span>

            {/* ย่อขนาดวงแหวนชั้นในให้พอดีกับปุ่มไซส์ 42px */}
            <div className={`absolute inset-[2px] rounded-full border-[1px] border-dashed animate-spin pointer-events-none ${
              isLight ? 'border-sky-500/50' : 'border-cyan-400/50'
            }`} style={{ animationDuration: '10s' }} />
            
            <div className={`absolute inset-[5px] rounded-full border-t-[1.5px] border-l-[1.5px] pointer-events-none animate-spin ${
              isLight ? 'border-sky-600' : 'border-cyan-300'
            }`} style={{ animationDuration: '4s', animationDirection: 'reverse' }} />

            {/* แกนกลาง (Core) ย่อขนาดลงเป็น w-2 h-2 */}
            <div className={`relative flex items-center justify-center w-2 h-2 rounded-full transition-all duration-500 ${
               isMenuOpen 
                ? (isLight ? 'bg-sky-500 shadow-[0_0_12px_#0284c7] scale-100' : 'bg-cyan-400 shadow-[0_0_12px_#22d3ee] scale-100')
                : (isLight ? 'bg-sky-400/30 scale-75' : 'bg-cyan-500/30 scale-75')
            }`}>
               <div className={`absolute w-3 h-px transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'} ${isLight ? 'bg-sky-600' : 'bg-cyan-300'}`} />
               <div className={`absolute h-3 w-px transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'} ${isLight ? 'bg-sky-600' : 'bg-cyan-300'}`} />
            </div>

            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 pointer-events-none"
            >
              {warpCoordinates.map((_, i) => (
                <div key={i} className="absolute inset-0" style={{ transform: `rotate(${i * 72}deg)` }}>
                  <motion.div custom={i} variants={dotVariants} initial={isMenuOpen ? "open" : "closed"} animate={isMenuOpen ? "open" : "closed"} className="absolute inset-0">
                    <div className={`w-1.5 h-1.5 rounded-full absolute top-[-3px] left-1/2 -translate-x-1/2 ${
                      isLight ? 'bg-sky-500 shadow-[0_0_8px_#0ea5e9]' : 'bg-cyan-300 shadow-[0_0_8px_#67e8f9]'
                    }`} />
                  </motion.div>
                </div>
              ))}
            </motion.div>
          </motion.button>

          {/* 🌟 3. โซนเมนูย่อย (ถูกเก็บ/โชว์) */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                key="radar-menu-list"
                variants={menuContainerVariants}
                initial="closed"
                animate="open"
                exit="closed"
                className="relative flex flex-col items-end gap-3 w-full"
              >
                
                {/* เส้นแกนแนวตั้ง เริ่มเชื่อมจากใต้ปุ่ม Radar ลงไป */}
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'calc(100% + 10px)', opacity: 0.6 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.5, ease: 'easeInOut' }}
                  className={`absolute right-[-8px] top-[-10px] w-[2px] rounded-full shadow-lg ${
                    isLight 
                      ? 'bg-gradient-to-b from-sky-400 via-sky-400/40 to-transparent shadow-sky-400/50' 
                      : 'bg-gradient-to-b from-cyan-400 via-cyan-400/40 to-transparent shadow-cyan-400/50'
                  }`} 
                />

                {/* Navigation Nodes */}
                <nav className="flex flex-col items-end gap-3 pointer-events-auto">
                  {warpCoordinates.map((coord) => {
                    const isActive = pathname === coord.path;
                    const Icon = coord.icon;

                    return (
                      <motion.div key={coord.id} variants={menuItemVariants} className="relative z-10">
                        <Link href={coord.path} onClick={playClick}>
                          <motion.div
                            whileHover={{ scale: 1.1, x: -10 }}
                            className={`group relative flex items-center gap-4 p-2 rounded-full cursor-pointer backdrop-blur-sm transition-colors border ${
                              isActive 
                                ? (isLight 
                                    ? 'bg-sky-400/10 border-sky-400 shadow-sm' // Active แบบใส
                                    : 'bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]')
                                : (isLight
                                    ? 'bg-white/5 border-sky-100/30 hover:border-sky-300 hover:bg-white/10' // Inactive แบบเกือบใส
                                    : 'bg-neutral-900/40 border-neutral-800 hover:border-cyan-500/50')
                            }`}
                          >
                            <span className={`absolute right-full mr-4 text-xs font-mono tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${isLight ? 'text-sky-700' : 'text-cyan-400'}`}>
                              {coord.name}
                            </span>
                            <Icon size={20} className={isActive 
                              ? (isLight ? 'text-sky-600' : 'text-cyan-400')
                              : (isLight ? 'text-sky-400 group-hover:text-sky-600' : 'text-neutral-400 group-hover:text-cyan-300')} />
                          </motion.div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                {/* Divider */}
                <motion.div variants={menuItemVariants} className={`w-8 h-[1px] my-1 mr-1 ${isLight ? 'bg-sky-200' : 'bg-neutral-800'}`} />

                {/* DATA SLATE TOGGLE */}
                <motion.button
                  variants={menuItemVariants}
                  whileHover={{ scale: 1.1, x: -10 }}
                  onClick={() => { playClick(); toggleSummaryMode(); }}
                  className={`pointer-events-auto group relative flex items-center p-2 rounded-full cursor-pointer backdrop-blur-sm transition-colors border relative z-10 ${
                    isSummaryMode 
                      ? (isLight 
                          ? 'bg-sky-400/10 border-sky-400 shadow-sm'
                          : 'bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]')
                      : (isLight
                          ? 'bg-white/5 border-sky-100/30 hover:border-sky-300 hover:bg-white/10'
                          : 'bg-neutral-900/40 border-neutral-800 hover:border-cyan-500/50')
                  }`}
                >
                  <span className={`absolute right-full mr-4 text-xs font-mono tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${
                    isLight ? 'text-sky-600' : 'text-cyan-400'
                  }`}>
                    {isSummaryMode ? 'CLOSE DATA' : 'DATA SLATE'}
                  </span>
                  
                  {isSummaryMode ? (
                    <PanelRightClose 
                      size={20} 
                      className={isLight ? 'text-sky-600' : 'text-cyan-400'} 
                    />
                  ) : (
                    <PanelRightOpen 
                      size={20} 
                      className={isLight ? 'text-sky-400 group-hover:text-sky-600' : 'text-neutral-400 group-hover:text-cyan-300'} 
                    />
                  )}
                </motion.button>

              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}