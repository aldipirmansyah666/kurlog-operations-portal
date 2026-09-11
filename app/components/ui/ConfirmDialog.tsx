'use client';

import { useState } from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import Modal from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  requireTyping?: string;
  variant?: 'danger' | 'warning';
}

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = 'Hapus', requireTyping, variant = 'danger' }: ConfirmDialogProps) {
  const [typed, setTyped] = useState('');
  const isDisabled = requireTyping ? typed !== requireTyping : false;

  const handleConfirm = () => {
    if (!isDisabled) {
      setTyped('');
      onConfirm();
    }
  };

  const confirmClass = variant === 'danger'
    ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm focus-visible:ring-rose-500'
    : 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm focus-visible:ring-amber-500';

  return (
    <Modal open={open} onClose={onClose} title={title} subtitle={message} maxWidth="max-w-md">
      <div className="space-y-5">
        <div className="flex gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
          <div className="h-9 w-9 rounded-xl bg-white border border-amber-200 flex items-center justify-center shrink-0">
            {variant === 'danger' ? <ShieldAlert className="h-5 w-5 text-rose-600" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}
          </div>
          <p className="text-sm leading-relaxed text-slate-700">{message}</p>
        </div>

        {requireTyping && (
          <div className="space-y-2">
            <label className="text-xs font-medium tracking-wide text-slate-600">
              Ketik <span className="font-mono font-bold text-slate-900 bg-slate-900 text-white px-1.5 py-0.5 rounded">{requireTyping}</span> untuk mengonfirmasi:
            </label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={requireTyping}
              className="w-full rounded-xl bg-white border border-slate-200 px-3.5 py-2.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 focus-visible:ring-2 focus-visible:ring-slate-400 cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDisabled}
            className={`px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-150 focus-visible:ring-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${confirmClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
