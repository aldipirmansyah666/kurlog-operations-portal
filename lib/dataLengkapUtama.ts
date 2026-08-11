import type { DataLengkapUtamaItem, DataLengkapUtamaValues } from './types';

export interface DataLengkapUtamaColumn {
  key: keyof DataLengkapUtamaItem;
  label: string;
  group: string;
  aliases?: string[];
}

// Struktur kolom mengikuti sheet "Agen CUM" pada file Excel master.
// Header sheet tersebut bertingkat 2 baris (baris 1 = group, baris 2 = kolom),
// pembacaan data dimulai dari baris 3 (row index 2).
// SELURUH kolom bersifat OPSIONAL / NULLABLE kecuali `id` (primary key).
// Group: STATUS, KURLOG, ALAMAT LENGKAP dipakai untuk header tabel 2 lapis.
export const DATA_LENGKAP_UTAMA_COLUMNS: DataLengkapUtamaColumn[] = [
  // NO (diisi otomatis oleh klien)
  { key: 'no', label: 'NO', group: '' },
  // A. Kelompok Status & Workflow
  { key: 'syarat', label: 'SYARAT', group: 'STATUS' },
  { key: 'pengajuan_survey_ke_pos', label: 'PENGAJUAN SURVEY KE POS', group: 'STATUS' },
  { key: 'pengajuan_pos', label: 'PENGAJUAN POS', group: 'STATUS' },
  { key: 'pendaftaran_kurlog', label: 'PENDAFTARAN KURLOG', group: 'STATUS' },
  { key: 'kelengkapan_perangkat', label: 'KELENGKAPAN PERANGKAT', group: 'STATUS' },
  { key: 'aktivasi_kurlog', label: 'AKTIVASI KURLOG', group: 'STATUS' },
  { key: 'aktivasi_sicepat', label: 'AKTIVASI SICEPAT', group: 'STATUS' },
  { key: 'training', label: 'TRAINING', group: 'STATUS' },
  { key: 'transaksi', label: 'TRANSAKSI', group: 'STATUS' },
  { key: 'catatan', label: 'CATATAN', group: 'STATUS' },
  { key: 'waktu', label: 'waktu', group: 'STATUS' },
  // B. Kelompok KURLOG
  { key: 'pos_ppob', label: 'POS + PPOB', group: 'KURLOG' },
  { key: 'pos_only', label: 'POS ONLY', group: 'KURLOG' },
  { key: 'sicepat', label: 'SICEPAT', group: 'KURLOG' },
  // C. Identitas Loket & Pemilik
  { key: 'ppid', label: 'PPID', group: '' },
  { key: 'nama_loket_onpays', label: 'NAMA LOKET DI ONPAYS', group: '' },
  { key: 'nama_loket_kurlog', label: 'NAMA LOKET DI KURLOG', group: '' },
  { key: 'nama_pemilik', label: 'NAMA PEMILIK', group: '' },
  // D. Kelompok Alamat
  { key: 'alamat_pemilik_ktp', label: 'ALAMAT PEMILIK KTP', group: 'ALAMAT LENGKAP', aliases: ['ALAMAT PEMIILIK KTP'] },
  { key: 'alamat_lengkap_loket', label: 'ALAMAT LENGKAP LOKET', group: 'ALAMAT LENGKAP' },
  { key: 'rt_rw', label: 'RT/RW', group: 'ALAMAT LENGKAP' },
  { key: 'kel_desa', label: 'KEL/DESA', group: 'ALAMAT LENGKAP' },
  { key: 'kec', label: 'KEC', group: 'ALAMAT LENGKAP' },
  { key: 'kab_kota', label: 'KAB/KOTA', group: 'ALAMAT LENGKAP', aliases: ['KAB/KOT'] },{ key: 'propinsi', label: 'PROPINSI', group: 'ALAMAT LENGKAP' },
  { key: 'kode_pos', label: 'KODE POS', group: 'ALAMAT LENGKAP' },
  // E. Legalitas & Kontak
  { key: 'no_ktp', label: 'NO KTP', group: '' },
  { key: 'no_npwp', label: 'NO NPWP', group: '' },
  { key: 'electric_area', label: 'ELECTRIC AREA', group: '' },
  { key: 'rekomendasi', label: 'REKOMENDASI', group: '' },
  { key: 'no_hp_pemilik', label: 'NO HP PEMILIK', group: '' },
  { key: 'no_hp_loket', label: 'NO.HP LOKET', group: '' },
  { key: 'email', label: 'EMAIL', group: '' },
  // F. Akun System & Area
  { key: 'no_dirian', label: 'NO DIRIAN', group: '' },
  { key: 'location_id', label: 'LOCATION ID', group: '' },
  { key: 'user_mile', label: 'USER MILE', group: '' },
  { key: 'password_mile', label: 'PASSWORD MILE', group: '' },
  { key: 'regional', label: 'REGIONAL', group: '' },
  { key: 'kcu_kc', label: 'KCU/KC', group: '' },
  { key: 'nib', label: 'NIB (NO INDUK BERUSAHA)', group: '', aliases: ['NIB ( NO INDUK BERUSAHA)', 'NIB'] },
  { key: 'no_kbli', label: 'NO KBLI', group: '' },
  // G. Perbankan & Koordinat
  { key: 'nomor_rekening', label: 'NOMOR REKENING', group: '' },
  { key: 'nama_bank', label: 'NAMA BANK', group: '' },
  { key: 'nama_pemilik_rekening', label: 'NAMA PEMILIK REKENING', group: '', aliases: ['NAMA PEMILIK'] },
  { key: 'latitude', label: 'LATITUDE', group: '' },
  { key: 'longitude', label: 'LONGITUDE', group: '' },
];

