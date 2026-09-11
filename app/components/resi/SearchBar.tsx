'use client';

import { Search, X, Calendar, RotateCcw, Trash2, Sparkles } from 'lucide-react';
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

  const tabs: { key: FilterTab; label: string; count: number; activeClass: string }[] = [
    { key: 'all', label: 'Semua', count: totalCount, activeClass: 'bg-slate-900 text-white shadow' },
    { key: 'fu', label: 'Perlu FU', count: needFUCount, activeClass: 'bg-amber-500 text-white shadow' },
    { key: 'done', label: 'Closed', count: doneCount, activeClass: 'bg-emerald-600 text-white shadow' },
  ];

  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 py-4 flex flex-col gap-4">
        {/* Row 1 */}
        <div className="flex flex-col xl:flex-row gap-3 xl:items-center">
          <div className="relative flex-1 max-w-xl">
            <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari no resi, agen, petugas, layanan..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-9 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all duration-150"
            />
            {searchQuery ? (
              <button
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <span className="h-6 w-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                  <X className="h-3 w-3" />
                </span>
              </button>
            ) : (
              <span className="absolute inset-y-0 right-0 pr-3 hidden sm:flex items-center">
                <span className="text-[11px] font-medium tracking-wide text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md">⌘ K</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 border border-slate-200 p-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400 ml-1" />
              <input
                type="date"
                value={startDateFilter}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
              />
              <span className="text-slate-300">—</span>
              <input
                type="date"
                value={endDateFilter}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer"
              />
            </div>

            {selectedCount > 0 && (
              <button
                onClick={onDeleteSelected}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-sm transition-all duration-150 focus-visible:ring-2 focus-visible:ring-rose-500 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Hapus Terpilih ({selectedCount})
              </button>
            )}

            {hasFilters && (
              <button
                onClick={onReset}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-slate-100 border border-slate-200">
            {tabs.map((tab) => {
              const active = filterTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => onFilterTabChange(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-tight whitespace-nowrap transition-all duration-150 focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer ${active ? tab.activeClass : 'text-slate-600 hover:text-slate-900 hover:bg-white'}`}
                >
                  {tab.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${active ? 'bg-white/20 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>{tab.count}</span>
                </button>
              );
            })}
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-400 ml-2">
            <Sparkles className="h-3 w-3" /> {hasFilters ? 'Filter aktif' : 'Tip: gunakan pencarian untuk FU cepat'}
          </span>
        </div>
      </div>
    </div>
  );
}
