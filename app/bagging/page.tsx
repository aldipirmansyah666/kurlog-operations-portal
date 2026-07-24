'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  ShoppingBag,
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  Send,
  FolderClosed,
  FolderOpen,
  Upload,
} from 'lucide-react';
import type { BaggingRow } from '@/lib/types';
import EmptyState from '@/app/components/ui/EmptyState';

function formatDateDDMMYYYY(value: unknown): string {
  if (!value) return '-';
  let date: Date;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'number') {
    date = new Date((value - 25569) * 86400 * 1000);
  } else {
    const str = String(value).trim();
    const parts = str.split(/[/\-\.]/);
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        date = new Date(+parts[2], +parts[1] - 1, +parts[0]);
      } else if (parts[0].length === 4) {
        date = new Date(+parts[0], +parts[1] - 1, +parts[2]);
      } else {
        date = new Date(str);
      }
    } else {
      date = new Date(str);
    }
  }
  if (isNaN(date.getTime())) return String(value);
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export default function BaggingPage() {
  const [baggingData, setBaggingData] = useState<BaggingRow[]>([]);
  const [isProcessingExcel, setIsProcessingExcel] = useState(false);
  const [collapsedAgens, setCollapsedAgens] = useState<Record<string, boolean>>({});
  const [copiedAgen, setCopiedAgen] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingExcel(true);
    let allParsedRows: BaggingRow[] = [];
    let filesProcessed = 0;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const workbook = XLSX.read(bstr, { type: 'binary' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json<BaggingRow>(sheet, { range: 1 });
          allParsedRows = [...allParsedRows, ...jsonData];
        } catch (err) {
          console.error(`Error reading ${file.name}:`, err);
        }
        filesProcessed++;
        if (filesProcessed === files.length) {
          setBaggingData(allParsedRows);
          setIsProcessingExcel(false);
        }
      };
      reader.readAsBinaryString(file);
    });
  };

  const toggleCollapse = (agenName: string) => {
    setCollapsedAgens((prev) => ({ ...prev, [agenName]: !prev[agenName] }));
  };

  const collapseAll = (keys: string[]) => {
    const state: Record<string, boolean> = {};
    keys.forEach((k) => (state[k] = true));
    setCollapsedAgens(state);
  };

  const expandAll = () => setCollapsedAgens({});

  const handleCopy = (text: string, agen: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAgen(agen);
    setTimeout(() => setCopiedAgen(null), 2000);
  };

  const filteredBagging = baggingData.filter(
    (row) => String(row['Status Bagging'] || '').trim().toLowerCase() === 'belum dibagging'
  );

  const groupedByAgen = filteredBagging.reduce<Record<string, BaggingRow[]>>((acc, row) => {
    const agen = String(row['Agen'] || 'LAINNYA').trim();
    if (!acc[agen]) acc[agen] = [];
    acc[agen].push(row);
    return acc;
  }, {});

  const agenKeys = Object.keys(groupedByAgen);

  return (
    <main className="max-w-7xl mx-auto p-6 md:p-10 space-y-6">
      {/* Header */}
      <div className="bg-slate-900/70 rounded-xl border border-slate-800/80 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-cyan-400" />
          <h1 className="text-lg font-semibold text-white">Otomasi Pengingat Bagging</h1>
        </div>
        <p className="text-xs text-slate-400">
          Upload file Excel KurLog untuk memfilter paket belum dibagging dan membuat template pesan WhatsApp per agen.
        </p>
        <div>
          <input
            type="file"
            accept=".xlsx"
            multiple
            onChange={handleFileUpload}
            className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-500 file:cursor-pointer bg-slate-950 p-2 rounded-lg border border-slate-800 cursor-pointer"
          />
        </div>
      </div>

      {/* Metrics */}
      {baggingData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800/80">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total Resi</p>
            <h3 className="text-2xl font-bold text-white mt-1">{baggingData.length}</h3>
          </div>
          <div className="bg-slate-900/70 p-4 rounded-xl border border-amber-500/20">
            <p className="text-[11px] uppercase tracking-wider text-amber-400 font-semibold">Belum Dibagging</p>
            <h3 className="text-2xl font-bold text-amber-400 mt-1">{filteredBagging.length}</h3>
          </div>
          <div className="bg-slate-900/70 p-4 rounded-xl border border-blue-500/20">
            <p className="text-[11px] uppercase tracking-wider text-blue-400 font-semibold">Agen Terdampak</p>
            <h3 className="text-2xl font-bold text-blue-400 mt-1">{agenKeys.length}</h3>
          </div>
        </div>
      )}

      {/* Content */}
      {isProcessingExcel ? (
        <div className="bg-slate-900/70 rounded-xl border border-slate-800/80 p-12 text-center text-sm text-slate-400">
          Membaca file Excel...
        </div>
      ) : agenKeys.length > 0 ? (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between bg-slate-900/40 p-3 rounded-lg border border-slate-800">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Draft Pesan per Agen
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => collapseAll(agenKeys)}
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

          {/* Agen Cards */}
          {agenKeys.map((agenName) => {
            const items = groupedByAgen[agenName];
            const sampleDate = formatDateDDMMYYYY(items[0]?.['Tanggal']);
            const resiListStr = items.map((i) => i['No Resi']).join('\n');
            const msg = `Selamat pagi pak, mohon maaf mengganggu waktunya pak, kami sampaikan ada paket di agen bapak ${agenName} pada Tanggal ${sampleDate} yang belum dibagging ya pak?\nMohon dibantu untuk segera dibagging.\n\nBerikut informasi resinya :\n${resiListStr}`;
            const waUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
            const collapsed = !!collapsedAgens[agenName];
            const copied = copiedAgen === agenName;

            return (
              <div key={agenName} className="bg-slate-900/70 rounded-xl border border-slate-800/80 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-800/60">
                  <button
                    onClick={() => toggleCollapse(agenName)}
                    className="flex items-center gap-2 text-left cursor-pointer group"
                  >
                    {collapsed ? (
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
                    )}
                    <span className="text-sm font-semibold text-white">{agenName}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {items.length} paket
                    </span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopy(msg, agenName)}
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

                {!collapsed && (
                  <div className="p-4 space-y-3">
                    <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-mono text-emerald-400 whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {msg}
                    </pre>
                    <div className="overflow-x-auto rounded-lg border border-slate-800">
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-950 text-slate-400 uppercase">
                          <tr>
                            <th className="p-2.5">Tanggal</th>
                            <th className="p-2.5">No Resi</th>
                            <th className="p-2.5">Kode Layanan</th>
                            <th className="p-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-slate-300">
                          {items.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                              <td className="p-2.5">{formatDateDDMMYYYY(row['Tanggal'])}</td>
                              <td className="p-2.5 font-mono font-semibold text-blue-400">{String(row['No Resi'] || '-')}</td>
                              <td className="p-2.5">{String(row['Kode Layanan'] || '-')}</td>
                              <td className="p-2.5 text-amber-400 font-medium">{String(row['Status Bagging'] || '-')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Upload file Excel"
          description="Unggah file Excel KurLog (.xlsx) untuk melihat draft pengingat bagging per agen."
          icon={<Upload className="w-8 h-8 text-slate-500" />}
        />
      )}
    </main>
  );
}
