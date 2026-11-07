"""Attach Arsenal presentation to the current game's existing render and audio paths."""


def apply(source):
    start = source.rindex("const root=document.getElementById('word-blaster'),$=id=>root.querySelector('#'+id),loading=$('wb-loading'),login=$('wb-login-screen'),game=$('wb-game')")
    head, game = source[:start], source[start:]
    if 'const arsenalArtFX=' in game:
        return source

    def replace(old, new):
        nonlocal game
        if game.count(old) != 1:
            raise ValueError(f'Arsenal art integration anchor changed: {old}')
        game = game.replace(old, new, 1)

    replace('const meleeImpactFX=window.NeonCombatFX.create();',
            'const meleeImpactFX=window.NeonCombatFX.create();const arsenalArtFX=window.NeonArsenalArt.createFX();')
    replace('craters=[];meleeImpactFX.clear();localImpactPause=0;',
            'craters=[];meleeImpactFX.clear();arsenalArtFX.clear();localImpactPause=0;')
    replace('const returnToMenu=()=>{', 'const returnToMenu=()=>{arsenalArtFX.clear();')
    replace('const sector=window.NeonSector?.presentation?.();return online?.active?online:',
            'const sector=window.NeonSector?.presentation?.();const arsenalScore=window.NeonArsenalRelay?.presentation?.();return online?.active?online:')
    replace("operation:missionId==='breach'?'grid':missionId,powered:!!sector?.powered,status:missionState,warning:spawnWarning>0||!!foes.find(e=>e.bossWarning)",
            "operation:arsenalScore?.faction||(missionId==='breach'?'grid':missionId),powered:!!sector?.powered,status:arsenalScore?.phase==='extract'?'extraction':missionState,warning:!!arsenalScore?.warning||spawnWarning>0||!!foes.find(e=>e.bossWarning)")
    replace("const pixels=graphicsQuality==='low'?960:1280;canvas.width=pixels;canvas.height=pixels*9/16;ctx.setTransform(pixels/viewW,0,0,pixels/viewW,0,0);",
            'syncArsenalSurface(graphicsQuality,b.width);')
    replace('const resize=()=>{',
            'let lastArsenalCanvasWidth=900;const syncArsenalSurface=(quality,displayWidth=lastArsenalCanvasWidth)=>{'
            'lastArsenalCanvasWidth=displayWidth;const pixels=window.NeonArsenalArt.surfacePixels(quality,displayWidth,window.devicePixelRatio);'
            'if(canvas.width!==pixels||canvas.height!==pixels*9/16){canvas.width=pixels;canvas.height=pixels*9/16}'
            'ctx.setTransform(pixels/900,0,0,pixels/900,0,0)};const resize=()=>{')
    replace('try{renderFrame(now)}catch(error){',
            'try{syncArsenalSurface(graphicsQuality);renderFrame(now)}catch(error){')
    replace("window.NeonCosmetics.drawProjectile(ctx,b.skinId,{kind:b.kind,radius:b.r,time:clock,reduced,quality:graphicsQuality});",
            'if(!window.NeonArsenalArt.drawProjectile(ctx,b.itemId||b.kind,{time:clock,reduced,quality:graphicsQuality}))'
            'window.NeonCosmetics.drawProjectile(ctx,b.skinId,{kind:b.kind,radius:b.r,time:clock,reduced,quality:graphicsQuality});')
    replace('const directKill=e.hp<=0;if(directKill)',
            "arsenalArtFX.event('impact',b.itemId||b.kind,b.x,b.y,{angle:Math.atan2(b.vy,b.vx)});const directKill=e.hp<=0;if(directKill)")
    replace("window.NeonRuntime.record('fire');updateHotbar();return true};",
            "if(gun.faction){const muzzle=window.NeonArsenalArt.muzzleOffset(gun)-weaponKick;arsenalArtFX.event('fire',gun,px+Math.cos(base)*muzzle,py+Math.sin(base)*muzzle,{angle:base});"
            "if(gun.ventDuration&&ammoOwner.overheatUntil>clock)arsenalArtFX.event('vent',gun,px,py,{angle:base})}"
            "window.NeonRuntime.record('fire');updateHotbar();return true};")
    replace('window.NeonCosmetics.drawMeleeStrike(ctx,meleeSlash.kind,{angle:meleeSlash.angle,reach:meleeSlash.reach,arc:meleeSlash.arc,progress:meleeSlash.t/meleeSlash.life,reduced,quality:graphicsQuality});',
            'const strikePose={angle:meleeSlash.angle,reach:meleeSlash.reach,arc:meleeSlash.arc,progress:meleeSlash.t/meleeSlash.life,reduced,quality:graphicsQuality};'
            'if(!window.NeonArsenalArt.drawSlash(ctx,meleeSlash.kind,strikePose))window.NeonCosmetics.drawMeleeStrike(ctx,meleeSlash.kind,strikePose);')
    replace("meleeImpactFX.hit(e.x,e.y,item.kind,angle,e.r);",
            "arsenalArtFX.event('impact',item,e.x,e.y,{angle});meleeImpactFX.hit(e.x,e.y,item.kind,angle,e.r);")
    replace('if(activeSlot===2)window.NeonCosmetics.drawMelee(ctx,meleeWeapons[slotIndices[2]].kind,cosmeticPose);else window.NeonCosmetics.drawWeapon(ctx,equippedSkin,{...cosmeticPose,weaponIndex:gunIndex,reload:heldGun?.reloadLeft>0?1-heldGun.reloadLeft/(heldGun.reloadTotal||heldGun.reloadDuration):0});',
            'const arsenalPose={...cosmeticPose,slot:activeSlot,reload:heldGun?.reloadLeft>0?1-heldGun.reloadLeft/(heldGun.reloadTotal||heldGun.reloadDuration):0};'
            'if(!window.NeonArsenalArt.drawHeld(ctx,currentItem(),arsenalPose)){if(activeSlot===2)window.NeonCosmetics.drawMelee(ctx,meleeWeapons[slotIndices[2]].kind,cosmeticPose);'
            'else window.NeonCosmetics.drawWeapon(ctx,equippedSkin,{...arsenalPose,weaponIndex:gunIndex})}')
    replace('meleeImpactFX.draw(ctx,playing&&!paused?dt:0,',
            'arsenalArtFX.draw(ctx,playing&&!paused?dt:0,{quality:graphicsQuality,reduced,flash:flashEnabled,intensity:window.NeonRuntime.effects(),'
            'visible:(p,r)=>p.x+r>=cameraX&&p.x-r<=cameraX+viewW&&p.y+r>=cameraY&&p.y-r<=cameraY+viewH});'
            'meleeImpactFX.draw(ctx,playing&&!paused?dt:0,')
    return head + game
