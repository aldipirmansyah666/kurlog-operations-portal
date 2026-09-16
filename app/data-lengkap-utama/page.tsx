'use client';

import { useState, useMemo, useRef } from 'react';
import { Plus, FileUp, Search, Trash2, Pencil, Database, X, Download, Table2, ClipboardPaste, Filter, RotateCcw } from 'lucide-react';
import { useDataLengkapUtama } from '@/lib/hooks/useDataLengkapUtama';
import DataLengkapUtamaForm from '@/app/components/data-lengkap-utama/DataLengkapUtamaForm';
import PasteImportModal from '@/app/components/data-lengkap-utama/PasteImportModal';
import EmptyState from '@/app/components/ui/EmptyState';
import ToastContainer from '@/app/components/ui/Toast';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import Pagination from '@/app/components/ui/Pagination';
import StatCard from '@/app/components/ui/StatCard';
import { useToast } from '@/lib/hooks/useToast';
import { usePagination } from '@/lib/hooks/usePagination';
import { DATA_LENGKAP_UTAMA_COLUMNS, buildDataLengkapUtamaGroups, parseDataLengkapUtamaRows } from '@/lib/dataLengkapUtama';
import type { DataLengkapUtamaItem, DataLengkapUtamaValues } from '@/lib/types';
import { MAX_EXCEL_SIZE_BYTES, validateFileSize, validateExcelMagicBytes } from '@/lib/fileValidation';

const SEARCH_KEYS: (keyof DataLengkapUtamaValues)[] = [
  'ppid',
  'nama_loket_kurlog',
  'nama_loket_onpays',
  'no_hp_loket',
  'email',
  'user_mile',
  'nama_pemilik',
  'no_ktp',
  'no_npwp',
  'nib',
  'nomor_rekening',
  'regional',
  'kcu_kc',
];

const HEADER_GROUPS = buildDataLengkapUtamaGroups();

const FILTER_COLUMNS: { key: keyof DataLengkapUtamaValues; label: string }[] = [
  { key: 'syarat', label: 'Status · Syarat' },
  { key: 'pengajuan_survey_ke_pos', label: 'Status · Pengajuan Survey' },
  { key: 'pengajuan_pos', label: 'Status · Pengajuan Pos' },
  { key: 'aktivasi_kurlog', label: 'Status · Aktivasi Kurlog' },
  { key: 'transaksi', label: 'Status · Transaksi' },
  { key: 'pos_ppob', label: 'POS + PPOB' },
  { key: 'pos_only', label: 'POS Only' },
  { key: 'sicepat', label: 'Sicepat' },
  { key: 'regional', label: 'Regional' },
  { key: 'kcu_kc', label: 'KCU/KC' },
  { key: 'propinsi', label: 'Propinsi' },
  { key: 'kab_kota', label: 'Kab/Kota' },
  { key: 'rekomendasi', label: 'Rekomendasi' },
  { key: 'nama_bank', label: 'Bank' },
];

const EMPTY_FILTER_VALUE = '__empty__';

// Kolom beku (frozen) saat scroll horizontal: NO, PPID, NAMA LOKET DI ONPAYS.
// Kolom di kiri kolom beku diberi lebar tetap agar offset sticky deterministik.
const AKSI_WIDTH = 64;
const FIXED_WIDTHS: Record<string, number> = {
  no: 56,
  syarat: 110,
  pengajuan_survey_ke_pos: 120,
  pengajuan_pos: 110,
  pendaftaran_kurlog: 120,
  kelengkapan_perangkat: 120,
  aktivasi_kurlog: 110,
  aktivasi_sicepat: 110,
  training: 100,
  transaksi: 100,
  catatan: 140,
  waktu: 80,
  pos_ppob: 90,
  pos_only: 90,
  sicepat: 90,
  ppid: 130,
  nama_loket_kurlog: 170,
  nama_loket_onpays: 190,
};
const FROZEN_KEYS = ['no', 'ppid', 'nama_loket_onpays'];

