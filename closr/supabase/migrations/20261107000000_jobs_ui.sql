-- Roadmap 6.2d (docs/JOBS-FEED-PLAN.md section 5): the Jobs screen.
-- * applications.job_posting_id: the posting a job was saved from, so the board can say
--   "This posting has closed" when it disappears from the employer's board.
-- * "N new matches today" notifications in the bell.

alter table public.applications
  add column job_posting_id uuid references public.job_postings (id) on delete set null;

create index applications_job_posting_idx on public.applications (job_posting_id);

alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('interview', 'overdue', 'deadline', 'checkin', 'streak', 'matches'));
