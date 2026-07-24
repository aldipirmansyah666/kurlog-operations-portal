<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project overview

**KurLog Operations Portal** (`resi-tracker-web` in `package.json`) — internal logistics tool for monitoring shipment receipts ("resi") and automating WhatsApp bagging reminders to agents. UI language is Indonesian (`lang="id"`). Dark theme is hardcoded in `layout.tsx` body classes.

## Stack

- Next.js **16.2.10** (App Router, React 19, `'use client'` pages)
- Tailwind CSS **v4** — no `tailwind.config.*`; configured via `postcss.config.mjs` with `@tailwindcss/postcss`. Styles in `app/globals.css` using `@import "tailwindcss"`.
- Supabase (`@supabase/supabase-js`) — client initialized in `lib/supabase.ts`
- Recharts (charts), xlsx (Excel import), lucide-react (icons)

## Dev commands

```bash
npm run dev      # dev server on localhost:3000
npm run build    # production build
npm run lint     # ESLint (flat config, eslint 9)
```

No test suite, typecheck script, or formatter configured. `npm run build` is the closest verification step.

## Architecture

```
app/
  layout.tsx              # root layout (Navbar + Footer, lang="id")
  page.tsx                # home — resi monitoring, CRUD via Supabase
  bagging/page.tsx        # bagging automation — Excel upload, WhatsApp messages
  error.tsx               # global error boundary
  not-found.tsx           # 404 page
  components/
    layout/
      Navbar.tsx          # sticky nav with two tabs
      Footer.tsx          # site footer
    ui/                   # reusable, domain-agnostic components
      Toast.tsx           # toast notification system
      Modal.tsx           # base modal with backdrop + ESC close
      ConfirmDialog.tsx   # confirmation dialog (danger/warning variants)
      StatusBadge.tsx     # status pill component
      StatCard.tsx        # metric card with icon + variant
      Pagination.tsx      # page navigation
      LoadingSkeleton.tsx # table/chart/card skeletons
      EmptyState.tsx      # empty state placeholder
    resi/                 # domain-specific components
      ResiForm.tsx        # add new resi form with validation
      ResiTable.tsx       # data table with row actions
      FollowUpModal.tsx   # follow-up note modal
      PasteImportModal.tsx # spreadsheet paste-import modal
      Charts.tsx          # pie chart + bar chart
      SearchBar.tsx       # search + date filter + tab filter
lib/
  types.ts                # shared TypeScript interfaces (ResiItem, BaggingRow, etc.)
  constants.ts            # STATUS_COLORS, STATUS_LIST, isClosedStatus()
  supabase.ts             # Supabase client singleton
  hooks/
    useResi.ts            # CRUD operations + data fetching
    useResiFilters.ts     # search, filter, chart data computation
    usePagination.ts      # pagination state
    useToast.ts           # toast notification state
```

- `app/page.tsx` is the main page (~240 lines, down from 813) — composes hooks + components.
- `app/bagging/page.tsx` is a standalone Excel-upload tool (no Supabase, client-side only).
- All pages are `'use client'` — no server components or API routes.
- UI language is Indonesian (`lang="id"`).

## Key gotchas

- **No `tailwind.config.*`** — this is Tailwind v4. Custom styles live in `globals.css`. Do not look for a config file.
- **Path alias** `@/*` maps to project root (see `tsconfig.json`).
- **Supabase env vars** required in `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The app will crash without them.
- **No database migrations** in repo. Schema is managed in Supabase dashboard directly.
- **`xlsx` is heavy** — only imported in `app/bagging/page.tsx`.
- **Page size options**: 25/100/150 via dropdown in pagination bar. Default 25. Config in `lib/constants.ts` (`PAGE_SIZE_OPTIONS`, `DEFAULT_PAGE_SIZE`).
- **Row selection**: Checkboxes in table header/body. Selection state lives in `page.tsx` (`selectedIds: Set<number>`), passed down to `ResiTable`.
- **Status conventions**: `PERJALANAN`, `DELIVERED`, `RETUR`, `HOLD`, `CCH` — these are business terms, not generic. Closed statuses are `DELIVERED` and `RETUR` (see `isClosedStatus()` in `lib/constants.ts`).
- **Layanan options**: `PE`, `PKH`, `EC3` — defined as `LAYANAN_OPTIONS` in `lib/constants.ts`.
- **Date format** is `DD/MM/YYYY` (Indonesian locale), not ISO.
- **Dark theme** is hardcoded: `bg-slate-950 text-slate-100` on `<body>` in `layout.tsx`. No theme toggle.
