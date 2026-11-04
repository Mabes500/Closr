-- A fresher, on-time jobs feed and on-time emails.
-- * content_hash: a fingerprint of each posting as the employer lists it, so a run only rewrites
--   postings that actually changed. Rewriting all of them every run wastes database space.
-- * Supabase Cron starts the GitHub Actions jobs on time, because GitHub's own schedule can run
--   hours late. It needs a GitHub token saved in Supabase Vault as "github_actions_token"; until
--   that exists, these jobs quietly do nothing. The token is never stored in this file.

alter table public.job_postings add column content_hash text;

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- A schema the app's API doesn't expose, so only the database itself can call this.
create schema if not exists ops;
revoke all on schema ops from public, anon, authenticated;

create or replace function ops.run_workflow(workflow text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  token text;
begin
  select decrypted_secret into token from vault.decrypted_secrets where name = 'github_actions_token' limit 1;
  if token is null then
    return;
  end if;
  perform net.http_post(
    url := 'https://api.github.com/repos/Mabes500/Closr/actions/workflows/' || workflow || '/dispatches',
    body := jsonb_build_object('ref', 'main'),
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || token,
      'Accept', 'application/vnd.github+json',
      'X-GitHub-Api-Version', '2022-11-28',
      'User-Agent', 'closr-supabase-cron',
      'Content-Type', 'application/json'
    )
  );
end;
$$;

revoke all on function ops.run_workflow(text) from public, anon, authenticated;

select cron.schedule('closr-jobs-feed', '30 */3 * * *', $$select ops.run_workflow('jobs-feed.yml')$$);
select cron.schedule('closr-email-notifications', '7 * * * *', $$select ops.run_workflow('email-notifications.yml')$$);
