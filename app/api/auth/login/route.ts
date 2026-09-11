import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';
import { hashPassword, verifyPassword, isLegacyHash, createSessionToken, setSessionCookie } from '@/lib/auth';

// Simple in-memory rate limiter: 5 attempts per minute per IP
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) return true;
  return false;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

const SEED_ADMIN = {
  name: 'Administrator',
  username: 'admin',
  password: 'admin123',
  role: 'ADMIN' as const,
};

async function ensureAdminExists(): Promise<string | null> {
  try {
    const { data, error: checkError } = await supabaseServer.from('users').select('id').limit(1);
    if (checkError) {
      return `Gagal akses tabel users: ${checkError.message}. Pastikan tabel users sudah dibuat dan RLS diizinkan.`;
    }
    if (data && data.length > 0) return null;

    const hashedPassword = await hashPassword(SEED_ADMIN.password);
    const { error: insertError } = await supabaseServer.from('users').insert({
      name: SEED_ADMIN.name,
      username: SEED_ADMIN.username,
      password: hashedPassword,
      role: SEED_ADMIN.role,
    });
    if (insertError) {
      return `Gagal seed admin: ${insertError.message}. Pastikan RLS policy mengizinkan INSERT.`;
    }
    return null;
  } catch (e) {
    return `ensureAdminExists error: ${String(e)}`;
  }
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Terlalu banyak percobaan. Coba lagi dalam 1 menit.' }, { status: 429 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Payload tidak valid' }, { status: 400 });
    }
    const { username, password } = body as { username?: unknown; password?: unknown };

    if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
      return NextResponse.json({ error: 'Username dan password harus diisi' }, { status: 400 });
    }
    if (username.length > 100 || password.length > 200) {
      return NextResponse.json({ error: 'Input terlalu panjang' }, { status: 400 });
    }

    const seedError = await ensureAdminExists();
    if (seedError) {
      return NextResponse.json({ error: seedError }, { status: 500 });
    }

    const { data: user, error } = await supabaseServer
      .from('users')
      .select('*')
      .eq('username', username.trim())
      .limit(1)
      .single();

    if (error) {
      if (error.code === '42P01') {
        return NextResponse.json({ error: 'Tabel users belum dibuat. Jalankan SQL migration di Supabase Dashboard.' }, { status: 500 });
      }
      return NextResponse.json({ error: 'Username atau Password salah' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Username atau Password salah' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Username atau Password salah' }, { status: 401 });
    }

    // Auto-rehash legacy SHA-256 passwords to bcrypt on successful login
    if (isLegacyHash(user.password)) {
      try {
        const newHash = await hashPassword(password);
        await supabaseServer.from('users').update({ password: newHash }).eq('id', user.id);
      } catch (e) {
        console.warn('[auth] auto-rehash legacy password failed:', e);
      }
    }

    const token = await createSessionToken({
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      success: true,
      user: { name: user.name, username: user.username, role: user.role },
    });
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}
