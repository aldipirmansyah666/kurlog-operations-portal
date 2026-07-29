export interface ResiItem {
  id?: number;
  created_at?: string;
  tgl_tiket?: string;
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
  'KODE'?: string;
  'NAMA'?: string;
  'BAILOUT'?: number | string;
  [key: string]: unknown;
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
