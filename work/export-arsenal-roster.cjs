'use strict';
const fs = require('node:fs');
const path = require('node:path');
const arsenal = require('../multiplayer/arsenal-catalog.cjs');
const workshop = require('../multiplayer/workshop-catalog.cjs');
const vm = require('node:vm');
const previousHTML = fs.readFileSync(path.join(__dirname,'../outputs/neon-null-v6.7.html'),'utf8');
const previousScript = previousHTML.match(/<!-- NN_ARSENAL_CATALOG_START -->\s*<script>([\s\S]*?)<\/script>/)?.[1];
if(!previousScript)throw Error('Missing v6.7 faction catalog for audit');
const baseline = {module:{exports:{}},exports:{}};
vm.runInNewContext(previousScript,baseline,{timeout:1000});
const art = require('./arsenal-art.js');
const headers = ['Faction','Slot','ID','Item','Previous behavior','Role','Signature mechanic','Tradeoff','Closest same-slot comparison','Ammo','Per trigger','Capacity','Starting reserve','Reserve cap','Reload or recovery (s)','Reload mode','Range or radius','Art direction','Sound','Workshop option 1','Workshop option 2'];
const rows = [];
for (const faction of arsenal.factions.slice(1)) {
  for (const [slot, items] of arsenal.groups.entries()) {
    for (const item of items.filter(item => item.faction === faction.id)) {
      const kits = workshop.definitions.filter(kit => kit.kinds.includes(item.kind));
      const neighbors=items.filter(candidate=>candidate.faction===item.faction&&candidate.id!==item.id);
      const score=candidate=>Number(candidate.pattern!==item.pattern)+Number(candidate.role!==item.role)+Number(candidate.utilityMode!==item.utilityMode)+Number(candidate.ray!==item.ray);
      const closest=[...neighbors].sort((a,b)=>score(a)-score(b))[0];
      const visual=art.itemDefinition?.(item);
      rows.push([
        faction.name, ['Primary','Secondary','Melee','Utility'][slot], item.id, item.name,baseline.module.exports.byId(item.id)?.desc||'',
        item.role || item.style,item.signature||item.desc,item.weakness||'',closest?.name||'',
        item.resource || (slot<2 ? 'Faction ammunition' : ''), slot<2 ? item.ammoPerShot||1 : '',
        item.magSize, item.reserve, item.reserveMax, item.reloadDuration || item.cooldown,
        slot<2 ? item.reloadMode || 'full' : '', item.range ?? item.reach ?? item.radius,
        visual?JSON.stringify(visual):item.visual?.shape || item.style,
        item.sfx, ...kits.map(kit => kit.name+' — '+kit.description)
      ]);
    }
  }
}
const csv = [headers,...rows].map(row => row.map(value => '"'+String(value ?? '').replaceAll('"','""')+'"').join(',')).join('\r\n');
fs.writeFileSync(path.join(__dirname,'../outputs/ARSENAL-6.8.csv'),'\uFEFF'+csv+'\r\n');
