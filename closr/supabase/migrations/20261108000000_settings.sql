-- Roadmap 7.1: Settings.
-- * Appearance and notification preferences, saved on the profile. Email delivery comes
--   with 7.2; until then the email choices are only remembered.
-- * has_password(): tells the signed-in user whether their account has a password
--   (Google-only accounts don't), which the browser can't otherwise see.

alter table public.profiles
  add column theme text not null default 'light' check (theme in ('light', 'dark', 'system')),
  add column notification_prefs jsonb not null default '{
    "followup":  {"app": true, "email": true},
    "interview": {"app": true, "email": true},
    "reminders": {"app": true, "email": false},
    "checkin":   {"app": true, "email": true},
    "matches":   {"app": true, "email": false},
    "recap":     {"app": true, "email": true}
  }'::jsonb,
  add column quiet_hours  boolean not null default true,
  add column quiet_from   text not null default '22:00' check (quiet_from ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  add column quiet_to     text not null default '07:00' check (quiet_to ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  add column checkin_day  text not null default 'Friday' check (checkin_day in ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  add column checkin_time text not null default '09:00' check (checkin_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

create function public.has_password()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(u.encrypted_password, '') <> '' from auth.users u where u.id = auth.uid()
$$;

revoke all on function public.has_password() from public, anon;
grant execute on function public.has_password() to authenticated;
