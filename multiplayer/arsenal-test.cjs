'use strict';
const assert = require('node:assert/strict');
const {performance} = require('node:perf_hooks');
const {Match,W,H} = require('./engine.cjs');
const arsenal = require('./arsenal-catalog.cjs');
const workshop = require('./workshop-catalog.cjs');
const catalog = require('./catalog.json');

function game(gear, players = 1) {
  const match = new Match(Array.from({length:players},(_,i)=>({
    id:'pilot'+i, name:'Pilot '+i, connected:true, gear:Array.isArray(gear[0])?gear[i]:gear
  })),catalog);
  match.next = Infinity;
  return match;
}
function target(match,x,y,hp=100) {
  const enemy = match.spawn(false,0);
  Object.assign(enemy,{x,y,hp,max:hp,speed:0,intro:0,timer:Infinity});
  return enemy;
}
function hold(match,p,seconds,slot=p.slot) {
  for(let i=0;i<Math.ceil(30*seconds);i++){
    match.input(p.id,{seq:p.seq+1,slot,aim:0,fire:true});
    match.step();
  }
}

assert.equal(arsenal.factions.length,5);
assert.equal(new Set(arsenal.groups.flat().map(item=>item.id)).size,160);
assert.deepEqual(catalog.map(items=>items.length),[56,50,50,50]);
for (const faction of arsenal.factions.slice(1)) {
  assert.deepEqual(arsenal.groups.map(items=>items.filter(item=>item.faction===faction.id).length),[10,10,10,10]);
}
assert.equal(arsenal.skinIndex(1,0),16);
assert.equal(arsenal.skinIndex(0,16),-1);
for (const item of arsenal.groups.flat()) {
  assert.equal(catalog[item.slot][item.index].id,item.id);
  const choices = workshop.definitions.filter(mod=>mod.kinds.includes(item.kind));
  assert.equal(choices.length,2,item.name);
  for (const choice of choices) {
    const applied = workshop.effective(item,choice.id);
    const browser = workshop.effective(item,choice.id,'browser');
    assert.equal(applied.modId,choice.id);
    assert.equal(applied.mag,item.mag);
    assert.equal(applied.reserve,item.reserve);
    if (item.slot<2) {assert.equal(applied.damage,browser.dmg);assert.equal(applied.reloadTime,browser.reloadDuration)}
    assert(Object.keys(choice.fields).some(key=>applied[key]!==item[key])||choice.spreadFactor||choice.add);
  }
  const loadout = [...arsenal.factionById(item.faction).starter];
  loadout[item.slot]=item.index;
  const match=game(loadout),p=match.players[0],g=p.gear[item.slot];
  p.hp=5;p.x=W/2;p.y=H/2;p.slot=item.slot;p.input={aim:0,aimX:p.x+85,aimY:p.y};
  target(match,p.x+115,p.y);
  if(item.kind==='capacitor-pack')p.gear[0].reserve--;
  if(item.chargeTime){
    assert(!match.shoot(p,g),item.name+' should charge first');
    assert.equal(g.mag,item.magSize);
    hold(match,p,item.chargeTime+.12);
    assert.equal(g.mag,item.magSize-1);
  }else assert(match.shoot(p,g),item.name);
  for(let n=0;n<60;n++)match.step();
  assert(Number.isFinite(p.hp),item.name);
  assert(Number.isFinite(g.cool),item.name);
  assert(match.shots.length<=200);
}