const FROZEN_OFFSETS: Record<string, number> = (() => {
  const map: Record<string, number> = {};
  let acc = AKSI_WIDTH;
  for (const col of DATA_LENGKAP_UTAMA_COLUMNS) {
    if (FROZEN_KEYS.includes(col.key)) {
      map[col.key] = acc;
    }
    acc += FIXED_WIDTHS[col.key] ?? 120;
  }
  return map;
})();

const isFrozen = (key: string) => FROZEN_KEYS.includes(key);

const colFixedWidthStyle = (colKey: string): React.CSSProperties | undefined => {
  const width = FIXED_WIDTHS[colKey];
  return width
    ? { width, minWidth: width, maxWidth: width }
    : undefined;
};

const frozenHeaderStyle = (colKey: string, z: number): React.CSSProperties | undefined =>
  isFrozen(colKey)
    ? {
        position: 'sticky',
        left: FROZEN_OFFSETS[colKey],
        minWidth: FIXED_WIDTHS[colKey],
        maxWidth: FIXED_WIDTHS[colKey],
        zIndex: z,
      }
    : undefined;

const cellStyle = (colKey: string): React.CSSProperties | undefined => {
  const widthStyle = colFixedWidthStyle(colKey);
  if (isFrozen(colKey)) {
    return {
      ...widthStyle,
      position: 'sticky',
      left: FROZEN_OFFSETS[colKey],
      zIndex: 10,
      backgroundColor: '#FFFFFF',
    };
  }
  return widthStyle;
};

function CellValue({ value }: { value: string | number | boolean | null | undefined }) {
  if (value === undefined || value === null || value === '') {
    return <span className="text-slate-400">-</span>;
  }
  return <span className="text-slate-700 text-[11px] leading-tight">{String(value)}</span>;
}

