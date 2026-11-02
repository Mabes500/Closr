-- Roadmap 5.1: weekly target and streak.
-- * profiles.time_zone: saved automatically from the browser, so "this week" and
--   "today" follow the user's own clock.
-- * activity_days: one row per day the user touched their search (added a job,
--   changed a stage, edited notes, ticked a reminder, answered a check-in). Written by
--   triggers, so it can't drift from what actually happened. The streak is counted from it.
-- * Streak notifications in the bell.

alter table public.profiles
  add column time_zone text check (time_zone is null or char_length(time_zone) between 1 and 64);

create table public.activity_days (
  user_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day      date not null,                 -- in the user's own time zone
  primary key (user_id, day)
);

alter table public.activity_days enable row level security;

create policy "activity_days: read own"   on public.activity_days for select using (user_id = auth.uid());
create policy "activity_days: insert own" on public.activity_days for insert with check (user_id = auth.uid());
create policy "activity_days: update own" on public.activity_days for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "activity_days: delete own" on public.activity_days for delete using (user_id = auth.uid());

-- Today's date for a user, in their saved time zone (UTC if unknown or not a real zone).
create function public.user_today(uid uuid)
returns date
language sql
stable
security definer
set search_path = ''
as $$
  select (now() at time zone coalesce(
    (select n.name from pg_catalog.pg_timezone_names n join public.profiles p on p.time_zone = n.name where p.id = uid limit 1),
    'UTC'
  ))::date
$$;

-- Records today as an active day for the row's owner.
create function public.mark_active_day()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.activity_days (user_id, day)
  values (new.user_id, public.user_today(new.user_id))
  on conflict do nothing;
  return new;
end;
$$;

revoke all on function public.user_today(uuid) from public, anon, authenticated;
revoke all on function public.mark_active_day() from public, anon, authenticated;

-- Job added.
create trigger applications_active_on_insert
  after insert on public.applications
  for each row execute function public.mark_active_day();

-- Stage changed, notes edited, or a check-in answered.
create trigger applications_active_on_update
  after update of status, notes, checked_in_at on public.applications
  for each row
  when (old.status is distinct from new.status
        or old.notes is distinct from new.notes
        or old.checked_in_at is distinct from new.checked_in_at)
  execute function public.mark_active_day();

-- Reminder ticked done.
create trigger reminders_active_on_done
  after update of done on public.reminders
  for each row
  when (new.done and not old.done)
  execute function public.mark_active_day();

-- Fill in past activity (in UTC, as time zones weren't saved before).
insert into public.activity_days (user_id, day)
select user_id, (created_at at time zone 'UTC')::date from public.applications
union
select user_id, (created_at at time zone 'UTC')::date from public.application_events
union
select user_id, (done_at at time zone 'UTC')::date from public.reminders where done and done_at is not null and done_at <= now()
on conflict do nothing;

-- Streak notifications.
alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('interview', 'overdue', 'deadline', 'checkin', 'streak'));
