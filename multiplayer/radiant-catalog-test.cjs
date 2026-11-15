'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const arsenal = require('./arsenal-catalog.cjs');
const radiant = require('./radiant-catalog.cjs');
const manifest = require('./skin-manifest.json');
const cases = require('./case-catalog.json');
const {Match} = require('./engine.cjs');
const equipment = require('./catalog.json');
assert.equal(radiant.weapons.length,70);
assert.equal(radiant.operators.length,70);
assert.equal(new Set([...radiant.weapons,...radiant.operators].map(item=>item.id)).size,140);
assert.equal(new Set([...radiant.weapons,...radiant.operators].map(item=>item.name)).size,140);
for (const faction of arsenal.factions) assert.deepEqual([0,1,2,3].map(slot=>radiant.weapons.filter(item=>item.faction===faction.id&&item.slot===slot).length),[5,4,3,2]);
for (const theme of ['optical','solar','archive','verdant','brass','frontier','astral']) assert.equal(radiant.operators.filter(item=>item.theme===theme).length,10);
assert.equal(manifest.operators.length,140);
assert.equal(Object.keys(manifest.skins).length,160);
const audited=require('../outputs/RADIANT-CATALOG-7.1.json');
assert.equal(new Set([...audited.weapons,...audited.operators].map(item=>item.name)).size,300,'New names must not duplicate older skin names');
const originalManifest = JSON.parse(fs.readFileSync('work/v70-baseline-server/multiplayer/skin-manifest.json','utf8'));
for (const [id,key] of Object.entries(originalManifest.skins)) assert.equal(manifest.skins[id],key,'Existing weapon binding changed: '+id);
for (const id of originalManifest.operators) assert(manifest.operators.includes(id));
for (const kind of ['weapon','operator']) {
  const pool = cases[kind];
  assert.equal(pool.length,kind==='weapon'?140:139);
  assert(Math.abs(pool.reduce((sum,item)=>sum+item.odds,0)-100)<1e-8);
  for (const [rarity,expected] of Object.entries(radiant.tierOdds)) assert(Math.abs(pool.filter(item=>item.rarity===rarity).reduce((sum,item)=>sum+item.odds,0)-expected)<1e-8);
  assert(pool.every(item=>item.odds>0&&!item.directOnly));
}
for (const skin of radiant.weapons) {
  assert.equal(manifest.skins[skin.id],skin.weaponIndex);
  assert.deepEqual(arsenal.equipmentForSkin(skin.weaponIndex),{slot:skin.slot,index:skin.index});
  const gear = [0,0,0,0];gear[skin.slot]=skin.index;
  const match = new Match([{id:'radiant',connected:true,gear,weaponSkins:{[skin.weaponIndex]:skin.id}}],equipment);
  const player = match.players[0];player.slot=skin.slot;
  assert.equal(player.gear[skin.slot].skinId,skin.id);
  assert.equal(match.snapshot().players[0].activeSkin,skin.id);
  assert.equal(player.gear[skin.slot].damage,equipment[skin.slot][skin.index].damage,'A cosmetic changed combat damage');
}
assert.equal(arsenal.skinIndex(2,0),3000);
assert.equal(arsenal.skinIndex(3,9),4009);
for (let slot=0;slot<4;slot++) for(let index=0;index<equipment[slot].length;index++) assert.deepEqual(arsenal.equipmentForSkin(arsenal.skinIndex(slot,index)),{slot,index});
console.log('PASS 140 new stable IDs,70/70 allocation,all160weapon+140operator manifests,all old IDs/bindings,Default melee/utility mappings,canonical tier odds,all70 equipped server skins and cosmetic damage isolation.');
