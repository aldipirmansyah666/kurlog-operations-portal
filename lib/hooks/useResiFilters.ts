import { useState, useMemo, useCallback } from 'react';
import type { ResiItem, FilterTab } from '@/lib/types';
import { isClosedStatus, STATUS_LIST } from '@/lib/constants';

function parseDateToISO(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.trim().split('/');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr;
}

export function useResiFilters(resiList: ResiItem[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setFilterTab('all');
    setStartDateFilter('');
    setEndDateFilter('');
  }, []);

  const filteredResi = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return resiList.filter((item) => {
      if (q) {
        const match =
          item.no_resi?.toLowerCase().includes(q) ||
          item.agen?.toLowerCase().includes(q) ||
          item.petugas?.toLowerCase().includes(q) ||
          item.status_resi?.toLowerCase().includes(q) ||
          item.tgl_tiket?.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterTab === 'fu' && isClosedStatus(item.status_resi)) return false;
      if (filterTab === 'done' && !isClosedStatus(item.status_resi)) return false;
      const itemISO = parseDateToISO(item.tgl_tiket);
      if (startDateFilter && itemISO < startDateFilter) return false;
      if (endDateFilter && itemISO > endDateFilter) return false;
      return true;
    });
  }, [resiList, searchQuery, filterTab, startDateFilter, endDateFilter]);

  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    STATUS_LIST.forEach((s) => (counts[s] = 0));
    filteredResi.forEach((r) => {
      const st = r.status_resi.toUpperCase();
      counts[st] = (counts[st] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0);
  }, [filteredResi]);

  const topAgenChartData = useMemo(() => {
    const agenMap: Record<string, number> = {};
    filteredResi
      .filter((r) => !isClosedStatus(r.status_resi))
      .forEach((r) => {
        const agn = r.agen.toUpperCase();
        agenMap[agn] = (agenMap[agn] || 0) + 1;
      });
    return Object.entries(agenMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredResi]);

  return {
    searchQuery,
    setSearchQuery,
    filterTab,
    setFilterTab,
    startDateFilter,
    setStartDateFilter,
    endDateFilter,
    setEndDateFilter,
    resetFilters,
    filteredResi,
    statusChartData,
    topAgenChartData,
  };
}
