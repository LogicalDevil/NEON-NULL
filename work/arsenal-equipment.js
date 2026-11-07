/* Inline arena hooks. Gameplay state belongs to the active run. */
const arsenal = window.NeonArsenal;
for (const [slot, definitions] of arsenal.groups.entries()) {
  for (const definition of definitions) {
    const item = {...definition};
    categoryItems[slot].push(item);
    if (slot < 2) rangedWeapons.push(item);
  }
}
if (window.NeonArsenalArt?.registerSounds) window.NeonArsenalArt.registerSounds(defineSound);
else {
  for (const item of arsenal.groups.flat()) {
    const base = {spectrum: 660, blackpowder: 190, frontier: 260, brassworks: 350}[item.faction];
    const pitch = base + (item.index % 7) * 27;
    defineSound(item.sfx, pitch, item.faction === 'spectrum' ? 'sine' : 'triangle', .13, .075, -pitch*.38, 1.6, .21, .009);
    if (item.slot < 2) {
      defineSound('reload-'+item.reloadStyle, pitch*.8, 'triangle', .13, .05, -65);
      defineSound('reload-complete-'+item.reloadStyle, pitch*1.3, 'sine', .13, .055, 95);
    }
    if (item.slot === 2) defineSound('melee-impact-'+item.kind, pitch*.5, 'triangle', .11, .065, -80, 1.4, .25, .017);
  }
}

