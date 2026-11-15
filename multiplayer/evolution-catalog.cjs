/* Run-only evolution rules shared by browser and authoritative co-op simulation. */
(function(root){'use strict';
const definitions=[];
function pair(item,branches){for(const b of branches)definitions.push({item,cost:28,icon:'◇',fields:{},flags:{},blocksKits:true,...b})}
pair('bolt',[
{id:'pulse-needleline',name:'Needleline',description:'Penetrate two additional enemies. Direct damage -15%; subsequent impacts retain 65% damage.',fields:{damage:.85},flags:{pierceExtra:2,pierceFactor:.65}},
{id:'pulse-stormlink',name:'Stormlink',description:'Direct damage -25%. A hit arcs to at most two other enemies within 100 units for 35% of the initial impact. Each enemy is hit once per discharge.',fields:{damage:.75},flags:{chainTargets:2,chainRadius:100,chainFactor:.35}}]);
pair('tri',[
{id:'triad-breach',name:'Breach Driver',description:'Spread -40%; recovery +20%. Double stagger buildup rewards concentrated close hits.',fields:{rate:1.2,cooldown:1.2},spreadFactor:.6,flags:{staggerMultiplier:2}},
{id:'triad-scatterstorm',name:'Scatterstorm',description:'Spread +30%; pellet damage -25%. Pellets can ricochet twice to other targets; never hit the same target twice.',fields:{damage:.75},spreadFactor:1.3,flags:{evolutionRicochet:2}}]);
pair('rail',[
{id:'rail-siegebreaker',name:'Siegebreaker',description:'Damage +25%; recovery and reload +45%. Bypass frontal armor. This legacy rail weapon has no pre-fire charge; preparation is its longer firing recovery.',fields:{damage:1.25,rate:1.45,cooldown:1.45,reloadTime:1.45},flags:{armor:true}},
{id:'rail-quickdraw',name:'Quickdraw Array',description:'Recovery -25%; reload -20%; damage -30%. Existing rail penetration remains.',fields:{damage:.7,rate:.75,cooldown:.75,reloadTime:.8}}]);
pair('dagger',[
{id:'dagger-return',name:'Returning Steel',description:'Damage -20%; recovery +20%. Daggers turn toward the player after 0.4 seconds; each target can take one outbound and one return hit.',fields:{damage:.8,rate:1.2,cooldown:1.2},flags:{returning:true}},
{id:'dagger-mark',name:'Marked Prey',description:'Damage -15%; spread -30%. Consecutive hits on one target grant up to +30% direct damage; a resolved miss, different target or a 1.2-second gap resets the sequence.',fields:{damage:.85},spreadFactor:.7,flags:{sequenceMark:true}}]);
pair('fist',[
{id:'fist-disruptor',name:'Disruptor',description:'Damage -20%; double stagger buildup. Boss stagger immunity and short exposure limits remain.',fields:{damage:.8},flags:{staggerMultiplier:2}},
{id:'fist-counterweight',name:'Counterweight',description:'Recovery +25%; reach -10%. Counter eligible warned attacks and deal +25% damage while an interrupted target is exposed.',fields:{cooldown:1.25,rate:1.25,reach:.9},flags:{counterBrace:true,counterDamage:1.25}}]);
pair('medkit',[
{id:'medkit-field',name:'Field Recovery',description:'Restore 3 hull over 6 seconds. Taking damage stops remaining restoration. Cooldown remains 30 seconds.',flags:{regenKit:true}},
{id:'medkit-seal',name:'Emergency Seal',description:'Restore 1 hull immediately and block one hit within 3 seconds. Recovery +20% (36 seconds from the standard 30).',fields:{cooldown:1.2,rate:1.2},flags:{emergencySeal:true}}]);
const themed=[
['photon-carbine','Focus Channel','Overdrive Channel','precision'],['arc-projector','Grounded Circuit','Wide Circuit','ranged'],['phase-blade','Duelist Edge','Sweeping Edge','melee'],['hardlight-screen','Rapid Screen','Anchored Screen','shield'],
['line-musket','Engraved Bore','Service Lock','precision'],['flintlock-pistol','Officer’s Load','Courier’s Load','ranged'],['officers-sabre','Riposte Guard','Crowd Guard','melee'],['field-dressing','Quick Dressing','Layered Dressing','heal'],
['trail-repeater','Trail Needle','Rapid Lever','precision'],['marshal-revolver','Longshot Cylinder','Quick Cylinder','ranged'],['bowie-knife','Duelist Grip','Frontier Sweep','melee'],['signal-flare','Wide Signal','Quick Signal','area'],
['gearcaster','Reinforced Feed','High-Speed Feed','precision'],['pocket-piston','Pressure Bore','Quick Valve','ranged'],['piston-pike','Braced Piston','Sweeping Piston','melee'],['clockwork-sentry','Long Watch','Wide Watch','sentry']];
for(const [item,a,b,role] of themed){let branches;
 if(role==='precision')branches=[{name:a,description:'Bypass armor and penetrate one additional target; direct damage -15%; recovery +25%.',fields:{damage:.85,rate:1.25,cooldown:1.25},flags:{armor:true,pierceExtra:1}},{name:b,description:'Firing recovery -20%; reload -15%; direct damage -25%. Impacts slow a target for 0.6 seconds.',fields:{damage:.75,rate:.8,cooldown:.8,reloadTime:.85},flags:{slow:.6}}];
 if(role==='ranged')branches=[{name:a,description:'Hits mark a target for 2 seconds (+15% follow-up damage); firing recovery +30%; direct damage -10%.',fields:{damage:.9,rate:1.3,cooldown:1.3},flags:{mark:2}},{name:b,description:'Projectile speed +30%; reload -25%; direct damage -20%. Hits add 12 units of knockback to ordinary enemies.',fields:{damage:.8,speed:1.3,reloadTime:.75},flags:{knockback:12}}];
 if(role==='melee')branches=[{name:a,description:'Counter eligible warned attacks; stagger buildup +50%; recovery +25%; arc -20%.',fields:{rate:1.25,cooldown:1.25,arc:.8},flags:{counterBrace:true,staggerMultiplier:1.5}},{name:b,description:'Arc +35%; reach +10%; damage -20%; recovery +20%. Add 12 units of knockback to ordinary enemies.',fields:{arc:1.35,reach:1.1,damage:.8,rate:1.2,cooldown:1.2},flags:{knockback:12}}];
 if(role==='shield')branches=[{name:a,description:'Cooldown -25%; shield lifetime -30%.',fields:{rate:.75,cooldown:.75,duration:.7}},{name:b,description:'Shield lifetime +40%; cooldown +30%.',fields:{duration:1.4,rate:1.3,cooldown:1.3}}];
 if(role==='heal')branches=[{name:a,description:'Cooldown -25%; total healing reduced by one hull, minimum one. Existing timed dressing behavior remains.',fields:{rate:.75,cooldown:.75},add:{power:-1}},{name:b,description:'Restore one additional hull; cooldown +40%. Existing timed dressing behavior remains.',fields:{rate:1.4,cooldown:1.4},add:{power:1}}];
 if(role==='area')branches=[{name:a,description:'Effect radius +30%; cooldown +30%. Existing mark/status behavior remains.',fields:{radius:1.3,rate:1.3,cooldown:1.3}},{name:b,description:'Cooldown -25%; radius -25%.',fields:{radius:.75,rate:.75,cooldown:.75}}];
 if(role==='sentry')branches=[{name:a,description:'Deployment duration +35%; cooldown +30%; shot damage -10%.',fields:{power:1.35,duration:1.35,rate:1.3,cooldown:1.3,shotDamage:.9}},{name:b,description:'Tracking arc +35%; shot damage -20%.',fields:{arc:1.35,shotDamage:.8}}];
 pair(item,branches.map((branch,i)=>({id:'evo-'+item+'-'+(i?'b':'a'),...branch})));
}
const aliases={damage:'dmg',reloadTime:'reloadDuration'};
function forItem(item){const key=typeof item==='string'?item:item?.kind;return definitions.filter(e=>e.item===key)}
function compatible(id,item){return definitions.find(e=>e.id===id&&e.item===(typeof item==='string'?item:item?.kind))||null}
function effective(item,id,mode='server'){const e=compatible(id,item);if(!e||item.evolutionId===e.id||item.nnEvolution===e.id)return {...item};const out={...item,evolutionId:e.id,nnEvolution:e.id};for(const[field,factor]of Object.entries(e.fields)){const k=mode==='browser'&&Number.isFinite(item[aliases[field]])?aliases[field]:field;if(Number.isFinite(item[k]))out[k]=item[k]*factor}for(const[k,v]of Object.entries(e.add||{}))if(Number.isFinite(out[k]))out[k]=Math.max(1,out[k]+v);if(e.spreadFactor)out.spreadWidth=(item.spreadWidth||.12)*e.spreadFactor;Object.assign(out,e.flags);return out}
const api={version:'7.2',definitions,forItem,compatible,effective,coverage:groups=>groups.map((items,slot)=>({slot,total:items.length,supported:items.filter(i=>forItem(i).length===2).length}))};if(typeof module==='object'&&module.exports)module.exports=api;else root.NeonEvolutions=api;
})(typeof window==='object'?window:globalThis);
