'use client';

import { Search, X, Calendar, RotateCcw, Trash2 } from 'lucide-react';
import type { FilterTab } from '@/lib/types';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterTab: FilterTab;
  onFilterTabChange: (tab: FilterTab) => void;
  startDateFilter: string;
  onStartDateChange: (v: string) => void;
  endDateFilter: string;
  onEndDateChange: (v: string) => void;
  totalCount: number;
  needFUCount: number;
  doneCount: number;
  onReset: () => void;
  selectedCount: number;
  onDeleteSelected: () => void;
}

export default function SearchBar({
  searchQuery,
  onSearchChange,
  filterTab,
  onFilterTabChange,
  startDateFilter,
  onStartDateChange,
  endDateFilter,
  onEndDateChange,
  totalCount,
  needFUCount,
  doneCount,
  onReset,
  selectedCount,
  onDeleteSelected,
}: SearchBarProps) {
  const hasFilters = searchQuery || filterTab !== 'all' || startDateFilter || endDateFilter;

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'Semua', count: totalCount },
    { key: 'fu', label: 'Perlu FU', count: needFUCount },
    { key: 'done', label: 'Closed', count: doneCount },
  ];

  return (
    <div className="bg-slate-900/70 rounded-xl border border-slate-800/80 p-4 space-y-3">
      <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3">
        <div className="relative flex-1 max-w-sm w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Cari no resi, agen, petugas..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <input
            type="date"
            value={startDateFilter}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          />
          <span className="text-slate-600">&mdash;</span>
          <input
            type="date"
            value={endDateFilter}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          />
        </div>

        {selectedCount > 0 && (
          <button
            onClick={onDeleteSelected}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus Terpilih ({selectedCount})
          </button>
        )}

        {hasFilters && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      <div className="flex gap-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onFilterTabChange(tab.key)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filterTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>
    </div>
  );
}
