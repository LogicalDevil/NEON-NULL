/* Shared colored encounter identities. Native base IDs keep the established AI. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.NeonFactionEnemies=api})(typeof window==='object'?window:globalThis,function(){'use strict';
const factions=[
{id:'default',name:'Relay Security',map:'Relay Yard',body:'#526f87',secondary:'#d5dfe2',accent:'#c8a55c',attack:'#b2384a',material:'ceramic and industrial steel',native:['drone','ranger','sprinter','weaver']},
{id:'spectrum',name:'Spectrum Division',map:'Prism Array',body:'#6256a8',secondary:'#dceef2',accent:'#42c5d4',attack:'#ae2f63',material:'optical glass and white ceramic',native:['orb','weaver','ranger','blink-stalker']},
{id:'blackpowder',name:'The Blackpowder Company',map:'Ironwake Battery',body:'#65435c',secondary:'#d8c49b',accent:'#b6894e',attack:'#b43c3a',material:'walnut, lacquer and engraved brass',native:['ranger','brute','bomber','shield-carrier']},
{id:'frontier',name:'Frontier Union',map:'Red Mesa Exchange',body:'#a56b45',secondary:'#d2bd91',accent:'#4e9a9a',attack:'#b64038',material:'weathered copper and expedition fabric',native:['sprinter','ranger','dasher','stalker']},
{id:'brassworks',name:'Brassworks Syndicate',map:'The Pressureworks',body:'#aa873d',secondary:'#3e735e',accent:'#d99254',attack:'#b53d48',material:'aged brass, enamel and dark iron',native:['shield-carrier','support-drone','brute','charger']}
];
// id, name, native AI, health, speed, radius, scrap weight, ability, weakness
const rows={
default:[
['relay-patrol-hound','Patrol Hound','dasher',8,78,16,18,'Braces, locks its approach and lunges with a recovery window.','Move perpendicular to the warned lunge; punish recovery.'],
['relay-linekeeper','Linekeeper','ranger',7,51,17,18,'Holds firing distance and warns before a short aimed burst.','Use cover and approach during firing recovery.'],
['relay-skimmer','Relay Skimmer','weaver',5,112,14,16,'Weaves through a lateral approach; vulnerable while changing direction.','Track the real narrow body and intercept its side route.'],
['relay-bulwark','Bulwark Unit','brute',28,34,27,35,'Heavy tracked advance with visibly reinforced frontal plating.','Flank the armor or stagger it before concentrating fire.'],
['relay-maintenance-wisp','Maintenance Wisp','support-drone',8,49,15,25,'Repairs one visible living ally while its core is exposed.','Interrupt the repair link or prioritize the fragile repair core.']],
spectrum:[
['spectrum-photon-stalker','Photon Stalker','dasher',7,89,15,19,'Signals a locked optical dash; never changes its aim mid-lunge.','Leave the warned line before discharge.'],
['spectrum-prism-marksman','Prism Marksman','ranger',6,47,18,20,'Focuses a bright aiming assembly before an energy shot.','Break its line of sight during focus or attack during recovery.'],
['spectrum-refraction-skater','Refraction Skater','weaver',4,125,13,18,'Glides laterally with a narrow solid body and brief optical fins.','Ignore decorative fins and lead its lateral motion.'],
['spectrum-crystal-bastion','Crystal Bastion','brute',25,31,26,36,'Slow faceted plating surrounds an exposed central lens.','Use its slow turn to attack from the sides or stagger the core.'],
['spectrum-conduit-weaver','Conduit Weaver','shield-carrier',14,44,20,27,'Protects a bounded nearby group through optical conduits.','Disable the emitter to remove nearby protection.']],
blackpowder:[
['blackpowder-bayonet-guard','Bayonet Guard','charger',9,69,18,20,'Lowers a bayonet before a committed straight thrust.','Dodge across the thrust and exploit its long mechanical recovery.'],
['blackpowder-line-fusilier','Line Fusilier','ranger',8,39,18,20,'Aims a long musket before firing and working its lock.','Close distance during the conspicuous firing recovery.'],
['blackpowder-dispatch-runner','Dispatch Runner','sprinter',5,118,14,18,'Fast messenger construct approaches around occupied lanes.','Cut off its route; light armor cannot withstand focused fire.'],
['blackpowder-siege-grenadier','Siege Grenadier','bomber',15,42,22,32,'Approaches a firing position and marks a powder blast before detonation.','Leave the marked radius; the unit must recover before another blast.'],
['blackpowder-field-artificer','Field Artificer','support-drone',10,39,18,27,'Repairs a living ally through a visible field-tool connection.','Interrupt its exposed repair action.']],
frontier:[
['frontier-dusttrail-raider','Dusttrail Raider','stalker',9,84,18,20,'Advances through changing positions with readable close-range pressure.','Keep an escape route and attack between advances.'],
['frontier-cylinder-deputy','Cylinder Deputy','ranger',7,53,17,21,'Maintains space for aimed revolver fire, then recovers.','Cross its aim line before firing and punish the reload window.'],
['frontier-spur-runner','Spur Runner','dasher',5,108,14,18,'A fragile fast unit that warns before a committed approach.','Side-step its locked charge; avoid chasing decorative dust.'],
['frontier-ironhide-hauler','Ironhide Hauler','brute',32,30,29,38,'A broad slow carrier pressures space through armored advances.','Exploit its slow turning and exposed side machinery.'],
['frontier-signal-wrangler','Signal Wrangler','mine-layer',10,53,19,28,'Leaves visible delayed signal zones while repositioning.','Do not chase through marked zones; force it out of prepared ground.']],
brassworks:[
['brassworks-piston-strider','Piston Strider','charger',11,65,19,22,'Compresses its piston legs before a warned forward shove.','Move sideways during compression, then attack the released piston.'],
['brassworks-rivet-gunner','Rivet Gunner','ranger',9,42,19,22,'Braces its industrial rivet assembly before aimed fire.','Break the firing lane and punish its recoil recovery.'],
['brassworks-gearwheel-scuttler','Gearwheel Scuttler','weaver',6,107,15,19,'Runs on offset gear wheels with pronounced lateral steering.','Lead its movement and use clear lanes rather than chasing corners.'],
['brassworks-boiler-sentinel','Boiler Sentinel','brute',30,29,28,39,'A large pressure vessel advances slowly behind heavy plating.','Circle its slow chassis and stagger its visible vent core.'],
['brassworks-valve-tender','Valve Tender','support-drone',11,37,19,29,'Maintains damaged living machinery through an exposed valve link.','Interrupt maintenance and avoid standing on its supported approach.']]
};
const roles=['pursuer','ranged','flanker','heavy','support'],intro=[1,1,2,3,3];
const types=[];
for(const faction of factions)for(let n=0;n<5;n++){
const[id,name,baseId,hp,speed,r,value,ability,weakness]=rows[faction.id][n];
types.push(Object.freeze({id,name,faction:faction.id,role:roles[n],baseId,hp,speed,r,value,introWave:intro[n],warning:n===1?.95:n===0?1.05:1.1,recovery:n===1?1.05:n===0?.8:1.2,
palette:Object.freeze({body:faction.body,secondary:faction.secondary,accent:faction.accent,attack:faction.attack}),material:faction.material,ability,weakness,
description:name+' · '+faction.name+'. '+ability+' '+weakness,
traits:Object.freeze(n===3&&baseId==='brute'?{frontArmor:.68,rearArmor:1,turnRate:1.6}:baseId==='support-drone'?{repairMaxTargets:1,healingInterval:2,repairPerSecond:.5,repairRadius:180}:baseId==='ranger'?{warning:.95,recovery:faction.id==='blackpowder'?1.65:1.05,preferredRange:260,burstCount:['default','frontier','brassworks'].includes(faction.id)?3:1,shotDamage:faction.id==='blackpowder'?2:1,projectileSpeed:faction.id==='spectrum'?250:190,shotGap:.09}:baseId==='shield-carrier'?{protectionMax:2,protectionRadius:130}:n===2?{flanker:true,preferredRange:150}:{}),
deathEffect:['ceramic-shards','optical-fracture','powder-fragments','copper-dust','steam-rivets'][factions.indexOf(faction)],sound:'enemy-death-faction-'+id,attackSound:'enemy-attack-faction-'+id,warningSound:'enemy-windup-faction-'+id,artIndex:n}));
}
const lookup=new Map(types.map(t=>[t.id,t]));
function byId(id){return lookup.get(id)||null}
function forFaction(faction,wave=99){const key=factions.some(f=>f.id===faction)?faction:'default';return types.filter(t=>t.faction===key&&t.introWave<=Math.max(1,Math.floor(Number(wave)||1)))}
function createDirector(random=Math.random){const counts=new Map(),nativeCounts=new Map();let turn=0;return{
choose(faction,wave=1,batch={}){const group=factions.find(f=>f.id===faction)||factions[0];turn++;if(turn%5===0){const choices=group.native.filter(id=>wave>=3||!['brute','bomber','shield-carrier','support-drone','mine-layer','blink-stalker'].includes(id));const safe=choices.length?choices:['drone'];const min=Math.min(...safe.map(id=>nativeCounts.get(group.id+':'+id)||0)),ties=safe.filter(id=>(nativeCounts.get(group.id+':'+id)||0)===min),id=ties[Math.min(ties.length-1,Math.floor(Math.max(0,Math.min(.999999,random()))*ties.length))];nativeCounts.set(group.id+':'+id,min+1);return{id,baseId:id,native:true,faction:group.id}}
let choices=forFaction(group.id,wave).filter(t=>!(t.role==='heavy'&&batch.factionHeavy>=1)&&!(t.role==='support'&&batch.factionSupport>=1));if(!choices.length)choices=forFaction(group.id,1);const min=Math.min(...choices.map(t=>counts.get(t.id)||0)),ties=choices.filter(t=>(counts.get(t.id)||0)===min),selected=ties[Math.min(ties.length-1,Math.floor(Math.max(0,Math.min(.999999,random()))*ties.length))];counts.set(selected.id,min+1);if(selected.role==='heavy')batch.factionHeavy=(batch.factionHeavy||0)+1;if(selected.role==='support')batch.factionSupport=(batch.factionSupport||0)+1;return selected},
reset(){counts.clear();nativeCounts.clear();turn=0},stats(){return{turn,counts:Object.fromEntries(counts),nativeCounts:Object.fromEntries(nativeCounts)}}}}
return{version:'7.3',types,factions,byId,forFaction,createDirector};
});
