'use client';

import { useState, useMemo, useRef } from 'react';
import { Search, Database, X, Download, Table2, Plus, FileUp, Trash2, Pencil, ClipboardPaste } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useDataLengkap } from '@/lib/hooks/useDataLengkap';
import DataLengkapForm from '@/app/components/data-lengkap/DataLengkapForm';
import EmptyState from '@/app/components/ui/EmptyState';
import ToastContainer from '@/app/components/ui/Toast';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import Pagination from '@/app/components/ui/Pagination';
import { useToast } from '@/lib/hooks/useToast';
import { usePagination } from '@/lib/hooks/usePagination';
import type { DataLengkapItem } from '@/lib/types';
import { emptyDataLengkap } from '@/lib/types';

const SEARCH_KEYS: (keyof DataLengkapItem)[] = [
  'ppid',
  'namaLoketKurlog',
  'namaLoketOnpays',
  'noHpLoket',
  'email',
  'userMile',
  'namaPemilik',
];

const DISPLAY_COLUMNS: { key: keyof DataLengkapItem; label: string }[] = [
  { key: 'no', label: 'NO' },
  { key: 'ppid', label: 'PID' },
  { key: 'namaLoketKurlog', label: 'NAMA LOKET DI KURLOG' },
  { key: 'noHpLoket', label: 'NO.HP LOKET' },
  { key: 'email', label: 'EMAIL' },
  { key: 'userMile', label: 'USER MILE' },
  { key: 'passwordMile', label: 'PASSWORD MILE' },
];

function CellValue({ value }: { value: string | number | boolean | undefined }) {
  if (value === undefined || value === null || value === '') {
    return <span className="text-slate-400">-</span>;
  }
  return <span className="text-slate-700 text-[11px] leading-tight">{String(value)}</span>;
}

