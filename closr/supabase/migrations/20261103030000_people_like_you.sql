-- Roadmap 5.3: "People like you". For other users with a similar target role, which
-- sources led to interviews and offers in the last 12 months.
--
-- Privacy:
-- * Returns totals only, never rows: no names, companies, jobs or user ids.
-- * Returns nothing at all unless the group has at least 20 different users (not
--   counting you), so no one's numbers can be picked out of a small group.
-- * A source used by fewer than 5 of those users is folded into "other".
-- * Runs with elevated rights only to count across users; callers can't pass it a user,
--   it always compares against the signed-in user's own target roles.

create function public.people_like_you()
returns table (source text, interviews bigint, offers bigint, peers bigint)
language sql
stable
security definer
set search_path = ''
as $$
  with me as (
    select array(select lower(trim(r)) from unnest(p.target_roles) r where trim(r) <> '') as roles
    from public.profiles p
    where p.id = auth.uid()
  ),
  peers as (
    select p.id
    from public.profiles p, me
    where p.id <> auth.uid()
      and cardinality(me.roles) > 0
      and exists (select 1 from unnest(p.target_roles) r where lower(trim(r)) = any (me.roles))
      and exists (select 1 from public.applications a where a.user_id = p.id and a.status <> 'saved')
  ),
  group_size as (
    select count(*) as n from peers
  ),
  outcomes as (
    select
      a.user_id,
      coalesce(a.interview_origin, a.source)::text as src,
      (a.status in ('interviewing', 'offer') or exists (
        select 1 from public.application_events e where e.application_id = a.id and e.to_status in ('interviewing', 'offer')
      )) as interviewed,
      (a.status = 'offer' or exists (
        select 1 from public.application_events e where e.application_id = a.id and e.to_status = 'offer'
      )) as offered
    from public.applications a
    join peers on peers.id = a.user_id
    where a.status <> 'saved'
      and a.created_at > now() - interval '12 months'
      and coalesce(a.interview_origin, a.source) is not null
  ),
  by_source as (
    select
      src,
      count(*) filter (where interviewed) as interviews,
      count(*) filter (where offered) as offers,
      count(distinct user_id) as users
    from outcomes
    group by src
  )
  select
    case when b.users >= 5 then b.src else 'other' end as source,
    sum(b.interviews)::bigint as interviews,
    sum(b.offers)::bigint as offers,
    g.n as peers
  from by_source b
  cross join group_size g
  where g.n >= 20
  group by 1, g.n
$$;

revoke all on function public.people_like_you() from public, anon;
grant execute on function public.people_like_you() to authenticated;
