'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  maxWidth?: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, subtitle, maxWidth = 'max-w-xl', children }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
      <div className={`relative w-full ${maxWidth} bg-white border border-slate-200 rounded-2xl shadow-2xl animate-modal-in overflow-hidden`}>
        {(title || subtitle) && (
          <div className="sticky top-0 z-10 flex items-start justify-between px-6 py-5 bg-white/80 backdrop-blur-xl border-b border-slate-200">
            <div className="space-y-1 pr-4">
              {title && <h3 className="text-[15px] font-semibold tracking-tight text-slate-900">{title}</h3>}
              {subtitle && <p className="text-xs leading-relaxed text-slate-500">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-white hover:border-slate-300 transition-all duration-150 focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
