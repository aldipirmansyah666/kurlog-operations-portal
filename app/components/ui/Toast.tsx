'use client';

import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import type { Toast } from '@/lib/types';

const TOAST_CONFIG: Record<string, { wrap: string; icon: React.ReactNode }> = {
  success: {
    wrap: 'bg-white border-emerald-200 shadow-emerald-900/10 text-emerald-900',
    icon: <span className="h-8 w-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0"><CheckCircle2 className="h-4 w-4 text-emerald-600" /></span>,
  },
  error: {
    wrap: 'bg-white border-rose-200 shadow-rose-900/10 text-rose-900',
    icon: <span className="h-8 w-8 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0"><XCircle className="h-4 w-4 text-rose-600" /></span>,
  },
  info: {
    wrap: 'bg-white border-sky-200 shadow-sky-900/10 text-sky-900',
    icon: <span className="h-8 w-8 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0"><Info className="h-4 w-4 text-sky-600" /></span>,
  },
  warning: {
    wrap: 'bg-white border-amber-200 shadow-amber-900/10 text-amber-900',
    icon: <span className="h-8 w-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0"><AlertTriangle className="h-4 w-4 text-amber-600" /></span>,
  },
};

export default function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none">
      {toasts.map((toast) => {
        const cfg = TOAST_CONFIG[toast.type] ?? TOAST_CONFIG.info;
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-xl animate-slide-in ${cfg.wrap}`}
          >
            {cfg.icon}
            <p className="text-sm font-medium leading-snug flex-1 pt-1">{toast.message}</p>
            <button
              onClick={() => onRemove(toast.id)}
              className="h-7 w-7 rounded-full bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-white transition-colors shrink-0 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
