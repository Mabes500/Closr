-- Roadmap 2.2: spreadsheet import.
-- 1. Every imported row carries the id of its import, so "Undo import" deletes exactly
--    that batch (deleting an application also deletes its history, via the FK cascade).
-- 2. An imported job's "created" history entry is dated on its applied date, not on
--    the day it was imported, so the timeline shows when the user really applied.

alter table public.applications add column import_id uuid;

create index applications_import_idx on public.applications (user_id, import_id) where import_id is not null;

-- Same as before (roadmap 0.2), except the INSERT entry's date for imported rows.
-- Noon UTC keeps the date the same in every time zone the app is used in.
create or replace function public.log_application_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.application_events (application_id, user_id, type, to_status, close_reason, occurred_at)
    values (
      new.id, new.user_id, 'created', new.status, new.close_reason,
      case
        when new.import_id is not null and new.applied_at is not null
          then (new.applied_at + time '12:00') at time zone 'UTC'
        else now()
      end
    );
  elsif new.status is distinct from old.status then
    insert into public.application_events (application_id, user_id, type, from_status, to_status, close_reason)
    values (new.id, new.user_id, 'status_change', old.status, new.status, new.close_reason);
  end if;
  return new;
end;
$$;
