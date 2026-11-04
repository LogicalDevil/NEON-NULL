-- Run after supabase-setup.sql, supabase-usernames.sql and supabase-social.sql.
-- Profiles/presence and recipient case wallets use authenticated RPCs.
-- Gift issuance is restricted to the server's private service_role credential.
begin;
create table if not exists public.neon_profile_cards(
 user_id uuid primary key references auth.users(id) on delete cascade,
 avatar text not null default 'preset:0',description text not null default '',show_scrap boolean not null default true,
 updated_at timestamptz not null default now(),check(char_length(description)<=280),check(octet_length(avatar)<=65536)
);
create table if not exists public.neon_presence(
 user_id uuid primary key references auth.users(id) on delete cascade,
 state text not null check(state in('online','ingame')),mode text not null default '',seen_at timestamptz not null default now()
);
create table if not exists public.neon_case_wallets(
 user_id uuid primary key references auth.users(id) on delete cascade,
 weapon integer not null default 0 check(weapon between 0 and 100000),operator integer not null default 0 check(operator between 0 and 100000)
);
create table if not exists public.neon_case_gifts(
 id uuid primary key,sender_id uuid not null references auth.users(id) on delete cascade,
 target uuid not null references auth.users(id) on delete cascade,kind text not null check(kind in('weapon','operator')),
 quantity integer not null check(quantity between 1 and 100),note text not null default '' check(char_length(note)<=160),
 claimed boolean not null default false,created_at timestamptz not null default now()
);
create index if not exists neon_case_gifts_target on public.neon_case_gifts(target,created_at desc);
create index if not exists neon_case_gifts_sender on public.neon_case_gifts(sender_id,created_at desc);
create table if not exists public.neon_case_catalog(
 id text primary key,kind text not null check(kind in('weapon','operator')),name text not null,rarity text not null,odds numeric not null check(odds>0)
);
create table if not exists public.neon_case_receipts(
 user_id uuid not null references auth.users(id) on delete cascade,nonce uuid not null,
 kind text not null,item_id text not null references public.neon_case_catalog(id),duplicate boolean not null,created_at timestamptz not null default now(),
 primary key(user_id,nonce)
);
do $$ declare t text;begin
 foreach t in array array['neon_profile_cards','neon_presence','neon_case_wallets','neon_case_gifts','neon_case_catalog','neon_case_receipts'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
 end loop;
end $$;

create or replace function public.neon_issue_case_gift(actor uuid,recipient uuid,gift_kind text,amount integer,request_id uuid,gift_note text default '')
returns jsonb language plpgsql security definer set search_path='' as $$
declare existing public.neon_case_gifts%rowtype;total integer;
begin
 if actor is null or recipient is null or request_id is null or gift_kind not in('weapon','operator') or gift_kind is null or amount is null or amount not between 1 and 100 or char_length(coalesce(gift_note,''))>160 then raise exception 'Invalid gift';end if;
 if not exists(select 1 from public.neon_profiles where user_id=actor) or not exists(select 1 from public.neon_profiles where user_id=recipient) then raise exception 'Account unavailable';end if;
 if exists(select 1 from public.neon_social_blocks where(user_id=actor and target=recipient)or(user_id=recipient and target=actor)) then raise exception 'This player cannot receive your gift';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('gift/'||actor::text,0));
 select * into existing from public.neon_case_gifts where id=request_id;
 if found then
  if existing.sender_id<>actor or existing.target<>recipient or existing.kind<>gift_kind or existing.quantity<>amount or existing.note<>coalesce(gift_note,'') then raise exception 'Gift request ID already used';end if;
  return jsonb_build_object('ok',true,'id',existing.id,'duplicate',true);
 end if;
 select coalesce(sum(quantity),0) into total from public.neon_case_gifts where sender_id=actor and created_at>now()-interval '24 hours';
 if total+amount>1000 then raise exception 'Developer gift limit:1000 cases per24hours';end if;
 insert into public.neon_case_gifts(id,sender_id,target,kind,quantity,note) values(request_id,actor,recipient,gift_kind,amount,coalesce(gift_note,''));
 return jsonb_build_object('ok',true,'id',request_id,'duplicate',false);
