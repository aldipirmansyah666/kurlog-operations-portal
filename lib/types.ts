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
