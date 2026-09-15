import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { normalizePhoneE164, isValidE164, sendWhatsappViaApi, escapePostgrest } from '@/lib/whatsapp';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Payload tidak valid' }, { status: 400 });
  }

  const payload = body as Record<string, unknown>;
  const rawTo = String(payload['to'] ?? '').trim();
  const rawMessage = String(payload['message'] ?? '');
  const resiId = payload['resiId'];

  if (!rawTo) {
    return NextResponse.json({ error: 'Nomor tujuan wajib diisi' }, { status: 400 });
  }
  if (!rawMessage.trim()) {
    return NextResponse.json({ error: 'Pesan tidak boleh kosong' }, { status: 400 });
  }

  const to = normalizePhoneE164(rawTo);
  if (!isValidE164(to)) {
    return NextResponse.json({ error: 'Nomor HP tidak valid. Gunakan format 08xxx atau +62xxx' }, { status: 400 });
  }

  // Sanitasi untuk log / penyimpanan PostgREST (contoh: jika pesan disimpan ke DB)
  const sanitizedMessage = escapePostgrest(rawMessage).slice(0, 4096);

  const result = await sendWhatsappViaApi({
    to,
    message: sanitizedMessage,
    resiId: typeof resiId === 'string' || typeof resiId === 'number' ? resiId : undefined,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error || 'Gagal mengirim' }, { status: 422 });
  }

  return NextResponse.json({ success: true, to: result.to, messageId: result.messageId });
}
