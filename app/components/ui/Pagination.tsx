'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { PAGE_SIZE_OPTIONS, type PageSize } from '@/lib/constants';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: PageSize;
  startItem: number;
  endItem: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (page: number) => void;
  onPageSizeChange: (size: PageSize) => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export default function Pagination({ currentPage, totalPages, totalItems, pageSize, startItem, endItem, onPrev, onNext, onGoTo, onPageSizeChange, hasPrev, hasNext }: PaginationProps) {
  if (totalItems === 0) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-3">
      <div className="flex items-center gap-3 text-xs w-full sm:w-auto">
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-white font-medium">
          {startItem}–{endItem}
          <span className="opacity-60">/</span>
          {totalItems}
        </span>
        <span className="hidden sm:inline text-slate-500">Halaman {currentPage} dari {totalPages}</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value) as PageSize)}
          className="ml-auto sm:ml-0 rounded-full bg-white border border-slate-200 text-slate-700 text-xs font-medium px-3 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>{size} / halaman</option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-full p-1 shadow-sm">
        <button onClick={() => onGoTo(1)} disabled={!hasPrev} className="h-7 w-7 inline-flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer">
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button onClick={onPrev} disabled={!hasPrev} className="h-7 w-7 inline-flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-1 px-1">
          {pages.map((page, i) =>
            page === '...' ? (
              <span key={`dots-${i}`} className="px-1 text-slate-300">…</span>
            ) : (
              <button
                key={page}
                onClick={() => onGoTo(page)}
                className={`h-7 min-w-7 px-2 rounded-full text-xs font-semibold transition-all duration-150 focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer ${currentPage === page ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {page}
              </button>
            )
          )}
        </div>
        <button onClick={onNext} disabled={!hasNext} className="h-7 w-7 inline-flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer">
          <ChevronRight className="h-4 w-4" />
        </button>
        <button onClick={() => onGoTo(totalPages)} disabled={!hasNext} className="h-7 w-7 inline-flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-indigo-500 cursor-pointer">
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
