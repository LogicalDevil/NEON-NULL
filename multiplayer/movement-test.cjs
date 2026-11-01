const assert=require('node:assert/strict'),{Match}=require('./engine.cjs'),catalog=require('./catalog.json');
const make=()=>{const m=new Match([{id:'p',name:'Pilot',connected:true,gear:[0,0,0,0]}],catalog);m.next=1e9;return m};
let m=make(),p=m.players[0],start=p.x;
m.input('p',{seq:1,commands:[{seq:1,dt:.05,x:1,y:0}],x:1});assert.equal(p.moveAck,-1);assert.equal(p.processedSeq,-1);m.step(1/30);assert.equal(p.moveAck,-1);assert.equal(p.processedSeq,1);assert(Math.abs(p.x-start-230/30)<1e-8);m.step(1/30);assert.equal(p.moveAck,1);assert(Math.abs(p.x-start-11.5)<1e-8);m.input('p',{seq:2,commands:[{seq:1,dt:.05,x:1,y:0}]});m.step();assert.equal(p.x,start+11.5);
// Six-tick delivery delay: authoritative position + only the unprocessed movement equals local prediction.
m=make();p=m.players[0];start=p.x;const history=[],packets=[];let cmd=0,packet=0,maxError=0;
for(let tick=0;tick<90;tick++){
 for(let n=0;n<2;n++)history.push({seq:++cmd,dt:1/60,x:tick<30?1:0,y:0});
 if(tick%2===0)packets.push({at:tick+6,seq:++packet,commands:history.filter(c=>c.seq>cmd-4)});
 for(const b of packets.filter(b=>b.at===tick))m.input('p',b);
 m.step();let predicted=p.x;for(const c of history)if(c.seq>p.moveAck)predicted+=c.x*230*Math.max(0,c.dt-(c.seq===p.moveQueue[0]?.seq?p.moveQueue[0].used:0));const expected=start+230*Math.min(tick+1,30)/30;maxError=Math.max(maxError,Math.abs(predicted-expected));
}assert(maxError<.02,'Replay drift '+maxError);assert(Math.abs(p.x-start-230)<.02);const stopped=p.x;for(let n=0;n<30;n++)m.step();assert.equal(p.x,stopped);
// Gun recoil is visual; firing while stationary does not move the body.
p.input.aim=0;p.gear[0].cool=0;const before={x:p.x,y:p.y};m.shoot(p,p.gear[0]);assert.deepEqual({x:p.x,y:p.y},before);
m.input('p',{seq:1000,commands:[{seq:1000,dt:.05,x:1,y:0}]});m.hit(p,10);assert.equal(p.moveQueue.length,0);
// A bounded server-time credit absorbs delivery jitter and dropped simulation ticks.
m=make();p=m.players[0];start=p.x;m.input('p',{seq:0,commands:[]});
for(let tick=0;tick<6;tick++)m.step();
m.input('p',{seq:1,commands:Array.from({length:4},(_,n)=>({seq:n+1,dt:.05,x:1,y:0}))});m.step();m.step();
assert.equal(p.moveAck,4);assert(Math.abs(p.x-start-46)<1e-7);assert.equal(p.moveQueue.length,0);
// Supplying arbitrary command duration cannot exceed the accrued simulation budget.
m=make();p=m.players[0];start=p.x;m.input('p',{seq:0,commands:Array.from({length:30},(_,n)=>({seq:n+1,dt:.05,x:1,y:0}))});m.step();
assert(Math.abs(p.x-start-230/30)<1e-7);m.allowMovementCatchup(10);assert(p.moveCredit<=.25);m.step();assert(p.x-start<=230*(1/30+.1)+1e-7);
for(let tick=0;tick<30;tick++)m.step();assert.equal(p.moveQueue.length,0,'Stale queued input expires');const stale=p.x;for(let tick=0;tick<30;tick++)m.step();assert.equal(p.x,stale);
console.log('PASS simulated 200ms delivery delay: replay error '+maxError.toFixed(6)+'px; processed/partial acknowledgements, duplicate rejection, no gun drift, bounded jitter catch-up, stale queue and down cleanup');
