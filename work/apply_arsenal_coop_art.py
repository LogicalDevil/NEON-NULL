"""Wire cosmetic-only Arsenal events to the network client's normal render loop."""


def apply(source):
    if 'const arsenalArtFX=' in source:
        return source

    def replace(old, new):
        nonlocal source
        if source.count(old) != 1:
            raise ValueError(f'Arsenal co-op art integration anchor changed: {old}')
        source = source.replace(old, new, 1)

    replace('const meleeImpactFX=window.NeonCombatFX.create();',
            'const meleeImpactFX=window.NeonCombatFX.create();const arsenalArtFX=window.NeonArsenalArt.createFX();const arsenalRays=[];')
    source = source.replace('meleeImpactFX.clear();history=[];',
                            'meleeImpactFX.clear();arsenalArtFX.clear();arsenalRays.length=0;history=[];')
    replace("const key=name.startsWith('gun-')||", "const key=name.startsWith('arsenal-')||name.startsWith('gun-')||")
    replace("case 'reload':sound=skin?", "case 'reload-step':sound='reload-action-'+(e.reloadStyle||g?.reloadStyle||'cell-cycle');break;case 'reload':sound=skin?")
    replace("case 'reload-start':sound=skin?", "case 'arsenal-charge':case 'arsenal-vent':sound=e.sfx;break;case 'reload-start':sound=skin?")
    replace('let sound;\n\nif(e.kind===\'melee-hit\'',
            "let sound;const arsenalItem=window.NeonArsenal.byId(e.weaponKind)||window.NeonArsenal.byId(e.itemId)||window.NeonArsenal.byId(g?.kind);"
            "if(e.kind==='arsenal-ray'){if(arsenalRays.length>=24)arsenalRays.shift();"
            "const life=Math.max(.03,Math.min(.22,e.duration||.10));arsenalRays.push({...e,life,max:life,quiet});return}"
            "if(!quiet&&arsenalItem){const fxKind={fire:'fire','melee-hit':'impact','arsenal-impact':'impact','arsenal-bounce':'impact','arsenal-charge':'impact','arsenal-vent':'vent','arsenal-field':'impact'}[e.kind];"
            "if(fxKind){const offset=fxKind==='fire'?window.NeonArsenalArt.muzzleOffset(arsenalItem)-(local?recoil:0):0,a=e.angle??maps.players?.get(e.owner)?.aim??0;arsenalArtFX.event(fxKind,arsenalItem,e.x+Math.cos(a)*offset,e.y+Math.sin(a)*offset,{angle:a,reach:e.reach})}}"
            "\n\nif(e.kind==='melee-hit'")
    replace("window.NeonRuntime.background(ctx,{w:W,h:H,cameraX:camera.x,cameraY:camera.y,viewW:VW,viewH:VH,palette:",
            "if(!window.NeonArsenalArt.drawArena(ctx,{faction:state.arenaFaction||state.sector?.faction,w:W,h:H,x:camera.x,y:camera.y,viewW:VW,viewH:VH,time,quality,reduced:reduce}))"
            "window.NeonRuntime.background(ctx,{w:W,h:H,cameraX:camera.x,cameraY:camera.y,viewW:VW,viewH:VH,palette:")
    replace("drawCoopExpansion(time,'ground');",
            "for(let i=arsenalRays.length-1;i>=0;i--){const ray=arsenalRays[i];ray.life-=dt;"
            "const owner=maps.players?.get(ray.owner),beam=window.NeonArsenal.byId(ray.weaponKind)?.ray==='beam';"
            "if(ray.life<=0||(beam&&(!owner||owner.down||!owner.connected||owner.gear?.[owner.slot]?.kind!==ray.weaponKind||(ray.owner===ticket&&(!fire||isBlocked()))))){arsenalRays.splice(i,1);continue}"
            "window.NeonArsenalArt.drawRay(ctx,ray,ray.life/ray.max,reduce||ray.quiet,quality)}"
            "arsenalArtFX.draw(ctx,dt,{quality,reduced:reduce,flash:bridge.flash?.(),intensity:window.NeonRuntime.effects(),visible:inView});"
            "for(const f of state.arsenalFields||[]){if(!inView(f,f.radius||20))continue;"
            "const item=window.NeonArsenal.byId(f.kind);if(!item)continue;"
            "ctx.strokeStyle=item.color;ctx.lineWidth=1.6;ctx.setLineDash([5,4]);ctx.beginPath();"
            "if(item.utilityMode==='sentry'||item.utilityMode==='barrier'||f.kind==='clockwork-sentry'){ctx.moveTo(f.x,f.y);ctx.arc(f.x,f.y,f.radius,f.angle-f.arc/2,f.angle+f.arc/2);ctx.closePath()}"
            "else ctx.arc(f.x,f.y,f.radius,0,Math.PI*2);"
            "ctx.stroke();ctx.setLineDash([]);ctx.save();ctx.translate(f.x-16,f.y);window.NeonArsenalArt.drawHeld(ctx,item,{quality,reduced:reduce,time});ctx.restore();"
            "ctx.fillStyle='#223640';ctx.font='10px monospace';ctx.textAlign='center';ctx.fillText((f.mode==='barrier'?Math.max(0,f.blocks)+' BLOCKS · ':'')+Math.max(0,Math.ceil(f.life))+'s',f.x,f.y+25);}"
            "drawCoopExpansion(time,'ground');")
    replace('if(p.slot<2){if(p.id===ticket)ctx.translate(-recoil,0);bridge.drawWeapon(ctx,p.activeSkin,pose);',
            'const arsenalGear=p.gear[p.slot],arsenalItem=window.NeonArsenal.byId(arsenalGear?.kind);'
            'if(p.slot<2){if(p.id===ticket)ctx.translate(-recoil,0);if(!window.NeonArsenalArt.drawHeld(ctx,arsenalItem,{...pose,heat:arsenalGear?.heat,charge:arsenalGear?.charge}))bridge.drawWeapon(ctx,p.activeSkin,pose);')
    replace("if(p.id===ticket&&now<previewUntil){ctx.fillStyle='#f4e6c4';",
            "if(!arsenalItem&&p.id===ticket&&now<previewUntil&&bridge.flash?.()!==false){ctx.fillStyle='#f4e6c4';")
    replace('}else if(p.slot===2)window.NeonCosmetics.drawMelee(ctx,p.gear[2].kind,pose);',
            '}else if(!window.NeonArsenalArt.drawHeld(ctx,arsenalItem,pose)&&p.slot===2)window.NeonCosmetics.drawMelee(ctx,p.gear[2].kind,pose);')
    replace("bridge.drawProjectile(ctx,s.skinId,{kind:s.kind,time,reduced:reduce||quiet,quality:bridge.quality?.()||'standard'});",
            "if(!window.NeonArsenalArt.drawProjectile(ctx,s.itemId||s.kind,{time,reduced:reduce||quiet,quality}))bridge.drawProjectile(ctx,s.skinId,{kind:s.kind,time,reduced:reduce||quiet,quality});")
    replace('window.NeonCosmetics.drawMeleeStrike(ctx,e.weaponKind,{reach:e.reach,arc:e.arc,angle:e.angle,progress:1-e.life/e.max,quality,reduced:reduce});',
            'const slashPose={reach:e.reach,arc:e.arc,angle:e.angle,progress:1-e.life/e.max,quality,reduced:reduce};'
            'if(!window.NeonArsenalArt.drawSlash(ctx,e.weaponKind,slashPose))window.NeonCosmetics.drawMeleeStrike(ctx,e.weaponKind,slashPose);')
    replace("if(!quiet&&!reduce&&(window.NeonRuntime?.effects?.()??1)>0&&ripples.length<24&&",
            "if(!quiet&&(!reduce||e.kind==='slash'&&arsenalItem)&&(window.NeonRuntime?.effects?.()??1)>0&&ripples.length<24&&")
    replace("operation:state?.enemies?.find(e=>e.boss)?.theme===1?'archive':state?.enemies?.find(e=>e.boss)?.theme===2?'grid':'relay',",
            "operation:state?.arenaFaction||state?.sector?.faction||(state?.enemies?.find(e=>e.boss)?.theme===1?'archive':state?.enemies?.find(e=>e.boss)?.theme===2?'grid':'relay'),")
    replace("const pixels=bridge.quality?.()==='low'?960:1280;",
            "const pixels=window.NeonArsenalArt.surfacePixels(bridge.quality?.(),width,window.devicePixelRatio);")
    replace("ctx.translate(-camera.x,-camera.y);if(!window.NeonArsenalArt.drawArena",
            "ctx.fillStyle='#e9eef0';ctx.fillRect(0,0,VW,VH);ctx.save();"
            "const amplitude=reduce||paused?0:clamp(shake*(bridge.shake?.()??1),0,5);"
            "ctx.translate(Math.sin(now*.062)*amplitude,Math.sin(now*.079+1.4)*amplitude*.65);"
            "ctx.translate(-camera.x,-camera.y);if(!window.NeonArsenalArt.drawArena")
    replace("ctx.save();if(!reduce&&shake>0&&bridge.shake?.()!==0){const amount=shake*(bridge.shake?.()??1);ctx.translate((Math.random()-.5)*amount,(Math.random()-.5)*amount)}",
            "")
    return source
