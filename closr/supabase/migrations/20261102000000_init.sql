-- Closr initial schema: profiles, applications, application_events.
-- Every table has RLS enabled; users can only see and change their own rows.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.application_status as enum (
  'saved', 'applied', 'interviewing', 'offer', 'rejected'
);

create type public.work_mode as enum ('remote', 'hybrid', 'onsite');

create type public.application_event_type as enum (
  'created', 'status_change', 'interview', 'note'
);

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, created automatically on sign-up
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own"   on public.profiles for select using (id = auth.uid());
create policy "profiles: update own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- applications
-- ---------------------------------------------------------------------------
create table public.applications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  company     text not null check (char_length(company) between 1 and 200),
  role        text not null check (char_length(role) between 1 and 200),
  job_url     text,
  location    text,
  work_mode   public.work_mode,
  status      public.application_status not null default 'applied',
  salary      text,
  source      text,               -- where the posting was found: LinkedIn, referral, company site...
  notes       text,
  applied_at  date,
  position    double precision not null default extract(epoch from now()), -- ordering within a column
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index applications_user_status_idx on public.applications (user_id, status, position);

alter table public.applications enable row level security;

create policy "applications: read own"   on public.applications for select using (user_id = auth.uid());
create policy "applications: insert own" on public.applications for insert with check (user_id = auth.uid());
create policy "applications: update own" on public.applications for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "applications: delete own" on public.applications for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- application_events: timeline of everything that happens to an application.
-- This is also the outcome data the Goals feature will learn from later.
-- ---------------------------------------------------------------------------
create table public.application_events (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.applications (id) on delete cascade,
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  type            public.application_event_type not null,
  from_status     public.application_status,
  to_status       public.application_status,
  note            text,
  occurred_at     timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create index application_events_app_idx on public.application_events (application_id, occurred_at desc);

alter table public.application_events enable row level security;

create policy "events: read own"   on public.application_events for select using (user_id = auth.uid());
create policy "events: insert own" on public.application_events for insert with check (
  user_id = auth.uid()
  and exists (select 1 from public.applications a where a.id = application_id and a.user_id = auth.uid())
);
create policy "events: delete own" on public.application_events for delete using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Triggers: keep updated_at fresh, log creation and status changes automatically
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at     before update on public.profiles     for each row execute function public.set_updated_at();
create trigger applications_set_updated_at before update on public.applications for each row execute function public.set_updated_at();

create function public.log_application_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.application_events (application_id, user_id, type, to_status)
    values (new.id, new.user_id, 'created', new.status);
  elsif new.status is distinct from old.status then
    insert into public.application_events (application_id, user_id, type, from_status, to_status)
    values (new.id, new.user_id, 'status_change', old.status, new.status);
  end if;
  return new;
end;
$$;

create trigger applications_log_event
  after insert or update of status on public.applications
  for each row execute function public.log_application_event();
