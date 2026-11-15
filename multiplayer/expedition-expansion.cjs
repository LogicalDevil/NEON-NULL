'use strict';
// Server-owned evolution choices, bounded combat history and cooperative effects.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function segment(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)}
function data(p){return p.insights||(p.insights={recent:[],weaponDamage:{},prevented:0,combos:0,eliteKills:0,interrupts:0})}
function record(m,p,type,extra={}){const d=data(p);d.recent.push({id:m.matchId+':'+p.id+':'+(p.insightSerial=(p.insightSerial||0)+1),at:Math.round(m.time*100)/100,type,x:Math.round(p.x),y:Math.round(p.y),...extra});if(d.recent.length>32)d.recent.shift()}
function combo(m,a,b,label,x,y){if(!a||!b||a.id===b.id)return;data(a).combos++;data(b).combos++;a.supportActions++;b.supportActions++;m.event('combo',x,y,{owner:a.id,helper:b.id,label})}
function install(Match){if(Match.prototype.expeditionInstalled)return;Match.prototype.expeditionInstalled=true;
 const wrap=(key,fn)=>{const old=Match.prototype[key];Match.prototype[key]=function(...args){return fn.call(this,old,...args)}};
 Match.prototype.spawnFreight=function(type){const defs=require('./freight-catalog.cjs'),d=defs.byId(type);if(!d||this.enemies.length>=30||d.miniBoss&&this.enemies.some(e=>e.freightType===type&&!e.dead))return null;const e=this.spawn(false,0);if(!e)return null;Object.assign(e,{kind:16+defs.types.indexOf(d),type,freightType:type,name:d.name,hp:d.hp,max:d.hp,r:d.r,speed:d.speed,elite:true,boss:false,staggerMax:Math.max(12,d.hp*.3),intro:1.2});this.event('elite-arrival',e.x,e.y,{label:d.name});return e};
 wrap('setSectorStage',function(old,stage){old.call(this,stage);if(stage===0){this.sector.freight={time:0,phase:'idle',left:9,x:-160,y:610,powered:false,doorUntil:0,steamAt:12,steamLeft:0};this.sector.objects.push({id:'freight-power',kind:'terminal',label:'Power freight lights · E',x:1080,y:200,r:20},{id:'freight-door',kind:'terminal',label:'Security shutter · E · 8s enemy slow',x:170,y:510,r:20},{id:'freight-comms',kind:'terminal',label:'Disable Marshal reinforcements · E',x:1080,y:490,r:20});for(let i=0;i<3;i++)this.sector.objects.push({id:'freight-cover-'+i,kind:'cover',label:'Breakable shot cover · walk-through',x:340+i*270,y:320,r:20,hp:14,max:14})}if(stage===1)this.spawnFreight('aegis-captain');if(stage===3)this.spawnFreight('glassline-hunter');if(stage===4){this.spawnFreight('forge-tender');this.spawnFreight('yard-marshal')}});
 wrap('interactSector',function(old,p){const s=this.sector,o=s?.objects.find(o=>!o.destroyed&&o.id.startsWith('freight-')&&!o.hp&&dist(p,o)<75);if(!o)return old.call(this,p);s.freight||={phase:'idle',time:0,left:9,x:-160,y:610,steamAt:12};if(o.id==='freight-power'){s.freight.powered=true;o.destroyed=true;this.heal(p,1,p.id)}else if(o.id==='freight-door'){if(s.freight.doorUntil>this.time)return false;s.freight.doorUntil=this.time+8}else if(o.id==='freight-comms'){s.freight.commsDisabled=true;o.destroyed=true}else return false;p.interactions++;this.credit(p,'objectives');this.event('interaction',p.x,p.y,{owner:p.id,object:o.id});return true});
 wrap('tickEnemy',function(old,e,living,dt){if(!e.freightType)return old.call(this,e,living,dt);const api=this.freightAPI||=(require('./freight-behavior.cjs'));const p=living.reduce((a,b)=>!a||dist(e,b)<dist(e,a)?b:a,null);e.intro=Math.max(0,e.intro-dt);e.stun=Math.max(0,(e.stun||0)-dt);e.staggerImmune=Math.max(0,(e.staggerImmune||0)-dt);e.exposed=Math.max(0,(e.exposed||0)-dt);e.markLeft=Math.max(0,(e.markLeft||0)-dt);e.slow=Math.max(0,(e.slow||0)-dt);if(e.burn>0){e.burn-=dt;e.burnTick-=dt;if(e.burnTick<=0){const flare=require('./combat-balance.cjs').flare;e.burnTick=e.flareBurn?flare.tick:.22;this.damage(e,e.flareBurn?flare.burnDamage:1,e.burnOwner,'burn',{slot:e.burnSlot})}}if(e.intro>0||e.dead)return;api.tickEnemy(e,dt,{player:p,enemies:this.enemies,w:1280,h:800,commsDisabled:this.sector?.freight?.commsDisabled,shot:(x,y,vx,vy,damage)=>{if(this.hostile.length<120)this.hostile.push({id:this.id(),x,y,vx,vy,damage,source:e.type,life:6})},damagePlayer:(source,n,position)=>{for(const q of living)if(!position||dist(q,position)<(e.freight?.radius||e.r)+13)this.hit(q,n,source)},spawn:(type,count)=>{for(let i=0;i<count&&this.enemies.length<30;i++)this.spawn(false,0)},addCover:(x,y,life)=>{const s=this.sector;if(s&&s.objects.filter(o=>o.temporary&&!o.destroyed).length<3)s.objects.push({id:'marshal-cover-'+this.id(),kind:'cover',label:'Temporary projectile cover',x,y,r:22,hp:12,max:12,temporary:true,until:this.time+life})}});e.state=e.freight.phase;e.aim=e.freight.angle;e.warning=e.freight.phase==='warning'?e.freight.left:0});
 Match.prototype.chooseEvolution=function(p,slot,id){
  const catalog=require('./evolution-catalog.cjs'),g=p?.gear?.[slot];
  const safe=this.time<3||this.sector?.state==='choice'||(!this.enemies.some(e=>!e.dead)&&!this.remaining);
  if(!p?.connected||p.down||!safe||!Number.isInteger(slot)||!g||g.evolutionId||g.reload>0||g.cool>0||!catalog.compatible(id,g))return false;
  // An evolution is selected once per item per match, never paid from persistent currency.
  const base=require('./catalog.json')[slot].find(item=>item.kind===g.kind);if(!base)return false;
  const evolved=catalog.effective({...base,weaponIndex:g.weaponIndex,skinId:g.skinId,mag:g.mag,reserve:g.reserve,reload:g.reload,cool:g.cool},id,'server');p.gear[slot]={...evolved,evolutionId:id,modId:null};
  p.evolutions=p.evolutions||{};p.evolutions[slot]=id;record(this,p,'evolution',{slot,id});this.event('evolution',p.x,p.y,{owner:p.id,slot,label:catalog.forItem(g).find(e=>e.id===id)?.name||id});return true;
 };
 wrap('input',function(old,id,input){const before=this.players.find(p=>p.id===id)?.seq;old.call(this,id,input);const p=this.players.find(p=>p.id===id);if(input?.evolution&&p?.seq>before&&p?.seq===input.seq)this.chooseEvolution(p,input.evolution.slot,input.evolution.id)});
 wrap('hit',function(old,p,amount,source){const before=p.hp,shield=p.shield,result=old.call(this,p,amount,source);if(before>p.hp)record(this,p,'damage',{source:source||'collision',amount:before-p.hp,hp:p.hp,slot:p.slot,evolution:p.gear[p.slot]?.evolutionId||null});else if(shield>p.shield){data(p).prevented+=Math.max(0,Number(amount)||0);record(this,p,'blocked',{source:source||'collision',amount})}return result});
 wrap('heal',function(old,p,n,owner){const amount=old.call(this,p,n,owner);if(amount)record(this,p,'heal',{amount,owner:owner||p.id});return amount});
 wrap('damage',function(old,e,amount,owner,kind='hit',extra={}){
  const p=this.players.find(p=>p.id===owner),marker=e.markLeft>0&&!e.markCredited&&e.markOwner!==owner?this.players.find(p=>p.id===e.markOwner):null;
  const before=e.hp,dead=e.dead;
  if(e.freightType||e.freightGuard){this.freightAPI||=require('./freight-behavior.cjs');const a=Number.isFinite(extra.angle)?extra.angle:p?Math.atan2(e.y-p.y,e.x-p.x):0;if(!['explosion','burn'].includes(kind))amount*=this.freightAPI.damageMultiplier(e,{angle:a,player:p})}
  const g=p?.gear[Number.isInteger(extra.slot)?extra.slot:p.slot];
  if(g?.counterDamage&&e.exposed>0)amount*=g.counterDamage;
  if(g?.sequenceMark){const same=p.sequenceTarget===e.id&&this.time-(p.sequenceAt||0)<1.2;p.sequenceCount=same?Math.min(3,(p.sequenceCount||0)+1):0;p.sequenceTarget=e.id;p.sequenceAt=this.time;amount*=1+p.sequenceCount*.1}
  const result=old.call(this,e,amount,owner,kind,extra);
  if(p&&before>e.hp){const slot=Number.isInteger(extra.slot)?extra.slot:p.slot,g=p.gear[slot],key=g?.name||'Equipment';data(p).weaponDamage[key]=(data(p).weaponDamage[key]||0)+Math.min(before,before-e.hp);if(marker)combo(this,p,marker,'MARK EXPLOITED',e.x,e.y);if(!dead&&e.dead&&e.freightType)data(p).eliteKills++}
  return result;
 });
 wrap('staggerHit',function(old,e,...args){const before=e.stun;const result=old.call(this,e,...args);if(e.stun>before){const p=this.players.find(p=>p.id===args[1]);if(p&&e.recovery>0){data(p).interrupts++;record(this,p,'interrupt',{target:e.type})}}return result});
 wrap('projectile',function(old,p,g,...args){const n=this.shots.length,result=old.call(this,p,g,...args);for(const s of this.shots.slice(n)){if(g.evolutionId){s.item=g;s.evolutionId=g.evolutionId;if(g.chainTargets)s.chainLeft=g.chainTargets;s.returning=!!g.returning} }return result});
 wrap('shoot',function(old,p,g){
  const result=old.call(this,p,g);if(!result)return result;
  if(p.slot===3&&g.kind==='horn')for(const q of this.players)if(q.connected&&!q.down&&dist(p,q)<340){q.hornUntil=this.time+Math.min(8,g.power||6);q.hornOwner=p.id}
  if(g.emergencySeal&&p.slot===3){p.shield=Math.max(p.shield,1);p.shieldTime=Math.max(p.shieldTime,3)}
  return result;
 });
 wrap('step',function(old,dt=1/30){
  if(this.done)return;dt=clamp(Number.isFinite(dt)?dt:0,0,.1);
  const live=this.players.filter(p=>p.connected&&!p.down&&p.hp>0);for(const p of this.players)if(p.hornOwner&&!live.some(q=>q.id===p.hornOwner))p.hornUntil=0;for(const e of this.enemies)if(e.markOwner&&!live.some(p=>p.id===e.markOwner))e.markLeft=0;
  const f=this.sector?.freight;if(f){f.time+=dt;f.left-=dt;if(f.phase==='idle'&&f.left<=0){f.phase='warning';f.left=3;this.event('freight-warning',640,f.y,{label:'Freight approaching · clear marked tracks'})}else if(f.phase==='warning'&&f.left<=0){if(live.some(p=>Math.abs(p.y-f.y)<45))f.left=.2;else{f.phase='crossing';f.left=6;f.x=-160}}else if(f.phase==='crossing'){f.x+=270*dt;for(const p of live)if(Math.abs(p.y-f.y)<35&&Math.abs(p.x-f.x)<130)this.hit(p,2,'Freight train crossing');if(f.left<=0){f.phase='idle';f.left=14;f.x=-160}}if(f.time>f.steamAt){f.steamAt=f.time+12;f.steamLeft=1.5;this.event('freight-warning',960,400,{label:'Pressure vent · leave the marked circle'})}if(f.steamLeft>0){f.steamLeft-=dt;if(f.steamLeft<=0){for(const p of live)if(Math.hypot(p.x-960,p.y-400)<72)this.hit(p,1,'Freight pressure vent');for(const e of this.enemies)if(!e.dead&&Math.hypot(e.x-960,e.y-400)<72)this.damage(e,4,live[0]?.id,'explosion',{slot:3})}}if(f.doorUntil>this.time)for(const e of this.enemies)if(e.x<260)e.slow=Math.max(e.slow||0,.15)}
  if(this.sector)for(const o of this.sector.objects)if(o.temporary&&o.until<this.time){o.hp=0;o.destroyed=true}
  for(const s of this.shots){
   if(s.life<=0||s.delay>0)continue;
   if(s.returning&&s.age<=.4&&s.age+dt>.4&&!s.returnPass){s.hit=[];s.returnPass=true}
   const end={x:s.x+s.vx*dt,y:s.y+s.vy*dt};
   if(!s.coopCharged&&['bolt','arc','beam','rail','prism-lance','photon-carbine','ion-repeater'].includes(s.kind)){
    const ally=live.find(q=>q.id!==s.owner&&q.shield>0&&(q.chargeReady||0)<=this.time&&segment(q,s,end)<30);
    const barrier=this.arsenalFields?.find(f=>f.owner!==s.owner&&f.mode==='barrier'&&f.life>0&&f.blocks>0&&(f.chargeReady||0)<=this.time&&segment(f,s,end)<Math.min(50,f.radius||30));
    const source=ally||barrier,helper=ally||live.find(p=>p.id===barrier?.owner),shooter=live.find(p=>p.id===s.owner);
    if(source&&helper&&shooter){source.chargeReady=this.time+.8;if(ally)ally.shield--;else barrier.blocks--;s.damage*=1.15;s.coopCharged=true;combo(this,shooter,helper,'SHIELD-CHARGED SHOT',s.x,s.y)}
   }
   if(s.kind==='flare'||s.item?.burnDuration)for(const f of this.arsenalFields||[])if(f.owner!==s.owner&&f.mode==='slow'&&f.life>0&&!f.ignited&&segment(f,s,end)<Math.min(100,f.radius||60)){
    const a=live.find(p=>p.id===s.owner),b=live.find(p=>p.id===f.owner);if(a&&b){f.ignited=true;f.igniteLeft=Math.min(3,f.life);f.igniteTick=.6;combo(this,a,b,'SUPPRESSION FIELD IGNITED',f.x,f.y)}
   }
  }
  for(const f of this.arsenalFields||[])if(f.igniteLeft>0){const owner=live.find(p=>p.id===f.owner);if(!owner){f.igniteLeft=0;continue}f.igniteLeft-=dt;f.igniteTick-=dt;if(f.igniteTick<=0){f.igniteTick+=.6;for(const e of this.enemies)if(!e.dead&&dist(e,f)<Math.min(100,f.radius||60))this.damage(e,1.2,f.owner,'explosion',{slot:3});this.event('combo-field',f.x,f.y,{owner:f.owner,radius:Math.min(100,f.radius||60),duration:.2})}}
  for(const p of this.players)if(p.down>0){const helper=live.find(q=>q.input.revive&&this.time-q.lastInput<.5&&dist(p,q)<72&&(q.hornUntil||0)>this.time);if(helper){p.revive=Math.min(1.99,p.revive+dt*.25);const horn=live.find(q=>q.id===helper.hornOwner);if(horn&&horn!==helper&&this.time>(p.reviveComboAt||-1)){p.reviveComboAt=this.time+2;combo(this,helper,horn,'REVIVE SUPPORTED',p.x,p.y)}}}
  const marking=this.shots.filter(s=>s.item?.sequenceMark);const result=old.call(this,dt);for(const s of marking)if(!this.shots.includes(s)&&!s.hit.length){const p=this.players.find(p=>p.id===s.owner);if(p)p.sequenceCount=0,p.sequenceTarget=null}return result;
 });
 wrap('finish',function(old,won){if(this.done)return;old.call(this,won);this.result.insightsByPlayer={};this.result.challengeStatsByPlayer={};for(const p of this.players){const d=data(p),eligible=this.result.masteryByPlayer[p.id]?.eligible===true;this.result.insightsByPlayer[p.id]={...d,reason:won?'Extraction complete':d.recent.filter(e=>e.type==='damage').at(-1)?.source||'Team defeated',evolutions:p.evolutions||{}};this.result.challengeStatsByPlayer[p.id]={eligible,combos:eligible?d.combos:0,eliteKills:eligible?d.eliteKills:0,interrupts:eligible?d.interrupts:0,...this.result.masteryByPlayer[p.id]}}});
 wrap('snapshot',function(old){const value=old.call(this);value.evolutionSafe=this.time<3||this.sector?.state==='choice'||(!this.enemies.some(e=>!e.dead)&&!this.remaining);for(let i=0;i<value.players.length;i++)for(let j=0;j<4;j++)value.players[i].gear[j].evolutionId=this.players[i].gear[j].evolutionId||null;for(const e of value.enemies){const native=this.enemies.find(a=>a.id===e.id);if(native?.freightType){e.freight=native.freight?{...native.freight}:null;e.freightType=native.freightType;e.name=native.name}}return value});
}
module.exports={install,segment};
