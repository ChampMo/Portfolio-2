'use client';

import { useState, useEffect } from 'react'; // 🌟 1. นำเข้า useEffect เพิ่มเติม
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion'; 
import { User, Code2, Cpu, Clock, FolderGit2, LogOut, Hexagon, Menu, X, Sun, Moon, Eye, EyeOff, Volume2, VolumeX, Volume1 } from 'lucide-react';
// นำเข้า Context และ Store
import { AdminProvider, useAdmin } from '@/context/AdminContext';
import { ToastProvider } from '@/context/ToastContext';
import { ConfirmProvider } from '@/context/ConfirmContext';
import AdminAuthGate from '@/components/admin/AdminAuthGate';
import { useThemeStore } from '@/lib/store/useThemeStore';
import { useVolumeStore } from '@/lib/store/useVolumeStore';
import { audioManager } from '@/lib/audio/audioManager';

const adminMenu = [
  { name: 'Dashboard', path: '/admin', icon: Hexagon },
  { name: 'About Me', path: '/admin/aboutme', icon: User },
  { name: 'Skills', path: '/admin/skills', icon: Code2 },
  { name: 'Services', path: '/admin/services', icon: Cpu },
  { name: 'Experience', path: '/admin/experience', icon: Clock },
  { name: 'Projects', path: '/admin/projects', icon: FolderGit2 },
];

