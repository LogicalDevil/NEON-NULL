-- Run once in your Supabase SQL Editor. No secret keys belong in the game.
create table if not exists public.neon_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  constraint neon_save_size check (octet_length(data::text) <= 131072),
  constraint neon_save_shape check (data->>'schema' = '1' and jsonb_typeof(data->'values') = 'object')
);
alter table public.neon_saves enable row level security;
revoke all on public.neon_saves from anon;
grant select, insert, update on public.neon_saves to authenticated;
drop policy if exists neon_owner_select on public.neon_saves;
drop policy if exists neon_owner_insert on public.neon_saves;
drop policy if exists neon_owner_update on public.neon_saves;
create policy neon_owner_select on public.neon_saves for select to authenticated using ((select auth.uid()) = user_id);
create policy neon_owner_insert on public.neon_saves for insert to authenticated with check ((select auth.uid()) = user_id);
create policy neon_owner_update on public.neon_saves for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Atomic compare-and-write. A stale device cannot silently overwrite a newer save.
create or replace function public.save_neon_progress(expected_revision bigint, save_data jsonb)
returns table(revision bigint)
language plpgsql security invoker set search_path = public
as $$
declare new_revision bigint;
begin
  if auth.uid() is null then raise insufficient_privilege using message = 'Sign in required'; end if;
  if expected_revision < 0 or expected_revision is null then raise exception 'Invalid revision'; end if;
  if save_data is null or save_data->>'schema' is distinct from '1'
      or jsonb_typeof(save_data->'values') is distinct from 'object'
      or octet_length(save_data::text) > 131072 then raise exception 'Invalid save payload'; end if;
  if expected_revision = 0 then
    insert into public.neon_saves(user_id,data,revision) values(auth.uid(),save_data,1)
    on conflict(user_id) do nothing returning neon_saves.revision into new_revision;
  else
    update public.neon_saves as s set data=save_data, revision=s.revision+1, updated_at=now()
    where s.user_id=auth.uid() and s.revision=expected_revision
    returning s.revision into new_revision;
  end if;
  if new_revision is null then raise sqlstate 'PT409' using message='Save changed on another device'; end if;
  return query select new_revision;
end $$;
revoke all on function public.save_neon_progress(bigint,jsonb) from public, anon;
grant execute on function public.save_neon_progress(bigint,jsonb) to authenticated;


-- Paste ALL of this SQL into Supabase SQL Editor, then click Run.
-- Adds usernames without changing existing saves or accounts.
begin;
create table if not exists public.neon_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z][A-Za-z0-9_]{2,19}$'),
  updated_at timestamptz not null default now()
);
create unique index if not exists neon_profiles_username_unique
  on public.neon_profiles (lower(username));
alter table public.neon_profiles enable row level security;
revoke all on public.neon_profiles from public, anon;
grant select, insert, update on public.neon_profiles to authenticated;
drop policy if exists neon_profile_read on public.neon_profiles;
drop policy if exists neon_profile_create on public.neon_profiles;
drop policy if exists neon_profile_change on public.neon_profiles;
create policy neon_profile_read on public.neon_profiles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy neon_profile_create on public.neon_profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy neon_profile_change on public.neon_profiles for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Exposes availability only, never email addresses or account IDs.
create or replace function public.neon_username_available(candidate text)
returns boolean language sql stable security definer set search_path = ''
as $$
  select coalesce(candidate ~ '^[A-Za-z][A-Za-z0-9_]{2,19}$',false)
    and not exists (
      select 1 from public.neon_profiles as p where lower(p.username)=lower(candidate)
    );
$$;
revoke all on function public.neon_username_available(text) from public;
grant execute on function public.neon_username_available(text) to anon, authenticated;

create or replace function public.set_neon_username(candidate text)
returns table(username text) language plpgsql security invoker set search_path = ''
as $$
begin
  if auth.uid() is null then raise insufficient_privilege using message='Sign in required'; end if;
  if candidate is null or candidate !~ '^[A-Za-z][A-Za-z0-9_]{2,19}$' then
    raise exception 'Username must be 3-20 letters, numbers or underscores, starting with a letter';
  end if;
  return query
    insert into public.neon_profiles as p(user_id,username)
      values(auth.uid(),candidate)
      on conflict(user_id) do update set username=excluded.username,updated_at=now()
      returning p.username;
end;
$$;
revoke all on function public.set_neon_username(text) from public, anon;
grant execute on function public.set_neon_username(text) to authenticated;

-- A signup and its username reservation succeed or fail together.
create or replace function public.neon_profile_on_signup()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.raw_user_meta_data->>'username' is not null then
    insert into public.neon_profiles(user_id,username)
      values(new.id,new.raw_user_meta_data->>'username');
  end if;
  return new;
end;
$$;
revoke all on function public.neon_profile_on_signup() from public, anon, authenticated;
drop trigger if exists neon_profile_signup on auth.users;
create trigger neon_profile_signup after insert on auth.users
  for each row execute function public.neon_profile_on_signup();
commit;
