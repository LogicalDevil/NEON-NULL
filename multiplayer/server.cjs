'use strict';

const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{randomBytes}=require('node:crypto');

const {Match,reward}=require('./engine.cjs');

const modifications=require('./modifications.cjs');

const developerAccess=require('./developer-access.cjs');

const cosmeticManifest=require('./skin-manifest.json'),operatorIds=new Set(cosmeticManifest.operators);

function validatedCosmetics(raw){const owned=new Set(['mono',...(Array.isArray(raw?.owned)?raw.owned.filter(id=>operatorIds.has(id)):[])]),ownedSkins=new Set(Array.isArray(raw?.ownedSkins)?raw.ownedSkins:[]),weaponSkins={};if(raw?.equippedSkins&&typeof raw.equippedSkins==='object'&&!Array.isArray(raw.equippedSkins))for(const [index,id]of Object.entries(raw.equippedSkins)){const n=Number(index);if(Number.isInteger(n)&&n>=0&&n<26&&ownedSkins.has(id)&&Object.prototype.hasOwnProperty.call(cosmeticManifest.skins,id)&&cosmeticManifest.skins[id]===n)weaponSkins[String(n)]=id}return {appearance:operatorIds.has(raw?.selected)&&owned.has(raw.selected)?raw.selected:'mono',weaponSkins}}

const arsenal=require('./arsenal-catalog.cjs');
const VERSION='5.2',root=path.resolve(__dirname,'..'),catalog=JSON.parse(fs.readFileSync(path.join(__dirname,'catalog.json'),'utf8'));