end $$;
revoke all on function public.neon_issue_case_gift(uuid,uuid,text,integer,uuid,text) from public,anon,authenticated;
grant execute on function public.neon_issue_case_gift(uuid,uuid,text,integer,uuid,text) to service_role;

create or replace function public.neon_profile(action text,payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare me uuid:=auth.uid();other uuid;card public.neon_profile_cards%rowtype;gift public.neon_case_gifts%rowtype;
 saved public.neon_saves%rowtype;receipt public.neon_case_receipts%rowtype;reward public.neon_case_catalog%rowtype;
 avatar_value text;description_value text;progress jsonb;badges jsonb:='["Pilot"]'::jsonb;balance bigint:=0;sharing boolean:=false;
 presence_value text:='hidden';mode_value text:='';rows jsonb;wallet public.neon_case_wallets%rowtype;
 case_kind text;nonce_id uuid;revision_value bigint;owned jsonb;field_name text;duplicate_value boolean;needle numeric;
begin
 if me is null then raise insufficient_privilege using message='Sign in required';end if;
 if payload is null or jsonb_typeof(payload)<>'object' or octet_length(payload::text)>100000 then raise exception 'Invalid profile request';end if;
 if not exists(select 1 from public.neon_profiles where user_id=me) then raise exception 'Choose a username first';end if;
 if action not in('get','update','presence','pulse','inbox','claim','open_case') or action is null then raise exception 'Unknown profile action';end if;
 perform public.neon_social_limited(me,case when action='pulse' then 'presence' when action='open_case' then 'case openings' when action in('update','claim') then 'profile changes' else 'profile reads' end,case when action='pulse' then 12 when action='open_case' then 30 when action in('update','claim') then 30 else 120 end);
 if action='pulse' then
  select coalesce(online,false) into sharing from public.neon_social_settings where user_id=me;
  if not coalesce(sharing,false) or payload->>'state'='offline' then delete from public.neon_presence where user_id=me;
  else
   if coalesce(payload->>'state','') not in('online','ingame') then raise exception 'Invalid presence state';end if;
   insert into public.neon_presence(user_id,state,mode,seen_at) values(me,payload->>'state',left(coalesce(payload->>'mode',''),32),clock_timestamp()) on conflict(user_id) do update set state=excluded.state,mode=excluded.mode,seen_at=excluded.seen_at;
  end if;return jsonb_build_object('ok',true,'sharing',coalesce(sharing,false));
 end if;
 if action='presence' then
  if jsonb_typeof(payload->'targets') is distinct from 'array' or jsonb_array_length(payload->'targets')>50 then raise exception 'Choose up to50 friends';end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',p.user_id,'state',case when not coalesce(s.online,false) then 'hidden' when r.seen_at>now()-interval '90 seconds' then r.state else 'offline' end,'mode',case when s.online and r.seen_at>now()-interval '90 seconds' and r.state='ingame' then r.mode else '' end)),'[]'::jsonb) into rows
  from public.neon_profiles p left join public.neon_social_settings s on s.user_id=p.user_id left join public.neon_presence r on r.user_id=p.user_id
  where p.user_id in(select value::uuid from jsonb_array_elements_text(payload->'targets')) and exists(select 1 from public.neon_social_pairs f where f.user_lo=least(me,p.user_id) and f.user_hi=greatest(me,p.user_id) and f.status='accepted')
  and not exists(select 1 from public.neon_social_blocks b where(b.user_id=me and b.target=p.user_id)or(b.user_id=p.user_id and b.target=me));
  return jsonb_build_object('states',rows);
 end if;
 if action in('get','update') then
  other:=coalesce((payload->>'target')::uuid,me);
  if action='update' then
   if other<>me then raise insufficient_privilege using message='Edit your own profile only';end if;
   avatar_value:=coalesce(payload->>'avatar','preset:0');description_value:=coalesce(payload->>'description','');
   if char_length(description_value)>280 or octet_length(avatar_value)>65536 then raise exception 'Profile description or avatar is too large';end if;
   if avatar_value !~ '^preset:[0-7]$' then
    if avatar_value !~ '^data:image/png;base64,[A-Za-z0-9+/=]+$' or encode(substring(decode(split_part(avatar_value,',',2),'base64') from 1 for 8),'hex')<>'89504e470d0a1a0a' then raise exception 'Choose a PNG profile picture';end if;
   end if;
   if payload ? 'show_scrap' and jsonb_typeof(payload->'show_scrap')<>'boolean' then raise exception 'Invalid scrap visibility';end if;
   insert into public.neon_profile_cards(user_id,avatar,description,show_scrap) values(me,avatar_value,description_value,coalesce((payload->>'show_scrap')::boolean,true)) on conflict(user_id) do update set avatar=excluded.avatar,description=excluded.description,show_scrap=excluded.show_scrap,updated_at=now();
  end if;
  if not exists(select 1 from public.neon_profiles where user_id=other) or (other<>me and(exists(select 1 from public.neon_social_blocks b where(b.user_id=me and b.target=other)or(b.user_id=other and b.target=me)) or(not coalesce((select discoverable from public.neon_social_settings where user_id=other),true) and not exists(select 1 from public.neon_social_pairs f where f.user_lo=least(me,other) and f.user_hi=greatest(me,other) and f.status='accepted')))) then raise insufficient_privilege using message='Profile unavailable';end if;
  select * into card from public.neon_profile_cards where user_id=other;
  select * into saved from public.neon_saves where user_id=other;
  begin progress:=coalesce((saved.data->'values'->>'neonNullProgression')::jsonb,'{}'::jsonb);exception when others then progress:='{}'::jsonb;end;
  if coalesce(saved.data->'values'->>'neonNullMissionScrap','0')~'^[0-9]{1,10}$' then balance:=least(1000000000,coalesce(saved.data->'values'->>'neonNullMissionScrap','0')::bigint);end if;
  if progress->>'tutorialComplete'='true' then badges:=badges||'"Trained Pilot"'::jsonb;end if;
  if jsonb_typeof(progress->'owned')='array' and jsonb_array_length(progress->'owned')>=10 then badges:=badges||'"Operator Collector"'::jsonb;end if;
  if jsonb_typeof(progress->'ownedSkins')='array' and jsonb_array_length(progress->'ownedSkins')>=10 then badges:=badges||'"Arsenal Curator"'::jsonb;end if;
  if progress->>'bestEndlessWave'~'^[0-9]{1,7}$' and (progress->>'bestEndlessWave')::integer>=10 then badges:=badges||'"Endless Survivor"'::jsonb;end if;
  if exists(select 1 from public.neon_case_gifts where sender_id=other) then badges:=badges||'"Gift Benefactor"'::jsonb;end if;
  sharing:=coalesce((select online from public.neon_social_settings where user_id=other),false);
  if other=me or exists(select 1 from public.neon_social_pairs f where f.user_lo=least(me,other) and f.user_hi=greatest(me,other) and f.status='accepted') then
   if sharing then presence_value:='offline';select r.state,r.mode into presence_value,mode_value from public.neon_presence r where r.user_id=other and r.seen_at>now()-interval '90 seconds';presence_value:=coalesce(presence_value,'offline');end if;
  end if;
  return jsonb_build_object('id',other,'username',(select username from public.neon_profiles where user_id=other),'avatar',coalesce(card.avatar,'preset:0'),'description',coalesce(card.description,''),'show_scrap',coalesce(card.show_scrap,true),'scrap',case when other=me or coalesce(card.show_scrap,true) then balance else null end,'badges',badges,'presence',presence_value,'mode',coalesce(mode_value,''),'sharing',case when other=me then sharing else null end,'own',other=me);
 end if;
 if action='inbox' then
  select * into wallet from public.neon_case_wallets where user_id=me;
  select coalesce(jsonb_agg(x.entry order by x.at desc),'[]'::jsonb) into rows from(select g.created_at at,jsonb_build_object('id',g.id,'sender_id',g.sender_id,'sender',(select username from public.neon_profiles where user_id=g.sender_id),'kind',g.kind,'quantity',g.quantity,'note',g.note,'claimed',g.claimed) entry from public.neon_case_gifts g where g.target=me order by g.claimed asc,g.created_at desc limit 50)x;
  return jsonb_build_object('gifts',rows,'weapon',coalesce(wallet.weapon,0),'operator',coalesce(wallet.operator,0));
 end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('wallet/'||me::text,0));
 insert into public.neon_case_wallets(user_id) values(me) on conflict do nothing;
 if action='claim' then
  select * into gift from public.neon_case_gifts where id=(payload->>'id')::uuid for update;
  if not found or gift.target<>me then raise insufficient_privilege using message='Gift unavailable';end if;
  if not gift.claimed then
   if gift.kind='weapon' then update public.neon_case_wallets set weapon=weapon+gift.quantity where user_id=me;else update public.neon_case_wallets set operator=operator+gift.quantity where user_id=me;end if;
   update public.neon_case_gifts set claimed=true where id=gift.id;
  end if;return jsonb_build_object('ok',true);
 end if;
 if action='open_case' then
  case_kind:=payload->>'kind';nonce_id:=(payload->>'nonce')::uuid;
  if case_kind not in('weapon','operator') or case_kind is null or nonce_id is null then raise exception 'Invalid case opening';end if;
  select * into receipt from public.neon_case_receipts where user_id=me and nonce=nonce_id;
  select * into saved from public.neon_saves where user_id=me for update;
  if not found then raise exception 'Sync your cloud save before opening a case';end if;
  if receipt.nonce is not null then
   if receipt.kind<>case_kind then raise exception 'Case request ID already used';end if;
   select * into reward from public.neon_case_catalog where id=receipt.item_id;
   return jsonb_build_object('data',saved.data,'revision',saved.revision,'reward',to_jsonb(reward),'duplicate',receipt.duplicate,'replayed',true);
  end if;
  if saved.revision is distinct from (payload->>'expected_revision')::bigint then raise sqlstate 'PT409' using message='Sync your cloud save before opening a case';end if;
  select * into wallet from public.neon_case_wallets where user_id=me for update;
  if(case_kind='weapon' and wallet.weapon<1)or(case_kind='operator' and wallet.operator<1) then raise exception 'No gifted cases available';end if;
  needle:=random()*(select sum(odds) from public.neon_case_catalog where kind=case_kind);
  select x.id,x.kind,x.name,x.rarity,x.odds into reward from(select c.*,sum(odds)over(order by id) edge from public.neon_case_catalog c where kind=case_kind)x where x.edge>needle order by x.edge limit 1;
  if reward.id is null then raise exception 'Case catalog unavailable';end if;
  begin progress:=coalesce((saved.data->'values'->>'neonNullProgression')::jsonb,'{}'::jsonb);exception when others then raise exception 'Repair your cloud progression before opening a case';end;
  field_name:=case when case_kind='weapon' then 'ownedSkins' else 'owned' end;owned:=progress->field_name;if jsonb_typeof(owned) is distinct from 'array' then owned:='[]'::jsonb;end if;
  duplicate_value:=owned ? reward.id;if not duplicate_value then progress:=jsonb_set(progress,array[field_name],owned||to_jsonb(reward.id),true);end if;
  update public.neon_saves set data=jsonb_set(saved.data,'{values,neonNullProgression}',to_jsonb(progress::text),true),revision=saved.revision+1,updated_at=now() where user_id=me returning * into saved;
  if case_kind='weapon' then update public.neon_case_wallets set weapon=weapon-1 where user_id=me;else update public.neon_case_wallets set operator=operator-1 where user_id=me;end if;
  insert into public.neon_case_receipts(user_id,nonce,kind,item_id,duplicate) values(me,nonce_id,case_kind,reward.id,duplicate_value);
  return jsonb_build_object('data',saved.data,'revision',saved.revision,'reward',to_jsonb(reward),'duplicate',duplicate_value,'replayed',false);
 end if;
 raise exception 'Unknown profile action';
