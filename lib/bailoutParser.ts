import type { BailoutRow } from '@/lib/types';

export const KODE_ALIASES = [
  'KODE LOKET',
  'KODE',
  'MITRA ID',
  'PAYMENT POINT',
  'KODE AGEN',
  'KODE LOKET DI ONPAYS',
] as const;
export const NAMA_ALIASES = [
  'NAMA LOKET',
  'NAMA',
  'NAMA MITRA',
  'NAMA PAYMENT POINT',
  'NAMA AGEN',
  'NAMA LOKET DI ONPAYS',
] as const;
export const BAILOUT_ALIASES = [
  'BAILOUT',
  'MINUS',
  'MINUS H-1',
  'NOMINAL',
  'SALDO MINUS',
] as const;
export const PERIODE_ALIASES = [
  'PERIODE',
  'TANGGAL',
  'DATE',
  'PERIOD',
  'TGL',
] as const;

// ---------------------------------------------------------------------------
// Invisible sanitizers
// ---------------------------------------------------------------------------
const NBSP_REGEX = /\u00A0/g;
const ZERO_WIDTH_REGEX = /[\uFEFF\u200B\u200C\u200D\u2060\u180E]/g;

/** Bersihkan karakter invisible umum (NBSP -> spasi, zero-width -> hapus, \r -> hapus) */
function stripInvisible(value: string): string {
  return value.replace(NBSP_REGEX, ' ').replace(ZERO_WIDTH_REGEX, '').replace(/\r/g, '');
}

