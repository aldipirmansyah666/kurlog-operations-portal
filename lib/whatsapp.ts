import 'server-only';

// Server-only WhatsApp helper
// Isolasi penuh dari client: file ini hanya boleh di-import di Route Handlers / Server Components.
// Client-safe helper ada di lib/whatsappClient.ts

/**
 * Normalisasi nomor HP ke format E.164 +62
 * - Hapus semua karakter non-digit kecuali leading +
 * - 0xxx -> +62xxx
 * - 62xxx -> +62xxx
 * - 8xxx -> +628xxx
 * - +62xxx -> +62xxx (valid)
 * - Panjang valid 9-15 digit setelah +
 */
export function normalizePhoneE164(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  // Hapus karakter non-digit kecuali +
  let digits = trimmed.replace(/[^\d+]/g, '');
  // Hapus + di tengah jika ada, simpan leading +
  const hasPlus = digits.startsWith('+');
  digits = digits.replace(/\+/g, '');
  if (digits.length === 0) return '';

  // Normalisasi prefix
  if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1);
  } else if (digits.startsWith('62')) {
    // sudah benar
  } else if (digits.startsWith('8')) {
    digits = '62' + digits;
  } else if (digits.startsWith('62') === false && hasPlus === false) {
    // fallback: anggap nomor lokal tanpa 0
    // jika panjang 9-12 dan diawali 8, sudah ditangani di atas
  }

  return `+${digits}`;
}

export function isValidE164(phone: string): boolean {
  return /^\+62\d{8,14}$/.test(phone);
}

/**
 * Sanitasi untuk PostgREST / Supabase ilike / or filter
 * Escaping karakter khusus: % _ , " ' \ dan .
 * Docs: https://postgrest.org/en/stable/api.html#operators
 */
export function escapePostgrest(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/,/g, '\\,')
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/\./g, '\\.');
}

/**
 * Escaping khusus untuk ilike pattern
 */
export function escapeIlike(value: string): string {
  return escapePostgrest(value).replace(/\*/g, '\\*');
}

/**
 * Bangun URL WhatsApp (server-side validation, tapi URL tetap client-openable)
 */
export function buildWaUrl(phoneE164: string, message: string): string {
  const normalized = normalizePhoneE164(phoneE164);
  const cleanPhone = normalized.replace(/\+/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export interface SendWhatsappOptions {
  to: string;
  message: string;
  resiId?: number | string;
}

export interface SendWhatsappResult {
  success: boolean;
  to: string;
  messageId?: string;
  error?: string;
}

/**
 * Server-only pengiriman via external gateway.
 * Saat ini dry-run: jika env WHATSAPP_API_URL tidak diset, hanya validasi & log.
 * Isolasi: tidak ada akses di client, semua kredensial via process.env
 */
export async function sendWhatsappViaApi(options: SendWhatsappOptions): Promise<SendWhatsappResult> {
  const to = normalizePhoneE164(options.to);
  if (!isValidE164(to)) {
    return { success: false, to, error: 'Nomor HP tidak valid (harus E.164 +62)' };
  }
  if (!options.message || options.message.trim().length === 0) {
    return { success: false, to, error: 'Pesan tidak boleh kosong' };
  }
  if (options.message.length > 4096) {
    return { success: false, to, error: 'Pesan terlalu panjang (max 4096)' };
  }

  const apiUrl = process.env.WHATSAPP_API_URL;
  const apiKey = process.env.WHATSAPP_API_KEY;

  // Dry-run mode: tidak ada gateway dikonfigurasi -> simulasi sukses
  if (!apiUrl) {
    console.log('[whatsapp:send] DRY RUN to', to, 'msg len', options.message.length, 'resi', options.resiId);
    return { success: true, to, messageId: `dry-${Date.now()}` };
  }

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({ to, message: options.message, resiId: options.resiId }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { success: false, to, error: `Gateway error ${res.status}: ${text.slice(0, 200)}` };
    }
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { success: true, to, messageId: String(json['messageId'] ?? json['id'] ?? `wa-${Date.now()}`) };
  } catch (err) {
    return { success: false, to, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
