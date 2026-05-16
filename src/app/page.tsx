'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store/useAppStore';
import TerminalIntro from '@/components/ui/TerminalIntro';

export default function Home() {
  const isSystemBooted = useAppStore((state) => state.isSystemBooted);
  const setSystemBooted = useAppStore((state) => state.setSystemBooted);
  const [mounted, setMounted] = useState(false);

  // 🛡️ เกราะป้องกัน Hydration Mismatch (รอให้ Client พร้อม 100% ค่อยรัน State)
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLaunch = () => {
    setTimeout(() => {
      setSystemBooted(true);
    }, 200);
  };

  // ถ้ายังโหลดหน้าเว็บฝั่ง Client ไม่เสร็จ ให้สแตนด์บายรอไว้ก่อน
  if (!mounted) return null;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center pointer-events-none">
      <AnimatePresence>
        {/* คืนชีพหน้าจอพิมพ์ดีดแฮกเกอร์สีเขียว */}
        {!isSystemBooted && <TerminalIntro onLaunch={handleLaunch} />}
      </AnimatePresence>
    </div>
  );
}