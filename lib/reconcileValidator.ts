import type { ReconcileRow, ValidatedReconcileRow, ExcelValidationResult } from './types';

export function validateRow(row: ReconcileRow): { isValid: boolean; reason: string } {
  const produk = String(row.produk || '').trim().toUpperCase();
  const resi = String(row.nomor_resi || '').trim().toUpperCase();

  if (produk === 'EC3') {
    if (resi.startsWith('SHPE') || resi.startsWith('P260')) {
      return { isValid: true, reason: '' };
    }
    return { isValid: false, reason: 'EC3 resi harus diawali SHPE atau P260' };
  }

  if (produk === 'PKH') {
    if (resi.startsWith('P260') || resi.startsWith('TTSPOS')) {
      return { isValid: true, reason: '' };
    }
    return { isValid: false, reason: 'PKH resi harus diawali P260 atau TTSPOS' };
  }

  return { isValid: false, reason: 'Produk tidak memenuhi kriteria filter' };
}

export function normalizeReconcileRows(raw: Record<string, unknown>[]): ReconcileRow[] {
  if (raw.length === 0) return [];

  const keys = Object.keys(raw[0]);
  const produkKey = keys.find((k) => k.trim().toLowerCase() === 'produk');
  const resiKey = keys.find(
    (k) => k.trim().toLowerCase() === 'nomor_resi' || k.trim().toLowerCase() === 'no_resi'
  );

  if (!produkKey || !resiKey) return [];

  return raw.map((row) => ({
    produk: String(row[produkKey] ?? ''),
    nomor_resi: String(row[resiKey] ?? ''),
    ...row,
  }));
}

export function validateAll(rows: ReconcileRow[]): {
  valid: ValidatedReconcileRow[];
  rejected: ValidatedReconcileRow[];
} {
  const valid: ValidatedReconcileRow[] = [];
  const rejected: ValidatedReconcileRow[] = [];

  rows.forEach((row, idx) => {
    const result = validateRow(row);
    const validated: ValidatedReconcileRow = {
      ...row,
      rowIndex: idx + 1,
      isValid: result.isValid,
      reason: result.reason,
    };

    if (result.isValid) {
      valid.push(validated);
    } else {
      rejected.push(validated);
    }
  });

  return { valid, rejected };
}

export function validateExcelFile(dataRows: ReconcileRow[]): ExcelValidationResult {
  const ec3Rows = dataRows.filter((r) => String(r.produk || '').trim().toUpperCase() === 'EC3');
  const hasEC3_SHPE = ec3Rows.some((r) => String(r.nomor_resi || '').trim().toUpperCase().startsWith('SHPE'));
  const hasEC3_P260 = ec3Rows.some((r) => String(r.nomor_resi || '').trim().toUpperCase().startsWith('P260'));
  const isEC3Valid = hasEC3_SHPE && hasEC3_P260;

  const pkhRows = dataRows.filter((r) => String(r.produk || '').trim().toUpperCase() === 'PKH');
  const hasPKH_P260 = pkhRows.some((r) => String(r.nomor_resi || '').trim().toUpperCase().startsWith('P260'));
  const hasPKH_TTSPOS = pkhRows.some((r) => String(r.nomor_resi || '').trim().toUpperCase().startsWith('TTSPOS'));
  const isPKHValid = hasPKH_P260 && hasPKH_TTSPOS;

  const isFileValid = isEC3Valid && isPKHValid;

  const errors: string[] = [];
  if (ec3Rows.length > 0) {
    if (!hasEC3_SHPE) errors.push('EC3: Tidak ada resi berawalan SHPE');
    if (!hasEC3_P260) errors.push('EC3: Tidak ada resi berawalan P260');
  }
  if (pkhRows.length > 0) {
    if (!hasPKH_P260) errors.push('PKH: Tidak ada resi berawalan P260');
    if (!hasPKH_TTSPOS) errors.push('PKH: Tidak ada resi berawalan TTSPOS');
  }

  return {
    isFileValid,
    isEC3Valid,
    isPKHValid,
    details: {
      ec3_shpe: hasEC3_SHPE,
      ec3_p260: hasEC3_P260,
      pkh_p260: hasPKH_P260,
      pkh_ttspos: hasPKH_TTSPOS,
    },
    errors,
  };
}
