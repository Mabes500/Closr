-- Roadmap 3.3: in-app notifications (the bell).
-- The app creates these itself when it loads, from your reminders: interviews in the
-- next 24 hours, follow-ups that are due or overdue, and deadlines due within 24 hours
-- or overdue. `dedupe_key` is unique per user, so the same nudge is never created twice
-- (snoozing or moving a reminder gives it a new key, so you get one fresh nudge).
-- No email and no scheduled jobs yet (email is roadmap 7.2).

create table public.notifications (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind            text not null check (kind in ('interview', 'overdue', 'deadline')),
  reminder_id     uuid references public.reminders (id) on delete cascade,
  application_id  uuid references public.applications (id) on delete cascade,
  title           text not null check (char_length(title) between 1 and 300),
  body            text not null default '',
  dedupe_key      text not null,
  read_at         timestamptz,          -- null = unread
  cleared_at      timestamptz,          -- "Clear all" hides it but keeps the key, so it isn't recreated
  created_at      timestamptz not null default now(),
  unique (user_id, dedupe_key)
);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications: read own"   on public.notifications for select using (user_id = auth.uid());
create policy "notifications: insert own" on public.notifications for insert with check (
  user_id = auth.uid()
  and (reminder_id is null or exists (select 1 from public.reminders r where r.id = reminder_id and r.user_id = auth.uid()))
  and (application_id is null or exists (select 1 from public.applications a where a.id = application_id and a.user_id = auth.uid()))
);
create policy "notifications: update own" on public.notifications for update using (user_id = auth.uid()) with check (
  user_id = auth.uid()
  and (reminder_id is null or exists (select 1 from public.reminders r where r.id = reminder_id and r.user_id = auth.uid()))
  and (application_id is null or exists (select 1 from public.applications a where a.id = application_id and a.user_id = auth.uid()))
);
create policy "notifications: delete own" on public.notifications for delete using (user_id = auth.uid());
