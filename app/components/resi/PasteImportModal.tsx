'use client';

import { useState } from 'react';
import { ClipboardPaste } from 'lucide-react';
import Modal from '@/app/components/ui/Modal';
import type { ResiItem } from '@/lib/types';
import { isClosedStatus } from '@/lib/constants';

interface PasteImportModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (items: Omit<ResiItem, 'id' | 'created_at'>[]) => Promise<void>;
}

export default function PasteImportModal({ open, onClose, onSubmit }: PasteImportModalProps) {
  const [pasteData, setPasteData] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const handleSubmit = async () => {
    if (!pasteData.trim()) return;

    const rows = pasteData.trim().split('\n');
    const records: Omit<ResiItem, 'id' | 'created_at'>[] = [];

    rows.forEach((row) => {
      const cols = row.split('\t').map((c) => c.trim());
      if (cols.length < 2 || !cols[0]) return;

      let tgl = cols[0];
      let resi = cols[1];
      let agn = cols[2] || '-';
      let lyn = cols[3] || 'PE';
      let ptg = cols[4] || 'ADMIN';
      let st = cols[5] ? cols[5].toUpperCase() : 'PERJALANAN';

      if (cols.length === 5 || !tgl.includes('/')) {
        tgl = todayStr;
        resi = cols[0];
        agn = cols[1] || '-';
        lyn = cols[2] || 'PE';
        ptg = cols[3] || 'ADMIN';
        st = cols[4] ? cols[4].toUpperCase() : 'PERJALANAN';
      }

      records.push({
        tgl_tiket: tgl,
        no_resi: resi,
        agen: agn,
        layanan: lyn,
        petugas: ptg,
        status_resi: st,
        status_fu: isClosedStatus(st) ? 'CLOSED' : 'PERLU FOLLOW UP',
      });
    });

    if (records.length === 0) return;

    setSubmitting(true);
    await onSubmit(records);
    setPasteData('');
    setSubmitting(false);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Import Resi dari Spreadsheet" maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-400 space-y-1">
          <p className="font-medium text-slate-200">Format 6 kolom (tab-separated):</p>
          <p className="font-mono text-amber-400">
            Tgl Tiket | No. Resi | Nama Agen | Layanan | Petugas | Status
          </p>
          <p className="text-slate-500">Atau 5 kolom (tanpa tanggal — otomatis pakai hari ini).</p>
        </div>

        <textarea
          rows={8}
          placeholder={`21/07/2026\tP2604210156486\tMUC SWEET\tPKH\tNoviaCC\tPERJALANAN\n21/07/2026\tP2605110091369\tMUC NDH\tPE\tianCC\tDELIVERED`}
          value={pasteData}
          onChange={(e) => setPasteData(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500 transition-colors resize-none placeholder:text-slate-600"
        />

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800/80">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!pasteData.trim() || submitting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ClipboardPaste className="w-4 h-4" />
            {submitting ? 'Memproses...' : 'Import Sekarang'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
