import { useState, useMemo, useCallback } from 'react';
import type { ResiItem, FilterTab } from '@/lib/types';
import { isClosedStatus, STATUS_LIST } from '@/lib/constants';
import { normalizePeriodeToISO } from '@/lib/bailoutParser';

const NBSP_REGEX = /\u00A0/g;
const ZERO_WIDTH_REGEX = /[\uFEFF\u200B\u200C\u200D\u2060\u180E]/g;

function stripInvisible(value: string): string {
  return value.replace(NBSP_REGEX, ' ').replace(ZERO_WIDTH_REGEX, '').replace(/\r/g, '');
}

function parseDateToISO(dateStr?: string): string {
  if (!dateStr) return '';
  const cleaned = stripInvisible(String(dateStr)).replace(/[\t\n]/g, ' ').trim().replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  // Use centralized sanitizer that handles DD/MM/YYYY, YYYY-MM-DD, YYYYMMDD, DD-MM-YYYY etc with calendar check
  const iso = normalizePeriodeToISO(cleaned);
  if (iso) return iso;
  // Fallback for legacy "19 DESEMBER 2022" style — let normalizer handle; if null keep original for lexical fallback
  // Return empty to avoid incorrect lexical comparison (bug: "19 DESEMBER 2022" < "2026-09-15" char-wise)
  return '';
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
    const q = stripInvisible(searchQuery).toLowerCase().trim();
    return resiList.filter((item) => {
      if (q) {
        const match =
          stripInvisible(item.no_resi ?? '').toLowerCase().includes(q) ||
          stripInvisible(item.agen ?? '').toLowerCase().includes(q) ||
          stripInvisible(item.petugas ?? '').toLowerCase().includes(q) ||
          stripInvisible(item.status_resi ?? '').toLowerCase().includes(q) ||
          stripInvisible(item.tgl_tiket ?? '').toLowerCase().includes(q);
        if (!match) return false;
      }
      if (filterTab === 'fu' && isClosedStatus(item.status_resi ?? '')) return false;
      if (filterTab === 'done' && !isClosedStatus(item.status_resi ?? '')) return false;
      const itemISO = parseDateToISO(item.tgl_tiket);
      // Only filter by date if we could parse item date; otherwise don't hide unparsable rows
      if (itemISO && startDateFilter && itemISO < startDateFilter) return false;
      if (itemISO && endDateFilter && itemISO > endDateFilter) return false;
      return true;
    });
  }, [resiList, searchQuery, filterTab, startDateFilter, endDateFilter]);

  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    STATUS_LIST.forEach((s) => (counts[s] = 0));
    filteredResi.forEach((r) => {
      const st = stripInvisible(r.status_resi ?? '').toUpperCase().trim();
      if (!st) return;
      counts[st] = (counts[st] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0);
  }, [filteredResi]);

  const topAgenChartData = useMemo(() => {
    const agenMap: Record<string, number> = {};
    filteredResi
      .filter((r) => !isClosedStatus(r.status_resi ?? ''))
      .forEach((r) => {
        const agn = stripInvisible(r.agen ?? '').toUpperCase().trim().replace(/\s+/g, ' ');
        if (!agn) return;
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
