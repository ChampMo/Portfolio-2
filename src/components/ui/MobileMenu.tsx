'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store/useAppStore';
import { useThemeStore } from '@/lib/store/useThemeStore';
import {
  Menu, X, Hexagon, Code2, Cpu, Clock, FolderGit2, Sun, Moon, Orbit, ShieldCheck,
} from 'lucide-react';

const menuItems = [
  { name: 'Core (About)', path: '/about', icon: Hexagon },
  { name: 'Tech Forge', path: '/skills', icon: Code2 },
  { name: 'Energy Hub', path: '/services', icon: Cpu },
  { name: 'Chrono-Ring', path: '/experience', icon: Clock },
  { name: 'Constellation', path: '/projects', icon: FolderGit2 },
];

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const isSystemBooted = useAppStore((state) => state.isSystemBooted);
  
  const theme = useThemeStore((s: any) => s.theme);
  const toggle = useThemeStore((s: any) => s.toggle); // 🌟 [FIXED] เปลี่ยนเป็น toggle ให้ตรงกับ Store
  const isLight = theme === 'light';
  const pathname = usePathname();

  // 🌟 [ADD] บังคับสลับคลาส .dark ที่ <html> ทุกครั้งที่สเตตัสธีมเปลี่ยน เพื่อให้เบราว์เซอร์แสดงผลทันที
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('cv-theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('cv-theme', 'dark');
    }
  }, [theme]);

  if (!isSystemBooted) return null;
  if (pathname.startsWith('/admin')) return null;

  return (
    <>
      {/* 🍔 ปุ่มเปิดแฮมเบอร์เกอร์ (ลอยมุมขวาบน เฉพาะ Mobile) */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed right-6 top-6 z-50 p-2.5 rounded-sm border backdrop-blur-md pointer-events-auto transition-all ${
          isLight 
            ? 'bg-white/10 border-sky-300/40 text-sky-300 shadow-md shadow-sky-950/20' 
            : 'bg-black/60 border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/5'
        }`}
      >
        <Menu size={20} />
      </button>

      {/* แผงสไลด์เมนูด้านข้างเมื่อกดเปิด */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* ม่านดำละลายฉากหลังอวกาศ 3D */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm pointer-events-auto"
            />

            {/* บานกระจก Sidebar สไลด์ออกจากขวาไปซ้าย */}
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              className={`fixed right-0 top-0 h-full w-64 z-50 flex flex-col backdrop-blur-2xl border-l pointer-events-auto transition-all ${
                isLight 
                  ? 'bg-[#001320]/95 border-sky-300/20 text-sky-300 shadow-2xl' 
                  : 'bg-black/85 border-cyan-500/20 text-cyan-400 shadow-2xl'
              }`}
            >
              {/* Header เมนูข้าง */}
              <div className={`p-5 flex items-center justify-between border-b ${isLight ? 'border-sky-300/10' : 'border-white/5'}`}>
                <span className="font-mono text-[10px] tracking-[0.2em] opacity-80">[ NAVIGATION PROTOCOL ]</span>
                <button onClick={() => setIsOpen(false)} className="hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* รายการวาร์ปเชื่อมพิกัดหน้าต่างๆ */}
              <nav className="flex-1 p-5 space-y-3 overflow-y-auto custom-scrollbar">
                
                {/* 🌟 [NEW] เพิ่มปุ่ม SYSTEM OVERVIEW โดดเด่นด้านบนสุด */}
                <Link href="/" onClick={() => setIsOpen(false)}>
                  <div className={`flex items-center gap-3 px-4 py-3 mb-4 rounded-sm border transition-all ${
                    isLight 
                      ? 'bg-white/10 border-sky-300 text-sky-200 hover:bg-sky-600 hover:text-white' 
                      : 'bg-black/60 border-cyan-500/40 text-cyan-400 hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                  }`}>
                    <Orbit size={18} className="animate-pulse" />
                    <span className="text-xs font-mono tracking-wider">[ SYSTEM OVERVIEW ]</span>
                  </div>
                </Link>

                <div className={`w-8 h-[1px] mb-4 ${isLight ? 'bg-sky-200/50' : 'bg-neutral-800'}`} />

                {menuItems.map((item) => {
                  const isActive = pathname === item.path;
                  const Icon = item.icon;

                  return (
                    <Link key={item.path} href={item.path} onClick={() => setIsOpen(false)}>
                      <div className={`flex items-center gap-3 px-4 py-3 rounded-sm border transition-all ${
                        isActive
                          ? (isLight 
                              ? 'bg-sky-500/20 border-sky-400 text-sky-100 shadow-[inset_0_0_10px_rgba(56,189,248,0.2)]' 
                              : 'bg-cyan-500/20 border-cyan-400 text-cyan-300')
                          : (isLight 
                              ? 'bg-white/5 border-sky-300/10 text-sky-200/60 hover:border-sky-300/40' 
                              : 'bg-transparent border-transparent text-neutral-500 hover:text-cyan-300')
                      }`}>
                        <Icon size={18} />
                        <span className="text-xs font-mono tracking-wider">{item.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>

              {/* ฐานด้านล่าง */}
              <div className={`p-5 border-t space-y-3 bg-white/3 ${isLight ? 'border-sky-300/10' : 'border-white/5'}`}>
                <button
                  onClick={() => { if (typeof toggle === 'function') toggle(); }}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 border rounded-sm font-mono text-xs tracking-wider transition-all ${
                    isLight
                      ? 'bg-sky-950/60 text-sky-300 border-sky-300/40 hover:bg-sky-950 shadow-md shadow-black/40'
                      : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20'
                  }`}
                >
                  {isLight ? <Moon size={14} /> : <Sun size={14} />}
                  <span>{isLight ? '[ ACTIVATE DARK ]' : '[ ACTIVATE LIGHT ]'}</span>
                </button>

                <Link href="/admin" onClick={() => setIsOpen(false)}>
                  <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border rounded-sm font-mono text-xs tracking-wider transition-all bg-purple-500/5 border-purple-500/20 text-purple-400 hover:bg-purple-500/15 hover:border-purple-400/50 hover:text-purple-200">
                    <ShieldCheck size={14} />
                    <span>[ ADMIN ACCESS ]</span>
                  </div>
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}