'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' as ToastType });

  // ฟังก์ชันสำหรับเรียกเปิด Toast
  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ show: true, message, type });
    
    // ตั้งเวลาให้มันปิดเองอัตโนมัติใน 4 วินาที
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* 🌟 หน้าตา UI ของ Custom Toast จะลอยอยู่บนสุดของจอเสมอ */}
      <div 
        className={`fixed bottom-8 right-8 z-[100] transition-all duration-500 transform ${
          toast.show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
        }`}
      >
        <div className={`flex items-center gap-3 px-5 py-4 rounded-sm shadow-[0_10px_40px_rgba(0,0,0,0.5)] border font-mono text-xs tracking-wide relative overflow-hidden ${
          toast.type === 'success' ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200' : 
          toast.type === 'error' ? 'bg-red-950/90 border-red-500/50 text-red-200' :
          'bg-cyan-950/90 border-cyan-500/50 text-cyan-200'
        }`}>
          
          {/* แถบแสงตกแต่งด้านซ้าย */}
          <div className={`absolute left-0 top-0 bottom-0 w-1 ${
            toast.type === 'success' ? 'bg-emerald-500' : 
            toast.type === 'error' ? 'bg-red-500' : 'bg-cyan-500'
          }`} />

          {/* ไอคอนตามประเภท */}
          {toast.type === 'success' && <CheckCircle2 size={18} className="text-emerald-400" />}
          {toast.type === 'error' && <AlertCircle size={18} className="text-red-400" />}
          {toast.type === 'info' && <CheckCircle2 size={18} className="text-cyan-400" />} {/* เปลี่ยนไอคอน info ได้ตามชอบ */}
          
          {/* ข้อความแจ้งเตือน */}
          <span className="pr-4">{toast.message}</span>

          {/* ปุ่มกดปิดทันที (เผื่อไม่อยากรอ 4 วิ) */}
          <button 
            onClick={() => setToast(prev => ({ ...prev, show: false }))}
            className="absolute right-3 opacity-50 hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </ToastContext.Provider>
  );
}

// Hook สำหรับดึงไปใช้ในหน้าต่างๆ
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}