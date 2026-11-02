-- Roadmap 0.3: new job fields on applications.
-- time zone, visa sponsorship, salary min/max with currency, source (fixed list),
-- interview origin ("What got you this interview?"), next action.
-- Only company and role stay required.

-- Where a job came from / what led to an interview. One list serves both fields.
create type public.job_channel as enum (
  'social',       -- LinkedIn or X post
  'job_board',    -- Job board
  'career_page',  -- Company career page
  'referral',     -- Referral
  'recruiter',    -- Recruiter reached out
  'community',    -- Community (Slack, Discord)
  'other'         -- Other
);

create type public.visa_sponsorship as enum ('yes', 'no', 'not_needed', 'unknown');

alter table public.applications
  add column time_zone         text,
  add column visa_sponsorship  public.visa_sponsorship not null default 'unknown',
  add column salary_min        integer check (salary_min >= 0),   -- whole currency units per year
  add column salary_max        integer check (salary_max >= 0),
  add column salary_currency   text check (salary_currency ~ '^[A-Z]{3}$'),  -- ISO 4217, e.g. GBP
  add column interview_origin  public.job_channel,
  add column next_action       text,
  add constraint applications_salary_range check (salary_min is null or salary_max is null or salary_max >= salary_min);

-- source was free text. Keep what people typed in source_detail and sort it into the fixed list.
alter table public.applications rename column source to source_detail;
alter table public.applications add column source public.job_channel;

-- Backfill without touching updated_at.
alter table public.applications disable trigger applications_set_updated_at;
update public.applications
set source = case
  when source_detail ~* 'referr'                                                     then 'referral'
  when source_detail ~* 'recruit|headhunt'                                           then 'recruiter'
  when source_detail ~* 'slack|discord|community|meetup'                             then 'community'
  when source_detail ~* 'linkedin|twitter|x\.com|^x$|^x post|tweet'                  then 'social'
  when source_detail ~* 'career|company|greenhouse|lever|ashby|workable|workday'     then 'career_page'
  when source_detail ~* 'indeed|wellfound|angel|glassdoor|board|remotive|remote ?ok|otta|monster|ziprecruiter|weworkremotely'
                                                                                     then 'job_board'
  else 'other'
end::public.job_channel
where nullif(trim(source_detail), '') is not null;
alter table public.applications enable trigger applications_set_updated_at;
