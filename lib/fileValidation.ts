export const MAX_EXCEL_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateFileSize(file: File, maxBytes = MAX_EXCEL_SIZE_BYTES): string | null {
  if (file.size > maxBytes) {
    return `File "${file.name}" terlalu besar (${(file.size / 1024 / 1024).toFixed(2)} MB). Maksimal ${(maxBytes / 1024 / 1024).toFixed(0)} MB.`;
  }
  if (file.size === 0) return `File "${file.name}" kosong.`;
  return null;
}

export function validateExcelMagicBytes(buffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(buffer.slice(0, 8));
  
  // 1. Check XLSX (ZIP: PK..)
  const isXlsx = bytes[0] === 0x50 && bytes[1] === 0x4B;
  
  // 2. Check XLS Binary (OLE2 Header)
  const isXlsBinary = bytes[0] === 0xD0 && bytes[1] === 0xCF;

  if (isXlsx || isXlsBinary) return true;

  // 3. Fallback: Check if file is a Text/HTML export saved as .xls
  try {
    const textPreview = new TextDecoder('utf-8').decode(buffer.slice(0, 200)).toLowerCase();
    const isHtmlExport = textPreview.includes('<html') || textPreview.includes('<?xml') || textPreview.includes('<table');
    const isCsvExport = textPreview.includes(',') || textPreview.includes('\t') || textPreview.includes('\n');
    
    return isHtmlExport || isCsvExport;
  } catch {
    return false;
  }
}

// Legacy compatibility: previous API returned string | null error message
// Keep for existing callers that expect null = valid, string = error
export function validateExcelMagicBytesLegacy(buffer: ArrayBuffer): string | null {
  return validateExcelMagicBytes(buffer) ? null : 'Format file tidak valid. Harap upload file Excel (.xlsx/.xls) yang sah.';
}

// Alias for boolean check
export function isValidExcelMagicBytes(buffer: ArrayBuffer): boolean {
  return validateExcelMagicBytes(buffer);
}
