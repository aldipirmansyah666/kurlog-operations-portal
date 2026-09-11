'use client';

import { useMemo, useState } from 'react';
import { ClipboardPaste, Sparkles } from 'lucide-react';
import Modal from '@/app/components/ui/Modal';
import { parseDataLengkapUtamaPaste } from '@/lib/dataLengkapUtama';
import type { DataLengkapUtamaValues } from '@/lib/types';

interface PasteImportModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (items: DataLengkapUtamaValues[]) => Promise<void>;
}

export default function PasteImportModal({ open, onClose, onSubmit }: PasteImportModalProps) {
  const [pasteData, setPasteData] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const preview = useMemo(() => {
    if (!pasteData.trim()) return null;
    try {
      return parseDataLengkapUtamaPaste(pasteData);
    } catch {
      return null;
    }
  }, [pasteData]);

  const handleSubmit = async () => {
    if (!pasteData.trim()) return;
    setError('');
    try {
      const values = parseDataLengkapUtamaPaste(pasteData);
      if (values.length === 0) {
        setError('Tidak ada baris data yang ditemukan.');
        return;
      }
      setSubmitting(true);
      await onSubmit(values);
      setPasteData('');
      setSubmitting(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membaca data');
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import Data Utama dari Spreadsheet"
      subtitle="Copy dari Excel lalu paste di sini. Kolom yang kosong pada inputan akan dibiarkan kosong."
      maxWidth="max-w-3xl"
    >
      <div className="space-y-4">
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 space-y-2 leading-relaxed">
          <p className="font-semibold tracking-tight text-slate-900 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
            Copy dari Excel lalu paste langsung di sini (tab-separated, tanpa header).
          </p>
          <p>
            Urutan kolom mengikuti template master (sheet Agen CUM). Bagian <span className="font-semibold text-slate-800">STATUS</span>:
            SYARAT, PENGAJUAN SURVEY KE POS, PENGAJUAN POS, PENDAFTARAN KURLOG, KELENGKAPAN PERANGKAT,
            AKTIVASI KURLOG, AKTIVASI SICEPAT, TRAINING, TRANSAKSI, CATATAN, waktu. Lalu bagian
            <span className="font-semibold text-slate-800"> KURLOG</span>: POS + PPOB, POS ONLY, SICEPAT.
          </p>
          <p>
            Lanjut: <span className="font-mono text-[11px] bg-white border border-slate-200 rounded-lg px-1.5 py-0.5">PPID, NAMA LOKET DI ONPAYS, NAMA LOKET DI KURLOG, NAMA PEMILIK,
            ALAMAT PEMILIK KTP, ALAMAT LENGKAP LOKET, RT/RW, KEL/DESA, KEC, KAB/KOTA, PROPINSI, KODE POS,
            NO KTP, NO NPWP, ELECTRIC AREA, REKOMENDASI, NO HP PEMILIK, NO.HP LOKET, EMAIL, NO DIRIAN,
            LOCATION ID, USER MILE, PASSWORD MILE, REGIONAL, KCU/KC, NIB, NO KBLI, NOMOR REKENING, NAMA BANK,
            NAMA PEMILIK REKENING, LATITUDE, LONGITUDE.</span>
          </p>
          <p className="text-slate-400">
            Jika paste menyertakan header (baris berisi PPID), urutan kolom dibaca otomatis dari header — termasuk
            header bertingkat 2 baris. Sel yang kosong dibiarkan kosong dan tetap diimport.
          </p>
        </div>

        <textarea
          rows={8}
          placeholder={`3 OKTOBER 2022\t3/10/2022\t\t3/10/2022\t\tX\t\t\t\t\t\tX\t\t\t53BSPA29321JBNDS\tALBI\tIND EXPRESS\t...`}
          value={pasteData}
          onChange={(e) => setPasteData(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-xs font-mono text-slate-800 placeholder:text-slate-300 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none shadow-sm"
        />

        <div className="flex items-center justify-between gap-2 text-xs">
          <span className={`font-medium ${preview && preview.length > 0 ? 'text-indigo-600' : 'text-slate-500'}`}>
            {preview
              ? `${preview.length} data siap diimport`
              : pasteData.trim()
                ? 'Format belum sesuai atau header tidak ditemukan'
                : 'Belum ada data yang di-paste'}
          </span>
          {error && <span className="text-rose-600 font-semibold bg-rose-50 border border-rose-200 rounded-full px-2.5 py-1">{error}</span>}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={!preview || preview.length === 0 || submitting}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ClipboardPaste className="w-4 h-4" />
            {submitting ? 'Memproses...' : `Import ${preview ? preview.length : 0} Data`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
