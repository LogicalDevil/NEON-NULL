/* Shared Workshop definitions. One specialization per equipment item. */
(function(root){'use strict';
const definitions=[
{id:'pulse-through',name:'Throughline Core',kinds:['bolt'],slot:'Ammunition',cost:16,description:'Pierce one extra target; 10% less direct damage and the next hit deals 60%.',fields:{damage:.9},pierceExtra:1},
{id:'tight-bore',name:'Choke Assembly',kinds:['tri','auto-shotgun'],slot:'Mechanism',cost:16,description:'45% tighter spread; 15% longer firing recovery.',fields:{rate:1.15,cooldown:1.15},spreadFactor:.55},
{id:'rail-breaker',name:'Capacitor Breaker',kinds:['rail'],slot:'Specialization',cost:20,description:'Bypass frontal armor; 30% more damage, 45% longer recovery and reload.',fields:{damage:1.3,rate:1.45,cooldown:1.45,reloadTime:1.45},armor:true},
{id:'return-blades',name:'Recall Filament',kinds:['dagger'],slot:'Mechanism',cost:16,description:'Blades turn back after 0.4 seconds; 25% less damage and 20% longer recovery.',fields:{damage:.75,rate:1.2,cooldown:1.2},returning:true},
{id:'fist-breaker',name:'Concussion Knuckles',kinds:['fist'],slot:'Specialization',cost:12,description:'Double stagger buildup; 15% less direct damage.',fields:{damage:.85},staggerMultiplier:2},
{id:'scythe-sweep',name:'Reaping Pivot',kinds:['scythe'],slot:'Mechanism',cost:16,description:'35% wider sweep; 25% longer recovery.',fields:{arc:1.35,rate:1.25,cooldown:1.25}},
{id:'medkit-regen',name:'Regenerative Mesh',kinds:['medkit'],slot:'Specialization',cost:14,description:'Restore 3 hull over 6 seconds; taking damage cancels remaining healing.',fields:{},regenKit:true},
{id:'spear-brace',name:'Counterweight Brace',kinds:['spear'],slot:'Specialization',cost:16,description:'Interrupt charge windups; 20% longer recovery.',fields:{rate:1.2,cooldown:1.2},counterBrace:true},
{id:'accelerator-feed',name:'Accelerator Feed',kinds:['bolt','rapid','burst','burst-rifle','revolver','shard','seek','emp','tether','boomer','ricochet','ricochet-cannon','flare','arc','nova','grenade','black','beam','sniper','lance','dagger','tri','auto-shotgun'],slot:'Mechanism',cost:14,description:'Projectiles travel 25% faster; 10% less direct damage. Existing guidance and travel rules remain.',fields:{speed:1.25,damage:.9}},
{id:'service-breech',name:'Service Breech',kinds:['bolt','rapid','burst','burst-rifle','revolver','shard','seek','emp','tether','boomer','ricochet','ricochet-cannon','flare','arc','nova','grenade','black','beam','sniper','lance','dagger','tri','auto-shotgun','rail'],slot:'Handling',cost:14,description:'25% faster reload; 15% longer firing recovery. Magazines and reserves are unchanged.',fields:{reloadTime:.75,rate:1.15,cooldown:1.15}},
{id:'needle-core',name:'Needle Core',kinds:['revolver'],slot:'Ammunition',cost:20,description:'One additional penetration; 15% less direct damage and 20% longer recovery. Additional target takes 60%.',fields:{damage:.85,rate:1.2,cooldown:1.2},pierceExtra:1},
{id:'fan-collimator',name:'Fan Collimator',kinds:['burst','shard','dagger'],slot:'Mechanism',cost:16,description:'35% tighter projectile fan; 20% longer firing recovery. Projectile count stays the same.',fields:{rate:1.2,cooldown:1.2},spreadFactor:.65},
{id:'precision-burst',name:'Precision Cycle',kinds:['burst-rifle','rapid'],slot:'Handling',cost:15,description:'30% lower visual recoil and 20% faster projectiles; 20% longer reload. Existing burst timing and overheat still apply.',fields:{recoil:.7,speed:1.2,reloadTime:1.2}},
{id:'light-grip',name:'Lightweight Grip',kinds:['fist','knife','dual','sword','greatsword','scythe','spear','baton','hammer','drill'],slot:'Handling',cost:12,description:'20% faster attack recovery; 15% shorter reach. Existing distance damage falloff remains.',fields:{rate:.8,cooldown:.8,reach:.85}},
{id:'extended-pivot',name:'Extended Pivot',kinds:['knife','dual','sword','greatsword','spear','baton','hammer','drill'],slot:'Mechanism',cost:16,description:'20% more reach and 15% wider arc; 30% longer recovery. Outer strikes retain distance falloff.',fields:{reach:1.2,arc:1.15,rate:1.3,cooldown:1.3}},
{id:'counterweight-head',name:'Counterweight Head',kinds:['greatsword','hammer','baton'],slot:'Specialization',cost:18,description:'75% more stagger buildup and counters charge windups; 20% longer recovery and 10% less direct damage.',fields:{damage:.9,rate:1.2,cooldown:1.2},staggerMultiplier:1.75,counterBrace:true},
{id:'narrow-lunge',name:'Needle Lunge',kinds:['knife','dual','spear','drill'],slot:'Mechanism',cost:14,description:'25% more reach; 30% narrower attack arc. No automatic dash or increased movement.',fields:{reach:1.25,arc:.7}},
{id:'field-reservoir',name:'Field Reservoir',kinds:['horn','decoy','overclock','repair','timeslow'],slot:'Specialization',cost:16,description:'25% longer support effect; 30% longer utility cooldown.',fields:{power:1.25,rate:1.3,cooldown:1.3}},
{id:'quick-deploy',name:'Quick Deployment',kinds:['horn','warpgrenade','shield','decoy','overclock','repair','timeslow'],slot:'Handling',cost:14,description:'20% shorter cooldown; 25% less utility power or duration. Shield blocks round down, minimum one.',fields:{rate:.8,cooldown:.8,power:.75},integerPower:['shield']},
{id:'warp-charge',name:'Dense Warp Charge',kinds:['warpgrenade'],slot:'Specialization',cost:18,description:'40% more warp burst damage; 40% longer cooldown. Blast radius is unchanged.',fields:{power:1.4,rate:1.4,cooldown:1.4}},
{id:'shield-bank',name:'Reserve Shield Cells',kinds:['shield'],slot:'Specialization',cost:18,description:'One extra shield block; 40% longer cooldown. Shield duration is unchanged.',fields:{rate:1.4,cooldown:1.4},add:{power:1}},
{id:'wide-bore',name:'Breach Pattern',kinds:['tri','auto-shotgun'],slot:'Mechanism',cost:15,description:'30% wider spread and 15% shorter shot recovery for crowd control. Each pellet deals 15% less damage.',fields:{damage:.85,rate:.85,cooldown:.85},spreadFactor:1.3},
{id:'anchor-strike',name:'Anchor Strike',kinds:['spear','sword'],slot:'Specialization',cost:16,description:'Build 60% more stagger at close range, with 15% shorter reach and 15% longer recovery.',fields:{reach:.85,rate:1.15,cooldown:1.15},staggerMultiplier:1.6},
{id:'quick-chamber',name:'Quick Chamber',kinds:['sniper','revolver'],slot:'Handling',cost:16,description:'25% shorter shot recovery for follow-up hits, with 20% less damage and a 20% longer reload.',fields:{damage:.8,rate:.75,cooldown:.75,reloadTime:1.2}}
];
const aliases={damage:'dmg',reloadTime:'reloadDuration'};
const arsenal = typeof module==='object'&&module.exports ? require('./arsenal-catalog.cjs') : root.NeonArsenal;
function factionKit(item, suffix, name, slot, description, fields, extra={}) {
 definitions.push({id:item.id+'-'+suffix,name,kinds:[item.kind],slot,cost:suffix==='precision'?18:16,description,fields,...extra});
}
for (const item of arsenal?.groups.flat()||[]) {
 const add=(...args)=>factionKit(item,...args);
 if (item.kind==='prism-lance') {
  add('precision','Focus Lens','Mechanism','25% stronger beam ticks and 25% faster heat buildup.',{damage:1.25,heatPerShot:1.25});
  add('sustain','Cooling Loop','Handling','25% less heat per tick with 12% less damage.',{damage:.88,heatPerShot:.75});
 } else if (item.kind==='steam-riveter') {
  add('precision','Heavy Rivets','Ammunition','28% more damage, 15% slower rivets, and 22% more pressure per shot.',{damage:1.28,speed:.85,heatPerShot:1.22});
  add('sustain','Relief Valve','Mechanism','33% shorter vent time and 10% less direct damage.',{ventDuration:.67,damage:.9});
 } else if (item.kind==='coach-gun') {
  add('sustain','Quick Ejector','Handling','Load each shell 24% faster, with 13% less pellet damage.',{reloadTime:.76,damage:.87});
  add('precision','Linked Triggers','Mechanism','Spend two shells on a wider and stronger simultaneous discharge.',{damage:1.58,rate:1.18,cooldown:1.18},{spreadFactor:1.24,ammoPerShot:2});
 } else if (item.slot<2) {
  const fast = {'line-musket':'Fine Powder','trail-repeater':'Light Action','vector-railgun':'Quick Charge'}[item.kind]||'Quick '+({blackpowder:'Lock',frontier:'Action',brassworks:'Valve',spectrum:'Cycle'}[item.faction]);
  const strong = {'line-musket':'Heavy Ball','trail-repeater':'Long Sight','vector-railgun':'Dense Accelerator'}[item.kind]||'Precision '+({blackpowder:'Bore',frontier:'Barrel',brassworks:'Cylinder',spectrum:'Conductor'}[item.faction]);
  if (item.kind==='trail-repeater') {
   add('sustain',fast,'Handling','22% shorter recovery with 15% shorter effective range.',{rate:.78,cooldown:.78,range:.85});
   add('precision',strong,'Mechanism','25% more reach and 18% less kick, with 25% longer shot recovery.',{range:1.25,recoil:.82,rate:1.25,cooldown:1.25});
  } else if (item.spread>1) {
   add('sustain','Open '+item.style+' Bore','Handling','30% wider pattern and 14% shorter recovery, with 12% weaker pellets.',{rate:.86,cooldown:.86,damage:.88},{spreadFactor:1.3});
   add('precision',strong,'Mechanism','35% tighter pattern and 18% longer recovery.',{rate:1.18,cooldown:1.18},{spreadFactor:.65});
  } else {
   const charge=item.chargeTime?{chargeTime:.78}:{};
   add('sustain',fast,'Handling',item.chargeTime?'22% less charge time and 12% less direct damage.':'24% faster reload and 13% less direct damage.',item.chargeTime?{...charge,damage:.88}:{reloadTime:.76,damage:.87});
   add('precision',strong,'Ammunition','24% more direct damage, with 21% slower follow-up shots.',{damage:1.24,rate:1.21,cooldown:1.21});
  }
 } else if (item.slot===2) {
  add('sustain',item.kind==='phase-blade'?'Duelist Grip':'Balanced Grip','Handling','18% shorter recovery and a 20% narrower swing.',{rate:.82,cooldown:.82,arc:.8});
  add('precision',item.kind==='phase-blade'?'Extended Edge':'Extended Reach','Mechanism','22% more reach with 23% longer recovery.',{reach:1.22,rate:1.23,cooldown:1.23});
 } else if (item.kind==='clockwork-sentry'||item.utilityMode==='sentry') {
  add('sustain','Wide Traverse','Mechanism','28% wider tracking arc and 16% less damage per shot.',{arc:1.28,shotDamage:.84});
  add('precision','Reinforced Spring','Specialization','40% longer deployment and 25% longer cooldown.',{power:1.4,rate:1.25,cooldown:1.25});
 } else if (item.kind==='hardlight-screen'||item.utilityMode==='shield') {
  add('sustain','Rapid Emitter','Handling','25% shorter cooldown with a 25% shorter shield lifetime.',{duration:.75,rate:.75,cooldown:.75});
  add('precision','Second Capacitor','Specialization','Block one more hit, with 35% longer cooldown.',{rate:1.35,cooldown:1.35},{add:{power:1}});
 } else if (['field-dressing','capacitor-pack'].includes(item.kind)||['heal','refill'].includes(item.utilityMode)) {
  add('sustain','Quick Release','Handling','25% shorter cooldown but one fewer hull point or energy cell restored.',{rate:.75,cooldown:.75},{add:{power:-1}});
  add('precision','Extended Pack','Specialization','Restore one more hull point or energy cell, with 30% longer cooldown.',{rate:1.3,cooldown:1.3},{add:{power:1}});
 } else if (['blink','dash'].includes(item.utilityMode)) {
  add('sustain','Quick Step','Handling','Recover 25% sooner but travel 20% less distance.',{rate:.75,cooldown:.75,power:.8});
  add('precision','Long Step','Mechanism','Travel 25% farther but recover 30% slower.',{rate:1.3,cooldown:1.3,power:1.25});
 } else if (item.fuse) {
  add('sustain','Fast Fuse','Handling','20% shorter fuse and 15% less area damage.',{fuse:.8,power:.85});
  add('precision','Wide Charge','Specialization','24% wider blast radius and 25% longer cooldown.',{radius:1.24,rate:1.25,cooldown:1.25});
 } else {
  add('sustain','Quick Trigger','Handling','25% shorter cooldown and 20% less radius.',{radius:.8,rate:.75,cooldown:.75});
  add('precision','Expanded Canister','Specialization','25% more radius and 25% longer cooldown.',{radius:1.25,rate:1.25,cooldown:1.25});
 }
}
function compatible(id,item){return definitions.find(m=>m.id===id&&m.kinds.includes(item?.kind))||null}
function effective(item,id,mode='server'){const m=compatible(id,item),view={...item};if(!m)return view;view.modId=view.nnMod=m.id;
 for(const[field,factor]of Object.entries(m.fields)){const key=mode==='browser'&&aliases[field]&&Number.isFinite(item[aliases[field]])?aliases[field]:field;if(Number.isFinite(item[key]))view[key]=item[key]*factor}
 for(const[field,amount]of Object.entries(m.add||{}))if(Number.isFinite(item[field]))view[field]=item[field]+amount;
 if(m.integerPower?.includes(item.kind))view.power=Math.max(1,Math.floor(view.power));if(m.spreadFactor)view.spreadWidth=(item.spreadWidth||.12)*m.spreadFactor;
 for(const field of['pierceExtra','returning','staggerMultiplier','regenKit','counterBrace','armor','ammoPerShot'])if(m[field]!==undefined)view[field]=m[field];return view}
function coverage(groups){return groups.map((items,slot)=>({slot,total:items.length,supported:items.filter(item=>definitions.some(m=>m.kinds.includes(item.kind))).length}))}
const api={definitions,compatible,effective,coverage};if(typeof module==='object'&&module.exports)module.exports=api;else root.NeonWorkshopCatalog=api;
})(typeof window==='object'?window:globalThis);
