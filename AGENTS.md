<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project overview

**KurLog Operations Portal** (`resi-tracker-web` in `package.json`) — internal logistics tool for monitoring shipment receipts ("resi"), automating WhatsApp bagging reminders, bailout notifications, and reconcile validation. UI language is Indonesian (`lang="id"`).

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
- Auth helpers live in `lib/auth.ts` (hash, verify, session CRUD).

## Architecture

```
proxy.ts                     # middleware: auth guard, role check
app/
  layout.tsx                 # root layout (LayoutShell wrapper, lang="id")
  page.tsx                   # home — resi monitoring, CRUD via Supabase
  login/page.tsx             # login form
  bagging/page.tsx           # bagging automation — Excel upload, WhatsApp messages
  bailout/page.tsx           # bailout notifications — Excel upload, per-agent WA messages
  reconcile/page.tsx         # reconcile validation — Excel upload, valid/rejected split
  admin/users/page.tsx       # user management (admin only)
  error.tsx                  # global error boundary
  not-found.tsx              # 404 page
  components/
    layout/
      LayoutShell.tsx        # client wrapper: conditionally hides Navbar/Footer on /login
      Navbar.tsx             # sticky nav with 4 tabs + user dropdown (admin link)
      Footer.tsx
    ui/                      # reusable, domain-agnostic
    resi/                    # domain-specific (resi monitoring)
  api/
    auth/login/route.ts      # POST — authenticate, set session cookie
    auth/logout/route.ts     # POST — clear session
    auth/me/route.ts         # GET — current user info
    admin/users/route.ts     # user CRUD (admin)
lib/
  types.ts                   # shared TypeScript interfaces
  constants.ts               # STATUS_COLORS, STATUS_LIST, isClosedStatus(), LAYANAN_OPTIONS, PAGE_SIZE_OPTIONS
  supabase.ts                # Supabase client singleton
  auth.ts                    # JWT session helpers (jose)
  reconcileValidator.ts      # reconcile row validation logic
  hooks/
    useResi.ts               # CRUD operations + data fetching
    useResiFilters.ts        # search, filter, chart data computation
    usePagination.ts         # pagination state
    useToast.ts              # toast notification state
```

## Key gotchas

- **No `tailwind.config.*`** — this is Tailwind v4. Custom styles live in `globals.css`. Do not look for a config file.
- **Path alias** `@/*` maps to project root (see `tsconfig.json`).
- **Supabase env vars** required in `env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The app will crash without them.
- **`xlsx` is imported in 3 pages**: `bagging`, `bailout`, and `reconcile` — not just bagging.
- **All page components are `'use client'`**, but `layout.tsx` is a server component and API routes (`app/api/`) are server-side.
- **Status conventions**: `PERJALANAN`, `DELIVERED`, `RETUR`, `HOLD`, `CCH` — business terms, not generic. Closed statuses are `DELIVERED` and `RETUR` (see `isClosedStatus()` in `lib/constants.ts`).
- **Layanan options**: `PE`, `PKH`, `EC3` — defined as `LAYANAN_OPTIONS` in `lib/constants.ts`.
- **Date format** is `DD/MM/YYYY` (Indonesian locale), not ISO.
- **Light theme** is default: `bg-[#F1F5F9] text-slate-800` on `<body>` in `layout.tsx`. No theme toggle.
- **No database migrations** in repo. Schema is managed in Supabase dashboard directly.
- **Page size options**: 25/100/150 via dropdown in pagination bar. Default 25. Config in `lib/constants.ts`.
- **Row selection**: Checkboxes in table header/body. Selection state lives in `page.tsx` (`selectedIds: Set<number>`), passed down to `ResiTable`.
