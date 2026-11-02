-- Roadmap 1.1: profile fields used by onboarding (1.2) and the Profile screen (1.3).
-- search stage, target roles, weekly pace, work setups, locations, salary floor and
-- currency, ideal start, onboarded_at.

create type public.search_stage as enum ('starting', 'applying', 'interviewing', 'browsing');

-- ease = 2, steady = 5, push = 10 applications a week (the weekly target is used in Phase 5).
create type public.weekly_pace as enum ('ease', 'steady', 'push');

create type public.ideal_start as enum ('asap', 'months', 'right_fit');

alter table public.profiles
  add column search_stage           public.search_stage,
  add column target_roles           text[] not null default '{}',
  add column weekly_pace            public.weekly_pace not null default 'steady',
  add column work_setups            public.work_mode[] not null default '{}',
  add column locations              text,            -- free text, e.g. "London or remote in the EU"
  add column salary_floor           integer check (salary_floor >= 0),  -- whole currency units per year
  add column salary_floor_currency  text check (salary_floor_currency ~ '^[A-Z]{3}$'),
  add column ideal_start            public.ideal_start,
  add column onboarded_at           timestamptz;    -- null = send to onboarding after sign-in

-- Every account needs a profile row: the app can update profiles but not create them.
-- Rows normally come from the on_auth_user_created trigger; this fills any gaps.
insert into public.profiles (id, full_name, avatar_url)
select u.id,
       coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
       u.raw_user_meta_data ->> 'avatar_url'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- People already using Closr (they have applications) skip onboarding.
update public.profiles p
set onboarded_at = now()
where p.onboarded_at is null
  and exists (select 1 from public.applications a where a.user_id = p.id);
