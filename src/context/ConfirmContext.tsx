'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
}

type OpenConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<OpenConfirmFn | null>(null);

interface DialogState {
  isOpen: boolean;
  options: ConfirmOptions;
  resolve: ((value: boolean) => void) | null;
}

const CLOSED: DialogState = { isOpen: false, options: { message: '' }, resolve: null };

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState>(CLOSED);

  const openConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({ isOpen: true, options, resolve });
    });
  }, []);

  const handleAnswer = useCallback((answer: boolean) => {
    setDialog(prev => {
      prev.resolve?.(answer);
      return CLOSED;
    });
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!dialog.isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleAnswer(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog.isOpen, handleAnswer]);

  const { isOpen, options } = dialog;
  const variant = options.variant ?? 'danger';
  const title = options.title ?? (variant === 'danger' ? 'Confirm Delete' : 'Unsaved Changes');
  const confirmLabel = options.confirmLabel ?? (variant === 'danger' ? 'DELETE' : 'LEAVE');
  const cancelLabel = options.cancelLabel ?? 'CANCEL';

  const isDanger = variant === 'danger';

  return (
    <ConfirmContext.Provider value={openConfirm}>
      {children}

      {isOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => handleAnswer(false)}
        >
          <div
            className="bg-[#001a2e] dark:bg-gray-900 border border-sky-300/20 dark:border-white/10 rounded-sm w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent line */}
            <div className={`h-0.5 ${isDanger
              ? 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]'
              : 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]'
            }`} />

            <div className="p-6 space-y-5">
              {/* Icon + title */}
              <div className="flex items-center gap-3">
                <div className={`shrink-0 p-2.5 rounded-sm ${isDanger
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {isDanger ? <Trash2 size={17} /> : <AlertTriangle size={17} />}
                </div>
                <h3 className="text-base font-serif text-white">{title}</h3>
              </div>

              {/* Message */}
              <p className="text-sm text-sky-200/60 dark:text-gray-400 font-mono leading-relaxed pl-0.5">
                {options.message}
              </p>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => handleAnswer(false)}
                  className="px-4 py-2 text-xs font-mono tracking-widest text-sky-300/50 hover:text-white transition-colors"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={() => handleAnswer(true)}
                  className={`px-5 py-2 text-xs font-bold font-mono tracking-widest rounded-sm transition-all ${isDanger
                    ? 'bg-red-500 hover:bg-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                    : 'bg-amber-500 hover:bg-amber-400 text-[#001320] shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): OpenConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
