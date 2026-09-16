'use client';

import { useState, useMemo } from 'react';
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
import { MAX_EXCEL_SIZE_BYTES, validateFileSize, validateExcelMagicBytes } from '@/lib/fileValidation';
import { buildBaggingMessage } from '@/lib/baggingMessage';
import { parseBaggingRowsFromAOA } from '@/lib/baggingParser';
import { normalizePeriodeToISO } from '@/lib/bailoutParser';

const BAGGING_NBSP_REGEX = /\u00A0/g;
const BAGGING_ZERO_WIDTH_REGEX = /[\uFEFF\u200B\u200C\u200D\u2060]/g;
function stripBagging(v: string): string {
  return v.replace(BAGGING_NBSP_REGEX, ' ').replace(BAGGING_ZERO_WIDTH_REGEX, '').replace(/[\t\r\n]/g, ' ').trim();
}

function formatDateDDMMYYYY(value: unknown): string {
  if (!value && value !== 0) return '-';
  // Jika value adalah Date object
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return String(value);
    const d = String(value.getDate()).padStart(2, '0');
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const y = value.getFullYear();
    return `${d}/${m}/${y}`;
  }
  // Jika object dengan getTime (tapi bukan Date) — guard type-safe
  if (typeof value === 'object' && value !== null && typeof (value as { getTime?: unknown }).getTime === 'function') {
    try {
      const dt = value as Date;
      if (!isNaN(dt.getTime())) {
        const d = String(dt.getDate()).padStart(2, '0');
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const y = dt.getFullYear();
        return `${d}/${m}/${y}`;
      }
    } catch {
      return String(value);
    }
  }
  if (typeof value === 'number') {
    // Excel serial atau YYYYMMDD numeric — coba via normalizePeriodeToISO dulu
    const iso = normalizePeriodeToISO(value);
    if (iso) {
      const [y, m, d] = iso.split('-');
      return `${d}/${m}/${y}`;
    }
    // Fallback serial
    const date = new Date((value - 25569) * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      const d = String(date.getDate()).padStart(2, '0');
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const y = date.getFullYear();
      return `${d}/${m}/${y}`;
    }
    return String(value);
  }
  const str = String(value).trim();
  const iso = normalizePeriodeToISO(str);
  if (iso) {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }
  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }
  return String(value);
}

