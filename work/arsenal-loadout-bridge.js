let nnDeploymentFaction = null;
let nnActiveFaction = 'default';
let nnBench = false;
let nnBenchPanel;
let nnTrialProgress = null;
const nnRestoreTrialProgress = () => {
  if(!nnTrialProgress)return;
  if(nnTrialProgress.exists)progression.signalTrack=nnTrialProgress.value;
  else delete progression.signalTrack;
  nnTrialProgress=null;
  saveProgression();
  window.NeonTrack.refresh();
};
let nnInspectIndex = -1;
let nnInspectSlot = -1;
const nnPreviewCache = new Map();
const nnGearIcon = (item,slot,index) => {
  const key=slot+':'+index;
  if(nnPreviewCache.has(key))return nnPreviewCache.get(key);
  const canvas=document.createElement('canvas');
  canvas.width=144;canvas.height=72;
  const pen=canvas.getContext('2d');
  const scale=slot===3?1.3:1.55;
  pen.translate(22,36);pen.scale(scale,scale);
  if(!window.NeonArsenalArt.drawHeld(pen,item,{reduced:true,quality:'standard'})){
    if(slot<2)window.NeonCosmetics.drawWeapon(pen,null,{weaponIndex:window.NeonArsenal.skinIndex(slot,index),reduced:true,quality:'low'});
    else if(slot===2)window.NeonCosmetics.drawMelee(pen,item.kind,{reduced:true,quality:'low'});
    else{pen.fillStyle='#376273';pen.font='22px sans-serif';pen.fillText('✚',12,5)}
  }
  const url=canvas.toDataURL();
  nnPreviewCache.set(key,url);
  return url;
};
const nnArmoryMatches = item => {
  const search=$('nn-armory-search')?.value.trim().toLowerCase()||'';
  const role=$('nn-armory-role')?.value||'all';
  return (role==='all'||nnGearRole(item)===role)&&(!search||[item.name,item.role,item.signature,item.desc].join(' ').toLowerCase().includes(search));
};
const nnGearRole = item => {
  const role=item.role||item.utilityMode||item.pattern||item.style||item.kind;
  if(/pierce|armor|mark|charge|rail|tap/.test(role))return 'precision';
  if(/splash|fan|blast|orb|sweep|slow|chain|pull|push/.test(role))return 'control';
  if(/heal|refill|shield|dressing|screen|pack/.test(role))return 'support';
  if(/dash|blink|teleport/.test(role))return 'movement';
  return 'pressure';
};
const nnStatRows = (gear,slot) => {
  const n=value=>Number.isFinite(value)?Number(value.toFixed(2)):'—';
  if(slot<2)return [['Damage / projectile',n(gear.dmg)],['Projectiles / trigger',gear.spread||1],
    ['Ammo / action',gear.ammoPerShot||1],['Magazine / reserve',gear.magSize+' / '+gear.reserveMax],
    ['Attack interval',n(gear.rate)+' s'],[gear.reloadMode==='incremental'?'Reload / round':'Reload cycle',n(gear.reloadDuration)+' s'],
    ['Effective range',n(gear.range)],['Charge',gear.chargeTime?n(gear.chargeTime)+' s':'—']];
  if(slot===2)return [['Inner strike damage',n(gear.damage)],['Reach',n(gear.reach)],
    ['Arc',n(gear.arc*180/Math.PI)+'°'],['Recovery',n(gear.cooldown)+' s'],
    ['Outer damage',n(gear.damage*(1-(gear.falloff??.65)))]];
  return [['Power',n(gear.power)],['Radius / coverage',n(gear.radius)],['Duration',gear.duration||gear.fuse||'—'],
    ['Cooldown',n(gear.cooldown)+' s']];
};
const nnPaintItem = (canvas,item,slot,index,animated=false) => {
  const pen=canvas.getContext('2d');
  const theme=window.NeonArsenalArt.themes[nnFactionOf(item)];
  canvas.style.background=theme?'linear-gradient(135deg,'+theme.light+','+theme.floor+')':'#dbe7ec';
  pen.clearRect(0,0,canvas.width,canvas.height);
  const scale=slot===3?2.4:3.2;
  pen.save();pen.translate(canvas.width*.28,canvas.height*.52);pen.scale(scale,scale);
  const pose={time:animated?performance.now()/1000:0,heat:animated?.55:0,charge:animated?.65:0,reduced:!animated,quality:'high',preview:false};
  if(!window.NeonArsenalArt.drawHeld(pen,item,pose)){
    if(slot<2)window.NeonCosmetics.drawWeapon(pen,null,{...pose,weaponIndex:window.NeonArsenal.skinIndex(slot,index)});
    else if(slot===2)window.NeonCosmetics.drawMelee(pen,item.kind,pose);
    else{pen.fillStyle='#376273';pen.font='22px sans-serif';pen.fillText('✚',12,5)}
  }
  pen.restore();
};
const nnDecorateArmoryItem = (button,item,index) => {
  const title=button.textContent;
  button.replaceChildren();
  const image=new Image();image.src=nnGearIcon(item,activeSlot,index);image.alt='';image.width=72;image.height=36;
  const label=document.createElement('span');label.textContent=title;
  button.append(image,label);
  button.classList.add('nn-weapon-tile');
};
const nnInspectGear = (item,index) => {
  nnInspectIndex=index;nnInspectSlot=activeSlot;
  nnCompareGear(item);
  const button=$('nn-armory-action');
  if(button){button.textContent=item.cost>0&&!creativeMode?'Buy & equip · '+item.cost+' scrap':'Equip '+item.name;button.disabled=false}
  $('nn-armory-preview').hidden=false;
  nnPaintItem($('nn-armory-preview'),item,activeSlot,index,!reduced);
};
const nnCompareGear = item => {
  const details=$('nn-armory-compare'),equipped=currentItem();
  if(!details)return;
  details.replaceChildren();
  const title=document.createElement('h3');title.textContent=item.name;
  const copy=document.createElement('p');copy.textContent=item.signature||item.desc;
  const tradeoff=document.createElement('p');tradeoff.className='nn-item-tradeoff';tradeoff.textContent=item.weakness||item.desc;
  const table=document.createElement('table');
  const head=table.createTHead().insertRow();
  for(const value of ['Stat','Inspected','Equipped']){const cell=document.createElement('th');cell.textContent=value;head.append(cell)}
  const body=table.createTBody(),other=nnStatRows(window.NeonCombatExpansion.effective(equipped),activeSlot);
  nnStatRows(window.NeonCombatExpansion.effective(item),activeSlot).forEach(([label,value],index)=>{
    const row=body.insertRow();
    for(const text of [label,value,other[index]?.[1]??'—'])row.insertCell().textContent=text;
  });
  details.append(title,copy,tradeoff,table);
};
const nnFaction = id => window.NeonArsenal.factions.find(faction => faction.id === id) || window.NeonArsenal.factions[0];
const nnFactionOf = item => item?.faction || 'default';
const nnItemSaveId = item => item.id || 'default:' + item.name;
const nnFactionPreferences = () => {
  if (!progression.arsenal || typeof progression.arsenal !== 'object' || Array.isArray(progression.arsenal)) progression.arsenal = {};
  if (!progression.arsenal.kits || typeof progression.arsenal.kits !== 'object' || Array.isArray(progression.arsenal.kits)) progression.arsenal.kits = {};
  return progression.arsenal;
};
const nnIsLoaned = (slot, index) => Boolean(window.NeonArsenalRelay?.isLoaned?.(slot, index));
const nnIsAvailable = (item, slot = activeSlot, index = categoryItems[slot].indexOf(item)) =>
  creativeMode || nnFactionOf(item) === nnActiveFaction || nnIsLoaned(slot, index);
