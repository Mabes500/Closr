-- Roadmap 3.1: reminders (follow-ups, interviews, deadlines, other).
-- Existing interviews move in as interview reminders with the same id, keeping their
-- round (as the title), format, interviewer, notes and outcome. The interviews table
-- is left untouched (no longer used by the app) so nothing can be lost.

create type public.reminder_type as enum ('follow', 'interview', 'deadline', 'custom');

create table public.reminders (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null default auth.uid() references auth.users (id) on delete cascade,
  application_id      uuid references public.applications (id) on delete cascade,  -- null = not linked to a job
  type                public.reminder_type not null,
  title               text not null check (char_length(title) between 1 and 200),
  due_at              timestamptz not null,
  snoozed_until       timestamptz,          -- when set, the reminder is due then instead of due_at
  notes               text,
  done                boolean not null default false,
  done_at             timestamptz,
  -- Interview details (interview reminders only)
  interview_format    public.interview_format,
  interview_location  text,                 -- meeting link, phone number or address
  interviewer         text,
  interview_outcome   public.interview_outcome,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index reminders_user_due_idx on public.reminders (user_id, done, due_at);
create index reminders_application_idx on public.reminders (application_id);

alter table public.reminders enable row level security;

create policy "reminders: read own"   on public.reminders for select using (user_id = auth.uid());
create policy "reminders: insert own" on public.reminders for insert with check (
  user_id = auth.uid()
  and (application_id is null or exists (select 1 from public.applications a where a.id = application_id and a.user_id = auth.uid()))
);
create policy "reminders: update own" on public.reminders for update using (user_id = auth.uid()) with check (
  user_id = auth.uid()
  and (application_id is null or exists (select 1 from public.applications a where a.id = application_id and a.user_id = auth.uid()))
);
create policy "reminders: delete own" on public.reminders for delete using (user_id = auth.uid());

create trigger reminders_set_updated_at before update on public.reminders for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Move interviews in. Done = has an outcome, or already happened.
-- (Before the triggers below exist, so this doesn't log them a second time.)
-- ---------------------------------------------------------------------------
insert into public.reminders (
  id, user_id, application_id, type, title, due_at, notes, done, done_at,
  interview_format, interviewer, interview_outcome, created_at, updated_at
)
select
  i.id, i.user_id, i.application_id, 'interview', i.round_name, i.scheduled_at, i.notes,
  (i.outcome <> 'pending' or i.scheduled_at < now()),
  case when i.outcome <> 'pending' or i.scheduled_at < now() then least(i.scheduled_at, now()) end,
  i.format, i.interviewer, i.outcome, i.created_at, i.updated_at
from public.interviews i
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- What adding an interview did before, now for interview reminders:
-- log it on the job's timeline, and move Saved/Applied jobs to Interviewing.
-- ---------------------------------------------------------------------------
create function public.on_interview_reminder()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.type = 'interview' and new.application_id is not null then
    insert into public.application_events (application_id, user_id, type, note, occurred_at)
    values (new.application_id, new.user_id, 'interview', new.title, new.due_at);

    update public.applications
    set status = 'interviewing', position = extract(epoch from now())
    where id = new.application_id and status in ('saved', 'applied');
  end if;
  return new;
end;
$$;

create trigger reminders_interview_added
  after insert on public.reminders
  for each row execute function public.on_interview_reminder();

-- ---------------------------------------------------------------------------
-- "Suggest follow-ups": offer a follow-up 7 days after marking a job Applied.
-- ---------------------------------------------------------------------------
alter table public.profiles add column suggest_follow_ups boolean not null default true;
