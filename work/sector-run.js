/* Relay Yard expedition. A bounded encounter controller; no animation loop of its own. */
(()=>{'use strict';
const KEY='neonNullSectorRun',VERSION=1,MAX_SAVE=56000;
const stages=[['gate'],['repair','elite'],['junction'],['depot','comms'],['defense'],['warden'],['extract']];
const nodes={
 gate:{id:'gate',title:'01 · Maintenance Approach',kind:'combat',faction:'Relay Security',total:24,reward:24,description:'Clear the maintenance platforms and energize the route switch.',effect:'Unlock the first route decision.',types:['drone','sprinter','ranger']},
 repair:{id:'repair',title:'02A · Transit Workshop',kind:'supply',faction:'Abandoned maintenance',total:0,reward:10,description:'Open a repair locker and restore the transport platform.',effect:'Restore 2 hull and ammunition. Open the upper transit door.',types:[]},
 elite:{id:'elite',title:'02B · Guard Substation',kind:'elite',faction:'Relay Security',total:35,reward:65,description:'Defeat the reinforced patrol, then recover its field cache.',effect:'Gain an upgrade token and extra run scrap; no guaranteed healing.',types:['shield-carrier','ranger','brute','support-drone']},
 junction:{id:'junction',title:'03 · Signal Junction',kind:'combat',faction:'Archive Constructs',total:40,reward:40,description:'Recover the junction terminal while fast constructs flank the yard.',effect:'Reveal both approaches to the Warden power network.',types:['weaver','blink-stalker','ranger','drone']},
 depot:{id:'depot',title:'04A · Ammunition Sabotage',kind:'sabotage',faction:'Reactor Remnants',total:38,reward:45,description:'Destroy the exposed ammunition generator and clear its guards.',effect:'The Signal Warden loses its marked bombardment attack.',types:['bomber','brute','mine-layer','drone']},
 comms:{id:'comms',title:'04B · Communications Array',kind:'comms',faction:'Archive Constructs',total:30,reward:35,description:'Secure the terminal and open its supply locker.',effect:'Refill ammunition and reveal incoming groups. The boss retains bombardment.',types:['blink-stalker','ranger','support-drone','weaver']},
 defense:{id:'defense',title:'05 · Relay Service Platform',kind:'defense',faction:'Relay Security',total:48,reward:55,description:'Defend the service relay. Enemies near its marked field begin a warned disruption.',effect:'Keep relay integrity above zero to power the boss gate.',types:['drone','charger','ranger','shield-carrier','support-drone']},
 warden:{id:'warden',title:'06 · Signal Warden',kind:'boss',faction:'Relay Security',total:0,reward:100,description:'Defeat the Signal Warden. Your earlier route decisions affect this fight.',effect:'Defeat the Warden to activate extraction.',types:[]},
 extract:{id:'extract',title:'07 · Transit Extraction',kind:'extraction',faction:'Relay Security',total:18,reward:0,description:'Clear the final interception group, then reach the extraction beacon.',effect:'Bank remaining run scrap and a completion bonus.',types:['sprinter','ranger','drone']}
};
const clone=x=>JSON.parse(JSON.stringify(x)),finite=(n,f=0)=>Number.isFinite(n)?n:f,cap=(n,a,b)=>Math.max(a,Math.min(b,n));
function fresh(){return{version:VERSION,id:globalThis.crypto?.randomUUID?.()||'sector-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),phase:'map',stage:0,completed:[],choices:[],flags:{},snapshot:null,stats:{kills:0,bosses:0,seconds:0},rewardIssued:false,reward:0,success:false}}
function valid(raw){if(!raw||raw.version!==VERSION||typeof raw.id!=='string'||raw.id.length>100||!['map','results'].includes(raw.phase)||!Number.isInteger(raw.stage)||raw.stage<0||raw.stage>7||!Array.isArray(raw.completed)||raw.completed.length>7||raw.completed.some(id=>!nodes[id])||!Array.isArray(raw.choices)||raw.choices.length>7)return null;
 if(raw.completed.some((id,i)=>!stages[i]?.includes(id))||raw.completed.length!==raw.stage||raw.completed.some((id,i)=>raw.choices[i]!==id))return null;
 let snapshot=null;if(raw.snapshot!==null&&raw.snapshot!==undefined){if(typeof raw.snapshot!=='object'||Array.isArray(raw.snapshot)||raw.snapshot.schema!==1||!Number.isFinite(raw.snapshot.hull)||raw.snapshot.hull<1||raw.snapshot.hull>10)return null;try{const text=JSON.stringify(raw.snapshot);if(text.length>48000)return null;snapshot=JSON.parse(text)}catch{return null}}
 const r=fresh();Object.assign(r,{id:raw.id,phase:raw.phase,stage:raw.stage,completed:[...raw.completed],choices:raw.choices.filter(id=>nodes[id]),snapshot,flags:{repaired:raw.completed.includes('repair'),sabotage:raw.completed.includes('depot'),comms:raw.completed.includes('comms'),elite:raw.completed.includes('elite')},stats:{kills:cap(Math.floor(finite(raw.stats?.kills)),0,100000),bosses:cap(Math.floor(finite(raw.stats?.bosses)),0,1),seconds:cap(finite(raw.stats?.seconds),0,86400)},rewardIssued:raw.rewardIssued===true,reward:cap(Math.floor(finite(raw.reward)),0,10000),success:raw.success===true,reason:typeof raw.reason==='string'?raw.reason.slice(0,160):''});return r}
function nextOptions(run){return run.phase==='map'?(stages[run.stage]||[]).map(id=>nodes[id]):[]}
function transition(run,id){if(!nextOptions(run).some(n=>n.id===id))return false;run.phase='encounter';run.node=id;run.choices[run.stage]=id;return true}
function complete(run){if(run.phase!=='encounter'||!nodes[run.node])return false;const id=run.node;run.completed.push(id);run.stage++;if(id==='repair')run.flags.repaired=true;if(id==='depot')run.flags.sabotage=true;if(id==='comms')run.flags.comms=true;if(id==='elite')run.flags.elite=true;run.phase='map';delete run.node;return true}
let bridge=null,run=null,checkpoint=null,panel=null,button=null,status=null,world=[],spawned=0,remaining=0,spawnTimer=0,waiting=0,kills=0,bossRequested=false,bossGone=false,hold=0,holdId='',lastState=null,settling=false,lastHint='',relayTimer=0,relayWarning=0,relayHP=10,revision=0,creditedEnemies=new WeakSet(),granting=false,activeEnemies=0,interactControl=null,powerAt=-1,sceneCache=new Map(),sceneBuilds=0;
function safeCall(name,...args){try{return bridge?.[name]?.(...args)}catch(error){bridge?.notify?.('Sector '+name+' failed: '+String(error.message||error).slice(0,120));return false}}
function persist(){if(!run)return false;try{const text=JSON.stringify({...run,phase:run.phase==='encounter'?'map':run.phase});if(text.length>MAX_SAVE)throw Error('Checkpoint too large');bridge.storage.setItem(KEY,text);checkpoint=JSON.parse(text);return true}catch{safeCall('notify','Checkpoint could not be stored. Keep this game open or export a backup.');return false}}
function readCheckpoint(){try{const text=bridge.storage.getItem(KEY);return text&&text.length<=MAX_SAVE?valid(JSON.parse(text)):null}catch{return null}}
function capture(){const value=safeCall('captureRun');if(value&&typeof value==='object'){try{const text=JSON.stringify(value);if(text.length<48000)run.snapshot=JSON.parse(text)}catch{}}}
function active(){return run?.phase==='encounter'}
function node(){return nodes[run?.node]||null}
function show(){if(!panel)return;safeCall('pause',true);panel.hidden=false;render()}
function close(){if(panel)panel.hidden=true;if(active())safeCall('pause',false)}
function announce(text){if(lastHint===text)return;lastHint=text;safeCall('notify',text)}
function makeObject(id,kind,x,y,w,h,extra={}){return{id,kind,x,y,w,h,hp:kind==='cover'?20:kind==='generator'?36:1,max:kind==='cover'?20:kind==='generator'?36:1,done:false,solid:kind==='cover'||kind==='door',...extra}}
function setupWorld(state){powerAt=run.flags.repaired||run.completed.includes('gate')?0:-1;const p=state.player,cx=cap(p.x,220,state.w-220),cy=cap(p.y,180,state.h-180),n=node();world=[makeObject('cover-a','cover',cx-140,cy-70,54,30),makeObject('cover-b','cover',cx+100,cy+48,60,30),makeObject('cover-c','cover',cx-90,cy+105,40,28),makeObject('route-door','door',cx+145,cy-105,24,66,{done:run.flags.repaired,solid:!run.flags.repaired}),makeObject('power','switch',cx-40,cy-100,28,28)];
 if(n.kind==='sabotage')world.push(makeObject('depot-core','generator',cx,cy-100,44,36));
 else if(n.kind==='supply'||n.kind==='elite'||n.kind==='comms')world.push(makeObject('supply','locker',cx+75,cy-90,36,28));
 else if(n.kind==='defense')world.push(makeObject('service-relay','relay',cx,cy-70,36,36));
 else if(n.kind==='extraction')world.push(makeObject('extract','extract',cx+80,cy-70,50,50));
 else world.push(makeObject('terminal','terminal',cx+65,cy-100,28,28));revision++}
function beginEncounter(id){if(!run||settling||granting||!transition(run,id))return false;const n=node();world=[];spawned=0;remaining=n.total;spawnTimer=1.2;waiting=0;kills=0;creditedEnemies=new WeakSet();hold=0;holdId='';bossRequested=bossGone=false;relayTimer=relayWarning=0;relayHP=10;activeEnemies=0;lastState=null;lastHint='';if(panel)panel.hidden=true;
 const result=safeCall('startEncounter',clone(n),{snapshot:run.snapshot?clone(run.snapshot):null,bossFlags:{sabotage:!!run.flags.sabotage,sabotageBombardment:!!run.flags.sabotage,comms:!!run.flags.comms,elite:!!run.flags.elite,repaired:!!run.flags.repaired},runId:run.id,stage:run.stage});
 if(result===false){run.phase='map';delete run.node;show();return false}safeCall('pause',false);return true}
function finishNode(){if(!active())return;const n=node();if(n.kind==='extraction'){complete(run);settle(true,'Relay Yard extracted');return}safeCall('resupply',{scrap:n.reward,heal:n.kind==='supply'?2:0,ammo:n.kind==='supply'||n.kind==='comms',modTokens:n.kind==='elite'?1:0});capture();complete(run);persist();safeCall('pause',true);show()}
async function settle(success,reason){if(!run||settling||run.phase==='results')return;settling=true;const snapshot=safeCall('captureRun');const scrap=cap(Math.floor(finite(snapshot?.scrap)),0,5000);run.phase='results';delete run.node;run.success=success;run.reason=reason;run.reward=scrap+(success?120+run.completed.length*15:run.completed.length*10);persist();safeCall('pause',true);show();await grantReward();settling=false;render()}
async function grantReward(){if(!run||run.phase!=='results'||run.rewardIssued||granting)return;const target=run;granting=true;render();try{const result=await Promise.resolve(safeCall('bankReward',target.reward,'sector:'+target.id));if(result!==false&&run===target){target.rewardIssued=true;persist();safeCall('finish',{success:target.success,runId:target.id,reward:target.reward,completedNodes:target.completed.length,route:[...target.completed],flags:{...target.flags},...target.stats});}}finally{granting=false;render()}}
function begin(){if(settling||granting)return false;const previous=readCheckpoint();if(previous&&previous.phase!=='results'&&typeof confirm==='function'&&!confirm('Abandon the saved Sector Run and start a new expedition?'))return false;run=fresh();persist();show();return true}
function resume(){const saved=readCheckpoint();if(!saved)return false;run=saved;checkpoint=clone(saved);world=[];lastState=null;show();return true}
function open(){const saved=readCheckpoint();run=saved||fresh();if(saved)checkpoint=clone(saved);else persist();show()}
function leave(){if(granting||settling){safeCall('notify','Banking expedition rewards…');return false}if(active()){safeCall('notify','Sector runs can be saved and left between encounters.');return false}if(panel)panel.hidden=true;safeCall('pause',false);safeCall('onMenu');return true}
function playerDied(){if(active())settle(false,'Hull depleted during '+node().title)}
function onRestart(){if(!active())return false;const saved=checkpoint&&valid(checkpoint);if(!saved)return false;const id=run.node;run=saved;return beginEncounter(id)}
function stop(){sceneCache.clear();powerAt=-1;if(interactControl)interactControl.hidden=true;if(active()){run=readCheckpoint();world=[]}if(panel)if(panel)panel.hidden=true;lastState=null}
function nearby(player){let best=null,dist=68;for(const o of world)if(!o.done&&['locker','switch','terminal','extract'].includes(o.kind)){const d=Math.hypot(o.x+o.w/2-player.x,o.y+o.h/2-player.y);if(d<dist){dist=d;best=o}}return best}
function interact(player,dt=.05){if(!active()||!player||lastState?.paused||lastState?.playing===false||bridge?.isPaused?.())return false;const o=nearby(player);if(!o){hold=0;holdId='';return false}if(o.kind==='extract'){if(remaining||lastState?.enemies?.length){announce('Clear the interception group before extraction.');return false}o.done=true;finishNode();return true}if(holdId!==o.id){hold=0;holdId=o.id}hold+=cap(finite(dt),0,.1);if(hold<1.2){announce('HOLD INTERACT · '+Math.round(hold/1.2*100)+'%');return true}o.done=true;hold=0;holdId='';if(o.kind==='switch'){for(const door of world)if(door.kind==='door'){door.solid=false;door.done=true}powerAt=run.stats.seconds;revision++;safeCall('worldEvent',{kind:'power-restored',x:o.x+o.w/2,y:o.y+o.h/2});announce('Transit power restored · route door open.')}else if(o.kind==='locker'){safeCall('resupply',{ammo:true,heal:0,scrap:node().kind==='elite'?25:10});announce('Supply locker recovered.')}else announce('TERMINAL · The Warden repeats a voiceprint older than Relay Yard.');return true}
function tick(dt,state){if(!active()||!state?.player||state.paused||state.playing===false)return;dt=cap(finite(dt),0,.1);lastState=state;if(!world.length)setupWorld(state);run.stats.seconds+=dt;if(state.hull<=0){playerDied();return}const n=node(),enemies=(state.enemies||[]).filter(e=>!e.dead&&e.hp>0);activeEnemies=enemies.length;if(n.kind==='boss'){if(!bossRequested){bossRequested=true;if(safeCall('startBoss','relay',{...run.flags,sabotageBombardment:!!run.flags.sabotage})===false){bossRequested=false;announce('Boss deployment retrying…')}}if(status){const text=n.title+' · '+(bossGone?'WARDEN DEFEATED':bossRequested?'DEFEAT THE WARDEN':'PREPARE FOR BOSS ARRIVAL');if(status.textContent!==text)status.textContent=text}if(bossGone)finishNode();return}
 spawnTimer-=dt;if(run.flags.comms&&remaining>0&&spawnTimer>0&&spawnTimer<.9)announce('SENSOR WARNING · Incoming group '+(Math.floor(spawned/4)+1)+' · '+remaining+' contacts remain');if(remaining>0&&spawnTimer<=0&&enemies.length<24){const count=Math.min(remaining,3+Math.floor(Math.random()*3),24-enemies.length),type=n.types[Math.floor(spawned/4)%Math.max(1,n.types.length)];const result=safeCall('spawn',type,count);if(result!==false){spawned+=count;remaining-=count}spawnTimer=n.kind==='elite'?3.4:4.8+Math.random()*1.4}
 if(n.kind==='defense'){const relay=world.find(o=>o.kind==='relay');const near=enemies.some(e=>Math.hypot(e.x-(relay.x+relay.w/2),e.y-(relay.y+relay.h/2))<85);if(near){relayTimer+=dt;if(relayTimer>1.5&&!relayWarning)relayWarning=1.1;if(relayWarning>0){relayWarning-=dt;if(relayWarning<=0){relayHP--;relayTimer=0;relayWarning=0;announce('Relay disruption · '+relayHP+'/10 integrity');if(relayHP<=0){settle(false,'Service relay destroyed');return}}}}else{relayTimer=0;relayWarning=0}}
 if(state.damageSerial!==undefined&&state.damageSerial!==tick.lastDamage){hold=0;holdId='';tick.lastDamage=state.damageSerial}
 const near=nearby(state.player);if(interactControl)interactControl.hidden=!near;if(near&&holdId!==near.id)announce(near.kind==='extract'?'EXTRACT · approach and interact after clearing enemies':'INTERACT · '+({locker:'Supply locker · hold 1.2s',switch:'Restore transit power',terminal:'Read signal terminal'}[near.kind]||near.kind));
 if(!remaining&&!enemies.length){if(n.kind==='extraction'){const e=world.find(o=>o.kind==='extract');announce('REACH THE EXTRACTION BEACON · E / Interact');if(Math.hypot(state.player.x-e.x-e.w/2,state.player.y-e.y-e.h/2)<28)finishNode()}else if(n.kind==='sabotage'&&!world.find(o=>o.kind==='generator').done)announce('DESTROY THE EXPOSED DEPOT GENERATOR');else if(['supply','elite','comms'].includes(n.kind)&&!world.find(o=>o.kind==='locker').done)announce('OPEN THE SUPPLY LOCKER · hold Interact');else if(n.kind==='combat'&&!world.find(o=>o.kind==='switch').done)announce('RESTORE TRANSIT POWER · Interact with the switch');else finishNode()}
 if(status){const text=n.title+' · '+Math.max(0,n.total-remaining)+'/'+n.total+' deployed · '+enemies.length+' active'+(n.kind==='defense'?' · RELAY '+relayHP+'/10':'');if(status.textContent!==text)status.textContent=text}
}
function enemyKilled(e){if(!active())return;if(e&&typeof e==='object'){if(creditedEnemies.has(e))return;creditedEnemies.add(e)}kills++;run.stats.kills++;if(e?.boss||e?.type?.id==='signal-core')bossDefeated()}
function bossDefeated(){if(active()&&node().kind==='boss'&&!bossGone){bossGone=true;run.stats.bosses=1}}
function projectileHit(shot,hostile=false){if(!active()||!shot||shot.life<=0)return false;for(const o of world)if(!o.done&&(hostile?o.kind==='cover':['cover','generator'].includes(o.kind))&&shot.x>o.x-(shot.r||2)&&shot.x<o.x+o.w+(shot.r||2)&&shot.y>o.y-(shot.r||2)&&shot.y<o.y+o.h+(shot.r||2)){o.hp-=Math.max(.1,finite(shot.dmg,finite(shot.damage,1)));if(o.hp<=0){o.done=true;o.solid=false;revision++;announce(o.kind==='generator'?'DEPOT DISABLED · Warden bombardment removed.':'Cover destroyed · route clear.')}return true}return false}
function blocked(x,y,r,ignore){for(const o of world)if(o!==ignore&&o.solid&&!o.done){const nx=cap(x,o.x,o.x+o.w),ny=cap(y,o.y,o.y+o.h);if(Math.hypot(x-nx,y-ny)<r)return o}return null}
function resolveMovement(entity,oldX,oldY){if(!active()||!entity||!world.length)return false;const r=Math.max(8,entity===lastState?.player?13:entity.r||13);let o=blocked(entity.x,entity.y,r),swept=false;
 if(!o){const dx=entity.x-oldX,dy=entity.y-oldY,steps=Math.min(64,Math.ceil(Math.hypot(dx,dy)/Math.max(4,r*.65)));for(let n=1;n<=steps;n++){const x=oldX+dx*n/steps,y=oldY+dy*n/steps,wall=blocked(x,y,r);if(wall){o=wall;swept=true;entity.x=oldX+dx*(n-1)/steps;entity.y=oldY+dy*(n-1)/steps;break}}}if(!o)return false;
 if(!swept){if(!blocked(entity.x,oldY,r)){entity.y=oldY}else if(!blocked(oldX,entity.y,r)){entity.x=oldX}else{entity.x=oldX;entity.y=oldY;if(blocked(oldX,oldY,r)){const edges=[{x:o.x-r-1,y:oldY},{x:o.x+o.w+r+1,y:oldY},{x:oldX,y:o.y-r-1},{x:oldX,y:o.y+o.h+r+1}].sort((a,b)=>Math.hypot(a.x-oldX,a.y-oldY)-Math.hypot(b.x-oldX,b.y-oldY));const free=edges.find(e=>!blocked(e.x,e.y,r));if(free){entity.x=free.x;entity.y=free.y}}}}
 if(entity!==lastState?.player){const step=Math.max(1.5,Math.min(5,Math.hypot(entity.x-oldX,entity.y-oldY)+1.5));if(Math.abs(oldX-(o.x+o.w/2))>Math.abs(oldY-(o.y+o.h/2))){const sign=oldY<o.y+o.h/2?-1:1;if(!blocked(entity.x,entity.y+sign*step,r))entity.y+=sign*step}else{const sign=oldX<o.x+o.w/2?-1:1;if(!blocked(entity.x+sign*step,entity.y,r))entity.x+=sign*step}}return true}

function safeSpawn(x,y,r=14){if(!active())return{x,y};for(let i=0;i<20;i++){const a=i*2.399,px=x+Math.cos(a)*i*14,py=y+Math.sin(a)*i*14;if(!blocked(px,py,r)&&(!lastState?.player||Math.hypot(px-lastState.player.x,py-lastState.player.y)>130))return{x:cap(px,r,lastState?.w-r||5000),y:cap(py,r,lastState?.h-r||5000)}}return{x:30,y:30}}
/* Static yard scenery is rasterized at half world resolution, then sampled by camera.
   Atmosphere uses deterministic positions and the simulation clock: no new timers. */
function scenery(c,w,h,id){
 const workshop=['repair','elite'].includes(id),archive=['junction','comms'].includes(id),accent=archive?'#76969d':id==='depot'?'#ac8b5d':'#7b8c96';
 c.fillStyle=archive?'#edf1f1':workshop?'#f0efea':'#edf0f1';c.fillRect(20,20,w-40,h-40);
 c.strokeStyle='#697c8815';c.lineWidth=1;
 for(let x=60;x<w-30;x+=120)for(let y=46;y<h-30;y+=96){c.strokeRect(x,y,108,84);c.fillStyle='#ffffff80';c.fillRect(x+1,y+1,106,2);if((x+y)%5===0){c.fillStyle='#596f7814';c.fillRect(x+9,y+9,21,2)}}
 // Flush inspection hatches and inset ducts: surface detail, never solid scenery.
 for(let i=0;i<4;i++){const px=w*(.18+i*.21),py=h*(i%2?.58:.38);c.fillStyle='#d6e0e333';c.fillRect(px-37,py-25,74,50);c.strokeStyle='#6e879333';c.strokeRect(px-37,py-25,74,50);c.fillStyle='#7a929c40';for(let slot=0;slot<9;slot++)c.fillRect(px-29+slot*7,py-16,2,32);c.fillStyle='#ffffff90';c.fillRect(px-36,py-24,72,1)}
 c.strokeStyle='#6d879821';c.lineWidth=4;c.beginPath();c.moveTo(w*.14,h*.64);c.lineTo(w*.42,h*.64);c.lineTo(w*.42,h*.36);c.lineTo(w*.85,h*.36);c.stroke();c.strokeStyle='#eef5f7';c.lineWidth=1;c.stroke();
 // Painted circulation lanes carry no collision. Machinery stays beyond the railing.
 c.fillStyle='#7b8f9a0b';c.fillRect(w*.21,36,w*.075,h-72);c.fillRect(36,h*.74,w-72,42);
 c.strokeStyle='#b096661f';c.lineWidth=2;c.setLineDash([12,16]);
 for(const x of[w*.21,w*.285]){c.beginPath();c.moveTo(x,46);c.lineTo(x,h-46);c.stroke()}c.setLineDash([]);
 c.strokeStyle='#60788625';c.lineWidth=2;
 for(const x of[44,w-44]){c.beginPath();c.moveTo(x,40);c.lineTo(x,h-40);c.stroke()}
 for(const y of[43,h-43]){c.beginPath();c.moveTo(42,y);c.lineTo(w-42,y);c.stroke()}
 // Cable trunking and puddles are low contrast, below targets and warnings.
 for(let i=0;i<7;i++){const x=96+i*(w-210)/6,y=h*.79+Math.sin(i*2.1)*19;
  c.fillStyle='#52718409';c.beginPath();c.ellipse(x,y,32+i%3*9,7+i%2*3,-.12,0,Math.PI*2);c.fill();
  c.strokeStyle='#ffffffa0';c.lineWidth=1;c.beginPath();c.moveTo(x-20,y-1);c.lineTo(x+11,y-2);c.stroke()}
 for(let i=0;i<9;i++){const x=80+i*(w-170)/8;
  c.fillStyle='#263e4a0b';c.fillRect(x+4,16,58,22);c.fillStyle='#bfcbd0';c.fillRect(x,12,58,18);
  c.fillStyle='#dce4e6';c.fillRect(x+2,13,54,3);c.strokeStyle='#8fa1aa';c.strokeRect(x,12,58,18);
  c.fillStyle='#58717d';for(let v=0;v<6;v++)c.fillRect(x+6+v*8,19,4,6);
  c.fillStyle=accent;c.fillRect(x+9,h-29,40,4)}
 // Transit markings create recognizable places without competing with HUD text.
 c.save();c.globalAlpha=.18;c.fillStyle='#405b6a';c.font='bold 17px "NN Chakra",sans-serif';c.textAlign='left';
 c.fillText(archive?'SIGNAL / ARCHIVE':workshop?'TRANSIT / SERVICE':id==='warden'?'RELAY / CONTROL':'RELAY YARD / 07',64,76);
 c.font='10px "NN Chakra",sans-serif';c.fillText('KEEP ACCESS ROUTES CLEAR',64,h-63);c.restore();
}
function scene(ctx,o,n){
 const w=lastState?.w||1800,h=lastState?.h||1050,key=w+'x'+h+'/'+n.id;
 let canvas=sceneCache.get(key);
 if(!canvas&&typeof document!=='undefined'){
  canvas=document.createElement('canvas');canvas.width=Math.ceil(w*.5);canvas.height=Math.ceil(h*.5);
  const c=canvas.getContext('2d');if(c){c.scale(.5,.5);scenery(c,w,h,n.id);if(sceneCache.size>=2)sceneCache.delete(sceneCache.keys().next().value);sceneCache.set(key,canvas);sceneBuilds++}else canvas=null;
 }
 const x=Math.max(0,o.cameraX||0),y=Math.max(0,o.cameraY||0),vw=Math.min(o.viewW||1200,w-x),vh=Math.min(o.viewH||800,h-y);
 if(canvas&&vw>0&&vh>0)ctx.drawImage(canvas,x*.5,y*.5,vw*.5,vh*.5,x,y,vw,vh);
 const t=finite(run?.stats.seconds),powered=powerAt>=0,elapsed=powered?t-powerAt:0,low=o.quality==='low',intensity=typeof window.NeonRuntime?.effects==='function'?window.NeonRuntime.effects():1;
 const sw=world.find(item=>item.kind==='switch'),door=world.find(item=>item.kind==='door');
 if(sw&&door){const sx=sw.x+sw.w/2,sy=sw.y+sw.h+12,tx=door.x+door.w/2,ty=door.y+door.h+12;ctx.strokeStyle='#849c9e27';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(tx,sy);ctx.lineTo(tx,ty);ctx.stroke();
  for(let i=0;i<10;i++){const fraction=i/9,lx=sx+(tx-sx)*fraction,ly=sy,on=powered&&(powerAt===0||elapsed>i*.075);ctx.fillStyle=on?'#7fa393':'#9bacb36b';ctx.fillRect(lx-2,ly-2,4,4);if(on&&!low&&intensity>0){ctx.fillStyle='#86b89e16';ctx.fillRect(lx-5,ly-5,10,10)}}}
 // Sequential floor lights describe the same power state as the opened shutter.
 for(let i=0;i<14;i++){
  const lx=72+i*(w-150)/13,ly=h-48;if(lx<x-12||lx>x+vw+12||ly<y-10||ly>y+vh+10)continue;
  const on=powered&&(powerAt===0||elapsed>i*.075);ctx.fillStyle=on?'#8aa89d':'#a8b3b8';ctx.fillRect(lx,ly,24,3);
  if(on&&!low&&intensity>0){ctx.fillStyle='#7db39a0c';ctx.fillRect(lx-6,ly-10,36,18)}
 }
 if(low||o.reduced||intensity<=0)return;
 // Fixed budgets: 24 rain strokes, 8 dust motes and four drifting steam puffs.
 ctx.save();ctx.strokeStyle='#627e8b16';ctx.lineWidth=.8;
 const weather=n.id==='gate'||n.id==='extract'||n.id==='defense';
 if(weather){const count=Math.ceil(24*intensity);for(let i=0;i<count;i++){const rx=x+(i*157.17+t*28)%Math.max(1,vw),ry=y+(i*91.71+t*106)%Math.max(1,vh);ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx-2,ry+8);ctx.stroke()}}
 ctx.fillStyle='#607c8b22';for(let i=0;i<Math.ceil(8*intensity);i++){const dx=x+(i*97.9+t*4)%Math.max(1,vw),dy=y+(i*47.1+Math.sin(t*.4+i)*9+vh)%Math.max(1,vh);ctx.fillRect(dx,dy,1,1)}
 if(powered&&powerAt>0&&elapsed<2.8){const sw=world.find(item=>item.kind==='switch');if(sw){const age=elapsed/2.8;ctx.fillStyle='rgba(181,199,205,'+((1-age)*.2*intensity)+')';for(let j=0;j<3;j++){ctx.beginPath();ctx.ellipse(sw.x-10-age*20+j*8,sw.y+sw.h-age*24-j*3,8+age*12,3+age*4,-.2,0,Math.PI*2);ctx.fill()}}}
 const steamY=h*.79;for(let i=0;i<4;i++){const sx=120+i*(w-220)/3,age=(t*.35+i*.27)%1,sy=steamY-age*20;if(sx<x-40||sx>x+vw+40||sy<y-40||sy>y+vh+40)continue;ctx.fillStyle='rgba(191,204,211,'+((1-age)*.1*intensity)+')';ctx.beginPath();ctx.ellipse(sx+Math.sin(t*.4+i)*8,sy,12+age*18,3+age*5,0,0,Math.PI*2);ctx.fill()}
 ctx.restore();
}
function machine(ctx,item,t,reduced){
 const {x,y,w,h,kind}=item,done=item.done,ratio=cap(item.hp/item.max,0,1),powered=powerAt>=0;
 if(done&&kind==='cover'){
  ctx.fillStyle='#8797a02c';ctx.fillRect(x+2,y+h-5,w-4,4);ctx.fillStyle='#aebac2';
  for(let i=0;i<4;i++)ctx.fillRect(x+5+i*(w-12)/4,y+h-7+i%2*3,5,3);return;
 }
 // Ground contact, side extrusion and top bevel share the same lighting direction.
 ctx.fillStyle='#182d4018';ctx.beginPath();ctx.ellipse(x+w/2+3,y+h+4,w*.64,5,0,0,Math.PI*2);ctx.fill();
 if(kind==='door'&&done){const opening=reduced||powerAt<=0?1:cap((t-powerAt)/.55,0,1);if(opening<1){ctx.fillStyle='#466271';const remaining=h*.5*(1-opening);ctx.fillRect(x+3,y+2,w-6,remaining);ctx.fillRect(x+3,y+h-remaining-2,w-6,remaining)}ctx.strokeStyle='#6d9a85';ctx.lineWidth=1;ctx.strokeRect(x,y,w,h);ctx.fillStyle='#cadad4';ctx.fillRect(x+2,y+2,3,h-4);ctx.fillRect(x+w-5,y+2,3,h-4);ctx.fillStyle='#527b65';ctx.fillText('OPEN',x+w/2,y+h+13);return}
 const casing=kind==='generator'?'#d4c8b4':kind==='extract'?'#d7e8df':'#d0dbe0',edge=kind==='generator'?'#8f7953':'#5e7888';
 ctx.fillStyle='#93a5af';ctx.fillRect(x+3,y+4,w,h);ctx.fillStyle=casing;ctx.fillRect(x,y,w,h);ctx.strokeStyle=edge;ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,w-1,h-1);
 ctx.fillStyle='#ffffffb0';ctx.fillRect(x+2,y+2,w-4,2);ctx.fillStyle='#273d4820';ctx.fillRect(x+w-4,y+4,3,h-5);
 if(kind==='cover'){
  ctx.fillStyle='#3c596a';ctx.fillRect(x+4,y+5,w-8,h-10);ctx.fillStyle='#607c8d';ctx.fillRect(x+6,y+6,w-12,3);
  ctx.strokeStyle='#8ba1ac55';ctx.beginPath();ctx.moveTo(x+9,y+8);ctx.lineTo(x+w-10,y+h-8);ctx.stroke();
  ctx.fillStyle='#b8c6cb';for(const sx of[x+4,x+w-7]){ctx.fillRect(sx,y+4,2,2);ctx.fillRect(sx,y+h-6,2,2)}
  if(ratio<1){ctx.fillStyle='#f5f8f9';ctx.fillRect(x,y-7,w,4);ctx.fillStyle='#425f70';ctx.fillRect(x,y-7,w*ratio,4);ctx.strokeStyle='#203c4d';ctx.beginPath();ctx.moveTo(x+w*.3,y+5);ctx.lineTo(x+w*.5,y+h*.45);ctx.lineTo(x+w*.4,y+h-5);ctx.stroke()}
 }else if(kind==='door'){
  ctx.fillStyle='#466271';ctx.fillRect(x+4,y+4,w-8,h-8);ctx.strokeStyle='#a9b9bf';ctx.beginPath();ctx.moveTo(x+w/2,y+4);ctx.lineTo(x+w/2,y+h-4);ctx.stroke();
  ctx.fillStyle='#ab9464';for(let i=0;i<4;i++)ctx.fillRect(x+5,y+7+i*14,w-10,3);
 }else if(kind==='locker'){
  ctx.fillStyle=done?'#8ca39d':'#657f8c';ctx.fillRect(x+4,y+5,w-8,h-10);ctx.strokeStyle='#c3d4db';ctx.strokeRect(x+7,y+8,w-14,h-16);ctx.fillStyle='#d6c28d';ctx.fillRect(x+w/2-3,y+h/2-2,6,4);
  if(done){ctx.fillStyle='#344b57';ctx.fillRect(x+5,y+4,w-10,7)}
 }else if(kind==='generator'||kind==='relay'){
  ctx.fillStyle='#304b59';ctx.fillRect(x+6,y+6,w-12,h-12);ctx.fillStyle=done?'#a5b3b6':kind==='generator'?'#b79b64':relayWarning?'#b65b61':'#89aaac';ctx.fillRect(x+w*.37,y+8,w*.26,h-16);
  ctx.strokeStyle='#afc2c8';ctx.beginPath();for(let i=0;i<3;i++){ctx.moveTo(x+7,y+9+i*7);ctx.lineTo(x+w-7,y+9+i*7)}ctx.stroke();
  ctx.fillStyle='#f7fafb';ctx.fillRect(x-2,y-8,w+4,4);ctx.fillStyle=relayWarning?'#b65b61':edge;ctx.fillRect(x-1,y-7,(w+2)*(kind==='relay'?relayHP/10:ratio),2);
  if(kind==='relay'&&relayWarning){ctx.strokeStyle='#ba626b';ctx.beginPath();ctx.arc(x+w/2,y+h/2,85,0,Math.PI*2);ctx.stroke()}
  if(done){ctx.strokeStyle='#647680';ctx.beginPath();ctx.moveTo(x+9,y+8);ctx.lineTo(x+w-9,y+h-8);ctx.moveTo(x+w-10,y+8);ctx.lineTo(x+10,y+h-8);ctx.stroke()}
 }else if(kind==='extract'){
  ctx.strokeStyle='#669580';ctx.lineWidth=2;ctx.strokeRect(x+6,y+6,w-12,h-12);ctx.fillStyle='#4f7b68';ctx.beginPath();ctx.moveTo(x+w/2,y+10);ctx.lineTo(x+w/2+8,y+h/2+3);ctx.lineTo(x+w/2-8,y+h/2+3);ctx.closePath();ctx.fill();
  if(!reduced){ctx.globalAlpha=.25+.12*Math.sin(t*2);ctx.strokeRect(x-4,y-4,w+8,h+8);ctx.globalAlpha=1}
 }else{
  ctx.fillStyle='#34515f';ctx.fillRect(x+5,y+5,w-10,h-11);ctx.fillStyle=done||powered?'#91b4a4':'#c6b786';ctx.fillRect(x+8,y+8,w-16,h-17);
  ctx.fillStyle='#78919d';ctx.fillRect(x+7,y+h-5,w-14,2);
 }
 if(kind!=='cover'&&kind!=='door'){
  ctx.fillStyle='#385360';ctx.fillText(done?'✓':({switch:'POWER',terminal:'INTEL',locker:'SUPPLY',extract:'EXTRACT',relay:'RELAY',generator:'DEPOT'}[kind]||''),x+w/2,y+h+16);
 }
}
function draw(ctx,o={}){
 if(!active()||!lastState)return;const n=node(),x0=o.cameraX||0,y0=o.cameraY||0,vw=o.viewW||1200,vh=o.viewH||800;
 ctx.save();scene(ctx,o,n);ctx.font='10px "NN Chakra",sans-serif';ctx.textAlign='center';
 for(const item of world){if(item.x+item.w<x0-90||item.x>x0+vw+90||item.y+item.h<y0-90||item.y>y0+vh+90)continue;machine(ctx,item,finite(run.stats.seconds),o.reduced)}
 // Interaction emphasis appears only beside the currently usable object.
 const target=lastState.player&&nearby(lastState.player);if(target){ctx.strokeStyle='#849b9f';ctx.lineWidth=1;ctx.setLineDash([3,3]);ctx.strokeRect(target.x-4,target.y-4,target.w+8,target.h+8);ctx.setLineDash([]);if(hold>0){ctx.fillStyle='#e8eeec';ctx.fillRect(target.x,target.y-12,target.w,3);ctx.fillStyle='#527c68';ctx.fillRect(target.x,target.y-12,target.w*cap(hold/1.2,0,1),3)}}
 ctx.restore();
}

function render(){if(!panel||!run)return;const heading=panel.querySelector('h2'),copy=panel.querySelector('.ns-copy'),map=panel.querySelector('.ns-map'),actions=panel.querySelector('.ns-actions');map.replaceChildren();actions.replaceChildren();heading.textContent=run.phase==='results'?(run.success?'RELAY YARD · EXTRACTED':'RELAY YARD · RUN ENDED'):'SECTOR RUN · RELAY YARD';copy.textContent=run.phase==='results'?(run.reason||'Expedition complete')+' · '+run.stats.kills+' defeats · '+Math.floor(run.stats.seconds/60)+'m · '+run.reward+' scrap '+(run.rewardIssued?'banked':'pending'):'Branching industrial expedition · target 15–25 minutes · checkpoint between encounters. Choose your route; later fights reflect your decisions.';
 for(let stage=0;stage<stages.length;stage++){const row=document.createElement('div');row.className='ns-row';for(const id of stages[stage]){const n=nodes[id],b=document.createElement('button');b.type='button';const completed=run.completed.includes(id),available=run.phase==='map'&&stage===run.stage;b.className='btn ns-node'+(completed?' ns-completed':'');b.disabled=!available;b.setAttribute('aria-label',n.title+(completed?' completed':available?' available':' locked'));const title=document.createElement('strong'),desc=document.createElement('span'),effect=document.createElement('small');title.textContent=(completed?'✓ ':'')+n.title;desc.textContent=n.description;effect.textContent=n.faction+' · '+n.effect;b.append(title,desc,effect);b.onclick=()=>beginEncounter(id);row.append(b)}map.append(row)}
 const add=(text,fn)=>{const b=document.createElement('button');b.type='button';b.className='btn';b.textContent=text;b.onclick=fn;b.disabled=granting||settling;actions.append(b)};
 if(run.phase==='results'&&!run.rewardIssued)add('Retry banking reward',()=>grantReward());add('New expedition',begin);add(run.phase==='map'?'Save & Return to Menu':'Return to Menu',leave);
 const prep=panel.querySelector('.ns-prep');prep.textContent=run.flags.sabotage?'BOSS PREPARATION · Depot disabled: Warden bombardment removed.':run.flags.comms?'BOSS PREPARATION · Communications restored: supply route revealed.':'Starting loadout: current starter equipment. Scrap and upgrades persist through this expedition.';
}
function init(options){bridge=options;if(typeof document==='undefined')return;const root=document.getElementById('word-blaster');const style=document.createElement('style');style.textContent='#word-blaster .ns-overlay{position:fixed;inset:0;z-index:14000;background:#eff4f7;display:flex;flex-direction:column;padding:clamp(12px,3vw,30px);gap:14px;overflow:auto}#word-blaster .ns-overlay[hidden]{display:none}#word-blaster .ns-overlay h2{font-size:clamp(20px,3vw,32px);margin:0}.ns-copy,.ns-prep{max-width:1000px;margin:0;font:13px/1.6 Segoe UI,sans-serif}.ns-map{display:grid;gap:10px;width:min(1100px,100%);margin:0 auto}.ns-row{display:flex;justify-content:center;gap:12px}.ns-node{flex:1;max-width:520px;display:flex!important;flex-direction:column;align-items:flex-start!important;gap:6px;text-align:left!important;padding:12px!important}.ns-node span{font:12px/1.5 Segoe UI,sans-serif}.ns-node small{font-size:11px;color:#637c8c}#word-blaster .ns-node:disabled{opacity:.55}#word-blaster .ns-node.ns-completed:disabled{opacity:.82;border-color:#628879;filter:none}.ns-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}.ns-prep{padding:10px;border-left:3px solid #ac8d52;background:#e6edf2}#word-blaster #ns-interact{position:absolute;z-index:1;left:0;right:0;margin-inline:auto;width:max-content;bottom:10px;max-width:calc(100% - 30px);min-height:36px;touch-action:none}#ns-status{font:11px "NN Chakra",sans-serif;max-width:100%;overflow-wrap:anywhere}@media(max-width:600px){.ns-row{flex-direction:column}.ns-node{max-width:none}}';root.append(style);panel=document.createElement('section');panel.className='ns-overlay';if(panel)panel.hidden=true;panel.role='dialog';panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','ns-title');panel.innerHTML='<h2 id="ns-title"></h2><p class="ns-copy"></p><p class="ns-prep"></p><div class="ns-map"></div><div class="ns-actions"></div>';root.append(panel);button=document.createElement('button');button.className='btn';button.textContent='Sector Run · Relay Yard';button.id='ns-open';button.onclick=open;document.querySelector('#wb-menu .menu-actions').append(button);status=document.createElement('p');status.id='ns-status';status.hidden=false;document.getElementById('wb-game').append(status);const interactButton=document.createElement('button');interactButton.className='btn';interactButton.textContent='Interact · Hold E';interactButton.id='ns-interact';interactButton.hidden=true;interactControl=interactButton;const timer={id:0};const stopHold=()=>{clearInterval(timer.id);timer.id=0;hold=0;holdId=''};interactButton.onpointerdown=e=>{e.preventDefault();try{interactButton.setPointerCapture?.(e.pointerId)}catch{}if(!active())return;interact(lastState?.player,.1);timer.id=setInterval(()=>interact(lastState?.player,.1),100)};interactButton.onpointerup=stopHold;interactButton.onpointercancel=stopHold;interactButton.onpointerleave=stopHold;(document.getElementById('wb-stage')||document.getElementById('wb-game')).append(interactButton);interactButton.onlostpointercapture=stopHold;window.addEventListener('blur',stopHold);window.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Escape')stopHold()},true);const observer=new MutationObserver(()=>{interactButton.hidden=!active()||!lastState?.player||!nearby(lastState.player);status.hidden=!active();if(!active())stopHold()});observer.observe(panel,{attributes:true,attributeFilter:['hidden']});panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();leave()}});run=readCheckpoint();}
window.NeonSectorCore={fresh,valid,nextOptions,transition,complete,nodes,stages};window.NeonSector={init,open,begin,resume,choose:beginEncounter,active,current:()=>run?clone(run):null,hud:()=>{const n=node();return n?{title:n.title,stage:run.stage+1,total:stages.length,description:n.description,kind:n.kind,nodeKind:n.kind,remaining,spawned,active:activeEnemies,relayHP}:null},tick,enemyKilled,bossDefeated,playerDied,onRestart,stop,draw,projectileHit,resolveMovement,interact,safeSpawn,finishNode,presentation:()=>({area:node()?.id||null,powered:powerAt>=0,combat:activeEnemies>0,boss:node()?.kind==='boss',cacheEntries:sceneCache.size,sceneBuilds,clock:finite(run?.stats?.seconds),interactVisible:!!interactControl&&!interactControl.hidden}),stats:()=>({remaining,spawned,kills,objects:world.length,revision,hold,relayHP,bossRequested,objects:world.map(o=>({...o}))}),storageKey:KEY};
})();


