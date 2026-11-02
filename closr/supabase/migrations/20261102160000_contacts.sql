-- Contacts: people met during the search (recruiters, hiring managers, referrers),
-- and a join table so one contact can be linked to several applications.
-- RLS matches the other tables; users can only see and change their own rows.

-- ---------------------------------------------------------------------------
-- contacts
-- ---------------------------------------------------------------------------
create table public.contacts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name               text not null check (char_length(name) between 1 and 200),
  company            text,
  title              text,
  email              text,
  linkedin_url       text,
  notes              text,
  last_contacted_at  date,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index contacts_user_name_idx on public.contacts (user_id, name);

alter table public.contacts enable row level security;

create policy "contacts: read own"   on public.contacts for select using (user_id = auth.uid());
create policy "contacts: insert own" on public.contacts for insert with check (user_id = auth.uid());
create policy "contacts: update own" on public.contacts for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "contacts: delete own" on public.contacts for delete using (user_id = auth.uid());

create trigger contacts_set_updated_at before update on public.contacts for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- application_contacts: which contacts are linked to which applications.
-- Deleting either side removes the link.
-- ---------------------------------------------------------------------------
create table public.application_contacts (
  application_id  uuid not null references public.applications (id) on delete cascade,
  contact_id      uuid not null references public.contacts (id) on delete cascade,
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (application_id, contact_id)
);

create index application_contacts_contact_idx on public.application_contacts (contact_id);

alter table public.application_contacts enable row level security;

-- Links are only created or removed, never edited, so there is no update policy.
create policy "application_contacts: read own"   on public.application_contacts for select using (user_id = auth.uid());
create policy "application_contacts: insert own" on public.application_contacts for insert with check (
  user_id = auth.uid()
  and exists (select 1 from public.applications a where a.id = application_id and a.user_id = auth.uid())
  and exists (select 1 from public.contacts c where c.id = contact_id and c.user_id = auth.uid())
);
create policy "application_contacts: delete own" on public.application_contacts for delete using (user_id = auth.uid());
