'use client';

import { useState } from 'react';
import {
  FileCheck,
  Upload,
  Download,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Send,
  AlertTriangle,
} from 'lucide-react';
import type { ValidatedReconcileRow, ExcelValidationResult } from '@/lib/types';
import { normalizeReconcileRows, parseReconcileRowsFromAOA, validateAll, validateExcelFile } from '@/lib/reconcileValidator';
import EmptyState from '@/app/components/ui/EmptyState';
import { MAX_EXCEL_SIZE_BYTES, validateFileSize, validateExcelMagicBytes } from '@/lib/fileValidation';

export default function ReconcilePage() {
  const [validRows, setValidRows] = useState<ValidatedReconcileRow[]>([]);
  const [rejectedRows, setRejectedRows] = useState<ValidatedReconcileRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showValid, setShowValid] = useState(true);
  const [showRejected, setShowRejected] = useState(true);
  const [fileValidation, setFileValidation] = useState<ExcelValidationResult | null>(null);

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
      const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' }) as unknown[][];
      let normalized = parseReconcileRowsFromAOA(aoa);
      if (normalized.length === 0) {
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
        normalized = normalizeReconcileRows(jsonData);
      }
      const { valid, rejected } = validateAll(normalized);
      const fileResult = validateExcelFile(normalized);
      setValidRows(valid);
      setRejectedRows(rejected);
      setFileValidation(fileResult);
    } catch (err) {
      console.error('Error reading Excel:', err);
      setUploadError('Gagal membaca file Excel');
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleExportValid = async () => {
    if (validRows.length === 0) return;

    const XLSX = await import('xlsx');
    const exportData = validRows.map((row) => {
      const rest = { ...row } as Record<string, unknown>;
      delete rest['rowIndex'];
      delete rest['isValid'];
      delete rest['reason'];
      return rest;
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Valid');
    XLSX.writeFile(wb, 'reconcile_valid.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-violet-600 to-indigo-600" />
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <span className="hidden sm:flex h-11 w-11 rounded-xl bg-slate-900 text-white items-center justify-center shadow-sm shrink-0">
              <FileCheck className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-[18px] font-bold tracking-tight text-slate-900">Validasi Reconcile</h1>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                Upload file Excel reconcile untuk memvalidasi data sebelum dikirim ke KurLog. Maks {MAX_EXCEL_SIZE_BYTES / 1024 / 1024} MB.
              </p>
            </div>
          </div>
          {uploadError && (
            <div className="px-3 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">{uploadError}</div>
          )}
          <label className="group relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-sm p-6 text-center cursor-pointer transition-all duration-150">
            <span className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm group-hover:border-indigo-200">
              <Upload className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Seret file atau klik untuk upload</p>
              <p className="text-xs text-slate-500 mt-1">Mendukung .xlsx, .xls</p>
            </div>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* File Validation Status */}
      {fileValidation && (
        <div
          className={`rounded-2xl border p-4 shadow-sm ${
            fileValidation.isFileValid ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {fileValidation.isFileValid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              )}
              <div>
                <p
                  className={`text-sm font-semibold ${
                    fileValidation.isFileValid ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {fileValidation.isFileValid ? 'FILE VALID / LOLOS CHECK' : 'DATA TIDAK SESUAI - Pengecekan Kategori Gagal'}
                </p>
                {!fileValidation.isFileValid && fileValidation.errors.length > 0 && (
                  <ul className="mt-1 text-xs text-rose-600 space-y-0.5">
                    {fileValidation.errors.map((err, i) => (
                      <li key={i}>• {err}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-[11px]">
                <span
                  className={`px-2 py-0.5 rounded-full font-semibold border ${
                    fileValidation.isEC3Valid
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                      : 'bg-rose-100 text-rose-700 border-rose-300'
                  }`}
                >
                  EC3 {fileValidation.isEC3Valid ? '✓' : '✗'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full font-semibold border ${
                    fileValidation.isPKHValid
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                      : 'bg-rose-100 text-rose-700 border-rose-300'
                  }`}
                >
                  PKH {fileValidation.isPKHValid ? '✓' : '✗'}
                </span>
              </div>
              <button
                disabled={!fileValidation.isFileValid}
                className={`inline-flex items-center gap-1.5 text-xs px-4 py-2 font-medium rounded-xl shadow-sm transition-colors ${
                  fileValidation.isFileValid
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                Kirim ke KurLog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {isProcessing ? (
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center shadow-sm">
          <span className="inline-flex items-center gap-2 text-sm text-slate-500">
            <span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-indigo-600 animate-spin" /> Membaca file
            Excel…
          </span>
        </div>
      ) : fileValidation ? (
        <div className="space-y-4">
          {/* Valid Section */}
          <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <button
                onClick={() => setShowValid(!showValid)}
                className="flex items-center gap-2 text-left cursor-pointer group"
              >
                {showValid ? (
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                )}
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-semibold text-slate-800">Data Lolos Validasi</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                  {validRows.length} baris
                </span>
              </button>
              {validRows.length > 0 && (
                <button
                  onClick={handleExportValid}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Export Excel
                </button>
              )}
            </div>
            {showValid && validRows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur text-slate-500 uppercase text-[11px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 font-semibold">#</th>
                      <th className="p-2.5 font-semibold">No Resi</th>
                      <th className="p-2.5 font-semibold">Produk</th>
                      <th className="p-2.5 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-600">
                    {validRows.map((row) => (
                      <tr key={row.rowIndex} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-2.5 text-slate-400">{row.rowIndex}</td>
                        <td className="p-2.5 font-mono font-semibold text-blue-600">{row.nomor_resi || '-'}</td>
                        <td className="p-2.5">{row.produk || '-'}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                            LOLOS
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Rejected Section */}
          <div className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <button
                onClick={() => setShowRejected(!showRejected)}
                className="flex items-center gap-2 text-left cursor-pointer group"
              >
                {showRejected ? (
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                )}
                <XCircle className="w-4 h-4 text-rose-500" />
                <span className="text-sm font-semibold text-slate-800">Data Ditolak</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                  {rejectedRows.length} baris
                </span>
              </button>
            </div>
            {showRejected && rejectedRows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur text-slate-500 uppercase text-[11px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 font-semibold">#</th>
                      <th className="p-2.5 font-semibold">No Resi</th>
                      <th className="p-2.5 font-semibold">Produk</th>
                      <th className="p-2.5 font-semibold">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-600">
                    {rejectedRows.map((row) => (
                      <tr key={row.rowIndex} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-2.5 text-slate-400">{row.rowIndex}</td>
                        <td className="p-2.5 font-mono font-semibold text-blue-600">{row.nomor_resi || '-'}</td>
                        <td className="p-2.5">{row.produk || '-'}</td>
                        <td className="p-2.5 text-rose-600 font-medium">{row.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <EmptyState
          title="Upload file Excel"
          description="Unggah file Excel reconcile (.xlsx) untuk memvalidasi data sebelum dikirim ke KurLog."
          icon={<Upload className="w-8 h-8 text-slate-300" />}
        />
      )}
    </div>
  );
}