export default function DataLengkapPage() {
  const { data, loading, addItem, updateItem, deleteItem, deleteAll, importItems } = useDataLengkap();
  const { toasts, showToast, removeToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<DataLengkapItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showClearAll, setShowClearAll] = useState(false);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter((item) =>
      SEARCH_KEYS.some((key) => String(item[key] ?? '').toLowerCase().includes(q))
    );
  }, [data, searchQuery]);

  const pagination = usePagination(filteredData);

  const handleAdd = async (item: DataLengkapItem) => {
    try {
      await addItem(item);
      showToast('Data berhasil ditambahkan', 'success');
      setShowForm(false);
    } catch {
      showToast('Gagal menambahkan data', 'error');
    }
  };

  const handleUpdate = async (item: DataLengkapItem) => {
    if (!editItem?.id) return;
    try {
      await updateItem(editItem.id, item);
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

  const handleEdit = (item: DataLengkapItem) => {
    setEditItem(item);
    setShowForm(true);
  };

  const handleExport = () => {
    if (data.length === 0) {
      showToast('Tidak ada data untuk diexport', 'warning');
      return;
    }
    const headers = DISPLAY_COLUMNS.map((c) => c.label);
    const rows = filteredData.map((item) => DISPLAY_COLUMNS.map((c) => item[c.key] ?? ''));
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = DISPLAY_COLUMNS.map(() => ({ wch: 20 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Lengkap');
    XLSX.writeFile(wb, `Data-Lengkap-Loket-${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast(`Berhasil mengexport ${filteredData.length} data`, 'success');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

        if (rows.length === 0) {
          showToast('Tidak ada baris data yang ditemukan', 'warning');
          return;
        }

        // Map Excel rows to DataLengkapItem
        const items: DataLengkapItem[] = rows.map((row, idx) => {
          const item = emptyDataLengkap(0);
          const keyMap: Record<string, keyof DataLengkapItem> = {
            'PPID': 'ppid',
            'NAMA LOKET DI ONPAYS': 'namaLoketOnpays',
            'NAMA LOKET DI KURLOG': 'namaLoketKurlog',
            'NAMA PEMILIK': 'namaPemilik',
            'NO KTP': 'noKtp',
            'NO NPWP': 'noNpwp',
            'NO HP PEMILIK': 'noHpPemilik',
            'NO.HP LOKET': 'noHpLoket',
            'EMAIL': 'email',
            'NO DIRIAN': 'noDirian',
            'NIB': 'nib',
            'NO KBLI': 'noKbli',
            'ALAMAT PEMILIK KTP': 'alamatPemilikKtp',
            'ALAMAT LENGKAP LOKET': 'alamatLengkapLoket',
            'RT/RW': 'rtRw',
            'KEL/DESA': 'kelDesa',
            'KEC': 'kec',
            'KAB/KOT': 'kabKota',
            'PROPINSI': 'propinsi',
            'KODE POS': 'kodePos',
            'ELECTRIC AREA': 'electricArea',
            'REKOMENDASI': 'rekomendasi',
            'LATITUDE': 'latitude',
            'LONGITUDE': 'longitude',
            'NOMOR REKENING': 'nomorRekening',
            'NAMA BANK': 'namaBank',
            'NAMA PEMILIK REKENING': 'namaPemilikRekening',
            'SYARAT': 'syarat',
            'PENGAJUAN SURVEY KE POS': 'pengajuanSurveyKePos',
            'PENGAJUAN POS': 'pengajuanPos',
            'PENDAFTARAN KURLOG': 'pendaftaranKurlog',
            'KELENGKAPAN PERANGKAT': 'kelengkapanPerangkat',
            'AKTIVASI KURLOG': 'aktivasiKurlog',
            'AKTIVASI SICEPAT': 'aktivasiSicepat',
            'TRAINING': 'training',
            'TRANSAKSI': 'transaksi',
            'POS + PPOB': 'posPpob',
            'POS ONLY': 'posOnly',
            'SICEPAT': 'sicepat',
            'CATATAN': 'catatan',
            'WAKTU': 'waktuUpdate',
            'STATUS': 'statusKurlog',
            'TGL PENDAFTARAN': 'tglPendaftaran',
            'LOCATION ID': 'locationId',
            'USER MILE': 'userMile',
            'PASSWORD MILE': 'passwordMile',
            'REGIONAL': 'regional',
            'KCU/KC': 'kcuKc',
          };

          for (const [excelKey, itemKey] of Object.entries(keyMap)) {
            const found = Object.keys(row).find(
              (k) => k.trim().toUpperCase() === excelKey
            );
            if (found) {
              (item as unknown as Record<string, string>)[itemKey] = String(row[found] ?? '');
            }
          }
          return item;
        });

        // Import all items in batch
        await importItems(items);
        showToast(`Berhasil mengimport ${items.length} data`, 'success');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Gagal membaca file Excel', 'error');
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const totalCount = data.length;
  const displayCount = filteredData.length;

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <main className="max-w-7xl mx-auto p-6 md:p-10 space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-500" />
              <h1 className="text-lg font-semibold text-slate-800">Data Lengkap Loket & Agen</h1>
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
            Data lengkap loket KurLog diambil dari master Data Lengkap Utama. Perubahan di sini ikut mengubah data master.
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] border-l-4 border-l-purple-500 shadow-sm">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total Data Loket</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{totalCount}</h3>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] border-l-4 border-l-blue-500 shadow-sm">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Ditampilkan</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{displayCount}</h3>
          </div>
          <div className="bg-white p-4 rounded-xl border border-[#E2E8F0] border-l-4 border-l-emerald-500 shadow-sm">
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Dicari</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{searchQuery ? `"${searchQuery}"` : '-'}</h3>
          </div>
        </div>

        {/* Search & Info */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari PPID, Nama Loket, No HP, Email, User Mile..."
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
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>
              Menampilkan <strong className="text-slate-600">{displayCount}</strong> dari <strong className="text-slate-600">{totalCount}</strong> data loket
            </span>
            {searchQuery && displayCount === 0 && totalCount > 0 && (
              <span className="text-amber-500">Pencarian tidak ditemukan</span>
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
            title="Belum ada data loket"
            description="Klik tombol 'Tambah Data' untuk menambahkan data baru, atau import dari file Excel."
            icon={<Table2 className="w-8 h-8 text-slate-300" />}
          />
        ) : filteredData.length === 0 ? (
          <EmptyState
            title="Data tidak ditemukan"
            description={`Tidak ada data yang cocok dengan pencarian "${searchQuery}".`}
            icon={<Search className="w-8 h-8 text-slate-300" />}
          />
        ) : (
          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-50 text-slate-400 uppercase">
                  <tr>
                    <th className="p-2.5 font-semibold tracking-wider w-16">AKSI</th>
                    {DISPLAY_COLUMNS.map((col) => (
                      <th key={col.key} className="p-2.5 font-semibold tracking-wider whitespace-nowrap">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-slate-600">
                  {pagination.paginatedItems.map((item) => (
                    <tr key={item.id || item.no} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-2.5">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item.id || String(item.no))}
                            className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      {DISPLAY_COLUMNS.map((col) => (
                        <td key={col.key} className="p-2.5 max-w-[220px] truncate">
                          <CellValue value={item[col.key]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 border-t border-[#E2E8F0] bg-slate-50/50">
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
            <div className="px-4 py-2.5 text-xs text-slate-400 border-t border-[#E2E8F0] bg-slate-50/50 flex items-center justify-between">
              <span>Total {displayCount} data loket</span>
              <span className="text-[10px]">7 kolom ditampilkan</span>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <DataLengkapForm
        key={showForm ? editItem?.id || 'new' : 'closed'}
        open={showForm}
        onClose={() => { setShowForm(false); setEditItem(null); }}
        onSave={editItem ? handleUpdate : handleAdd}
        editItem={editItem}
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
        message="Semua data loket akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus Semua"
        requireTyping="HAPUS"
        variant="danger"
      />
    </>
  );
}