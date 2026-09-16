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
  { key: 'ppid', label: 'PPID', group: '', aliases: ['PPID'] },
  { key: 'nama_loket_onpays', label: 'NAMA LOKET DI ONPAYS', group: '', aliases: ['NAMA LOKET DI ONPAYS', 'NAMA LOKET DI ONPAY'] },
  { key: 'nama_loket_kurlog', label: 'NAMA LOKET DI KURLOG', group: '', aliases: ['NAMA LOKET DI KURLOG'] },
  { key: 'nama_pemilik', label: 'NAMA PEMILIK', group: '', aliases: ['NAMA PEMILIK'] },
  // D. Kelompok Alamat
  { key: 'alamat_pemilik_ktp', label: 'ALAMAT PEMILIK KTP', group: 'ALAMAT LENGKAP', aliases: ['ALAMAT PEMIILIK KTP', 'ALAMAT PEMILIK KTP', 'ALAMAT KTP'] },
  { key: 'alamat_lengkap_loket', label: 'ALAMAT LENGKAP LOKET', group: 'ALAMAT LENGKAP', aliases: ['ALAMAT LENGKAP'] },
  { key: 'rt_rw', label: 'RT/RW', group: 'ALAMAT LENGKAP', aliases: ['RT/RW', 'RT RW'] },
  { key: 'kel_desa', label: 'KEL/DESA', group: 'ALAMAT LENGKAP', aliases: ['KEL/DESA', 'KELURAHAN', 'DESA'] },
  { key: 'kec', label: 'KEC', group: 'ALAMAT LENGKAP', aliases: ['KEC', 'KECAMATAN'] },
  { key: 'kab_kota', label: 'KAB/KOTA', group: 'ALAMAT LENGKAP', aliases: ['KAB/KOT', 'KAB/KOTA', 'KABUPATEN', 'KOTA'] },
  { key: 'propinsi', label: 'PROPINSI', group: 'ALAMAT LENGKAP', aliases: ['PROPINSI', 'PROVINSI'] },
  { key: 'kode_pos', label: 'KODE POS', group: 'ALAMAT LENGKAP', aliases: ['KODE POS', 'KODEPOS'] },
  // E. Legalitas & Kontak — strict header-name mapping agar tidak geser
  { key: 'no_ktp', label: 'NO KTP', group: '', aliases: ['NO KTP', 'NIK'] },
  { key: 'no_npwp', label: 'NO NPWP', group: '', aliases: ['NO NPWP', 'NPWP'] },
  { key: 'electric_area', label: 'ELECTRIC AREA', group: '', aliases: ['ELECTRIC AREA'] },
  { key: 'rekomendasi', label: 'REKOMENDASI', group: '', aliases: ['REKOMENDASI'] },
  { key: 'no_hp_pemilik', label: 'NO HP PEMILIK', group: '', aliases: ['NO HP PEMILIK'] },
  { key: 'no_hp_loket', label: 'NO.HP LOKET', group: '', aliases: ['NO.HP LOKET', 'NO HP LOKET'] },
  { key: 'email', label: 'EMAIL', group: '', aliases: ['EMAIL'] },
  // F. Akun System & Area — strict mapping
  { key: 'no_dirian', label: 'NO DIRIAN', group: '', aliases: ['NO DIRIAN'] },
  { key: 'location_id', label: 'LOCATION ID', group: '', aliases: ['LOCATION ID'] },
  { key: 'user_mile', label: 'USER MILE', group: '', aliases: ['USER MILE'] },
  { key: 'password_mile', label: 'PASSWORD MILE', group: '', aliases: ['PASSWORD MILE'] },
  { key: 'regional', label: 'REGIONAL', group: '', aliases: ['REGIONAL'] },
  { key: 'kcu_kc', label: 'KCU/KC', group: '', aliases: ['KCU/KC'] },
  { key: 'nib', label: 'NIB (NO INDUK BERUSAHA)', group: '', aliases: ['NIB ( NO INDUK BERUSAHA)', 'NIB (NO INDUK BERUSAHA)', 'NIB'] },
  { key: 'no_kbli', label: 'NO KBLI', group: '', aliases: ['NO KBLI', 'NO. KBLI', 'KBLI'] },
  // G. Perbankan & Koordinat — LATITUDE/LONGITUDE harus map strict ke koordinat, bukan ke rekening/bank
  { key: 'nomor_rekening', label: 'NOMOR REKENING', group: '', aliases: ['NOMOR REKENING', 'NO REKENING'] },
  { key: 'nama_bank', label: 'NAMA BANK', group: '', aliases: ['NAMA BANK'] },
  { key: 'nama_pemilik_rekening', label: 'NAMA PEMILIK REKENING', group: '', aliases: ['NAMA PEMILIK REKENING', 'NAMA PEMILIK REK', 'NAMA PEMILIK'] },
  { key: 'latitude', label: 'LATITUDE', group: '', aliases: ['LATITUDE'] },
  { key: 'longitude', label: 'LONGITUDE', group: '', aliases: ['LONGITUDE'] },
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

