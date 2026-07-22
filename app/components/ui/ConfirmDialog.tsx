'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
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

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Hapus',
  requireTyping,
  variant = 'danger',
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState('');
  const isDisabled = requireTyping ? typed !== requireTyping : false;

  const handleConfirm = () => {
    if (!isDisabled) {
      setTyped('');
      onConfirm();
    }
  };

  const confirmBtnClass =
    variant === 'danger'
      ? 'bg-rose-600 hover:bg-rose-500 text-white'
      : 'bg-amber-600 hover:bg-amber-500 text-white';

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0 h-fit">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-sm text-slate-300">{message}</p>
        </div>

        {requireTyping && (
          <div className="space-y-2">
            <label className="text-xs text-slate-400">
              Ketik <span className="font-mono font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded">{requireTyping}</span> untuk mengonfirmasi:
            </label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={requireTyping}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 font-mono placeholder:text-slate-600"
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/80">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDisabled}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${confirmBtnClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
