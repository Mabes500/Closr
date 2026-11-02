-- Roadmap 4.1: CV versions. Label each CV/résumé you send, pick it on a job, and see
-- which version gets responses. Archiving hides a version from pickers but keeps its
-- jobs linked, so its numbers stay right.

create table public.cv_versions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label        text not null check (char_length(label) between 1 and 120),
  format       text check (char_length(format) <= 80),   -- e.g. "US résumé, 1 page"
  notes        text,
  archived_at  timestamptz,                               -- null = in use
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index cv_versions_user_idx on public.cv_versions (user_id, created_at);

alter table public.cv_versions enable row level security;

create policy "cv_versions: read own"   on public.cv_versions for select using (user_id = auth.uid());
create policy "cv_versions: insert own" on public.cv_versions for insert with check (user_id = auth.uid());
create policy "cv_versions: update own" on public.cv_versions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "cv_versions: delete own" on public.cv_versions for delete using (user_id = auth.uid());

create trigger cv_versions_set_updated_at before update on public.cv_versions for each row execute function public.set_updated_at();

-- Which version was sent for each job (empty = not recorded).
alter table public.applications
  add column cv_version_id uuid references public.cv_versions (id) on delete set null;

create index applications_cv_version_idx on public.applications (cv_version_id);

-- A job can only point at one of your own CV versions.
create function public.check_cv_version_owner()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.cv_version_id is not null and not exists (
    select 1 from public.cv_versions c where c.id = new.cv_version_id and c.user_id = new.user_id
  ) then
    raise exception 'CV version not found';
  end if;
  return new;
end;
$$;

create trigger applications_cv_version_owner
  before insert or update of cv_version_id on public.applications
  for each row execute function public.check_cv_version_owner();
