'use client';

import { useState, useMemo, useRef } from 'react';
import { Plus, FileUp, Search, Trash2, Pencil, Database, X, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useDataLengkap } from '@/lib/hooks/useDataLengkap';
import DataLengkapForm from '@/app/components/data-lengkap/DataLengkapForm';
import EmptyState from '@/app/components/ui/EmptyState';
import ToastContainer from '@/app/components/ui/Toast';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import { useToast } from '@/lib/hooks/useToast';
import type { DataLengkapItem } from '@/lib/types';

const COLUMNS: { key: keyof DataLengkapItem; label: string; width: string }[] = [
  { key: 'ppid', label: 'PID', width: 'w-32' },
  { key: 'namaLoketKurlog', label: 'NAMA LOKET DI KURLOG', width: 'w-48' },
  { key: 'noHpLoket', label: 'NO.HP LOKET', width: 'w-32' },
  { key: 'email', label: 'EMAIL', width: 'w-48' },
  { key: 'userMile', label: 'USER MILE', width: 'w-28' },
  { key: 'passwordMile', label: 'PASSWORD MILE', width: 'w-28' },
];

function CellValue({ value }: { value: string | number | boolean | undefined }) {
  if (value === undefined || value === null || value === '') {
    return <span className="text-slate-600">-</span>;
  }
  return <span className="text-slate-300 text-[11px] leading-tight">{String(value)}</span>;
}

export default function DataLengkapPage() {
  const { data, loading, addItem, updateItem, deleteItem, importItems, clearAll } = useDataLengkap();
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
      [item.ppid, item.namaLoketKurlog, item.noHpLoket, item.email, item.userMile]
        .some((field) => field?.toLowerCase().includes(q))
    );
  }, [data, searchQuery]);

  const nextNo = useMemo(() => (data.length > 0 ? Math.max(...data.map((i) => i.no)) + 1 : 1), [data]);

  const handleAdd = async (formData: DataLengkapItem) => {
    try {
      await addItem(formData);
      showToast('Data loket berhasil ditambahkan', 'success');
      setShowForm(false);
    } catch {
      showToast('Gagal menambahkan data', 'error');
    }
  };

  const handleSaveBatch = async (items: DataLengkapItem[]) => {
    try {
      await importItems(items);
      showToast(`Berhasil menyimpan ${items.length} data loket`, 'success');
      setShowForm(false);
    } catch {
      showToast('Gagal menyimpan data', 'error');
    }
  };

  const handleUpdate = async (formData: DataLengkapItem) => {
    try {
      await updateItem(formData.id, formData);
      showToast('Data loket berhasil diperbarui', 'success');
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
      showToast('Data loket berhasil dihapus', 'success');
    } catch {
      showToast('Gagal menghapus data', 'error');
    }
    setDeleteTarget(null);
  };

  const handleClearAll = async () => {
    try {
      await clearAll();
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
    const headers = COLUMNS.map((c) => c.label);
    const rows = filteredData.map((item) => COLUMNS.map((c) => item[c.key] ?? ''));
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = COLUMNS.map(() => ({ wch: 20 }));
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
        const rows = XLSX.utils.sheet_to_json<(string | undefined)[]>(ws, { header: 1 });

        if (rows.length < 2) {
          showToast('File Excel kosong atau tidak valid', 'error');
          return;
        }

        const headerRow = rows[0] as string[];
        const colMap = COLUMNS.map((c) => {
          const idx = headerRow.findIndex((h) => h?.trim().toUpperCase() === c.label);
          return { key: c.key, idx };
        });

        const imported: Omit<DataLengkapItem, 'id' | 'no' | 'waktuUpdate'>[] = [];
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.every((c) => c === undefined || c === null || String(c).trim() === '')) continue;
          const obj: Record<string, string> = {};
          for (const { key, idx } of colMap) {
            obj[key] = idx >= 0 && row[idx] !== undefined ? String(row[idx]).trim() : '';
          }
          imported.push(obj as unknown as Omit<DataLengkapItem, 'id' | 'no' | 'waktuUpdate'>);
        }

        await importItems(imported);
        showToast(`Berhasil mengimport ${imported.length} data`, 'success');
      } catch {
        showToast('Gagal membaca file Excel', 'error');
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
      <div className="min-h-screen bg-slate-900 text-slate-200">
        <main className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-5">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-400" />
                Data Lengkap Loket &amp; Agen
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Data akses loket KurLog — PPID, nama loket, kontak, dan kredensial Mile.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => { setEditItem(null); setShowForm(true); }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Data Loket
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export Excel
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <FileUp className="w-3.5 h-3.5" />
                Import Excel
              </button>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
              {data.length > 0 && (
                <button
                  onClick={() => setShowClearAll(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-400 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus Semua
                </button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari PPID, Nama Loket, No HP, Email, User Mile..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Info bar */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Menampilkan <strong className="text-slate-300">{displayCount}</strong> dari <strong className="text-slate-300">{totalCount}</strong> data loket
            </span>
            {searchQuery && displayCount === 0 && totalCount > 0 && (
              <span className="text-amber-400">Pencarian tidak ditemukan</span>
            )}
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-sm text-slate-500">Memuat data...</span>
            </div>
          ) : data.length === 0 ? (
            <EmptyState
              title="Belum ada data loket"
              description="Klik tombol 'Tambah Data Loket' untuk menambahkan data baru, atau import dari file Excel."
              icon={<Database className="w-8 h-8 text-slate-600" />}
            />
          ) : filteredData.length === 0 ? (
            <EmptyState
              title="Data tidak ditemukan"
              description={`Tidak ada data yang cocok dengan pencarian "${searchQuery}".`}
              icon={<Search className="w-8 h-8 text-slate-600" />}
            />
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="sticky top-0 bg-slate-900 z-10 px-3 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-r border-slate-800 w-10">
                        AKSI
                      </th>
                      {COLUMNS.map((col) => (
                        <th
                          key={col.key}
                          className={`sticky top-0 bg-slate-900 z-10 px-3 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-r border-slate-800 ${col.width}`}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-3 py-2.5 border-r border-slate-800">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1 rounded-md hover:bg-slate-700 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(item.id)}
                              className="p-1 rounded-md hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        {COLUMNS.map((col) => (
                          <td key={col.key} className="px-3 py-2.5 border-r border-slate-800/40 max-w-[240px] truncate">
                            <CellValue value={item[col.key]} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2.5 text-xs text-slate-600 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
                <span>Total {displayCount} data loket ({filteredData.length !== data.length ? `${data.length} total` : ''})</span>
                <span className="text-[10px] text-slate-600">
                  6 kolom ditampilkan
                </span>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <DataLengkapForm
        key={showForm ? editItem?.id || 'new' : 'closed'}
        open={showForm}
        onClose={() => { setShowForm(false); setEditItem(null); }}
        onSave={editItem ? handleUpdate : handleAdd}
        onSaveBatch={handleSaveBatch}
        editItem={editItem}
        nextNo={nextNo}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Data Loket"
        message="Apakah Anda yakin ingin menghapus data loket ini? Tindakan ini tidak dapat dibatalkan."
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
