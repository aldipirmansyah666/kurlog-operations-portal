import type { ReconcileRow, ValidatedReconcileRow, ExcelValidationResult } from './types';

// ---------------------------------------------------------------------------
// Sanitizers — konsisten dengan bailoutParser
// ---------------------------------------------------------------------------
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

export const PRODUK_ALIASES = ['PRODUK', 'PRODUK KURLOG', 'KODE PRODUK', 'JENIS PRODUK'] as const;
export const RESI_ALIASES = ['NOMOR RESI', 'NOMOR_RESI', 'NO RESI', 'NO_RESI', 'RESI', 'NOMOR'] as const;

function findBestHeaderMatch(keys: string[], aliases: readonly string[]): string | undefined {
  const normalizedKeys = keys.map(normalizeCell);
  const sorted = [...aliases].sort((a, b) => b.length - a.length);
  for (const alias of sorted) {
    const idx = normalizedKeys.findIndex((k) => k === alias || k.includes(alias));
    if (idx !== -1) return keys[idx];
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Validation per row
// ---------------------------------------------------------------------------
export function validateRow(row: ReconcileRow): { isValid: boolean; reason: string } {
  const produk = normalizeCell(row.produk);
  const resi = normalizeCell(row.nomor_resi);

  if (produk === 'EC3') {
    if (resi.startsWith('SHPE') || resi.startsWith('P260')) {
      return { isValid: true, reason: '' };
    }
    return { isValid: false, reason: 'EC3 resi harus diawali SHPE atau P260' };
  }

  if (produk === 'PKH') {
    if (resi.startsWith('P260') || resi.startsWith('TTSPOS')) {
      return { isValid: true, reason: '' };
    }
    return { isValid: false, reason: 'PKH resi harus diawali P260 atau TTSPOS' };
  }

  return { isValid: false, reason: 'Produk tidak memenuhi kriteria filter' };
}

// ---------------------------------------------------------------------------
// Dynamic Header Mapping — support header di baris berapapun (AOA) dan record array
// ---------------------------------------------------------------------------
export function normalizeReconcileRows(raw: Record<string, unknown>[]): ReconcileRow[] {
  if (raw.length === 0) return [];

  const keys = Object.keys(raw[0]);
  const produkKey = findBestHeaderMatch(keys, PRODUK_ALIASES);
  const resiKey = findBestHeaderMatch(keys, RESI_ALIASES);

  if (!produkKey || !resiKey) return [];

  return raw.map((row) => ({
    produk: stripInvisible(String(row[produkKey] ?? '')).replace(/[\t\n]/g, ' ').trim(),
    nomor_resi: stripInvisible(String(row[resiKey] ?? '')).replace(/[\t\n]/g, ' ').trim().replace(/\s+/g, '').toUpperCase(),
    ...row,
  }));
}

/**
 * AOA-based parser dengan Dynamic Header Mapping — deteksi header di 10 baris pertama.
 * Dipakai oleh app/reconcile/page.tsx untuk file Excel dengan title row.
 */
export function findReconcileHeaderRowIndex(rows: unknown[][]): number {
  const maxScan = Math.min(rows.length, 10);
  let bestIdx = -1;
  let bestScore = 0;
  for (let i = 0; i < maxScan; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    if (row.every((c) => stripInvisible(String(c ?? '')).trim() === '')) continue;
    const norms = row.map(normalizeCell);
    let score = 0;
    if (norms.some((c) => PRODUK_ALIASES.some((a) => c.includes(a)))) score++;
    if (norms.some((c) => RESI_ALIASES.some((a) => c.includes(a)))) score++;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
    if (score === 2) return i;
  }
  if (bestScore >= 1) return bestIdx;
  return -1;
}

export function parseReconcileRowsFromAOA(rows: unknown[][]): ReconcileRow[] {
  if (rows.length === 0) return [];
  const headerIdx = findReconcileHeaderRowIndex(rows);
  if (headerIdx === -1) {
    // Fallback: treat as already normalized if no header found
    return normalizeReconcileRows(rows as unknown as Record<string, unknown>[]);
  }
  const headerRow = rows[headerIdx];
  const normalizedHeader = headerRow.map(normalizeCell);
  const produkIdx = (() => {
    const sorted = [...PRODUK_ALIASES].sort((a, b) => b.length - a.length);
    for (const alias of sorted) {
      const idx = normalizedHeader.findIndex((c) => c.includes(alias));
      if (idx !== -1) return idx;
    }
    return -1;
  })();
  const resiIdx = (() => {
    const sorted = [...RESI_ALIASES].sort((a, b) => b.length - a.length);
    for (const alias of sorted) {
      const idx = normalizedHeader.findIndex((c) => c.includes(alias));
      if (idx !== -1) return idx;
    }
    return -1;
  })();
  if (produkIdx === -1 && resiIdx === -1) return [];

  const out: ReconcileRow[] = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    if (row.every((c) => stripInvisible(String(c ?? '')).trim() === '')) continue;
    const produk = produkIdx !== -1 ? stripInvisible(String(row[produkIdx] ?? '')).replace(/[\t\n]/g, ' ').trim() : '';
    const nomor_resi = resiIdx !== -1 ? stripInvisible(String(row[resiIdx] ?? '')).replace(/[\t\n]/g, ' ').trim().replace(/\s+/g, '').toUpperCase() : '';
    if (!produk && !nomor_resi) continue;
    const obj: Record<string, unknown> = { produk, nomor_resi };
    // preserve original cells for export
    headerRow.forEach((h, idx) => {
      const key = normalizeCell(h) || `COL_${idx}`;
      if (idx !== produkIdx && idx !== resiIdx) obj[key] = row[idx] ?? '';
    });
    out.push(obj as ReconcileRow);
  }
  return out;
}

export function validateAll(rows: ReconcileRow[]): {
  valid: ValidatedReconcileRow[];
  rejected: ValidatedReconcileRow[];
} {
  const valid: ValidatedReconcileRow[] = [];
  const rejected: ValidatedReconcileRow[] = [];

  rows.forEach((row, idx) => {
    const result = validateRow(row);
    const validated: ValidatedReconcileRow = {
      ...row,
      rowIndex: idx + 1,
      isValid: result.isValid,
      reason: result.reason,
    };

    if (result.isValid) {
      valid.push(validated);
    } else {
      rejected.push(validated);
    }
  });

  return { valid, rejected };
}

export function validateExcelFile(dataRows: ReconcileRow[]): ExcelValidationResult {
  const ec3Rows = dataRows.filter((r) => normalizeCell(r.produk) === 'EC3');
  const hasEC3_SHPE = ec3Rows.some((r) => normalizeCell(r.nomor_resi).startsWith('SHPE'));
  const hasEC3_P260 = ec3Rows.some((r) => normalizeCell(r.nomor_resi).startsWith('P260'));
  const isEC3Valid = ec3Rows.length === 0 ? true : hasEC3_SHPE && hasEC3_P260;

  const pkhRows = dataRows.filter((r) => normalizeCell(r.produk) === 'PKH');
  const hasPKH_P260 = pkhRows.some((r) => normalizeCell(r.nomor_resi).startsWith('P260'));
  const hasPKH_TTSPOS = pkhRows.some((r) => normalizeCell(r.nomor_resi).startsWith('TTSPOS'));
  const isPKHValid = pkhRows.length === 0 ? true : hasPKH_P260 && hasPKH_TTSPOS;

  const isFileValid = isEC3Valid && isPKHValid;

  const errors: string[] = [];
  if (ec3Rows.length > 0) {
    if (!hasEC3_SHPE) errors.push('EC3: Tidak ada resi berawalan SHPE');
    if (!hasEC3_P260) errors.push('EC3: Tidak ada resi berawalan P260');
  }
  if (pkhRows.length > 0) {
    if (!hasPKH_P260) errors.push('PKH: Tidak ada resi berawalan P260');
    if (!hasPKH_TTSPOS) errors.push('PKH: Tidak ada resi berawalan TTSPOS');
  }

  return {
    isFileValid,
    isEC3Valid,
    isPKHValid,
    details: {
      ec3_shpe: hasEC3_SHPE,
      ec3_p260: hasEC3_P260,
      pkh_p260: hasPKH_P260,
      pkh_ttspos: hasPKH_TTSPOS,
    },
    errors,
  };
}
