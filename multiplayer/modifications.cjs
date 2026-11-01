'use strict';
const definitions=[
 {id:'pulse-through',kinds:['bolt'],fields:{damage:.9},pierceExtra:1},
 {id:'tight-bore',kinds:['tri','auto-shotgun'],fields:{rate:1.15,cooldown:1.15},spreadFactor:.55},
 {id:'rail-breaker',kinds:['rail'],fields:{damage:1.3,rate:1.45,cooldown:1.45,reloadTime:1.45}},
 {id:'return-blades',kinds:['dagger'],fields:{damage:.75,rate:1.2,cooldown:1.2},returning:true},
 {id:'fist-breaker',kinds:['fist'],fields:{damage:.85},staggerMultiplier:2},
 {id:'scythe-sweep',kinds:['scythe'],fields:{arc:1.35,cooldown:1.25,rate:1.25}},
 {id:'medkit-regen',kinds:['medkit'],fields:{},regenKit:true},
 {id:'spear-brace',kinds:['spear'],fields:{cooldown:1.2,rate:1.2},counterBrace:true}
];
function validate(id,item){return definitions.find(m=>m.id===id&&m.kinds.includes(item?.kind))?.id||null}
function apply(item,id){const result={...item},mod=definitions.find(m=>m.id===validate(id,item));if(!mod)return result;result.modId=mod.id;for(const[field,factor]of Object.entries(mod.fields))if(Number.isFinite(result[field]))result[field]*=factor;if(mod.spreadFactor)result.spreadWidth=(result.spreadWidth||.12)*mod.spreadFactor;for(const field of['pierceExtra','returning','staggerMultiplier','regenKit','counterBrace'])if(mod[field]!==undefined)result[field]=mod[field];return result}
module.exports={definitions,validate,apply};
