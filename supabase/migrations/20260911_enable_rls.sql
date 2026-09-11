-- Migration: Enable Row Level Security and baseline policies
-- Date: 2026-09-11
-- Purpose: Fix H-S1 – block direct anon mutations, allow controlled reads,
--          all writes must go via server API using SERVICE_ROLE (bypasses RLS).

-- ---------------------------------------------------------------------------
-- 1. resi table (if exists)
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='resi') then
    -- Enable RLS
    execute 'alter table public.resi enable row level security';

    -- Drop legacy permissive policies if any (idempotent)
    -- anon SELECT (baseline read for authenticated portal users)
    drop policy if exists "resi_anon_select" on public.resi;
    drop policy if exists "resi_service_all" on public.resi;

    -- Allow any anon/authenticated client to READ (SELECT).
    -- Writes are intentionally NOT allowed for anon/authenticated – they are blocked.
    -- Service_role bypasses RLS, so server routes (supabaseServer) can still mutate.
    create policy "resi_anon_select"
      on public.resi for select
      to anon, authenticated
      using (true);

    -- Optional: if you later migrate to Supabase Auth, replace above with
    -- using (auth.role() = 'authenticated')
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. data_lengkap_utama table
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='data_lengkap_utama') then
    execute 'alter table public.data_lengkap_utama enable row level security';

    drop policy if exists "data_lengkap_utama_anon_select" on public.data_lengkap_utama;
    drop policy if exists "data_lengkap_utama_service_all" on public.data_lengkap_utama;

    create policy "data_lengkap_utama_anon_select"
      on public.data_lengkap_utama for select
      to anon, authenticated
      using (true);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3. users table – lock down (only service_role may read/write)
--    Client-side already uses service-role via /api/auth/login; anon must NOT select passwords.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='users') then
    execute 'alter table public.users enable row level security';

    -- Remove any previous permissive policies
    drop policy if exists "users_anon_all" on public.users;
    drop policy if exists "users_anon_select" on public.users;
    drop policy if exists "users_service_all" on public.users;

    -- No anon/authenticated policies → anon cannot read users table directly.
    -- service_role bypasses RLS, so server API routes remain functional.
    -- This blocks the attack where anon key directly queries users passwords.
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 4. Ensure realtime still works – SELECT policy covers replication
-- ---------------------------------------------------------------------------
-- Realtime already configured in data_lengkap_utama.sql via supabase_realtime publication.
-- No additional step needed; SELECT policy allows realtime polling.

-- Verify:
-- select tablename, rowsecurity from pg_tables where schemaname='public' and tablename in ('resi','data_lengkap_utama','users');
-- select * from pg_policies where tablename in ('resi','data_lengkap_utama','users');
