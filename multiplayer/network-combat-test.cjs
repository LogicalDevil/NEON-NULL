'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {Match}=require('./engine.cjs'),catalog=require('./catalog.json'),presentation=require('../work/online-projectiles.js');
const people=[{id:'one',name:'One',connected:true,gear:[0,0,0,0]},{id:'two',name:'Two',connected:true,gear:[0,0,0,0]}];
const fresh=()=>{const m=new Match(people,catalog);m.next=1e9;m.remaining=0;m.enemies.length=0;return m};
{
 const m=fresh(),p=m.players[0],start=p.gear[0].mag;
 // A short tap must survive a release received before the next 30Hz simulation tick.
 m.input('one',{seq:1,slot:0,fire:true,useId:1,aimX:950,aimY:120});
 m.input('one',{seq:2,slot:0,fire:false,useId:1,aimX:10,aimY:799});m.step();
 assert.equal(p.gear[0].mag,start-1);assert.equal(m.shots.length,1);assert.equal(m.shots[0].useId,1);assert.equal(m.shots[0].attackId,'one:1');
 assert(Math.abs(p.lastAttack.aim-Math.atan2(120-p.y,950-p.x))<1e-10,'Committed tap must retain its clicked target');
 const shot=m.shots[0];assert(Number.isFinite(shot.vx)&&Number.isFinite(shot.vy));assert.equal(shot.motionEpoch,0);assert.equal(shot.firstForUse,true);
 m.input('one',{seq:1,slot:0,fire:true,useId:1});m.step();assert.equal(p.gear[0].mag,start-1,'Duplicate/out-of-order tap must not spend ammo');
 assert.equal(m.snapshot().players[0].acceptedUseId,1);assert.equal(m.snapshot().players[0].inputAck,2);
}
{
 const m=fresh(),p=m.players[0];
 // Newer release overtakes the original press. The repeated committed action preserves the click.
 m.input('one',{seq:2,useId:1,fire:false,slot:0,aimX:900,aimY:750,press:{id:1,slot:0,aimX:950,aimY:120}});
 m.input('one',{seq:1,useId:1,fire:true,slot:0,aimX:950,aimY:120});m.step();
 assert.equal(p.gear[0].mag,7);assert.equal(p.receivedUseId,1);assert.equal(p.acceptedUseId,1);
 assert(Math.abs(p.lastAttack.aim-Math.atan2(120-p.y,950-p.x))<1e-10);
 m.input('one',{seq:3,useId:1,fire:false,slot:0,press:{id:1,slot:0,aimX:950,aimY:120}});m.step(.1);assert.equal(p.gear[0].mag,7,'Retransmitted committed click must not fire twice');
}
{
 const m=fresh(),p=m.players[0],target={x:1000,y:80},before={x:p.x,y:p.y};
 m.input('one',{seq:1,fire:true,useId:1,x:1,y:0,aim:Math.atan2(target.y-before.y,target.x-before.x),aimX:target.x,aimY:target.y});m.step(.1);
 const s=m.shots[0],angle=Math.atan2(s.vy,s.vx),expected=Math.atan2(target.y-p.y,target.x-p.x);
 assert(Math.abs(angle-expected)<1e-10,'Authoritative shot should point at clicked world coordinate after movement');
 assert.equal(p.lastAttack.x,Math.round(p.x*100)/100);assert.equal(p.gear[0].mag,7);
 p.gear[0].reload=1;m.input('one',{seq:2,fire:true,useId:2,aimX:500,aimY:300});m.step();assert.equal(p.gear[0].mag,7,'Rejected fire while reloading must not spend ammo');
}
{
 const m=fresh(),p=m.players[0],g=p.gear[0];g.muzzle=75;p.input={aimX:p.x+5,aimY:p.y};
 assert(m.projectileOrigin(p,g,0).x<=p.x+3,'Muzzle must not extend beyond close target');
 p.input={aimX:1200,aimY:p.y};m.enemies.push({id:'blocker',x:p.x+30,y:p.y,r:10,hp:20,dead:false,intro:0});
 assert(m.projectileOrigin(p,g,0).x<p.x+20,'Muzzle must not skip a target between actor and barrel');
 const first=m.snapshot().players[0].gear[0].ammoRevision;g.mag--;const second=m.snapshot().players[0].gear[0].ammoRevision;assert(second>first);
 assert.equal(m.snapshot().players[0].gear[0].ammoRevision,second,'Unchanged ammo must not bump transaction revision');
}
{
 const s={x:100,y:100,vx:600,vy:0,life:2,motionEpoch:0},prev={x:40,y:100,motionEpoch:0};
 assert.deepEqual(presentation.locate(s,prev,1,.9,.95),{x:69.99999999999997,y:100});
 assert.equal(presentation.locate(s,null,1,.9,50).x,145,'Extrapolation must cap75ms even on a suspended tab');
 assert.equal(presentation.locate({...s,motionEpoch:1},prev,1,.9,.95).x,100,'Bounces must not interpolate across trajectory epochs');
 assert.equal(presentation.aimAngle({x:4,y:5},{x:4,y:10}),Math.PI/2);
}
console.log('PASS network combat6.9: quick tap commits once, input replay rejection, click target retained across movement, authoritative ammo/attack acknowledgments, bounded muzzle, ammo revisions, interpolation/extrapolation and bounce discontinuity');
