import type { ResiStatus } from './types';

export const STATUS_LIST: ResiStatus[] = ['PERJALANAN', 'DELIVERED', 'RETUR', 'HOLD', 'CCH'];

export const STATUS_COLORS: Record<string, string> = {
  PERJALANAN: '#3b82f6',
  DELIVERED: '#10b981',
  RETUR: '#f43f5e',
  HOLD: '#f59e0b',
  CCH: '#a855f7',
};

export const STATUS_BADGE_CLASSES: Record<string, string> = {
  PERJALANAN: 'bg-blue-50 text-blue-700 border-blue-200',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  RETUR: 'bg-rose-50 text-rose-700 border-rose-200',
  HOLD: 'bg-amber-50 text-amber-700 border-amber-200',
  CCH: 'bg-purple-50 text-purple-700 border-purple-200',
};

export const LAYANAN_OPTIONS = ['PE', 'PKH', 'EC3'] as const;

export const CLOSED_STATUSES: string[] = ['DELIVERED', 'RETUR'];

export const PAGE_SIZE_OPTIONS = [25, 100, 150] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];
export const DEFAULT_PAGE_SIZE: PageSize = 25;

export function isClosedStatus(status: string): boolean {
  return CLOSED_STATUSES.includes(status.toUpperCase());
}
