import { useState, useMemo, useCallback } from 'react';
import { DEFAULT_PAGE_SIZE, type PageSize } from '@/lib/constants';

export function usePagination<T>(items: T[]) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const safePage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, page));
  }, []);

  const nextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(p + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(p - 1, 1));
  }, []);

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const changePageSize = useCallback((newSize: PageSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  }, []);

  const startItem = items.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(safePage * pageSize, items.length);

  return {
    paginatedItems,
    currentPage: safePage,
    totalPages,
    totalItems: items.length,
    pageSize,
    startItem,
    endItem,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
    changePageSize,
    hasNext: safePage < totalPages,
    hasPrev: safePage > 1,
  };
}