const arsenalTrace = [];
let arsenalFields = [];
const arsenalKeep = (array, predicate) => {
  let next = 0;
  for (const value of array) if (predicate(value)) array[next++] = value;
  array.length = next;
};
const arsenalClamp = (x, a, b) => Math.min(b, Math.max(a, x));
const arsenalReset = () => {arsenalTrace.length = 0; arsenalFields = []};
const arsenalSightClear = (x,y,tx,ty) => {
  if(!isSector())return true;
  const steps=Math.min(64,Math.max(1,Math.ceil(Math.hypot(tx-x,ty-y)/10)));
  for(let i=0;i<=steps;i++){
    if(window.NeonSector.blocked(x+(tx-x)*i/steps,y+(ty-y)*i/steps,2))return false;
  }
  return true;
};
const arsenalBlockShot = (shot,oldX,oldY) => {
  for(const field of arsenalFields){
    if(field.item.utilityMode!=='barrier'||field.left<=0||field.blocks<=0)continue;
    if(!arsenal.barrierContact({x:field.x,y:field.y,radius:field.item.radius,angle:field.angle,arc:field.item.arc},oldX,oldY,shot.x,shot.y))continue;
    field.blocks--;if(!field.blocks)field.left=0;
    burst(shot.x,shot.y,field.item.color,5,'glint');
    return true;
  }
  return false;
};
const arsenalImpact = (enemy,item,angle) => {
  if(item.stun)enemy.stun=Math.max(enemy.stun||0,enemy.type.id==='signal-core'?Math.min(.18,item.stun):item.stun);
  if(item.slow)enemy.arsenalSlow=Math.max(enemy.arsenalSlow||0,item.slow);
  if(item.mark)enemy.arsenalMark=Math.max(enemy.arsenalMark||0,item.mark);
  if(item.bleed){enemy.burn=Math.max(enemy.burn||0,item.bleed);enemy.burnTick=.22}
  if(item.knockback&&enemy.type.id!=='signal-core'){enemy.vx+=Math.cos(angle)*item.knockback*4;enemy.vy+=Math.sin(angle)*item.knockback*4}
};
const arsenalApply = (enemy, item, damage, angle) => {
  if (!enemy || enemy.dead || enemy.hp <= 0) return false;
  const facing = Math.atan2(player.y-enemy.y, player.x-enemy.x), approach = angle+Math.PI-facing;
  const guarding = enemy.type.id === 'shield-carrier' && Math.abs(Math.atan2(Math.sin(approach),Math.cos(approach))) < .85;
  const scale = enemy.type.id === 'signal-core' ? (enemy.open ? 1.85 : .55) : guarding && !item.armor ? .35 : 1;
  applyCombatHit(enemy, item, Math.max(.1, damage * scale), angle);
  arsenalImpact(enemy,item,angle);
  enemy.damageFlash = .16;
  if (enemy.hp <= 0) killEnemy(enemy, foes.indexOf(enemy));
  return true;
};
const arsenalRay = (item, x, y, angle, amount) => {
  const limit = arsenal.boundary(x, y, angle, w, h, item.range);
  const targets = arsenal.rayContacts(x, y, angle, limit, foes, e => !e.dead && e.hp > 0,e=>e.r+(item.beamWidth||0)*.5);
  let end = limit, count = 0, step = 0;
  const hitLimit = (item.penetration || 1) + (item.pierceExtra || 0);
  const at = distance => ({x:x+Math.cos(angle)*distance, y:y+Math.sin(angle)*distance, dmg:amount, r:3});
  const hitStructureBefore = distance => {
    if (!isSector() && missionId !== 'breach') return false;
    for (; step <= distance; step += 9) {
      const probe = {...at(step),life:1};
      if (window.NeonSector.projectileHit(probe) || hitSectorAntenna(probe)) {end = step; return true}
      const generator = generators.find(g => !g.destroyed && Math.hypot(g.x-probe.x, g.y-probe.y) < 19);
      if (generator) {if (generator.open) damageGenerator(generator, amount, probe.x); end = step; return true}
    }
    return false;
  };
  for (const target of targets) {
    if (hitStructureBefore(target.distance)) break;
    if (!arsenalApply(target.entity, item, amount * Math.pow(.68,count), angle)) continue;
    count++;
    const impact = at(target.distance);
    burst(impact.x,impact.y,item.color,4,'glint');
    if (count >= hitLimit) {end = target.distance; break}
  }
  if (end === limit) hitStructureBefore(limit);
  const finish = at(end), duration = item.ray === 'beam' ? item.rate*1.1 : .14;
  if (arsenalTrace.length >= 18) arsenalTrace.shift();
  arsenalTrace.push({x,y,endX:finish.x,endY:finish.y,weaponKind:item.kind,hit:count>0||end<limit,life:duration,duration});
  if (item.ray === 'rail' && count >= 2) window.NeonArsenalRelay?.mastery?.('rail-line',1);
};
const arsenalChargeReady = (gun, owner) => {
  if (!gun.chargeTime) return true;
  if (!owner.chargeLeft && !owner.chargeReady) {
    owner.chargeLeft = gun.chargeTime;
    playSfx('arsenal-charge-'+gun.kind,soundPan(player.x),2);
    say(gun.name+' · hold to charge');
    return false;
  }
  if (!owner.chargeReady) return false;
  owner.chargeReady = false;
  return true;
};
const arsenalTick = dt => {
  const held = bossIntro <= 0 && ((pointer.down && pointer.slot === activeSlot) || gamepadFire);
  const gun = activeSlot < 2 ? currentItem() : null;
  for (const item of rangedWeapons) {
    if (!item.faction) continue;
    if (!held || gun !== item || item.reloadLeft > 0) {
      item.chargeLeft = 0;
      item.chargeReady = false;
      item.heat = Math.max(0,(item.heat||0)-(item.heatRecovery||0)*dt);
    } else if (item.chargeLeft > 0) {
      item.chargeLeft = Math.max(0,item.chargeLeft-dt);
      item.chargeReady = item.chargeLeft === 0;
    } else if (clock-(item.lastFactionShot??-10) > item.rate*1.4) {
      item.heat = Math.max(0,(item.heat||0)-(item.heatRecovery||0)*dt);
    }
  }
  for (const trace of arsenalTrace) trace.life -= dt;
  arsenalKeep(arsenalTrace, trace => trace.life > 0 && (arsenal.byId(trace.weaponKind)?.ray !== 'beam' || (held && gun?.kind === trace.weaponKind && !(gun.overheatUntil > clock))));
  for (const enemy of foes) {
    enemy.arsenalMark = Math.max(0,(enemy.arsenalMark||0)-dt);
    enemy.arsenalSlow = Math.max(0,(enemy.arsenalSlow||0)-dt);
  }
  for (const field of arsenalFields) {
    const {item} = field;
    if(item.followOwner){field.x=player.x;field.y=player.y}
    field.left -= dt;
    if (item.kind === 'field-dressing') {
      if (field.damageSerial !== damageSerial) {field.left = 0; continue}
      if (field.ticks > 0 && field.left <= item.duration * ((field.ticks-1)/item.power)+1e-7) {
        field.ticks--;
        const before = hull;
        hull = Math.min(10, hull+1);
        if (hull > before) {window.NeonTrack.record('heal',{amount:1});hud();burst(player.x,player.y,item.color,4,'cross')}
      }
    } else if (item.utilityMode==='heal') {
      if(item.interruptOnDamage&&field.damageSerial!==damageSerial){field.left=0;continue}
      if ((field.next-=dt)<=1e-7&&field.ticks>0) {
        field.next+=item.duration/item.power;field.ticks--;
        if (Math.hypot(player.x-field.x,player.y-field.y)<item.radius&&hull<10) {
          hull=Math.min(10,hull+1);hud();burst(player.x,player.y,item.color,4,'cross');
        }
      }
      if(item.coolingField)for(const slot of [0,1]){const gun=categoryItems[slot][slotIndices[slot]];gun.heat=Math.max(0,(gun.heat||0)-dt*.2)}
    } else if (item.utilityMode==='slow') {
      field.next-=dt;
      const pulse=field.next<=0;if(pulse)field.next=.65;
      for(const enemy of foes)if(Math.hypot(enemy.x-field.x,enemy.y-field.y)<item.radius){
        enemy.arsenalSlow=Math.max(enemy.arsenalSlow||0,.25);
        if(pulse&&item.contactDamage)arsenalApply(enemy,item,item.contactDamage,field.angle);
        if(pulse&&item.rootPulse&&enemy.type.id!=='signal-core')enemy.stun=Math.max(enemy.stun||0,item.rootPulse);
      }
      if(item.coolingField&&Math.hypot(player.x-field.x,player.y-field.y)<item.radius){
        for(const slot of [0,1]){const gun=categoryItems[slot][slotIndices[slot]];gun.heat=Math.max(0,(gun.heat||0)-dt*.35)}
      }
    } else if ((item.kind === 'clockwork-sentry'||item.utilityMode==='sentry') && field.left > 0 && (field.next-=dt) <= 0) {
      let target, nearest = item.radius;
      for (const enemy of foes) {
        const distance = Math.hypot(enemy.x-field.x,enemy.y-field.y);
        const angle = Math.atan2(enemy.y-field.y,enemy.x-field.x), diff = angle-field.angle;
        if (enemy.hp > 0 && distance < nearest && Math.abs(Math.atan2(Math.sin(diff),Math.cos(diff))) <= item.arc/2&&arsenalSightClear(field.x,field.y,enemy.x,enemy.y)) {
          target = enemy; nearest = distance;
        }
      }
      if (target) {
        const angle = Math.atan2(target.y-field.y,target.x-field.x);
        field.barrel = angle; field.next = item.shotInterval||.56;
        if (arsenalApply(target,item,item.shotDamage,angle)) window.NeonArsenalRelay?.mastery?.('sentry-hit',1);
        if (arsenalTrace.length >= 18) arsenalTrace.shift();
        arsenalTrace.push({x:field.x,y:field.y,endX:target.x,endY:target.y,weaponKind:item.kind,life:.08,duration:.08});
      } else field.next = .12;
    } else if (item.fuse && field.left <= 0) {
      splashDamage(field.x,field.y,item.radius,item.power,null,item.color);
      addCrater(field.x,field.y,item.radius*.46,'impact');
      playSfx('impact-explosive',soundPan(field.x),3);
      burst(field.x,field.y,item.color,20,'smoke');
      if (!reduced && screenShakeEnabled) screenShake = Math.max(screenShake,.085);
    }
  }
  arsenalKeep(arsenalFields, field => field.left > 0);
};
const arsenalDraw = ctx => {
  ctx.save();
  for (const trace of arsenalTrace) {
    const ratio = arsenalClamp(trace.life/trace.duration,0,1);
    if (window.NeonArsenalArt?.drawRay) window.NeonArsenalArt.drawRay(ctx,trace,ratio,reduced,graphicsQuality);
    else {
      ctx.strokeStyle = arsenal.byId(trace.weaponKind)?.color || '#366c94';
      ctx.globalAlpha = .4 + ratio*.5;
      ctx.lineWidth = trace.weaponKind === 'vector-railgun' ? 4 : 2;
      ctx.beginPath();ctx.moveTo(trace.x,trace.y);ctx.lineTo(trace.endX,trace.endY);ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  for (const {item,x,y,angle,barrel,left,originX,originY} of arsenalFields) {
    if (item.kind === 'field-dressing') continue;
    ctx.strokeStyle = item.color; ctx.lineWidth = 1.5;
    ctx.setLineDash([5,4]);ctx.beginPath();
    if (item.kind === 'clockwork-sentry'||item.utilityMode==='sentry') {
      ctx.moveTo(x,y);ctx.arc(x,y,item.radius,angle-item.arc/2,angle+item.arc/2);ctx.closePath();
    } else if(item.utilityMode==='barrier'){
      ctx.lineWidth=4;ctx.arc(x,y,item.radius,angle-item.arc/2,angle+item.arc/2);
    } else ctx.arc(x,y,item.radius,0,Math.PI*2);
    ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle = item.color;
    if (item.kind === 'stick-of-dynamite') {
      const progress = arsenalClamp((1-left/item.fuse)*3,0,1);
      const bounce = progress < .7 ? Math.sin(progress/.7*Math.PI)*17 : Math.sin((progress-.7)/.3*Math.PI)*7;
      ctx.fillRect(originX+(x-originX)*progress-5,originY+(y-originY)*progress-bounce-2,10,4);
    } else {
      ctx.fillRect(x-6,y-6,12,12);
      if (item.kind === 'clockwork-sentry'||item.utilityMode==='sentry') {
        const a = barrel ?? angle;
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*13,y+Math.sin(a)*13);ctx.stroke();
      }
    }
  }
  ctx.restore();
};
const arsenalUtility = item => {
  if (!playing || paused || (!creativeMode && ((item.arsenalReady||0)>clock || item.cost > 0))) return false;
  const angle = Math.atan2(pointer.y-player.y,pointer.x-player.x);
  const dist = Math.min(380,Math.hypot(pointer.x-player.x,pointer.y-player.y));
  const x = arsenalClamp(player.x+Math.cos(angle)*dist,24,w-24), y = arsenalClamp(player.y+Math.sin(angle)*dist,24,h-24);
  const power = item.integerPower ? Math.max(1,Math.round(item.power)) : item.power;
  switch (item.utilityMode||item.kind) {
    case 'shield': shieldHits=Math.max(shieldHits,power);shieldTime=Math.max(shieldTime,item.duration);break;
    case 'refill': {
      for (let slot=0;slot<2;slot++) {
        const gun=categoryItems[slot][slotIndices[slot]];
        gun.heat=0;gun.overheatUntil=0;gun.reserve=Math.min(gun.reserveMax,gun.reserve+Math.floor(power));
      }
      break;
    }
    case 'blink':
    case 'dash': {
      const distance=Math.min(dist,power),nx=arsenalClamp(player.x+Math.cos(angle)*distance,24,w-24),ny=arsenalClamp(player.y+Math.sin(angle)*distance,24,h-24);
      const oldX=player.x,oldY=player.y;
      player.x=nx;player.y=ny;hurtCooldown=Math.max(hurtCooldown,.23);
      if(item.utilityMode==='dash')window.NeonSector.resolveMovement(player,oldX,oldY);
      else if(window.NeonSector.blocked(nx,ny,14)){player.x=oldX;player.y=oldY;return false}
      if(item.utilityMode==='dash')for(const enemy of foes)if(Math.hypot(enemy.x-player.x,enemy.y-player.y)<item.radius)arsenalImpact(enemy,{knockback:25},Math.atan2(enemy.y-player.y,enemy.x-player.x));
      burst(player.x,player.y,item.color,12,'ring');break;
    }
    case 'hardlight-screen': shieldHits=power;shieldTime=item.duration;break;
    case 'capacitor-pack': {
      let changed = false;
      for (let slot=0;slot<2;slot++) {
        const gun = categoryItems[slot][slotIndices[slot]];
        if (gun.faction !== 'spectrum') continue;
        if (gun.heat>0 || gun.overheatUntil>clock || gun.reserve<gun.reserveMax) changed=true;
        gun.heat=0;gun.overheatUntil=0;gun.reserve=Math.min(gun.reserveMax,gun.reserve+power);
      }
      if (!changed) {say('Equipped energy weapons are cool and reserves are full.');return false}
      break;
    }
    case 'field-dressing':
      if (hull>=10 || arsenalFields.some(field=>field.item.kind===item.kind)) return false;
      arsenalFields.push({item:{...item,power},left:item.duration,ticks:power,damageSerial});
      break;
    case 'signal-flare':
    case 'mark':
      for (const enemy of foes) if (Math.hypot(enemy.x-x,enemy.y-y)<item.radius) enemy.arsenalMark=power;
      burst(x,y,item.color,18,'ring');
      break;
    case 'steam-vent':
      for (const enemy of foes) {
        const dx=enemy.x-player.x,dy=enemy.y-player.y,length=Math.hypot(dx,dy);
        if (length>=item.radius || !length) continue;
        enemy.arsenalSlow=Math.max(enemy.arsenalSlow||0,1.25);
        if (enemy.type.id==='signal-core') continue;
        enemy.vx+=dx/length*power*3;enemy.vy+=dy/length*power*3;
      }
      burst(player.x,player.y,item.color,18,'smoke');
      break;
    default: {
      const placement = item.kind==='clockwork-sentry'||['sentry','barrier'].includes(item.utilityMode) ? 85 : dist;
      const targetX=arsenalClamp(player.x+Math.cos(angle)*placement,24,w-24);
      const targetY=arsenalClamp(player.y+Math.sin(angle)*placement,24,h-24);
      if((item.utilityMode==='sentry'||item.kind==='clockwork-sentry')&&isSector()&&window.NeonSector.blocked(targetX,targetY,8)){
        say('Sentry placement blocked by scenery.');return false;
      }
      arsenalKeep(arsenalFields,field=>field.item.kind!==item.kind);
      const left=item.fuse||item.duration||power;
      if(arsenalFields.length>=8)arsenalFields.shift();
      arsenalFields.push({item:{...item},x:targetX,y:targetY,angle,left,ticks:power,blocks:power,damageSerial,next:item.utilityMode==='heal'?left/power:0,originX:player.x,originY:player.y});
    }
  }
  item.arsenalReady=creativeMode?0:clock+item.cooldown;
  playSfx(item.sfx,soundPan(player.x),2);
  say(item.name+' · deployed');
  updateHotbar();
  return true;
};