export interface DataLengkapUtamaGroup {
  label: string;
  columns: DataLengkapUtamaColumn[];
}

export function buildDataLengkapUtamaGroups(columns: DataLengkapUtamaColumn[] = DATA_LENGKAP_UTAMA_COLUMNS): DataLengkapUtamaGroup[] {
  const groups: DataLengkapUtamaGroup[] = [];
  for (const col of columns) {
    const last = groups[groups.length - 1];
    if (last && last.label === col.group) {
      last.columns.push(col);
    } else {
      groups.push({ label: col.group, columns: [col] });
    }
  }
  return groups;
}

export function normalizeHeader(value: unknown): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim().toUpperCase();
}

// Set kolom data (semua kecuali `no`) — dipakai sebagai "DTO" import/paste.
const DATA_LENGKAP_UTAMA_DATA_COLUMNS = DATA_LENGKAP_UTAMA_COLUMNS.filter((col) => col.key !== 'no');

export type DataLengkapUtamaInsert = Partial<Record<keyof DataLengkapUtamaValues, string | null>>;

/**
 * Sanitasi / validasi "DTO" untuk nilai sebelum disimpan ke database.
 * Semua kolom bersifat opsional: nilai kosong diubah menjadi `null`,
 * dan key yang tidak dikenal dibuang. Tidak ada validation error untuk sel kosong.
 */
export function sanitizeDataLengkapUtamaValues(values: Record<string, unknown>): DataLengkapUtamaInsert {
  const result: DataLengkapUtamaInsert = {};
  for (const col of DATA_LENGKAP_UTAMA_COLUMNS) {
    if (col.key === 'no') continue;
    const raw = values[col.key];
    const str = raw === null || raw === undefined ? '' : String(raw).trim();
    result[col.key as keyof DataLengkapUtamaValues] = str === '' ? null : str;
  }
  return result;
}

function buildHeaderCandidates(col: DataLengkapUtamaColumn): string[] {
  const candidates: string[] = [];
  if (col.group) candidates.push(`${normalizeHeader(col.group)} ${normalizeHeader(col.label)}`);
  candidates.push(normalizeHeader(col.label));
  for (const alias of col.aliases ?? []) candidates.push(normalizeHeader(alias));
  return candidates;
}

