-- Roadmap 6.2b (docs/JOBS-FEED-PLAN.md section 3, step 4): enrichment.
-- Fills what matching (6.2c) needs but the ATS doesn't say: the catalogue role and its
-- category (src/data/roles.ts), seniority, visa sponsorship, and remote limits.
-- Rules fill what they can for every new posting; Claude Haiku reads the description for
-- whatever is still unknown, only for postings in role categories someone targets, within
-- a per-run cost cap. Written only by the pipeline, like the rest of job_postings.

alter table public.job_postings
  add column role_category      text,                  -- a key of ROLE_CATEGORY_LABEL, e.g. 'tech'
  add column role_title         text,                  -- the catalogue title it matches, e.g. 'Backend engineer'
  add column seniority          text check (seniority in ('intern', 'junior', 'mid', 'senior', 'staff', 'principal', 'lead', 'manager', 'director', 'executive')),
  add column visa_sponsorship   text check (visa_sponsorship in ('yes', 'no', 'not_stated')),
  add column remote_regions     text[] not null default '{}',  -- where a remote job is open: worldwide, europe, emea, americas...
  add column remote_countries   text[] not null default '{}',  -- ISO codes a remote job is limited to, e.g. {US,CA}
  add column timezone_note      text check (char_length(timezone_note) <= 120),  -- e.g. 'UTC-5 to UTC+1'
  add column enriched_at        timestamptz,           -- rules pass done
  add column ai_checked_at      timestamptz,           -- Claude pass done (or not needed)
  add column enrichment_source  text check (enrichment_source in ('rules', 'ai'));

-- The two passes find their work with these.
create index job_postings_needs_rules_idx on public.job_postings (first_seen_at) where enriched_at is null;
create index job_postings_needs_ai_idx on public.job_postings (first_seen_at desc) where ai_checked_at is null and closed_at is null;