function SidebarNavigation({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (v: boolean) => void }) {
  const pathname = usePathname();
  const { unsavedPaths, isViewMode, setViewMode } = useAdmin();

  const theme = useThemeStore((s: any) => s.theme);
  const toggle = useThemeStore((s: any) => s.toggle);
  const isLight = theme === 'light';

  const volume    = useVolumeStore((s) => s.volume);
  const isMuted   = useVolumeStore((s) => s.isMuted);
  const setVolume = useVolumeStore((s) => s.setVolume);
  const toggleMute = useVolumeStore((s) => s.toggleMute);

  const effectiveVolume = isMuted ? 0 : volume;
  const VolumeIcon = effectiveVolume === 0 ? VolumeX : effectiveVolume < 50 ? Volume1 : Volume2;

  // 🌟 2. [ADD EFFECT]: บังคับให้แท็ก <html> สลับคลาส .dark ตามสถานะ Store และบันทึกลงระบบจำถาวร
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('cv-theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('cv-theme', 'dark');
    }
  }, [theme]);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-sky-300/20 dark:border-cyan-500/20 bg-white/5 dark:bg-transparent flex justify-between items-start">
        <div>
          <h1 className="text-xl font-serif tracking-wider flex items-center gap-2 text-white">
            <span className="w-2 h-2 bg-sky-400 dark:bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_#38bdf8] dark:shadow-none" />
            ADMIN
          </h1>
          <p className="text-[10px] mt-1 tracking-widest uppercase text-sky-300/70 dark:text-cyan-500">Cosmic Voyager</p>
        </div>
        <button onClick={() => setIsOpen(false)} className="md:hidden p-1 text-sky-300 hover:text-white dark:text-cyan-400 transition-colors">
          <X size={20} />
        </button>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
        {adminMenu.map((item) => {
          const isActive = pathname === item.path;
          const hasUnsaved = unsavedPaths[item.path]; 
          const Icon = item.icon;

          return (
            <Link key={item.name} href={item.path} onClick={() => setIsOpen(false)}>
              <div className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-all cursor-pointer ${
                isActive
                  ? 'bg-sky-500/20 border-l-2 border-sky-400 text-sky-300 shadow-[inset_0_0_15px_rgba(2,132,199,0.1)] dark:bg-cyan-500/10 dark:border-cyan-400 dark:text-cyan-300'
                  : 'text-sky-200/60 hover:bg-white/10 hover:text-sky-200 dark:text-gray-500 dark:hover:bg-white/5 dark:hover:text-gray-300'
              }`}>
                <Icon size={18} className={isActive ? 'text-sky-400 dark:text-cyan-400' : ''} />
                <span className="text-sm tracking-wide flex-1">{item.name}</span>
                
                {hasUnsaved && (
                  <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.8)]" title="Unsaved changes" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sky-300/20 dark:border-cyan-500/20 space-y-3 bg-white/5 dark:bg-transparent">
        {/* View-mode badge */}
        {isViewMode && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-purple-500/10 border border-purple-500/30 text-purple-300 text-[10px] tracking-widest">
            <Eye size={12} className="animate-pulse shrink-0" /> READ-ONLY MODE
          </div>
        )}

        {/* Volume control */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] tracking-widest text-sky-300/50 dark:text-gray-600 uppercase">
            <button
              type="button"
              onClick={toggleMute}
              className="flex items-center gap-1.5 hover:text-sky-200 dark:hover:text-gray-400 transition-colors"
            >
              <VolumeIcon size={11} />
              VOLUME
            </button>
            <span className={isMuted ? 'text-red-400/70' : 'text-sky-300/50 dark:text-gray-600'}>
              {isMuted ? 'MUTED' : `${volume}%`}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={effectiveVolume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className={`w-full h-1 cursor-pointer rounded-full ${isMuted ? 'accent-red-500' : 'accent-sky-400 dark:accent-cyan-400'}`}
          />
        </div>

        <button
          type="button"
          onClick={() => { if (typeof toggle === 'function') toggle(); }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm transition-all text-xs tracking-widest border
            bg-white/5 border-sky-300/40 text-sky-100 hover:bg-sky-500/20 hover:text-white hover:border-sky-400 shadow-md shadow-sky-950/20
            dark:bg-white/5 dark:border-transparent dark:text-gray-400 dark:hover:bg-cyan-500/10 dark:hover:text-cyan-300 dark:shadow-none"
        >
          {isLight ? <Moon size={14} className="text-sky-300" /> : <Sun size={14} className="text-amber-400" />}
          {isLight ? 'DARK MODE' : 'LIGHT MODE'}
        </button>

        {isViewMode ? (
          <button
            onClick={() => setViewMode(false)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm transition-all text-xs tracking-widest border
              bg-purple-500/5 border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200 hover:border-purple-400/50"
          >
            <EyeOff size={14} /> EXIT VIEW MODE
          </button>
        ) : (
          <button
            onClick={async () => {
              await fetch('/api/admin/auth/logout', { method: 'POST' });
              window.location.reload();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm transition-all text-xs tracking-widest border
              bg-white/5 border-sky-300/20 text-sky-200/70 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/40
              dark:bg-white/5 dark:border-transparent dark:text-gray-500 dark:hover:bg-amber-500/10 dark:hover:text-amber-300"
          >
            <LogOut size={14} /> LOGOUT OFFICER
          </button>
        )}

        <Link href="/" onClick={() => audioManager.playBgm('main')}>
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm transition-all text-xs tracking-widest border
            bg-white/5 border-sky-300/20 text-sky-200/70 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/40
            dark:bg-white/5 dark:border-transparent dark:text-gray-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <LogOut size={14} /> EXIT TO GALAXY
          </button>
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex flex-col w-64 h-screen backdrop-blur-2xl transition-all bg-white/5 dark:bg-black/80 border-r border-sky-300/20 dark:border-cyan-500/20">
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[60] bg-[#001320]/80 dark:bg-black/80 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-72 max-w-[80vw] z-[70] flex flex-col bg-[#001320] dark:bg-gray-950 border-r border-sky-300/30 dark:border-cyan-500/30 shadow-2xl md:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function AdminMain({ children }: { children: React.ReactNode }) {
  const { isViewMode, setViewMode } = useAdmin();
  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden">
      {isViewMode && (
        <div className="flex items-center justify-between px-6 py-2 bg-purple-500/10 border-b border-purple-500/30 shrink-0">
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-purple-300">
            <Eye size={11} className="animate-pulse" /> READ-ONLY VIEW MODE — all editing is disabled
          </div>
          <button
            onClick={() => setViewMode(false)}
            className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-purple-400 hover:text-white transition-colors"
          >
            <EyeOff size={11} /> EXIT
          </button>
        </div>
      )}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar relative">
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <AdminProvider>
      <ToastProvider>
        <ConfirmProvider>
          <AdminAuthGate>
          <div className="h-screen overflow-hidden font-mono flex flex-col md:flex-row relative z-50 pointer-events-auto transition-colors duration-300
            bg-[#001320] text-sky-100 dark:bg-gray-950 dark:text-gray-300"
          >
            <div className="md:hidden flex items-center justify-between p-4 border-b border-sky-300/20 dark:border-cyan-500/20 bg-white/5 dark:bg-black/80 sticky top-0 z-40 backdrop-blur-md">
              <h1 className="text-lg font-serif tracking-wider flex items-center gap-2 text-white">
                <span className="w-2 h-2 bg-sky-400 dark:bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_#38bdf8] dark:shadow-none" />
                ADMIN PANEL
              </h1>
              <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-sky-300 dark:text-cyan-400 border border-sky-300/20 dark:border-cyan-500/30 rounded-sm bg-white/5 dark:bg-white/5 hover:bg-sky-500/20 transition-all">
                <Menu size={20} />
              </button>
            </div>

            <SidebarNavigation isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />
            <AdminMain>{children}</AdminMain>
          </div>
          </AdminAuthGate>
        </ConfirmProvider>
      </ToastProvider>
    </AdminProvider>
  );
}