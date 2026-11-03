-- NEON//NULL social migration. Run the complete file in Supabase SQL Editor.
-- Requires the existing neon_profiles username migration. Preserves saves/profiles.
begin;

create table if not exists public.neon_social_settings (
 user_id uuid primary key references auth.users(id) on delete cascade,
 discoverable boolean not null default true,
 requests boolean not null default true,
 online boolean not null default false
);
create table if not exists public.neon_social_pairs (
 user_lo uuid not null references auth.users(id) on delete cascade,
 user_hi uuid not null references auth.users(id) on delete cascade,
 requester uuid not null references auth.users(id) on delete cascade,
 status text not null check(status in ('pending','accepted','inactive')),
 updated_at timestamptz not null default now(),
 primary key(user_lo,user_hi),
 check(user_lo < user_hi),check(requester in (user_lo,user_hi))
);
create index if not exists neon_social_pairs_hi on public.neon_social_pairs(user_hi,status);
create index if not exists neon_social_pairs_lo_status on public.neon_social_pairs(user_lo,status);
create table if not exists public.neon_social_blocks (
 user_id uuid not null references auth.users(id) on delete cascade,
 target uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),primary key(user_id,target),check(user_id<>target)
);
create index if not exists neon_social_blocks_target on public.neon_social_blocks(target,user_id);
create table if not exists public.neon_social_messages (
 id bigint generated always as identity primary key,
 user_lo uuid not null,user_hi uuid not null,
 sender_id uuid not null references auth.users(id) on delete cascade,
 nonce uuid not null,body text not null check(char_length(body) between 1 and 1000),
 created_at timestamptz not null default clock_timestamp(),
 foreign key(user_lo,user_hi) references public.neon_social_pairs(user_lo,user_hi) on delete cascade,
 check(sender_id in (user_lo,user_hi)),unique(sender_id,nonce)
);
create index if not exists neon_social_messages_pair_id on public.neon_social_messages(user_lo,user_hi,id desc);
create table if not exists public.neon_social_reads (
 user_id uuid not null references auth.users(id) on delete cascade,
 target uuid not null references auth.users(id) on delete cascade,
 through_id bigint not null default 0 check(through_id>=0),primary key(user_id,target),check(user_id<>target)
);
create table if not exists public.neon_social_invites (
 id uuid primary key default gen_random_uuid(),
 sender_id uuid not null references auth.users(id) on delete cascade,
 target uuid not null references auth.users(id) on delete cascade,
 code text not null check(code ~ '^[A-F0-9]{6}$'),
 version text not null check(char_length(version) between 1 and 32),
 status text not null default 'pending' check(status in ('pending','accepted','declined','cancelled')),
 created_at timestamptz not null default now(),expires_at timestamptz not null default(now()+interval '5 minutes'),
 check(sender_id<>target)
);
create index if not exists neon_social_invites_recipient on public.neon_social_invites(target,status,expires_at);
create index if not exists neon_social_invites_pair on public.neon_social_invites(least(sender_id,target),greatest(sender_id,target),status);
create table if not exists public.neon_social_reports (
 id bigint generated always as identity primary key,
 reporter uuid not null references auth.users(id) on delete cascade,
 target uuid not null references auth.users(id) on delete cascade,
 message_id bigint references public.neon_social_messages(id) on delete set null,
 reason text not null check(reason in ('spam','harassment','inappropriate','other')),
 created_at timestamptz not null default now(),check(reporter<>target)
);
create table if not exists public.neon_social_limits (
 user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null,window_at timestamptz not null,count integer not null,
 primary key(user_id,kind)
);
create index if not exists neon_profiles_search_prefix on public.neon_profiles(lower(username) text_pattern_ops,user_id);

