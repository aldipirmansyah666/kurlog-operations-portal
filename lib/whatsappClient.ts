// Client-safe WhatsApp helper
// TIDAK mengandung secret, TIDAK import 'server-only'
// Boleh di-import di 'use client' components

/**
 * Normalisasi nomor HP ke E.164 +62 (client-safe, tanpa secret)
 */
export function normalizePhoneE164(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  let digits = trimmed.replace(/[^\d+]/g, '');
  digits = digits.replace(/\+/g, '');
  if (digits.length === 0) return '';
  if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1);
  } else if (digits.startsWith('8')) {
    digits = '62' + digits;
  }
  return `+${digits}`;
}

export function isValidE164(phone: string): boolean {
  return /^\+62\d{8,14}$/.test(phone);
}

export function formatPhoneDisplay(phone: string): string {
  const normalized = normalizePhoneE164(phone);
  if (!normalized) return phone;
  return normalized.replace('+62', '0');
}

/**
 * Bangun URL WhatsApp untuk manual open
 * - wa.me untuk mobile
 * - web.whatsapp.com untuk desktop (dipilih via param)
 */
export function buildWaUrl(phone: string, message: string, preferWeb = false): string {
  const normalized = normalizePhoneE164(phone);
  const cleanPhone = normalized.replace(/\+/g, '');
  if (preferWeb) {
    return `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  }
  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  }
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function buildWaWebUrl(phone: string, message: string): string {
  return buildWaUrl(phone, message, true);
}

/**
 * Kirim via API (client calls server route)
 */
export async function sendViaApi(to: string, message: string, resiId?: number | string): Promise<{ success: boolean; error?: string; to?: string }> {
  const res = await fetch('/api/whatsapp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, message, resiId }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { success: false, error: (json as { error?: string }).error || `HTTP ${res.status}` };
  }
  return { success: true, to: (json as { to?: string }).to };
}

export function openWaManual(phone: string, message: string): void {
  const url = buildWaUrl(phone, message);
  if (typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
