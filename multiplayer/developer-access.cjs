'use strict';
const {randomInt}=require('node:crypto'),content=require('./developer-content.cjs'),cases=require('./case-catalog.json');
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
function ids(value){return new Set((Array.isArray(value)?value:String(value||'').split(',')).map(s=>String(s).trim().toLowerCase()).filter(s=>uuid.test(s)))}
function create(getIds){const outfits=new Map();return{
 allowed(user){return typeof user==='string'&&ids(getIds()).has(user.toLowerCase())},
 catalog(){return{...cases,gallery:{operator:[{id:'mono',name:'Signal Suit',kind:'operator',rarity:'Common',desc:'Original starter operator'},...cases.operator],weapon:cases.weapon},exclusive:{operator:content.operators,weapon:content.weapons}}},
 roll(b){const kind=b.kind==='operator'?'operator':'weapon',count=Number(b.count??1);if(![1,10,50,100].includes(count))throw Error('Choose 1, 10, 50 or 100 test rolls');let pool=cases[kind],forced=false;
 if(b.exact){const item=[...pool,...(kind==='operator'?content.operators:content.weapons)].find(i=>i.id===b.exact);if(!item)throw Error('Unknown preview item');pool=[item];forced=true}else if(b.rarity){pool=pool.filter(i=>i.rarity===b.rarity);if(!pool.length)throw Error('Unknown rarity');forced=true}
 const total=pool.reduce((n,i)=>n+(i.odds||1),0),results=[];for(let n=0;n<count;n++){let ticket=randomInt(10000000)/10000000*total,item=pool.at(-1);for(const i of pool){ticket-=i.odds||1;if(ticket<0){item=i;break}}results.push({id:item.id,kind,rarity:item.rarity,name:item.name,forced})}return{results,forced,kind,testOnly:true}},
 equip(user,b){if(b.clear){outfits.delete(user);return null}const previous=outfits.get(user)||{appearance:null,weaponSkins:{}};if(b.operator!==undefined){if(b.operator!==null&&!content.operators.some(i=>i.id===b.operator))throw Error('Unknown developer operator');previous.appearance=b.operator}if(b.weapon){const skin=content.weapons.find(i=>i.id===b.weapon);if(!skin||skin.weaponIndex<0)throw Error('This skin is available in the melee preview only');previous.weaponSkins[String(skin.weaponIndex)]=skin.id}previous.expires=Date.now()+65000;outfits.set(user,previous);return previous},
 outfit(user){const o=outfits.get(user);if(!o||!this.allowed(user)||o.expires<Date.now()){outfits.delete(user);return null}return o},
 refresh(user){const o=this.outfit(user);if(o)o.expires=Date.now()+65000},
 sweep(){for(const user of outfits.keys())this.outfit(user)},clear(){outfits.clear()}
}}
module.exports={create,ids};
