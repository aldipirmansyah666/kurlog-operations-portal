<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project overview

**KurLog Operations Portal** (`resi-tracker-web` in `package.json`) — internal logistics tool for monitoring shipment receipts ("resi"), managing loket ("data lengkap") records and the master "data lengkap utama" table, automating WhatsApp bagging reminders, bailout notifications, and reconcile validation. UI language is Indonesian (`lang="id"`).

## Stack

- Next.js **16.2.10** (App Router, React 19)
- Tailwind CSS **v4** — no `tailwind.config.*`; configured via `postcss.config.mjs` with `@tailwindcss/postcss`. Styles in `app/globals.css` using `@import "tailwindcss"`.
- Supabase (`@supabase/supabase-js`) — client initialized in `lib/supabase.ts`
- JWT auth via `jose` — session cookie `kurlog_session`, roles `ADMIN`/`USER`
- Recharts (charts), xlsx (Excel import), lucide-react (icons)

## Dev commands

```bash
npm run dev      # dev server on localhost:3000
npm run build    # production build (closest thing to a typecheck)
npm run lint     # ESLint 9 (flat config)
```

No test suite, typecheck script, or formatter configured.

## Auth & middleware

- **`proxy.ts`** at project root acts as the middleware/auth guard (exported as `proxy` with a `config.matcher`).
- Unauthenticated users are redirected to `/login?redirect=<path>`.
- `/login` and `/api/auth/login` are public; everything else requires a valid JWT session cookie.
- `/admin/*` routes are restricted to `ADMIN` role.
- Auto-seeds an admin user (`admin` / `admin123`) on first login if the `users` table is empty.
- Auth helpers live in `lib/auth.ts`: SHA-256 password hashing (not bcrypt), JWT HS256 via `jose`, 24h expiry. `JWT_SECRET` env var is optional — falls back to a hardcoded dev secret.

## Architecture

```
proxy.ts                     # middleware: auth guard, role check
app/
  layout.tsx                 # root layout (LayoutShell wrapper, lang="id")
  page.tsx                   # home — resi monitoring, CRUD via Supabase
  login/page.tsx             # login form
  data-lengkap-utama/page.tsx # master data lengkap — flat table, Excel import/export, CRUD
  data-lengkap/page.tsx      # loket "data lengkap" records — Excel import, CRUD
  bagging/page.tsx           # bagging automation — Excel upload, WhatsApp messages
  bailout/page.tsx           # bailout notifications — Excel upload, per-agent WA messages
  reconcile/page.tsx         # reconcile validation — Excel upload, valid/rejected split
  admin/users/page.tsx       # user management (admin only)
  error.tsx                  # global error boundary
  not-found.tsx              # 404 page
  components/
    layout/
      LayoutShell.tsx        # client wrapper: conditionally hides Navbar/Footer on /login
      Navbar.tsx             # sticky nav with 6 tabs + user dropdown (admin link)
      Footer.tsx
    ui/                      # reusable, domain-agnostic
    resi/                    # domain-specific (resi monitoring)
    data-lengkap/            # DataLengkapForm etc.
    data-lengkap-utama/      # DataLengkapUtamaForm (4-tab modal, all-optional) + PasteImportModal
  api/
    auth/login/route.ts      # POST — authenticate, set session cookie
    auth/logout/route.ts     # POST — clear session
    auth/me/route.ts         # GET — current user info
    admin/users/route.ts     # user CRUD (admin)
supabase/
  data_lengkap_utama.sql     # master table DDL — run manually in dashboard SQL editor
  resi_closed_at.sql         # adds resi.closed_at (H+2 auto-delete for closed rows) — run manually
lib/
  types.ts                   # shared TypeScript interfaces
  constants.ts               # STATUS_COLORS, STATUS_BADGE_CLASSES, STATUS_LIST, isClosedStatus(), LAYANAN_OPTIONS, PAGE_SIZE_OPTIONS
  supabase.ts                # Supabase client singleton
  auth.ts                    # JWT session helpers (jose)
  reconcileValidator.ts      # reconcile row validation logic
  dataLengkapUtama.ts        # column config (label/group/aliases) for the master table + helpers
  hooks/
    useResi.ts               # CRUD operations + data fetching (table `resi`)
    useDataLengkap.ts        # CRUD + Excel import — reads/writes master `data_lengkap_utama`
    useDataLengkapUtama.ts   # CRUD + chunked Excel import (table `data_lengkap_utama`)
    useResiFilters.ts        # search, filter, chart data computation
    usePagination.ts         # pagination state
    useToast.ts              # toast notification state
```