/** Untuk header/cell: hapus invisible, ganti \t\n dengan spasi, trim, uppercase, collapse spasi */
function normalizeCell(value: unknown): string {
  return stripInvisible(String(value ?? ''))
    .replace(/[\t\n]/g, ' ')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

// ---------------------------------------------------------------------------
// Kode loket normalizer
// ---------------------------------------------------------------------------
/** Normalisasi ketat ppid / Kode Loket: hapus \r\t\n\u00A0\uFEFF\u200B dll + hapus semua spasi liar + UPPER, "-" / "0" / "NULL" => "" */
export function normalizeKodeLoket(value: unknown): string {
  let s = stripInvisible(String(value ?? ''));
  // hapus \t \n secara eksplisit (stripInvisible sudah hapus \r)
  s = s.replace(/[\t\n]/g, '');
  // trim + hapus semua whitespace (termasuk spasi liar)
  s = s.trim().replace(/\s+/g, '').toUpperCase();
  if (s === '-' || s === '0' || s === 'NULL' || s === 'N/A' || s === 'NA' || s === '') return '';
  return s;
}

/** Normalisasi nama untuk preview (trim + collapse spasi, bersihkan invisible) */
export function normalizeNama(value: unknown): string {
  return stripInvisible(String(value ?? ''))
    .replace(/[\t\n]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

// ---------------------------------------------------------------------------
// Header mapping helpers
// ---------------------------------------------------------------------------
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
  periodeIdx: number;
} {
  const normalized = headerRow.map(normalizeCell);
  const kodeIdx = findBestColumnIndex(normalized, KODE_ALIASES);
  const namaIdx = findBestColumnIndex(normalized, NAMA_ALIASES);
  const bailoutIdx = findBestColumnIndex(normalized, BAILOUT_ALIASES);
  const periodeIdx = findBestColumnIndex(normalized, PERIODE_ALIASES);
  return { kodeIdx, namaIdx, bailoutIdx, periodeIdx };
}

export function findHeaderRowIndex(rows: unknown[][]): number {
  let bestIdx = -1;
  let bestScore = 0;
  const maxScan = Math.min(rows.length, 10);
  for (let i = 0; i < maxScan; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    if (row.every((c) => String(c ?? '').trim() === '')) continue;
    const normalized = row.map(normalizeCell);
    let score = 0;
    if (normalized.some((cell) => KODE_ALIASES.some((alias) => cell.includes(alias)))) score++;
    if (normalized.some((cell) => NAMA_ALIASES.some((alias) => cell.includes(alias)))) score++;
    if (normalized.some((cell) => BAILOUT_ALIASES.some((alias) => cell.includes(alias)))) score++;
    // periode bersifat opsional, tidak menambah score wajib tapi jadi tie-breaker
    const hasPeriode = normalized.some((cell) => PERIODE_ALIASES.some((alias) => cell.includes(alias)));
    if (hasPeriode) score += 0.5;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
    if (score >= 3) return i;
  }
  if (bestScore >= 1) return bestIdx;
  return -1;
}

// ---------------------------------------------------------------------------
// Bailout value sanitizer
// ---------------------------------------------------------------------------
/**
 * Bersihkan nilai nominal Rupiah: tangani "Rp 1.500.000", "1,500,000", "(500.000)" -> -500000, " - " / kosong -> 0.
 * - Hapus karakter invisible, trim
 * - Deteksi accounting parentheses (500.000) sebagai negatif
 * - Hapus semua non-digit kecuali minus, lalu rekonstruksi tanda
 */
export function cleanBailoutValue(val: unknown): number {
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return 0;
    return Math.trunc(val);
  }
  if (val == null) return 0;
  let str = stripInvisible(String(val)).trim();
  if (str === '' || str === '-' || str === '--') return 0;
  // Normalisasi dash variants (en dash, em dash) ke hyphen
  str = str.replace(/[–—−]/g, '-');
  // Kosong atau hanya dash/spasi setelah invisible cleaning
  if (str.replace(/[\s\-\.]/g, '') === '') return 0;

  const isParenthesesNegative = str.includes('(') && str.includes(')');
  // Hapus semua kecuali digit dan minus (hilangkan Rp, titik ribuan, koma desimal, spasi, dll)
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

// ---------------------------------------------------------------------------
// Periode / tanggal sanitizer -> ISO YYYY-MM-DD tanpa Invalid Date
// ---------------------------------------------------------------------------
function isValidCalendarDate(y: number, m: number, d: number): boolean {
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return false;
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

/**
 * Sanitasi periode/tanggal dari Excel/copas ke ISO YYYY-MM-DD.
 * Mendukung: YYYYMMDD (20260914), YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD, DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY.
 * Mengembalikan null jika tidak valid (tidak pernah mengembalikan "Invalid Date").
 * Menangani karakter invisible (\u00A0, \uFEFF, \u200B, \r) sebelum parsing.
 */
export function normalizePeriodeToISO(value: unknown): string | null {
  if (value == null) return null;
  // Jika value adalah number (Excel serial atau YYYYMMDD numeric), ubah ke string
  let raw: string;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null;
    // Jika number terlihat seperti YYYYMMDD (8 digit, 19000101 - 21001231) perlakukan sebagai YYYYMMDD
    const asStr = String(Math.trunc(value));
    if (/^\d{8}$/.test(asStr)) raw = asStr;
    else {
      // Coba anggap sebagai Excel serial date (days since 1899-12-30) jika dalam range wajar 30000-60000 (~1982-2064)
      if (value > 30000 && value < 60000) {
        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
        const ms = excelEpoch.getTime() + Math.trunc(value) * 86400000;
        const d = new Date(ms);
        if (!isNaN(d.getTime())) {
          const y = d.getUTCFullYear();
          const m = d.getUTCMonth() + 1;
          const day = d.getUTCDate();
          if (isValidCalendarDate(y, m, day)) {
            return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          }
        }
      }
      raw = asStr;
    }
  } else {
    raw = String(value);
  }

  let str = stripInvisible(raw).trim();
  // collapse internal whitespace
  str = str.replace(/\s+/g, ' ').trim();
  if (str === '' || str === '-' || str.toUpperCase() === 'NULL' || str.toUpperCase() === 'N/A') return null;

  // 1) YYYYMMDD (8 digit contiguous)
  if (/^\d{8}$/.test(str)) {
    const y = Number(str.slice(0, 4));
    const m = Number(str.slice(4, 6));
    const d = Number(str.slice(6, 8));
    if (isValidCalendarDate(y, m, d)) return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return null;
  }

  // 2) YYYY-MM-DD / YYYY/MM/DD / YYYY.MM.DD
  const ymdMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (ymdMatch) {
    const y = Number(ymdMatch[1]);
    const m = Number(ymdMatch[2]);
    const d = Number(ymdMatch[3]);
    if (isValidCalendarDate(y, m, d)) return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return null;
  }

  // 3) DD/MM/YYYY atau DD-MM-YYYY atau DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmyMatch) {
    const d = Number(dmyMatch[1]);
    const m = Number(dmyMatch[2]);
    const y = Number(dmyMatch[3]);
    if (isValidCalendarDate(y, m, d)) return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return null;
  }

  // 4) Fallback: coba parsing Date native tapi validasi agar tidak menghasilkan Invalid Date string
  // Hanya izinkan jika hasilnya valid dan tidak NaN, lalu konversi ke ISO bagian tanggal
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    // Gunakan UTC date part untuk konsistensi dengan YYYY-MM-DD input
    // Jika string mengandung 'T', pakai ISO slice; jika tidak, tetap aman via toISOString
    return d.toISOString().slice(0, 10);
  }

  return null;
}

