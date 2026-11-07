/* Bound to the primary game closure by integrate-arsenal-relay.py. */
const arsenalRelay = window.NeonArsenalRelay;
const relayActive = () => arsenalRelay.active();
const relayMastery = faction => progression.arsenalRelay?.[faction];
const equipRelayLoaner = (slot,index) => {
  const item=categoryItems[slot]?.[index];
  if(!item)return false;
  item.cost=0;
  slotIndices[slot]=index;
  weapon=slotIndices[0];
  refreshWeaponButtons();
  hud();
  return true;
};
arsenalRelay.init({
  root,
  notify:say,
  onMenu:()=>returnToMenu(),
  mastery:(faction,goal)=>{
    const record=relayMastery(faction);
    return `${record?.badge?'Veteran badge earned':`Veteran badge · ${Math.min(2,record?.bosses||0)}/2 boss defeats · ${Math.min(1,record?.extracts||0)}/1 extraction`} · Specialist badge · ${goal.description} (${Math.min(goal.target,record?.skill||0)}/${goal.target})`;
  },
  itemName:(slot,index)=>categoryItems[slot]?.[index]?.name||'Equipment unavailable',
  start:run=>{
    if(!run.starter.every((index,slot)=>categoryItems[slot]?.[index]))return false;
    window.NeonSector.stop();
    menu.hidden=true;
    game.hidden=false;
    $('wb-briefing').hidden=true;
    missionId='relay';
    nnDeploymentFaction=run.faction;
    try{start(false,true,false);}finally{nnDeploymentFaction=null;}
    endlessMode=false;
    creativeMode=false;
    practiceMode=run.mode!=='relay';
    missionState='arsenal-relay';
    missionWaveBudget=spawnWarning=0;
    spawnGroup=[];
    relayObject=null;
    generators=[];
    activeRunId=run.id;
    window.NeonTrack.resetRun(activeRunId,practiceMode?'practice':'sector');
    $('nar-next-trial').hidden=run.mode!=='trial';
    $('wb-visual-cue').hidden=true;
    visualCueUntil=0;
    for(let slot=0;slot<run.starter.length;slot++)equipRelayLoaner(slot,run.starter[slot]);
    if(musicOn)startMusic();
    hud();
    return true;
  },
  equip:equipRelayLoaner,
  setWave:stage=>{wave=stage;hud();},
  pause:value=>{
    if(!playing)return;
    togglePause(value);
    pauseOverlay.hidden=true;
  },
  spawn:entry=>{
    const type=enemyKinds.find(t=>t.id===entry.type)||enemyKinds[0];
    const gap=Math.min(viewW,viewH)*.44;
    const left=cameraX+type.r+12, right=cameraX+viewW-type.r-12;
    const top=cameraY+type.r+12, bottom=cameraY+viewH-type.r-12;
    const clampX=x=>Math.max(left,Math.min(right,x)),clampY=y=>Math.max(top,Math.min(bottom,y));
    let x=clampX(player.x+Math.cos(entry.angle)*gap),y=clampY(player.y+Math.sin(entry.angle)*gap);
    if(Math.hypot(x-player.x,y-player.y)<Math.min(105,gap*.60)){
      x=player.x<(left+right)/2?right:left;
      y=player.y<(top+bottom)/2?bottom:top;
    }
    let seed=entry.roll||14583;
    const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;};
    const foe=spawnEnemy(type,entry.training?clampX(player.x+110):x,entry.training?clampY(player.y):y,random);
    if(!foe)return false;
    foe.targetsRelay=false;
    if(entry.elite){
      foe.rarity='elite';
      foe.hp=foe.max=Math.ceil(foe.max*1.72);
      foe.type.speed*=1.08;
    }
    if(entry.training){
      foe.type.speed=0;
      foe.fire=foe.charge=foe.bombCooldown=1000;
      foe.hp=foe.max=140;
    }
    return true;
  },
  startBoss:info=>{
    if(!info)return false;
    creativeMode=true;
    try{spawnMissionBoss(info.theme,true);}finally{creativeMode=false;missionState='arsenal-relay';}
    const boss=foes.find(foe=>foe.type.id==='signal-core');
    if(!boss)return false;
    boss.arsenalBoss=info.id;
    boss.arsenalAttacks=[...info.attacks];
    boss.arsenalSuppressed=info.suppressed;
    boss.homeX=boss.x;
    boss.homeY=boss.y;
    bossIntroName=info.boss.toUpperCase();
    $('wb-boss-intro-name').textContent=bossIntroName;
    $('wb-boss-intro-copy').textContent=info.title.toUpperCase()+' · SIGNATURE ENCOUNTER';
    return true;
  },
  clearThreats:()=>{
    foes=[];shots=[];enemyShots=[];fx=[];bossHazards=[];bossDrops=[];drops=[];ammoDrops=[];
    arsenalReset();
    bossIntro=0;$('wb-boss-intro').hidden=true;$('wb-boss-hud').hidden=true;
    releaseControls();
  },
  resupply:({heal=0,ammo=false,scrap:gain=0})=>{
    hull=Math.min(10,hull+heal);
    scrap+=gain;
    if(ammo)for(let slot=0;slot<2;slot++){
      const gun=categoryItems[slot][slotIndices[slot]];
      if(gun)gun.reserve=gun.reserveMax;
    }
    hud();
  },
  damage:(reason,amount)=>damagePlayer(reason,amount),
  stats:()=>({score,hull,gear:slotIndices.map((index,slot)=>categoryItems[slot]?.[index]?.name||'Empty slot')}),
  settle:result=>{
    const record=progression.arsenalRelay&&typeof progression.arsenalRelay==='object'?progression.arsenalRelay:(progression.arsenalRelay={});
    const previous=relayMastery(result.faction)||{};
    const entry={extracts:Math.max(0,Number(previous.extracts)||0)+(result.success?1:0),bosses:Math.max(0,Number(previous.bosses)||0)+(result.boss?1:0),defeats:Math.max(0,Number(previous.defeats)||0)+result.kills,badge:previous.badge===true,skill:Math.min(result.goal.target,Math.max(0,Number(previous.skill)||0)+result.skill)};
    const earned=!entry.badge&&entry.bosses>=2&&entry.extracts>=1;
    if(earned)entry.badge=true;
    record[result.faction]=entry;
    const badges=window.NeonTrack.state()?.profile?.badges;
    if(badges){
      const award=suffix=>{const id=result.faction+'-'+suffix;if(!badges.includes(id)){badges.push(id);return true}return false;};
      if(entry.badge)award('veteran');
      if(entry.skill===result.goal.target&&award('specialist'))say('SPECIALIST BADGE EARNED · Equip it in Signal Track');
    }
    saveProgression();
    window.NeonTrack.finishRun({mode:'sector',runId:result.id,activeSeconds:result.seconds,kills:result.kills,bosses:Number(result.boss),objectives:result.success?3:0,waves:result.success?3:0,victory:result.success,damageTaken:damageSerial});
    window.NeonTrack.refresh();
    return `${earned?'Faction veteran badge earned. ':entry.badge?'Faction veteran badge owned. ':''}${Math.min(2,entry.bosses)}/2 boss defeats · ${Math.min(1,entry.extracts)}/1 extraction. ${result.goal.description} (${entry.skill}/${result.goal.target}).`;
  },
  finish:()=>{
    playing=false;paused=true;
    releaseControls();
    if(raf)cancelAnimationFrame(raf);
    raf=0;
    $('nar-next-trial').hidden=true;
    $('wb-boss-intro').hidden=true;
    $('wb-boss-hud').hidden=true;
    pauseOverlay.hidden=true;
  }
});