-- Direct reads/writes are denied, including reports and rate counters.
-- Only the explicit authenticated RPC below can access the social tables.
do $$ declare t text;begin
 foreach t in array array['neon_social_settings','neon_social_pairs','neon_social_blocks','neon_social_messages','neon_social_reads','neon_social_invites','neon_social_reports','neon_social_limits'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public, anon, authenticated',t);
 end loop;
end $$;
revoke all on sequence public.neon_social_messages_id_seq,public.neon_social_reports_id_seq from public,anon,authenticated;

create or replace function public.neon_social_limited(who uuid,bucket text,maximum integer)
returns void language plpgsql security definer set search_path='' as $$
declare attempts integer;
begin
 insert into public.neon_social_limits as l(user_id,kind,window_at,count)
 values(who,bucket,clock_timestamp(),1)
 on conflict(user_id,kind) do update set
 count=case when l.window_at < clock_timestamp()-interval '1 minute' then 1 else l.count+1 end,
 window_at=case when l.window_at < clock_timestamp()-interval '1 minute' then clock_timestamp() else l.window_at end
 returning count into attempts;
 if attempts>maximum then raise exception 'Too many % actions. Please wait up to 60 seconds.',bucket using errcode='P0001';end if;
end $$;
revoke all on function public.neon_social_limited(uuid,text,integer) from public,anon,authenticated;

create or replace function public.neon_social(action text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 me uuid:=auth.uid();other uuid;lo uuid;hi uuid;rel public.neon_social_pairs%rowtype;
 item public.neon_social_messages%rowtype;inv public.neon_social_invites%rowtype;
 op text;q text;offset_n integer:=0;cursor_id bigint;read_id bigint;nonce_id uuid;
 content text;blocked boolean:=false;accepted boolean:=false;can_send boolean:=false;
 result jsonb;rows jsonb;settings jsonb;total integer;before_id bigint;
begin
 if me is null then raise insufficient_privilege using message='Sign in required';end if;
 if payload is null or jsonb_typeof(payload)<>'object' or octet_length(payload::text)>8192 then raise exception 'Invalid social request';end if;
 if not exists(select 1 from public.neon_profiles p where p.user_id=me) then raise exception 'Choose a username in Accounts & Saves first';end if;
 if action not in ('list','search','friend','messages','send','read','settings','report','invite','respond_invite','relationship','invitation') or action is null then raise exception 'Unknown social action';end if;
 perform public.neon_social_limited(me,case when action='search' then 'search' when action='send' then 'messages' when action in ('list','messages','read','relationship','invitation') then 'reads' when action='friend' and payload->>'operation' in('block','unblock') then 'privacy changes' when action='friend' then 'friend changes' when action in ('invite','respond_invite') then 'invitations' else 'settings and reports' end,
 case when action='search' then 60 when action='send' then 60 when action in ('list','messages','read','relationship','invitation') then 180 when action='friend' and payload->>'operation' in('block','unblock') then 60 when action='friend' then 20 when action in ('invite','respond_invite') then 20 else 20 end);
 insert into public.neon_social_settings(user_id) values(me) on conflict do nothing;

 if action='settings' then
  if (payload ? 'discoverable' and jsonb_typeof(payload->'discoverable')<>'boolean') or (payload ? 'requests' and jsonb_typeof(payload->'requests')<>'boolean') or (payload ? 'online' and jsonb_typeof(payload->'online')<>'boolean') then raise exception 'Settings must be true or false';end if;
  update public.neon_social_settings s set discoverable=coalesce((payload->>'discoverable')::boolean,s.discoverable),requests=coalesce((payload->>'requests')::boolean,s.requests),online=coalesce((payload->>'online')::boolean,s.online) where s.user_id=me;
  select to_jsonb(s)-'user_id' into settings from public.neon_social_settings s where s.user_id=me;return jsonb_build_object('settings',settings);
 end if;

 if action='list' then
  offset_n:=greatest(0,least(1000,coalesce((payload->>'offset')::integer,0)));
  select to_jsonb(s)-'user_id' into settings from public.neon_social_settings s where s.user_id=me;
  select coalesce(jsonb_agg(x.entry order by x.name,x.id),'[]'::jsonb) into rows from(
   select p.user_id as id,lower(p.username) as name,jsonb_build_object('id',p.user_id,'username',p.username,'status','friends','unread',(select count(*) from public.neon_social_messages m where m.user_lo=f.user_lo and m.user_hi=f.user_hi and m.sender_id<>me and m.id>coalesce((select r.through_id from public.neon_social_reads r where r.user_id=me and r.target=p.user_id),0))) entry
   from public.neon_social_pairs f join public.neon_profiles p on p.user_id=case when f.user_lo=me then f.user_hi else f.user_lo end
   where me in(f.user_lo,f.user_hi) and f.status='accepted' and not exists(select 1 from public.neon_social_blocks b where(b.user_id=me and b.target=p.user_id)or(b.user_id=p.user_id and b.target=me))
   order by lower(p.username),p.user_id limit 50 offset offset_n)x;
  select count(*) into total from public.neon_social_pairs f where me in(f.user_lo,f.user_hi) and f.status='accepted';
  result:=jsonb_build_object('friends',rows,'friendsHasMore',total>offset_n+50,'offset',offset_n,'settings',settings);
  select coalesce(jsonb_agg(jsonb_build_object('id',p.user_id,'username',p.username,'status','incoming') order by lower(p.username)),'[]'::jsonb) into rows from public.neon_social_pairs f join public.neon_profiles p on p.user_id=f.requester where me in(f.user_lo,f.user_hi) and f.status='pending' and f.requester<>me;
  result:=result||jsonb_build_object('incoming',rows);
  select coalesce(jsonb_agg(jsonb_build_object('id',p.user_id,'username',p.username,'status','outgoing') order by lower(p.username)),'[]'::jsonb) into rows from public.neon_social_pairs f join public.neon_profiles p on p.user_id=case when f.user_lo=me then f.user_hi else f.user_lo end where me in(f.user_lo,f.user_hi) and f.status='pending' and f.requester=me;
  result:=result||jsonb_build_object('outgoing',rows);
  select coalesce(jsonb_agg(jsonb_build_object('id',p.user_id,'username',p.username,'status','blocked') order by lower(p.username)),'[]'::jsonb) into rows from public.neon_social_blocks b join public.neon_profiles p on p.user_id=b.target where b.user_id=me;
  result:=result||jsonb_build_object('blocked',rows);
  select coalesce(jsonb_agg(x.entry order by x.created_at desc),'[]'::jsonb) into rows from(select i.created_at,jsonb_build_object('id',i.id,'sender_id',i.sender_id,'username',p.username,'code',i.code,'version',i.version,'expires_at',i.expires_at,'status',i.status) entry from public.neon_social_invites i join public.neon_profiles p on p.user_id=i.sender_id where i.target=me and i.status='pending' and i.expires_at>now() and exists(select 1 from public.neon_social_pairs f where f.user_lo=least(me,i.sender_id) and f.user_hi=greatest(me,i.sender_id) and f.status='accepted') and not exists(select 1 from public.neon_social_blocks b where(b.user_id=me and b.target=i.sender_id)or(b.user_id=i.sender_id and b.target=me)) order by i.created_at desc limit 20)x;
  result:=result||jsonb_build_object('invites',rows);
  select coalesce(jsonb_agg(x.entry order by x.last_id desc),'[]'::jsonb) into rows from(
   select latest.id last_id,jsonb_build_object('id',p.user_id,'username',p.username,'status','archived','unread',0) entry
   from public.neon_social_pairs f join public.neon_profiles p on p.user_id=case when f.user_lo=me then f.user_hi else f.user_lo end join lateral(select m.id from public.neon_social_messages m where m.user_lo=f.user_lo and m.user_hi=f.user_hi order by m.id desc limit 1) latest on true
   where me in(f.user_lo,f.user_hi) and f.status='inactive' and not exists(select 1 from public.neon_social_blocks b where(b.user_id=me and b.target=p.user_id)or(b.user_id=p.user_id and b.target=me))
   order by latest.id desc limit 50)x;
  return result||jsonb_build_object('history',rows);
 end if;

 if action='search' then
  q:=lower(btrim(coalesce(payload->>'query','')));if char_length(q)<3 or char_length(q)>20 or q!~'^[a-z0-9_]+$' then raise exception 'Search using 3–20 username characters';end if;
  offset_n:=greatest(0,least(1000,coalesce((payload->>'offset')::integer,0)));
  select coalesce(jsonb_agg(x.entry order by x.exact_match desc,x.prefix_match desc,x.name,x.id),'[]'::jsonb) into rows from(
   select p.user_id id,lower(p.username) name,lower(p.username)=q exact_match,left(lower(p.username),char_length(q))=q prefix_match,jsonb_build_object('id',p.user_id,'username',p.username,'status',case when f.status='accepted' then 'friends' when f.status='pending' and f.requester=me then 'outgoing' when f.status='pending' then 'incoming' else 'none' end) entry
   from public.neon_profiles p left join public.neon_social_settings s on s.user_id=p.user_id left join public.neon_social_pairs f on f.user_lo=least(me,p.user_id) and f.user_hi=greatest(me,p.user_id)
   where p.user_id<>me and coalesce(s.discoverable,true) and position(q in lower(p.username))>0 and not exists(select 1 from public.neon_social_blocks b where(b.user_id=me and b.target=p.user_id)or(b.user_id=p.user_id and b.target=me))
   order by exact_match desc,prefix_match desc,lower(p.username),p.user_id limit 21 offset offset_n)x;
  total:=jsonb_array_length(rows);if total>20 then rows:=rows-20;end if;return jsonb_build_object('profiles',rows,'hasMore',total>20);
 end if;

 if action in('respond_invite','invitation') then
  select * into inv from public.neon_social_invites i where i.id=(payload->>'id')::uuid;
  if not found or me not in(inv.sender_id,inv.target) or (action='respond_invite' and me<>inv.target) then raise insufficient_privilege using message='Invitation unavailable';end if;
  other:=case when me=inv.sender_id then inv.target else inv.sender_id end;
 else other:=(payload->>'target')::uuid;end if;
 if other is null or other=me or not exists(select 1 from public.neon_profiles p where p.user_id=other) then raise exception 'Player unavailable';end if;
 lo:=least(me,other);hi:=greatest(me,other);
 -- Every pair mutation and chat authorization shares this lock, preventing a send
 -- racing an unfriend/block from bypassing the accepted-friend check.
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(lo::text||'/'||hi::text,0));
 select * into rel from public.neon_social_pairs f where f.user_lo=lo and f.user_hi=hi;
 accepted:=coalesce(rel.status='accepted',false);
 blocked:=exists(select 1 from public.neon_social_blocks b where(b.user_id=me and b.target=other)or(b.user_id=other and b.target=me));
 if action='relationship' then return jsonb_build_object('accepted',accepted and not blocked,'blocked',blocked,'joinable',accepted and not blocked and coalesce((select s.online from public.neon_social_settings s where s.user_id=other),false));end if;

 if action='friend' then
  op:=payload->>'operation';
  if op='block' then
   if not exists(select 1 from public.neon_social_blocks b where b.user_id=me and b.target=other) and (select count(*) from public.neon_social_blocks b where b.user_id=me)>=500 then raise exception 'Blocked account limit reached';end if;
   insert into public.neon_social_blocks(user_id,target) values(me,other) on conflict do nothing;
   update public.neon_social_pairs f set status='inactive',updated_at=now() where f.user_lo=lo and f.user_hi=hi;
   update public.neon_social_invites i set status='cancelled' where least(i.sender_id,i.target)=lo and greatest(i.sender_id,i.target)=hi and i.status='pending';return jsonb_build_object('ok',true,'status','blocked');
  elsif op='unblock' then delete from public.neon_social_blocks b where b.user_id=me and b.target=other;return jsonb_build_object('ok',true,'status','none');end if;
  if blocked then raise insufficient_privilege using message='Player unavailable';end if;
  if op='request' then
   if rel.status='accepted' then return jsonb_build_object('ok',true,'status','friends');end if;
   if rel.status='pending' then return jsonb_build_object('ok',true,'status',case when rel.requester=me then 'outgoing' else 'incoming' end);end if;
   if not coalesce((select s.requests and s.discoverable from public.neon_social_settings s where s.user_id=other),true) then raise exception 'This player is not accepting requests';end if;
   perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('social-account/'||lo::text,0));perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('social-account/'||hi::text,0));
   if (select count(*) from public.neon_social_pairs f where me in(f.user_lo,f.user_hi) and f.status='pending' and f.requester=me)>=50 or(select count(*) from public.neon_social_pairs f where other in(f.user_lo,f.user_hi) and f.status='pending' and f.requester<>other)>=50 then raise exception 'Request limit reached. Clear existing requests first.';end if;
   
   if (select count(*) from public.neon_social_pairs f where me in(f.user_lo,f.user_hi) and f.status='accepted')>=500 or(select count(*) from public.neon_social_pairs f where other in(f.user_lo,f.user_hi) and f.status='accepted')>=500 then raise exception 'Friend limit reached';end if;
   insert into public.neon_social_pairs(user_lo,user_hi,requester,status) values(lo,hi,me,'pending') on conflict(user_lo,user_hi) do update set requester=me,status='pending',updated_at=now();return jsonb_build_object('ok',true,'status','outgoing');
  elsif op='accept' then
   if accepted then return jsonb_build_object('ok',true,'status','friends');end if;
   if rel.status is distinct from 'pending' or rel.requester=me then raise insufficient_privilege using message='Only the recipient can accept this request';end if;
   perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('social-account/'||lo::text,0));perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('social-account/'||hi::text,0));
   if (select count(*) from public.neon_social_pairs f where me in(f.user_lo,f.user_hi) and f.status='accepted')>=500 or(select count(*) from public.neon_social_pairs f where other in(f.user_lo,f.user_hi) and f.status='accepted')>=500 then raise exception 'Friend limit reached';end if;
   update public.neon_social_pairs f set status='accepted',updated_at=now() where f.user_lo=lo and f.user_hi=hi;return jsonb_build_object('ok',true,'status','friends');
  elsif op='decline' then
   if rel.status is distinct from 'pending' or rel.requester=me then raise insufficient_privilege using message='Only the recipient can decline this request';end if;
  elsif op='cancel' then
   if rel.status is distinct from 'pending' or rel.requester<>me then raise insufficient_privilege using message='Only the sender can cancel this request';end if;
  elsif op='remove' then
   if not accepted then return jsonb_build_object('ok',true,'status','none');end if;
  else raise exception 'Unknown friend operation';end if;
  update public.neon_social_pairs f set status='inactive',updated_at=now() where f.user_lo=lo and f.user_hi=hi;
  update public.neon_social_invites i set status='cancelled' where least(i.sender_id,i.target)=lo and greatest(i.sender_id,i.target)=hi and i.status='pending';return jsonb_build_object('ok',true,'status','none');
 end if;

 if action='report' then
  if payload->>'reason' not in('spam','harassment','inappropriate','other') or payload->>'reason' is null then raise exception 'Choose a report reason';end if;
  if payload->>'message_id' is not null then
   select * into item from public.neon_social_messages m where m.id=(payload->>'message_id')::bigint and m.user_lo=lo and m.user_hi=hi and m.sender_id=other;
   if not found then raise insufficient_privilege using message='Message unavailable';end if;
  end if;
  insert into public.neon_social_reports(reporter,target,message_id,reason) values(me,other,item.id,payload->>'reason');return jsonb_build_object('ok',true);
 end if;
 if blocked then raise insufficient_privilege using message='Conversation unavailable';end if;

 if action='messages' then
  if rel.status is null then raise insufficient_privilege using message='Accept a friend request before opening chat';end if;
  if payload->>'before' is not null then before_id:=(payload->>'before')::bigint;if before_id<1 then raise exception 'Invalid message cursor';end if;end if;
  select coalesce(jsonb_agg(x.entry order by x.id),'[]'::jsonb) into rows from(
   select m.id,jsonb_build_object('id',m.id::text,'sender_id',m.sender_id,'body',m.body,'created_at',m.created_at,'nonce',m.nonce) entry from public.neon_social_messages m where m.user_lo=lo and m.user_hi=hi and(before_id is null or m.id<before_id) order by m.id desc limit 51)x;
  total:=jsonb_array_length(rows);if total>50 then rows:=rows-0;end if;return jsonb_build_object('messages',rows,'hasMore',total>50,'canSend',accepted);
 elsif action='send' then
  if not accepted then raise insufficient_privilege using message='Only accepted friends can send messages';end if;
  content:=btrim(coalesce(payload->>'body',''),E' \t\r\n');if char_length(content)<1 or char_length(content)>1000 then raise exception 'Messages must contain 1–1000 characters';end if;
  nonce_id:=(payload->>'nonce')::uuid;if nonce_id is null then raise exception 'Message request ID required';end if;
  select * into item from public.neon_social_messages m where m.sender_id=me and m.nonce=nonce_id;
  if found then
   if item.user_lo<>lo or item.user_hi<>hi or item.body<>content then raise exception 'Message request ID already used';end if;
  else insert into public.neon_social_messages(user_lo,user_hi,sender_id,nonce,body) values(lo,hi,me,nonce_id,content) returning * into item;end if;
  return jsonb_build_object('message',jsonb_build_object('id',item.id::text,'sender_id',item.sender_id,'body',item.body,'created_at',item.created_at,'nonce',item.nonce));
 elsif action='read' then
  if rel.status is null then raise insufficient_privilege using message='Conversation unavailable';end if;
  select coalesce(max(m.id),0) into read_id from public.neon_social_messages m where m.user_lo=lo and m.user_hi=hi;
  if payload->>'through' is not null then read_id:=least(read_id,greatest(0,(payload->>'through')::bigint));end if;
  insert into public.neon_social_reads(user_id,target,through_id) values(me,other,read_id) on conflict(user_id,target) do update set through_id=greatest(neon_social_reads.through_id,excluded.through_id);return jsonb_build_object('ok',true);
 end if;

 if action='invite' then
  if not accepted then raise insufficient_privilege using message='Only accepted friends can invite';end if;
  if coalesce(payload->>'code','')!~'^[A-F0-9]{6}$' or char_length(coalesce(payload->>'version','')) not between 1 and 32 then raise exception 'Invalid lobby invitation';end if;
  update public.neon_social_invites i set status='cancelled' where i.sender_id=me and i.target=other and i.status='pending';
  insert into public.neon_social_invites(sender_id,target,code,version) values(me,other,payload->>'code',payload->>'version') returning * into inv;
  return jsonb_build_object('ok',true,'id',inv.id,'expires_at',inv.expires_at);
 elsif action in('respond_invite','invitation') then
  -- Reload after the shared pair lock. A concurrent decline cannot be bypassed.
  select * into inv from public.neon_social_invites i where i.id=(payload->>'id')::uuid for update;
  if not accepted or inv.expires_at<=now() or inv.status in('declined','cancelled') then raise exception 'Invitation expired or unavailable';end if;
  if action='respond_invite' then
   if jsonb_typeof(payload->'accept') is distinct from 'boolean' then raise exception 'Accept or decline the invitation';end if;
   if (payload->>'accept')::boolean then update public.neon_social_invites i set status='accepted' where i.id=inv.id;inv.status:='accepted';
   else update public.neon_social_invites i set status='declined' where i.id=inv.id;return jsonb_build_object('ok',true,'status','declined');end if;
  end if;
  return jsonb_build_object('ok',true,'id',inv.id,'sender_id',inv.sender_id,'target',inv.target,'code',inv.code,'version',inv.version,'status',inv.status,'expires_at',inv.expires_at);
 end if;
 raise exception 'Unknown social action';
end $$;
revoke all on function public.neon_social(text,jsonb) from public,anon;
grant execute on function public.neon_social(text,jsonb) to authenticated;
commit;
