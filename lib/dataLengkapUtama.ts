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
/** Helper: bersihkan karakter invisible (Tab, Newline, NBSP) sebelum sanitasi */
function cleanInvisibleChars(value: string): string {
  return value.replace(/[\u00A0]/g, ' ').replace(/[\t\r\n]/g, '');
}

/** Normalisasi ketat ppid / Kode Loket sesuai spec: trim + hapus \t\r\n + hapus spasi liar + UPPER, "-" / "0" / "NULL" => "" */
function normalizeKodeLoketValue(value: string): string {
  let s = String(value ?? '').replace(/[\u00A0]/g, ' ');
  s = s.trim().replace(/[\t\r\n]/g, '').replace(/\s+/g, '').toUpperCase();
  if (s === '-' || s === '0' || s === 'NULL' || s === '') return '';
  return s;
}

/** Daftar kolom yang berpotensi berisi tanggal — perlu konversi ke ISO agar PG tidak reject */
const DATE_FIELD_KEYS = new Set<string>([
  'syarat',
  'pengajuan_survey_ke_pos',
  'pengajuan_pos',
  'pendaftaran_kurlog',
  'kelengkapan_perangkat',
  'aktivasi_kurlog',
  'aktivasi_sicepat',
  'training',
  'transaksi',
  'waktu',
]);

const INDONESIAN_MONTHS: Record<string, string> = {
  JANUARI: '01',
  FEBRUARI: '02',
  MARET: '03',
  APRIL: '04',
  MEI: '05',
  JUNI: '06',
  JULI: '07',
  AGUSTUS: '08',
  SEPTEMBER: '09',
  OKTOBER: '10',
  NOVEMBER: '11',
  DESEMBER: '12',
};

/**
 * Konversi format tanggal Indonesia ke ISO YYYY-MM-DD.
 * Support: "19 DESEMBER 2022", "19 Desember 2022", "19-12-2022", "19/12/2022", "2022-12-19".
 * Return null jika kosong/invalid agar PostgreSQL tidak reject.
 */
function parseIndonesianDateToISO(value: string): string | null {
  const raw = cleanInvisibleChars(value).trim();
  if (!raw || raw === '-' || raw.toUpperCase() === 'NULL' || raw === '0') return null;

  // Sudah ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : raw;
  }

  // DD-MM-YYYY atau DD/MM/YYYY atau DD.MM.YYYY
  const dmY = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (dmY) {
    const dd = dmY[1].padStart(2, '0');
    const mm = dmY[2].padStart(2, '0');
    const yyyy = dmY[3];
    const iso = `${yyyy}-${mm}-${dd}`;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : iso;
  }

  // "19 DESEMBER 2022" atau "19 Desember 2022"
  const parts = raw.replace(/\s+/g, ' ').trim().split(' ');
  if (parts.length === 3) {
    const dd = parts[0].replace(/\D/g, '').padStart(2, '0');
    const monthName = parts[1].toUpperCase().replace(/[^A-Z]/g, '');
    const yyyy = parts[2].replace(/\D/g, '');
    const mm = INDONESIAN_MONTHS[monthName];
    if (dd && mm && yyyy && yyyy.length === 4) {
      const iso = `${yyyy}-${mm}-${dd}`;
      const d = new Date(iso);
      return isNaN(d.getTime()) ? null : iso;
    }
  }

  // Coba Date parse fallback, tapi hanya jika menghasilkan ISO valid
  const fallback = new Date(raw);
  if (!isNaN(fallback.getTime())) {
    // Pastikan format bukan "Invalid" dan raw mengandung angka tahun
    if (/\d{4}/.test(raw)) {
      return fallback.toISOString().slice(0, 10);
    }
  }

  return null;
}

export function sanitizeDataLengkapUtamaValues(values: Record<string, unknown>): DataLengkapUtamaInsert {
  const result: DataLengkapUtamaInsert = {};
  for (const col of DATA_LENGKAP_UTAMA_COLUMNS) {
    if (col.key === 'no') continue;
    const raw = values[col.key];
    let str = raw === null || raw === undefined ? '' : String(raw);
    // Bersihkan karakter invisible untuk semua kolom copas
    str = cleanInvisibleChars(str).trim();
    // Sanitasi konsisten untuk field unik
    if (col.key === 'ppid') {
      str = str ? normalizeKodeLoketValue(str) : '';
      // normalizeKodeLoketValue sudah handle "-" / "0" / "NULL" => ""
    } else if (DATE_FIELD_KEYS.has(col.key)) {
      // Perketat parser tanggal: konversi ke ISO atau null jika invalid
      if (!str || str === '-' || str.toUpperCase() === 'NULL' || str === '0') {
        str = '';
      } else {
        // Hanya konversi jika tampak seperti tanggal
        const looksLikeDate =
          /^\d{4}-\d{2}-\d{2}$/.test(str) ||
          /^\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4}$/.test(str) ||
          Object.keys(INDONESIAN_MONTHS).some((m) => str.toUpperCase().includes(m));
        if (looksLikeDate) {
          const iso = parseIndonesianDateToISO(str);
          str = iso ?? '';
        } else {
          // Bukan format tanggal (misal "X", "OK"), biarkan apa adanya tapi collapse spasi
          str = str.replace(/\s+/g, ' ');
        }
      }
    } else if (str) {
      // Untuk field lain tetap trim + collapse spasi ganda + hilangkan NBSP
      str = str.replace(/\s+/g, ' ');
      if (str === '-' || str.toUpperCase() === 'NULL') str = '';
    }
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
  // Bersihkan karakter invisible sebelum split
  const cleanedText = text.replace(/[\u00A0]/g, ' ');
  const rows = cleanedText
    .split('\n')
    .map((line) => line.replace(/\r/g, '').split('\t').map((c) => cleanInvisibleChars(c).trim()))
    .filter((cells) => cells.some((c) => c !== ''));

  if (rows.length === 0) throw new Error('Tidak ada baris data yang ditemukan');

  const hasHeader = rows.some((r) => r.some((c) => normalizeHeader(c) === 'PPID'));
  if (hasHeader) return parseDataLengkapUtamaRows(rows);

  return rows.map((cells) => {
    const obj: Record<string, string> = {};
    for (const col of DATA_LENGKAP_UTAMA_DATA_COLUMNS) obj[col.key] = '';
    DATA_LENGKAP_UTAMA_DATA_COLUMNS.forEach((col, i) => {
      if (i < cells.length) obj[col.key] = cleanInvisibleChars(cells[i]).trim();
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