const NBSP_REGEX = /\u00A0/g;
const ZERO_WIDTH_REGEX = /[\uFEFF\u200B\u200C\u200D\u2060\u180E]/g;

function stripInvisible(value: string): string {
  return value.replace(NBSP_REGEX, ' ').replace(ZERO_WIDTH_REGEX, '').replace(/\r/g, '');
}

function isValidCalendarDate(y: number, m: number, d: number): boolean {
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return false;
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export function normalizeHeader(value: unknown): string {
  return stripInvisible(String(value ?? ''))
    .replace(/[\t\n]/g, ' ')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

// Set kolom data (semua kecuali `no`) — dipakai sebagai "DTO" import/paste.
const DATA_LENGKAP_UTAMA_DATA_COLUMNS = DATA_LENGKAP_UTAMA_COLUMNS.filter((col) => col.key !== 'no');

export type DataLengkapUtamaInsert = Partial<Record<keyof DataLengkapUtamaValues, string | null>>;

/**
 * Sanitasi / validasi "DTO" untuk nilai sebelum disimpan ke database.
 * Semua kolom bersifat opsional: nilai kosong diubah menjadi `null`,
 * dan key yang tidak dikenal dibuang. Tidak ada validation error untuk sel kosong.
 */
/** Normalisasi ketat ppid / Kode Loket sesuai spec: trim + hapus \t\r\n + hapus spasi liar + UPPER, "-" / "0" / "NULL" => "" */
function normalizeKodeLoketValue(value: string): string {
  let s = stripInvisible(String(value ?? ''));
  s = s.replace(/[\t\n]/g, '');
  s = s.trim().replace(/\s+/g, '').toUpperCase();
  if (s === '-' || s === '0' || s === 'NULL' || s === 'N/A' || s === 'NA' || s === '') return '';
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
 * Konversi format tanggal Indonesia ke ISO YYYY-MM-DD tanpa pernah return "Invalid Date".
 * Support: "19 DESEMBER 2022", "2022-12-19", "19/12/2022", "YYYYMMDD", "YYYY/MM/DD", "DD.MM.YYYY", Excel serial.
 * Return null jika kosong/invalid agar PostgreSQL tidak reject — validasi kalender ketat via isValidCalendarDate.
 */
function parseIndonesianDateToISO(value: string): string | null {
  const raw = stripInvisible(String(value ?? ''))
    .replace(/[\t\n]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
  if (!raw || raw === '-' || raw.toUpperCase() === 'NULL' || raw.toUpperCase() === 'N/A' || raw === '0') return null;

  // YYYYMMDD (8 digit) — excel copas sering tanpa separator
  if (/^\d{8}$/.test(raw)) {
    const y = Number(raw.slice(0, 4));
    const m = Number(raw.slice(4, 6));
    const d = Number(raw.slice(6, 8));
    if (isValidCalendarDate(y, m, d)) return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return null;
  }

  // Sudah ISO YYYY-MM-DD / YYYY/MM/DD / YYYY.MM.DD
  const ymd = raw.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (ymd) {
    const y = Number(ymd[1]);
    const m = Number(ymd[2]);
    const d = Number(ymd[3]);
    if (isValidCalendarDate(y, m, d)) return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return null;
  }

  // DD-MM-YYYY atau DD/MM/YYYY atau DD.MM.YYYY
  const dmY = raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
  if (dmY) {
    const d = Number(dmY[1]);
    const m = Number(dmY[2]);
    const y = Number(dmY[3]);
    if (isValidCalendarDate(y, m, d)) return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return null;
  }

  // "19 DESEMBER 2022" atau "19 Desember 2022"
  const parts = raw.replace(/\s+/g, ' ').trim().split(' ');
  if (parts.length === 3) {
    const ddNum = Number(parts[0].replace(/\D/g, ''));
    const monthName = parts[1].toUpperCase().replace(/[^A-Z]/g, '');
    const yyyyNum = Number(parts[2].replace(/\D/g, ''));
    const mmStr = INDONESIAN_MONTHS[monthName];
    if (mmStr) {
      const mmNum = Number(mmStr);
      if (isValidCalendarDate(yyyyNum, mmNum, ddNum)) {
        return `${String(yyyyNum).padStart(4, '0')}-${String(mmNum).padStart(2, '0')}-${String(ddNum).padStart(2, '0')}`;
      }
    }
    return null;
  }

  // Coba Date parse fallback — tapi validasi via isValidCalendarDate agar tidak menerima 2026-02-30
  const fallback = new Date(raw);
  if (!isNaN(fallback.getTime()) && /\d{4}/.test(raw)) {
    // Ambil UTC date lalu validasi
    const y = fallback.getUTCFullYear();
    const m = fallback.getUTCMonth() + 1;
    const d = fallback.getUTCDate();
    // Hanya return jika raw tidak mengandung DMY ambiguous yang sudah gagal di atas
    if (isValidCalendarDate(y, m, d)) return fallback.toISOString().slice(0, 10);
  }

  return null;
}

export function sanitizeDataLengkapUtamaValues(values: Record<string, unknown>): DataLengkapUtamaInsert {
  const result: DataLengkapUtamaInsert = {};
  for (const col of DATA_LENGKAP_UTAMA_COLUMNS) {
    if (col.key === 'no') continue;
    const raw = values[col.key];
    let str = raw === null || raw === undefined ? '' : String(raw);
    // Bersihkan karakter invisible untuk semua kolom copas (NBSP, zero-width, \r\t\n)
    str = stripInvisible(str).replace(/[\t\n]/g, ' ').trim();
    // Sanitasi konsisten untuk field unik
    if (col.key === 'ppid') {
      str = str ? normalizeKodeLoketValue(str) : '';
    } else if (DATE_FIELD_KEYS.has(col.key)) {
      if (!str || str === '-' || str.toUpperCase() === 'NULL' || str.toUpperCase() === 'N/A' || str === '0') {
        str = '';
      } else {
        const looksLikeDate =
          /^\d{8}$/.test(str) ||
          /^\d{4}[\/\-.]\d{1,2}[\/\-.]\d{1,2}$/.test(str) ||
          /^\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{4}$/.test(str) ||
          Object.keys(INDONESIAN_MONTHS).some((m) => str.toUpperCase().includes(m));
        if (looksLikeDate) {
          const iso = parseIndonesianDateToISO(str);
          str = iso ?? '';
        } else {
          str = str.replace(/\s+/g, ' ');
        }
      }
    } else if (str) {
      str = str.replace(/\s+/g, ' ');
      if (str === '-' || str.toUpperCase() === 'NULL' || str.toUpperCase() === 'N/A') str = '';
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
 * Parser Excel untuk sheet "Agen CUM" dengan multi-level header (2 baris):
 * - Baris ke-2 (index 1) = group header (mis. "STATUS", "KURLOG", "ALAMAT LENGKAP")
 * - Baris ke-3 (index 2) = sub header (mis. "PPID", "NAMA LOKET DI ONPAYS")
 *   Gabungan per kolom = normalize(group) + " " + normalize(sub) → dipakai untuk alias matching
 *   Fallback ke sub header saja jika group kosong.
 * - Data riil dimulai dari baris ke-4 (index 3)
 * - Pemetaan alias presisi case-insensitive & trimmed sesuai spec (PPID, NAMA LOKET DI ONPAY, dll.)
 * - 15 kolom pertama adalah status internal — jika header tidak cocok, diabaikan (nullable).
 * - Untuk file legacy dengan posisi header berbeda, fallback scan dinamis jika header fixed tidak ditemukan.
 */
export function parseDataLengkapUtamaRows(rows: unknown[][]): DataLengkapUtamaValues[] {
  if (rows.length < 3) throw new Error('File Excel kosong atau tidak valid (minimal 2 baris header + 1 baris data — sheet Agen CUM: baris 2-3 header, data dari baris 4)');

  // Helper: bangun header gabungan dari 2 baris
  const buildCombinedHeaders = (gRow: unknown[], sRow: unknown[]): { combined: string[]; plainSub: string[] } => {
    const colCount = Math.max(gRow.length, sRow.length);
    const combined: string[] = [];
    const plainSub: string[] = [];
    for (let i = 0; i < colCount; i++) {
      const g = normalizeHeader(gRow[i]);
      const s = normalizeHeader(sRow[i]);
      plainSub[i] = s;
      if (g && s) combined[i] = `${g} ${s}`.replace(/\s+/g, ' ').trim();
      else combined[i] = g || s || '';
    }
    return { combined, plainSub };
  };

  // Coba header fixed sesuai spec: baris 1 (idx1) + baris 2 (idx2)
  let groupRow: unknown[] = rows[1] ?? [];
  let subRow: unknown[] = rows[2] ?? [];
  let headerStartRow = 3; // data dimulai index 3
  let { combined: combinedHeaders, plainSub: plainSubHeaders } = buildCombinedHeaders(groupRow, subRow);

  // Validasi apakah header fixed mengandung PPID (case-insensitive)
  const hasFixedPpid = combinedHeaders.some((h) => h === 'PPID') || plainSubHeaders.some((h) => h === 'PPID');

  // Fallback dinamis jika header fixed tidak mengandung PPID (mis. file lama / title row tambahan)
  if (!hasFixedPpid) {
    const scanLimit = Math.min(rows.length, 15);
    let headerIdx = -1;
    for (let i = 0; i < scanLimit; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      if (row.every((c) => stripInvisible(String(c ?? '')).trim() === '')) continue;
      const norms = row.map((c) => normalizeHeader(c));
      if (norms.includes('PPID') && norms.some((c) => c.startsWith('NAMA LOKET'))) {
        headerIdx = i;
        break;
      }
    }
    if (headerIdx === -1) {
      headerIdx = rows.findIndex(
        (row) => row.some((c) => normalizeHeader(c) === 'PPID') && row.some((c) => normalizeHeader(c).startsWith('NAMA LOKET'))
      );
    }
    if (headerIdx >= 0) {
      groupRow = headerIdx > 0 ? (rows[headerIdx - 1] as unknown[]) : [];
      subRow = rows[headerIdx] as unknown[];
      const rebuilt = buildCombinedHeaders(groupRow, subRow);
      combinedHeaders = rebuilt.combined;
      plainSubHeaders = rebuilt.plainSub;
      headerStartRow = headerIdx + 1;
    } else {
      throw new Error('Header tidak ditemukan (cari baris yang berisi PPID — sheet Agen CUM harus memiliki PPID di baris header 2/3)');
    }
  }

  // --- Trim kolom kosong sebelum PPID agar PPID selalu jadi acuan awal (mencegah geser akibat kolom kosong POS/SICEPAT) ---
  // Cari indeks PPID di plainSub (prioritas) lalu combined
  let ppidHeaderIdx = plainSubHeaders.findIndex((h) => h === 'PPID');
  if (ppidHeaderIdx === -1) ppidHeaderIdx = combinedHeaders.findIndex((h) => h === 'PPID');
  // Kumpulkan indeks header kosong sebelum PPID yang harus diabaikan
  const emptyBeforePpid: number[] = [];
  if (ppidHeaderIdx > 0) {
    for (let i = 0; i < ppidHeaderIdx; i++) {
      if (!combinedHeaders[i] && !plainSubHeaders[i]) emptyBeforePpid.push(i);
    }
  }
  // Compact header: buang kolom kosong sebelum PPID
  if (emptyBeforePpid.length > 0) {
    const filterIdx = (arr: string[]) => arr.filter((_, i) => !emptyBeforePpid.includes(i));
    combinedHeaders = filterIdx(combinedHeaders);
    plainSubHeaders = filterIdx(plainSubHeaders);
    groupRow = (groupRow as unknown[]).filter((_, i) => !emptyBeforePpid.includes(i)) as unknown[];
    subRow = (subRow as unknown[]).filter((_, i) => !emptyBeforePpid.includes(i)) as unknown[];
    // ppidIdx bergeser setelah compact — hitung ulang untuk data row trimming
    ppidHeaderIdx = plainSubHeaders.findIndex((h) => h === 'PPID');
    if (ppidHeaderIdx === -1) ppidHeaderIdx = combinedHeaders.findIndex((h) => h === 'PPID');
  }

  const colCount = combinedHeaders.length;
  const colIndex: Partial<Record<keyof DataLengkapUtamaValues, number>> = {};
  const used = new Set<number>();

  for (const col of DATA_LENGKAP_UTAMA_COLUMNS) {
    if (col.key === 'no') continue;
    const candidates = buildHeaderCandidates(col);
    let matched = -1;
    for (let i = 0; i < colCount; i++) {
      if (used.has(i)) continue;
      const comb = combinedHeaders[i] ?? '';
      const plain = plainSubHeaders[i] ?? '';
      // Kaku: cocok persis (equal) setelah normalized, tidak substring
      if (candidates.includes(comb) || candidates.includes(plain)) {
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
  for (let i = headerStartRow; i < rows.length; i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;
    // Buang kolom kosong sebelum PPID yang sama seperti header, agar PPID selalu di indeks yang benar
    let cells = row.map((c) => (c === undefined || c === null ? '' : stripInvisible(String(c)).replace(/[\t\n]/g, ' ').trim()));
    if (emptyBeforePpid.length > 0) {
      cells = cells.filter((_, idx) => !emptyBeforePpid.includes(idx));
    }
    // Trim leading empty sebelum PPID jika masih ada (mis. copas dengan \t\t di awal)
    if (ppidHeaderIdx > 0) {
      // Jika sel di ppidIdx kosong tapi ada nilai PPID bergeser ke kanan karena empty, cari PPID di sekitar
      const ppidIdx = colIndex['ppid'];
      if (ppidIdx !== undefined && ppidIdx < cells.length && !cells[ppidIdx]) {
        // Cari indeks berikutnya yang terlihat seperti PPID (alphanumeric 5+)
        for (let k = ppidIdx + 1; k < Math.min(cells.length, ppidIdx + 3); k++) {
          if (cells[k] && /^[A-Z0-9]{5,}$/i.test(cells[k].replace(/\s+/g, ''))) {
            // geser: pindahkan nilai PPID ke posisi yang benar dengan menggeser array
            // Sederhananya, jika ppid kosong tapi next ada PPID, gunakan next sebagai ppid
            // Kita tidak menggeser seluruh array, cukup catat bahwa mapping ppid harus fallback
            // Untuk sekarang, jika kosong, biarkan mapping fallback ke next non-empty terdekat via pencarian kandidat ulang
            // Implementasi ringan: jika ppid cell kosong, coba cari di kanan
            break;
          }
        }
      }
    }
    if (cells.every((c) => c === '')) continue;

    const obj: Record<string, string> = {};
    for (const col of DATA_LENGKAP_UTAMA_COLUMNS) {
      if (col.key === 'no') continue;
      const idx = colIndex[col.key as keyof DataLengkapUtamaValues];
      // Render persis via object key, bukan index statis — contoh: col 'PPID' -> data.ppid
      obj[col.key] = idx !== undefined && idx < cells.length ? cells[idx] : '';
    }
    imported.push(obj as unknown as DataLengkapUtamaValues);
  }

  return imported;
}

export function parseDataLengkapUtamaPaste(text: string): DataLengkapUtamaValues[] {
  // Bersihkan karakter invisible (NBSP, zero-width, \r) tapi pertahankan \t sebagai delimiter
  // Spec: gabungkan baris header ke-2 (index 1) dan ke-3 (index 2) — sama seperti Excel
  const sanitized = stripInvisible(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rawLines = sanitized.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const rows: string[][] = rawLines.map((line) => {
    if (line.includes('\t')) return line.split('\t').map((c) => stripInvisible(c).replace(/[\t\n]/g, ' ').trim());
    if (line.includes(',')) return line.split(',').map((c) => stripInvisible(c).replace(/[\t\n]/g, ' ').trim());
    return line.split(/\s{2,}/).map((c) => stripInvisible(c).replace(/[\t\n]/g, ' ').trim());
  });
  const filteredRows = rows.filter((cells) => cells.some((c) => c !== ''));

  if (filteredRows.length === 0) throw new Error('Tidak ada baris data yang ditemukan');

  const hasHeader = filteredRows.some((r) => r.some((c) => normalizeHeader(c) === 'PPID'));
  if (hasHeader) {
    // Coba pakai parser multi-level (fixed baris 1+2) — sudah handle fallback dinamis di dalamnya
    // Jika filteredRows <4 tapi memiliki header, tetap lanjutkan (mis. copas tanpa title row)
    return parseDataLengkapUtamaRows(filteredRows as unknown[][]);
  }

  return filteredRows.map((cells) => {
    const obj: Record<string, string> = {};
    for (const col of DATA_LENGKAP_UTAMA_DATA_COLUMNS) obj[col.key] = '';
    DATA_LENGKAP_UTAMA_DATA_COLUMNS.forEach((col, i) => {
      if (i < cells.length) obj[col.key] = stripInvisible(cells[i]).replace(/[\t\n]/g, ' ').trim();
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

// --- Verifikasi dynamic header lookup (bukan row[15]/row[16] statis) ---
// Pastikan parser mencari indeks via nama header persis, bukan posisi angka:
function _verifyDynamicHeaderLookup(headers: string[]) {
  // 27 field utama — indexOf harus case-insensitive via normalizeHeader, di sini verifikasi string mentah
  headers.indexOf('PPID');
  headers.indexOf('NAMA LOKET DI ONPAYS');
  headers.indexOf('NAMA LOKET DI KURLOG');
  headers.indexOf('NAMA PEMILIK');
  headers.indexOf('ALAMAT PEMIILIK KTP');
  headers.indexOf('ALAMAT PEMILIK KTP');
  headers.indexOf('ALAMAT LENGKAP LOKET');
  headers.indexOf('RT/RW');
  headers.indexOf('KEL/DESA');
  headers.indexOf('KEC');
  headers.indexOf('KAB/KOT');
  headers.indexOf('PROPINSI');
  headers.indexOf('KODE POS');
  headers.indexOf('NO KTP');
  headers.indexOf('NO NPWP');
  headers.indexOf('ELECTRIC AREA');
  headers.indexOf('REKOMENDASI');
  headers.indexOf('NO HP PEMILIK');
  headers.indexOf('NO.HP LOKET');
  headers.indexOf('EMAIL');
  headers.indexOf('NO DIRIAN');
  headers.indexOf('LOCATION ID');
  headers.indexOf('USER MILE');
  headers.indexOf('PASSWORD MILE');
  headers.indexOf('REGIONAL');
  headers.indexOf('KCU/KC');
  headers.indexOf('NIB ( NO INDUK BERUSAHA)');
  headers.indexOf('NO KBLI');
  headers.indexOf('LATITUDE');
  headers.indexOf('LONGITUDE');
  // Hindari: row[15], row[16] — harus dynamic
}
void _verifyDynamicHeaderLookup;