end $$;
revoke all on function public.neon_profile(text,jsonb) from public,anon;
grant execute on function public.neon_profile(text,jsonb) to authenticated;
insert into public.neon_case_catalog(id,kind,name,rarity,odds) values
('skin-pulse-ghostline','weapon','Ghostline Pulse','Common',3.21),
('skin-rapid-signal-noise','weapon','Signal Noise','Common',3.21),
('skin-triad-snowblind','weapon','Snowblind Triad','Common',3.21),
('skin-piercer-black-ice','weapon','Black Ice Piercer','Common',3.21),
('skin-burst-paper-swarm','weapon','Paper Swarm','Uncommon',2.5),
('skin-arc-copper-vein','weapon','Copper Vein','Uncommon',2.5),
('skin-nova-ashen-star','weapon','Ashen Star','Uncommon',2.5),
('skin-seeker-orbit-map','weapon','Orbit Map','Uncommon',2.5),
('skin-sniper-long-night','weapon','Long Night','Rare',1.79),
('skin-lance-sun-core','weapon','Sun Core','Rare',1.79),
('skin-burst-rifle-tessellate','weapon','Tessellate','Rare',1.79),
('skin-revolver-ironbloom','weapon','Ironbloom','Rare',1.79),
('skin-shotgun-rime','weapon','Rime Breaker','Epic',1.07),
('skin-grenade-emberfall','weapon','Emberfall','Epic',1.07),
('skin-ricochet-prism','weapon','Prism Bounce','Epic',1.07),
('skin-beam-afterimage','weapon','Afterimage','Legendary',0.71),
('skin-flare-witchlight','weapon','Witchlight Flare','Legendary',0.71),
('skin-dagger-moonshard','weapon','Moonshard','Divine',0.36),
('skin-disc-chronoglass','weapon','Chronoglass Disc','Divine',0.36),
('skin-emp-deepnull','weapon','Deep Null','Divine',0.36),
('skin-exp-0','weapon','Aurora Circuit Bloom','Uncommon',2.5),
('skin-exp-1','weapon','Aurora Shatterglass','Rare',1.79),
('skin-exp-2','weapon','Aurora Phase Lattice','Epic',1.07),
('skin-exp-3','weapon','Aurora Comet Wake','Legendary',0.71),
('skin-exp-4','weapon','Aurora Crownfire','Divine',0.36),
('skin-exp-5','weapon','Obsidian Circuit Bloom','Uncommon',2.5),
('skin-exp-6','weapon','Obsidian Shatterglass','Rare',1.79),
('skin-exp-7','weapon','Obsidian Phase Lattice','Epic',1.07),
('skin-exp-8','weapon','Obsidian Comet Wake','Legendary',0.71),
('skin-exp-9','weapon','Obsidian Crownfire','Divine',0.36),
('skin-exp-10','weapon','Solar Circuit Bloom','Uncommon',2.5),
('skin-exp-11','weapon','Solar Shatterglass','Rare',1.79),
('skin-exp-12','weapon','Solar Phase Lattice','Epic',1.07),
('skin-exp-13','weapon','Solar Comet Wake','Legendary',0.71),
('skin-exp-14','weapon','Solar Crownfire','Divine',0.36),
('skin-exp-15','weapon','Glacier Circuit Bloom','Uncommon',2.5),
('skin-exp-16','weapon','Glacier Shatterglass','Rare',1.79),
('skin-exp-17','weapon','Glacier Phase Lattice','Epic',1.07),
('skin-exp-18','weapon','Glacier Comet Wake','Legendary',0.71),
('skin-exp-19','weapon','Glacier Crownfire','Divine',0.36),
('skin-exp-20','weapon','Prism Circuit Bloom','Uncommon',2.5),
('skin-exp-21','weapon','Prism Shatterglass','Rare',1.79),
('skin-exp-22','weapon','Prism Phase Lattice','Epic',1.07),
('skin-exp-23','weapon','Prism Comet Wake','Legendary',0.71),
('skin-exp-24','weapon','Prism Crownfire','Divine',0.36),
('skin-exp-25','weapon','Tempest Circuit Bloom','Uncommon',2.5),
('skin-exp-26','weapon','Tempest Shatterglass','Rare',1.79),
('skin-exp-27','weapon','Tempest Phase Lattice','Epic',1.07),
('skin-exp-28','weapon','Tempest Comet Wake','Legendary',0.71),
('skin-exp-29','weapon','Tempest Crownfire','Divine',0.36),
('skin-exp-30','weapon','Astral Circuit Bloom','Uncommon',2.5),
('skin-exp-31','weapon','Astral Shatterglass','Rare',1.79),
('skin-exp-32','weapon','Astral Phase Lattice','Epic',1.07),
('skin-exp-33','weapon','Astral Comet Wake','Legendary',0.71),
('skin-exp-34','weapon','Astral Crownfire','Divine',0.36),
('skin-exp-35','weapon','Verdant Circuit Bloom','Uncommon',2.5),
('skin-exp-36','weapon','Verdant Shatterglass','Rare',1.79),
('skin-exp-37','weapon','Verdant Phase Lattice','Epic',1.07),
('skin-exp-38','weapon','Verdant Comet Wake','Legendary',0.71),
('skin-exp-39','weapon','Verdant Crownfire','Divine',0.36),
('skin-exp-40','weapon','Ember Circuit Bloom','Uncommon',2.5),
('skin-exp-41','weapon','Ember Shatterglass','Rare',1.79),
('skin-exp-42','weapon','Ember Phase Lattice','Epic',1.07),
('skin-exp-43','weapon','Ember Comet Wake','Legendary',0.71),
('skin-exp-44','weapon','Ember Crownfire','Divine',0.36),
('skin-exp-45','weapon','Void Circuit Bloom','Uncommon',2.5),
('skin-exp-46','weapon','Void Shatterglass','Rare',1.78),
('skin-exp-47','weapon','Void Phase Lattice','Epic',1.07),
('skin-exp-48','weapon','Void Comet Wake','Legendary',0.71),
('skin-exp-49','weapon','Void Crownfire','Divine',0.36),
('amber','operator','Relay Brass','Common',12.84),
('archive','operator','Archive Glass','Uncommon',2.5),
('polar','operator','Polar Surveyor','Uncommon',2.5),
('cinder','operator','Cinder Diver','Uncommon',2.5),
('verdigris','operator','Verdigris Marshal','Uncommon',2.5),
('lunar','operator','Lunar Cartographer','Rare',1.6699999999999995),
('foundry','operator','Foundry Pilot','Rare',1.6699999999999995),
('tide','operator','Tideglass Runner','Rare',1.6699999999999995),
('monarch','operator','Monarch Relay','Rare',1.6699999999999995),
('spectral','operator','Spectral Courier','Rare',1.6699999999999995),
('bastion','operator','Bastion Heavy','Epic',1.07),
('wildfire','operator','Wildfire Tech','Epic',1.07),
('deepfield','operator','Deepfield Scout','Epic',1.07),
('parallax','operator','Parallax Agent','Legendary',0.6553846153846153),
('blackstar','operator','Blackstar Warden','Legendary',0.6553846153846153),
('eclipse','operator','Total Eclipse','Legendary',0.6553846153846153),
('singularity','operator','Singularity Envoy','Divine',0.36),
('nullcrown','operator','Null Crown','Divine',0.36),
('firstlight','operator','First Light','Divine',0.36),
('exp-0','operator','Aurora Nomad','Uncommon',2.5),
('exp-1','operator','Aurora Vanguard','Rare',1.6699999999999995),
('exp-2','operator','Aurora Oracle','Epic',1.07),
('exp-3','operator','Aurora Revenant','Legendary',0.6553846153846153),
('exp-4','operator','Aurora Sovereign','Divine',0.36),
('exp-5','operator','Obsidian Nomad','Uncommon',2.5),
('exp-6','operator','Obsidian Vanguard','Rare',1.6699999999999995),
('exp-7','operator','Obsidian Oracle','Epic',1.07),
('exp-8','operator','Obsidian Revenant','Legendary',0.6553846153846153),
('exp-9','operator','Obsidian Sovereign','Divine',0.36),
('exp-10','operator','Solar Nomad','Uncommon',2.5),
('exp-11','operator','Solar Vanguard','Rare',1.6699999999999995),
('exp-12','operator','Solar Oracle','Epic',1.07),
('exp-13','operator','Solar Revenant','Legendary',0.6553846153846153),
('exp-14','operator','Solar Sovereign','Divine',0.36),
('exp-15','operator','Glacier Nomad','Uncommon',2.5),
('exp-16','operator','Glacier Vanguard','Rare',1.6699999999999995),
('exp-17','operator','Glacier Oracle','Epic',1.07),
('exp-18','operator','Glacier Revenant','Legendary',0.6553846153846153),
('exp-19','operator','Glacier Sovereign','Divine',0.36),
('exp-20','operator','Prism Nomad','Uncommon',2.5),
('exp-21','operator','Prism Vanguard','Rare',1.6699999999999995),
('exp-22','operator','Prism Oracle','Epic',1.07),
('exp-23','operator','Prism Revenant','Legendary',0.6553846153846153),
('exp-24','operator','Prism Sovereign','Divine',0.36),
('exp-25','operator','Tempest Nomad','Uncommon',2.5),
('exp-26','operator','Tempest Vanguard','Rare',1.6699999999999995),
('exp-27','operator','Tempest Oracle','Epic',1.07),
('exp-28','operator','Tempest Revenant','Legendary',0.6553846153846153),
('exp-29','operator','Tempest Sovereign','Divine',0.36),
('exp-30','operator','Astral Nomad','Uncommon',2.5),
('exp-31','operator','Astral Vanguard','Rare',1.6699999999999995),
('exp-32','operator','Astral Oracle','Epic',1.07),
('exp-33','operator','Astral Revenant','Legendary',0.6553846153846153),
('exp-34','operator','Astral Sovereign','Divine',0.36),
('exp-35','operator','Verdant Nomad','Uncommon',2.5),
('exp-36','operator','Verdant Vanguard','Rare',1.6699999999999995),
('exp-37','operator','Verdant Oracle','Epic',1.07),
('exp-38','operator','Verdant Revenant','Legendary',0.6553846153846153),
('exp-39','operator','Verdant Sovereign','Divine',0.36),
('exp-40','operator','Ember Nomad','Uncommon',2.5),
('exp-41','operator','Ember Vanguard','Rare',1.6699999999999995),
('exp-42','operator','Ember Oracle','Epic',1.07),
('exp-43','operator','Ember Revenant','Legendary',0.6553846153846153),
('exp-44','operator','Ember Sovereign','Divine',0.36),
('exp-45','operator','Void Nomad','Uncommon',2.5),
('exp-46','operator','Void Vanguard','Rare',1.6699999999999995),
('exp-47','operator','Void Oracle','Epic',1.07),
('exp-48','operator','Void Revenant','Legendary',0.6553846153846153),
('exp-49','operator','Void Sovereign','Divine',0.36)
on conflict(id) do update set kind=excluded.kind,name=excluded.name,rarity=excluded.rarity,odds=excluded.odds;
commit;