export default function BaggingPage() {
  const [baggingData, setBaggingData] = useState<BaggingRow[]>([]);
  const [isProcessingExcel, setIsProcessingExcel] = useState(false);
  const [collapsedAgens, setCollapsedAgens] = useState<Record<string, boolean>>({});
  const [copiedAgen, setCopiedAgen] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingExcel(true);
    setUploadError(null);
    try {
      const XLSX = await import('xlsx');
      const allParsedRows: BaggingRow[] = [];
      for (const file of Array.from(files)) {
        const sizeErr = validateFileSize(file, MAX_EXCEL_SIZE_BYTES);
        if (sizeErr) {
          setUploadError(sizeErr);
          continue;
        }
        try {
          const buffer = await file.arrayBuffer();
          if (!validateExcelMagicBytes(buffer)) {
            setUploadError(`${file.name}: Format file tidak valid. Harap upload file Excel (.xlsx/.xls) yang sah.`);
            continue;
          }
          const workbook = XLSX.read(buffer, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          if (!sheetName) continue;
          const sheet = workbook.Sheets[sheetName];
          const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' }) as unknown[][];
          const parsed = parseBaggingRowsFromAOA(aoa);
          // Fallback ke sheet_to_json jika AOA tidak menemukan header dinamis (mis. sheet tanpa header jelas)
          if (parsed.length > 0) allParsedRows.push(...parsed);
          else {
            const jsonData = XLSX.utils.sheet_to_json<BaggingRow>(sheet, { defval: '' });
            // Sanitasi invisible ringan untuk fallback
            const sanitized = jsonData.map((row) => {
              const obj: BaggingRow = {};
              for (const [k, v] of Object.entries(row)) {
                const cleanKey = String(k).replace(/[\u00A0]/g, ' ').replace(/[\uFEFF\u200B\u200C\u200D]/g, '').trim();
                const cleanVal = typeof v === 'string' ? v.replace(/[\u00A0]/g, ' ').replace(/[\uFEFF\u200B\u200C\u200D\r]/g, '').trim() : v;
                obj[cleanKey] = cleanVal as unknown as string;
              }
              return obj;
            });
            allParsedRows.push(...sanitized);
          }
        } catch (err) {
          console.error(`Error reading ${file.name}:`, err);
          setUploadError(`Gagal membaca ${file.name}`);
        }
      }
      if (allParsedRows.length > 0) setBaggingData(allParsedRows);
    } finally {
      setIsProcessingExcel(false);
      e.target.value = '';
    }
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

  const handleCopy = async (text: string, agen: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // fallback for insecure contexts
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedAgen(agen);
    setTimeout(() => setCopiedAgen(null), 2000);
  };

  const filteredBagging = useMemo(
    () => baggingData.filter((row) => stripBagging(String(row['Status Bagging'] ?? '')).toLowerCase() === 'belum dibagging'),
    [baggingData]
  );

  const groupedByAgen = useMemo(
    () =>
      filteredBagging.reduce<Record<string, BaggingRow[]>>((acc, row) => {
        const raw = String(row['Agen'] ?? 'LAINNYA');
        const agen = stripBagging(raw).replace(/\s+/g, ' ') || 'LAINNYA';
        if (!acc[agen]) acc[agen] = [];
        acc[agen].push(row);
        return acc;
      }, {}),
    [filteredBagging]
  );

  const agenKeys = useMemo(() => Object.keys(groupedByAgen), [groupedByAgen]);

  const agenMessages = useMemo(() => {
    const map: Record<string, string> = {};
    for (const agenName of agenKeys) {
      const items = groupedByAgen[agenName] ?? [];
      const sampleDate = formatDateDDMMYYYY(items[0]?.['Tanggal']);
      const resiList = items.map((i) => String(i['No Resi'] || '-').trim()).filter(Boolean);
      map[agenName] = buildBaggingMessage({ agenName, tanggal: sampleDate, resiList });
    }
    return map;
  }, [agenKeys, groupedByAgen]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600" />
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <span className="hidden sm:flex h-11 w-11 rounded-xl bg-slate-900 text-white items-center justify-center shadow-sm shrink-0"><ShoppingBag className="h-5 w-5" /></span>
            <div>
              <h1 className="page-header-title text-[18px] text-slate-900">Otomasi Pengingat Bagging</h1>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">Upload Excel KurLog untuk memfilter paket belum dibagging dan generate template WhatsApp per agen. Maks {MAX_EXCEL_SIZE_BYTES / 1024 / 1024} MB per file.</p>
            </div>
          </div>
          {uploadError && <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">{uploadError}</div>}
          <label className="group relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-sm p-6 text-center cursor-pointer transition-all duration-150">
            <span className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm group-hover:border-indigo-200"><Upload className="h-5 w-5" /></span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Seret file atau klik untuk upload</p>
              <p className="text-xs text-slate-500 mt-1">Mendukung .xlsx, .xls — multi-file</p>
            </div>
            <input type="file" accept=".xlsx,.xls" multiple onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
          </label>
        </div>
      </div>

      {/* Metrics */}
      {baggingData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm"><p className="text-[11px] font-bold tracking-widest text-slate-500 uppercase">Total Resi</p><h3 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">{baggingData.length}</h3></div>
          <div className="rounded-2xl bg-white border border-amber-200 p-5 shadow-sm bg-gradient-to-br from-amber-50 to-white"><p className="text-[11px] font-bold tracking-widest text-amber-600 uppercase">Belum Dibagging</p><h3 className="text-2xl font-bold tracking-tight text-amber-700 mt-1">{filteredBagging.length}</h3></div>
          <div className="rounded-2xl bg-white border border-indigo-200 p-5 shadow-sm bg-gradient-to-br from-indigo-50 to-white"><p className="text-[11px] font-bold tracking-widest text-indigo-600 uppercase">Agen Terdampak</p><h3 className="text-2xl font-bold tracking-tight text-indigo-700 mt-1">{agenKeys.length}</h3></div>
        </div>
      )}

      {/* Content */}
      {isProcessingExcel ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center"><span className="inline-flex items-center gap-2 text-sm text-slate-500"><span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-indigo-600 animate-spin" /> Membaca file Excel…</span></div>
      ) : agenKeys.length > 0 ? (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between rounded-2xl bg-white border border-slate-200 p-3 shadow-sm">
            <h3 className="text-xs font-bold tracking-widest text-slate-600 uppercase">Draft Pesan per Agen</h3>
            <div className="flex items-center gap-1.5">
              <button onClick={() => collapseAll(agenKeys)} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full transition-colors cursor-pointer"><FolderClosed className="h-3.5 w-3.5" /> Sembunyikan</button>
              <button onClick={expandAll} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full transition-colors cursor-pointer"><FolderOpen className="h-3.5 w-3.5" /> Tampilkan</button>
            </div>
          </div>

          {/* Agen Cards */}
          {agenKeys.map((agenName) => {
            const items = groupedByAgen[agenName];
            const msg = agenMessages[agenName] ?? '';
            const waUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
            const collapsed = !!collapsedAgens[agenName];
            const copied = copiedAgen === agenName;

            return (
              <div key={agenName} className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                  <button
                    onClick={() => toggleCollapse(agenName)}
                    className="flex items-center gap-2 text-left cursor-pointer group"
                  >
                    {collapsed ? (
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    )}
                    <span className="text-sm font-semibold text-slate-800">{agenName}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                      {items.length} paket
                    </span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopy(msg, agenName)}
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

                {!collapsed && (
                  <div className="p-4 space-y-3">
                    <pre className="bg-white p-4 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-wrap max-h-40 overflow-y-auto shadow-sm">{msg}</pre>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] tracking-wider">
                          <tr>
                            <th className="p-3">Tanggal</th>
                            <th className="p-3">No Resi</th>
                            <th className="p-3">Kode Layanan</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {items.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-2.5">{formatDateDDMMYYYY(row['Tanggal'])}</td>
                              <td className="p-2.5 font-mono font-semibold text-blue-600">{String(row['No Resi'] || '-')}</td>
                              <td className="p-2.5">{String(row['Kode Layanan'] || '-')}</td>
                              <td className="p-2.5 text-amber-600 font-medium">{String(row['Status Bagging'] || '-')}</td>
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
          description="Unggah file Excel KurLog (.xlsx / .xls) untuk melihat draft pengingat bagging per agen."
          icon={<Upload className="w-8 h-8 text-slate-300" />}
        />
      )}
    </div>
  );
}
