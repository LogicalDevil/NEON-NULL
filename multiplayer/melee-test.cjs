'use strict';
const assert=require('node:assert/strict'),{Match}=require('./engine.cjs'),catalog=require('./catalog.json');
const oldReach=[44,52,58,64,74,88,102,62,70,56];
for(let index=0;index<10;index++){
 const g=catalog[2][index];assert.equal(g.reach,oldReach[index]*2.25,g.name+' reach');
 for(const [offset,angle,hit]of[[-.1,0,true],[.1,0,false],[-1,g.arc/2+.03,false]]){
  const m=new Match([{id:'p',name:'Pilot',connected:true,gear:[0,0,index,0]}],catalog),p=m.players[0];
  p.slot=2;p.input.aim=0;const e=m.spawn(false,0);e.intro=0;e.hp=e.max=1000;
  const distance=g.reach+e.r+offset;e.x=p.x+Math.cos(angle)*distance;e.y=p.y+Math.sin(angle)*distance;
  assert(m.shoot(p,p.gear[2]));assert.equal(e.hp<1000,hit,g.name+' collision boundary');
  const effect=m.events.find(e=>e.kind==='slash');assert.equal(effect.reach,g.reach);assert.equal(effect.arc,g.arc);
 }
}
console.log('PASS all ten melee weapons: 25% reduced extended reach, inside/outside distance, arc exclusion, authoritative effect dimensions');
