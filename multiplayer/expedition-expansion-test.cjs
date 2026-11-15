'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {Match}=require('./engine.cjs'),catalog=require('./catalog.json'),evolutions=require('./evolution-catalog.cjs');
function match(mode='endless'){const m=new Match(['a','b','c'].map(id=>({id,name:id,connected:true,gear:[0,0,0,0]})),catalog,{mode,trackEligible:true});m.next=999;m.remaining=0;for(const p of m.players){p.x=100;p.y=400;p.lastInput=0;p.input={aim:0,slot:0}}return m}
function target(m,x=300,y=400){const e=m.spawn(false,4);Object.assign(e,{x,y,hp:500,max:500,speed:0,timer:999,intro:0,stun:999});return e}
{
 const m=match(),p=m.players[0];p.gear[0].damage=.01;p.gear[0].modId='pulse-through';
 assert(!m.chooseEvolution(p,0,'evo-no-such-item'));assert(m.chooseEvolution(p,0,'pulse-stormlink'));
 assert.equal(p.gear[0].damage,catalog[0][0].damage*.75);assert.equal(p.gear[0].modId,null);
 assert(!m.chooseEvolution(p,0,'pulse-needleline'));assert(!m.chooseEvolution(p,3,'pulse-needleline'));
 m.time=10;m.remaining=2;assert(!m.chooseEvolution(m.players[1],0,'pulse-needleline'));
 assert.equal(m.snapshot().players[0].gear[0].evolutionId,'pulse-stormlink');
}
{
 const m=match(),p=m.players[0],g=evolutions.effective(p.gear[0],'pulse-stormlink');p.gear[0]=g;
 const foes=[target(m,190),target(m,240,430),target(m,260,460),target(m,300,480)];m.shoot(p,g);
 for(let i=0;i<20;i++)m.step(1/30);
 assert.equal(foes.filter(e=>e.hp<500).length,3,'one direct target plus two unique chain targets');
}
{
 const m=match(),a=m.players[0],b=m.players[1];b.x=155;b.shield=3;b.shieldTime=9;
 const e=target(m,240);m.projectile(a,a.gear[0],0);m.step(1/30);
 assert.equal(m.shots[0].coopCharged,true);assert.equal(b.shield,2);assert.equal(a.insights.combos,1);
 m.step(1/30);assert.equal(b.shield,2,'same shot cannot repeatedly drain shield');assert.equal(a.insights.combos,1);
 const f={id:'slow',owner:b.id,mode:'slow',x:180,y:400,radius:80,life:7,next:999,power:1};m.arsenalFields=[f];
 m.projectile(a,{...a.gear[0],kind:'flare'},0);m.step(1/30);assert(f.ignited);assert(f.igniteLeft<=3);
 const hp=e.hp;for(let i=0;i<7;i++)m.step(.1);assert(e.hp<hp,'ignition causes bounded enemy-only damage');
}
{
 const m=match(),p=m.players[0];m.hit(p,2,'Marked bombardment');p.invuln=0;p.shield=1;p.shieldTime=5;m.hit(p,3,'Shielded blast');
 assert.equal(p.hp,8);assert.equal(p.insights.prevented,3);for(let i=0;i<60;i++)m.heal(p,1);
 for(let i=0;i<40;i++){p.invuln=0;p.hp=10;m.hit(p,1,'Projectile')}
 assert(p.insights.recent.length<=32);p.activeTime=70;p.activePlayTime=20;p.damageDealt=1;m.finish(false);
 assert(m.result.insightsByPlayer.a);assert.equal(m.result.insightsByPlayer.a.reason,'Projectile');assert(m.result.challengeStatsByPlayer.a.eligible);
 const result=m.result;m.finish(false);assert.equal(m.result,result,'finish settlement is idempotent');
}
{
 const m=match('sector');m.setSectorStage(0);assert(m.sector.freight);const power=m.sector.objects.find(o=>o.id==='freight-power'),p=m.players[0];p.x=power.x;p.y=power.y;assert(m.interactSector(p));assert(m.sector.freight.powered);
 m.setSectorStage(1);assert(m.enemies.some(e=>e.type==='aegis-captain'));m.enemies=[];m.setSectorStage(3);assert(m.enemies.some(e=>e.type==='glassline-hunter'));m.enemies=[];m.setSectorStage(4);assert(m.enemies.some(e=>e.type==='forge-tender'));assert(m.enemies.some(e=>e.type==='yard-marshal'));
 for(const e of m.enemies)e.intro=0;m.step(.1);const elite=m.snapshot().enemies.find(e=>e.freightType==='yard-marshal');assert(elite.freight);assert.equal(elite.name,'The Yard Marshal');
 const captain=m.spawnFreight('aegis-captain');captain.freight={phase:'patrol',angle:0};captain.intro=0;p.x=captain.x+100;p.y=captain.y;const hp=captain.hp;m.damage(captain,10,p.id,'hit',{slot:0});assert(Math.abs((hp-captain.hp)-2.8)<1e-8,'front shield uses exact shared behavior');
}
const result={evolutionValidation:true,branchKitExclusion:true,chainTargets:2,shieldChargeOnce:true,ignition:true,boundedRecap:32,authoritativeChallengeSummary:true,freightSharedBehavior:true};
{
 const m=match(),a=m.players[0],b=m.players[1],victim=m.players[2];victim.down=25;victim.hp=0;a.hornUntil=8;a.hornOwner=b.id;
 for(let i=0;i<18&&victim.down>0;i++){a.lastInput=m.time;a.input={revive:true,slot:0};m.step(.1)}
 assert.equal(victim.down,0);assert.equal(victim.hp,4);assert(a.insights.combos>0);assert(b.insights.combos>0);
 const e=target(m);e.markLeft=5;e.markOwner=b.id;e.markCredited=false;const count=a.insights.combos;m.damage(e,1,a.id,'hit',{slot:0});assert.equal(a.insights.combos,count+1);m.damage(e,1,a.id,'hit',{slot:0});assert.equal(a.insights.combos,count+1,'one cooperation credit per mark');result.hornRevive=true;result.markCooperation=true;
}
let activations=0;
for(const branch of evolutions.definitions){const m=match(),p=m.players[0],slot=catalog.findIndex(items=>items.some(g=>g.kind===branch.item)),item=catalog[slot].find(g=>g.kind===branch.item);p.slot=slot;p.input={aim:0,slot};p.hp=5;p.gear[slot]={...item,mag:item.mag,reserve:item.reserve,reload:0,cool:0};target(m,145);assert(m.chooseEvolution(p,slot,branch.id));const g=p.gear[slot];let fired=m.shoot(p,g);if(!fired&&g.chargeAt>0){m.time=g.chargeAt+.001;fired=m.shoot(p,g)}assert(fired,branch.id+' native activation');assert(Number.isFinite(g.cool),branch.id+' finite cooldown');activations++}
result.nativeServerActivations=activations;
fs.writeFileSync('outputs/COOP-EXPANSION-7.2.json',JSON.stringify(result,null,2));console.log('PASS expansion server rules',result);