export default function DataLengkapUtamaPage() {
  const { data, loading, addItem, updateItem, deleteItem, importItems, deleteAll } = useDataLengkapUtama();
  const { toasts, showToast, removeToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Partial<Record<keyof DataLengkapUtamaValues, string>>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<DataLengkapUtamaItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showClearAll, setShowClearAll] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);

  const filterOptions = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const f of FILTER_COLUMNS) {
      const set = new Set<string>();
      for (const item of data) {
        const v = item[f.key];
        if (v && v.trim() !== '') set.add(v);
      }
      map[f.key] = Array.from(set).sort((a, b) => a.localeCompare(b));
    }
    return map;
  }, [data]);

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const activeFilters = (Object.entries(filters) as [keyof DataLengkapUtamaValues, string][]).filter(([, v]) => v);
    return data.filter((item) => {
      if (q && !SEARCH_KEYS.some((key) => item[key]?.toLowerCase().includes(q))) return false;
      for (const [key, val] of activeFilters) {
        const itemVal = item[key] ?? '';
        if (val === EMPTY_FILTER_VALUE) {
          if (itemVal.trim() !== '') return false;
        } else if (itemVal !== val) {
          return false;
        }
      }
      return true;
    });
  }, [data, searchQuery, filters]);

  const pagination = usePagination(filteredData);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const setFilter = (key: keyof DataLengkapUtamaValues, value: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
  };

  const resetFilters = () => setFilters({});

  const handleAdd = async (values: DataLengkapUtamaValues) => {
    try {
      await addItem(values);
      showToast('Data berhasil ditambahkan', 'success');
      setShowForm(false);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gagal menambahkan data', 'error');
    }
  };

  const handleUpdate = async (values: DataLengkapUtamaValues) => {
    if (!editItem) return;
    try {
      await updateItem(editItem.id, values);
      showToast('Data berhasil diperbarui', 'success');
      setShowForm(false);
      setEditItem(null);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gagal memperbarui data', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteItem(deleteTarget);
      showToast('Data berhasil dihapus', 'success');
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gagal menghapus data', 'error');
    }
    setDeleteTarget(null);
  };

  const handleClearAll = async () => {
    try {
      await deleteAll();
      showToast('Semua data berhasil dihapus', 'success');
      setShowClearAll(false);
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gagal menghapus data', 'error');
    }
  };

  const handleEdit = (item: DataLengkapUtamaItem) => {
    setEditItem(item);
    setShowForm(true);
  };

  const handleExport = async () => {
    if (data.length === 0) {
      showToast('Tidak ada data untuk diexport', 'warning');
      return;
    }
    const XLSX = await import('xlsx');
    const groupRow: string[] = [];
    const subRow: string[] = [];
    const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];
    let colIdx = 0;
    for (const group of HEADER_GROUPS) {
      const start = colIdx;
      for (const col of group.columns) {
        groupRow.push(group.label);
        subRow.push(col.label);
        colIdx++;
      }
      if (group.label && group.columns.length > 1) {
        merges.push({ s: { r: 0, c: start }, e: { r: 0, c: colIdx - 1 } });
      }
    }

    const aoa: (string | number)[][] = [
      groupRow,
      subRow,
      ...filteredData.map((item) =>
        DATA_LENGKAP_UTAMA_COLUMNS.map((col) => {
          const value = item[col.key];
          return value === undefined || value === null ? '' : value;
        })
      ),
    ];

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    if (merges.length > 0) ws['!merges'] = merges;
    ws['!cols'] = DATA_LENGKAP_UTAMA_COLUMNS.map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Lengkap Utama');
    XLSX.writeFile(wb, `Data-Lengkap-Utama-${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast(`Berhasil mengexport ${filteredData.length} data`, 'success');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeErr = validateFileSize(file, MAX_EXCEL_SIZE_BYTES);
    if (sizeErr) {
      showToast(sizeErr, 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      const XLSX = await import('xlsx');
      const buffer = await file.arrayBuffer();
      if (!validateExcelMagicBytes(buffer)) {
        showToast('Format file tidak valid. Harap upload file Excel (.xlsx/.xls) yang sah.', 'error');
        return;
      }
      const wb = XLSX.read(buffer, { type: 'array' });
      const wsname =
        wb.SheetNames.find((n) => n.trim().toLowerCase() === 'agen cum') ?? wb.SheetNames[0];
      if (!wsname) throw new Error('Tidak ada sheet ditemukan');
      const ws = wb.Sheets[wsname];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });

      const imported = parseDataLengkapUtamaRows(rows);

      if (imported.length === 0) {
        showToast('Tidak ada baris data yang ditemukan', 'warning');
        return;
      }

      await importItems(imported);
      showToast(`Berhasil mengimport ${imported.length} data`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal membaca file Excel', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePasteImport = async (items: DataLengkapUtamaValues[]) => {
    try {
      await importItems(items);
      showToast(`Berhasil mengimport ${items.length} data`, 'success');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Gagal mengimport data';
      showToast(msg, 'error');
      throw new Error(msg);
    }
  };

  const totalCount = data.length;
  const displayCount = filteredData.length;

  const filterSelectCls =
    'w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-[11px] text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 cursor-pointer transition-colors';

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="space-y-6">
        {/* Header Card */}
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600" />
          <div className="px-5 sm:px-6 py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex gap-4">
              <div className="hidden sm:flex h-11 w-11 rounded-xl bg-slate-900 text-white items-center justify-center shadow-sm shrink-0">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h1 className="page-header-title text-[18px] text-slate-900 flex items-center gap-2">
                  Data Lengkap Utama
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-[10px] font-bold tracking-widest uppercase">Master</span>
                </h1>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Data master lengkap loket. Fitur Data Lengkap (loket) mengambil sebagian kolom dari sini. Kolom <span className="font-medium text-slate-700">NO, PPID, dan NAMA LOKET DI ONPAYS</span> terkunci saat scroll. Semua kolom opsional.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => { setEditItem(null); setShowForm(true); }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-sm transition-all duration-150 focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Data
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all duration-150 focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export Excel
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all duration-150 focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
              >
                <FileUp className="w-3.5 h-3.5" />
                Import Excel
              </button>
              <button
                onClick={() => setShowPasteModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all duration-150 focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                Import Copas
              </button>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
              {data.length > 0 && (
                <button
                  onClick={() => setShowClearAll(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 hover:border-rose-300 rounded-xl transition-all duration-150 focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Semua
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Data Utama" value={totalCount} icon={<Database className="w-5 h-5" />} variant="default" />
          <StatCard label="Ditampilkan" value={displayCount} icon={<Table2 className="w-5 h-5" />} variant="info" />
          <StatCard
            label="Pencarian / Filter"
            value={searchQuery ? `"${searchQuery}"` : activeFilterCount > 0 ? `${activeFilterCount} filter aktif` : '—'}
            icon={<Search className="w-5 h-5" />}
            variant={searchQuery || activeFilterCount > 0 ? 'warning' : 'success'}
          />
        </div>

        {/* Search & Filters */}
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-4 space-y-4">
            <div className="flex flex-col xl:flex-row gap-3 xl:items-center">
              <div className="relative flex-1 max-w-2xl">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari PPID, Nama Loket, No HP, Email, NIB, Rekening, Regional..."
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-150"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    <span className="h-6 w-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                      <X className="h-3 w-3" />
                    </span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-full border transition-all duration-150 focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer ${
                    activeFilterCount > 0 || showFilters
                      ? 'text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
                      : 'text-slate-700 bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </button>
                {activeFilterCount > 0 && (
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 hover:border-rose-300 rounded-full transition-all duration-150 focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                )}
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-200/80">
                {FILTER_COLUMNS.map((f) => (
                  <div key={f.key} className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                      {f.label}
                    </label>
                    <select
                      value={filters[f.key] ?? ''}
                      onChange={(e) => setFilter(f.key, e.target.value)}
                      className={filterSelectCls}
                    >
                      <option value="">Semua</option>
                      <option value={EMPTY_FILTER_VALUE}>— Kosong —</option>
                      {filterOptions[f.key].map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Menampilkan <strong className="text-slate-700">{displayCount}</strong> dari <strong className="text-slate-700">{totalCount}</strong> data utama
              </span>
              {displayCount === 0 && totalCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold">Tidak ada data yang cocok</span>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-12 text-center">
            <span className="inline-flex items-center gap-2 text-sm text-slate-500"><span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-indigo-600 animate-spin" /> Memuat data...</span>
          </div>
        ) : data.length === 0 ? (
          <EmptyState
            title="Belum ada data utama"
            description="Klik tombol 'Tambah Data' untuk menambahkan data baru, atau import dari file Excel."
            icon={<Table2 className="w-8 h-8 text-slate-300" />}
          />
        ) : filteredData.length === 0 ? (
          <EmptyState
            title="Data tidak ditemukan"
            description={`Tidak ada data yang cocok dengan pencarian / filter saat ini.`}
            icon={<Search className="w-8 h-8 text-slate-300" />}
          />
        ) : (
          <div className="space-y-3">
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse table-premium">
                  <thead className="text-slate-500 sticky top-0 z-20">
                    <tr>
                      <th
                        rowSpan={2}
                        style={{
                          position: 'sticky',
                          left: 0,
                          width: AKSI_WIDTH,
                          minWidth: AKSI_WIDTH,
                          maxWidth: AKSI_WIDTH,
                          zIndex: 40,
                        }}
                        className="p-2.5 py-2.5 font-semibold tracking-wider bg-slate-50/80 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80 text-center border-b border-slate-200/80"
                      >
                        AKSI
                      </th>
                      {HEADER_GROUPS.map((group) => {
                        if (group.label === '') {
                          return group.columns.map((col) => (
                            <th
                              key={col.key}
                              colSpan={1}
                              style={{
                                ...colFixedWidthStyle(col.key),
                                ...frozenHeaderStyle(col.key, 30),
                              }}
                              className={`p-2.5 py-2.5 font-semibold tracking-wider whitespace-nowrap border-l border-slate-200/80 border-b border-slate-200/80 ${
                                isFrozen(col.key) ? 'bg-slate-50/80 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80' : 'bg-slate-50/80 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80'
                              }`}
                            >
                              {group.label}
                            </th>
                          ));
                        }
                        const firstCol = group.columns[0];
                        return (
                          <th
                            key={group.label || firstCol.key}
                            colSpan={group.columns.length}
                            style={frozenHeaderStyle(firstCol.key, 30)}
                            className="p-2.5 py-2.5 font-semibold tracking-wider whitespace-nowrap text-center border-l border-slate-200/80 border-b border-slate-200/80 bg-slate-50/80 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80"
                          >
                            {group.label}
                          </th>
                        );
                      })}
                    </tr>
                    <tr>
                      {DATA_LENGKAP_UTAMA_COLUMNS.map((col) => {
                        const fixedWidth = Boolean(FIXED_WIDTHS[col.key]);
                        return (
                          <th
                            key={col.key}
                            style={{
                              ...colFixedWidthStyle(col.key),
                              ...frozenHeaderStyle(col.key, 20),
                            }}
                            className={`p-2.5 py-2.5 font-semibold tracking-wider border-l border-slate-200/80 border-b border-slate-200/80 bg-slate-50/80 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80 ${
                              fixedWidth ? 'break-words leading-tight' : 'whitespace-nowrap'
                            }`}
                          >
                            {col.label}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 text-slate-700">
                    {pagination.paginatedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td
                          style={{
                            position: 'sticky',
                            left: 0,
                            width: AKSI_WIDTH,
                            minWidth: AKSI_WIDTH,
                            maxWidth: AKSI_WIDTH,
                            zIndex: 10,
                            backgroundColor: '#FFFFFF',
                          }}
                          className="p-2.5 py-2.5"
                        >
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(item.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        {DATA_LENGKAP_UTAMA_COLUMNS.map((col) => {
                          const frozen = isFrozen(col.key);
                          return (
                            <td
                              key={col.key}
                              style={cellStyle(col.key)}
                              className={`p-2.5 py-2.5 border-l border-slate-200/60 ${
                                frozen ? 'truncate shadow-[1px_0_0_rgba(226,232,240,0.8)]' : 'max-w-[220px] truncate'
                              }`}
                            >
                              <CellValue value={item[col.key]} />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm px-2">
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                pageSize={pagination.pageSize}
                startItem={pagination.startItem}
                endItem={pagination.endItem}
                onPrev={pagination.prevPage}
                onNext={pagination.nextPage}
                onGoTo={pagination.goToPage}
                onPageSizeChange={pagination.changePageSize}
                hasPrev={pagination.hasPrev}
                hasNext={pagination.hasNext}
              />
            </div>
            <div className="px-1 py-1 text-xs text-slate-400 flex items-center justify-between">
              <span>Total {displayCount} data utama</span>
              <span className="text-[10px]">{DATA_LENGKAP_UTAMA_COLUMNS.length} kolom ditampilkan</span>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <DataLengkapUtamaForm
        key={showForm ? editItem?.id || 'new' : 'closed'}
        open={showForm}
        onClose={() => { setShowForm(false); setEditItem(null); }}
        onSave={editItem ? handleUpdate : handleAdd}
        editItem={editItem}
      />
      <PasteImportModal
        open={showPasteModal}
        onClose={() => setShowPasteModal(false)}
        onSubmit={handlePasteImport}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Data"
        message="Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        variant="danger"
      />
      <ConfirmDialog
        open={showClearAll}
        onClose={() => setShowClearAll(false)}
        onConfirm={handleClearAll}
        title="Hapus Semua Data"
        message="Semua data utama akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus Semua"
        requireTyping="HAPUS"
        variant="danger"
      />
    </>
  );
}
