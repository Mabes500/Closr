-- Interviews: one row per interview round for an application.
-- RLS matches the other tables; users can only see and change their own rows.

create type public.interview_format as enum ('video', 'phone', 'onsite');

create type public.interview_outcome as enum ('pending', 'passed', 'failed', 'cancelled');

create table public.interviews (
  id              uuid primary key default gen_random_uuid(),
  application_id  uuid not null references public.applications (id) on delete cascade,
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  round_name      text not null check (char_length(round_name) between 1 and 200),
  scheduled_at    timestamptz not null,
  format          public.interview_format,
  interviewer     text,
  notes           text,
  outcome         public.interview_outcome not null default 'pending',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index interviews_user_scheduled_idx on public.interviews (user_id, scheduled_at);
create index interviews_application_idx on public.interviews (application_id, scheduled_at);

alter table public.interviews enable row level security;

create policy "interviews: read own"   on public.interviews for select using (user_id = auth.uid());
create policy "interviews: insert own" on public.interviews for insert with check (
  user_id = auth.uid()
  and exists (select 1 from public.applications a where a.id = application_id and a.user_id = auth.uid())
);
create policy "interviews: update own" on public.interviews for update using (user_id = auth.uid()) with check (
  user_id = auth.uid()
  and exists (select 1 from public.applications a where a.id = application_id and a.user_id = auth.uid())
);
create policy "interviews: delete own" on public.interviews for delete using (user_id = auth.uid());

create trigger interviews_set_updated_at before update on public.interviews for each row execute function public.set_updated_at();

-- Log each new interview on the application's timeline (the 'interview' event type
-- already exists), so the future timeline and Goals features can see it.
create function public.log_interview_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.application_events (application_id, user_id, type, note, occurred_at)
  values (new.application_id, new.user_id, 'interview', new.round_name, new.scheduled_at);
  return new;
end;
$$;

create trigger interviews_log_event
  after insert on public.interviews
  for each row execute function public.log_interview_event();
