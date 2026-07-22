'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startItem: number;
  endItem: number;
  onPrev: () => void;
  onNext: () => void;
  onGoTo: (page: number) => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  startItem,
  endItem,
  onPrev,
  onNext,
  onGoTo,
  hasPrev,
  hasNext,
}: PaginationProps) {
  if (totalItems === 0) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between px-1 py-3 text-xs">
      <span className="text-slate-500">
        Menampilkan {startItem}–{endItem} dari {totalItems}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onGoTo(1)}
          disabled={!hasPrev}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((page, i) =>
          page === '...' ? (
            <span key={`dots-${i}`} className="px-1 text-slate-600">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onGoTo(page)}
              className={`min-w-[28px] h-7 px-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {page}
            </button>
          )
        )}
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => onGoTo(totalPages)}
          disabled={!hasNext}
          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
