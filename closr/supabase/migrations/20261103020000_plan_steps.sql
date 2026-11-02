-- Roadmap 5.2: "Your plan this week" on Goals. The steps themselves come from your own
-- data; this only remembers which ones you marked done, per week. Marking one done
-- counts toward your streak.

create table public.plan_steps_done (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  week_start  date not null,               -- Monday, in the user's own time zone
  step        text not null check (step in ('followups', 'saved', 'checkins', 'target')),
  done_at     timestamptz not null default now(),
  primary key (user_id, week_start, step)
);

alter table public.plan_steps_done enable row level security;

create policy "plan_steps_done: read own"   on public.plan_steps_done for select using (user_id = auth.uid());
create policy "plan_steps_done: insert own" on public.plan_steps_done for insert with check (user_id = auth.uid());
create policy "plan_steps_done: update own" on public.plan_steps_done for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "plan_steps_done: delete own" on public.plan_steps_done for delete using (user_id = auth.uid());

create trigger plan_steps_active_on_done
  after insert on public.plan_steps_done
  for each row execute function public.mark_active_day();
