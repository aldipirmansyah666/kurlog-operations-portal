import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 10;

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET environment variable is required. Set JWT_SECRET in .env.local (generate with: openssl rand -hex 32)'
    );
  }
  if (secret.length < 32) {
    console.warn('[auth] JWT_SECRET should be at least 32 characters for adequate security');
  }
  return new TextEncoder().encode(secret);
}

const COOKIE_NAME = 'kurlog_session';
const TOKEN_EXPIRY = '24h';

export interface SessionPayload {
  userId: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'USER';
}

// ---------------------------------------------------------------------------
// Legacy SHA-256 helpers (for fallback verification only)
// ---------------------------------------------------------------------------
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(data: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return toHex(new Uint8Array(hash));
}

// ---------------------------------------------------------------------------
// Bcrypt helpers
// ---------------------------------------------------------------------------
function isBcryptHash(hash: string): boolean {
  return hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$');
}

export function isLegacyHash(hash: string): boolean {
  return !isBcryptHash(hash);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify password against stored hash.
 * - If stored hash is bcrypt, use bcrypt.compare
 * - Otherwise fallback to legacy SHA-256 (salt$hash or unsalted)
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (isBcryptHash(hash)) {
    return bcrypt.compare(password, hash);
  }

  // Legacy salted SHA-256 format: salt$hash
  if (hash.includes('$')) {
    const [salt, expected] = hash.split('$');
    if (!salt || !expected) return false;
    const computed = await sha256Hex(salt + password);
    if (computed.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
  }

  // Legacy unsalted SHA-256 fallback
  const legacy = await sha256Hex(password);
  if (legacy.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < legacy.length; i++) diff |= legacy.charCodeAt(i) ^ hash.charCodeAt(i);
  return diff === 0;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(getJwtSecret());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export const PUBLIC_PATHS = ['/login', '/api/auth/login'];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}
