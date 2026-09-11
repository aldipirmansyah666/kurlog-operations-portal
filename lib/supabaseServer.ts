import 'server-only';
import { createClient } from '@supabase/supabase-js';

function getEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    // During `next build` without env, avoid hard crash – return dummy values
    // Runtime requests will still fail with clear error via getSupabaseServer()
    if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PHASE?.includes('phase-production-build')) {
      throw new Error(
        'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for server routes'
      );
    }
    return { url: url || 'https://placeholder.supabase.co', key: key || 'placeholder-service-role-key' };
  }
  return { url, key };
}

function createServerClient() {
  const { url, key } = getEnv();
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Lazy singleton – safe for build phase
let _cached: ReturnType<typeof createServerClient> | null = null;

export const supabaseServer = new Proxy({} as ReturnType<typeof createServerClient>, {
  get(_target, prop) {
    if (!_cached) _cached = createServerClient();
    const val = (_cached as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === 'function' ? (val as (...args: unknown[]) => unknown).bind(_cached) : val;
  },
});

export function getSupabaseServer() {
  if (!_cached) _cached = createServerClient();
  const env = getEnv();
  if (env.url.includes('placeholder') || env.key.includes('placeholder')) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY missing at runtime. Set it in .env.local');
  }
  return _cached;
}
