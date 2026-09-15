'use client';

import { useMemo, useState } from 'react';
import { ClipboardPaste, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import Modal from '@/app/components/ui/Modal';
import { parseDataLengkapUtamaPaste } from '@/lib/dataLengkapUtama';
import type { DataLengkapUtamaValues } from '@/lib/types';

interface PasteImportModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (items: DataLengkapUtamaValues[]) => Promise<void>;
}

const CHUNK_SIZE = 200;

export default function PasteImportModal({ open, onClose, onSubmit }: PasteImportModalProps) {
  void onSubmit; // handled via chunked fetch directly in modal (spec: batch 200)
  const [pasteData, setPasteData] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

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
    setProgress(null);
    let values: DataLengkapUtamaValues[];
    try {
      values = parseDataLengkapUtamaPaste(pasteData);
      if (values.length === 0) {
        setError('Tidak ada baris data yang ditemukan.');
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membaca data');
      return;
    }

    // Chunking: jangan kirim 1465 sekaligus — bagi per 200
    const total = values.length;
    const chunks: DataLengkapUtamaValues[][] = [];
    for (let i = 0; i < total; i += CHUNK_SIZE) {
      chunks.push(values.slice(i, i + CHUNK_SIZE));
    }

    setSubmitting(true);
    let imported = 0;
    try {
      for (let idx = 0; idx < chunks.length; idx++) {
        const chunk = chunks[idx];
        setProgress({ current: imported, total });
        const res = await fetch('/api/data-lengkap-utama', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: chunk }),
        });
        const json = await res.json().catch(() => ({} as Record<string, unknown>));
        if (!res.ok) {
          const msg = typeof json.error === 'string' ? json.error : `Chunk ${idx + 1} gagal (${res.status})`;
          throw new Error(msg);
        }
        imported += chunk.length;
        setProgress({ current: imported, total });
      }
      // Fallback: panggil onSubmit dengan array kosong untuk trigger refetch di parent jika diperlukan
      // Namun data sudah ter-insert via chunk, jadi cukup tutup modal
      setPasteData('');
      setProgress(null);
      setSubmitting(false);
      onClose();
      // Opsional: tetap panggil onSubmit untuk kompatibilitas (tidak kirim ulang data)
      // await onSubmit([]).catch(()=>{});
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengimpor data';
      // Tampilkan pesan spesifik dari Supabase/DB (misal kolom mismatch) bukan generic
      setError(msg);
      setSubmitting(false);
      setProgress(null);
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
          {error && (
            <span className="flex items-center gap-1.5 text-rose-600 font-semibold bg-rose-50 border border-rose-200 rounded-xl px-2.5 py-1 max-w-[60%]">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate" title={error}>{error}</span>
            </span>
          )}
        </div>

        {progress && (
          <div className="space-y-1.5 rounded-xl bg-indigo-50 border border-indigo-200 p-3">
            <div className="flex justify-between text-[11px] font-bold text-indigo-700">
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Mengimpor {progress.current}/{progress.total} data...
              </span>
              <span>{Math.round((progress.current / progress.total) * 100)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-white border border-indigo-200 overflow-hidden">
              <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${(progress.current / progress.total) * 100}%` }} />
            </div>
            <p className="text-[11px] text-indigo-600">Batch {Math.ceil(progress.current / CHUNK_SIZE)}/{Math.ceil(progress.total / CHUNK_SIZE)} • {CHUNK_SIZE} baris per request</p>
          </div>
        )}

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
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {progress ? `Mengimpor ${progress.current}/${progress.total}...` : 'Memproses...'}
              </>
            ) : (
              <>
                <ClipboardPaste className="w-4 h-4" />
                {`Import ${preview ? preview.length : 0} Data`}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