function createGameServer(options={}){

 const url=options.supabaseURL||process.env.SUPABASE_URL,key=options.publishableKey||process.env.SUPABASE_PUBLISHABLE_KEY,service=options.serviceKey||process.env.SUPABASE_SERVICE_ROLE_KEY;

 let publicKey='',publicURL='';if(typeof key==='string'){if(key.startsWith('sb_publishable_'))publicKey=key;else try{if(JSON.parse(Buffer.from(key.split('.')[1],'base64url').toString()).role==='anon')publicKey=key}catch{}}try{const candidate=new URL(url);if(candidate.protocol==='https:'&&!candidate.username&&!candidate.password&&candidate.pathname==='/'&&!candidate.search&&!candidate.hash)publicURL=candidate.origin}catch{}

 const dev=options.dev??(process.env.DEV_GUESTS==='true'),gameRoot=options.gameRoot||root,compactSnapshots=options.compactSnapshots!==false,rooms=new Map(),sessions=new Map(),limits=new Map();

 const developers=developerAccess.create(()=>typeof options.developerUserIds==='function'?options.developerUserIds():options.developerUserIds??process.env.DEVELOPER_USER_IDS);

 const ledgerPath=options.ledgerPath||path.join(__dirname,'reward-outbox.json');let outbox=[];try{outbox=JSON.parse(fs.readFileSync(ledgerPath,'utf8'))}catch{}

 const allowed=(process.env.ALLOWED_ORIGINS||'').split(',').map(value=>value.trim()).filter(Boolean);let flushing=false,frame=0;

 const metrics={steps:0,stepMs:0,maxStepMs:0,broadcasts:0,totalSnapshotBytes:0,lastSnapshotBytes:0,maxSnapshotBytes:0,droppedSimulationSeconds:0,backpressureDrops:0,maxBufferBytes:0};

 function persist(){fs.writeFileSync(ledgerPath+'.tmp',JSON.stringify(outbox));fs.renameSync(ledgerPath+'.tmp',ledgerPath)}

 async function flush(){if(flushing||!service||!url)return;flushing=true;try{for(const item of outbox.slice(0,100)){const r=await fetch(url+'/rest/v1/neon_coop_rewards?on_conflict=run_id,user_id',{method:'POST',headers:{apikey:service,Authorization:'Bearer '+service,'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates'},body:JSON.stringify(item),signal:AbortSignal.timeout(8000)});if(!r.ok){console.warn("Reward delivery pending: HTTP "+r.status+"; check reward SQL and private server key");break;}outbox=outbox.filter(x=>x!==item);persist()}}catch(error){console.warn('Reward delivery pending:',error.message)}finally{flushing=false}}

 function send(res,code,data){if(!res.headersSent)res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data))}

 function roomOf(s){return rooms.get(s.room)}

 function roster(r){return {code:r.code,leader:r.leader,state:r.state,version:VERSION,mode:r.mode||'endless',countdown:r.countdown,ranked:!!service&&!dev,trackEligible:!dev&&r.members.every(id=>!!sessions.get(id)?.user),players:r.members.map(id=>{const s=sessions.get(id);return{id,name:s.name,ready:s.ready,connected:!!s.stream,appearance:s.appearance,weaponSkins:s.weaponSkins,role:s.role||'vanguard',mods:s.mods||[null,null,null,null],gear:s.gear}})}}

 function writeStream(s,message){const stream=s.stream;if(!stream||stream.destroyed||stream.writableEnded)return;if(s.blocked){s.pending=message;metrics.backpressureDrops++;return}metrics.maxBufferBytes=Math.max(metrics.maxBufferBytes,stream.writableLength);if(stream.writableLength>131072){stream.destroy();return}if(!stream.write(message)){s.blocked=true;s.blockedSince=Date.now()}}

 function emit(r,force=false){const lobby=roster(r),signature=r.state==='playing'?null:JSON.stringify([lobby.state,Math.ceil(lobby.countdown),lobby.leader,lobby.players,lobby.ranked]);if(!force&&signature&&signature===r.lastSignature)return;r.lastSignature=signature;const match=r.match?.snapshot()||null;if(match){if(compactSnapshots){for(const player of match.players)player.gear=player.gear.map(({mag,reserve,reload,cooldown,cooldownMax,modId,heat,charge})=>({mag,reserve,reload,cooldown,cooldownMax,modId,heat,charge}));match.shots=match.shots.map(s=>[s.id,s.x,s.y,s.owner,s.skinId,s.kind,s.angle]);match.hostile=match.hostile.map(s=>[s.id,s.x,s.y,s.vx,s.vy]);match.enemies=match.enemies.map(e=>[e.id,e.kind,e.x,e.y,e.hp,e.max,e.r,e.boss,e.theme,e.state,e.aim,e.warning,e.intro,e.shielded,e.hurt,e.type,e.name,e.faction,e.stagger,e.staggerMax,e.exposed,e.marked])}if(!force)match.events=match.events.filter(event=>event.id>(r.eventCursor||0));r.eventCursor=r.match.eventId}const sequence=(r.sequence||0)+1;r.sequence=sequence;const message='data: '+JSON.stringify({sequence,sentAt:Date.now(),packed:compactSnapshots?1:0,lobby,match})+'\n\n';metrics.lastSnapshotBytes=Buffer.byteLength(message);metrics.totalSnapshotBytes+=metrics.lastSnapshotBytes;metrics.maxSnapshotBytes=Math.max(metrics.maxSnapshotBytes,metrics.lastSnapshotBytes);metrics.broadcasts++;for(const id of r.members){const s=sessions.get(id);if(s)writeStream(s,message)}}

 function transferLeader(r){const leader=sessions.get(r.leader);if(!r.members.includes(r.leader)||!leader?.stream)r.leader=r.members.find(id=>sessions.get(id)?.stream)||r.members[0]}

 function leave(s){const r=roomOf(s);s.ready=false;s.room=null;if(!r)return;r.members=r.members.filter(id=>id!==s.id);if(r.match){const p=r.match.players.find(p=>p.id===s.id);if(p){p.connected=false;p.hp=0;p.input={}}}if(!r.members.length){rooms.delete(r.code);return}transferLeader(r);if(r.state==='countdown'){r.state='lobby';r.countdown=0}emit(r)}

 function authenticate(req){const id=(req.headers.authorization||'').replace(/^Bearer /,'');return sessions.get(id)}

 async function body(req){let buffer='',size=0;for await(const chunk of req){size+=chunk.length;if(size>8192)throw Error('Request too large');buffer+=chunk}const data=JSON.parse(buffer||'{}');if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Expected an object');return data}

 async function socialRPC(token,action,payload={}){if(!url||!key)throw Error('Server authentication is not configured');const response=await fetch(url+'/rest/v1/rpc/neon_social',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({action,payload}),signal:AbortSignal.timeout(8000)});let value;try{value=await response.json()}catch{throw Error('Social service unavailable')}if(!response.ok)throw Error(value.code==='PGRST202'?'Run supabase-social.sql in Supabase first':value.message||value.error||'Social request failed');return value}
 function joinRoom(s,code){if(s.room===code)return{code,alreadyJoined:true};if(s.room)throw Error('Leave your current room first');const r=rooms.get(code);if(!r)throw Error('Room not found');if(r.state!=='lobby')throw Error('Match in progress — wait for the next run');if(r.members.length>=4)throw Error('Room is full');r.members.push(s.id);s.room=code;emit(r);return{code}}
 async function identity(token){if(!url||!key)throw Error('Server authentication is not configured');const headers={apikey:key,Authorization:'Bearer '+token};const r=await fetch(url+'/auth/v1/user',{headers,signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('Sign in again to connect');const user=await r.json();if(!user.id||!user.email_confirmed_at)throw Error('Confirm your email before joining');const p=await fetch(url+'/rest/v1/neon_profiles?user_id=eq.'+encodeURIComponent(user.id)+'&select=username',{headers,signal:AbortSignal.timeout(8000)});const profiles=p.ok?await p.json():[];if(!profiles[0]?.username)throw Error('Choose a username in Accounts & Saves first');const save=await fetch(url+'/rest/v1/neon_saves?user_id=eq.'+encodeURIComponent(user.id)+'&select=data',{headers,signal:AbortSignal.timeout(8000)});let cosmetics={appearance:'mono',weaponSkins:{}};if(save.ok){const rows=await save.json();try{cosmetics=validatedCosmetics(JSON.parse(rows[0]?.data?.values?.neonNullProgression||'{}'))}catch{}}const outfit=developers.outfit(user.id);return {user:user.id,name:profiles[0].username,...cosmetics,normalAppearance:cosmetics.appearance,normalWeaponSkins:cosmetics.weaponSkins,...(outfit?{appearance:outfit.appearance||cosmetics.appearance,weaponSkins:{...cosmetics.weaponSkins,...outfit.weaponSkins},developerUntil:outfit.expires}:{})};}

 const server=http.createServer(async(req,res)=>{

  const origin=req.headers.origin;
  const forwardedProtocol=String(req.headers['x-forwarded-proto']||'').split(',')[0].trim().toLowerCase();
  const protocol=req.socket.encrypted||forwardedProtocol==='https'?'https':'http';
  const hostOrigin=protocol+'://'+req.headers.host;

  if(origin&&origin!==hostOrigin&&!allowed.includes(origin)&&!(dev&&origin==='null'))return send(res,403,{error:'Origin not allowed — open the game from this server'});

  if(origin)res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');

  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return}

  const pathname=new URL(req.url,'http://localhost').pathname;

  if(pathname==='/health')return send(res,200,{ok:true,version:VERSION,dev,rooms:rooms.size});

  if(pathname==='/api/public-config'&&req.method==='GET')return send(res,200,{url:publicKey?publicURL:'',key:publicURL?publicKey:'',configured:!!(publicURL&&publicKey)});

  if(req.method==='GET'&&(pathname==='/'||pathname==='/index.html'||pathname==='/neon-null.html')){const entry=fs.existsSync(path.join(gameRoot,'index.html'))?path.join(gameRoot,'index.html'):path.join(gameRoot,'outputs/neon-null.html');if(!fs.existsSync(entry))return send(res,503,{error:'Game file missing — deploy index.html or outputs/neon-null.html'});res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});const file=fs.createReadStream(entry);file.on('error',()=>res.destroy());file.pipe(res);return}

  if(!pathname.startsWith('/api/'))return send(res,404,{error:'Not found'});

  try{

   const ip=req.socket.remoteAddress,now=Date.now();let limit=limits.get(ip);if(!limit||now-limit.at>1000){limit={at:now,n:0};limits.set(ip,limit)}if(++limit.n>180)return send(res,429,{error:'Too many requests'});

   if(pathname.startsWith('/api/social/')){
    if(req.method!=='POST')return send(res,405,{error:'Use POST'});const token=(req.headers.authorization||'').replace(/^Bearer /,'');if(!token)return send(res,401,{error:'Sign in to use friend lobbies'});let ident;try{ident=await identity(token)}catch{return send(res,401,{error:'Sign in again to use friend lobbies'})}const b=await body(req),self=[...sessions.values()].find(s=>s.user===ident.user);if(!self)throw Error('Connect to Multiplayer first');if(!self.stream)throw Error('Waiting for live Multiplayer connection');
    if(pathname==='/api/social/invite'){const r=roomOf(self);if(!r||r.leader!==self.id||r.state!=='lobby')throw Error('Create a lobby first. Only the lobby leader can invite friends.');if(r.members.length>=4)throw Error('Room is full');const relation=await socialRPC(token,'relationship',{target:b.target});if(!relation.accepted||relation.blocked)throw Error('Only accepted friends can be invited');return send(res,200,await socialRPC(token,'invite',{target:b.target,code:r.code,version:VERSION}))}
    let friend,code;
    if(pathname==='/api/social/join-invite'){const inv=await socialRPC(token,'invitation',{id:b.id});if(inv.target!==ident.user||inv.status!=='accepted')throw Error('Accept this invitation first');if(inv.version!==VERSION)throw Error('Game versions differ — refresh before joining');friend=inv.sender_id;code=inv.code}
    else if(pathname==='/api/social/join-friend'){friend=b.target;const relation=await socialRPC(token,'relationship',{target:friend});if(!relation.joinable||relation.blocked)throw Error('This friend has not enabled lobby sharing or is unavailable')}
    else return send(res,404,{error:'Unknown social action'});
    const relation=await socialRPC(token,'relationship',{target:friend});if(!relation.accepted||relation.blocked)throw Error('Friendship no longer permits this invitation');const host=[...sessions.values()].find(s=>s.user===friend&&s.stream),r=host&&roomOf(host);if(!r||code&&r.code!==code)throw Error('Friend lobby is offline or the invitation is no longer valid');if(pathname==='/api/social/join-invite'&&r.leader!==host.id)throw Error('Lobby leader changed — request a new invitation');return send(res,200,joinRoom(self,r.code));
   }
   if(pathname.startsWith('/api/developer/')){

    if(req.method!=='POST')return send(res,405,{error:'Use POST'});

    const access=(req.headers.authorization||'').replace(/^Bearer /,'');if(!access)return send(res,401,{error:'Access Required · sign in first'});

    let ident;try{ident=await identity(access)}catch{return send(res,401,{error:'Access Required · sign in again'})}

    if(!developers.allowed(ident.user))return send(res,403,{error:'Access Revoked or not granted · ask the server owner to authorize your account'});

    developers.refresh(ident.user);

    if(pathname==='/api/developer/access'){await body(req);return send(res,200,{granted:true,leaseSeconds:60,giftingConfigured:Boolean(service),catalog:developers.catalog()})}

    const data=await body(req);

    if(pathname==='/api/developer/gift'){
     if(!service)return send(res,503,{error:'Gift service not configured. The server owner must add the private SUPABASE_SERVICE_ROLE_KEY in Render only.'});
     if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.target||'')||!['weapon','operator'].includes(data.kind)||!Number.isInteger(data.quantity)||data.quantity<1||data.quantity>100||typeof data.note!=='string'||data.note.length>160||!/^[0-9a-f-]{36}$/i.test(data.requestId||''))return send(res,400,{error:'Invalid gift request'});
     let response;
     try{
      response=await fetch(url+'/rest/v1/rpc/neon_issue_case_gift',{
       method:'POST',
       headers:{apikey:service,Authorization:'Bearer '+service,'Content-Type':'application/json'},
       body:JSON.stringify({actor:ident.user,recipient:data.target,gift_kind:data.kind,amount:data.quantity,request_id:data.requestId,gift_note:data.note}),
       signal:AbortSignal.timeout(8000)
      });
     }catch{
      return send(res,502,{error:'Supabase did not confirm delivery. Retry this same gift to check or complete delivery.'});
     }
     if(response.status===401||response.status===403)return send(res,503,{error:'Supabase refused the gift server credentials. Check SUPABASE_SERVICE_ROLE_KEY in the Render environment.'});
     const result=await response.json().catch(()=>null);
     if(!result)return send(res,502,{error:'Supabase returned an unreadable gift receipt. Retry this same gift.'});
     if(!response.ok)return send(res,response.status===429?429:400,{error:result.code==='PGRST202'?'Run supabase-profiles-gifts.sql in the game’s Supabase project first':result.message||'Could not send gift'});
     return send(res,200,result);
    }
    if(pathname==='/api/developer/roll')return send(res,200,developers.roll(data));

    if(pathname==='/api/developer/equip'){const outfit=developers.equip(ident.user,data);for(const active of sessions.values())if(active.user===ident.user){active.appearance=outfit?.appearance||active.normalAppearance||'mono';active.weaponSkins={...(active.normalWeaponSkins||{}),...(outfit?.weaponSkins||{})};active.developerUntil=outfit?.expires||0;const room=roomOf(active),player=room?.match?.players.find(p=>p.id===active.id);if(player){player.appearance=active.appearance;player.weaponSkins=active.weaponSkins;for(const g of player.gear)g.skinId=active.weaponSkins[String(g.weaponIndex)]||null}if(room)emit(room,true)}return send(res,200,{ok:true,testOnly:true})}

    return send(res,404,{error:'Unknown developer action'});

   }

   if(pathname==='/api/connect'&&req.method==='POST'){

    const b=await body(req);if(b.version!==VERSION)return send(res,409,{error:'Game versions differ — refresh your game'});if(sessions.size>=200)return send(res,503,{error:'Server full'});

    const ident=dev?{user:null,name:String(b.name||'Guest').replace(/[^A-Za-z0-9_]/g,'').slice(0,20)||'Guest',appearance:'mono',weaponSkins:{}}:await identity(String(b.accessToken||''));

    if(ident.user)for(const old of sessions.values())if(old.user===ident.user){if(old.stream)old.stream.destroy();leave(old);sessions.delete(old.id)}

    const id=randomBytes(32).toString('hex'),s={...ident,id,stream:null,room:null,ready:false,role:'vanguard',gear:[0,0,0,0],seen:now,seq:-1};sessions.set(id,s);return send(res,200,{id,name:s.name,dev,version:VERSION,catalog})

   }

   const s=authenticate(req);if(!s)return send(res,401,{error:'Connection expired — reconnect'});s.seen=now;

   if(pathname==='/api/events'&&req.method==='GET'){

    const previous=s.stream;s.stream=null;previous?.destroy();res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});res.socket?.setNoDelay(true);res.write(': connected\n\n');s.stream=res;s.blocked=false;s.pending=null;s.disconnected=0;s.lastHeartbeat=Date.now();const r=roomOf(s);if(r?.match){const p=r.match.players.find(p=>p.id===s.id);if(p){p.connected=true;p.input={};p.moveQueue.length=0;p.moveCredit=0;p.lastInput=-1}}if(r)emit(r,true);

    res.on('drain',()=>{if(s.stream!==res)return;s.blocked=false;s.blockedSince=0;const pending=s.pending;s.pending=null;if(pending)writeStream(s,pending)});

    res.on('close',()=>{if(s.stream!==res)return;s.stream=null;s.pending=null;s.blocked=false;s.disconnected=Date.now();s.seen=Date.now();s.ready=false;const room=roomOf(s);if(room?.match){const p=room.match.players.find(p=>p.id===s.id);if(p){p.connected=false;p.input={};p.moving=false}}if(room?.state==='countdown'){room.state='lobby';room.countdown=0}if(room){transferLeader(room);emit(room)}});return

   }

   if(req.method!=='POST')return send(res,405,{error:'Use POST'});const b=await body(req);

   if(pathname==='/api/create'){if(s.room)throw Error('Leave your current room first');if(rooms.size>=40)throw Error('Server room limit reached');let code;do{code=randomBytes(4).toString('hex').slice(0,6).toUpperCase()}while(rooms.has(code));const r={code,leader:s.id,members:[s.id],state:'lobby',mode:b.mode==='sector'?'sector':'endless',countdown:0,match:null};rooms.set(code,r);s.room=code;emit(r);return send(res,200,{code})}

   if(pathname==='/api/join'){if(s.room)throw Error('Leave your current room first');const code=String(b.code||'').trim().toUpperCase();if(!/^[A-F0-9]{6}$/.test(code))throw Error('Enter a six-character room code');return send(res,200,joinRoom(s,code))}

   if(pathname==='/api/leave'){leave(s);return send(res,200,{ok:true})}

   const r=roomOf(s);if(!r)throw Error('Join a room first');

   if(pathname==='/api/ready'){if(r.state!=='lobby')throw Error('Match already starting');if(!s.stream)throw Error('Waiting for live connection');
    const gear=catalog.map((items,i)=>Number.isInteger(b.gear?.[i])&&items[b.gear[i]]?b.gear[i]:0);
    const primary=catalog[0][gear[0]],faction=arsenal.factionById(b.faction||primary.faction||'default');
    if(!faction||gear.some((index,slot)=>(catalog[slot][index].faction||'default')!==faction.id))throw Error('Choose four items from the same faction');
    s.gear=gear;s.mods=catalog.map((items,i)=>modifications.validate(b.mods?.[i],items[gear[i]]));s.role=['vanguard','engineer','scout','medic'].includes(b.role)?b.role:'vanguard';s.ready=b.ready===true;emit(r)}

   else if(pathname==='/api/start'){if(r.leader!==s.id)throw Error('Only the leader can start');if(r.state!=='lobby'||r.members.length<2||!r.members.every(id=>sessions.get(id).ready&&sessions.get(id).stream))throw Error('Need 2–4 connected and ready players');r.state='countdown';r.countdown=3;emit(r)}

   else if(pathname==='/api/input'){if(r.state!=='playing'||!s.stream)throw Error('Match is not active');if(b.matchId!==undefined&&b.matchId!==r.match.matchId)throw Error('Input belongs to a different match');r.match.input(s.id,b)}

   else if(pathname==='/api/rematch'){if(r.leader!==s.id||r.state!=='results')throw Error('Leader can return the party to lobby after results');r.match=null;r.state='lobby';for(const id of r.members)sessions.get(id).ready=false;emit(r)}

   else return send(res,404,{error:'Unknown action'});

   send(res,200,{ok:true});

  }catch(error){send(res,400,{error:error.message||'Request failed'})}

 });

 const fixedStep=1/30,maxCatchupSteps=4;let lastClock=performance.now(),accumulator=0,nextBroadcast=lastClock,nextCleanup=lastClock+1000,nextFlush=lastClock+30000;

 const tick=setInterval(()=>{const nowClock=performance.now(),elapsed=Math.max(0,(nowClock-lastClock)/1000);lastClock=nowClock;accumulator+=Math.min(elapsed,.25);let skipped=Math.max(0,elapsed-.25);metrics.droppedSimulationSeconds+=skipped;let caughtUp=0;

  while(accumulator>=fixedStep&&caughtUp<maxCatchupSteps){const start=performance.now();frame++;for(const r of rooms.values()){

   if(r.state==='countdown'){r.countdown=Math.max(0,r.countdown-fixedStep);if(!r.countdown){r.match=new Match(r.members.map(id=>({...sessions.get(id),connected:true})),catalog,{mode:r.mode,ranked:!!service&&!dev,trackEligible:!dev&&r.members.every(id=>!!sessions.get(id)?.user)});r.state='playing'}}

   if(r.state==='playing'){r.match.step(fixedStep);if(r.match.done){r.state='results';r.match.result.rewardAvailable=!!service&&!dev;r.match.result.reward=reward(r.match.score,r.match.time);if(service&&!dev){for(const p of r.match.players)if(p.user&&p.connected&&p.activeTime>=60&&r.match.result.reward>0)outbox.push({run_id:r.match.matchId,user_id:p.user,amount:r.match.result.reward});try{persist();flush()}catch(error){console.error('Reward outbox write failed',error.message)}}}}

  }const duration=performance.now()-start;metrics.steps++;metrics.stepMs+=duration;metrics.maxStepMs=Math.max(metrics.maxStepMs,duration);accumulator-=fixedStep;caughtUp++}

  if(accumulator>=fixedStep){const dropped=accumulator-accumulator%fixedStep;metrics.droppedSimulationSeconds+=dropped;skipped+=dropped;accumulator%=fixedStep}if(skipped>0)for(const r of rooms.values())if(r.state==='playing')r.match.allowMovementCatchup(skipped)

  if(nowClock>=nextBroadcast){nextBroadcast+=(Math.floor((nowClock-nextBroadcast)/(1000/15))+1)*(1000/15);for(const r of rooms.values())emit(r)}

  if(nowClock>=nextCleanup){nextCleanup=nowClock+1000;const now=Date.now();developers.sweep();for(const active of sessions.values())if(active.developerUntil){const outfit=developers.outfit(active.user);if(!outfit){active.developerUntil=0;active.appearance=active.normalAppearance||'mono';active.weaponSkins={...(active.normalWeaponSkins||{})};const room=roomOf(active),p=room?.match?.players.find(p=>p.id===active.id);if(p){p.appearance=active.appearance;p.weaponSkins=active.weaponSkins;for(const g of p.gear)g.skinId=active.weaponSkins[String(g.weaponIndex)]||null}if(room)emit(room,true)}else active.developerUntil=outfit.expires}for(const s of sessions.values()){if(s.stream){if(s.blocked&&now-s.blockedSince>5000)s.stream.destroy();else if(!s.blocked&&now-(s.lastHeartbeat||0)>5000){s.lastHeartbeat=now;writeStream(s,': heartbeat\n\n')}}if((!s.stream&&now-s.seen>30000)||(s.disconnected&&now-s.disconnected>20000)){leave(s);sessions.delete(s.id)}}for(const [ip,l]of limits)if(now-l.at>60000)limits.delete(ip)}

  if(nowClock>=nextFlush){nextFlush=nowClock+30000;flush()}

 },1000/60);

 server.on('close',()=>{clearInterval(tick);for(const s of sessions.values())s.stream?.destroy()});

 return {server,rooms,sessions,metrics,close:()=>{clearInterval(tick);for(const s of sessions.values())s.stream?.destroy();return new Promise(resolve=>server.close(resolve))}};

}

if(require.main===module){const dev=process.env.DEV_GUESTS==='true';if(!dev&&(!process.env.SUPABASE_URL||!process.env.SUPABASE_PUBLISHABLE_KEY)){console.error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY, or DEV_GUESTS=true for localhost testing');process.exit(1)}const {server}=createGameServer();server.listen(Number(process.env.PORT)||8787,dev?'127.0.0.1':'0.0.0.0',()=>console.log('NEON//NULL co-op server listening on port '+(process.env.PORT||8787)+(dev?' (local unranked guests)':'')))}

module.exports={createGameServer};

