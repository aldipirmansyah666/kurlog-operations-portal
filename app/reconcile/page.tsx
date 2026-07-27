'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
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
import { normalizeReconcileRows, validateAll, validateExcelFile } from '@/lib/reconcileValidator';
import EmptyState from '@/app/components/ui/EmptyState';

export default function ReconcilePage() {
  const [validRows, setValidRows] = useState<ValidatedReconcileRow[]>([]);
  const [rejectedRows, setRejectedRows] = useState<ValidatedReconcileRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showValid, setShowValid] = useState(true);
  const [showRejected, setShowRejected] = useState(true);
  const [fileValidation, setFileValidation] = useState<ExcelValidationResult | null>(null);

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
        const normalized = normalizeReconcileRows(jsonData);
        const { valid, rejected } = validateAll(normalized);
        const fileResult = validateExcelFile(normalized);
        setValidRows(valid);
        setRejectedRows(rejected);
        setFileValidation(fileResult);
      } catch (err) {
        console.error('Error reading Excel:', err);
      }
      setIsProcessing(false);
    };
    reader.readAsBinaryString(file);
  };

  const handleExportValid = () => {
    if (validRows.length === 0) return;

    const exportData = validRows.map(({ rowIndex, isValid, reason, ...rest }) => rest);
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Valid');
    XLSX.writeFile(wb, 'reconcile_valid.xlsx');
  };

  return (
    <main className="max-w-7xl mx-auto p-6 md:p-10 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-indigo-500" />
          <h1 className="text-lg font-semibold text-slate-800">Validasi Reconcile</h1>
        </div>
        <p className="text-xs text-slate-400">
          Upload file Excel reconcile untuk memvalidasi data sebelum dikirim ke KurLog.
        </p>
        <div>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-[#1E293B] file:text-white hover:file:bg-slate-700 file:cursor-pointer bg-slate-50 p-2 rounded-lg border border-[#E2E8F0] cursor-pointer"
          />
        </div>
      </div>

      {/* File Validation Status */}
      {fileValidation && (
        <div className={`rounded-xl border p-4 shadow-sm ${
          fileValidation.isFileValid
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-rose-50 border-rose-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {fileValidation.isFileValid ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-500" />
              )}
              <div>
                <p className={`text-sm font-semibold ${
                  fileValidation.isFileValid ? 'text-emerald-700' : 'text-rose-700'
                }`}>
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
                <span className={`px-2 py-0.5 rounded-full font-semibold border ${
                  fileValidation.isEC3Valid
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                    : 'bg-rose-100 text-rose-700 border-rose-300'
                }`}>
                  EC3 {fileValidation.isEC3Valid ? '✓' : '✗'}
                </span>
                <span className={`px-2 py-0.5 rounded-full font-semibold border ${
                  fileValidation.isPKHValid
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                    : 'bg-rose-100 text-rose-700 border-rose-300'
                }`}>
                  PKH {fileValidation.isPKHValid ? '✓' : '✗'}
                </span>
              </div>
              <button
                disabled={!fileValidation.isFileValid}
                className={`inline-flex items-center gap-1.5 text-xs px-4 py-2 font-medium rounded-lg transition-colors ${
                  fileValidation.isFileValid
                    ? 'bg-[#1E293B] hover:bg-slate-700 text-white cursor-pointer'
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
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center text-sm text-slate-400 shadow-sm">
          Membaca file Excel...
        </div>
      ) : fileValidation ? (
        <div className="space-y-4">
          {/* Valid Section */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
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
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#1E293B] hover:bg-slate-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Export Excel
                </button>
              )}
            </div>
            {showValid && validRows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-emerald-50 text-emerald-700 uppercase">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">No Resi</th>
                      <th className="p-2.5">Produk</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-slate-600">
                    {validRows.map((row) => (
                      <tr key={row.rowIndex} className="hover:bg-emerald-50/30 transition-colors">
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
          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
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
                  <thead className="bg-rose-50 text-rose-700 uppercase">
                    <tr>
                      <th className="p-2.5">#</th>
                      <th className="p-2.5">No Resi</th>
                      <th className="p-2.5">Produk</th>
                      <th className="p-2.5">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0] text-slate-600">
                    {rejectedRows.map((row) => (
                      <tr key={row.rowIndex} className="hover:bg-rose-50/30 transition-colors">
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
    </main>
  );
}
