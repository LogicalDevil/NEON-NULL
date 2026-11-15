'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {performance} = require('node:perf_hooks');
const ai = require('./tactical-ai.cjs');
const {Match} = require('./engine.cjs');
const catalog = require('./catalog.json');

const enemy = {id:'observer',type:'ranger',x:100,y:100,r:15};
const target = {x:280,y:100,hp:10};
const context = {target,time:0,width:1280,height:800,obstacles:[],allies:[enemy]};
let plan = ai.decide(enemy,context);
assert.equal(plan.canAttack,false,'First sight has a reaction delay');
context.time=.4;
plan = ai.decide(enemy,context);
assert.equal(plan.canAttack,true);
assert.equal(plan.state,'strafe');
target.hp=2;target.reloading=true;context.time=.8;
assert.equal(ai.decide(enemy,context).state,'pressure');
context.obstacles=[{x:180,y:0,w:25,h:220,solid:true}];
target.x=410;context.time=1.2;
plan=ai.decide(enemy,context);
assert.equal(plan.canAttack,false);
assert.equal(plan.target.x,280,'Hidden movement retains only the last observed position');
assert.equal(plan.state,'search');
context.time=4;
plan=ai.decide(enemy,context);
assert.equal(plan.state,'search');
assert.equal(plan.target.x,enemy.x,'Expired memory cannot track a hidden target');
assert(Math.hypot(plan.steering.x-enemy.x,plan.steering.y-enemy.y)>1,'Expired memory uses a search route');

const support={id:'medic',type:'support',x:100,y:100,r:16};
const wounded={id:'ally',type:'brute',x:140,y:170,hp:2,max:20};
const supportPlan=ai.decide(support,{target,time:0,width:1280,height:800,allies:[support,wounded],obstacles:[]});
assert.equal(supportPlan.state,'support');
assert.equal(supportPlan.steering.x,wounded.x-35);

const wall={x:200,y:200,w:70,h:160,solid:true};
const runner={id:'path-test',x:120,y:280,r:12};
const destination={x:390,y:280};
for(let step=0;step<600;step++){
  const waypoint=ai.waypoint(runner,destination,[wall],1280,800);
  const distance=Math.hypot(waypoint.x-runner.x,waypoint.y-runner.y);
  if(distance<1)break;
  const travel=Math.min(distance,4);
  const next={x:runner.x+(waypoint.x-runner.x)/distance*travel,y:runner.y+(waypoint.y-runner.y)/distance*travel};
  assert(ai.lineClear(runner,next,[wall],runner.r),'Steering never crosses the solid obstacle');
  runner.x=next.x;runner.y=next.y;
}
assert(Math.hypot(destination.x-runner.x,destination.y-runner.y)<6,'Waypoint steering routes around cover');
assert(!ai.lineClear({x:0,y:20},{x:400,y:20},[{x:200,y:20,r:20,hp:10}]));
assert(ai.lineClear({x:0,y:20},{x:400,y:20},[{x:200,y:20,r:20,hp:0}]));
assert.equal(ai.allowMajor(enemy,[enemy,{id:1,warning:1},{id:2,warning:1},{id:3,dash:1}]),false);
assert.equal(ai.allowMajor(enemy,[enemy,{id:1,warning:1},{id:2,warning:1}]),true);

const match=new Match([{id:'one',name:'One',connected:true,gear:[0,0,0,0]}],catalog);
match.next=1e9;
const ranger=match.spawn(false,2);ranger.intro=0;ranger.timer=0;ranger.x=200;ranger.y=400;
const pilot=match.players[0];pilot.x=470;pilot.y=400;
match.sector={objects:[{id:'cover',x:335,y:400,r:30,hp:100}]};
for(let n=0;n<8;n++){match.time+=1/30;match.tickEnemy(ranger,[pilot],1/30);}
assert.equal(match.zones.length,0,'Server ranger does not initiate an attack through cover');
match.sector.objects.length=0;
for(let n=0;n<30;n++){match.time+=1/30;match.tickEnemy(ranger,[pilot],1/30);}
assert(match.zones.some(zone=>zone.kind==='shot'),'Server ranger attacks after visibility and reaction delay');

const teamMatch=new Match([{id:'hidden',name:'Hidden',connected:true},{id:'visible',name:'Visible',connected:true}],catalog);
const hunter=teamMatch.spawn(false,2);hunter.intro=0;hunter.x=100;hunter.y=100;
teamMatch.players[0].x=300;teamMatch.players[0].y=100;
teamMatch.players[1].x=100;teamMatch.players[1].y=400;
teamMatch.sector={objects:[{id:'cover',x:200,y:100,r:25,hp:100}]};
teamMatch.tickEnemy(hunter,teamMatch.players,.03);
assert.equal(hunter.nnTactical.target.y,400,'A visible teammate is selected ahead of a closer hidden player');

const speedTest=new Match([{id:'speed',name:'Speed',connected:true}],catalog);
assert(Math.abs(speedTest.spawn(false,0).speed-72*1.15*1.12)<1e-8);
assert(Math.abs(speedTest.spawn(true,6).speed-42*1.15)<1e-8);

const stress=new Match(Array.from({length:4},(_,i)=>({id:'p'+i,name:'Pilot'+i,connected:true})),catalog);
stress.next=1e9;
for(let i=0;i<30;i++)stress.spawn(false,i%16===6?0:i%16);
const timing=[];
for(let step=0;step<3600;step++){
  for(const player of stress.players){player.invuln=999;player.hp=10;player.down=0;}
  const start=performance.now();stress.step(1/30);timing.push(performance.now()-start);
  for(const foe of stress.enemies)assert(Number.isFinite(foe.x)&&Number.isFinite(foe.y));
}
timing.sort((a,b)=>a-b);
const report={seconds:120,players:4,initialEnemies:30,finalEnemies:stress.enemies.length,p95StepMs:timing[Math.floor(timing.length*.95)],maxStepMs:timing.at(-1),checks:['reaction delay','visible opportunity pressure','limited last-seen memory','support positioning','cover detour','line of sight','major attack budget','server attack gating','ordinary +12% speed','boss base speed retained','finite four-player simulation']};
fs.writeFileSync('outputs/AI-7.0.json',JSON.stringify(report,null,2));
console.log('PASS tactical AI regression checks',report);
