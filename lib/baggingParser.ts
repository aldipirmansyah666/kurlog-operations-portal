import type { BaggingRow } from '@/lib/types';

export const TANGGAL_ALIASES = ['TANGGAL', 'TGL', 'DATE'] as const;
export const NO_RESI_ALIASES = ['NO RESI', 'NOMOR RESI', 'RESI', 'NO_RESI'] as const;
export const AGEN_ALIASES = ['AGEN', 'NAMA AGEN', 'MITRA'] as const;
export const LAYANAN_ALIASES = ['KODE LAYANAN', 'LAYANAN', 'SERVICE'] as const;
export const STATUS_ALIASES = ['STATUS BAGGING', 'STATUS', 'BAGGING'] as const;

const NBSP_REGEX = /\u00A0/g;
const ZERO_WIDTH_REGEX = /[\uFEFF\u200B\u200C\u200D\u2060\u180E]/g;

function stripInvisible(value: string): string {
  return value.replace(NBSP_REGEX, ' ').replace(ZERO_WIDTH_REGEX, '').replace(/\r/g, '');
}

function normalizeCell(value: unknown): string {
  return stripInvisible(String(value ?? ''))
    .replace(/[\t\n]/g, ' ')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

function findBestColumnIndex(normalizedHeader: string[], aliases: readonly string[]): number {
  const sorted = [...aliases].sort((a, b) => b.length - a.length);
  for (const alias of sorted) {
    const idx = normalizedHeader.findIndex((cell) => cell === alias || cell.includes(alias));
    if (idx !== -1) return idx;
  }
  return -1;
}

export function findBaggingColumnIndices(headerRow: unknown[]): {
  tanggalIdx: number;
  resiIdx: number;
  agenIdx: number;
  layananIdx: number;
  statusIdx: number;
} {
  const normalized = headerRow.map(normalizeCell);
  return {
    tanggalIdx: findBestColumnIndex(normalized, TANGGAL_ALIASES),
    resiIdx: findBestColumnIndex(normalized, NO_RESI_ALIASES),
    agenIdx: findBestColumnIndex(normalized, AGEN_ALIASES),
    layananIdx: findBestColumnIndex(normalized, LAYANAN_ALIASES),
    statusIdx: findBestColumnIndex(normalized, STATUS_ALIASES),
  };
}

export function findBaggingHeaderRowIndex(rows: unknown[][]): number {
  const maxScan = Math.min(rows.length, 10);
  let bestIdx = -1;
  let bestScore = 0;
  for (let i = 0; i < maxScan; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    if (row.every((c) => stripInvisible(String(c ?? '')).trim() === '')) continue;
    const norms = row.map(normalizeCell);
    let score = 0;
    if (norms.some((c) => NO_RESI_ALIASES.some((a) => c.includes(a)))) score++;
    if (norms.some((c) => STATUS_ALIASES.some((a) => c.includes(a)))) score++;
    if (norms.some((c) => AGEN_ALIASES.some((a) => c.includes(a)))) score++;
    if (norms.some((c) => TANGGAL_ALIASES.some((a) => c.includes(a)))) score++;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
    if (score >= 3) return i;
  }
  if (bestScore >= 2) return bestIdx;
  return -1;
}

function normalizeTanggal(value: unknown): string {
  if (!value) return '';
  return stripInvisible(String(value)).replace(/[\t\n]/g, ' ').trim().replace(/\s+/g, ' ');
}

export function parseBaggingRowsFromAOA(rows: unknown[][]): BaggingRow[] {
  if (rows.length === 0) return [];
  const headerIdx = findBaggingHeaderRowIndex(rows);
  if (headerIdx === -1) return [];
  const headerRow = rows[headerIdx];
  const { tanggalIdx, resiIdx, agenIdx, layananIdx, statusIdx } = findBaggingColumnIndices(headerRow);
  if (resiIdx === -1 && statusIdx === -1 && agenIdx === -1) return [];

  const out: BaggingRow[] = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    if (row.every((c) => stripInvisible(String(c ?? '')).trim() === '')) continue;
    const tanggal = tanggalIdx !== -1 ? normalizeTanggal(row[tanggalIdx] ?? '') : '';
    const noResi = resiIdx !== -1 ? stripInvisible(String(row[resiIdx] ?? '')).replace(/[\t\n]/g, '').trim().replace(/\s+/g, '').toUpperCase() : '';
    const agen = agenIdx !== -1 ? stripInvisible(String(row[agenIdx] ?? '')).replace(/[\t\n]/g, ' ').trim().replace(/\s+/g, ' ') : '';
    const layanan = layananIdx !== -1 ? stripInvisible(String(row[layananIdx] ?? '')).replace(/[\t\n]/g, ' ').trim().toUpperCase() : '';
    const statusBagging = statusIdx !== -1 ? stripInvisible(String(row[statusIdx] ?? '')).replace(/[\t\n]/g, ' ').trim() : '';
    // keep rows even if some empty, but skip totally empty
    if (!noResi && !agen && !statusBagging) continue;
    const obj: BaggingRow = {
      Tanggal: tanggal,
      'No Resi': noResi,
      Agen: agen,
      'Kode Layanan': layanan,
      'Status Bagging': statusBagging,
    };
    // preserve original extra columns for debugging
    headerRow.forEach((h, idx) => {
      const key = String(h ?? '').trim();
      if (!key) return;
      if ([tanggalIdx, resiIdx, agenIdx, layananIdx, statusIdx].includes(idx)) return;
      obj[key] = row[idx] ?? '';
    });
    out.push(obj);
  }
  return out;
}
