'use client';

import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import type { Toast } from '@/lib/types';

const TOAST_STYLES: Record<string, string> = {
  success: 'border-emerald-500/40 bg-emerald-500/10',
  error: 'border-rose-500/40 bg-rose-500/10',
  info: 'border-sky-500/40 bg-sky-500/10',
  warning: 'border-amber-500/40 bg-amber-500/10',
};

const TOAST_TEXT: Record<string, string> = {
  success: 'text-emerald-400',
  error: 'text-rose-400',
  info: 'text-sky-400',
  warning: 'text-amber-400',
};

const TOAST_ICONS: Record<string, React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
  error: <XCircle className="w-4 h-4 text-rose-400 shrink-0" />,
  info: <Info className="w-4 h-4 text-sky-400 shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
};

export default function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-xl animate-slide-in ${TOAST_STYLES[toast.type]}`}
        >
          {TOAST_ICONS[toast.type]}
          <p className={`text-sm font-medium flex-1 ${TOAST_TEXT[toast.type]}`}>
            {toast.message}
          </p>
          <button
            onClick={() => onRemove(toast.id)}
            className="text-slate-400 hover:text-slate-200 transition-colors shrink-0 mt-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
