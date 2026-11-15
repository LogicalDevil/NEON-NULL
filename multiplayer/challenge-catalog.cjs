/* Guaranteed permanent rewards. Progress uses accepted Signal Track counters. */
(function(root){'use strict';
const definitions=[
['first-contact','First Contact','kills',50,'Defeat 50 enemies.','weapon','skin-pulse-ghostline','Ghostline Pulse'],
['close-quarters','Close Quarters','meleeKills',25,'Defeat 25 enemies with melee.','weapon','skin-disc-chronoglass','Chronoglass Disc'],
['sidearm-specialist','Sidearm Specialist','secondaryKills',25,'Defeat 25 enemies with secondary equipment.','operator','amber','Relay Brass'],
['primary-specialist','Primary Specialist','primaryKills',100,'Defeat 100 enemies with primary weapons.','weapon','skin-arc-copper-vein','Copper Vein Arc'],
['broken-guard','Broken Guard','staggers',20,'Stagger or interrupt 20 enemies.','badge','counter-reader','Counter Reader'],
['precision','Exposed Circuit','weakHits',25,'Land 25 confirmed exposed weak-point hits.','operator','parallax','Parallax Agent'],
['protector','Sector Protector','objectives',5,'Complete five main or optional objectives.','badge','freight-engineer','Freight Engineer'],
['caretaker','Field Repair','healing',10,'Restore ten actual hull points.','operator','polar','Polar Unit'],
['rescue','Never Left Behind','revives',3,'Complete three revives in eligible co-op.','badge','rescue-lead','Rescue Lead'],
['boss-breaker','Boss Breaker','bosses',3,'Defeat three bosses.','weapon','skin-lance-sun-core','Sun Core Lance'],
['clean-extraction','Clean Extraction','cleanWins',1,'Win after 60 active seconds without taking player damage.','operator','nullcrown','Null Crown'],
['endless-veteran','Endless Veteran','waves',20,'Clear twenty waves across eligible finished runs.','weapon','skin-beam-afterimage','Afterimage Beam']
].map(([id,name,counter,goal,description,type,value,rewardName])=>Object.freeze({id:'contract-'+id,name,counter,goal,description,reward:{type,value,name:rewardName},modes:counter==='revives'?['coop']:['mission','sector','endless','coop'],assists:true,scope:'Cumulative across eligible finished runs',eligibility:'Uses the existing Signal Track eligibility: local runs must earn Track XP; online counters require accepted server results. Creative, Practice, developer tests, legacy and seeded retries are excluded.'}));
const byId=id=>definitions.find(c=>c.id===id)||null;
const api={version:1,definitions,byId};if(typeof module==='object'&&module.exports)module.exports=api;else root.NeonChallenges=api;
})(typeof window==='object'?window:globalThis);