## Key gotchas

- **No `tailwind.config.*`** — this is Tailwind v4. Custom styles live in `globals.css`. Do not look for a config file.
- **Path alias** `@/*` maps to project root (see `tsconfig.json`).
- **Supabase env vars** required in `env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The app will crash without them.
- **`xlsx` is imported in 5 pages**: `bagging`, `bailout`, `reconcile`, `data-lengkap`, and `data-lengkap-utama` — not just bagging.
- **Data CRUD runs directly in the browser** against Supabase via the anon key (`lib/hooks/useResi.ts`, `useDataLengkap.ts`, `useDataLengkapUtama.ts`); API routes only handle auth (`login`/`logout`/`me`) and admin user management. Both hooks also subscribe to Supabase **realtime** (`postgres_changes`) on their table, so mutations are followed by a refetch.
- **Table shapes differ**: `resi` and `users` are flat columns; `data_lengkap_utama` is a **flat table** whose 47 snake_case columns mirror the master Excel layout; **every column is nullable/optional** except `id` (primary key). Column list + group config (`STATUS`, `KURLOG`, `REKENING`) lives in `lib/dataLengkapUtama.ts` (`DATA_LENGKAP_UTAMA_COLUMNS`); import/export expects a 2-row header. Values are sanitized to `null` when empty via `sanitizeDataLengkapUtamaValues()` before insert/update. The table view freezes columns `NO`, `PPID`, `NAMA LOKET DI ONPAYS` on horizontal scroll.
- **`data_lengkap` page reads the master table**: `useDataLengkap` (and `useDataLengkapUtama`) both read/write `data_lengkap_utama` — the loket page maps columns via `lib/dataLengkap.ts` (`dataLengkapUtamaToItem` / `dataLengkapItemToUtamaValues`). The legacy JSONB `data_lengkap` table is no longer used. Only 7 columns are shown on the loket page; `tglPendaftaran` and `statusKurlog` have no master column and are not persisted.
- **`status_fu` is derived, not stored**: `useResi.updateStatus` sets it to `CLOSED` for closed statuses (`DELIVERED`/`RETUR`), else `PERLU FOLLOW UP`.
- **All page components are `'use client'`**, but `layout.tsx` is a server component and API routes (`app/api/`) are server-side.
- **Status conventions**: `PERJALANAN`, `DELIVERED`, `RETUR`, `HOLD`, `CCH` — business terms, not generic. Closed statuses are `DELIVERED` and `RETUR` (see `isClosedStatus()` in `lib/constants.ts`).
- **Layanan options**: `PE`, `PKH`, `EC3` — defined as `LAYANAN_OPTIONS` in `lib/constants.ts`.
- **Date format** is `DD/MM/YYYY` (Indonesian locale), not ISO.
- **Light theme** is default: `bg-[#F1F5F9] text-slate-800` on `<body>` in `layout.tsx`. No theme toggle.
- **No database migrations in repo** (except `supabase/data_lengkap_utama.sql` for the master table and `supabase/resi_closed_at.sql` for `resi.closed_at`). `users` and `data_lengkap` schemas exist only in the Supabase dashboard. Any new table must also be added to the `supabase_realtime` publication (see the `DO` block in that SQL file) or the hooks' `postgres_changes` subscriptions won't fire.
- **Closed resi auto-delete**: `useResi` sets `resi.closed_at` when a status becomes closed (`DELIVERED`/`RETUR`, null when reopened) and deletes closed rows older than 2 days on every fetch. Requires the `resi_closed_at.sql` migration — without the column, inserts/updates error.
- **Page size options**: 25/100/150 via dropdown in pagination bar. Default 25. Config in `lib/constants.ts`.
- **Row selection**: Checkboxes in table header/body. Selection state lives in `page.tsx` (`selectedIds: Set<number>`), passed down to `ResiTable`.
