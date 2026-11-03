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
{id:'shield-bank',name:'Reserve Shield Cells',kinds:['shield'],slot:'Specialization',cost:18,description:'One extra shield block; 40% longer cooldown. Shield duration is unchanged.',fields:{rate:1.4,cooldown:1.4},add:{power:1}}
];
const aliases={damage:'dmg',reloadTime:'reloadDuration'};
function compatible(id,item){return definitions.find(m=>m.id===id&&m.kinds.includes(item?.kind))||null}
function effective(item,id,mode='server'){const m=compatible(id,item),view={...item};if(!m)return view;view.modId=view.nnMod=m.id;
 for(const[field,factor]of Object.entries(m.fields)){const key=mode==='browser'&&aliases[field]&&Number.isFinite(item[aliases[field]])?aliases[field]:field;if(Number.isFinite(item[key]))view[key]=item[key]*factor}
 for(const[field,amount]of Object.entries(m.add||{}))if(Number.isFinite(item[field]))view[field]=item[field]+amount;
 if(m.integerPower?.includes(item.kind))view.power=Math.max(1,Math.floor(view.power));if(m.spreadFactor)view.spreadWidth=(item.spreadWidth||.12)*m.spreadFactor;
 for(const field of['pierceExtra','returning','staggerMultiplier','regenKit','counterBrace','armor'])if(m[field]!==undefined)view[field]=m[field];return view}
function coverage(groups){return groups.map((items,slot)=>({slot,total:items.length,supported:items.filter(item=>definitions.some(m=>m.kinds.includes(item.kind))).length}))}
const api={definitions,compatible,effective,coverage};if(typeof module==='object'&&module.exports)module.exports=api;else root.NeonWorkshopCatalog=api;
})(typeof window==='object'?window:globalThis);
