'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{randomBytes}=require('node:crypto');
const {Match,reward}=require('./engine.cjs');
const cosmeticManifest=require('./skin-manifest.json'),operatorIds=new Set(cosmeticManifest.operators);
function validatedCosmetics(raw){const owned=new Set(['mono',...(Array.isArray(raw?.owned)?raw.owned.filter(id=>operatorIds.has(id)):[])]),ownedSkins=new Set(Array.isArray(raw?.ownedSkins)?raw.ownedSkins:[]),weaponSkins={};if(raw?.equippedSkins&&typeof raw.equippedSkins==='object'&&!Array.isArray(raw.equippedSkins))for(const [index,id]of Object.entries(raw.equippedSkins)){const n=Number(index);if(Number.isInteger(n)&&n>=0&&n<26&&ownedSkins.has(id)&&Object.prototype.hasOwnProperty.call(cosmeticManifest.skins,id)&&cosmeticManifest.skins[id]===n)weaponSkins[String(n)]=id}return {appearance:operatorIds.has(raw?.selected)&&owned.has(raw.selected)?raw.selected:'mono',weaponSkins}}
const VERSION='4.0',root=path.resolve(__dirname,'..'),catalog=JSON.parse(fs.readFileSync(path.join(__dirname,'catalog.json'),'utf8'));
function createGameServer(options={}){
 const url=options.supabaseURL||process.env.SUPABASE_URL,key=options.publishableKey||process.env.SUPABASE_PUBLISHABLE_KEY,service=options.serviceKey||process.env.SUPABASE_SERVICE_ROLE_KEY;
 const dev=options.dev??(process.env.DEV_GUESTS==='true'),rooms=new Map(),sessions=new Map(),limits=new Map();
 const ledgerPath=options.ledgerPath||path.join(__dirname,'reward-outbox.json');let outbox=[];try{outbox=JSON.parse(fs.readFileSync(ledgerPath,'utf8'))}catch{}
 const allowed=(process.env.ALLOWED_ORIGINS||'').split(',').filter(Boolean);let flushing=false,frame=0;
 function persist(){fs.writeFileSync(ledgerPath+'.tmp',JSON.stringify(outbox));fs.renameSync(ledgerPath+'.tmp',ledgerPath)}
 async function flush(){if(flushing||!service||!url)return;flushing=true;try{for(const item of outbox.slice(0,100)){const r=await fetch(url+'/rest/v1/neon_coop_rewards?on_conflict=run_id,user_id',{method:'POST',headers:{apikey:service,Authorization:'Bearer '+service,'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates'},body:JSON.stringify(item),signal:AbortSignal.timeout(8000)});if(!r.ok){console.warn("Reward delivery pending: HTTP "+r.status+"; check reward SQL and private server key");break;}outbox=outbox.filter(x=>x!==item);persist()}}catch(error){console.warn('Reward delivery pending:',error.message)}finally{flushing=false}}
 function send(res,code,data){if(!res.headersSent)res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data))}
 function roomOf(s){return rooms.get(s.room)}
 function roster(r){return {code:r.code,leader:r.leader,state:r.state,version:VERSION,mode:'endless',countdown:r.countdown,ranked:!!service&&!dev,players:r.members.map(id=>{const s=sessions.get(id);return{id,name:s.name,ready:s.ready,connected:!!s.stream,appearance:s.appearance,weaponSkins:s.weaponSkins,gear:s.gear}})}}
 function emit(r){const message='data: '+JSON.stringify({lobby:roster(r),match:r.match?.snapshot()||null})+'\n\n';for(const id of r.members){const s=sessions.get(id);if(s?.stream&&!s.stream.destroyed){if(s.stream.writableLength>200000){s.stream.destroy();continue}s.stream.write(message)}}}
 function leave(s){const r=roomOf(s);s.ready=false;s.room=null;if(!r)return;r.members=r.members.filter(id=>id!==s.id);if(r.match){const p=r.match.players.find(p=>p.id===s.id);if(p){p.connected=false;p.hp=0;p.input={}}}if(!r.members.length){rooms.delete(r.code);return}if(r.leader===s.id)r.leader=r.members[0];if(r.state==='countdown'){r.state='lobby';r.countdown=0}emit(r)}
 function authenticate(req){const id=(req.headers.authorization||'').replace(/^Bearer /,'');return sessions.get(id)}
 async function body(req){let buffer='';for await(const chunk of req){buffer+=chunk;if(buffer.length>8192)throw Error('Request too large')}return JSON.parse(buffer||'{}')}
 async function identity(token){if(!url||!key)throw Error('Server authentication is not configured');const headers={apikey:key,Authorization:'Bearer '+token};const r=await fetch(url+'/auth/v1/user',{headers,signal:AbortSignal.timeout(8000)});if(!r.ok)throw Error('Sign in again to connect');const user=await r.json();if(!user.id||!user.email_confirmed_at)throw Error('Confirm your email before joining');const p=await fetch(url+'/rest/v1/neon_profiles?user_id=eq.'+encodeURIComponent(user.id)+'&select=username',{headers,signal:AbortSignal.timeout(8000)});const profiles=p.ok?await p.json():[];if(!profiles[0]?.username)throw Error('Choose a username in Accounts & Saves first');const save=await fetch(url+'/rest/v1/neon_saves?user_id=eq.'+encodeURIComponent(user.id)+'&select=data',{headers,signal:AbortSignal.timeout(8000)});let cosmetics={appearance:'mono',weaponSkins:{}};if(save.ok){const rows=await save.json();try{cosmetics=validatedCosmetics(JSON.parse(rows[0]?.data?.values?.neonNullProgression||'{}'))}catch{}}return {user:user.id,name:profiles[0].username,...cosmetics};}
 const server=http.createServer(async(req,res)=>{
  const origin=req.headers.origin,hostOrigin='http'+(req.headers['x-forwarded-proto']==='https'?'s':'')+'://'+req.headers.host;
  if(origin&&origin!==hostOrigin&&!allowed.includes(origin)&&!(dev&&origin==='null'))return send(res,403,{error:'Origin not allowed — open the game from this server'});
  if(origin)res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return}
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(pathname==='/health')return send(res,200,{ok:true,version:VERSION,dev,rooms:rooms.size});
  if(req.method==='GET'&&(pathname==='/'||pathname==='/neon-null.html')){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'});fs.createReadStream(path.join(root,'outputs/neon-null.html')).pipe(res);return}
  if(!pathname.startsWith('/api/'))return send(res,404,{error:'Not found'});
  try{
   const ip=req.socket.remoteAddress,now=Date.now();let limit=limits.get(ip);if(!limit||now-limit.at>1000){limit={at:now,n:0};limits.set(ip,limit)}if(++limit.n>180)return send(res,429,{error:'Too many requests'});
   if(pathname==='/api/connect'&&req.method==='POST'){
    const b=await body(req);if(b.version!==VERSION)return send(res,409,{error:'Game versions differ — refresh your game'});if(sessions.size>=200)return send(res,503,{error:'Server full'});
    const ident=dev?{user:null,name:String(b.name||'Guest').replace(/[^A-Za-z0-9_]/g,'').slice(0,20)||'Guest',appearance:'mono',weaponSkins:{}}:await identity(String(b.accessToken||''));
    if(ident.user)for(const old of sessions.values())if(old.user===ident.user){if(old.stream)old.stream.destroy();leave(old);sessions.delete(old.id)}
    const id=randomBytes(32).toString('hex'),s={...ident,id,stream:null,room:null,ready:false,gear:[0,0,0,0],seen:now,seq:-1};sessions.set(id,s);return send(res,200,{id,name:s.name,dev,version:VERSION,catalog:catalog.map(items=>items.map(i=>({name:i.name,kind:i.kind})))})
   }
   const s=authenticate(req);if(!s)return send(res,401,{error:'Connection expired — reconnect'});s.seen=now;
   if(pathname==='/api/events'&&req.method==='GET'){
    if(s.stream)s.stream.destroy();res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','X-Accel-Buffering':'no'});res.write(': connected\n\n');s.stream=res;s.disconnected=0;const r=roomOf(s);if(r?.match){const p=r.match.players.find(p=>p.id===s.id);if(p)p.connected=true}if(r)emit(r);
    res.on('close',()=>{if(s.stream!==res)return;s.stream=null;s.disconnected=Date.now();s.seen=Date.now();s.ready=false;const room=roomOf(s);if(room?.match){const p=room.match.players.find(p=>p.id===s.id);if(p){p.connected=false;p.input={}}}if(room?.state==='countdown'){room.state='lobby';room.countdown=0}});return
   }
   if(req.method!=='POST')return send(res,405,{error:'Use POST'});const b=await body(req);
   if(pathname==='/api/create'){if(s.room)throw Error('Leave your current room first');if(rooms.size>=40)throw Error('Server room limit reached');let code;do{code=randomBytes(4).toString('hex').slice(0,6).toUpperCase()}while(rooms.has(code));const r={code,leader:s.id,members:[s.id],state:'lobby',countdown:0,match:null};rooms.set(code,r);s.room=code;emit(r);return send(res,200,{code})}
   if(pathname==='/api/join'){if(s.room)throw Error('Leave your current room first');const code=String(b.code||'').trim().toUpperCase();if(!/^[A-F0-9]{6}$/.test(code))throw Error('Enter a six-character room code');const r=rooms.get(code);if(!r)throw Error('Room not found');if(r.state!=='lobby')throw Error('Match in progress — wait for the next run');if(r.members.length>=4)throw Error('Room is full');r.members.push(s.id);s.room=code;emit(r);return send(res,200,{code})}
   if(pathname==='/api/leave'){leave(s);return send(res,200,{ok:true})}
   const r=roomOf(s);if(!r)throw Error('Join a room first');
   if(pathname==='/api/ready'){if(r.state!=='lobby')throw Error('Match already starting');if(!s.stream)throw Error('Waiting for live connection');s.gear=catalog.map((items,i)=>Math.max(0,Math.min(items.length-1,Math.floor(Number(b.gear?.[i])||0))));s.ready=b.ready===true;emit(r)}
   else if(pathname==='/api/start'){if(r.leader!==s.id)throw Error('Only the leader can start');if(r.state!=='lobby'||r.members.length<2||!r.members.every(id=>sessions.get(id).ready&&sessions.get(id).stream))throw Error('Need 2–4 connected and ready players');r.state='countdown';r.countdown=3;emit(r)}
   else if(pathname==='/api/input'){if(r.state!=='playing'||!s.stream)throw Error('Match is not active');r.match.input(s.id,b)}
   else if(pathname==='/api/rematch'){if(r.leader!==s.id||r.state!=='results')throw Error('Leader can return the party to lobby after results');r.match=null;r.state='lobby';for(const id of r.members)sessions.get(id).ready=false;emit(r)}
   else return send(res,404,{error:'Unknown action'});
   send(res,200,{ok:true});
  }catch(error){send(res,400,{error:error.message||'Request failed'})}
 });
 const tick=setInterval(()=>{frame++;for(const r of rooms.values()){
  if(r.state==='countdown'){r.countdown=Math.max(0,r.countdown-1/30);if(!r.countdown){r.match=new Match(r.members.map(id=>({...sessions.get(id),connected:true})),catalog);r.state='playing'}}
  if(r.state==='playing'){r.match.step();if(r.match.done){r.state='results';r.match.result.rewardAvailable=!!service&&!dev;r.match.result.reward=reward(r.match.score,r.match.time);if(service&&!dev){for(const p of r.match.players)if(p.user&&p.connected&&p.activeTime>=60&&r.match.result.reward>0)outbox.push({run_id:r.match.matchId,user_id:p.user,amount:r.match.result.reward});try{persist();flush()}catch(error){console.error('Reward outbox write failed',error.message)}}}}
  if(frame%2===0)emit(r);
 }if(frame%30===0){const now=Date.now();for(const s of sessions.values())if((!s.stream&&now-s.seen>30000)||(s.disconnected&&now-s.disconnected>20000)){leave(s);sessions.delete(s.id)}for(const [ip,l]of limits)if(now-l.at>60000)limits.delete(ip)}if(frame%900===0)flush()},1000/30);
 server.on('close',()=>{clearInterval(tick);for(const s of sessions.values())s.stream?.destroy()});
 return {server,rooms,sessions,close:()=>{for(const s of sessions.values())s.stream?.destroy();return new Promise(resolve=>server.close(resolve))}};
}
if(require.main===module){const dev=process.env.DEV_GUESTS==='true';if(!dev&&(!process.env.SUPABASE_URL||!process.env.SUPABASE_PUBLISHABLE_KEY)){console.error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY, or DEV_GUESTS=true for localhost testing');process.exit(1)}const {server}=createGameServer();server.listen(Number(process.env.PORT)||8787,dev?'127.0.0.1':'0.0.0.0',()=>console.log('NEON//NULL co-op server listening on port '+(process.env.PORT||8787)+(dev?' (local unranked guests)':'')))}
module.exports={createGameServer};
