import type { BailoutRow } from '@/lib/types';

export const KODE_ALIASES = ['KODE', 'MITRA ID', 'PAYMENT POINT', 'KODE AGEN'] as const;
export const NAMA_ALIASES = ['NAMA', 'NAMA MITRA', 'NAMA PAYMENT POINT', 'NAMA AGEN'] as const;
export const BAILOUT_ALIASES = ['BAILOUT', 'MINUS', 'MINUS H-1', 'NOMINAL'] as const;

/** Helper: bersihkan karakter invisible */
function cleanInvisible(value: string): string {
  return value.replace(/[\u00A0]/g, ' ').replace(/[\t\r\n]/g, '');
}

/** Normalisasi ketat ppid / Kode Loket sesuai spec: trim + hapus \t\r\n + hapus spasi liar + UPPER, "-" / "0" / "NULL" => "" */
export function normalizeKodeLoket(value: unknown): string {
  let s = String(value ?? '').replace(/[\u00A0]/g, ' ');
  s = s.trim().replace(/[\t\r\n]/g, '').replace(/\s+/g, '').toUpperCase();
  if (s === '-' || s === '0' || s === 'NULL' || s === '') return '';
  return s;
}

/** Normalisasi nama untuk preview (trim + collapse spasi) */
export function normalizeNama(value: unknown): string {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function normalizeCell(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

function findBestColumnIndex(normalizedHeader: string[], aliases: readonly string[]): number {
  const sorted = [...aliases].sort((a, b) => b.length - a.length);
  for (const alias of sorted) {
    const idx = normalizedHeader.findIndex((cell) => cell.includes(alias));
    if (idx !== -1) return idx;
  }
  return -1;
}

export function findColumnIndices(headerRow: unknown[]): {
  kodeIdx: number;
  namaIdx: number;
  bailoutIdx: number;
} {
  const normalized = headerRow.map(normalizeCell);
  const kodeIdx = findBestColumnIndex(normalized, KODE_ALIASES);
  const namaIdx = findBestColumnIndex(normalized, NAMA_ALIASES);
  const bailoutIdx = findBestColumnIndex(normalized, BAILOUT_ALIASES);
  return { kodeIdx, namaIdx, bailoutIdx };
}

export function findHeaderRowIndex(rows: unknown[][]): number {
  let bestIdx = -1;
  let bestScore = 0;
  const maxScan = Math.min(rows.length, 10);
  for (let i = 0; i < maxScan; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    // Skip rows where all cells empty
    if (row.every((c) => String(c ?? '').trim() === '')) continue;
    const normalized = row.map(normalizeCell);
    let score = 0;
    if (normalized.some((cell) => KODE_ALIASES.some((alias) => cell.includes(alias)))) score++;
    if (normalized.some((cell) => NAMA_ALIASES.some((alias) => cell.includes(alias)))) score++;
    if (normalized.some((cell) => BAILOUT_ALIASES.some((alias) => cell.includes(alias)))) score++;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
    if (score === 3) return i;
  }
  if (bestScore >= 1) return bestIdx;
  return -1;
}

/**
 * Bersihkan nilai nominal: hapus karakter non-numeric selain tanda minus (-),
 * konversi otomatis string/number menjadi integer.
 * Menangani format Rp, titik ribuan, koma desimal, dan accounting parentheses.
 */
export function cleanBailoutValue(val: unknown): number {
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return 0;
    return Math.trunc(val);
  }
  if (val == null) return 0;
  const str = String(val).trim();
  if (str === '' || str === '-') return 0;

  const isParenthesesNegative = str.includes('(') && str.includes(')');
  // Hapus karakter non-numeric selain minus
  const cleaned = str.replace(/[^0-9\-]/g, '');
  if (cleaned === '' || cleaned === '-') return 0;

  const isNegative = cleaned.includes('-') || isParenthesesNegative;
  const digitsOnly = cleaned.replace(/-/g, '');
  if (digitsOnly === '') return 0;

  const numericStr = (isNegative ? '-' : '') + digitsOnly;
  const parsed = parseInt(numericStr, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

// Alias untuk kompatibilitas dengan kode lama yang memanggil parseBailoutValue
export const parseBailoutValue = cleanBailoutValue;

/**
 * Parse baris Bailout dari array 2D (AOA) dengan header dinamis.
 * Mendukung header di baris ke-2 atau baris manapun dalam 10 baris pertama.
 */
export function parseBailoutRowsFromAOA(rows: unknown[][]): BailoutRow[] {
  if (rows.length === 0) return [];
  const headerIdx = findHeaderRowIndex(rows);
  if (headerIdx === -1) return [];
  const headerRow = rows[headerIdx];
  const { kodeIdx, namaIdx, bailoutIdx } = findColumnIndices(headerRow);
  if (kodeIdx === -1 && namaIdx === -1 && bailoutIdx === -1) return [];

  const dedup = new Map<string, BailoutRow>();
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    if (row.every((c) => String(c ?? '').trim() === '')) continue;

    const rawKode = kodeIdx !== -1 ? String(row[kodeIdx] ?? '').trim() : '';
    const kode = normalizeKodeLoket(rawKode);
    const nama = namaIdx !== -1 ? normalizeNama(row[namaIdx] ?? '') : '';
    const rawBailout: unknown = bailoutIdx !== -1 ? (row[bailoutIdx] ?? '') : '';

    // Filter baris TOTAL atau kosong tanpa identitas
    if (!nama && !kode) continue;
    const upperNama = nama.toUpperCase();
    const upperKode = kode.toUpperCase();
    if (upperNama === 'TOTAL' || upperKode === 'TOTAL') continue;
    // Skip baris ringkasan yang tidak memiliki nama agen bermakna
    if (upperNama.includes('JUMLAH') || upperNama.includes('GRAND TOTAL')) continue;

    const bailoutNum = cleanBailoutValue(rawBailout);

    // Jika baris hanya berisi tanggal judul atau summary tanpa nominal dan kode, skip
    if (!kode && !nama) continue;

    // Deduplikasi dalam file: kode yang sama (setelah normalisasi) -> last wins (UPDATE, bukan INSERT duplikat)
    const key = kode || `__row_${i}`;
    const existing = dedup.get(key);
    if (existing) {
      // Update bestaande dengan nilai terbaru (simulasi upsert)
      dedup.set(key, {
        KODE: kode,
        NAMA: nama || String(existing['NAMA'] ?? ''),
        BAILOUT: bailoutNum,
      });
    } else {
      dedup.set(key, {
        KODE: kode,
        NAMA: nama,
        BAILOUT: bailoutNum,
      });
    }
  }
  return Array.from(dedup.values());
}

/**
 * Helper untuk paste input (tab-separated). Mendukung header dinamis di baris manapun.
 * Membersihkan karakter tersembunyi \t, \r, \n, \u00A0 sebelum sanitasi ketat ppid.
 */
export function parseBailoutFromPaste(text: string): BailoutRow[] {
  const cleanedText = text.replace(/[\u00A0]/g, ' ');
  const lines = cleanedText.trim().split('\n').map((l) => cleanInvisible(l).trim()).filter((l) => l.trim());
  if (lines.length === 0) return [];
  // Ubah setiap line menjadi array kolom (split tab, fallback ke comma jika tidak ada tab)
  const rows: string[][] = lines.map((line) => {
    if (line.includes('\t')) return line.split('\t').map((c) => cleanInvisible(c).trim());
    if (line.includes(',')) return line.split(',').map((c) => cleanInvisible(c).trim());
    // fallback: split by 2+ spaces
    return line.split(/\s{2,}/).map((c) => cleanInvisible(c).trim());
  });

  const headerIdx = findHeaderRowIndex(rows as unknown[][]);
  if (headerIdx === -1) return [];
  const headerRow = rows[headerIdx];
  const { kodeIdx, namaIdx, bailoutIdx } = findColumnIndices(headerRow);
  if (kodeIdx === -1 && namaIdx === -1 && bailoutIdx === -1) return [];

  const dedupPaste = new Map<string, BailoutRow>();
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const cols = rows[i];
    if (!cols || cols.length === 0) continue;
    if (cols.every((c) => String(c ?? '').trim() === '')) continue;
    const rawKode = kodeIdx !== -1 ? (cols[kodeIdx] ?? '').trim() : '';
    const kode = normalizeKodeLoket(rawKode);
    const nama = namaIdx !== -1 ? normalizeNama(cols[namaIdx] ?? '') : '';
    const raw = bailoutIdx !== -1 ? (cols[bailoutIdx] ?? '').trim() : '';
    if (!nama && !kode) continue;
    if (nama.toUpperCase() === 'TOTAL' || kode.toUpperCase() === 'TOTAL') continue;
    if (!nama) continue;
    if (nama.toUpperCase().includes('JUMLAH')) continue;
    const bailoutNum = cleanBailoutValue(raw);
    const key = kode || `__row_${i}`;
    dedupPaste.set(key, { KODE: kode, NAMA: nama, BAILOUT: bailoutNum });
  }
  // Filter agar hanya baris dengan NAMA valid
  return Array.from(dedupPaste.values()).filter((row) => row.NAMA && String(row.NAMA).trim() !== '' && String(row.NAMA).toUpperCase() !== 'TOTAL');
}
