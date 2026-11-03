'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const env={window:{}};for(const file of ['combat-effects.js','enemy-models.js'])vm.runInNewContext(fs.readFileSync('work/'+file,'utf8'),env);
let depth=0,calls=0;
const ctx=new Proxy({globalAlpha:1},{get(o,k){if(k in o)return o[k];return(...args)=>{calls++;if(k==='save')depth++;if(k==='restore')depth--;for(const value of args)if(typeof value==='number')assert(Number.isFinite(value),'nonfinite canvas '+k);assert(depth>=0)}},set(o,k,value){if(typeof value==='number')assert(Number.isFinite(value),'nonfinite '+k);o[k]=value;return true}});
const art=env.window.NeonEnemyModels,fx=env.window.NeonCombatFX.create();
for(const type of [...art.types,'signal-core'])for(const quality of ['low','standard','high'])for(const reduced of[false,true])for(const state of['normal','warning','charge','recovery','damaged']){
 const e={x:100,y:100,r:type==='signal-core'?50:18,type:{id:type},max:100,hp:state==='damaged'?20:100,age:2,phase:.8,warning:state==='warning'?1:0,chargeLeft:state==='charge'?1:0,recovery:state==='recovery'?.5:0,damageFlash:.1,open:state==='damaged'},before=JSON.stringify(e);
 for(const theme of type==='signal-core'?['relay','archive','breach']:['relay']){art.draw(ctx,e,{quality,reduced,theme});assert.equal(depth,0)}assert.equal(JSON.stringify(e),before,'renderer changed simulation');
}
for(let i=0;i<100;i++){fx.impact(100,80,'metal',.5,15);fx.defeat(100,80,'asteroid',15)}assert.equal(fx.stats().impacts,48);
const beforeQuiet=calls;fx.draw(ctx,.016,{intensity:0});assert.equal(calls,beforeQuiet,'zero effects still drew');
for(const material of ['metal','armor','stone','energy','shield'])for(const quality of ['low','standard','high'])for(const reduced of[false,true]){fx.impact(100,80,material,.5,15,true);fx.draw(ctx,.016,{quality,reduced,intensity:.5});assert.equal(depth,0)}
fx.draw(ctx,2,{});assert.equal(fx.stats().impacts,0);fx.defeat(1,1,'drone');fx.clear();assert.equal(fx.stats().impacts,0);
assert.equal(env.window.NeonCombatFX.material({type:{id:'asteroid'}}),'stone');assert.equal(env.window.NeonCombatFX.material({type:{id:'orb'}}),'energy');assert.equal(env.window.NeonCombatFX.material({type:{id:'shield-carrier'}}),'shield');
console.log('PASS all enemy states/quality/motion and boss themes draw finite geometry without simulation mutation; material feedback bounded, expires, clears and respects intensity zero');
