'use client';

import { useState, useCallback } from 'react';
import { ClipboardPaste, Trash2, FileText } from 'lucide-react';
import { useResi } from '@/lib/hooks/useResi';
import { useResiFilters } from '@/lib/hooks/useResiFilters';
import { usePagination } from '@/lib/hooks/usePagination';
import { useToast } from '@/lib/hooks/useToast';
import StatCard from '@/app/components/ui/StatCard';
import ToastContainer from '@/app/components/ui/Toast';
import ConfirmDialog from '@/app/components/ui/ConfirmDialog';
import Pagination from '@/app/components/ui/Pagination';
import { StatCardSkeleton } from '@/app/components/ui/LoadingSkeleton';
import EmptyState from '@/app/components/ui/EmptyState';
import ResiForm from '@/app/components/resi/ResiForm';
import ResiTable from '@/app/components/resi/ResiTable';
import FollowUpModal from '@/app/components/resi/FollowUpModal';
import PasteImportModal from '@/app/components/resi/PasteImportModal';
import SearchBar from '@/app/components/resi/SearchBar';
import type { ResiItem } from '@/lib/types';
import { PackageSearch, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export default function Home() {
  const { resiList, loading, totalCount, needFUCount, doneCount, addResi, addResiBatch, updateStatus, addNote, updateNote, deleteResi, deleteAllResi, deleteResiBatch } = useResi();
  const filters = useResiFilters(resiList);
  const pagination = usePagination(filters.filteredResi);
  const { toasts, showToast, removeToast } = useToast();

  const [submitting, setSubmitting] = useState(false);
  const [followUpResi, setFollowUpResi] = useState<ResiItem | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showDeleteSelected, setShowDeleteSelected] = useState(false);

  const { deliveredCount, returCount } = (() => {
    let d = 0, r = 0;
    for (const item of resiList) {
      const s = item.status_resi.toUpperCase();
      if (s === 'DELIVERED') d++;
      else if (s === 'RETUR') r++;
    }
    return { deliveredCount: d, returCount: r };
  })();

  const handleToggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleAll = useCallback((ids: number[]) => {
    setSelectedIds((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      if (allSelected) return new Set<number>();
      return new Set(ids);
    });
  }, []);

  const handleAddResi = async (data: Parameters<typeof addResi>[0]) => {
    setSubmitting(true);
    try {
      await addResi(data);
      showToast('Resi berhasil ditambahkan', 'success');
    } catch {
      showToast('Gagal menambahkan resi', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchImport = async (items: Parameters<typeof addResiBatch>[0]) => {
    try {
      await addResiBatch(items);
      showToast(`${items.length} resi berhasil diimport`, 'success');
    } catch {
      showToast('Gagal mengimport resi', 'error');
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await updateStatus(id, status);
      showToast('Status berhasil diupdate', 'success');
    } catch {
      showToast('Gagal mengupdate status', 'error');
    }
  };

  const handleSaveNote = async (resi: ResiItem, note: string) => {
    try {
      await addNote(resi, note);
      showToast('Catatan tersimpan', 'success');
    } catch {
      showToast('Gagal menyimpan catatan', 'error');
    }
  };

  const handleUpdateNote = async (id: number, newCatatan: string) => {
    try {
      await updateNote(id, newCatatan);
      showToast('Catatan diperbarui', 'success');
    } catch {
      showToast('Gagal memperbarui catatan', 'error');
    }
  };

  const handleDelete = async () => {
    if (deleteTarget === null) return;
    try {
      await deleteResi(deleteTarget);
      showToast('Resi berhasil dihapus', 'success');
    } catch {
      showToast('Gagal menghapus resi', 'error');
    }
    setDeleteTarget(null);
  };

  const handleDeleteAll = async () => {
    try {
      await deleteAllResi();
      showToast('Semua data resi berhasil dihapus', 'success');
    } catch {
      showToast('Gagal menghapus data', 'error');
    }
    setShowDeleteAll(false);
  };

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedIds);
    try {
      await deleteResiBatch(ids);
      setSelectedIds(new Set());
      showToast(`${ids.length} resi berhasil dihapus`, 'success');
    } catch {
      showToast('Gagal menghapus resi terpilih', 'error');
    }
    setShowDeleteSelected(false);
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="space-y-6 bg-slate-50">
        {/* Page Header — light clean */}
        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500" />
          <div className="px-5 sm:px-6 py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex gap-4">
              <div className="hidden sm:flex h-11 w-11 rounded-xl bg-indigo-600 text-white items-center justify-center shadow-sm shrink-0">
                <PackageSearch className="h-5 w-5" />
              </div>
              <div>
                <h1 className="page-header-title text-[18px] tracking-tight text-slate-900 font-bold flex items-center gap-2">
                  Monitoring Resi
                  <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20 text-[10px] font-bold tracking-widest uppercase"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />Live</span>
                </h1>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 mt-1 leading-relaxed">
                  Pencatatan harian, follow up, dan penanganan tiket pengiriman — <span className="font-semibold text-slate-700 normal-case tracking-normal">{totalCount} resi terdata</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDeleteAll(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-rose-600 bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 shadow-sm rounded-xl active:scale-[0.98] transition-all duration-150 focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hapus Semua
              </button>
              <button
                onClick={() => setShowPasteModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm rounded-xl active:scale-[0.98] transition-all duration-150 focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
              >
                <ClipboardPaste className="h-3.5 w-3.5" />
                Import Excel
              </button>
            </div>
          </div>
        </div>

        {/* Stat Cards - 4 Executive KPIs — glass */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard label="Total Resi" value={totalCount} icon={<FileText className="w-5 h-5" />} />
              <StatCard label="Perlu Follow Up" value={needFUCount} icon={<Clock className="w-5 h-5" />} variant="warning" />
              <StatCard label="Delivered" value={deliveredCount} icon={<CheckCircle2 className="w-5 h-5" />} variant="success" />
              <StatCard label="Retur" value={returCount} icon={<AlertTriangle className="w-5 h-5" />} variant="danger" />
            </>
          )}
        </div>

        {/* Add Form */}
        <ResiForm onSubmit={handleAddResi} submitting={submitting} />

        {/* Search & Filters */}
        <SearchBar
          searchQuery={filters.searchQuery}
          onSearchChange={filters.setSearchQuery}
          filterTab={filters.filterTab}
          onFilterTabChange={filters.setFilterTab}
          startDateFilter={filters.startDateFilter}
          onStartDateChange={filters.setStartDateFilter}
          endDateFilter={filters.endDateFilter}
          onEndDateChange={filters.setEndDateFilter}
          totalCount={totalCount}
          needFUCount={needFUCount}
          doneCount={doneCount}
          onReset={filters.resetFilters}
          selectedCount={selectedIds.size}
          onDeleteSelected={() => setShowDeleteSelected(true)}
        />

        {/* Data Table — light */}
        {loading ? (
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-12 text-center">
            <span className="inline-flex items-center gap-2 text-sm text-slate-500"><span className="h-4 w-4 rounded-full border-2 border-slate-300 border-t-indigo-600 animate-spin" /> Memuat data resi…</span>
          </div>
        ) : filters.filteredResi.length === 0 ? (
          <EmptyState
            title="Belum ada data resi"
            description="Tambahkan resi baru atau import dari spreadsheet. Filter aktif mungkin menyembunyikan data."
            icon={<PackageSearch className="w-8 h-8 text-slate-400" />}
          />
        ) : (
          <div className="space-y-3">
            <ResiTable
              items={pagination.paginatedItems}
              loading={loading}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleAll={handleToggleAll}
              onStatusChange={handleStatusChange}
              onFollowUp={setFollowUpResi}
              onDelete={(id) => setDeleteTarget(id)}
            />
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm px-2">
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
          </div>
        )}
      </div>

      {/* Modals */}
      <FollowUpModal resi={followUpResi} onClose={() => setFollowUpResi(null)} onSave={handleSaveNote} onUpdateNote={handleUpdateNote} />
      <PasteImportModal open={showPasteModal} onClose={() => setShowPasteModal(false)} onSubmit={handleBatchImport} />
      <ConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Resi"
        message="Apakah Anda yakin ingin menghapus resi ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus"
        variant="danger"
      />
      <ConfirmDialog
        open={showDeleteAll}
        onClose={() => setShowDeleteAll(false)}
        onConfirm={handleDeleteAll}
        title="Hapus Semua Data"
        message="Semua data resi akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan."
        confirmText="Hapus Semua"
        requireTyping="HAPUS"
        variant="danger"
      />
      <ConfirmDialog
        open={showDeleteSelected}
        onClose={() => setShowDeleteSelected(false)}
        onConfirm={handleDeleteSelected}
        title="Hapus Resi Terpilih"
        message={`${selectedIds.size} resi yang dipilih akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus"
        variant="danger"
      />
    </>
  );
}
