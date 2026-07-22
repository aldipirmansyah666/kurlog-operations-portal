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
  PERJALANAN: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  DELIVERED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  RETUR: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  HOLD: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  CCH: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
};

export const LAYANAN_OPTIONS = ['PE', 'PKH', 'EC3'] as const;

export const CLOSED_STATUSES: string[] = ['DELIVERED', 'RETUR'];

export const ITEMS_PER_PAGE = 25;

export function isClosedStatus(status: string): boolean {
  return CLOSED_STATUSES.includes(status.toUpperCase());
}
