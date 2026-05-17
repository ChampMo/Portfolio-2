'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/lib/store/useThemeStore';
import { useAppStore } from '@/lib/store/useAppStore';

export default function ThemeToggle({
  className = '',
}: {
  className?: string;
}) {
  const theme = useThemeStore((s) => s.theme);
  const hydrated = useThemeStore((s) => s.hydrated);
  const hydrate = useThemeStore((s) => s.hydrate);
  const toggle = useThemeStore((s) => s.toggle);
  const isSystemBooted = useAppStore((s) => s.isSystemBooted);
  const pathname = usePathname();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // 🚫 ซ่อนปุ่มเฉพาะหน้า Terminal Intro (root + ยังไม่ boot)
  const isOnIntro = pathname === '/' && !isSystemBooted;
  
  // 🌟 [NEW] ตรวจสอบระบบพิกัดว่ากัปตันกำลังอยู่ในสถานี ADMIN หรือไม่
  const isAdmin = pathname?.startsWith('/admin');

  // 🌟 [UPDATED] เพิ่มเงื่อนไข isAdmin เข้าไป ถ้าใช่ให้พับเก็บปุ่มลอยตัวนี้ทันที
  if (!hydrated || isOnIntro || isAdmin) return null;

  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className={`fixed top-4 right-4 z-[300] w-10 h-10 rounded-full flex items-center justify-center border backdrop-blur-md transition-all
        ${isDark
          ? 'bg-black/60 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/15 hover:border-cyan-300/70 shadow-[0_0_20px_rgba(34,211,238,0.25)]'
          : 'bg-white/70 border-cyan-700/30 text-cyan-700 hover:bg-cyan-100 hover:border-cyan-600/60 shadow-[0_4px_20px_rgba(8,145,178,0.15)]'}
        ${className}`}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}