'use client';

import { useState } from 'react';
import {
  Copy,
  Check,
  Send,
  Upload,
  ClipboardPaste,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  FolderClosed,
  FolderOpen,
} from 'lucide-react';
import type { BailoutRow } from '@/lib/types';
import EmptyState from '@/app/components/ui/EmptyState';
import { MAX_EXCEL_SIZE_BYTES, validateFileSize, validateExcelMagicBytes } from '@/lib/fileValidation';

const INDONESIAN_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatIDDate(date: Date): string {
  return `${date.getDate()} ${INDONESIAN_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function formatIDCurrency(value: number): string {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString('id-ID');
  return value < 0 ? `Rp - ${formatted}` : `Rp ${formatted}`;
}

function parseBailoutValue(val: unknown): number {
  if (typeof val === 'number') return val;
  const str = String(val || '0').replace(/[^0-9,\-]/g, '').replace(',', '.');
  return Number(str) || 0;
}

function normalizeRows(raw: Record<string, unknown>[]): BailoutRow[] {
  if (raw.length === 0) return [];
  const keys = Object.keys(raw[0]);
  const kodeKey = keys.find((k) => k.trim().toUpperCase().includes('KODE'));
  const namaKey = keys.find((k) => k.trim().toUpperCase().includes('NAMA'));
  const bailoutKey = keys.find((k) => k.trim().toUpperCase().includes('BAIL'));

  return raw.map((row) => ({
    KODE: kodeKey ? String(row[kodeKey] ?? '') : '',
    NAMA: namaKey ? String(row[namaKey] ?? '') : '',
    BAILOUT: bailoutKey ? String(row[bailoutKey] ?? '') : '',
  }));
}

function parsePasteInput(text: string): BailoutRow[] {
  const lines = text.trim().split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split('\t').map((h) => h.trim().toUpperCase());
  const kodeIdx = headers.findIndex((h) => h.includes('KODE'));
  const namaIdx = headers.findIndex((h) => h.includes('NAMA'));
  const bailoutIdx = headers.findIndex((h) => h.includes('BAIL'));

  if (kodeIdx === -1 && namaIdx === -1 && bailoutIdx === -1) return [];

  return lines.slice(1).map((line) => {
    const cols = line.split('\t');
    const kode = kodeIdx >= 0 ? (cols[kodeIdx] || '').trim() : '';
    const nama = namaIdx >= 0 ? (cols[namaIdx] || '').trim() : '';
    const bailout = bailoutIdx >= 0 ? (cols[bailoutIdx] || '').trim() : '';
    return { KODE: kode, NAMA: nama, BAILOUT: bailout };
  }).filter((row) => row.NAMA && row.NAMA !== 'TOTAL');
}

export default function BailoutPage() {
  const [data, setData] = useState<BailoutRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [inputMode, setInputMode] = useState<'file' | 'paste'>('file');
  const [bailoutDate, setBailoutDate] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  });
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [collapsedItems, setCollapsedItems] = useState<Record<number, boolean>>({});

  const toggleCollapse = (idx: number) => {
    setCollapsedItems((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const collapseAll = () => {
    const state: Record<number, boolean> = {};
    data.forEach((_, i) => (state[i] = true));
    setCollapsedItems(state);
  };

  const expandAll = () => setCollapsedItems({});

  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeErr = validateFileSize(file, MAX_EXCEL_SIZE_BYTES);
    if (sizeErr) {
      setUploadError(sizeErr);
      e.target.value = '';
      return;
    }

    setIsProcessing(true);
    setUploadError(null);
    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      if (!validateExcelMagicBytes(buffer)) {
        setUploadError('Format file tidak valid. Harap upload file Excel (.xlsx/.xls) yang sah.');
        return;
      }
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new Error('No sheet found');
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
      setData(normalizeRows(jsonData));
    } catch (err) {
      console.error('Error reading Excel:', err);
      setUploadError('Gagal membaca file Excel');
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handlePasteSubmit = () => {
    const parsed = parsePasteInput(pasteText);
    setData(parsed);
  };

  const handleCopy = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const pickerDateObj = new Date(bailoutDate + 'T00:00:00');
  const isWeekend = !isNaN(pickerDateObj.getTime()) && (pickerDateObj.getDay() === 0 || pickerDateObj.getDay() === 6);
  const dateStr = !isNaN(pickerDateObj.getTime()) ? formatIDDate(pickerDateObj) : formatIDDate(new Date());

  const totalMinus = data.reduce((sum, row) => sum + parseBailoutValue(row['BAILOUT']), 0);

  const WEEKEND_EXCLUDED_AGENTS = ['TRINERGI UTAMA JAYA'];

  const AGENT_DISPLAY_NAMES: Record<string, string> = {
    'CV. MITRA PERDANA INDONESIA (MPI)': 'Kang Diwa & Mas Endi',
    'CV. ANEKA JASA': 'PT.ANEKA JASA',
    'CV. DRAGO MULTIMEDIA JASALINDO - DRAGO': 'Kang Deni',
    'PT. TRINERGI UTAMA JAYA - TUJ': 'Pak Doni & Bu Faradina',
    'HAFSAH & BROTHERS': 'Team HAFSAH & BROTHERS',
    'DIKASA': 'Pak Erwin',
    'MAJU BERSAMA SUMBAWA (MBS)': 'MAJU BERSAMA SUMBAWA (MBS)',
    'HAIFA': 'Bang Hairul',
    'LOMBOQ TATAS': 'Team LOMBOQ TATAS',
    'REJEKI UNTUK ANAK (RUA)': 'Pak Eko & Bu Nita',
    'AGUSONO': 'Pak Agusono',
    'BMAX CPY': 'Pak Arif',
    'TEGAR MANDIRI': 'Team Tegar Mandiri',
    'PT. TRINERGI UTAMA JAYA - TUJ MBI': 'Mitra MBI',
    'BERKAH JAYA ELEKTRIK (BJE)': 'Pak Arie dan Bu Puji',
    'GUNUNGRAYA': 'Mitra Pak Wiroyo',
    'FAYAZA': 'Bang Mawardi',
    'ABDUL AJI': 'Pak Abdul Aji',
    'KANZUL HAKIKI': 'Mitra Kanzul Hakiki',
    'BSL': 'Pak Maksum',
    'BERKAH SOFIE': 'Pak Ciptadi',
  };

  const getDisplayName = (nama: string): string => {
    return AGENT_DISPLAY_NAMES[nama] || nama;
  };

  const buildMessage = (nama: string, amount: number): string => {
    const displayName = getDisplayName(nama);
    const header = `Assalamu'alaikum Warahmatullahi Wabarakatuh,\nDear ${displayName}\n\nBerikut kami sampaikan minus pada tanggal ${dateStr} sebesar ${formatIDCurrency(amount)}`;

    const isExcluded = WEEKEND_EXCLUDED_AGENTS.some((agent) => nama.toUpperCase().includes(agent.toUpperCase()));

    if (isWeekend && !isExcluded) {
      return `${header}\n\nMohon bantuan pelimpahannya (setor ke bank jika memungkinkan atau via internet banking) untuk menghindari penumpukan di hari Senin.\n\nHatur Nuhun 🙏\nSemoga kita semua selalu di berikan kesehatan & selalu dalam lindunganNya..\nAamiin`;
    }

    return `${header}\n\nMohon bantuan pelimpahannya sebelum pukul 09.00 WIB.\n\nHatur Nuhun 🙏\nSemoga kita semua selalu di berikan kesehatan & selalu dalam lindunganNya.\nAamiin`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <span className="hidden sm:flex h-11 w-11 rounded-xl bg-slate-900 text-white items-center justify-center shadow-sm shrink-0"><AlertTriangle className="h-5 w-5" /></span>
            <div>
              <h1 className="page-header-title text-[18px] text-slate-900">Informasi Bailout</h1>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">Upload Excel atau paste data untuk template pesan pengingat bailout per agen. Maks {MAX_EXCEL_SIZE_BYTES / 1024 / 1024} MB.</p>
            </div>
          </div>
          {uploadError && <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">{uploadError}</div>}

        {/* Input Mode Tabs */}
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-slate-100 border border-slate-200">
          <button onClick={() => setInputMode('file')} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-full transition-all cursor-pointer ${inputMode === 'file' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}><Upload className="h-3.5 w-3.5" /> Upload Excel</button>
          <button onClick={() => setInputMode('paste')} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-full transition-all cursor-pointer ${inputMode === 'paste' ? 'bg-slate-900 text-white shadow' : 'text-slate-600 hover:text-slate-900'}`}><ClipboardPaste className="h-3.5 w-3.5" /> Paste Data</button>
        </div>

        {/* Input Area */}
        {inputMode === 'file' ? (
          <div className="space-y-3">
            <label className="group relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-sm p-6 text-center cursor-pointer transition-all duration-150">
              <span className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm group-hover:border-indigo-200"><Upload className="h-5 w-5" /></span>
              <div>
                <p className="text-sm font-semibold tracking-tight text-slate-900">Seret file atau klik untuk upload</p>
                <p className="text-xs text-slate-500 mt-1">Mendukung .xlsx, .xls</p>
              </div>
              <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
            </label>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 shadow-sm w-fit">
              <label className="text-[11px] font-bold tracking-widest text-slate-500 uppercase whitespace-nowrap">Tanggal Redaksi:</label>
              <input type="date" value={bailoutDate} onChange={(e) => setBailoutDate(e.target.value)} className="text-xs font-medium tracking-tight text-slate-900 bg-transparent focus:outline-none cursor-pointer" />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={8} placeholder={`Paste data tab-separated di sini...\n\nContoh:\nKODE\tNAMA\tBAILOUT\nSBPAYS-CV-MPI-00\tCV. MITRA PERDANA INDONESIA (MPI)\t-1.507.495.541`} className="w-full rounded-2xl bg-white border border-slate-200 p-4 text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 resize-y shadow-sm" />
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={handlePasteSubmit} disabled={!pasteText.trim()} className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl shadow-sm transition-colors cursor-pointer"><ClipboardPaste className="h-3.5 w-3.5" /> Proses Data</button>
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-3.5 py-2.5 shadow-sm">
                <label className="text-[11px] font-bold tracking-widest text-slate-500 uppercase whitespace-nowrap">Tanggal Redaksi:</label>
                <input type="date" value={bailoutDate} onChange={(e) => setBailoutDate(e.target.value)} className="text-xs font-medium tracking-tight text-slate-900 bg-transparent focus:outline-none cursor-pointer" />
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Metrics */}
      {data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm"><p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">Total Agen</p><h3 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">{data.length}</h3></div>
          <div className="rounded-2xl bg-white border border-amber-200 p-5 shadow-sm bg-gradient-to-br from-amber-50 to-white"><p className="text-[11px] font-bold tracking-widest text-amber-600 uppercase">Total Minus</p><h3 className="text-2xl font-bold tracking-tight text-amber-700 mt-1">{formatIDCurrency(totalMinus)}</h3></div>
        </div>
      )}

      {/* Content */}
      {isProcessing ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center"><span className="inline-flex items-center gap-2 text-sm text-slate-500"><span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-indigo-600 animate-spin" /> Membaca file Excel…</span></div>
      ) : data.length > 0 ? (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between rounded-2xl bg-white border border-slate-200 p-3 shadow-sm">
            <h3 className="text-xs font-bold tracking-widest text-slate-600 uppercase">Draft Pesan per Agen</h3>
            <div className="flex items-center gap-1.5">
              <button onClick={collapseAll} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full transition-colors cursor-pointer"><FolderClosed className="h-3.5 w-3.5" /> Sembunyikan</button>
              <button onClick={expandAll} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full transition-colors cursor-pointer"><FolderOpen className="h-3.5 w-3.5" /> Tampilkan</button>
            </div>
          </div>

          {data.map((row, idx) => {
            const nama = String(row['NAMA'] || '-').trim();
            const amount = parseBailoutValue(row['BAILOUT']);
            const kode = String(row['KODE'] || '-').trim();
            const msg = buildMessage(nama, amount);
            const waUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
            const copied = copiedIdx === idx;
            const collapsed = !!collapsedItems[idx];

            return (
              <div key={idx} className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
                {/* Card Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                  <button
                    onClick={() => toggleCollapse(idx)}
                    className="flex items-center gap-2 text-left cursor-pointer group"
                  >
                    {collapsed ? (
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    )}
                    <span className="text-sm font-semibold text-slate-800">{nama}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{kode}</span>
                    <span className={`text-xs font-bold ${amount < 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {formatIDCurrency(amount)}
                    </span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopy(msg, idx)}
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer ${
                        copied
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Tersalin' : 'Salin'}
                    </button>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold rounded-xl shadow-sm transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" /> Kirim WA
                    </a>
                  </div>
                </div>

                {/* Message Preview */}
                {!collapsed && (
                  <div className="p-4">
                    <pre className="bg-white p-4 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto shadow-sm">{msg}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Upload atau paste data"
          description="Unggah file Excel (.xlsx) atau paste data tab-separated dengan kolom KODE, NAMA, dan BAILOUT."
          icon={<Upload className="w-8 h-8 text-slate-300" />}
        />
      )}
    </div>
  );
}
