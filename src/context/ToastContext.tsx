import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextData {
  toast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((state) => [...state, { id, type, title, message }]);

    setTimeout(() => {
      setToasts((state) => state.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((state) => state.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((title: string, message?: string) => addToast('success', title, message), [addToast]);
  const error = useCallback((title: string, message?: string) => addToast('error', title, message), [addToast]);
  const info = useCallback((title: string, message?: string) => addToast('info', title, message), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info }}>
      {children}
      <div className="fixed top-4 right-4 z-9999 flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`pointer-events-auto relative overflow-hidden rounded-2xl p-4 shadow-2xl border-l-4 flex items-start gap-3 bg-zinc-950 border-zinc-800 ${
                t.type === 'success' ? 'border-l-green-500' : t.type === 'error' ? 'border-l-red-500' : 'border-l-primary'
              }`}
            >
              {/* Background Glow */}
              <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl opacity-10 rounded-full ${
                 t.type === 'success' ? 'bg-green-500' : t.type === 'error' ? 'bg-red-500' : 'bg-primary'
              }`}></div>
              
              <div className="shrink-0 mt-0.5">
                {t.type === 'success' && <CheckCircle size={20} className="text-green-500" />}
                {t.type === 'error' && <AlertCircle size={20} className="text-red-500" />}
                {t.type === 'info' && <Info size={20} className="text-primary" />}
              </div>
              
              <div className="flex-1 pr-6">
                <h4 className="text-white font-black uppercase text-[11px] leading-tight tracking-wider">{t.title}</h4>
                {t.message && (
                  <p className="text-zinc-400 font-medium text-[10px] mt-1 leading-snug">{t.message}</p>
                )}
              </div>

              <button 
                onClick={() => removeToast(t.id)}
                className="absolute top-3 right-3 text-zinc-600 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
