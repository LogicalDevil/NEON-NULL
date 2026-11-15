'use strict';
const assert = require('node:assert/strict');
const {Match} = require('./engine.cjs');
const catalog = require('./catalog.json');
const radiant = require('./radiant-catalog.cjs');
const faction = require('./faction-skin-catalog.cjs');
const skins = [...radiant.weapons,...faction.items].filter(skin=>{
  const item=catalog[skin.slot][skin.index];
  return skin.slot===3&&(item.utilityMode==='sentry'||item.kind==='clockwork-sentry'||item.fuse);
});
let sentries=0,explosions=0;
for(const skin of skins){
  const gear=[0,0,0,skin.index];
  const match=new Match([{id:'deployer',connected:true,gear,weaponSkins:{[skin.weaponIndex]:skin.id}}],catalog);
  match.next=Infinity;
  const player=match.players[0];player.slot=3;player.hp=5;
  player.input={aim:0,aimX:player.x+150,aimY:player.y};
  assert.equal(player.gear[3].skinId,skin.id);
  assert(match.shoot(player,player.gear[3]));
  const field=match.arsenalFields[0];assert(field);
  assert.equal(field.skinId,skin.id);
  assert.equal(match.snapshot().arsenalFields[0].skinId,skin.id);
  player.slot=0;player.gear[3].skinId=null;
  if(field.mode==='sentry'||field.kind==='clockwork-sentry'){
    const target=match.spawn(false,0);Object.assign(target,{x:field.x+30,y:field.y,hp:1000,max:1000,intro:0,speed:0});
    match.tickArsenalFields(.05,[player]);
    const ray=match.events.find(event=>event.kind==='arsenal-ray');assert(ray,skin.id+' sentry ray missing');
    assert.equal(ray.skinId,skin.id,'Field retains the finish selected at deployment');
    assert.equal(target.hp,1000-field.shotDamage,'Cosmetic propagation preserves damage');
    sentries++;
  }else{
    field.life=.01;match.tickArsenalFields(.05,[player]);
    const explosion=match.events.find(event=>event.kind==='explode');assert(explosion);
    assert.equal(explosion.skinId,skin.id);explosions++;
  }
}
assert(sentries>=2);
console.log('PASS deployed finish in public fields, sentry rays and explosions after changing active equipment',{sentries,explosions});
