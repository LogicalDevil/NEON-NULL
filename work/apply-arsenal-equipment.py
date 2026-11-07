from pathlib import Path


def apply(source):
    """Integrate equipment into the current standalone build, leaving historical scripts intact."""
    if 'const arsenal = window.NeonArsenal;' in source:
        return source
    start = source.rindex('</template>') + len('</template>')
    prefix, current = source[:start], source[start:]

    def hook(old, new, count=1):
        nonlocal current
        if current.count(old) != count:
            raise ValueError('Arsenal hook count mismatch: ' + old[:110])
        current = current.replace(old, new, count)

    equipment = Path(__file__).with_name('arsenal-equipment.js').read_text(encoding='utf-8')
    hook('const ammoPickupMultiplier=', equipment + '\nconst ammoPickupMultiplier=')
    hook('weaponSkinFor(activeSlot===0?weapon:activeSlot===1?weapons.length+slotIndices[1]:-1)',
         'weaponSkinFor(activeSlot<2?arsenal.skinIndex(activeSlot,slotIndices[activeSlot]):-1)', 2)
    hook('const gunIndex=activeSlot===0?weapon:activeSlot===1?weapons.length+slotIndices[1]:0;const heldGun=activeSlot<2?rangedWeapons[gunIndex]:null',
         'const gunIndex=activeSlot<2?arsenal.skinIndex(activeSlot,slotIndices[activeSlot]):0;const heldGun=activeSlot<2?currentItem():null')
    hook('item.weaponIndex<weapons.length?0:1','item.weaponIndex<arsenal.defaultSizes[0]?0:1')
    hook('item.weaponIndex-weapons.length,true','item.weaponIndex-arsenal.defaultSizes[0],true')
    hook("const px=player.x,py=player.y,dx=pointer.x-px,dy=pointer.y-py;",
         """if(gun.faction&&((ammoOwner.overheatUntil||0)>clock||!arsenalChargeReady(gun,ammoOwner)))return false;
         const px=player.x,py=player.y,dx=pointer.x-px,dy=pointer.y-py;""")
    hook('if(!playing||shots.length>=84)return false;', 'if(!playing||(!gun.ray&&shots.length>=84))return false;')
    hook('if(ammoOwner.reloadLeft>0)return false;if(infinite)',
         """if(ammoOwner.reloadLeft>0&&!(gun.reloadMode==='incremental'&&ammoOwner.mag>=rounds))return false;
         if(gun.faction&&!gun.ray&&shots.length+Math.min(7,gun.spread||1)>84)return false;
         if(infinite)""")
    hook('const createShot=(a,delay=0)=>{if(shots.length>=84)return;',
         """if(gun.reloadMode==='incremental'&&ammoOwner.reloadLeft>0){ammoOwner.reloadLeft=0;ammoOwner.reloadCues=[];ammoOwner.reloadSlot=-1}
         const shotItem=gun.faction?{...gun}:null;
         const factionPower=1+(ammoOwner.heat||0)*(gun.pressureBonus||0);
         const createShot=(a,delay=0,lateral=0,curve=0)=>{if(!gun.ray&&shots.length>=84)return;
         if(gun.ray){arsenalRay(gun,px,py,a,gun.dmg*factionPower*(damageBoost>0?1.4:1));return}""")
    hook("if(gun.kind==='burst-rifle'){for(let n=0;n<3;n++)createShot",
         """if(gun.faction){ammoOwner.shotSerial=(ammoOwner.shotSerial||0)+1;
         arsenal.patternShots(gun,ammoOwner.shotSerial,(offset,delay,lateral,curve)=>createShot(base+recoilOffset+offset,delay,lateral,curve))}
         else if(gun.kind==='burst-rifle'){for(let n=0;n<3;n++)createShot""")
    hook('const n=Math.min(gun.magSize-gun.mag,gun.reserve);gun.mag+=n;gun.reserve-=n;gun.reloadSlot=-1;',
         """const staged=gun.reloadMode==='incremental';
         const n=Math.min(gun.magSize-gun.mag,gun.reserve,staged?1:Infinity);gun.mag+=n;gun.reserve-=n;
         if(staged&&gun.mag<gun.magSize&&gun.reserve>0){gun.reloadLeft=gun.reloadTotal;playSfx('reload-action-'+gun.reloadStyle,0,1);updateHotbar();continue}
         gun.reloadSlot=-1;""")
    hook('window.NeonCombatExpansion.projectile(shot,gun);shots.push(shot)',
         """if(gun.faction){shot.item=shotItem;shot.reflectable=!gun.splashRadius;shot.life=gun.range/gun.speed;
         shot.curve=curve;shot.x-=Math.sin(base)*lateral;shot.y+=Math.cos(base)*lateral;shot.r=gun.shotRadius||shot.r;shot.dmg*=factionPower;
         shot.nnPierce=Math.max(0,(gun.penetration||1)-1);if(shot.nnPierce)shot.nnHitIds=[]}
         window.NeonCombatExpansion.projectile(shot,gun);shots.push(shot)""")
    hook("burst(px+Math.cos(base)*18,py+Math.sin(base)*18,gun.kind==='flare'?'#ef3445':'#111',gun.spread>3?8:3,gun.vfx||'spark');",
         """if(gun.heatPerShot){ammoOwner.lastFactionShot=clock;ammoOwner.heat=Math.min(1,(ammoOwner.heat||0)+gun.heatPerShot);
         if(ammoOwner.heat>=.999){ammoOwner.heat=0;ammoOwner.overheatUntil=clock+(gun.ventDuration||.86);playSfx('arsenal-vent-'+gun.kind,soundPan(px),2);say(gun.name+(gun.ventDuration?' · venting':' · overheated'));}}
         burst(px+Math.cos(base)*18,py+Math.sin(base)*18,gun.color||(gun.kind==='flare'?'#ef3445':'#111'),gun.spread>3?8:3,gun.vfx||'spark');""")
    hook('const useUtility=()=>window.NeonCombatExpansion.withStats(utilityItems[slotIndices[3]],()=>useUtilityBase());',
         """const useUtility=()=>{const item=utilityItems[slotIndices[3]];
         return window.NeonCombatExpansion.withStats(item,()=>item.faction?arsenalUtility(item):useUtilityBase())};""")
    hook("$('wb-clear-test-enemies').addEventListener('click',()=>{",
         "$('wb-clear-test-enemies').addEventListener('click',()=>{arsenalReset();")
    hook('const returnToMenu=()=>{',
         'const returnToMenu=()=>{arsenalReset();')
    hook('window.NeonCombatExpansion.reset();enemyDirector.reset();',
         'window.NeonCombatExpansion.reset();arsenalReset();enemyDirector.reset();')
    hook('window.NeonCombatExpansion.tick(dt,foes);',
         'arsenalTick(dt);window.NeonCombatExpansion.tick(dt,foes);')
    hook('window.NeonCombatExpansion.draw(ctx,foes,{quality:graphicsQuality});',
         'arsenalDraw(ctx);window.NeonCombatExpansion.draw(ctx,foes,{quality:graphicsQuality});')
    hook("state.textContent=gun.mag===0&&gun.reserve===0?'EMPTY · NO RESERVE':'R RELOAD'",
         """state.textContent=gun.mag===0&&gun.reserve===0?'EMPTY · NO RESERVE':
         gun.overheatUntil>clock&&gun.faction?(gun.ventDuration?'VENTING':'OVERHEATED')+' · '+(gun.overheatUntil-clock).toFixed(1)+'s':
         gun.chargeLeft>0?'CHARGING · '+gun.chargeLeft.toFixed(1)+'s':
         gun.heatPerShot?(gun.ventDuration?'PRESSURE ':'HEAT ')+Math.round((gun.heat||0)*100)+'% · R RELOAD':'R RELOAD'""")
    hook("if(b.kind==='grenade')b.vy+=250*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;",
         """if(b.kind==='grenade')b.vy+=250*dt;
         const previousX=b.x,previousY=b.y;
         arsenal.steerShot(b,dt);b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
         if(b.item?.bouncesMax&&b.bounces<b.item.bouncesMax&&(b.x<8||b.x>w-8||b.y<8||b.y>h-8)){
           const angle=Math.atan2(b.vy,b.vx),length=arsenal.boundary(previousX-8,previousY-8,angle,w-16,h-16,Math.hypot(b.vx,b.vy)*dt);
           const outX=b.x<8||b.x>w-8,outY=b.y<8||b.y>h-8;
           b.x=arsenalClamp(previousX+Math.cos(angle)*length,8,w-8);
           b.y=arsenalClamp(previousY+Math.sin(angle)*length,8,h-8);
           if(outX)b.vx=-b.vx;if(outY)b.vy=-b.vy;b.bounces++;burst(b.x,b.y,b.item.color,6,'glint');
         }""")
    hook('for(let j=foes.length-1;j>=0;j--){const e=foes[j];if(Math.hypot(e.x-b.x,e.y-b.y)<e.r+b.r)',
         """const contactList=b.item?arsenal.rayContacts(previousX,previousY,Math.atan2(b.y-previousY,b.x-previousX),Math.hypot(b.x-previousX,b.y-previousY),foes,e=>!e.dead,e=>e.r+b.r).map(contact=>contact.entity).reverse():foes;
         for(let j=contactList.length-1;j>=0;j--){const e=contactList[j];if(Math.hypot(e.x-b.x,e.y-b.y)<e.r+b.r)""")
    hook('if(b.delay>0){b.delay=Math.max(0,b.delay-dt);continue}',
         'if(b.delay>0){if(b.item&&(!playing||hull<=0)){shots.splice(i,1);continue}b.delay=Math.max(0,b.delay-dt);continue}')
    hook('b.x+=b.vx*dt*hostileScale;b.y+=b.vy*dt*hostileScale;if(window.NeonSector.projectileHit(b,true))',
         'const oldHostileX=b.x,oldHostileY=b.y;b.x+=b.vx*dt*hostileScale;b.y+=b.vy*dt*hostileScale;if(arsenalBlockShot(b,oldHostileX,oldHostileY)){enemyShots.splice(i,1);continue}if(window.NeonSector.projectileHit(b,true))')
    hook('if(Math.hypot(e.x-b.x,e.y-b.y)<e.r+b.r){if(b.nnHitIds?.includes(e))continue;',
         """if(b.item ? arsenal.segmentHits(previousX,previousY,b.x,b.y,e.x,e.y,e.r+b.r) : Math.hypot(e.x-b.x,e.y-b.y)<e.r+b.r){if(b.nnHitIds?.includes(e))continue;""")
    hook("const rangeScale=b.kind==='auto-shotgun'&&Math.hypot(e.x-player.x,e.y-player.y)>150?.45:1;",
         """const rangeScale=b.item?.falloff?Math.max(.3,1-b.item.falloff*(1-b.life/(b.item.range/b.item.speed))):
         b.kind==='auto-shotgun'&&Math.hypot(e.x-player.x,e.y-player.y)>150?.45:1;""")
    hook('applyCombatHit(e,{kind:b.kind,nnMod:b.nnMod},Math.max(.1,b.dmg*(b.nnArmor?1:damageScale)*rangeScale),Math.atan2(b.vy,b.vx));',
         """applyCombatHit(e,b.item||{kind:b.kind,nnMod:b.nnMod},Math.max(.1,b.dmg*(b.nnArmor?1:damageScale)*rangeScale),Math.atan2(b.vy,b.vx));
         if(b.item)arsenalImpact(e,b.item,Math.atan2(b.vy,b.vx));
         if(b.item?.splashRadius){splashDamage(e.x,e.y,b.item.splashRadius,b.dmg*.58,e,b.item.color);burst(e.x,e.y,b.item.color,11,'ring')}
         if(b.item?.chainRadius){let next=null,closest=b.item.chainRadius;for(const other of foes){
           const distance=Math.hypot(other.x-e.x,other.y-e.y);if(other!==e&&other.hp>0&&distance<closest){next=other;closest=distance}
         }if(next){arsenalApply(next,b.item,b.dmg*b.item.chainFactor,Math.atan2(next.y-e.y,next.x-e.x));arsenalTrace.push({x:e.x,y:e.y,endX:next.x,endY:next.y,weaponKind:b.kind,hit:true,life:.11,duration:.11})}}""")
    hook("applyCombatHit(e,item,Math.max(.1,damage*(e.type.id==='signal-core'?(e.open?1.85:.55):1)),angle);",
         """applyCombatHit(e,item,Math.max(.1,damage*(e.type.id==='signal-core'?(e.open?1.85:.55):item.faction&&e.type.id==='shield-carrier'&&!item.armor?.55:1)),angle);
         if(item.faction)arsenalImpact(e,item,angle);""")
    hook('damage=Math.max(.1,amount*(reaction.multiplier||1));enemy.hp-=damage;',
         'damage=Math.max(.1,amount*(reaction.multiplier||1)*(enemy.arsenalMark>0?1.15:1));enemy.hp-=damage;')
    hook('steer=(e,tx,ty,speed,dt,turn=2.5)=>{',
         'steer=(e,tx,ty,speed,dt,turn=2.5)=>{if(e.arsenalSlow>0)speed*=.58;')
    hook('const falloff=1-.65*Math.max(0,Math.min(1,(dist-e.r)/item.reach))',
         'const falloff=1-(item.falloff??.65)*Math.max(0,Math.min(1,(dist-e.r)/item.reach))')
    hook('if(cool>0||gun.cost>0&&!creativeMode)return;gun.cooling=0;if(fireGun(gun,gun))cool=window.NeonCombatExpansion.effective(gun).rate*(damageBoost>0?.72:1)',
         """if((gun.faction?(gun.arsenalReady||0)>clock:cool>0)||gun.cost>0&&!creativeMode)return;
         gun.cooling=0;if(fireGun(gun,gun)){const delay=window.NeonCombatExpansion.effective(gun).rate*(damageBoost>0?.72:1);
         if(gun.faction)gun.arsenalReady=clock+delay;else cool=delay}""")
    hook('paused||secondaryCool>0||gun.cost>0&&!creativeMode','paused||(gun.faction?(gun.arsenalReady||0)>clock:secondaryCool>0)||gun.cost>0&&!creativeMode')
    hook('if(fireGun(shotGun,gun))secondaryCool=window.NeonCombatExpansion.effective(gun).rate*(damageBoost>0?.72:1);',
         'if(fireGun(shotGun,gun)){const delay=window.NeonCombatExpansion.effective(gun).rate*(damageBoost>0?.72:1);if(gun.faction)gun.arsenalReady=clock+delay;else secondaryCool=delay}')
    hook('if(!playing||paused||meleeCool>0)return;const item=meleeWeapons[slotIndices[2]];',
         'const item=meleeWeapons[slotIndices[2]];if(!playing||paused||(item.faction?(item.arsenalReady||0)>clock:meleeCool>0))return;')
    hook('meleeCool=item.cooldown*(damageBoost>0?.8:1);',
         'const recovery=item.cooldown*(damageBoost>0?.8:1);if(item.faction)item.arsenalReady=clock+recovery;else meleeCool=recovery;')
    hook("else if(i===2&&meleeCool>0)", "else if(i>=2&&item.faction&&item.arsenalReady>clock)state=(item.arsenalReady-clock).toFixed(1)+'s CD';else if(i===2&&!item.faction&&meleeCool>0)")
    hook("else if(i===3&&utilityCool>0)", "else if(i===3&&!item.faction&&utilityCool>0)")
    # The view offset is applied only while drawing the world. Aim and overlays
    # use the unshaken camera, including the first frame after a setting change.
    current = current.replace('cameraX+pointer.viewX-shakeX','cameraX+pointer.viewX').replace('cameraY+pointer.viewY-shakeY','cameraY+pointer.viewY')
    hook("const shake=!reduced&&screenShakeEnabled?screenShake*shakeLevel:0;\nshakeX=shake?(Math.random()-.5)*shake*36:0;\nshakeY=shake?(Math.random()-.5)*shake*24:0;",
         """const shake=!reduced&&screenShakeEnabled?Math.min(5,Math.max(0,screenShake*shakeLevel*18)):0;
shakeX=Math.sin(now*.062)*shake;
shakeY=Math.sin(now*.079+1.4)*shake*.65;""")
    hook('ctx.clearRect(0,0,viewW,viewH);\nctx.save();','ctx.fillStyle="#e9eef0";ctx.fillRect(0,0,viewW,viewH);\nctx.save();')
    hook('if(darkArchive){ctx.save();ctx.translate(-cameraX,-cameraY);','if(darkArchive){ctx.save();ctx.translate(shakeX-cameraX,shakeY-cameraY);')
    hook('drawEnemyWarnings();drawBossWarnings();','ctx.save();ctx.translate(shakeX,shakeY);drawEnemyWarnings();drawBossWarnings();ctx.restore();')
    hook("if(!screenShakeEnabled)screenShake=0;saveAccessibility()", "if(!screenShakeEnabled)screenShake=shakeX=shakeY=0;saveAccessibility()")
    return prefix + current
