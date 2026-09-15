// Helper pembentuk redaksi pesan WhatsApp dinamis (anti-spam) untuk modul Bagging
// Mengikuti Aturan Redaksi Bagging Terbaru.

export const SALAM_OPTIONS = [
  'Selamat pagi',
  'Selamat siang',
  'Halo',
  'Semangat pagi',
] as const;

export const MAAF_OPTIONS = [
  'mohon maaf mengganggu waktunya pak',
  'maaf mengganggu waktunya sebentar pak',
  'izin mengganggu waktunya pak',
  'mohon maaf mengganggu aktivitasnya pak',
] as const;

export const HIMBAUAN_OPTIONS = [
  'Mohon dibantu untuk segera dibagging',
  'Boleh dibantu untuk segera diproses bagging ya pak',
  'Mohon bantuannya untuk diproses bagging hari ini',
] as const;

export type SalamOption = (typeof SALAM_OPTIONS)[number];
export type MaafOption = (typeof MAAF_OPTIONS)[number];
export type HimbauanOption = (typeof HIMBAUAN_OPTIONS)[number];

export interface BuildBaggingMessageParams {
  agenName: string;
  tanggal: string;
  resiList: string[];
  salam?: SalamOption;
  maaf?: MaafOption;
  himbauan?: HimbauanOption;
  kodeUnik?: string;
  timeWIB?: string;
}

/**
 * Pick random element dari array (type-safe).
 */
export function pickRandom<T>(arr: readonly T[]): T {
  const idx = Math.floor(Math.random() * arr.length);
  return arr[idx] as T;
}

/**
 * Generate kode unik 6 karakter alphanumeric uppercase.
 * Contoh: BGG-A1B2C3
 */
export function generateKodeUnik(length = 6): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  // Gunakan crypto.getRandomValues jika tersedia (browser), fallback ke Math.random
  const cryptoObj =
    typeof globalThis !== 'undefined' && (globalThis as unknown as { crypto?: Crypto }).crypto;
  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    const values = new Uint32Array(length);
    cryptoObj.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      result += chars[values[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
  }
  return result;
}

/**
 * Format jam ke HH:mm untuk footer WIB.
 * Default menggunakan waktu saat ini.
 */
export function formatTimeWIB(date: Date = new Date()): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export interface BaggingMessageParts {
  salam: SalamOption;
  maaf: MaafOption;
  himbauan: HimbauanOption;
  kodeUnik: string;
  timeWIB: string;
}

/**
 * Bentuk redaksi pesan Bagging sesuai struktur kantor + variasi anti-spam + footer unik.
 * Jika salam/maaf/himbauan/kodeUnik/timeWIB tidak diisi, akan di-random / generate otomatis.
 */
export function buildBaggingMessage(params: BuildBaggingMessageParams): string {
  const {
    agenName,
    tanggal,
    resiList,
    salam: salamParam,
    maaf: maafParam,
    himbauan: himbauanParam,
    kodeUnik: kodeUnikParam,
    timeWIB: timeWIBParam,
  } = params;

  const salam: SalamOption = salamParam ?? pickRandom(SALAM_OPTIONS);
  const maaf: MaafOption = maafParam ?? pickRandom(MAAF_OPTIONS);
  const himbauan: HimbauanOption = himbauanParam ?? pickRandom(HIMBAUAN_OPTIONS);
  const kodeUnik = kodeUnikParam ?? generateKodeUnik(6);
  const timeWIB = timeWIBParam ?? formatTimeWIB(new Date());

  const daftarResi = resiList.length > 0 ? resiList.join('\n') : '-';

  // Struktur dasar redaksi kantor:
  // [Salam] pak, [Ungkapan Maaf], kami sampaikan ada paket di agen bapak [Nama Agen] pada Tanggal [Tanggal] yang belum dibagging ya pak?
  // [Himbauan].
  //
  // Berikut informasi resinya :
  // [Daftar Resi]
  //
  // Silahkan abaikan pesan ini apabila sudah melakukan bagging dan apabila terdapat Pertanyaan / kendala silahkan hubungi nomor +62 822-1756-9689 / +62 819-1066-6926.
  // Demi keamanan dan kenyamanan, mohon simpan nomor ini sebagai KONTAK di HP Anda.
  //
  // ---
  // _Ref: BGG-[KodeUnik] | [HH:mm] WIB_

  return (
    `${salam} pak, ${maaf}, kami sampaikan ada paket di agen bapak ${agenName} pada Tanggal ${tanggal} yang belum dibagging ya pak?\n` +
    `${himbauan}.\n\n` +
    `Berikut informasi resinya :\n` +
    `${daftarResi}\n\n` +
    `Silahkan abaikan pesan ini apabila sudah melakukan bagging dan apabila terdapat Pertanyaan / kendala silahkan hubungi nomor +62 822-1756-9689 / +62 819-1066-6926.\n` +
    `Demi keamanan dan kenyamanan, mohon simpan nomor ini sebagai KONTAK di HP Anda.\n\n` +
    `--- \n` +
    `_Ref: BGG-${kodeUnik} | ${timeWIB} WIB_`
  );
}

/**
 * Helper untuk generate parts acak secara terpisah (berguna untuk preview / testing).
 */
export function generateRandomBaggingParts(): BaggingMessageParts {
  return {
    salam: pickRandom(SALAM_OPTIONS),
    maaf: pickRandom(MAAF_OPTIONS),
    himbauan: pickRandom(HIMBAUAN_OPTIONS),
    kodeUnik: generateKodeUnik(6),
    timeWIB: formatTimeWIB(new Date()),
  };
}
