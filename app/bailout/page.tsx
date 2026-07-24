'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
        setData(normalizeRows(jsonData));
      } catch (err) {
        console.error('Error reading Excel:', err);
      }
      setIsProcessing(false);
    };
    reader.readAsBinaryString(file);
  };

  const handlePasteSubmit = () => {
    const parsed = parsePasteInput(pasteText);
    setData(parsed);
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const dateObj = new Date(bailoutDate + 'T00:00:00');
  const dateStr = isNaN(dateObj.getTime()) ? '-' : formatIDDate(dateObj);

  const totalMinus = data.reduce((sum, row) => sum + parseBailoutValue(row['BAILOUT']), 0);

  const buildMessage = (nama: string, amount: number): string => {
    return `Assalamu'alaikum Warahmatullahi Wabarakatuh,\nDear ${nama}\n\nBerikut kami sampaikan minus pada tanggal ${dateStr} minusnya sebesar ${formatIDCurrency(amount)}\n\nMohon bantuan pelimpahannya sebelum pukul 09.00 WIB.\n\t\nHatur Nuhun 🙏\nSemoga kita semua selalu di berikan kesehatan & selalu dalam lindunganNya.\nAamiin`;
  };

  return (
    <main className="max-w-7xl mx-auto p-6 md:p-10 space-y-6">
      {/* Header */}
      <div className="bg-slate-900/70 rounded-xl border border-slate-800/80 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <h1 className="text-lg font-semibold text-white">Informasi Bailout</h1>
        </div>
        <p className="text-xs text-slate-400">
          Upload file Excel atau paste data untuk membuat template pesan pengingat bailout per agen.
        </p>

        {/* Input Mode Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 w-fit">
          <button
            onClick={() => setInputMode('file')}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              inputMode === 'file'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Upload Excel
          </button>
          <button
            onClick={() => setInputMode('paste')}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              inputMode === 'paste'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ClipboardPaste className="w-3.5 h-3.5" /> Paste Data
          </button>
        </div>

        {/* Input Area */}
        {inputMode === 'file' ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-500 file:cursor-pointer bg-slate-950 p-2 rounded-lg border border-slate-800 cursor-pointer"
            />
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 whitespace-nowrap">Tanggal Minus:</label>
              <input
                type="date"
                value={bailoutDate}
                onChange={(e) => setBailoutDate(e.target.value)}
                className="text-xs text-white bg-slate-950 p-2 rounded-lg border border-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={8}
              placeholder={`Paste data tab-separated di sini...\n\nContoh:\nKODE\tNAMA\tBAILOUT\nSBPAYS-CV-MPI-00\tCV. MITRA PERDANA INDONESIA (MPI)\t-1.507.495.541`}
              className="w-full text-xs font-mono text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 focus:outline-none focus:border-blue-500 resize-y placeholder:text-slate-600"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handlePasteSubmit}
                disabled={!pasteText.trim()}
                className="inline-flex items-center gap-1.5 text-xs px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-lg transition-colors cursor-pointer"
              >
                <ClipboardPaste className="w-3.5 h-3.5" /> Proses Data
              </button>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400 whitespace-nowrap">Tanggal Minus:</label>
                <input
                  type="date"
                  value={bailoutDate}
                  onChange={(e) => setBailoutDate(e.target.value)}
                  className="text-xs text-white bg-slate-950 p-2 rounded-lg border border-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Metrics */}
      {data.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800/80">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total Agen</p>
            <h3 className="text-2xl font-bold text-white mt-1">{data.length}</h3>
          </div>
          <div className="bg-slate-900/70 p-4 rounded-xl border border-amber-500/20">
            <p className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold">Total Minus</p>
            <h3 className="text-2xl font-bold text-amber-400 mt-1">{formatIDCurrency(totalMinus)}</h3>
          </div>
        </div>
      )}

      {/* Content */}
      {isProcessing ? (
        <div className="bg-slate-900/70 rounded-xl border border-slate-800/80 p-12 text-center text-sm text-slate-400">
          Membaca file Excel...
        </div>
      ) : data.length > 0 ? (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between bg-slate-900/40 p-3 rounded-lg border border-slate-800">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Draft Pesan per Agen
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={collapseAll}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition-colors cursor-pointer"
              >
                <FolderClosed className="w-3.5 h-3.5" /> Sembunyikan
              </button>
              <button
                onClick={expandAll}
                className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition-colors cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5" /> Tampilkan
              </button>
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
              <div key={idx} className="bg-slate-900/70 rounded-xl border border-slate-800/80 overflow-hidden">
                {/* Card Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800/60">
                  <button
                    onClick={() => toggleCollapse(idx)}
                    className="flex items-center gap-2 text-left cursor-pointer group"
                  >
                    {collapsed ? (
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                    )}
                    <span className="text-sm font-semibold text-white">{nama}</span>
                    <span className="text-[11px] text-slate-500 font-mono">{kode}</span>
                    <span className={`text-xs font-bold ${amount < 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {formatIDCurrency(amount)}
                    </span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopy(msg, idx)}
                      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md border transition-colors cursor-pointer ${
                        copied
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                    >
                      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Tersalin' : 'Salin'}
                    </button>
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-medium rounded-md transition-colors"
                    >
                      <Send className="w-3.5 h-3.5" /> Kirim WA
                    </a>
                  </div>
                </div>

                {/* Message Preview */}
                {!collapsed && (
                  <div className="p-4">
                    <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-emerald-400 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {msg}
                    </pre>
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
          icon={<Upload className="w-8 h-8 text-slate-500" />}
        />
      )}
    </main>
  );
}
