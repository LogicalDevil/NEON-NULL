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
