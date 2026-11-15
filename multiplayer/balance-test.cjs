'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const balance = require('./combat-balance.cjs');
const catalog = require('./catalog.json');
const {Match} = require('./engine.cjs');
const workshop = require('./workshop-catalog.cjs');

const before = JSON.parse(fs.readFileSync('outputs/BALANCE-7.0-before.json')).rows;
const after = JSON.parse(fs.readFileSync('outputs/BALANCE-7.0-after.json')).rows;
assert.equal(before.length, 638);
assert.equal(after.length, before.length);
const standard = rows => rows.filter(row => row.modification === 'standard');
assert.equal(standard(after).length, 206);
for (const original of standard(before)) {
  const revised = standard(after).find(row => row.slot === original.slot && row.index === original.index);
  const factor = original.cost <= 16 ? 1.25 : original.cost <= 33 ? 1.35 : 1.5;
  assert.equal(revised.cost, original.slot < 2 && original.cost > 0 ? Math.round(original.cost * factor) : original.cost);
}
for (const [kind, minimum, maximum] of [['flare', .7, .75], ['drill', .65, .75]]) {
  const original = before.find(row => row.kind === kind && row.modification === 'standard');
  const revised = after.find(row => row.kind === kind && row.modification === 'standard');
  assert(revised.single.dps / original.single.dps >= minimum);
  assert(revised.single.dps / original.single.dps <= maximum);
}
const legacy = {kind: 'rapid', cost: 6, dmg: 1, rate: .12};
const migrated = balance.migrateCheckpoint(legacy, 0);
assert.equal(migrated.cost, 8);
assert.equal(migrated.dmg, .92);
assert.equal(balance.apply(migrated, 0), migrated);
assert.equal(balance.migrateCheckpoint(migrated, 0).cost, 8);
assert.equal(balance.migrateCheckpoint({...legacy, cost: 0}, 0).cost, 0);
assert.equal(legacy.cost, 6);
const sandbox = {};
vm.runInNewContext(fs.readFileSync('multiplayer/combat-balance.cjs', 'utf8'), sandbox);
const client = sandbox.NeonCombatBalance.apply({...legacy, cost: 24}, 0);
assert.deepEqual(JSON.parse(JSON.stringify(client)), migrated);

const match = new Match([{id: 'test', connected: true, gear: [0,0,9,0]}], catalog);
match.next = Infinity;
const player = match.players[0];
player.x = 300;
player.y = 400;
player.invuln = 999;
const enemy = match.spawn(false, 0);
Object.assign(enemy, {x: 410, y: 400, hp: 1e6, max: 1e6, speed: 0, intro: 0, timer: Infinity});
const flare = player.gear[1];
player.slot = 1;
function impact(gun) {
  match.projectile(player, gun, 0);
  const shot = match.shots.at(-1);
  Object.assign(shot, {x: enemy.x, y: enemy.y, vx: 0, vy: 0});
  match.step(.01);
}
impact(flare);
assert(enemy.flareBurn);
enemy.burnTick = .15;
impact(flare);
assert(Math.abs(enemy.burnTick - .14) < .00001, 'Refreshing flare must preserve the next tick');
assert.equal(enemy.burn, balance.flare.duration);
const drill = player.gear[2];
assert.equal(drill.cooldown, .25);
assert.equal(drill.damage, 1.722);
player.slot = 2;
enemy.burn = 0;
enemy.x = player.x + drill.reach + enemy.r + 1;
const hp = enemy.hp;
match.shoot(player, drill);
assert.equal(enemy.hp, hp, 'Drill does not damage a target beyond its real reach');
const light = workshop.effective(catalog[2][9], 'light-grip');
assert.equal(light.cooldown, .2);
assert.equal(workshop.effective(light, 'light-grip').cooldown, .2);
// The run selects one specialization against its base item; validate the public API's result.
assert.equal(workshop.effective(catalog[2][9], 'light-grip').damage, catalog[2][9].damage);
console.log('PASS206equipment pricing,638Workshop audit cases,Flare/Drill DPS targets,browser/server canonical parity,idempotent pricing/old-save migration,nonstacking burn,Drill contact and recovery.');
