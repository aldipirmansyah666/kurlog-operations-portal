import type { DataLengkapItem, DataLengkapUtamaItem, DataLengkapUtamaValues } from './types';
import { emptyDataLengkap } from './types';
import { emptyDataLengkapUtamaValues } from './dataLengkapUtama';

// Pemetaan kolom DataLengkapItem (camelCase, halaman "Data Lengkap" loket)
// ke kolom DataLengkapUtama (snake_case, master "Data Lengkap Utama").
// Data Lengkap mengambil data dari master sebagai single source of truth.
// Kolom `tglPendaftaran` dan `statusKurlog` tidak ada di master, jadi tidak
// dipetakan (tidak akan tersimpan).
const ITEM_TO_UTAMA: Record<string, keyof DataLengkapUtamaValues> = {
  ppid: 'ppid',
  namaLoketOnpays: 'nama_loket_onpays',
  namaLoketKurlog: 'nama_loket_kurlog',
  locationId: 'location_id',
  userMile: 'user_mile',
  passwordMile: 'password_mile',
  regional: 'regional',
  kcuKc: 'kcu_kc',
  namaPemilik: 'nama_pemilik',
  noKtp: 'no_ktp',
  noNpwp: 'no_npwp',
  noHpPemilik: 'no_hp_pemilik',
  noHpLoket: 'no_hp_loket',
  email: 'email',
  noDirian: 'no_dirian',
  nib: 'nib',
  noKbli: 'no_kbli',
  alamatPemilikKtp: 'alamat_pemilik_ktp',
  alamatLengkapLoket: 'alamat_lengkap_loket',
  rtRw: 'rt_rw',
  kelDesa: 'kel_desa',
  kec: 'kec',
  kabKota: 'kab_kota',
  propinsi: 'propinsi',
  kodePos: 'kode_pos',
  electricArea: 'electric_area',
  rekomendasi: 'rekomendasi',
  latitude: 'latitude',
  longitude: 'longitude',
  nomorRekening: 'nomor_rekening',
  namaBank: 'nama_bank',
  namaPemilikRekening: 'nama_pemilik_rekening',
  syarat: 'syarat',
  pengajuanSurveyKePos: 'pengajuan_survey_ke_pos',
  pengajuanPos: 'pengajuan_pos',
  pendaftaranKurlog: 'pendaftaran_kurlog',
  kelengkapanPerangkat: 'kelengkapan_perangkat',
  aktivasiKurlog: 'aktivasi_kurlog',
  aktivasiSicepat: 'aktivasi_sicepat',
  training: 'training',
  transaksi: 'transaksi',
  posPpob: 'pos_ppob',
  posOnly: 'pos_only',
  sicepat: 'sicepat',
  catatan: 'catatan',
  waktuUpdate: 'waktu',
};

/** Konversi baris master (snake_case) menjadi item halaman Data Lengkap (camelCase). */
export function dataLengkapUtamaToItem(row: DataLengkapUtamaItem): DataLengkapItem {
  const item = emptyDataLengkap(row.no);
  item.id = row.id;
  for (const [camel, snake] of Object.entries(ITEM_TO_UTAMA)) {
    (item as unknown as Record<string, unknown>)[camel] = row[snake] ?? '';
  }
  return item;
}

/** Konversi item halaman Data Lengkap (camelCase) menjadi values master (snake_case). */
export function dataLengkapItemToUtamaValues(item: DataLengkapItem): DataLengkapUtamaValues {
  const base = emptyDataLengkapUtamaValues();
  for (const [camel, snake] of Object.entries(ITEM_TO_UTAMA)) {
    const value = (item as unknown as Record<string, unknown>)[camel];
    base[snake] = value === null || value === undefined ? '' : String(value);
  }
  return base;
}
