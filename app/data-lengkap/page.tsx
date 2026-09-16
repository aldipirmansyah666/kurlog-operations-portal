'use client';

import { useState, useMemo, useRef } from 'react';
import { Search, Database, X, Download, Table2, Plus, FileUp, Trash2, Pencil } from 'lucide-react';
import { useDataLengkap } from '@/lib/hooks/useDataLengkap';
import DataLengkapForm from '@/app/components/data-lengkap/DataLengkapForm';
import EmptyState from '@/app/components/ui/EmptyState';
import ToastContainer from '@/app/components/ui/Toast';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import Pagination from '@/app/components/ui/Pagination';
import StatCard from '@/app/components/ui/StatCard';
import { useToast } from '@/lib/hooks/useToast';
import { usePagination } from '@/lib/hooks/usePagination';
import type { DataLengkapItem } from '@/lib/types';
import { emptyDataLengkap } from '@/lib/types';
import { MAX_EXCEL_SIZE_BYTES, validateFileSize, validateExcelMagicBytes } from '@/lib/fileValidation';

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
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Gagal menambahkan data', 'error');
    }
  };

  const handleUpdate = async (item: DataLengkapItem) => {
    if (!editItem?.id) return;
    try {
      await updateItem(editItem.id, item);
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

  const handleEdit = (item: DataLengkapItem) => {
    setEditItem(item);
    setShowForm(true);
  };

  const handleExport = async () => {
    if (data.length === 0) {
      showToast('Tidak ada data untuk diexport', 'warning');
      return;
    }
    const XLSX = await import('xlsx');
    const headers = DISPLAY_COLUMNS.map((c) => c.label);
    const rows = filteredData.map((item) => DISPLAY_COLUMNS.map((c) => item[c.key] ?? ''));
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = DISPLAY_COLUMNS.map(() => ({ wch: 20 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Lengkap');
    XLSX.writeFile(wb, `Data-Lengkap-Loket-${new Date().toISOString().slice(0, 10)}.xlsx`);
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
      const wsname = wb.SheetNames[0];
      if (!wsname) throw new Error('Tidak ada sheet ditemukan');
      const ws = wb.Sheets[wsname];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

      if (rows.length === 0) {
        showToast('Tidak ada baris data yang ditemukan', 'warning');
        return;
      }

      // Map Excel rows to DataLengkapItem
      const items: DataLengkapItem[] = rows.map((row) => {
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

          // Alias support for columns with known variants
          const aliasMap: Record<string, string[]> = {
            ppid: ['PPID'],
            namaLoketOnpays: ['NAMA LOKET DI ONPAYS', 'NAMA LOKET ONPAYS'],
            namaLoketKurlog: ['NAMA LOKET DI KURLOG', 'NAMA LOKET KURLOG'],
            kabKota: ['KAB/KOT', 'KAB/KOTA'],
            nib: ['NIB', 'NIB (NO INDUK BERUSAHA)', 'NIB ( NO INDUK BERUSAHA)'],
            namaPemilikRekening: ['NAMA PEMILIK REKENING', 'NAMA PEMILIK'],
            noHpLoket: ['NO.HP LOKET', 'NO HP LOKET', 'NO.HP LOKET'],
            alamatPemilikKtp: ['ALAMAT PEMILIK KTP', 'ALAMAT PEMIILIK KTP'],
          };
          for (const [excelKey, itemKey] of Object.entries(keyMap)) {
            const candidates = aliasMap[itemKey] ?? [excelKey];
            const found = Object.keys(row).find((k) => {
              const nk = String(k ?? '')
                .replace(/[\u00A0]/g, ' ')
                .replace(/[\uFEFF\u200B\u200C\u200D\u2060]/g, '')
                .replace(/[\t\r\n]/g, ' ')
                .trim()
                .toUpperCase()
                .replace(/\s+/g, ' ');
              return candidates.some((c) => nk === c.replace(/\s+/g, ' ').trim().toUpperCase());
            });
            if (found) {
              const rawVal = row[found];
              const cleanVal =
                typeof rawVal === 'string'
                  ? rawVal.replace(/[\u00A0]/g, ' ').replace(/[\uFEFF\u200B\u200C\u200D\u2060\r]/g, '').replace(/[\t\n]/g, ' ').trim()
                  : String(rawVal ?? '').trim();
              (item as unknown as Record<string, string>)[itemKey] = cleanVal;
            }
          }
          return item;
        });

        // Import all items in batch
        await importItems(items);
        showToast(`Berhasil mengimport ${items.length} data`, 'success');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Gagal membaca file Excel', 'error');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

  const totalCount = data.length;
  const displayCount = filteredData.length;

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="space-y-6">
        {/* Header Card */}
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500" />
          <div className="px-5 sm:px-6 py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex gap-4">
              <div className="hidden sm:flex h-11 w-11 rounded-xl bg-slate-900 text-white items-center justify-center shadow-sm shrink-0">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <h1 className="page-header-title text-[18px] text-slate-900 flex items-center gap-2">
                  Data Lengkap Loket & Agen
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold tracking-widest uppercase">Loket</span>
                </h1>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Data lengkap loket KurLog diambil dari master <span className="font-medium text-slate-700">Data Lengkap Utama</span>. Perubahan di sini ikut mengubah data master.
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
          <StatCard label="Total Data Loket" value={totalCount} icon={<Database className="w-5 h-5" />} variant="default" />
          <StatCard label="Ditampilkan" value={displayCount} icon={<Table2 className="w-5 h-5" />} variant="info" />
          <StatCard label="Dicari" value={searchQuery ? `"${searchQuery}"` : '—'} icon={<Search className="w-5 h-5" />} variant={searchQuery ? 'warning' : 'success'} />
        </div>

        {/* Search & Info */}
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-4 space-y-4">
            <div className="relative max-w-2xl">
              <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari PPID, Nama Loket, No HP, Email, User Mile..."
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
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>
                Menampilkan <strong className="text-slate-700">{displayCount}</strong> dari <strong className="text-slate-700">{totalCount}</strong> data loket
              </span>
              {searchQuery && displayCount === 0 && totalCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-semibold">Pencarian tidak ditemukan</span>
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
          <div className="space-y-3">
            <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] table-premium">
                  <thead className="bg-slate-50/80 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80 text-slate-500 sticky top-0 z-10">
                    <tr>
                      <th className="p-2.5 py-2.5 font-semibold tracking-wider w-16 border-b border-slate-200/80">AKSI</th>
                      {DISPLAY_COLUMNS.map((col) => (
                        <th key={col.key} className="p-2.5 py-2.5 font-semibold tracking-wider whitespace-nowrap border-b border-slate-200/80">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 text-slate-700">
                    {pagination.paginatedItems.map((item) => (
                      <tr key={item.id || item.no} className="hover:bg-slate-50 transition-colors">
                        <td className="p-2.5 py-2.5">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(item.id || String(item.no))}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-500"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        {DISPLAY_COLUMNS.map((col) => (
                          <td key={col.key} className="p-2.5 py-2.5 max-w-[220px] truncate">
                            <CellValue value={item[col.key]} />
                          </td>
                        ))}
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
              <span>Total {displayCount} data loket</span>
              <span className="text-[10px]">7 kolom ditampilkan</span>
            </div>
          </div>
        )}
      </div>

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
