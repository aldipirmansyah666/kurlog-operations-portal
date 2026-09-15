export interface ResiItem {
  id?: number;
  created_at?: string;
  closed_at?: string;
  tgl_tiket?: string;
  /** UNIQUE constraint di DB: resi.no_resi (index resi_no_resi_key). Upsert onConflict: 'no_resi' */
  no_resi: string;
  agen: string;
  layanan?: string;
  petugas: string;
  status_resi: string;
  status_fu?: string;
  catatan?: string;
}

export type ResiStatus = 'PERJALANAN' | 'DELIVERED' | 'RETUR' | 'HOLD' | 'CCH';

export type FilterTab = 'all' | 'fu' | 'done';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export interface BaggingRow {
  'Tanggal'?: string;
  'No Resi'?: string;
  'Agen'?: string;
  'Kode Layanan'?: string;
  'Status Bagging'?: string;
  [key: string]: unknown;
}

export interface BailoutRow {
  /** UNIQUE di sheet CA: KODE / MITRA ID / PAYMENT POINT — sanitasi trim+upper, upsert onConflict kode_loket+periode */
  'KODE'?: string;
  'NAMA'?: string;
  'BAILOUT'?: number | string;
  [key: string]: unknown;
}

/** Baris bailout yang sudah dipersist ke Supabase (tabel public.bailout). Constraint: UNIQUE(kode_loket, periode) */
export interface BailoutRecord {
  id?: string;
  kode_loket: string;
  periode: string; // YYYY-MM-DD
  tanggal_text?: string;
  nama_loket?: string;
  nominal: number;
  raw_payload?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface ReconcileRow {
  produk: string;
  nomor_resi: string;
  [key: string]: unknown;
}

export interface ValidatedReconcileRow extends ReconcileRow {
  isValid: boolean;
  reason: string;
  rowIndex: number;
}

export interface ExcelValidationResult {
  isFileValid: boolean;
  isEC3Valid: boolean;
  isPKHValid: boolean;
  details: {
    ec3_shpe: boolean;
    ec3_p260: boolean;
    pkh_p260: boolean;
    pkh_ttspos: boolean;
  };
  errors: string[];
}

export type WaLogStatus = 'Sent' | 'Pending' | 'Failed';
export type WaLogType = 'Bagging' | 'Bailout' | 'Reconcile' | 'Follow Up';

export interface WaLog {
  id: string;
  sentAt: string; // ISO string
  type: WaLogType;
  agenName: string;
  kodeLoket: string;
  waNumber: string;
  message: string;
  status: WaLogStatus;
}

export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  role: UserRole;
  created_at: string;
}

export interface DataLengkapItem {
  id: string;
  no: number;
  tglPendaftaran: string;
  statusKurlog: string;
  ppid: string;
  namaLoketOnpays: string;
  namaLoketKurlog: string;
  locationId: string;
  userMile: string;
  passwordMile: string;
  regional: string;
  kcuKc: string;
  namaPemilik: string;
  noKtp: string;
  noNpwp: string;
  noHpPemilik: string;
  noHpLoket: string;
  email: string;
  noDirian: string;
  nib: string;
  noKbli: string;
  alamatPemilikKtp: string;
  alamatLengkapLoket: string;
  rtRw: string;
  kelDesa: string;
  kec: string;
  kabKota: string;
  propinsi: string;
  kodePos: string;
  electricArea: string;
  rekomendasi: string;
  latitude: string;
  longitude: string;
  nomorRekening: string;
  namaBank: string;
  namaPemilikRekening: string;
  syarat: string;
  pengajuanSurveyKePos: string;
  pengajuanPos: string;
  pendaftaranKurlog: string;
  kelengkapanPerangkat: string;
  aktivasiKurlog: string;
  aktivasiSicepat: string;
  training: string;
  transaksi: string;
  posPpob: string;
  posOnly: string;
  sicepat: string;
  catatan: string;
  waktuUpdate: string;
}

export interface DataLengkapUtamaItem {
  id: string;
  no: number;
  created_at: string;
  updated_at: string;
  syarat: string;
  pengajuan_survey_ke_pos: string;
  pengajuan_pos: string;
  pendaftaran_kurlog: string;
  kelengkapan_perangkat: string;
  aktivasi_kurlog: string;
  aktivasi_sicepat: string;
  training: string;
  transaksi: string;
  catatan: string;
  waktu: string;
  pos_ppob: string;
  pos_only: string;
  sicepat: string;
  /** UNIQUE partial index: data_lengkap_utama_ppid_unique WHERE ppid <> '' — kode_loket */
  ppid: string;
  nama_loket_onpays: string;
  nama_loket_kurlog: string;
  nama_pemilik: string;
  alamat_pemilik_ktp: string;
  alamat_lengkap_loket: string;
  rt_rw: string;
  kel_desa: string;
  kec: string;
  kab_kota: string;
  propinsi: string;
  kode_pos: string;
  no_ktp: string;
  no_npwp: string;
  electric_area: string;
  rekomendasi: string;
  no_hp_pemilik: string;
  no_hp_loket: string;
  email: string;
  no_dirian: string;
  location_id: string;
  user_mile: string;
  password_mile: string;
  regional: string;
  kcu_kc: string;
  nib: string;
  no_kbli: string;
  nomor_rekening: string;
  nama_bank: string;
  nama_pemilik_rekening: string;
  latitude: string;
  longitude: string;
}

export type DataLengkapUtamaValues = Omit<DataLengkapUtamaItem, 'id' | 'no' | 'created_at' | 'updated_at'>;

export function emptyDataLengkap(no: number): DataLengkapItem {
  return {
    id: '',
    no,
    tglPendaftaran: '',
    statusKurlog: '',
    ppid: '',
    namaLoketOnpays: '',
    namaLoketKurlog: '',
    locationId: '',
    userMile: '',
    passwordMile: '',
    regional: '',
    kcuKc: '',
    namaPemilik: '',
    noKtp: '',
    noNpwp: '',
    noHpPemilik: '',
    noHpLoket: '',
    email: '',
    noDirian: '',
    nib: '',
    noKbli: '',
    alamatPemilikKtp: '',
    alamatLengkapLoket: '',
    rtRw: '',
    kelDesa: '',
    kec: '',
    kabKota: '',
    propinsi: '',
    kodePos: '',
    electricArea: '',
    rekomendasi: '',
    latitude: '',
    longitude: '',
    nomorRekening: '',
    namaBank: '',
    namaPemilikRekening: '',
    syarat: '',
    pengajuanSurveyKePos: '',
    pengajuanPos: '',
    pendaftaranKurlog: '',
    kelengkapanPerangkat: '',
    aktivasiKurlog: '',
    aktivasiSicepat: '',
    training: '',
    transaksi: '',
    posPpob: '',
    posOnly: '',
    sicepat: '',
    catatan: '',
    waktuUpdate: '',
  };
}
