'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../work/multiplayer-client.js'),'utf8');
const actual=source.slice(source.indexOf('function recordMovement('),source.indexOf('\nfunction inView('));
function fixture(){return vm.createContext({room:{state:'playing'},maps:{players:new Map([['p',{down:false,connected:true}]])},ticket:'p',history:[],moveSequence:0,moveSealed:0,moveSent:0,correction:{x:0,y:0},clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),movement:()=>({x:1,y:0})})}
for(const fps of[10,15,30,60,120,144]){
 const context=fixture();vm.runInContext(actual,context);
 let seconds=0;
 for(let n=0;n<fps;n++){
  context.delta=1/fps;vm.runInContext('recordMovement(delta)',context);
  // Seal and acknowledge at a network boundary so this exercises multiple chunks.
  if(n%Math.max(1,Math.round(fps/15))===0){seconds+=context.history.reduce((s,c)=>s+c.dt,0);context.history.length=0;context.moveSealed=context.moveSequence}
 }
 seconds+=context.history.reduce((s,c)=>s+c.dt,0);assert(Math.abs(seconds-1)<1e-8,fps+' FPS changes movement duration');
 assert(context.history.every(c=>c.dt<=.05));
}
const context=fixture();vm.runInContext(actual,context);vm.runInContext('recordMovement(.01);moveSealed=1;recordMovement(.01)',context);assert.equal(context.history.length,2);assert.equal(context.history[0].dt,.01,'In-flight commands must stay immutable');
context.history.length=0;vm.runInContext('recordMovement(10)',context);assert(Math.abs(context.history.reduce((s,c)=>s+c.dt,0)-.1)<1e-8,'Long suspension must not replay seconds of held movement');
console.log('PASS actual client command recorder at 10/15/30/60/120/144 FPS, immutable in-flight durations and bounded suspension catch-up');
