'use strict';
const assert=require('node:assert/strict'),director=require('./enemy-director.cjs'),{Match}=require('./engine.cjs'),catalog=require('./catalog.json');
let seed=73;const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const pool=director.eligible(4),d=director.create(random);assert.equal(pool.length,15);
for(let i=0;i<450;i++)assert(pool.includes(d.next(pool)));
assert.deepEqual(Object.values(d.stats().counts),Array(15).fill(30));
d.reset();for(let i=0;i<80;i++){const group=d.group(pool,7);assert(group.filter(id=>['bomber','mine-layer'].includes(id)).length<=1);assert(group.filter(id=>id==='brute').length<=2)}
const counts=Object.values(d.stats().counts);assert.equal(counts.length,15);assert(Math.max(...counts)-Math.min(...counts)<=2);assert.deepEqual(director.eligible(1).length,5);assert(!director.eligible(1).includes('bomber'));d.reset();assert.equal(d.stats().total,0);
const match=new Match([{id:'one',name:'One',connected:true}],catalog);match.wave=10;
const canonical=id=>({pursuer:'drone',shield:'shield-carrier',support:'support-drone',minelayer:'mine-layer'}[id]||id),seen={};
for(let i=0;i<300;i++){const e=match.spawn();assert(e);const id=canonical(e.type);seen[id]=(seen[id]||0)+1;assert(Number.isFinite(e.speed));match.enemies.length=0}assert.deepEqual(Object.values(seen),Array(15).fill(20));
const expected=[72,135,55,55,38,80,42,48,95,52,66,42,105,76,84,90];for(let i=0;i<expected.length;i++){const e=match.spawn(i===6,i);assert(Math.abs(e.speed-expected[i]*1.15)<1e-8);match.enemies.length=0}
for(const id of[11,12,13,14,15]){const e=match.spawn(false,id);e.intro=0;e.timer=0;for(let n=0;n<40;n++){match.players[0].invuln=999;match.step(1/30)}assert(Number.isFinite(e.x)&&Number.isFinite(e.y));match.enemies.length=match.zones.length=0}
console.log('PASS all 15 enemy types evenly represented, tier gating, burst hazard limits, reset, server distribution, exact +15% base speed and all new server variants simulate without errors');
