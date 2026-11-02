-- Roadmap 6.2a (docs/JOBS-FEED-PLAN.md): the jobs feed's data.
--
-- job_boards: which employer job boards (Greenhouse, Lever, Ashby) the daily pipeline
--   reads. Shared and internal: no user can read or change it directly. Users add to it
--   only through register_job_boards() below, when they paste or import a job link.
-- job_postings: every posting read from those boards. Shared reference data: any
--   signed-in user can read it; only the pipeline (service role, which bypasses RLS)
--   writes it.
--
-- These two tables have no user_id: they belong to no single user. The pipeline runs in
-- GitHub Actions with the service-role key, which is never in the app.

create type public.ats_kind as enum ('greenhouse', 'lever', 'ashby');

create table public.job_boards (
  id                    uuid primary key default gen_random_uuid(),
  ats                   public.ats_kind not null,
  slug                  text not null check (slug ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$'),  -- board token / site / org name
  region                text check (region in ('eu')),        -- EU-hosted board (api.eu.lever.co, boards-api.eu.greenhouse.io)
  company_name          text check (char_length(company_name) <= 200),
  company_domain        text check (char_length(company_domain) <= 200),
  active                boolean not null default true,
  added_via             text not null default 'seed' check (added_via in ('seed', 'user')),
  last_fetched_at       timestamptz,
  last_job_count        integer,
  consecutive_failures  integer not null default 0,
  last_error            text,
  unhealthy_since       timestamptz,   -- start of the current spell of errors or zero jobs; null when healthy
  created_at            timestamptz not null default now()
);

create unique index job_boards_ats_slug_key on public.job_boards (ats, lower(slug));

-- RLS on with no policies: only the service role can touch it.
alter table public.job_boards enable row level security;

create table public.job_postings (
  id               uuid primary key default gen_random_uuid(),
  board_id         uuid not null references public.job_boards (id) on delete cascade,
  source           public.ats_kind not null,
  external_id      text not null,                -- the ATS's own id for the posting
  company          text not null,
  title            text not null,
  location         text,                         -- as the employer wrote it
  countries        text[] not null default '{}', -- ISO 3166 codes found in the location, e.g. {GB,DE}
  work_mode        public.work_mode,
  salary_min       numeric(12, 2) check (salary_min >= 0),
  salary_max       numeric(12, 2) check (salary_max >= 0),
  salary_currency  text check (salary_currency ~ '^[A-Z]{3}$'),
  salary_period    text check (salary_period in ('year', 'month', 'week', 'day', 'hour')),
  description      text,                         -- plain text, emails and phone numbers removed
  apply_url        text not null,                -- the employer's own posting page
  posted_at        timestamptz,
  first_seen_at    timestamptz not null default now(),
  last_seen_at     timestamptz not null default now(),
  closed_at        timestamptz,                  -- set when the posting disappears from its board
  unique (source, external_id)
);

create index job_postings_board_idx on public.job_postings (board_id);
create index job_postings_open_fresh_idx on public.job_postings (first_seen_at desc) where closed_at is null;

alter table public.job_postings enable row level security;

create policy "job_postings: signed-in users can read"
  on public.job_postings for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- The flywheel: when someone pastes or imports a Greenhouse, Lever or Ashby link,
-- the app registers that company's board so the pipeline starts reading it.
-- Takes up to 50 boards like [{"ats":"lever","slug":"acme","region":"eu"}]; ignores
-- anything malformed and boards already known. Returns how many were new.
-- ---------------------------------------------------------------------------
create function public.register_job_boards(boards jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  b jsonb;
  added integer := 0;
  n integer;
begin
  if auth.uid() is null or jsonb_typeof(boards) <> 'array' then
    return 0;
  end if;
  for b in select value from jsonb_array_elements(boards) limit 50 loop
    if b ->> 'ats' in ('greenhouse', 'lever', 'ashby')
       and (b ->> 'slug') ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$'
       and coalesce(b ->> 'region', 'eu') = 'eu' then
      insert into public.job_boards (ats, slug, region, added_via)
      values ((b ->> 'ats')::public.ats_kind, b ->> 'slug', b ->> 'region', 'user')
      on conflict (ats, lower(slug)) do nothing;
      get diagnostics n = row_count;
      added := added + n;
    end if;
  end loop;
  return added;
end;
$$;

revoke all on function public.register_job_boards(jsonb) from public, anon;
grant execute on function public.register_job_boards(jsonb) to authenticated;
