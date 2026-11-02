# Closr — notes for Claude Code

Closr is a job application tracker for global job seekers (remote and onsite, international roles). The core promise is that tracking is easy and fun for people who apply widely and don't keep spreadsheets. The owner is not a trained software engineer: explain changes in plain language, keep diffs small, and say exactly what to click or run when something has to be done outside the code.

## Stack
- React 19 + Vite + TypeScript, React Router, TanStack Query for server state
- Tailwind CSS v4, design tokens in `src/index.css` (`@theme`). Use token classes (`bg-brand`, `text-ink-muted`, `border-line`, `bg-status-offer`) and never hard-code hex colours in components.
- Supabase: Postgres, Auth (magic link + Google), Row Level Security
- Hosted on Vercel; every push to `main` deploys to production, and other branches get preview URLs

## Layout
- `src/pages/` holds one file per route
- `src/components/` holds shared UI
- `src/lib/supabase.ts` is the single Supabase client
- `src/lib/types.ts` holds DB row types, which must match the migrations
- `src/lib/<entity>.ts` holds TanStack Query hooks per table (see `applications.ts` for the pattern)
- `supabase/migrations/` holds every schema change as a timestamped `.sql` file

## Rules
- Schema changes go in a NEW migration file (`supabase/migrations/YYYYMMDDHHMMSS_name.sql`). Never edit a migration that has already been applied.
- Every new table needs `user_id uuid not null default auth.uid()` plus RLS enabled, with select/insert/update/delete policies scoped to `auth.uid()`.
- Only the anon/publishable key is ever used in the frontend. Never put a service-role/secret key in code or in `VITE_*` variables.
- Status changes are logged automatically by a DB trigger into `application_events`. Don't log them again from the client.
- Light theme is the default. Typography is General Sans (UI) and DM Mono (numbers, dates, counts).
- Run `npm run build` before finishing any change; it type-checks.

## Roadmap
See docs/ROADMAP.md. Build items in order, match docs/prototype.html using the screen map at the top of ROADMAP.md, and tick items when done.
