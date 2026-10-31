'use strict';
const {randomUUID,randomInt}=require('node:crypto');
const W=1280,H=800,DT=1/30,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const types=[['pursuer',6,72,18],['sprinter',3,135,12],['ranger',6,55,16],['bomber',10,55,22],['brute',24,38,28],['dasher',7,80,15],['boss',150,42,50],['shield',16,48,23],['weaver',7,95,16],['support',9,52,18],['minelayer',10,66,20]];
const bossNames=['Signal Warden','Archive Sentinel','Core Breaker'];
const reward=(score,seconds)=>seconds<60?0:Math.min(120,Math.floor(score/250),Math.floor(seconds/30)*8);
const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
const round=n=>Math.round(finite(n)*100)/100;
function compact(a,keep){let j=0;for(let i=0;i<a.length;i++)if(keep(a[i]))a[j++]=a[i];a.length=j;}
function segmentDistance(x,y,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(x-ax-t*dx,y-ay-t*dy)}
function nearest(list,x,y,eligible=()=>true){let best=null,distance=Infinity;for(const item of list)if(eligible(item)){const d=(item.x-x)**2+(item.y-y)**2;if(d<distance){best=item;distance=d}}return best}
class Match{
 constructor(players,catalog){
  this.matchId=randomUUID();this.time=0;this.wave=0;this.score=0;this.kills=0;this.bosses=0;this.enemies=[];this.shots=[];this.hostile=[];this.pickups=[];this.zones=[];this.events=[];this.decoys=[];this.eventId=0;this.nextId=0;this.next=1;this.remaining=0;this.done=false;this.result=null;
  this.players=players.slice(0,4).map((p,i)=>({id:p.id,user:p.user||null,name:p.name,appearance:p.appearance||'mono',weaponSkins:p.weaponSkins||{},connected:p.connected===true,x:W/2+(i-1.5)*55,y:H/2,hp:10,down:0,revive:0,slot:0,cool:0,dash:0,invuln:0,buff:0,overclock:0,shield:0,shieldTime:0,repair:0,repairTick:0,input:{},seq:-1,lastInput:-10,activeTime:0,moving:false,pendingDash:false,pendingReload:false,pendingUse:false,fireLocked:false,firedAt:-10,hurtAt:-10,healedAt:-10,dashedAt:-10,gear:Array.from({length:4},(_,slot)=>{
   const idx=Number.isInteger(p.gear?.[slot])&&catalog[slot]?.[p.gear[slot]]?p.gear[slot]:0,item=catalog[slot][idx],weaponIndex=slot===0?idx:slot===1?catalog[0].length+idx:-1;
   return {...item,weaponIndex,skinId:slot<2?(p.weaponSkins?.[String(weaponIndex)]||null):null,mag:item.mag||0,reserve:item.reserve||0,reload:0,cool:0};
  })}));
 }
 id(){return String(++this.nextId)}
 event(kind,x,y,extra={}){this.events.push({id:++this.eventId,kind,x:round(x),y:round(y),...extra});if(this.events.length>64)this.events.shift()}
 input(id,input){
  const p=this.players.find(p=>p.id===id);if(!p||!input||!Number.isSafeInteger(input.seq)||input.seq<0||input.seq<=p.seq)return;
  const slot=clamp(Math.floor(finite(Number(input.slot))),0,3),switched=slot!==p.slot,fire=input.fire===true;
  if(switched&&fire)p.fireLocked=true;if(!fire)p.fireLocked=false;
  if(fire&&!p.input.fire&&!switched)p.pendingUse=true;
  p.pendingDash ||= input.dash===true;p.pendingReload ||= input.reload===true;
  p.seq=input.seq;p.lastInput=this.time;p.input={x:clamp(finite(Number(input.x)),-1,1),y:clamp(finite(Number(input.y)),-1,1),aim:finite(input.aim),aimX:Number.isFinite(input.aimX)?clamp(input.aimX,26,W-26):null,aimY:Number.isFinite(input.aimY)?clamp(input.aimY,26,H-26):null,fire,revive:input.revive===true,slot};
 }
 hit(p,damage,source='collision'){
  if(p.down||p.hp<=0||p.invuln>0||!p.connected)return false;
  if(p.shield>0){p.shield--;p.invuln=.6;this.event('shield',p.x,p.y,{owner:p.id});return false}
  p.hp=Math.max(0,p.hp-Math.max(0,finite(damage)));p.invuln=.8;p.hurtAt=this.time;this.event('hurt',p.x,p.y,{owner:p.id,source});
  if(!p.hp){p.down=25;p.input={};p.pendingUse=p.pendingDash=p.pendingReload=false;this.event('down',p.x,p.y,{owner:p.id})}return true;
 }
 heal(p,n){const before=p.hp;p.hp=Math.min(10,p.hp+n);if(p.hp>before){p.healedAt=this.time;this.event('heal',p.x,p.y,{owner:p.id,amount:p.hp-before})}return p.hp-before}
 damage(e,amount,owner,kind='hit'){
  if(e.dead||!Number.isFinite(amount)||amount<=0||e.intro>0)return false;
  if(e.kind===7&&e.stun<=0&&kind!=='pierce'&&kind!=='explosion')amount*=.55;
  e.hp-=amount;e.hurtAt=this.time;
  if(e.hp>0)return false;
  e.dead=true;this.kills++;this.score+=e.boss?1000:100+e.kind*15;if(e.boss){this.bosses++;for(const z of this.zones)if(z.owner===e.id)z.left=-1;}
  this.event('explode',e.x,e.y,{boss:!!e.boss,enemyKind:e.kind,enemyType:e.type,owner,radius:e.r*1.8});
  const roll=Math.random(),dropType=e.boss?(Math.random()<.45?'heal':'ammo'):roll<.054?'heal':roll<(.054+.066*1.15)?'ammo':null;
  if(this.pickups.length<16&&dropType&&(dropType!=='ammo'||this.players.some(p=>p.connected&&p.gear.slice(0,2).some(g=>g.reserve<g.reserveMax))))this.pickups.push({id:this.id(),x:e.x,y:e.y,type:dropType,life:18});return true;
 }
 startReload(p,g){if(g.reload>0||g.mag>=g.magSize||g.reserve<=0)return false;g.reload=Math.max(.2,g.reloadTime||1);this.event('reload-start',p.x,p.y,{owner:p.id,weaponIndex:g.weaponIndex,slot:p.gear.indexOf(g),skinId:g.skinId,weaponKind:g.kind,sfx:g.sfx,reloadStyle:g.reloadStyle});return true}
 projectile(p,g,angle,damage=g.damage,extra={}){
  if(this.shots.length>=200)return;
  const speed=g.speed||550;this.shots.push({id:this.id(),owner:p.id,skinId:g.skinId,x:clamp(p.x+Math.cos(angle)*20,1,W-1),y:clamp(p.y+Math.sin(angle)*20,1,H-1),vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,speed,damage:damage*(p.buff>0?1.4:1),kind:g.kind,life:2,age:0,pierce:['rail','sniper','lance','tether','black','beam'].includes(g.kind),bounces:0,hit:[],...extra});
 }
 shoot(p,g){
  if(g.cool>0)return false;const slot=p.slot;
  if(slot<2){
   if(g.reload>0)return false;const rounds=g.ammoPerShot||1;if(g.mag<rounds){this.startReload(p,g);return false}if(this.shots.length>=200||(g.overheatUntil||0)>this.time)return false;
   g.mag-=rounds;p.firedAt=this.time;if(g.kind==='rapid'){g.heat=(g.heat||0)+1;if(g.heat>=8){g.heat=0;g.overheatUntil=this.time+1.05;this.event('overheat',p.x,p.y,{owner:p.id})}}
   const count=Math.min(7,g.spread||1),spacing=g.spreadWidth||.12;
   if(g.kind==='burst-rifle'){for(let i=0;i<3;i++)this.projectile(p,g,p.input.aim+(i-1)*.025,g.damage,{delay:i*.065})}
   else for(let n=0;n<count;n++)this.projectile(p,g,p.input.aim+(n-(count-1)/2)*spacing+(g.kind==='rapid'?(Math.random()-.5)*.045:0));
   const kick=g.kind==='lance'?10:['sniper','revolver','grenade'].includes(g.kind)?6:g.kind==='auto-shotgun'?4:1.5;
   p.x=clamp(p.x-Math.cos(p.input.aim)*kick,20,W-20);p.y=clamp(p.y-Math.sin(p.input.aim)*kick,20,H-20);
   if(!g.mag&&g.reserve)this.startReload(p,g);
  }else if(slot===2){
   let kills=0;const combo=g.kind==='sword'&&this.time<(p.comboUntil||0)?p.combo||0:0;
   if(g.kind==='sword'){p.combo=(combo+1)%3;p.comboUntil=this.time+.9}
   for(const e of this.enemies)if(!e.dead&&Math.hypot(e.x-p.x,e.y-p.y)<g.reach+e.r){const delta=Math.atan2(Math.sin(Math.atan2(e.y-p.y,e.x-p.x)-p.input.aim),Math.cos(Math.atan2(e.y-p.y,e.x-p.x)-p.input.aim));if(Math.abs(delta)>(g.arc||1)/2)continue;
    if(this.damage(e,(g.kind==='drill'?g.damage*2:g.damage+combo*2)*(p.buff>0?1.35:1),p.id))kills++;
    if(g.kind==='knife'||g.kind==='dual'){e.burn=g.kind==='knife'?1.15:.55;e.burnTick=.22;e.burnOwner=p.id}
    if(g.kind==='baton')e.stun=Math.max(e.stun||0,.65);
    if(g.kind==='fist'||g.kind==='greatsword'){e.x=clamp(e.x+Math.cos(p.input.aim)*(g.kind==='fist'?14:35),e.r,W-e.r);e.y=clamp(e.y+Math.sin(p.input.aim)*(g.kind==='fist'?14:35),e.r,H-e.r)}
    if(g.kind==='hammer')this.splash(e.x,e.y,58,3,p.id,e);
   }
   if(g.kind==='scythe'&&kills)this.heal(p,1);
   this.event('slash',p.x,p.y,{owner:p.id,angle:p.input.aim,reach:g.reach||60,arc:g.arc||1,weaponKind:g.kind});
  }else{
   const power=g.power||({medkit:2,horn:6,warpgrenade:12,shield:3,decoy:6,overclock:6,repair:4,timeslow:2}[g.kind]||1),x=p.input.aimX??clamp(p.x+Math.cos(p.input.aim)*200,26,W-26),y=p.input.aimY??clamp(p.y+Math.sin(p.input.aim)*200,26,H-26);
   switch(g.kind){
    case 'medkit':if(p.hp>=10)return false;this.heal(p,power);break;
    case 'horn':for(const q of this.players)if(q.connected&&!q.down&&Math.hypot(q.x-p.x,q.y-p.y)<340)q.buff=Math.max(q.buff,power);break;
    case 'overclock':p.overclock=power;p.buff=Math.max(p.buff,power);break;
    case 'repair':p.repair=power*1.3;p.repairTick=.45;break;
    case 'shield':p.shield=power+1;p.shieldTime=12;break;
    case 'teleport':this.event('teleport',p.x,p.y,{owner:p.id});p.x=x;p.y=y;p.invuln=Math.max(p.invuln,.25);break;
    case 'ammo':for(const item of p.gear.slice(0,2)){item.mag=item.magSize;item.reserve=Math.min(item.reserveMax,item.reserve+Math.ceil(item.reserveMax*.22));item.reload=0;item.cool=0}p.gear[2].cool=0;p.buff=Math.max(p.buff,2);break;
    case 'warpgrenade':this.splash(x,y,116,power,p.id);this.event('explode',x,y,{radius:116});break;
    case 'timeslow':for(const e of this.enemies){e.stun=Math.max(e.stun||0,Math.min(3,power));e.slow=Math.max(e.slow||0,5)}for(const s of this.hostile){s.vx*=.35;s.vy*=.35}break;
    case 'decoy':compact(this.decoys,d=>d.owner!==p.id);this.decoys.push({id:this.id(),owner:p.id,x,y,life:power});break;
   }
  }
  g.cool=(slot===3?g.cooldown:g.rate||g.cooldown||.4)*(p.overclock>0&&slot<3?.72:1);p.cool=g.cool;
  this.event(slot<2?'fire':'ability',p.x,p.y,{owner:p.id,slot,skinId:g.skinId,angle:p.input.aim,weaponKind:g.kind,weaponIndex:g.weaponIndex,sfx:g.sfx,reloadStyle:g.reloadStyle,recoil:g.recoil||.07});return true;
 }
 splash(x,y,r,damage,owner,exclude){for(const e of this.enemies)if(!e.dead&&e!==exclude&&Math.hypot(e.x-x,e.y-y)<r+e.r)this.damage(e,damage,owner,'explosion')}
 spawn(boss=false,forcedKind){
  if(this.enemies.length>=30||boss&&this.enemies.some(e=>e.boss&&!e.dead))return null;
  const pool=[0,1,...(this.wave>=2?[2]:[]),...(this.wave>=3?[3,5]:[]),...(this.wave>=4?[4,8]:[]),...(this.wave>=6?[7,9]:[]),...(this.wave>=8?[10]:[])],kind=boss?6:Number.isInteger(forcedKind)&&types[forcedKind]?forcedKind:pool[randomInt(pool.length)],t=types[kind];
  let x=32,y=32;for(let attempt=0;attempt<10;attempt++){const side=randomInt(4);x=side===0?t[3]+6:side===1?W-t[3]-6:randomInt(40,W-40);y=side===2?t[3]+6:side===3?H-t[3]-6:randomInt(40,H-40);if(!this.players.some(p=>p.connected&&!p.down&&Math.hypot(p.x-x,p.y-y)<160))break}
  if(boss){x=W/2;y=110;this.event('arrival',x,y,{bossName:bossNames[(Math.floor(this.wave/5)-1+3)%3]})}
  const hp=t[1]*(1+.45*(this.players.length-1))*(1+Math.min(2,this.wave*.07));
  const e={id:this.id(),kind,type:t[0],x,y,hp,max:hp,r:t[3],speed:t[2],timer:2+Math.random()*2,phase:0,slow:0,stun:0,burn:0,burnTick:0,boss,theme:boss?(Math.floor(this.wave/5)-1+3)%3:0,pattern:0,dropTimer:10,dead:false,intro:boss?1.3:.45,hurtAt:-10,aim:0,warning:0,state:'enter',targetX:x,targetY:y,dropTimer:10};this.enemies.push(e);return e;
 }
 zone(x,y,r,delay,kind='blast',extra={}){if(this.zones.length<24){const z={id:this.id(),x,y,r,left:delay,duration:delay,kind,...extra};this.zones.push(z);return z}return null}
 bossAttack(e,p){
  const pattern=e.pattern++%5;e.timer=e.hp<e.max/2?2.8:3.8;e.state='attack';const theme=e.theme||0;
  if(pattern===0){if(theme===1){for(let k=-1;k<=1;k++)this.zone(p.x+90*k,p.y,52,1.05,'blast',{owner:e.id})}else for(let k=0;k<3;k++)this.zone((k+.5)*W/3,theme===2?(k+.5)*H/3:H/2,W/9,1.2,'lane',{width:theme===2?H/6:W/5,axis:theme===2?'y':'x',owner:e.id})}
  else if(pattern===1){for(let k=0;k<(theme===2?8:6);k++)this.zone(randomInt(60,W-60),randomInt(60,H-60),theme===1?55:65,1.25+k*.07,'blast',{owner:e.id});if(theme===1)this.event('blackout',e.x,e.y,{duration:2.5})}
  else if(pattern===2){e.state='windup';this.zone(e.x,e.y,e.r+12,.95,'charge',{endX:clamp(p.x,65,W-65),endY:clamp(p.y,65,H-65),owner:e.id})}
  else if(pattern===3){this.zone(e.x,e.y,theme===2?175:60,1,'volley',{owner:e.id,count:theme===1?15:12,angle:theme===1?Math.atan2(p.y-e.y,p.x-e.x):this.time,fan:theme===1?1.8:Math.PI*2,speed:theme===2?130:165})}
  else {for(let k=0;k<3&&this.enemies.length<30;k++)this.spawn(false,theme===0?2:theme===1?8:4);this.zone(e.x,e.y,theme===2?155:105,1.2,'shockwave',{owner:e.id,inner:theme===2?70:35})}
 }
 tickEnemy(e,living,dt){
  if(e.dead)return;e.slow=Math.max(0,e.slow-dt);e.stun=Math.max(0,e.stun-dt);e.warning=Math.max(0,(e.warning||0)-dt);e.intro=Math.max(0,e.intro-dt);
  if(e.burn>0){e.burn-=dt;e.burnTick-=dt;if(e.burnTick<=0){e.burnTick=.22;this.damage(e,1,e.burnOwner,'burn')}}if(e.dead||e.intro>0)return;
  let p=nearest(living,e.x,e.y);if(!p)return;const decoy=nearest(this.decoys,e.x,e.y);if(decoy&&Math.hypot(decoy.x-e.x,decoy.y-e.y)<Math.hypot(p.x-e.x,p.y-e.y))p=decoy;
  const d=Math.hypot(p.x-e.x,p.y-e.y)||1,angle=Math.atan2(p.y-e.y,p.x-e.x);e.aim=angle;if(e.stun>0){e.state='stunned';return}e.timer-=dt;
  if(e.boss){
   e.dropTimer-=dt;if(e.dropTimer<=0){e.dropTimer=10;const needsHeal=living.some(p=>p.hp<10),needsAmmo=living.some(p=>p.gear.slice(0,2).some(g=>g.reserve<g.reserveMax));if(Math.random()<.5&&this.pickups.length<16&&(needsHeal||needsAmmo)){const type=needsHeal&&(!needsAmmo||Math.random()<.5)?'heal':'ammo';this.pickups.push({id:this.id(),x:clamp(e.x+Math.cos(this.time)*70,30,W-30),y:clamp(e.y+Math.sin(this.time)*70,30,H-30),type,life:12});this.event('supply',e.x,e.y,{type})}}
   if(e.chargeLeft>0){e.chargeLeft-=dt;e.x+=e.chargeVX*dt;e.y+=e.chargeVY*dt;e.state='charge';if(e.chargeLeft<=0){e.recovery=.7;e.state='recovery'}}
   else if(e.recovery>0){e.recovery-=dt;e.state='recovery'}
   else if(!this.zones.some(z=>z.owner===e.id&&z.kind==='charge'&&z.left>0)){
    e.state='patrol';if(Math.hypot(e.targetX-e.x,e.targetY-e.y)<12){e.targetX=100+Math.random()*(W-200);e.targetY=90+Math.random()*(H*.7-90)}
    const a=Math.atan2(e.targetY-e.y,e.targetX-e.x),speed=e.speed*(e.theme===1?1.4:e.theme===2?.8:1);e.x+=Math.cos(a)*speed*dt;e.y+=Math.sin(a)*speed*dt;if(e.timer<=0)this.bossAttack(e,p);
   }
  }else if(e.chargeLeft>0){e.chargeLeft-=dt;e.state='charge';e.x+=e.chargeVX*dt;e.y+=e.chargeVY*dt;if(e.chargeLeft<=0){e.recovery=.6;e.state='recovery'}}
  else if(e.recovery>0){e.recovery-=dt;e.state='recovery'}
  else{
   e.state=e.warning>0?'windup':'pursuit';let speed=e.speed*(e.slow>0?.4:1),a=angle;
   if(e.warning>0)speed=0;else if(e.kind===2||e.kind===9||e.kind===10){if(d<175){a+=Math.PI;speed*=.8}else if(d<310)speed=0}
   if(e.kind===8)a+=Math.sin(this.time*3.5+Number(e.id))*.9;
   e.x+=Math.cos(a)*speed*dt;e.y+=Math.sin(a)*speed*dt;
   if(e.timer<=0){
    e.timer=3+Math.random()*.6;
    if(e.kind===2){e.warning=.65;this.zone(e.x,e.y,10,.65,'shot',{owner:e.id,angle,count:1,speed:190})}
    if(e.kind===3&&d<200){e.warning=1.2;this.zone(e.x,e.y,105,1.2,'blast',{owner:e.id,bomber:true})}
    if(e.kind===5){e.warning=.8;this.zone(e.x,e.y,e.r+12,.8,'charge',{owner:e.id,endX:clamp(p.x,24,W-24),endY:clamp(p.y,24,H-24)})}
    if(e.kind===9){let healed=0;for(const ally of this.enemies)if(ally!==e&&!ally.boss&&!ally.dead&&ally.hp<ally.max&&Math.hypot(ally.x-e.x,ally.y-e.y)<190){ally.hp=Math.min(ally.max,ally.hp+2);healed++}if(healed)this.event('enemy-heal',e.x,e.y,{radius:190})}
    if(e.kind===10)this.zone(e.x,e.y,62,1.6,'blast',{owner:e.id,mine:true});
   }
  }
  e.x=clamp(e.x,e.r+4,W-e.r-4);e.y=clamp(e.y,e.r+4,H-e.r-4);
  for(const q of living)if(Math.hypot(q.x-e.x,q.y-e.y)<e.r+12)this.hit(q,e.kind===4||e.kind===7||e.boss?2:1,e.type);
 }
 step(dt=DT){
  if(this.done)return;dt=clamp(finite(dt),0,.1);if(!dt)return;this.time+=dt;
  for(const p of this.players){
   if(p.connected)p.activeTime+=dt;for(const field of ['invuln','dash','buff','overclock','shieldTime'])p[field]=Math.max(0,p[field]-dt);if(!p.shieldTime)p.shield=0;
   for(const g of p.gear){g.cool=Math.max(0,g.cool-dt);if(g.reload>0){g.reload=Math.max(0,g.reload-dt);if(!g.reload){const n=Math.min(g.magSize-g.mag,g.reserve);g.mag+=n;g.reserve-=n;this.event('reload',p.x,p.y,{owner:p.id,weaponIndex:g.weaponIndex,slot:p.gear.indexOf(g),skinId:g.skinId,weaponKind:g.kind,sfx:g.sfx,reloadStyle:g.reloadStyle})}}}
   if(p.down||p.hp<=0||!p.connected){p.moving=false;p.pendingDash=p.pendingReload=p.pendingUse=false;continue}
   if(p.repair>0){p.repair=Math.max(0,p.repair-dt);p.repairTick-=dt;if(p.repairTick<=0){p.repairTick=.9;this.heal(p,1)}}
   const fresh=this.time-p.lastInput<.5,i=fresh?p.input:{};p.slot=i.slot??p.slot;const len=Math.max(1,Math.hypot(i.x||0,i.y||0));p.moving=!!(i.x||i.y);
   if(fresh&&p.pendingDash&&!p.dash){const moving=i.x||i.y,dx=moving?i.x/len:Math.cos(i.aim||0),dy=moving?i.y/len:Math.sin(i.aim||0);p.dash=2.6;p.invuln=Math.max(p.invuln,.3);p.dashedAt=this.time;p.x=clamp(p.x+dx*110,20,W-20);p.y=clamp(p.y+dy*110,20,H-20);this.event('dash',p.x,p.y,{owner:p.id})}p.pendingDash=false;
   p.x=clamp(p.x+(i.x||0)/len*230*dt,20,W-20);p.y=clamp(p.y+(i.y||0)/len*230*dt,20,H-20);
   const g=p.gear[p.slot];if(fresh&&p.pendingReload&&p.slot<2)this.startReload(p,g);p.pendingReload=false;
   if(fresh&&!p.fireLocked&&(p.slot<3?i.fire:p.pendingUse))this.shoot(p,g);p.pendingUse=false;p.cool=Math.max(g.cool,(g.overheatUntil||0)-this.time);
  }
  let living=this.players.filter(p=>p.connected&&!p.down&&p.hp>0);
  for(const p of this.players)if(p.down>0&&p.connected){p.down=Math.max(.01,p.down-dt);let helpers=0;for(const q of living)if(this.time-q.lastInput<.5&&q.input.revive&&Math.hypot(q.x-p.x,q.y-p.y)<72)helpers++;p.revive=helpers?p.revive+dt:Math.max(0,p.revive-dt);if(p.revive>=2){p.down=0;p.hp=4;p.invuln=2;p.revive=0;this.event('revive',p.x,p.y,{owner:p.id})}}
  living=this.players.filter(p=>p.connected&&!p.down&&p.hp>0);
  if(!living.length){if(this.players.some(p=>!p.connected&&p.hp>0))return;this.done=true;this.result={id:this.matchId,time:this.time,score:this.score,wave:this.wave,kills:this.kills,bosses:this.bosses,reward:reward(this.score,this.time)};return}
  if(!this.enemies.some(e=>!e.dead)&&!this.remaining&&this.time>this.next){this.wave++;this.remaining=Math.min(24,5+this.wave*2+this.players.length*2);if(this.wave%5===0)this.spawn(true);this.next=this.time+1.5;this.event('wave',W/2,H/2,{wave:this.wave})}
  if(this.remaining&&this.time>this.next&&this.enemies.length<30){const n=Math.min(this.remaining,3+randomInt(5),30-this.enemies.length);for(let k=0;k<n;k++)this.spawn();this.remaining-=n;this.next=this.time+2+Math.random()*2;this.event('incoming',W/2,35,{count:n})}
  for(const e of this.enemies)this.tickEnemy(e,living,dt);
  for(const z of this.zones){z.left-=dt;if(z.left>0)continue;const owner=this.enemies.find(e=>e.id===z.owner&&!e.dead);
   if(z.owner&&!owner)continue;
   if(z.kind==='charge'&&owner){const distance=Math.hypot(z.endX-owner.x,z.endY-owner.y)||1,speed=owner.boss?440:350;owner.chargeLeft=Math.min(1,distance/speed);owner.chargeVX=(z.endX-owner.x)/distance*speed;owner.chargeVY=(z.endY-owner.y)/distance*speed;owner.warning=0;continue}
   if(z.kind==='shot'||z.kind==='volley'){if(owner)for(let k=0;k<(z.count||1);k++){const fan=z.fan||0,a=z.angle+(fan===Math.PI*2?k*fan/z.count:z.count>1?(k/(z.count-1)-.5)*fan:0);this.hostileShot({x:z.x,y:z.y},a,z.speed||170)}continue}
   for(const p of living){const distance=Math.hypot(p.x-z.x,p.y-z.y),hit=z.kind==='lane'?Math.abs((z.axis==='y'?p.y:p.x)-(z.axis==='y'?z.y:z.x))<z.width/2:z.kind==='shockwave'?distance<z.r+12&&distance>(z.inner||0)-12:distance<z.r+12;if(hit)this.hit(p,2,z.bomber?'bomber':z.kind)}this.event('explode',z.x,z.y,{radius:z.r,enemyKind:z.bomber?3:undefined});
  }compact(this.zones,z=>z.left>0);
  for(const s of this.shots){if(s.delay>0){s.delay-=dt;continue}const ox=s.x,oy=s.y;s.age+=dt;s.life-=dt;
   if(s.kind==='boomer'&&s.age>.55){const owner=this.players.find(p=>p.id===s.owner);if(owner){const a=Math.atan2(owner.y-s.y,owner.x-s.x);s.vx=Math.cos(a)*s.speed;s.vy=Math.sin(a)*s.speed;if(Math.hypot(owner.x-s.x,owner.y-s.y)<20){s.life=0;continue}}}
   if(s.kind==='seek'){const target=nearest(this.enemies,s.x,s.y,e=>!e.dead);if(target){const a=Math.atan2(target.y-s.y,target.x-s.x),turn=Math.min(1,dt*5);s.vx+=(Math.cos(a)*s.speed-s.vx)*turn;s.vy+=(Math.sin(a)*s.speed-s.vy)*turn}}
   s.x+=s.vx*dt;s.y+=s.vy*dt;
   if(s.kind==='ricochet-cannon'&&s.bounces<2&&(s.x<6||s.x>W-6||s.y<6||s.y>H-6)){if(s.x<6||s.x>W-6)s.vx=-s.vx;if(s.y<6||s.y>H-6)s.vy=-s.vy;s.x=clamp(s.x,6,W-6);s.y=clamp(s.y,6,H-6);s.bounces++}
   for(const e of this.enemies)if(!e.dead&&!s.hit.includes(e.id)&&segmentDistance(e.x,e.y,ox,oy,s.x,s.y)<e.r+4){
    s.hit.push(e.id);this.damage(e,s.damage*(s.kind==='auto-shotgun'?Math.max(.35,1-s.age*.65):1),s.owner,s.pierce?'pierce':'hit');
    if(['nova','grenade','black','flare','lance'].includes(s.kind)){const r=s.kind==='black'?130:s.kind==='grenade'?116:s.kind==='nova'?104:s.kind==='lance'?62:72;this.splash(e.x,e.y,r,s.damage*.65,s.owner,e);this.event('explode',e.x,e.y,{radius:r});if(s.kind==='black')for(const q of this.enemies)if(!q.dead&&Math.hypot(q.x-e.x,q.y-e.y)<r){q.x+=(e.x-q.x)*.3;q.y+=(e.y-q.y)*.3;q.slow=2}}
    if(s.kind==='arc'){const next=nearest(this.enemies,e.x,e.y,q=>!q.dead&&!s.hit.includes(q.id)&&Math.hypot(q.x-e.x,q.y-e.y)<140);if(next){this.damage(next,s.damage*.8,s.owner,'pierce');this.event('chain',e.x,e.y,{endX:next.x,endY:next.y})}}
    if(s.kind==='emp'){e.stun=Math.max(e.stun,.8);e.slow=2;for(const q of this.enemies)if(Math.hypot(q.x-e.x,q.y-e.y)<72)q.slow=2}
    if(s.kind==='flare'){e.burn=2;e.burnTick=.3;e.burnOwner=s.owner}if(s.kind==='tether'){e.stun=Math.max(e.stun,.6);const owner=this.players.find(p=>p.id===s.owner);if(owner){e.x+=(owner.x-e.x)*.15;e.y+=(owner.y-e.y)*.15}}
    if(['ricochet','ricochet-cannon'].includes(s.kind)&&s.bounces<2){const next=nearest(this.enemies,e.x,e.y,q=>!q.dead&&!s.hit.includes(q.id));if(next){const a=Math.atan2(next.y-e.y,next.x-e.x);s.vx=Math.cos(a)*s.speed;s.vy=Math.sin(a)*s.speed;s.x=e.x;s.y=e.y;s.bounces++;break}}
    if(!s.pierce&&s.kind!=='boomer'||s.kind==='beam'&&s.hit.length>=3){s.life=0;break}
   }
  }compact(this.shots,s=>s.life>0&&s.x>0&&s.x<W&&s.y>0&&s.y<H);
  for(const s of this.hostile){const ox=s.x,oy=s.y;s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;const decoy=this.decoys.find(d=>segmentDistance(d.x,d.y,ox,oy,s.x,s.y)<20);if(decoy){s.life=0;continue}for(const p of living)if(segmentDistance(p.x,p.y,ox,oy,s.x,s.y)<16){this.hit(p,1,'projectile');s.life=0;break}}compact(this.hostile,s=>s.life>0&&s.x>-20&&s.x<W+20&&s.y>-20&&s.y<H+20);
  for(const drop of this.pickups){drop.life-=dt;const p=living.find(p=>Math.hypot(p.x-drop.x,p.y-drop.y)<30&&(drop.type==='heal'?p.hp<10:p.gear.slice(0,2).some(g=>g.reserve<g.reserveMax)));if(p){if(drop.type==='heal')this.heal(p,1);else for(const g of p.gear.slice(0,2))g.reserve=Math.min(g.reserveMax,g.reserve+g.magSize*16);drop.life=0;this.event('pickup',p.x,p.y,{type:drop.type,owner:p.id})}}
  for(const d of this.decoys)d.life-=dt;compact(this.decoys,d=>d.life>0);compact(this.pickups,p=>p.life>0);compact(this.enemies,e=>!e.dead);
 }
 hostileShot(e,a,speed){if(this.hostile.length<120)this.hostile.push({id:this.id(),x:e.x,y:e.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:6})}
 snapshot(){return {id:this.matchId,time:round(this.time),wave:this.wave,score:this.score,kills:this.kills,bosses:this.bosses,done:this.done,result:this.result,
  players:this.players.map(p=>({id:p.id,name:p.name,appearance:p.appearance,activeSkin:p.gear[p.slot]?.skinId||null,weaponIndex:p.gear[p.slot]?.weaponIndex??-1,moving:p.moving,firing:this.time-p.firedAt<.12,dashing:this.time-p.dashedAt<.22,hurt:this.time-p.hurtAt<.2,healing:this.time-p.healedAt<.6,reloadProgress:p.gear[p.slot]?.reload>0?round(1-p.gear[p.slot].reload/p.gear[p.slot].reloadTime):0,x:round(p.x),y:round(p.y),hp:p.hp,down:round(p.down),revive:round(p.revive),connected:p.connected,slot:p.slot,aim:round(p.input.aim||0),dash:round(p.dash),shield:p.shield,buff:round(p.buff),repair:round(p.repair),seq:p.seq,gear:p.gear.map(g=>({name:g.name,kind:g.kind,sfx:g.sfx,reloadStyle:g.reloadStyle,skinId:g.skinId,weaponIndex:g.weaponIndex,mag:g.mag,magSize:g.magSize,reserve:g.reserve,reserveMax:g.reserveMax,reload:round(g.reload),reloadTime:g.reloadTime,cooldown:round(Math.max(g.cool,(g.overheatUntil||0)-this.time)),cooldownMax:Math.max(g.rate||g.cooldown,(g.overheatUntil||0)>this.time?1.05:0)}))})),
  enemies:this.enemies.map(e=>({id:e.id,kind:e.kind,type:e.type,name:e.boss?bossNames[e.theme]:e.type,x:round(e.x),y:round(e.y),hp:round(e.hp),max:round(e.max),r:e.r,boss:e.boss,theme:e.theme,state:e.state,aim:round(e.aim),warning:round(e.warning),intro:round(e.intro),shielded:e.kind===7&&e.stun<=0,hurt:this.time-e.hurtAt<.16})),
  shots:this.shots.filter(s=>!s.delay||s.delay<=0).map(s=>({id:s.id,x:round(s.x),y:round(s.y),owner:s.owner,skinId:s.skinId,kind:s.kind,angle:round(Math.atan2(s.vy,s.vx))})),hostile:this.hostile.map(s=>({id:s.id,x:round(s.x),y:round(s.y),vx:round(s.vx),vy:round(s.vy)})),pickups:this.pickups,zones:this.zones,decoys:this.decoys,events:this.events};}
}
module.exports={Match,reward,W,H};
