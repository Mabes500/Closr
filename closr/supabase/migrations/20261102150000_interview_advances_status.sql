-- Adding an interview moves its application to Interviewing, but only forward:
-- Saved or Applied cards move; Interviewing, Offer and Rejected are left alone.
-- The existing status trigger logs the move in application_events as usual.

create function public.advance_application_on_interview()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.applications
  set status = 'interviewing',
      position = extract(epoch from now()) -- top of the column, like a manual move
  where id = new.application_id
    and status in ('saved', 'applied');
  return new;
end;
$$;

create trigger interviews_advance_application
  after insert on public.interviews
  for each row execute function public.advance_application_on_interview();