const nnCheckpointGear = () => {
  const fields=['cost','level','dmg','damage','power','rate','cooldown','reach','arc','magSize','reserveMax','reloadDuration','mag','reserve'];
  let offset=0;
  return categoryItems.map(items=>items.map(item=>{
    const baseline=runItemDefaults[offset++];
    const changed={kind:item.kind};
    for(const field of fields)if(Number.isFinite(item[field])&&item[field]!==baseline[field])changed[field]=item[field];
    return Object.keys(changed).length>1?changed:null;
  }));
};
const nnApplyFaction = () => {
  const preferences = nnFactionPreferences();
  const faction = nnFaction(nnDeploymentFaction || preferences.faction);
  nnActiveFaction = faction.id;
  const previous = preferences.kits[faction.id];
  for (let slot = 0; slot < 4; slot++) {
    const items = categoryItems[slot];
    const index = items.findIndex(item => nnFactionOf(item) === faction.id && nnItemSaveId(item) === previous?.[slot] && item.cost === 0);
    slotIndices[slot] = index < 0 ? faction.starter[slot] : index;
  }
  weapon = slotIndices[0];
  root.dataset.nnArsenal = faction.id;
};
const nnRememberFactionKit = () => {
  if (creativeMode || practiceMode || nnDeploymentFaction || window.NeonArsenalRelay?.active()) return;
  nnFactionPreferences().kits[nnActiveFaction] = categoryItems.map((items, slot) => nnItemSaveId(items[slotIndices[slot]]));
  saveProgression();
};
const nnArsenalMenu = () => {
  const armoryFilters=document.createElement('div');
  armoryFilters.className='nn-armory-filters';
  armoryFilters.innerHTML='<label>Search current slot <input id="nn-armory-search" class="form-control" type="search" placeholder="Name, role, or effect"></label><label>Role <select id="nn-armory-role"><option value="all">All roles</option><option value="precision">Precision</option><option value="control">Crowd control</option><option value="pressure">Pressure & stagger</option><option value="support">Recovery & defense</option><option value="movement">Movement</option></select></label>';
  $('wb-weapons').before(armoryFilters);
  const inspect=document.createElement('section');inspect.className='nn-armory-inspect';
  inspect.innerHTML='<canvas id="nn-armory-preview" width="320" height="108" aria-hidden="true" hidden></canvas><div id="nn-armory-compare" aria-live="polite"></div><button type="button" class="btn btn-primary" id="nn-armory-action" disabled>Select equipment to inspect</button>';
  $('wb-weapons').after(inspect);
  $('nn-armory-search').addEventListener('input',refreshWeaponButtons);
  $('nn-armory-role').addEventListener('change',refreshWeaponButtons);
  $('nn-armory-action').onclick=()=>{
    if(nnInspectSlot!==activeSlot)return;
    const item=categoryItems[activeSlot]?.[nnInspectIndex];
    if(!item||!nnIsAvailable(item))return;
    if(item.cost>0&&!creativeMode)unlockWeapon(nnInspectIndex);
    else selectLoadoutItem(nnInspectIndex,true);
    nnInspectGear(item,nnInspectIndex);
  };
  $('wb-armory-open').addEventListener('click',()=>{$('nn-armory-search').value='';$('nn-armory-role').value='all';refreshWeaponButtons();nnInspectGear(currentItem(),slotIndices[activeSlot])});
  const card = document.createElement('details');
  card.className = 'menu-extra nn-arsenal-selector';
  card.innerHTML = '<summary>Five Arsenals · Choose your deployment kit</summary><div class="nn-arsenal-controls"><label>Faction <select id="nn-deployment-faction"></select></label><label>Inspect equipment <select id="nn-faction-item"></select></label><label>Category <select id="nn-showroom-slot"><option value="all">All equipment</option><option value="0">Primary</option><option value="1">Secondary</option><option value="2">Melee</option><option value="3">Utility</option></select></label><label>Search <input id="nn-showroom-search" type="search" class="form-control" placeholder="Weapon, effect, or role"></label></div><p id="nn-faction-description"></p><div class="nn-arsenal-kit" id="nn-faction-kit"></div><div class="nn-arsenal-preview"><canvas width="360" height="120" aria-hidden="true"></canvas><p id="nn-faction-item-copy" aria-live="polite"></p></div><button class="btn" type="button" id="nn-workshop-bench">Open Workshop Test Bench</button>';
  $('wb-menu').querySelector('.menu-actions').after(card);
  const selection = $('nn-deployment-faction'), equipment = $('nn-faction-item');
  for (const faction of window.NeonArsenal.factions) selection.append(new Option(faction.name, faction.id));
  const preview = () => {
    const [slot, index] = equipment.value.split(':').map(Number);
    const liveItem = categoryItems[slot]?.[index];
    const item = liveItem?.id?window.NeonArsenal.byId(liveItem.id):liveItem;
    if (!item) return;
    const stats = slot < 2 ? 'Damage ' + item.dmg + ' · ' + item.magSize + ' round magazine · ' + item.reloadDuration + 's reload' :
      slot === 2 ? 'Damage ' + item.damage + ' · ' + item.reach + ' reach · ' + item.cooldown + 's recovery' :
      item.cooldown + 's cooldown';
    $('nn-faction-item-copy').textContent = item.name + ' · ' + (item.signature||item.desc) + ' ' + stats + (item.cost ? ' · ' + item.cost + ' run scrap' : ' · starter gear')+(item.weakness?' Tradeoff: '+item.weakness:'');
    nnPaintItem(card.querySelector('canvas'),item,slot,index,!reduced);
  };
  const render = () => {
    const faction = nnFaction(selection.value);
    const selected=equipment.value,slotFilter=$('nn-showroom-slot').value,search=$('nn-showroom-search').value.toLowerCase();
    $('nn-faction-description').textContent = faction.tagline || 'Original NEON//NULL equipment.';
    const kit = $('nn-faction-kit');
    kit.replaceChildren();
    equipment.replaceChildren();
    categoryItems.forEach((items, slot) => {
      const cell = document.createElement('span');
      cell.textContent = categoryNames[slot] + ' · ' + items[faction.starter[slot]].name;
      kit.append(cell);
      items.forEach((item, index) => {
        if (nnFactionOf(item) === faction.id&&(slotFilter==='all'||Number(slotFilter)===slot)&&[item.name,item.desc,item.role].join(' ').toLowerCase().includes(search)) equipment.append(new Option(categoryNames[slot] + ' · ' + item.name, slot + ':' + index));
      });
    });
    if(Array.from(equipment.options).some(option=>option.value===selected))equipment.value=selected;
    $('nn-workshop-bench').disabled=equipment.options.length===0;
    if(!equipment.options.length){$('nn-faction-item-copy').textContent='No matching equipment. Clear the search or choose another category.';const c=card.querySelector('canvas');c.getContext('2d').clearRect(0,0,c.width,c.height)}
    preview();
  };
  selection.value = nnFaction(nnFactionPreferences().faction).id;
  selection.addEventListener('change', () => {
    nnFactionPreferences().faction = nnFaction(selection.value).id;
    saveProgression();
    render();
  });
  equipment.addEventListener('change', preview);
  $('nn-showroom-search').addEventListener('input',render);
  $('nn-showroom-slot').addEventListener('change',render);
  card.addEventListener('toggle', () => {
    if (!card.open) return;
    selection.value = nnFaction(nnFactionPreferences().faction).id;
    render();
  });
  $('nn-workshop-bench').addEventListener('click', () => {
    returnToMenu();
    nnBench = true;
    menu.hidden = true;
    game.hidden = false;
    start(true);
    creativeInvulnerable = true;
    $('wb-creative-invuln').textContent = 'Player Damage: Off';
    $('wb-creative-invuln').setAttribute('aria-pressed', 'false');
    const [slot, index] = equipment.value.split(':').map(Number);
    if (categoryItems[slot]?.[index]) {
      selectHotbarSlot(slot);
      selectLoadoutItem(index, true);
    }
    nnBenchPanel.hidden = false;
    nnBenchPanel.querySelector('button').click();
  });
  nnBenchPanel = document.createElement('div');
  nnBenchPanel.className = 'controls nn-bench-controls';
  nnBenchPanel.hidden = true;
  nnBenchPanel.setAttribute('aria-label', 'Workshop test targets');
  for (const [label, type, distance] of [['Near · 100', 'drone', 100], ['Mid · 200', 'brute', 200], ['Far · 300', 'brute', 300], ['Moving', 'weaver', 250], ['Armored', 'shield-carrier', 195],['Group','drone',180],['Boss-sized','brute',250]]) {
    const button = document.createElement('button');
    button.className = 'btn';
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => {
      if (!nnBench || !playing) return;
      releaseControls();
      foes = [];
      shots = [];
      enemyShots = [];
      fx=[];blasts=[];meleeSlash=null;
      arsenalReset();
      arsenalArtFX.clear();
      meleeImpactFX.clear();
      damageBoost=repairTime=shieldHits=shieldTime=0;
      const gun = activeSlot < 2 ? currentItem() : null;
      currentItem().arsenalReady=0;
      if (gun) {
        gun.mag = gun.magSize;
        gun.reserve = gun.reserveMax;
        gun.reloadLeft = 0;
        gun.reloadCues=[];
        gun.cooling=gun.heat=gun.chargeLeft=gun.overheatUntil=0;
        gun.chargeReady=false;
      }
      cool = secondaryCool = meleeCool = utilityCool = 0;
      const direction = player.x + distance + 30 < w ? 1 : -1;
      const profile = enemyKinds.find(enemy => enemy.id === type);
      const count=label==='Group'?5:1;
      for(let i=0;i<count;i++){
        const targetProfile=type==='weaver'?profile:{...profile,speed:0,...(label==='Boss-sized'?{r:48,hp:220}: {})};
        const target = spawnEnemy(targetProfile, Math.max(55, Math.min(w - 55, player.x + direction * distance+(i%2)*45)), Math.max(55,Math.min(h-55,player.y+(i-Math.floor(count/2))*44)));
        if (target) {
          target.targetsRelay = false;
          target.fire = Infinity;
          target.charge = Infinity;
          target.hp=target.max=label==='Boss-sized'?220:60;
        }
      }
      say(label + ' target · Compare Standard and Workshop kits here. Changes apply for this session only.');
    });
    nnBenchPanel.append(button);
  }
  $('wb-game').querySelector('.controls').after(nnBenchPanel);
  render();
};
