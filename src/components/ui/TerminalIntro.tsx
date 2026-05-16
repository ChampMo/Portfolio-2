'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const bootSequence = [
  "> SYSTEM BOOT INITIATED...",
  "> AUTHENTICATING USER: MONTHOL SUKJINDA [CHAMP]",
  "> ROLE: FULL_STACK_DEVELOPER",
  "> LOADING MODULES: PYTHON... SQL... JAVA... [OK]",
  "> ESTABLISHING CONNECTION TO THE COSMOS...",
  "> STATUS: READY FOR LAUNCH."
];

interface TerminalIntroProps {
  onLaunch: () => void;
}

export default function TerminalIntro({ onLaunch }: TerminalIntroProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [showButton, setShowButton] = useState(false);

  // เอฟเฟกต์ค่อยๆ แสดงข้อความทีละบรรทัด (Simulated Loading)
  // เอฟเฟกต์ค่อยๆ แสดงข้อความทีละบรรทัด (Simulated Loading)
  useEffect(() => {
    const interval = setInterval(() => {
      setLines((prev) => {
        // ใช้ความยาวของ Array ปัจจุบันเป็น Index สำหรับดึงคำถัดไป (ปลอดภัยจาก Strict Mode 100%)
        const nextIndex = prev.length;

        // ถ้ายังแสดงผลไม่ครบ ให้ดึงคำถัดไปมาต่อท้าย
        if (nextIndex < bootSequence.length) {
          return [...prev, bootSequence[nextIndex]];
        } 
        
        // ถ้าแสดงครบแล้ว ให้หยุดการทำงานและโชว์ปุ่ม
        clearInterval(interval);
        setTimeout(() => setShowButton(true), 500); // ดีเลย์ปุ่มนิดนึงให้ดูสมจริง
        return prev;
      });
    }, 400); // ความเร็วในการพิมพ์

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      // 👇 เติม pointer-events-auto เข้าไปที่ท้ายสุดของ className ครับ
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a] text-green-500 font-mono overflow-hidden pointer-events-auto"
      exit={{ 
        opacity: 0, 
        scale: 1.5, 
        filter: "blur(10px)",
        transition: { duration: 1.2, ease: "easeInOut" } 
      }}
    >
      {/* เส้นกริดเรดาร์ตกแต่งพื้นหลัง */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#00ff00 1px, transparent 1px), linear-gradient(90deg, #00ff00 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="relative z-10 w-full max-w-2xl px-6">
        {lines.map((line, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-2 text-sm md:text-base tracking-widest drop-shadow-[0_0_8px_rgba(0,255,0,0.8)]"
          >
            {line}
          </motion.div>
        ))}

        <AnimatePresence>
          {showButton && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 flex justify-center"
            >
              <button
                onClick={onLaunch}
                className="group relative px-8 py-3 border border-green-500 bg-transparent text-green-500 font-bold tracking-widest uppercase transition-all duration-300 hover:bg-green-500 hover:text-black hover:shadow-[0_0_20px_rgba(0,255,0,0.6)]"
              >
                <span className="relative z-10">[ INITIALIZE SYSTEM ]</span>
                {/* Glitch Effect เบาๆ ตอน Hover */}
                <div className="absolute inset-0 bg-green-400 opacity-0 group-hover:opacity-20 group-hover:animate-pulse pointer-events-none" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}