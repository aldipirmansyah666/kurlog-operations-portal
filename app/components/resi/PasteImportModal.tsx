'use client';

import { useState } from 'react';
import { Sparkles, UploadCloud, FileSpreadsheet } from 'lucide-react';
import Modal from '@/app/components/ui/Modal';
import type { ResiItem } from '@/lib/types';
import { isClosedStatus } from '@/lib/constants';

export default function PasteImportModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (items: Omit<ResiItem, 'id' | 'created_at'>[]) => Promise<void> }) {
  const [pasteData, setPasteData] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const handleSubmit = async () => {
    if (!pasteData.trim()) return;
    const rows = pasteData.trim().split('\n');
    const records: Omit<ResiItem, 'id' | 'created_at'>[] = [];
    const seen = new Set<string>();
    rows.forEach((row) => {
      const cols = row.split('\t').map((c) => c.trim());
      if (cols.length < 2 || !cols[0]) return;
      let tgl = cols[0]; let resi = cols[1]; let agn = cols[2] || '-'; let lyn = cols[3] || 'PE'; let ptg = cols[4] || 'ADMIN'; let st = cols[5] ? cols[5].toUpperCase() : 'PERJALANAN';
      if (cols.length === 5 || !tgl.includes('/')) { tgl = todayStr; resi = cols[0]; agn = cols[1] || '-'; lyn = cols[2] || 'PE'; ptg = cols[3] || 'ADMIN'; st = cols[4] ? cols[4].toUpperCase() : 'PERJALANAN'; }
      const key = resi.toLowerCase(); if (seen.has(key)) return; seen.add(key);
      records.push({ tgl_tiket: tgl, no_resi: resi, agen: agn, layanan: lyn, petugas: ptg, status_resi: st, status_fu: isClosedStatus(st) ? 'CLOSED' : 'PERLU FOLLOW UP' });
    });
    if (records.length === 0) return;
    setSubmitting(true);
    await onSubmit(records);
    setPasteData(''); setSubmitting(false); onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Import Resi dari Spreadsheet" subtitle="Paste tab-separated — sistem otomatis dedup & set status FU" maxWidth="max-w-2xl">
      <div className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 p-4 flex gap-3">
          <span className="h-9 w-9 rounded-xl bg-white border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm shrink-0"><FileSpreadsheet className="h-5 w-5" /></span>
          <div className="text-xs leading-relaxed">
            <p className="font-semibold text-slate-900 flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-indigo-500" /> Format 6 kolom (tab-separated)</p>
            <p className="font-mono text-indigo-700 bg-white border border-indigo-200 inline-block px-2 py-1 rounded-lg mt-1">Tgl Tiket | No. Resi | Nama Agen | Layanan | Petugas | Status</p>
            <p className="text-slate-500 mt-1">Atau 5 kolom tanpa tanggal — otomatis pakai hari ini.</p>
          </div>
        </div>

        <div className="relative">
          <textarea
            rows={9}
            placeholder={`21/07/2026\tP2604210156486\tMUC SWEET\tPKH\tNoviaCC\tPERJALANAN\n21/07/2026\tP2605110091369\tMUC NDH\tPE\tianCC\tDELIVERED`}
            value={pasteData}
            onChange={(e) => setPasteData(e.target.value)}
            className="w-full rounded-2xl bg-white border border-slate-200 p-4 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none"
          />
          <span className="absolute bottom-3 right-3 text-[11px] font-medium text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded-full">{pasteData.trim().split('\n').filter(Boolean).length} baris</span>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">Batal</button>
          <button onClick={handleSubmit} disabled={!pasteData.trim() || submitting} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer">
            <UploadCloud className="h-4 w-4" /> {submitting ? 'Memproses…' : 'Import Sekarang'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
