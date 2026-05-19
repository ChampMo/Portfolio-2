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

// 🌟 แอนิเมชันของตู้คอนเทนเนอร์เมนู (ไล่คิวเด้งทีละ 0.1 วิ)
const menuContainerVariants: Variants = {
  open: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0 } // เริ่มเด้งเมนูแรกทันที
  },
  closed: {
    opacity: 0,
    transition: { staggerChildren: 0.05, staggerDirection: -1, when: "afterChildren" } // เก็บเมนูแบบเร่งสปีดจากล่างขึ้นบน
  }
};

const menuItemVariants: Variants = {
  open: { 
    opacity: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)', 
    transition: { type: 'spring', stiffness: 300, damping: 24 } 
  },
  closed: { 
    opacity: 0, x: 20, y: 15, scale: 0.9, filter: 'blur(4px)',
    transition: { duration: 0.2 } 
  }
};

// 🌟 [NEW] แอนิเมชันคำนวณความสัมพันธ์ของดวงดาวกับเมนู (The Synchronized Dance)
const dotVariants: Variants = {
  // ขาเปิดเมนู (ดาวต้องหายไป) -> ให้ดาวดวงที่ 5 (index 4) หายที่ 0 วิ, ดวงที่ 4 (index 3) หายที่ 0.1 วิ ... ซิงค์กับเมนูที่กำลังเด้ง
  open: (i: number) => ({
    opacity: 0,
    scale: 0,
    transition: { duration: 0.25, ease: 'easeInOut', delay: (4 - i) * 0.1 }
  }),
  // ขาปิดเมนู (ดาวต้องโผล่) -> หน่วงเวลา 0.4 วิให้เมนูเก็บหมดก่อน แล้วค่อยกระเด้งดาวดวงที่ 1 (index 0), 2, 3... ออกมา
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

  const textSlideVariants: Variants = {
    initial: { 
      width: 0, 
      opacity: 0,
      marginLeft: 0
    },
    hover: { 
      width: "auto", 
      opacity: 1,
      marginLeft: 8,
      transition: {
        width: { duration: 0.3, ease: "easeOut" },
        opacity: { duration: 0.2, delay: 0.1 }
      }
    }
  };

  if (pathname.startsWith('/admin')) return null;

  return (
    <AnimatePresence>
      {isSystemBooted && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
          className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-4 pointer-events-none text-sky-950 dark:text-neutral-400"
        >
          {/* Radar Scanner Decorative -> ปุ่มกดเปิด/ปิด */}
          <motion.button
            onClick={() => { playClick(); setIsMenuOpen(!isMenuOpen); }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative w-16 h-16 rounded-full border flex items-center justify-center pointer-events-auto backdrop-blur-sm transition-colors ${
              isLight ? 'bg-white/20 border-sky-300 shadow-[0_0_15px_rgba(2,132,199,0.3)] hover:bg-white/40' : 'bg-black/40 border-cyan-500/50 hover:bg-black/60 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
            }`}
          >
            <div className={`absolute inset-0 rounded-full border-t-2 animate-spin ${isLight ? 'border-sky-500' : 'border-cyan-400'}`} style={{ animationDuration: '3s' }} />
            <div className={`w-2 h-2 rounded-full animate-pulse ${isLight ? 'bg-sky-600 shadow-[0_0_10px_#0284c7]' : 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]'}`} />

            {/* 🌟 [UPDATED] วงแหวนวงโคจรดาว (หมุนตลอดเวลาไม่ว่าเมนูจะเปิดหรือปิด) */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 pointer-events-none"
            >
              {warpCoordinates.map((_, i) => (
                <div 
                  key={i} 
                  className="absolute inset-0"
                  style={{ transform: `rotate(${i * 72}deg)` }} 
                >
                  {/* 🌟 ดาวแต่ละดวงที่จะรับค่าดีเลย์ `custom={i}` ทำให้โผล่/หายเป็นคลื่นตามที่กัปตันสั่งเป๊ะ! */}
                  <motion.div 
                    custom={i} 
                    variants={dotVariants}
                    initial={isMenuOpen ? "open" : "closed"}
                    animate={isMenuOpen ? "open" : "closed"}
                    className="absolute inset-0"
                  >
                    <div className={`w-1.5 h-1.5 rounded-full absolute top-[-3px] left-1/2 -translate-x-1/2 ${
                      isLight ? 'bg-sky-400 shadow-[0_0_8px_#38bdf8]' : 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
                    }`} />
                  </motion.div>
                </div>
              ))}
            </motion.div>
          </motion.button>

          {/* โซนเมนูทั้งหมด ถูกครอบด้วยวงจร Animation */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                key="radar-menu-list"
                variants={menuContainerVariants}
                initial="closed"
                animate="open"
                exit="closed"
                className="flex flex-col items-end gap-3 w-full"
              >
                {/* SYSTEM OVERVIEW BUTTON */}
                <motion.button 
                  variants={menuItemVariants}
                  initial="initial"
                  whileHover="hover" // 🌟 สำคัญมาก: เพื่อส่งต่อสถานะ "hover" ให้กับคอมโพเนนต์ลูกด้านใน
                  onClick={() => { playClick(); router.push('/'); }}
                  // ✂️ เอา gap-2 ออกจากตรงนี้แล้วครับ
                  className="pointer-events-auto flex items-center font-mono text-[10px] tracking-widest border px-3 py-2 bg-white/10 dark:bg-black/60 backdrop-blur-sm rounded-sm transition-all text-sky-200 border-sky-300 hover:bg-sky-600 hover:text-white hover:border-sky-500 dark:text-cyan-400 dark:border-cyan-500/40 dark:hover:bg-cyan-500 dark:hover:text-black dark:hover:border-cyan-400 dark:hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                >
                  <Orbit size={12} className="animate-pulse shrink-0" />
                  
                  {/* 🌟 เปลี่ยนเป็น motion.span + ใส่ลอจิกสไลด์ */}
                  <motion.span 
                    variants={textSlideVariants}
                    className="overflow-hidden whitespace-nowrap block"
                  >
                    [ SYSTEM OVERVIEW ]
                  </motion.span>
                </motion.button>

                {/* Navigation Nodes */}
                <nav className="flex flex-col items-end gap-3 pointer-events-auto mt-2">
                  {warpCoordinates.map((coord) => {
                    const isActive = pathname === coord.path;
                    const Icon = coord.icon;

                    return (
                      <motion.div key={coord.id} variants={menuItemVariants}>
                        <Link href={coord.path} onClick={playClick}>
                          <motion.div
                            whileHover={{ scale: 1.1, x: -10 }}
                            className={`group relative flex items-center gap-4 p-2 rounded-full cursor-pointer backdrop-blur-sm transition-colors ${
                              isActive 
                                ? (isLight 
                                    ? 'bg-sky-100 border-sky-400 shadow-[0_0_10px_rgba(2,132,199,0.2)]'
                                    : 'bg-cyan-500/20 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]')
                                : (isLight
                                    ? 'bg-sky-50 border-sky-100 hover:border-sky-300'
                                    : 'bg-neutral-900/40 border-neutral-800 hover:border-cyan-500/50')
                            }`}
                          >
                            <span className={`absolute right-full mr-4 text-xs font-mono tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ${isLight ? 'text-sky-700' : 'text-cyan-400'}`}>
                              {coord.name}
                            </span>
                            <Icon size={20} className={isActive 
                              ? (isLight ? 'text-sky-700' : 'text-cyan-400')
                              : (isLight ? 'text-slate-600 group-hover:text-sky-800' : 'text-neutral-400 group-hover:text-cyan-300')} />
                          </motion.div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>

                {/* Divider */}
                <motion.div variants={menuItemVariants} className={`w-8 h-[1px] my-2 ${isLight ? 'bg-sky-200' : 'bg-neutral-800'}`} />

                {/* DATA SLATE TOGGLE */}
                <motion.button
                  variants={menuItemVariants}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => { playClick(); toggleSummaryMode(); }}
                  className={`pointer-events-auto flex items-center gap-3 px-4 py-2 border rounded-sm font-mono text-xs tracking-wider transition-all ${
                    isSummaryMode
                      ? (isLight
                          ? 'bg-sky-950 text-sky-300 border-sky-950 shadow-[0_0_10px_rgba(15,23,42,0.3)]'
                          : 'bg-cyan-500 text-black border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.5)]')
                      : (isLight
                          ? 'bg-white/10 text-sky-300 border-sky-300 hover:bg-sky-100 hover:text-sky-800'
                          : 'bg-black/60 text-cyan-500 border-cyan-500/50 hover:bg-cyan-500/10')
                  }`}
                >
                  {isSummaryMode ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
                  <span>{isSummaryMode ? 'CLOSE' : 'DATA'}</span>
                </motion.button>


              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}