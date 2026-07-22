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
import { StatCardSkeleton, ChartSkeleton } from '@/app/components/ui/LoadingSkeleton';
import EmptyState from '@/app/components/ui/EmptyState';
import ResiForm from '@/app/components/resi/ResiForm';
import ResiTable from '@/app/components/resi/ResiTable';
import FollowUpModal from '@/app/components/resi/FollowUpModal';
import PasteImportModal from '@/app/components/resi/PasteImportModal';
import { StatusPieChart, TopAgenBarChart } from '@/app/components/resi/Charts';
import SearchBar from '@/app/components/resi/SearchBar';
import { isClosedStatus } from '@/lib/constants';
import type { ResiItem } from '@/lib/types';
import { PackageSearch, CheckCircle2, Clock, Trash } from 'lucide-react';

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
    try {
      await addResi(data);
      showToast('Resi berhasil ditambahkan', 'success');
    } catch {
      showToast('Gagal menambahkan resi', 'error');
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
      <main className="max-w-7xl mx-auto p-6 md:p-10 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-white flex items-center gap-2">
              <PackageSearch className="w-5 h-5 text-blue-400" />
              Monitoring Resi
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Pencatatan harian, follow up, dan penanganan tiket pengiriman.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteAll(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus Semua
            </button>
            <button
              onClick={() => setShowPasteModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors cursor-pointer"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              Import Excel
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loading ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : (
            <>
              <StatCard label="Total Tiket" value={totalCount} icon={<FileText className="w-5 h-5" />} />
              <StatCard label="Perlu Follow Up" value={needFUCount} icon={<Clock className="w-5 h-5" />} variant="warning" />
              <StatCard label="Closed" value={doneCount} icon={<CheckCircle2 className="w-5 h-5" />} variant="success" />
            </>
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {loading ? (
            <>
              <ChartSkeleton />
              <ChartSkeleton />
            </>
          ) : (
            <>
              <StatusPieChart data={filters.statusChartData} />
              <TopAgenBarChart data={filters.topAgenChartData} />
            </>
          )}
        </div>

        {/* Add Form */}
        <ResiForm onSubmit={handleAddResi} submitting={submitting} onSuccess={() => showToast('Resi ditambahkan', 'success')} />

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

        {/* Data Table */}
        {loading ? (
          <div className="bg-slate-900/70 rounded-xl border border-slate-800/80 p-12 text-center text-sm text-slate-500">
            Memuat data...
          </div>
        ) : filters.filteredResi.length === 0 ? (
          <EmptyState
            title="Belum ada data resi"
            description="Tambahkan resi baru atau import dari spreadsheet."
            icon={<PackageSearch className="w-8 h-8 text-slate-500" />}
          />
        ) : (
          <>
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
          </>
        )}
      </main>

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