/**
 * Parser Excel dengan header bertingkat 2 baris (sheet "Agen CUM"):
 * - Baris header ditemukan dari baris yang mengandung PPID + "NAMA LOKET".
 * - Baris sebelumnya (jika ada) diperlakukan sebagai baris group.
 * - Pencocokan kolom memakai GABUNGAN header baris 1 + baris 2 agar tidak tertukar,
 *   dengan fallback ke header baris 2 saja dan alias.
 * - Header kolom yang duplikat (mis. "NAMA PEMILIK") dipetakan berurutan sesuai urutan konfigurasi.
 * - Data dimulai dari baris setelah header. Sel kosong dibiarkan kosong (nullable, tanpa error).
 */
export function parseDataLengkapUtamaRows(rows: unknown[][]): DataLengkapUtamaValues[] {
  if (rows.length < 3) throw new Error('File Excel kosong atau tidak valid (minimal 2 baris header + 1 baris data)');

  const headerIdx = rows.findIndex(
    (row) =>
      row.some((c) => normalizeHeader(c) === 'PPID') &&
      row.some((c) => normalizeHeader(c).startsWith('NAMA LOKET'))
  );

  if (headerIdx < 0) {
    throw new Error('Header tidak ditemukan (cari baris yang berisi PPID)');
  }

  const groupRow = headerIdx > 0 ? rows[headerIdx - 1] : [];
  const subRow = rows[headerIdx];
  const colCount = subRow.length;

  const colIndex: Partial<Record<keyof DataLengkapUtamaValues, number>> = {};
  const used = new Set<number>();

  for (const col of DATA_LENGKAP_UTAMA_COLUMNS) {
    if (col.key === 'no') continue;
    const candidates = buildHeaderCandidates(col);
    let matched = -1;
    for (let i = 0; i < colCount; i++) {
      if (used.has(i)) continue;
      const plain = normalizeHeader(subRow[i]);
      const group = normalizeHeader(groupRow[i]);
      const combined = group ? `${group} ${plain}` : plain;
      if (candidates.includes(combined) || candidates.includes(plain)) {
        matched = i;
        break;
      }
    }
    if (matched >= 0) {
      colIndex[col.key as keyof DataLengkapUtamaValues] = matched;
      used.add(matched);
    }
  }

  const imported: DataLengkapUtamaValues[] = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    const cells = row.map((c) => (c === undefined || c === null ? '' : String(c).trim()));
    if (cells.every((c) => c === '')) continue;

    const obj: Record<string, string> = {};
    for (const col of DATA_LENGKAP_UTAMA_COLUMNS) {
      if (col.key === 'no') continue;
      const idx = colIndex[col.key as keyof DataLengkapUtamaValues];
      obj[col.key] = idx !== undefined && idx < cells.length ? cells[idx] : '';
    }
    imported.push(obj as unknown as DataLengkapUtamaValues);
  }

  return imported;
}

export function parseDataLengkapUtamaPaste(text: string): DataLengkapUtamaValues[] {
  const rows = text
    .split('\n')
    .map((line) => line.split('\t').map((c) => c.trim()))
    .filter((cells) => cells.some((c) => c !== ''));

  if (rows.length === 0) throw new Error('Tidak ada baris data yang ditemukan');

  const hasHeader = rows.some((r) => r.some((c) => normalizeHeader(c) === 'PPID'));
  if (hasHeader) return parseDataLengkapUtamaRows(rows);

  return rows.map((cells) => {
    const obj: Record<string, string> = {};
    for (const col of DATA_LENGKAP_UTAMA_DATA_COLUMNS) obj[col.key] = '';
    DATA_LENGKAP_UTAMA_DATA_COLUMNS.forEach((col, i) => {
      if (i < cells.length) obj[col.key] = cells[i];
    });
    return obj as unknown as DataLengkapUtamaValues;
  });
}

export function emptyDataLengkapUtamaValues(): DataLengkapUtamaValues {
  const obj: Record<string, string> = {};
  for (const col of DATA_LENGKAP_UTAMA_COLUMNS) {
    if (col.key !== 'no') obj[col.key] = '';
  }
  return obj as unknown as DataLengkapUtamaValues;
}
