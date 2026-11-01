const assert=require('node:assert/strict'),{performance}=require('node:perf_hooks'),{Match,W,H}=require('./engine.cjs'),catalog=require('./catalog.json');
const players=Array.from({length:4},(_,i)=>({id:'p'+i,name:'Player'+i,connected:true,gear:[0,0,0,0]}));
const make=(gear=[0,0,0,0])=>{const m=new Match(players.map(p=>({...p,gear:[...gear]})),catalog);m.next=1e9;return m};
const tick=(m,seconds)=>{for(let n=0;n<Math.ceil(seconds*30);n++)m.step()};
let m=make(),p=m.players[0];
// Input payloads cannot inject nonfinite state, actions or damage; duplicate sequence ignored.
m.input(p.id,{seq:0,x:Infinity,y:NaN,aim:Infinity,damage:1e9});m.step();assert(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.equal(p.input.aim,0);
m.input(p.id,{seq:0,x:1});assert.equal(p.input.x,0);
// Movement and dash are normalized; held/stale dash packets cannot repeat automatically.
const x=p.x,y=p.y;m.input(p.id,{seq:1,x:1,y:1,dash:true,aim:0});m.step();assert(Math.abs(Math.hypot(p.x-x,p.y-y)-110-230/30)<1e-6);const lastDash=p.dashedAt;tick(m,3);assert.equal(p.dashedAt,lastDash);
// Utility cooldown belongs to its equipment, so it never blocks firing a primary.
m=make();p=m.players[0];p.hp=8;p.slot=3;p.input.aim=0;assert(m.shoot(p,p.gear[3]));assert.equal(p.hp,10);assert.equal(p.gear[3].cool,30);p.slot=0;assert(m.shoot(p,p.gear[0]));assert.equal(p.gear[0].mag,7);assert.equal(p.gear[3].cool,30);
p.slot=3;p.hp=9;assert.equal(m.shoot(p,p.gear[3]),false);
// Held melee continues its cadence; changing slots still requires releasing the trigger.
m=make();p=m.players[0];const practice=m.spawn(false,0);practice.intro=0;practice.x=p.x+10;practice.y=p.y;practice.speed=0;practice.timer=1e6;practice.hp=practice.max=100;
for(let n=0;n<27;n++){m.input(p.id,{seq:n,slot:2,fire:n>0,aim:0});m.step()}assert(practice.hp<100&&m.events.filter(e=>e.kind==='slash'&&e.owner===p.id).length>=2,'Balanced melee must repeat at its cooldown while LMB is held');
// Full-health Medkit does not enter cooldown. Ranged and utility selection do not activate on held click.
m=make();p=m.players[0];p.slot=3;assert.equal(m.shoot(p,p.gear[3]),false);assert.equal(p.gear[3].cool,0);p.slot=0;m.input(p.id,{seq:1,slot:3,fire:true});m.step();assert.equal(p.gear[3].cool,0);assert(p.fireLocked);m.input(p.id,{seq:2,slot:3,fire:false});m.step();assert.equal(p.fireLocked,false);
// Three-round burst consumes three rounds and produces delayed subshots; not one free burst per round.
m=make([10,0,0,0]);p=m.players[0];p.input.aim=0;assert(m.shoot(p,p.gear[0]));assert.equal(p.gear[0].mag,12);assert.deepEqual(m.shots.map(s=>s.delay),[0,.065,.13]);p.gear[0].cool=0;p.gear[0].mag=2;assert.equal(m.shoot(p,p.gear[0]),false);assert.equal(p.gear[0].mag,2);assert(p.gear[0].reload>0);
// Reload remains independent across switching, pickups, manual/automatic attempts and pause-sized steps.
m=make();p=m.players[0];p.gear[0].mag=0;p.gear[0].reserve=3;assert(m.startReload(p,p.gear[0]));assert.equal(m.startReload(p,p.gear[0]),false);p.slot=1;tick(m,1.1);assert.equal(p.gear[0].mag,3);assert.equal(p.gear[0].reserve,0);assert.equal(m.events.filter(e=>e.kind==='reload'&&e.owner===p.id).length,1);
// Every item is usable, with finite state, and server owns its stats.
for(let slot=0;slot<4;slot++)for(let index=0;index<catalog[slot].length;index++){
 const gear=[0,0,0,0];gear[slot]=index;m=make(gear);p=m.players[0];p.slot=slot;p.input.aim=0;p.hp=6;const e=m.spawn(false,0);e.x=p.x+32;e.y=p.y;e.intro=0;e.hp=e.max=100;
 assert(m.shoot(p,p.gear[slot]),p.gear[slot].name);tick(m,.6);assert(!JSON.stringify(m.snapshot()).includes('null,"y"'),p.gear[slot].name);for(const q of m.players)assert(Number.isFinite(q.x)&&Number.isFinite(q.hp));
}
// Bomber attacks hurt players once with no enemy/self damage. Defeated caster cancels pending hazards.
m=make();p=m.players[0];const bomber=m.spawn(false,3);bomber.x=p.x+85;bomber.y=p.y;bomber.intro=0;bomber.timer=1e6;const target=m.spawn(false,0);target.x=p.x+65;target.y=p.y;target.intro=0;target.timer=1e6;target.speed=0;bomber.speed=0;const before=[bomber.hp,target.hp];m.zone(p.x,p.y,105,.1,'blast',{owner:bomber.id,bomber:true});p.invuln=0;m.step(.1);assert.deepEqual([bomber.hp,target.hp],before);assert(p.hp<10);const hull=p.hp;m.step(.1);assert.equal(p.hp,hull);assert.equal(m.zones.length,0);
m.zone(p.x,p.y,105,.1,'blast',{owner:bomber.id});m.damage(bomber,1e9,p.id);p.invuln=0;const safe=p.hp;m.step(.1);assert.equal(p.hp,safe);
// Dash telegraph must finish before charging and cannot retarget after warning.
m=make();p=m.players[0];const dasher=m.spawn(false,5);dasher.intro=0;dasher.x=100;dasher.y=100;dasher.timer=0;m.step();const warning=m.zones.find(z=>z.kind==='charge');assert(warning);assert(!dasher.chargeLeft);const end=warning.endX;p.x=1000;m.step(.1);assert.equal(warning.endX,end);tick(m,.8);assert(dasher.chargeLeft>0);
// Stale revive input does not resurrect; fresh inputs do.
m=make();p=m.players[0];const down=m.players[1];down.hp=0;down.down=25;down.x=p.x+10;down.y=p.y;m.input(p.id,{seq:0,revive:true});tick(m,2.2);assert(down.down>0);for(let k=1;k<70;k++){m.input(p.id,{seq:k,revive:true});m.step()}assert.equal(down.hp,4);
// Expanded enemies, bosses, snapshots and five patterns each remain bounded.
for(let theme=0;theme<3;theme++){m=make();m.wave=(theme+1)*5;const boss=m.spawn(true);boss.intro=0;boss.theme=theme;for(let n=0;n<5;n++){boss.timer=0;boss.recovery=0;boss.chargeLeft=0;m.zones.length=0;m.step();assert.equal(boss.pattern,n+1)}assert(m.enemies.length<=30);assert(m.hostile.length<=120);assert(m.zones.length<=24)}
for(let kind of [7,8,9,10]){m=make();const e=m.spawn(false,kind);e.intro=0;e.timer=0;tick(m,1);assert.equal(e.kind,kind);assert(Number.isFinite(e.x));}

// Melee geometry uses half the described arc; utility effects retain different roles.
m=make([0,0,6,0]);p=m.players[0];p.slot=2;p.input.aim=0;const front=m.spawn(false,0),side=m.spawn(false,0);for(const e of [front,side]){e.intro=0;e.hp=e.max=100}front.x=p.x+75;front.y=p.y;side.x=p.x+65;side.y=p.y+40;m.shoot(p,p.gear[2]);assert(front.hp<100);assert.equal(side.hp,100);
m=make([0,0,0,8]);p=m.players[0];p.slot=3;p.hp=5;p.input.aim=0;m.shoot(p,p.gear[3]);assert.equal(p.hp,5);tick(m,.6);assert.equal(p.hp,6);assert(p.repair>0);
m=make([0,0,0,1]);p=m.players[0];p.slot=3;p.input.aim=0;m.players[1].x=p.x+30;m.shoot(p,p.gear[3]);assert(p.buff>0&&m.players[1].buff>0);
m=make([0,0,0,4]);p=m.players[0];p.slot=3;p.input.aim=0;p.input.aimX=700;p.input.aimY=350;m.shoot(p,p.gear[3]);assert.equal(m.decoys.length,1);assert.equal(m.decoys[0].x,700);
m=make([0,0,0,5]);p=m.players[0];p.slot=3;p.input.aim=0;p.input.aimX=900;p.input.aimY=600;m.shoot(p,p.gear[3]);assert.equal(p.x,900);assert.equal(p.y,600);
// Boss patrol target remains independent from player location until a warned charge.
m=make();m.wave=5;const independent=m.spawn(true);independent.intro=0;independent.x=300;independent.y=250;independent.targetX=600;independent.targetY=250;independent.timer=100;m.players[0].x=50;m.players[0].y=250;m.step();assert(independent.x>300);assert.equal(independent.y,250);

// Boss supply clock starts at spawn and rolls at ten seconds, even without ordinary enemy deaths.
m=make();m.wave=5;const supplier=m.spawn(true);supplier.intro=0;supplier.speed=0;supplier.timer=1e6;m.players[0].hp=9;const random=Math.random;
try{Math.random=()=>.1;tick(m,9.8);assert.equal(m.pickups.length,0);tick(m,.4);assert.equal(m.pickups.length,1);assert.equal(m.pickups[0].type,'heal')}finally{Math.random=random}
// Lance penetrates and shields block the three hits described by the loadout.
m=make([9,0,0,3]);p=m.players[0];p.input.aim=0;assert(m.shoot(p,p.gear[0]));assert(m.shots[0].pierce);p.slot=3;assert(m.shoot(p,p.gear[3]));assert.equal(p.shield,3);
console.log('PASS combat parity: 46 item use, per-item cooldowns, 3-round burst, reloads, switch release, normalized movement, one-shot dash, stale revive, bomber source rules, timed supplies, piercing lance and three-hit shield');
// Sustained controlled four-player stress: 30 enemies, continuous shots, capped hostile bursts.
function profile(Engine,label){const match=new Engine(players.map((p,i)=>({...p,gear:[i===0?1:i===1?12:i===2?10:15,0,0,0]})),catalog);match.next=1e9;match.wave=10;for(let n=0;n<30;n++){match.spawn(false);const e=match.enemies.at(-1);e.hp=e.max=1e9;e.intro=0;e.speed=0;e.timer=1e9;e.x=80+(n%10)*120;e.y=80+Math.floor(n/10)*300}const steps=[],snaps=[],bytes=[];for(let n=0;n<5400;n++){for(let k=0;k<4;k++){const q=match.players[k];q.invuln=1;q.gear[0].mag=q.gear[0].magSize;q.gear[0].reserve=q.gear[0].reserveMax;q.gear[0].reload=0;match.input(q.id,{seq:n,fire:true,aim:n*.02+k*Math.PI/2,x:Math.sin(n*.02+k),y:Math.cos(n*.02+k),slot:0})}if(n%10===0)for(let k=0;k<20;k++)match.hostileShot(match.enemies[k],n*.02+k,170);const start=performance.now();match.step();if(n>299)steps.push(performance.now()-start);if(n%2===0){const a=performance.now(),wire=JSON.stringify(match.snapshot());if(n>299){snaps.push(performance.now()-a);bytes.push(Buffer.byteLength(wire))}}assert(match.enemies.length<=30&&match.shots.length<=200&&match.hostile.length<=120&&match.zones.length<=24)}const stats=a=>{a.sort((x,y)=>x-y);return{p50:+a[Math.floor(a.length*.5)].toFixed(3),p95:+a[Math.floor(a.length*.95)].toFixed(3),max:+a.at(-1).toFixed(3)}};return {label,simulatedSeconds:180,stepMs:stats(steps),serializeMs:stats(snaps),averageSnapshotBytes:Math.round(bytes.reduce((a,b)=>a+b,0)/bytes.length),entities:{enemies:match.enemies.length,shots:match.shots.length,hostile:match.hostile.length}}}
const results=[profile(Match,'updated')];try{results.unshift(profile(require('../outputs/neon-null-v4.9-bundle/multiplayer/engine.cjs').Match,'v4.9 baseline'))}catch(error){console.log('Baseline unavailable:',error.message)}console.log(JSON.stringify(results,null,2));
