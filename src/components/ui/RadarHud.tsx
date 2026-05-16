'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // 👈 นำเข้า useRouter เพิ่ม
import { useAppStore } from '@/lib/store/useAppStore';
import { 
  Hexagon, 
  Code2, 
  Cpu, 
  Clock, 
  FolderGit2, 
  PanelRightOpen,
  PanelRightClose,
  Orbit // 👈 เพิ่มไอคอนวงโคจรสำหรับปุ่ม Overview
} from 'lucide-react';

const warpCoordinates = [
  { id: 'core', name: 'Core (About)', path: '/about', icon: Hexagon },
  { id: 'skills', name: 'Tech Forge', path: '/skills', icon: Code2 },
  { id: 'services', name: 'Energy Hub', path: '/services', icon: Cpu },
  { id: 'experience', name: 'Chrono-Ring', path: '/experience', icon: Clock },
  { id: 'projects', name: 'Constellation', path: '/projects', icon: FolderGit2 },
];

export default function RadarHud() {
  const isSystemBooted = useAppStore((state) => state.isSystemBooted);
  const isSummaryMode = useAppStore((state) => state.isSummaryMode);
  const toggleSummaryMode = useAppStore((state) => state.toggleSummaryMode);
  const pathname = usePathname();
  const router = useRouter(); // 👈 เรียกใช้งานสำหรับการขับเคลื่อนหน้ารวม

  return (
    <AnimatePresence>
      {isSystemBooted && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
          className="fixed right-6 top-1/2 -translate-y-1/2 z-50 flex flex-col items-end gap-5 pointer-events-none"
        >
          {/* Radar Scanner Decorative */}
          <div className="relative w-16 h-16 rounded-full border border-cyan-500/30 flex items-center justify-center pointer-events-auto bg-black/20 backdrop-blur-md">
            <div className="absolute inset-0 rounded-full border-t border-cyan-400 animate-spin" style={{ animationDuration: '3s' }} />
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse" />
          </div>

          {/* 🌟 ย้าย SYSTEM OVERVIEW BUTTON เข้ามารวมในแผงควบคุมหลักตรงนี้ */}
          <motion.button 
            whileHover={{ scale: 1.05, x: -5 }}
            onClick={() => router.push('/')}
            className="pointer-events-auto flex items-center gap-2 font-mono text-[10px] tracking-widest border border-cyan-500/40 text-cyan-400 px-3 py-2 bg-black/50 backdrop-blur-md rounded-sm hover:bg-cyan-500 hover:text-black hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all"
          >
            <Orbit size={12} className="animate-pulse" />
            <span>[ SYSTEM OVERVIEW ]</span>
          </motion.button>

          {/* Navigation Nodes */}
          <nav className="flex flex-col items-end gap-3 pointer-events-auto">
            {warpCoordinates.map((coord) => {
              const isActive = pathname === coord.path;
              const Icon = coord.icon;

              return (
                <Link key={coord.id} href={coord.path}>
                  <motion.div
                    whileHover={{ scale: 1.1, x: -10 }}
                    className={`group relative flex items-center gap-4 p-2 rounded-full cursor-pointer backdrop-blur-md transition-colors ${
                      isActive 
                        ? 'bg-cyan-500/20 border border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
                        : 'bg-white/5 border border-white/10 hover:border-cyan-500/50'
                    }`}
                  >
                    <span className="absolute right-full mr-4 text-xs font-mono text-cyan-400 tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {coord.name}
                    </span>
                    <Icon size={20} className={isActive ? 'text-cyan-400' : 'text-gray-400 group-hover:text-cyan-300'} />
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="w-8 h-[1px] bg-white/20 my-1" />

          {/* DATA SLATE TOGGLE */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={toggleSummaryMode}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-2 border rounded-sm font-mono text-xs tracking-wider transition-all ${
              isSummaryMode 
                ? 'bg-cyan-500 text-black border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.5)]' 
                : 'bg-black/40 text-cyan-500 border-cyan-500/50 hover:bg-cyan-500/10'
            }`}
          >
            {isSummaryMode ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
            <span>{isSummaryMode ? 'CLOSE SLATE' : 'DATA SLATE'}</span>
          </motion.button>

        </motion.div>
      )}
    </AnimatePresence>
  );
}