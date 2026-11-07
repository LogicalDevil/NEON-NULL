'use strict';
const fs = require('node:fs');
const path = require('node:path');
const {Match} = require('../multiplayer/engine.cjs');
const arsenal = require('../multiplayer/arsenal-catalog.cjs');
const workshop = require('../multiplayer/workshop-catalog.cjs');
const catalog = require('../multiplayer/catalog.json');

function measure(item, modification, distance, seconds) {
  const gear = [...arsenal.factionById(item.faction).starter];
  gear[item.slot] = item.index;
  const mods = [null,null,null,null];
  mods[item.slot] = modification?.id || null;
  const match = new Match([{id:'audit',name:'Audit',connected:true,gear,mods}],catalog);
  match.next = Infinity;
  const player = match.players[0];
  player.x = 50;
  player.y = 400;
  player.hp = 5;
  player.invuln = 1000;
  const enemy = match.spawn(false,0);
  Object.assign(enemy,{x:50+distance,y:400,hp:10000000,max:10000000,speed:0,intro:0,timer:Infinity,staggerMax:Infinity});
  for (let tick=0;tick<seconds*30;tick++) {
    match.input(player.id,{seq:tick,slot:item.slot,aim:0,aimX:enemy.x,aimY:enemy.y,fire:tick%2===0||item.slot<3});
    match.step(1/30);
    player.invuln=1000;
  }
  const gun=player.gear[item.slot];
  return {
    damage:+player.damageDealt.toFixed(3),
    ammoSpent:item.slot<2?item.magSize+item.reserveMax-gun.mag-gun.reserve:0,
    healing:+player.healing.toFixed(3)
  };
}

const results=[];
for (const item of arsenal.groups.flat()) {
  const kits=workshop.definitions.filter(mod=>mod.kinds.includes(item.kind));
  for (const kit of [null,...kits]) {
    const range=item.range||item.reach||item.radius||150;
    const near=measure(item,kit,Math.min(range*.35,100),1);
    const intended=measure(item,kit,Math.min(range*.55,1000),15);
    const far=measure(item,kit,Math.min(range*.96,1120),15);
    results.push({id:item.id,faction:item.faction,slot:item.slot,modification:kit?.id||'standard',
      openingSecondDamage:near.damage,intendedDPS:+(intended.damage/15).toFixed(3),farDPS:+(far.damage/15).toFixed(3),
      roundsSpent:intended.ammoSpent,healing:intended.healing});
  }
}
const headers=Object.keys(results[0]);
const csv=[headers,...results.map(row=>headers.map(key=>row[key]))].map(row=>row.map(value=>'"'+String(value).replaceAll('"','""')+'"').join(',')).join('\r\n');
const output=path.join(__dirname,'../outputs');
fs.writeFileSync(path.join(output,'ARSENAL-BALANCE-6.8.csv'),csv+'\r\n');
fs.writeFileSync(path.join(output,'ARSENAL-BALANCE-6.8.json'),JSON.stringify({
  conditions:'Actual authoritative engine, 30 Hz, one stationary unarmored target, finite starting ammunition, 15 seconds held use, utilities retrigger only on a new press. Damage includes status ticks. Movement/aim skill and multi-target potential are not estimated.',
  results
},null,2));
console.log('Measured',results.length,'equipment/Workshop configurations.');
