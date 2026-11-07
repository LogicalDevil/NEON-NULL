/* Arsenal Relay encounter director and briefing. Native combat is supplied by the bridge. */
(() => {
'use strict';
const locations = [
  {id:'spectrum', title:'Prism Array', boss:'Prism Regent', theme:'archive', color:'#42d9dc', enemy:['drone','ranger','orb','blink-stalker','weaver'], elite:'blink-stalker', hazard:'Security beam', attacks:['aimed','lanes','shards','dataBurst','charge','cross'], removed:'lanes', suppression:'Prism sweep disabled'},
  {id:'blackpowder', title:'Ironwake Battery', boss:'Ironwake Marshal', theme:'relay', color:'#e5aa6b', enemy:['ranger','brute','bomber','shield-carrier','mine-layer'], elite:'brute', hazard:'Artillery strike', attacks:['bombard','fan','summon','charge','cross','bombard'], removed:'bombard', suppression:'Artillery battery disabled'},
  {id:'frontier', title:'Red Mesa Exchange', boss:'Red Mesa Railguard', theme:'relay', color:'#f3bb79', enemy:['sprinter','ranger','dasher','charger','stalker'], elite:'ranger', hazard:'Rail crossing', attacks:['aimed','cross','charge','lanes','fan','summon'], removed:'cross', suppression:'Crossfire rail disabled'},
  {id:'brassworks', title:'The Pressureworks', boss:'Pressureworks Foreman', theme:'breach', color:'#e6c36e', enemy:['shield-carrier','support-drone','brute','mine-layer','charger'], elite:'shield-carrier', hazard:'Steam purge', attacks:['grid','spiral','shockwave','summon','charge','bombard'], removed:'grid', suppression:'Pressure lanes disabled'}
];
const roles = [
  {id:'repair', title:'Repair Depot', objective:'Clear the depot and recover 3 hull, ammunition, and 12 scrap. The boss keeps its complete attack pattern.'},
  {id:'convoy', title:'Convoy Raid', objective:'Defeat the escort and approach the freight cache. Choose one foreign item to replace its matching slot for this run.'},
  {id:'sabotage', title:'Sabotage', objective:'Break the defensive line and hold position at a relay terminal to disable a named boss attack.'}
];
const stageBatches = [4,5,4], batchCounts = [5,6,7,8], labels=['Primary','Secondary','Melee','Utility'];
const skills={default:{id:'standard-clear',target:25,description:'Defeat 25 enemies'},spectrum:{id:'rail-line',target:3,description:'Pierce at least two enemies with one rail shot three times'},blackpowder:{id:'bayonet-counter',target:3,description:'Interrupt three windups with the Infantry Bayonet'},frontier:{id:'marked-defeat',target:10,description:'Defeat ten enemies marked by Signal Flare'},brassworks:{id:'sentry-hit',target:20,description:'Land twenty Clockwork Sentry hits'}};
const version='AR1';
const clone = value => JSON.parse(JSON.stringify(value));
const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
const hash = value => {
  let out = 2166136261;
  for(const char of value) out = Math.imul(out ^ char.charCodeAt(0),16777619);
  return out >>> 0;
};
function plan(seed, faction) {
  let state=hash(String(seed))||1;
  const random=()=>{state ^= state << 13; state ^= state >>> 17; state ^= state << 5;return (state>>>0)/4294967296};
  const origin=locations.find(location=>location.id===faction)||locations[Math.floor(random()*locations.length)];
  const options=locations.filter(location=>location!==origin);
  for(let i=options.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[options[i],options[j]]=[options[j],options[i]]}
  const routes=roles.map((role,index)=>({...role,location:options[index].id}));
  const encounters={};
  for(const location of locations){
    encounters[location.id]=stageBatches.map((total,stage)=>Array.from({length:total},(_,batch)=>{
      const count=batchCounts[stage]+(batch===total-1?2:0)+Math.floor(random()*2);
      return Array.from({length:count},(_,n)=>({type:location.enemy[(n+Math.floor(random()*location.enemy.length))%location.enemy.length],angle:n/count*Math.PI*2+random()*.55,roll:Math.floor(random()*4294967296),elite:false}));
    }));
  }
  return {origin:origin.id,routes,encounters};
}
const contract = (now=Date.now()) => (Math.floor(now/604800000)>>>0).toString(36).toUpperCase();
function decode(value){
  const m=/^AR1-([0-9A-Z]{1,7})-([DSIFB])(?:-([RCS]))?$/i.exec(String(value).trim());
  if(!m)return null;
  return {seed:m[1].toUpperCase(),faction:({D:'default',S:'spectrum',I:'blackpowder',F:'frontier',B:'brassworks'})[m[2].toUpperCase()],route:({R:'repair',C:'convoy',S:'sabotage'})[m[3]?.toUpperCase()]||null};
}
function codeFor(run){
  const faction=({default:'D',spectrum:'S',blackpowder:'I',frontier:'F',brassworks:'B'})[run.faction];
  const route=({repair:'R',convoy:'C',sabotage:'S'})[run.route?.id||run.routePreset];
  return `${version}-${run.seed}-${faction}${route?'-'+route:''}`;
}
let bridge,panel,run,previousFocus;
const locationFor = id => locations.find(location=>location.id===id);
const active = () => !!run && !['results','briefing'].includes(run.phase);
const presentation = () => active()?{faction:run.location,boss:['boss','boss-ready','practice'].includes(run.phase),phase:run.phase,combat:['combat','boss','trial','practice'].includes(run.phase),warning:!!run.hazard&&run.hazard.life>run.hazard.warn*.36}:null;
const foreign = () => active()?run.foreign:null;
const isLoaned=(slot,index)=>active()&&(run.starter[slot]===index||(run.foreign?.slot===slot&&run.foreign.index===index));
function stop(){run=null;if(panel)panel.hidden=true;}
function describeBoss(){
  if(!active()||!['boss','boss-ready','practice'].includes(run.phase))return null;
  const loc=locationFor(run.location);
  return {...loc,suppressed:run.sabotaged?loc.removed:null,attacks:loc.attacks.filter(attack=>!run.sabotaged||attack!==loc.removed)};
}
function begin(faction,seed,routePreset=null,mode='relay',practiceLocation=null){
  const selected=window.NeonArsenal?.factions?.find(f=>f.id===faction);
  if(!selected||!Array.isArray(selected.starter)||selected.starter.length!==4)return false;
  const layout=plan(seed,faction);
  run={id:globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`,seed,faction,routePreset,mode,layout,starter:[...selected.starter],foreign:null,location:practiceLocation||layout.origin,phase:'combat',stage:0,batch:0,delay:2.4,elapsed:0,clock:0,kills:0,skill:0,eliteSpawned:false,bossDefeated:false,sabotaged:false,score:0,objective:null,hazard:null,nextHazard:15};
  if(mode==='trial'){run.phase='trial';run.objective={kind:'trial',message:'Try your four loaner items. Choose Next Trial to switch faction.'};}
  if(mode==='practice')run.phase='practice';
  if(bridge.start(run)===false){stop();return false;}
  if(mode==='trial')bridge.spawn({type:'brute',angle:1,elite:false,training:true});
  if(mode==='practice'&&!bridge.startBoss(describeBoss())){finish(false,'The boss entrance failed.');return false;}
  if(panel)panel.hidden=true;
  bridge.notify(mode==='trial'?'FACTION TRIAL · Practice with free loaner equipment.':`${locationFor(run.location).title} · ${mode==='practice'?'BOSS PRACTICE':'ARSENAL RELAY DEPLOYED'}`);
  return true;
}
function setupStage(stage){
  run.stage=stage;run.batch=0;run.delay=2.6;run.phase='combat';run.nextHazard=run.clock+12;run.hazard=null;run.eliteSpawned=false;run.objective=null;
  bridge.clearThreats();
  bridge.setWave(stage+1);
  bridge.pause(false);
  if(panel)panel.hidden=true;
}
function chooseRoute(routeId){
  if(run?.phase!=='route')return false;
  const route=run.layout.routes.find(candidate=>candidate.id===routeId);
  if(!route)return false;
  run.route=route;run.location=route.location;
  setupStage(1);
  const loc=locationFor(route.location);
  bridge.notify(`${loc.title} · ${route.title.toUpperCase()}`);
  return true;
}
function equipForeign(slot,choice){
  if(run?.phase!=='salvage'||run.foreign||!Number.isInteger(slot)||slot<0||slot>3)return false;
  const faction=window.NeonArsenal?.factions?.find(f=>f.id===run.location);
  const index=Number.isInteger(choice)?choice:faction?.starter?.[slot];
  if(!Number.isInteger(index)||!window.NeonArsenal.groups[slot]?.some(item=>item.index===index&&item.faction===run.location))return false;
  run.foreign={slot,index};
  if(!bridge.equip(slot,index)){run.foreign=null;return false;}
  setupStage(2);
  bridge.notify(`SALVAGED ${bridge.itemName(slot,index)} · Replaces your ${labels[slot].toLowerCase()} this run`);
  return true;
}
function finish(success,reason){
  if(!active())return false;
  const target=run;
  run.phase='results';run.hazard=null;run.result={success,reason,...bridge.stats()};
  if(target.mode==='relay')run.achievement=bridge.settle({id:target.id,faction:target.faction,success,seconds:target.elapsed,kills:target.kills,boss:target.bossDefeated,route:target.route?.id,skill:target.skill,goal:skills[target.faction]});
  bridge.finish();
  show();
  return true;
}
const playerDied=reason=>finish(false,reason||'Hull depleted');
function enemyKilled(enemy){
  if(!active()||run.mode==='trial')return;
  run.kills++;
  mastery('standard-clear');
  if(enemy.arsenalMark>0)mastery('marked-defeat');
  if(enemy.type.id==='signal-core')run.bossDefeated=true;
}
function mastery(action,count=1){
  if(!active()||run.mode!=='relay'||skills[run.faction].id!==action||!Number.isFinite(count)||count<1)return false;
  const before=run.skill;
  run.skill=Math.min(skills[run.faction].target,run.skill+(action==='rail-line'?1:Math.floor(count)));
  if(before!==run.skill&&run.skill===skills[run.faction].target)bridge.notify('FACTION CHALLENGE COMPLETE · Finish or extract to record progress');
  return before!==run.skill;
}
function readyObjective(kind,state){
  const width=state.viewW,height=state.viewH;
  const left=state.cameraX+width*.20,right=state.cameraX+width*.80;
  run.objective={kind,x:state.player.x<(left+right)/2?right:left,y:clamp(state.player.y-55,state.cameraY+height*.25,state.cameraY+height*.74),origin:left,range:right-left,progress:0,radius:kind==='extract'?38:34,started:run.clock};
  bridge.notify(kind==='extract'?'EXTRACTION READY · Move into the marked gate.':kind==='terminal'?'TERMINAL READY · Stand in the marked ring to disable the boss attack.':'FREIGHT CACHE · Intercept the moving supply cart.');
}
function updateObjective(dt,state){
  const o=run.objective;
  if(o.kind==='convoy')o.x=o.origin+o.range*(.5+.5*Math.cos((run.clock-o.started)*.65));
  const near=Math.hypot(state.player.x-o.x,state.player.y-o.y)<o.radius;
  if(o.kind==='extract'&&near){finish(true,`${locationFor(run.location).boss} defeated. Extraction confirmed.`);return;}
  if(o.kind==='terminal'){
    o.progress=near?o.progress+dt:Math.max(0,o.progress-dt*.7);
    if(o.progress>=2.2){run.sabotaged=true;setupStage(2);bridge.resupply({heal:1,scrap:18,ammo:true});bridge.notify(locationFor(run.location).suppression.toUpperCase());}
  }else if(o.kind==='convoy'&&near){
    run.phase='salvage';run.objective=null;bridge.clearThreats();bridge.pause(true);show();
  }
}
function updateHazard(dt,state){
  if(run.phase!=='combat')return;
  if(!run.hazard&&run.clock>=run.nextHazard&&state.enemies.length){
    const loc=locationFor(run.location);
    run.hazard={kind:loc.id,label:loc.hazard,x:clamp(state.player.x,state.cameraX+34,state.cameraX+state.viewW-34),y:clamp(state.player.y,state.cameraY+34,state.cameraY+state.viewH-34),left:state.cameraX,top:state.cameraY,w:state.viewW,h:state.viewH,life:loc.id==='blackpowder'?2.15:2.25,warn:1.55,hit:false};
    bridge.notify(loc.hazard.toUpperCase()+' · Leave the marked area');
  }
  const hz=run.hazard;
  if(!hz)return;
  hz.life-=dt;
  const radius=hz.kind==='blackpowder'?58:hz.kind==='frontier'?24:35;
  hz.radius=radius;
  const {x,y}=state.player;
  const hit=hz.kind==='blackpowder'?Math.hypot(x-hz.x,y-hz.y)<radius:hz.kind==='spectrum'?Math.abs(x-hz.x)<radius&&y>=hz.top&&y<=hz.top+hz.h:Math.abs(y-hz.y)<radius&&x>=hz.left&&x<=hz.left+hz.w;
  if(hz.life<=hz.warn*.36&&!hz.hit&&hit){hz.hit=true;bridge.damage(hz.label,1);}
  if(hz.life<=0){run.hazard=null;run.nextHazard=run.clock+13+(run.batch%3);}
}
function tick(dt,state){
  if(!active()||state.paused||!state.playing||dt<=0)return;
  run.clock+=dt;run.elapsed+=dt;
  if(run.phase==='practice'){if(run.bossDefeated)finish(true,`${locationFor(run.location).boss} practice completed.`);return;}
  if(run.phase==='trial'){
    if(state.enemies.length)run.delay=1.25;
    else if((run.delay-=dt)<=0){bridge.spawn({type:'brute',angle:1,elite:false,training:true});run.delay=1.25;}
    return;
  }
  if(run.phase==='boss'&&run.bossDefeated){
    run.phase='extract';bridge.clearThreats();readyObjective('extract',state);return;
  }
  if(run.phase==='boss-ready'){
    run.delay-=dt;
    if(run.delay<=0){if(bridge.startBoss(describeBoss()))run.phase='boss';else finish(false,'Boss arrival was interrupted.');}
    return;
  }
  if(run.objective){updateObjective(dt,state);return;}
  if(run.phase!=='combat')return;
  updateHazard(dt,state);
  if(!active()||state.enemies.length)return;
  run.hazard=null;
  const roster=run.layout.encounters[run.location][run.stage];
  if(run.batch>=roster.length){
    if(run.stage===0){
      run.phase='route';
      if(run.routePreset&&chooseRoute(run.routePreset))return;
      bridge.clearThreats();bridge.pause(true);show();return;
    }
    if(run.stage===1&&!run.eliteSpawned){
      run.eliteSpawned=true;bridge.spawn({type:locationFor(run.location).elite,angle:-Math.PI*.5,roll:hash(run.seed+run.location),elite:true});bridge.notify('ELITE ENCOUNTER · Break the reinforced guard');return;
    }
    if(run.stage===1){
      if(run.route.id==='repair'){bridge.resupply({heal:3,ammo:true,scrap:12});setupStage(2);bridge.notify('DEPOT SECURED · +3 hull, ammunition, +12 scrap');}
      else readyObjective(run.route.id==='sabotage'?'terminal':'convoy',state);
      return;
    }
    run.phase='boss-ready';run.delay=3;bridge.clearThreats();bridge.resupply({ammo:true,heal:1});bridge.notify('APPROACH SECURED · Boss inbound · Ammo and 1 hull restored');return;
  }
  const previous=run.delay;
  run.delay-=dt;
  if(previous>1.3&&run.delay<=1.3)bridge.notify('INCOMING · '+locationFor(run.location).title+' · Prepare for a new attack group');
  if(run.delay>0)return;
  roster[run.batch++].forEach(bridge.spawn);
  run.delay=run.batch===roster.length?3:5.5+run.stage;
  bridge.notify(`${locationFor(run.location).title} · Attack group ${run.batch}/${roster.length}`);
}
function drawArena(ctx,options){
  if(!active())return false;
  return window.NeonArsenalArt?.drawArena?.(ctx,{...options,x:options.cameraX,y:options.cameraY,faction:run.location})===true;
}
function drawBoss(ctx,enemy,options){
  if(!active()||enemy.type.id!=='signal-core')return false;
  return window.NeonArsenalArt?.drawBoss?.(ctx,enemy,{...options,faction:run.location})===true;
}
function drawWarnings(ctx,{cameraX,cameraY}){
  if(!active())return;
  ctx.save();ctx.translate(-cameraX,-cameraY);
  const hz=run.hazard;
  if(hz){
    const live=hz.life<=hz.warn*.36,radius=hz.radius||32;
    ctx.fillStyle=live?'#f94f327c':'#b3333638';ctx.strokeStyle=live?'#ffeddc':'#a32129';ctx.lineWidth=2;ctx.setLineDash(live?[]:[7,5]);
    ctx.beginPath();
    if(hz.kind==='blackpowder')ctx.arc(hz.x,hz.y,radius,0,2*Math.PI);
    else if(hz.kind==='spectrum')ctx.rect(hz.x-radius,hz.top,radius*2,hz.h);
    else ctx.rect(hz.left,hz.y-radius,hz.w,radius*2);
    ctx.fill();ctx.stroke();ctx.setLineDash([]);
    ctx.font='bold 10px monospace';ctx.textAlign='center';ctx.fillStyle='#57181d';ctx.fillText(live?hz.label.toUpperCase():'MOVE · '+hz.label.toUpperCase(),hz.x,hz.y-4);
  }
  if(run.objective&&run.objective.kind!=='trial'){
    const o=run.objective,label=o.kind==='extract'?'EXTRACTION':o.kind==='terminal'?'SABOTAGE TERMINAL':'FREIGHT CACHE';
    ctx.strokeStyle='#185d52';ctx.lineWidth=3;ctx.fillStyle='#8dd7aa59';ctx.beginPath();ctx.arc(o.x,o.y,o.radius,0,2*Math.PI);ctx.fill();ctx.stroke();
    ctx.fillStyle='#17372d';ctx.fillRect(o.x-10,o.y-9,20,18);ctx.fillStyle='#d6fff0';ctx.fillRect(o.x-5,o.y-4,10,8);
    ctx.font='bold 11px monospace';ctx.textAlign='center';ctx.fillStyle='#17372d';ctx.fillText(label,o.x,o.y-o.radius-5);
    if(o.kind==='terminal'){ctx.fillStyle='#4e8d7b';ctx.fillRect(o.x-26,o.y+16,52,4);ctx.fillStyle='#d6fff0';ctx.fillRect(o.x-26,o.y+16,52*clamp(o.progress/2.2,0,1),4);}
  }
  ctx.restore();
}
function hud(){
  if(!active())return null;
  const loc=locationFor(run.location),phase=run.phase;
  const goal=run.objective?.kind==='terminal'?'Occupy the sabotage terminal':run.objective?.kind==='convoy'?'Intercept the freight cache':phase==='extract'?'Move to the extraction ring':phase==='boss'||phase==='practice'?`Defeat ${loc.boss}`:phase==='boss-ready'?`${loc.boss} inbound`:phase==='trial'?'Test this faction’s starter loadout':`Stage ${run.stage+1}/3 · Group ${run.batch}/${stageBatches[run.stage]}`;
  return {title:loc.title,goal,boss:loc.boss,time:Math.floor(run.clock),foreign:run.foreign,phase};
}
const make=(tag,text,className)=>{const node=document.createElement(tag);if(text)node.textContent=text;if(className)node.className=className;return node;};
const button=(name,fn,primary=false)=>{const el=make('button',name,'btn'+(primary?' btn-primary':''));el.type='button';el.onclick=fn;return el;};
function close(){
  if(!panel)return;
  if(active()&&['route','salvage'].includes(run.phase)){bridge.notify('Choose a route or return to the main menu.');return;}
  if(run?.phase==='results'){bridge.onMenu();return;}
  panel.hidden=true;previousFocus?.focus?.();
}
function render(){
  if(!panel)return;
  const title=panel.querySelector('h2'),copy=panel.querySelector('.nar-copy'),grid=panel.querySelector('.nar-grid'),actions=panel.querySelector('.nar-actions');
  grid.replaceChildren();actions.replaceChildren();
  const addCard=(name,body,action,details='')=>{const card=make('article',null,'nar-card');card.append(make('h3',name),make('p',body));if(details)card.append(make('small',details));if(action)card.append(action);grid.append(card);};
  if(run?.phase==='route'){
    title.textContent='CHOOSE A ROUTE';copy.textContent='The breach is clear. Pick the risk and reward for the next leg.';
    for(const route of run.layout.routes){const loc=locationFor(route.location);addCard(route.title,route.objective,button(`Travel to ${loc.title}`,()=>chooseRoute(route.id),route.id===run.routePreset),`${loc.hazard} · Boss ${loc.boss}${route.id==='sabotage'?' · '+loc.suppression:''}`);}
    actions.append(button('Abandon Run',bridge.onMenu));return;
  }
  if(run?.phase==='salvage'){
    const faction=window.NeonArsenal.factions.find(f=>f.id===run.location);
    title.textContent='SELECT SALVAGE';copy.textContent='Recover one item. It replaces the matching equipment slot for this run.';
    window.NeonArsenal.groups.forEach((group,slot)=>group.filter(item=>item.faction===faction.id).forEach(item=>{
      addCard(item.name,item.desc,button('Recover '+labels[slot],()=>equipForeign(slot,item.index)),labels[slot]);
    }));
    actions.append(button('Keep My Loadout',()=>setupStage(2)),button('Abandon Run',bridge.onMenu));return;
  }
  if(run?.phase==='results'){
    const loc=locationFor(run.location),r=run.result;
    title.textContent=r.success?(run.mode==='practice'?'BOSS PRACTICE COMPLETE':'RELAY EXTRACTED'):'RELAY RUN ENDED';
    copy.textContent=r.reason;
    addCard('Run record',`${run.kills} defeats · ${r.score||0} score · ${Math.floor(run.elapsed/60)}m ${Math.floor(run.elapsed%60)}s`,null,`Route ${run.route?.title||'Opening breach'} · ${loc.title}`);
    addCard('Final loadout',(r.gear||[]).join(' · '),null,run.foreign?`Salvaged ${labels[run.foreign.slot].toLowerCase()}`:'Faction issue');
    if(run.achievement)addCard('Faction mastery',run.achievement);
    if(!r.success)addCard('Next attempt',run.route?'Keep moving until the attack warning clears, then use the recovery window. Try the depot route to recover hull.':'Use a secondary or melee item during your primary reload.');
    actions.append(button('Retry Route',()=>begin(run.faction,run.seed,run.route?.id||run.routePreset,run.mode,run.mode==='practice'?run.location:null),true));
    actions.append(button('Try a New Route',()=>{run=null;render()}));
    if(run.route||run.mode==='practice')actions.append(button('Practice This Boss',()=>begin(run.faction,run.seed,null,'practice',run.location)));
    if(run.mode==='relay')actions.append(button('Copy Challenge',event=>copyResult(event.currentTarget)));
    actions.append(button('Main Menu',bridge.onMenu));return;
  }
  title.textContent='ARSENAL RELAY';copy.textContent='Four eras have collided inside the relay network. Deploy with a free kit, choose a route, and extract with the build you make.';
  const featured=contract();
  const code=make('input',null,'form-control');code.placeholder='AR1-123-F-C';code.maxLength=16;code.setAttribute('aria-label','Arsenal Relay challenge code');
  const linked=new URLSearchParams(window.location.search).get('arsenal');if(decode(linked))code.value=linked;
  const challenge=()=>{const parsed=decode(code.value);if(!parsed){code.setCustomValidity('Enter an Arsenal Relay challenge code.');code.reportValidity();return;}begin(parsed.faction,parsed.seed,parsed.route);};
  code.oninput=()=>code.setCustomValidity('');code.onkeydown=e=>{if(e.key==='Enter')challenge();};
  for(const faction of window.NeonArsenal?.factions||[]){
    const card=make('article',null,'nar-card');card.style.setProperty('--nar-accent',faction.color||'#a5b6c9');
    card.append(make('h3',faction.name),make('p',faction.tagline||'The original NEON//NULL equipment.'),make('small',faction.starter.map((index,slot)=>bridge.itemName(slot,index)).join(' · ')),make('small',bridge.mastery?.(faction.id,skills[faction.id])));
    card.append(button('Deploy',()=>begin(faction.id,hash(String(Date.now())+faction.id).toString(36).toUpperCase()),true),button('Try Kit',()=>begin(faction.id,featured,null,'trial')));
    grid.append(card);
  }
  const featuredFaction=locations[parseInt(featured,36)%locations.length].id;
  actions.append(button('Featured Weekly Contract',()=>begin(featuredFaction,featured),true),code,button('Play Challenge',challenge),button('Back',close));
}
async function copyResult(control){
  const code=codeFor(run);
  const r=run.result,text=`NEON//NULL Arsenal Relay · ${run.route?.title||'Opening breach'} · ${run.faction} · ${(r.gear||[]).join(' / ')} · ${r.score||0} score · Challenge ${code}`;
  try{await navigator.clipboard.writeText(text);control.textContent='Copied '+code;}
  catch{const field=make('input',null,'form-control');field.value=text;field.readOnly=true;field.setAttribute('aria-label','Shareable run result');control.replaceWith(field);field.select();}
}
function show(){if(!panel)return;previousFocus=document.activeElement;panel.hidden=false;window.dispatchEvent(new CustomEvent('nn:menu-focus'));render();panel.querySelector('button')?.focus();}
function open(){if(active())return false;run=null;show();return true;}
function restart(){if(!active())return false;const info=run;return begin(info.faction,info.seed,info.route?.id||info.routePreset,info.mode,info.mode==='practice'?info.location:null);}
function trialNext(){if(run?.mode!=='trial')return false;const index=locations.findIndex(loc=>loc.id===run.faction);return begin(locations[(index+1)%locations.length].id,run.seed,null,'trial');}
function init(options){
  bridge=options;
  if(typeof document==='undefined')return;
  const root=options.root;
  const style=make('style');style.textContent=`#word-blaster .nar-overlay{position:fixed;inset:0;z-index:14050;overflow:auto;padding:clamp(14px,4vw,48px);background:#132332f5;color:#edf4f8;overscroll-behavior:contain}#word-blaster .nar-overlay[hidden]{display:none}#word-blaster .nar-shell{width:min(1120px,100%);margin:auto}#word-blaster .nar-shell h2{color:#f4f9fc;font-size:clamp(1.5rem,4vw,2.8rem);margin:0}#word-blaster .nar-copy{font-size:1rem;max-width:68ch;margin-block:8px 22px}#word-blaster .nar-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(230px,100%),1fr));gap:12px}#word-blaster .nar-card{display:flex;flex-direction:column;gap:9px;padding:14px;background:#23394a;border:1px solid #577084;border-top:3px solid var(--nar-accent,#a0aebc);border-radius:7px;min-width:0}#word-blaster .nar-card h3,#word-blaster .nar-card p{margin:0;color:#edf4f8}#word-blaster .nar-card small{color:#d5e1e8;line-height:1.45}#word-blaster .nar-card button{min-height:38px}#word-blaster .nar-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:18px}#word-blaster .nar-actions input{width:min(250px,100%)}#word-blaster .nar-actions input[readonly]{width:min(520px,100%)}#word-blaster #nar-open{border-left:4px solid #5aaea9}`;
  root.append(style);
  panel=make('section',null,'nar-overlay');panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','nar-title');panel.innerHTML='<div class="nar-shell"><h2 id="nar-title"></h2><p class="nar-copy"></p><div class="nar-grid"></div><div class="nar-actions"></div></div>';root.append(panel);
  const launcher=button('Play Arsenal Relay',open,true);launcher.id='nar-open';root.querySelector('#wb-menu .menu-actions').prepend(launcher);
  const next=button('Next Faction Trial',trialNext);next.id='nar-next-trial';next.hidden=true;root.querySelector('#wb-game .controls').append(next);
  panel.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Escape'){e.preventDefault();close();}if(e.key==='Tab'){const items=[...panel.querySelectorAll('button,input')],first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}});
}
window.NeonArsenalRelay={init,open,begin,restart,stop,active,foreign,isLoaned,presentation,tick,hud,enemyKilled,playerDied,drawArena,drawBoss,drawWarnings,describeBoss,chooseRoute,equipForeign,trialNext,mastery,current:()=>run?clone(run):null};
if(typeof module==='object')module.exports={plan,decode,contract,codeFor,locations,relay:window.NeonArsenalRelay};
})();
