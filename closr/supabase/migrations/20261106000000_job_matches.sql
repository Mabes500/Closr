-- Roadmap 6.2c (docs/JOBS-FEED-PLAN.md sections 4 and 5): matching.
-- * Two profile answers matching needs: whether the user needs visa sponsorship, and
--   which countries they can work in (ISO codes).
-- * job_matches: each day's matches per user, with a score and short reasons for the
--   card ("Matches Backend engineer", "Sponsors visa"). Written by the daily pipeline;
--   each user reads and updates (save / dismiss) only their own.

alter table public.profiles
  add column needs_visa_sponsorship boolean,                    -- null = not answered
  add column work_countries         text[] not null default '{}' -- e.g. {GB,DE}
    check (array_position(work_countries, null) is null);

create table public.job_matches (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  posting_id      uuid not null references public.job_postings (id) on delete cascade,
  score           numeric(6, 2) not null,
  reasons         text[] not null default '{}',
  match_date      date not null,                 -- the day it was matched, in the user's time zone
  status          text not null default 'new' check (status in ('new', 'saved', 'dismissed')),
  dismiss_reason  text check (char_length(dismiss_reason) <= 200),  -- "Not for me" reason, feeds ranking later
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, posting_id)
);

create index job_matches_user_day_idx on public.job_matches (user_id, match_date desc);

alter table public.job_matches enable row level security;

create policy "job_matches: read own"   on public.job_matches for select using (user_id = auth.uid());
create policy "job_matches: insert own" on public.job_matches for insert with check (user_id = auth.uid());
create policy "job_matches: update own" on public.job_matches for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "job_matches: delete own" on public.job_matches for delete using (user_id = auth.uid());

create trigger job_matches_set_updated_at before update on public.job_matches for each row execute function public.set_updated_at();
