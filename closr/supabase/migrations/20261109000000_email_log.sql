-- Roadmap 7.2: email notifications. One row per email item sent, so the hourly job never
-- sends the same thing twice. Written by that job with the service role; no email address
-- or message content is kept here.

create table public.email_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind        text not null check (kind in ('followup', 'interview', 'reminders', 'checkin', 'matches', 'recap')),
  dedupe_key  text not null,
  resend_id   text,
  sent_at     timestamptz not null default now(),
  unique (user_id, dedupe_key)
);

alter table public.email_log enable row level security;

create policy "email_log: read own"   on public.email_log for select using (user_id = auth.uid());
create policy "email_log: insert own" on public.email_log for insert with check (user_id = auth.uid());
create policy "email_log: update own" on public.email_log for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "email_log: delete own" on public.email_log for delete using (user_id = auth.uid());
