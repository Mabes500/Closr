-- Roadmap 4.2: check-ins. Jobs in Applied with no activity for 7+ days are asked
-- "how's it going". Answering "No reply yet" records when, so the question comes back
-- 7 days later instead of straight away. Check-ins also show in the notification bell.

alter table public.applications add column checked_in_at timestamptz;

alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('interview', 'overdue', 'deadline', 'checkin'));
