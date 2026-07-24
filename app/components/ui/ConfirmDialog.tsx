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
          <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 shrink-0 h-fit">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-sm text-slate-600">{message}</p>
        </div>

        {requireTyping && (
          <div className="space-y-2">
            <label className="text-xs text-slate-500">
              Ketik <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">{requireTyping}</span> untuk mengonfirmasi:
            </label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={requireTyping}
              className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 font-mono placeholder:text-slate-300"
            />
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-lg transition-colors cursor-pointer"
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
