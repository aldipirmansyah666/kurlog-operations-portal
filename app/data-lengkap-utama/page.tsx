'use client';

import { useState, useMemo, useRef } from 'react';
import { Plus, FileUp, Search, Trash2, Pencil, Database, X, Download, Table2, ClipboardPaste, Filter, RotateCcw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useDataLengkapUtama } from '@/lib/hooks/useDataLengkapUtama';
import DataLengkapUtamaForm from '@/app/components/data-lengkap-utama/DataLengkapUtamaForm';
import PasteImportModal from '@/app/components/data-lengkap-utama/PasteImportModal';
import EmptyState from '@/app/components/ui/EmptyState';
import ToastContainer from '@/app/components/ui/Toast';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import { useToast } from '@/lib/hooks/useToast';
import { DATA_LENGKAP_UTAMA_COLUMNS, buildDataLengkapUtamaGroups, parseDataLengkapUtamaRows } from '@/lib/dataLengkapUtama';
import type { DataLengkapUtamaItem, DataLengkapUtamaValues } from '@/lib/types';

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
    } catch {
      showToast('Gagal menambahkan data', 'error');
    }
  };

  const handleUpdate = async (values: DataLengkapUtamaValues) => {
    if (!editItem) return;
    try {
      await updateItem(editItem.id, values);
      showToast('Data berhasil diperbarui', 'success');
      setShowForm(false);
      setEditItem(null);
    } catch {
      showToast('Gagal memperbarui data', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteItem(deleteTarget);
      showToast('Data berhasil dihapus', 'success');
    } catch {
      showToast('Gagal menghapus data', 'error');
    }
    setDeleteTarget(null);
  };

  const handleClearAll = async () => {
    try {
      await deleteAll();
      showToast('Semua data berhasil dihapus', 'success');
      setShowClearAll(false);
    } catch {
      showToast('Gagal menghapus data', 'error');
    }
  };

  const handleEdit = (item: DataLengkapUtamaItem) => {
    setEditItem(item);
    setShowForm(true);
  };

  const handleExport = () => {
    if (data.length === 0) {
      showToast('Tidak ada data untuk diexport', 'warning');
      return;
    }
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

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        // Sheet acuan utama: "Agen CUM". Fallback ke sheet pertama agar export
        // aplikasi ini (sheet "Data Lengkap Utama") tetap bisa di-import ulang.
        const wsname =
          wb.SheetNames.find((n) => n.trim().toLowerCase() === 'agen cum') ?? wb.SheetNames[0];
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
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePasteImport = async (items: DataLengkapUtamaValues[]) => {
    try {
      await importItems(items);
      showToast(`Berhasil mengimport ${items.length} data`, 'success');
    } catch {
      showToast('Gagal mengimport data', 'error');
      throw new Error('Import gagal');
    }
  };

  const totalCount = data.length;
  const displayCount = filteredData.length;

  const filterSelectCls =
    'w-full bg-white border border-[#E2E8F0] rounded-lg px-2 py-1.5 text-[11px] text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer';

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <main className="max-w-7xl mx-auto p-6 md:p-10 space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-500" />
              <h1 className="text-lg font-semibold text-slate-800">Data Lengkap Utama</h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => { setEditItem(null); setShowForm(true); }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-[#1E293B] hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Data
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export Excel
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-lg transition-colors cursor-pointer"
              >
                <FileUp className="w-3.5 h-3.5" />
                Import Excel
              </button>
              <button
                onClick={() => setShowPasteModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-[#E2E8F0] rounded-lg transition-colors cursor-pointer"
              >
                <ClipboardPaste className="w-3.5 h-3.5" />
                Import Copas
              </button>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
              {data.length > 0 && (
                <button
                  onClick={() => setShowClearAll(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Semua
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Data master lengkap loket. Fitur Data Lengkap (loket) akan mengambil sebagian kolom dari sini. Kolom NO, PPID,
            dan NAMA LOKET DI ONPAYS terkunci saat scroll. Semua kolom bersifat opsional.
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] border-l-4 border-l-purple-500 shadow-sm">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total Data Utama</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalCount}</h3>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] border-l-4 border-l-blue-500 shadow-sm">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Ditampilkan</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{displayCount}</h3>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] border-l-4 border-l-emerald-500 shadow-sm">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Pencarian / Filter</p>
            <h3 className="text-lg font-bold text-slate-800 mt-1 truncate">
              {searchQuery ? `"${searchQuery}"` : activeFilterCount > 0 ? `${activeFilterCount} filter aktif` : '-'}
            </h3>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari PPID, Nama Loket, No HP, Email, NIB, Rekening, Regional..."
                className="w-full bg-white border border-[#E2E8F0] rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                activeFilterCount > 0 || showFilters
                  ? 'text-purple-600 bg-purple-50 border-purple-200'
                  : 'text-slate-600 bg-white hover:bg-slate-50 border-[#E2E8F0]'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-3 border-t border-[#E2E8F0]">
              {FILTER_COLUMNS.map((f) => (
                <div key={f.key} className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
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

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Menampilkan <strong className="text-slate-600">{displayCount}</strong> dari <strong className="text-slate-600">{totalCount}</strong> data utama
            </span>
            {displayCount === 0 && totalCount > 0 && (
              <span className="text-amber-500">Tidak ada data yang cocok</span>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center text-sm text-slate-400 shadow-sm">
            Memuat data...
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
          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="text-slate-400 uppercase">
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
                      className="p-2.5 font-semibold tracking-wider bg-slate-50 text-center"
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
                            className={`p-2.5 font-semibold tracking-wider whitespace-nowrap border-l border-[#E2E8F0] ${
                              isFrozen(col.key) ? 'bg-slate-100' : 'bg-slate-100/70'
                            }`}
                          >
                            {group.label}
                          </th>
                        ));
                      }
                      const firstCol = group.columns[0];
                      const frozen = isFrozen(firstCol.key);
                      return (
                        <th
                          key={group.label || firstCol.key}
                          colSpan={group.columns.length}
                          style={frozenHeaderStyle(firstCol.key, 30)}
                          className={`p-2.5 font-semibold tracking-wider whitespace-nowrap text-center border-l border-[#E2E8F0] ${
                            frozen ? 'bg-slate-100' : 'bg-slate-100/70'
                          }`}
                        >
                          {group.label}
                        </th>
                      );
                    })}
                  </tr>
                  <tr>
                    {DATA_LENGKAP_UTAMA_COLUMNS.map((col) => {
                      const frozen = isFrozen(col.key);
                      const fixedWidth = Boolean(FIXED_WIDTHS[col.key]);
                      return (
                        <th
                          key={col.key}
                          style={{
                            ...colFixedWidthStyle(col.key),
                            ...frozenHeaderStyle(col.key, 20),
                          }}
                          className={`p-2.5 font-semibold tracking-wider border-l border-[#E2E8F0] ${
                            frozen ? 'bg-slate-50' : ''
                          } ${fixedWidth ? 'break-words leading-tight' : 'whitespace-nowrap'}`}
                        >
                          {col.label}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-slate-600">
                  {filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
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
                        className="p-2.5"
                      >
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item.id)}
                            className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
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
                            className={`p-2.5 border-l border-[#E2E8F0]/60 ${
                              frozen ? 'truncate shadow-[1px_0_0_#E2E8F0]' : 'max-w-[220px] truncate'
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
            <div className="px-4 py-2.5 text-xs text-slate-400 border-t border-[#E2E8F0] bg-slate-50/50 flex items-center justify-between">
              <span>Total {displayCount} data utama</span>
              <span className="text-[10px]">{DATA_LENGKAP_UTAMA_COLUMNS.length} kolom ditampilkan</span>
            </div>
          </div>
        )}
      </main>

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