const loadoutFor = id => {
  const item=arsenal.byId(id),gear=[...arsenal.factionById(item.faction).starter];gear[item.slot]=item.index;return gear;
};
{
  const match=game(loadoutFor('coach-gun')),p=match.players[0],g=p.gear[0];
  p.input={aim:0};g.mag=0;g.reserve=3;
  assert(match.startReload(p,g));
  for(let n=0;n<24;n++)match.step();
  assert.equal(g.mag,1);assert.equal(g.reserve,2);assert(g.reload>0);
  assert(match.shoot(p,g));assert.equal(g.mag,0);assert.equal(g.reserve,2);
  assert(g.reload>0,'empty magazine starts a new staged reload');
}
{
  const match=game(loadoutFor('spectrum-trinary-pulse')),p=match.players[0],g=p.gear[0];
  p.input={aim:0};
  assert(match.shoot(p,g));assert.equal(g.mag,g.magSize-3);
  assert.equal(match.shots.length,3);
  assert(match.shots[2].delay>match.shots[1].delay&&match.shots[1].delay>0);
}
{
  const match=game(loadoutFor('vector-railgun')),p=match.players[0],g=p.gear[0];
  const first=target(match,p.x+120,p.y),second=target(match,p.x+220,p.y),third=target(match,p.x+350,p.y);
  hold(match,p,.27);
  assert.equal(g.mag,2);
  match.input(p.id,{seq:p.seq+1,slot:0,aim:0,fire:false});match.step();
  assert.equal(g.chargeAt,0);
  hold(match,p,.56);
  assert.equal(g.mag,1);
  assert(first.hp<second.hp&&second.hp<third.hp);
  const beam=match.events.find(e=>e.kind==='arsenal-ray');
  assert(beam.hit&&Math.abs(beam.endX-(second.x-second.r-(g.beamWidth||0)*.5))<.02);
}
{
  const match=game(loadoutFor('prism-lance')),p=match.players[0],g=p.gear[0];
  const enemy=target(match,p.x+210,p.y);
  hold(match,p,1.15);
  assert(g.overheatUntil>match.time);
  const pulses=match.events.filter(e=>e.kind==='arsenal-ray');
  assert.equal(pulses.length,7);
  assert.equal(g.mag,g.magSize-pulses.length);
  assert(enemy.hp<enemy.max);
}
{
  const match=game(loadoutFor('gearcaster')),p=match.players[0],g=p.gear[0];
  p.x=W-55;p.input={aim:0};
  assert(match.shoot(p,g));
  for(let i=0;i<12;i++)match.step();
  assert.equal(match.events.filter(e=>e.kind==='arsenal-bounce').length,1);
  assert(match.shots[0].vx<0);
}
{
  const match=game(loadoutFor('clockwork-sentry')),p=match.players[0],g=p.gear[3];
  p.slot=3;p.input={aim:0};
  const front=target(match,p.x+170,p.y),back=target(match,p.x-100,p.y);
  assert(match.shoot(p,g));
  match.step();
  assert(front.hp<front.max&&back.hp===back.max);
  match.players.push(game([0,0,0,0]).players[0]);
  match.players[1].id='other';p.connected=false;
  match.step();
  assert.equal(match.arsenalFields.length,0);
}
{
  const match=game(loadoutFor('clockwork-sentry')),p=match.players[0],g=p.gear[3];
  p.slot=3;p.input={aim:0};
  const enemy=target(match,p.x+230,p.y);
  match.sector={objects:[{id:'cover',x:p.x+160,y:p.y,r:25,hp:50}]};
  assert(match.shoot(p,g));
  match.tickArsenalFields(.05,[p]);
  assert.equal(enemy.hp,enemy.max,'sentry must respect destructible cover');
  match.sector.objects[0].hp=0;
  match.tickArsenalFields(.2,[p]);
  assert(enemy.hp<enemy.max,'destroyed cover opens sentry sight line');
}
{
  const match=game(loadoutFor('field-dressing')),p=match.players[0],g=p.gear[3];
  p.slot=3;p.hp=5;p.input={aim:0};
  assert(match.shoot(p,g));
  for(let i=0;i<65;i++)match.step();
  assert.equal(p.hp,6);
  match.hit(p,1);
  for(let i=0;i<150;i++)match.step();
  assert.equal(p.hp,5);
}
{
  const match=game(loadoutFor('blackpowder-volley-musket')),p=match.players[0],g=p.gear[0];
  p.input={aim:0};assert(match.shoot(p,g));
  assert.equal(g.mag,0);assert.equal(match.shots.length,2);assert(match.shots[1].delay>match.shots[0].delay);
  const budget=g.reserve;
  match.input(p.id,{seq:1,slot:1,aim:0,fire:false});match.step();
  assert.equal(match.shots.length,2,'committed volley survives a slot switch');
  assert.equal(g.reserve,budget);
  p.down=2;
  match.players.push(game([0,0,0,0]).players[0]);match.players[1].id='helper';
  match.step();
  assert.equal(match.shots.length,0,'downed actor cancels unlaunched rounds');
}
{
  const match=game(loadoutFor('hardlight-screen')),p=match.players[0],g=p.gear[3];
  p.slot=3;p.input={aim:0};assert(match.shoot(p,g));
  const barrier=match.arsenalFields[0];
  assert.equal(barrier.mode,'barrier');assert.equal(p.shield,0);
  match.hostile.push({id:'front',x:barrier.x+barrier.radius+4,y:p.y,vx:-400,vy:0,life:2});
  match.step();
  assert(!match.hostile.some(s=>s.id==='front'));assert.equal(barrier.blocks,g.power-1);
  match.hostile.push({id:'rear',x:p.x-19,y:p.y,vx:200,vy:0,life:2});
  match.step();
  assert.equal(p.hp,9,'rear attack bypasses forward barrier');
}
{
  const match=game(loadoutFor('frontier-trail-remedy')),p=match.players[0],g=p.gear[3];
  p.slot=3;p.input={aim:0};p.hp=4;assert(match.shoot(p,g));
  p.x+=50;match.step();assert.equal(match.arsenalFields[0].x,p.x);
  for(let i=0;i<55;i++)match.step();
  assert.equal(p.hp,5);
  match.hit(p,1);
  for(let i=0;i<65;i++)match.step();
  assert.equal(p.hp,4);
}
{
  const match=game(loadoutFor('spectrum-null-needle')),p=match.players[0],g=p.gear[0];
  p.x=120;p.y=400;p.input={aim:0};
  const far=target(match,190,400),near=target(match,155,400);
  g.speed=3000;assert(match.shoot(p,g));match.step();
  assert(near.hp<near.max&&far.hp===far.max,'first contact must use geometry order, independent of enemy array order');
}

const kits=['prism-lance','deck-blunderbuss','coach-gun','gearcaster'].map(loadoutFor);
kits[3][3]=arsenal.byId('clockwork-sentry').index;
const stress=game(kits,4),samples=[];
for(let i=0;i<30;i++)target(stress,110+i%10*110,95+Math.floor(i/10)*300,1e6);
for(let i=0;i<1800;i++){
  for(const [j,p] of stress.players.entries()){
    const useSentry=j===3&&i%120===30,slot=useSentry?3:0;
    p.invuln=1;p.gear[0].reserve=p.gear[0].reserveMax;
    stress.input(p.id,{seq:i,slot,fire:!(j===3&&i%120===29),aim:i*.018+j});
  }
  const before=performance.now();stress.step();samples.push(performance.now()-before);
}
samples.sort((a,b)=>a-b);
console.log('PASS 160 faction items, 320 Workshop choices, Default skin IDs, charge cancel, authoritative rail penetration, beam heat, one bounce, sentry cleanup, healing interrupt.');
console.log(JSON.stringify({scenario:'four-player server simulation',seconds:60,enemies:stress.enemies.length,p95StepMs:+samples[Math.floor(samples.length*.95)].toFixed(3),maxStepMs:+samples.at(-1).toFixed(3)}));
