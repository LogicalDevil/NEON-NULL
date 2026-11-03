/* Shared encounter roster: randomized ties, equal representation, bounded pressure. */
(function(root){'use strict';
const speedMultiplier=1.15;
const tiers=[['drone','orb','weaver','sprinter','stalker'],['asteroid','ranger','charger'],['brute','bomber','dasher'],['shield-carrier','mine-layer','support-drone','blink-stalker']];
function eligible(level=1){return tiers.slice(0,Math.max(1,Math.min(4,Math.floor(level)||1))).flat()}
function create(random=Math.random){const counts=new Map();let total=0;return{
 next(pool,batch={}){const ids=[...new Set(pool)].filter(id=>typeof id==='string'&&id);if(!ids.length)return null;
 const safe=ids.filter(id=>!(['bomber','mine-layer'].includes(id)&&((batch.bomber||0)+(batch['mine-layer']||0)>=1))&&!(id==='brute'&&(batch.brute||0)>=2)),choices=safe.length?safe:ids;
 let min=Infinity,ties=[];for(const id of choices){const n=counts.get(id)||0;if(n<min){min=n;ties=[id]}else if(n===min)ties.push(id)}const id=ties[Math.min(ties.length-1,Math.max(0,Math.floor(random()*ties.length)))];counts.set(id,(counts.get(id)||0)+1);batch[id]=(batch[id]||0)+1;total++;return id},
 group(pool,count){const result=[];let batch={};for(let i=0;i<Math.min(150,Math.max(0,Math.floor(count)||0));i++){if(i%7===0)batch={};result.push(this.next(pool,batch))}return result.filter(Boolean)},
 reset(){counts.clear();total=0},stats(){return{total,counts:Object.fromEntries(counts)}}
}}
const api={speedMultiplier,eligible,create};if(typeof module==='object'&&module.exports)module.exports=api;else root.NeonEnemyDirector=api;
})(typeof window==='object'?window:globalThis);
