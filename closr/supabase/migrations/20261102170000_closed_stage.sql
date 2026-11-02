-- Roadmap 0.2: stages become Saved, Applied, Interviewing, Offer, Closed.
-- Closed always has a reason: Rejected, No response, Withdrew, Declined offer.
--
-- Existing 'rejected' applications become 'closed' with reason 'rejected', and the
-- status history in application_events is converted the same way, so no data is lost.
--
-- Postgres can't use a newly added enum value in the same transaction, and the
-- Supabase SQL editor runs this file as one transaction, so instead of
-- ALTER TYPE ... ADD VALUE we build a new status type, convert the columns to it,
-- and drop the old one. Run this file once.

-- ---------------------------------------------------------------------------
-- New types
-- ---------------------------------------------------------------------------
create type public.close_reason as enum ('rejected', 'no_response', 'withdrew', 'declined_offer');

create type public.application_status_v2 as enum ('saved', 'applied', 'interviewing', 'offer', 'closed');

-- ---------------------------------------------------------------------------
-- applications
-- ---------------------------------------------------------------------------
-- The status-change trigger names the status column, which blocks changing its type.
-- It is recreated below.
drop trigger applications_log_event on public.applications;

alter table public.applications add column close_reason public.close_reason;

-- Record the reason on existing rejected rows without touching updated_at.
alter table public.applications disable trigger applications_set_updated_at;
update public.applications set close_reason = 'rejected' where status = 'rejected';
alter table public.applications enable trigger applications_set_updated_at;

alter table public.applications alter column status drop default;
alter table public.applications
  alter column status type public.application_status_v2
  using (case when status::text = 'rejected' then 'closed' else status::text end)::public.application_status_v2;
alter table public.applications alter column status set default 'applied';

-- A closed application must have a reason, and only closed ones may have one.
alter table public.applications
  add constraint applications_close_reason_matches_status check ((status = 'closed') = (close_reason is not null));

-- ---------------------------------------------------------------------------
-- application_events: keep the timeline consistent with the new stages
-- ---------------------------------------------------------------------------
alter table public.application_events add column close_reason public.close_reason;

update public.application_events set close_reason = 'rejected' where to_status = 'rejected';

alter table public.application_events
  alter column from_status type public.application_status_v2
    using (case when from_status::text = 'rejected' then 'closed' else from_status::text end)::public.application_status_v2,
  alter column to_status type public.application_status_v2
    using (case when to_status::text = 'rejected' then 'closed' else to_status::text end)::public.application_status_v2;

-- ---------------------------------------------------------------------------
-- Swap the types: the new one takes the old name.
-- ---------------------------------------------------------------------------
drop type public.application_status;
alter type public.application_status_v2 rename to application_status;

-- ---------------------------------------------------------------------------
-- Status-change logging now also records why an application was closed.
-- ---------------------------------------------------------------------------
create or replace function public.log_application_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.application_events (application_id, user_id, type, to_status, close_reason)
    values (new.id, new.user_id, 'created', new.status, new.close_reason);
  elsif new.status is distinct from old.status then
    insert into public.application_events (application_id, user_id, type, from_status, to_status, close_reason)
    values (new.id, new.user_id, 'status_change', old.status, new.status, new.close_reason);
  end if;
  return new;
end;
$$;

create trigger applications_log_event
  after insert or update of status on public.applications
  for each row execute function public.log_application_event();