/**
 * Wrapper yang selalu mengembalikan ISO string valid (fallback ke hari ini jika null).
 * Dipakai di API route untuk field periode yang wajib terisi.
 */
export function sanitizePeriodeOrToday(value: unknown): string {
  const iso = normalizePeriodeToISO(value);
  if (iso) return iso;
  return new Date().toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// AOA parser
// ---------------------------------------------------------------------------
/**
 * Parse baris Bailout dari array 2D (AOA) dengan header dinamis.
 * Mendukung header di baris ke-2 atau baris manapun dalam 10 baris pertama.
 * Membersihkan invisible (\r, \t, \n, \u00A0, zero-width) di header & cell.
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
    if (row.every((c) => stripInvisible(String(c ?? '')).trim() === '')) continue;

    const rawKode = kodeIdx !== -1 ? String(row[kodeIdx] ?? '') : '';
    const kode = normalizeKodeLoket(rawKode);
    const nama = namaIdx !== -1 ? normalizeNama(row[namaIdx] ?? '') : '';
    const rawBailout: unknown = bailoutIdx !== -1 ? (row[bailoutIdx] ?? '') : '';

    if (!nama && !kode) continue;
    const upperNama = nama.toUpperCase();
    const upperKode = kode.toUpperCase();
    if (upperNama === 'TOTAL' || upperKode === 'TOTAL') continue;
    if (upperNama.includes('JUMLAH') || upperNama.includes('GRAND TOTAL')) continue;

    const bailoutNum = cleanBailoutValue(rawBailout);

    // Deduplikasi: kode yang sama -> last wins
    const key = kode || `__row_${i}`;
    const existing = dedup.get(key);
    if (existing) {
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

// ---------------------------------------------------------------------------
// Paste parser (core bugfix)
// ---------------------------------------------------------------------------
/**
 * Helper untuk paste input (tab-separated). Mendukung header dinamis.
 * BUGFIX: tidak lagi menghapus \t sebelum split; sanitasi invisible dilakukan
 * setelah mempertahankan delimiter. Dynamic Header Mapping via findColumnIndices.
 */
export function parseBailoutFromPaste(text: string): BailoutRow[] {
  if (!text || stripInvisible(text).trim() === '') return [];

  // Normalisasi line endings ke \n, ganti NBSP, hapus zero-width, tapi PERTAHANKAN \t sebagai delimiter
  const sanitized = stripInvisible(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = sanitized.split('\n');
  const lines = rawLines.map((l) => l.trim()).filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  // Ubah setiap line menjadi array kolom (split tab, fallback ke comma jika tidak ada tab)
  const rows: string[][] = lines.map((line) => {
    if (line.includes('\t')) {
      return line.split('\t').map((c) => stripInvisible(c).trim());
    }
    if (line.includes(',')) {
      return line.split(',').map((c) => stripInvisible(c).trim());
    }
    // fallback: split by 2+ spaces (untuk copas dari PDF / monospace)
    return line.split(/\s{2,}/).map((c) => stripInvisible(c).trim());
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

    const rawKode = kodeIdx !== -1 ? (cols[kodeIdx] ?? '') : '';
    const kode = normalizeKodeLoket(rawKode);
    const nama = namaIdx !== -1 ? normalizeNama(cols[namaIdx] ?? '') : '';
    const raw = bailoutIdx !== -1 ? (cols[bailoutIdx] ?? '') : '';

    if (!nama && !kode) continue;
    if (nama.toUpperCase() === 'TOTAL' || kode.toUpperCase() === 'TOTAL') continue;
    if (!nama) continue;
    if (nama.toUpperCase().includes('JUMLAH') || nama.toUpperCase().includes('GRAND TOTAL')) continue;

    const bailoutNum = cleanBailoutValue(raw);
    const key = kode || `__row_${i}`;
    const existing = dedupPaste.get(key);
    if (existing) {
      dedupPaste.set(key, {
        KODE: kode,
        NAMA: nama || String(existing['NAMA'] ?? ''),
        BAILOUT: bailoutNum,
      });
    } else {
      dedupPaste.set(key, { KODE: kode, NAMA: nama, BAILOUT: bailoutNum });
    }
  }
  return Array.from(dedupPaste.values()).filter(
    (row) => row.NAMA && String(row.NAMA).trim() !== '' && String(row.NAMA).toUpperCase() !== 'TOTAL'
  );
}
