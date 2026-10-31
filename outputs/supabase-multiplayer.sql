-- Optional ranked co-op rewards. Run after supabase-setup.sql.
-- Service-role key stays ONLY on the multiplayer server.
begin;
create table if not exists public.neon_coop_rewards (
  run_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount between 1 and 120),
  claimed boolean not null default false,
  created_at timestamptz not null default now(),
  primary key(run_id,user_id)
);
alter table public.neon_coop_rewards enable row level security;
revoke all on public.neon_coop_rewards from public,anon,authenticated;
grant select,insert on public.neon_coop_rewards to service_role;
grant select on public.neon_coop_rewards to authenticated;
drop policy if exists neon_reward_read on public.neon_coop_rewards;
create policy neon_reward_read on public.neon_coop_rewards for select to authenticated
  using ((select auth.uid())=user_id);

create or replace function public.claim_neon_coop_rewards(expected_revision bigint)
returns integer language plpgsql security definer set search_path=''
as $$
declare saved public.neon_saves%rowtype; earned integer; balance bigint;
begin
  if auth.uid() is null then raise insufficient_privilege; end if;
  select * into saved from public.neon_saves where user_id=auth.uid() for update;
  if not found or saved.revision is distinct from expected_revision then
    raise sqlstate 'PT409' using message='Sync your cloud save before claiming rewards';
  end if;
  with collected as (
    update public.neon_coop_rewards set claimed=true
    where user_id=auth.uid() and claimed=false returning amount
  ) select coalesce(sum(amount),0) into earned from collected;
  if earned=0 then return 0; end if;
  balance=coalesce((saved.data->'values'->>'neonNullMissionScrap')::bigint,0);
  update public.neon_saves set
    data=jsonb_set(saved.data,'{values,neonNullMissionScrap}',to_jsonb(least(1000000000,balance+earned)::text),true),
    revision=saved.revision+1,updated_at=now() where user_id=auth.uid();
  return earned;
end;
$$;
revoke all on function public.claim_neon_coop_rewards(bigint) from public,anon;
grant execute on function public.claim_neon_coop_rewards(bigint) to authenticated;
commit;
