"""Install Arsenal Relay's native engine hooks without touching the legacy template."""
from pathlib import Path
import sys


def integrate(source, work):
    marker = '/* Bound to the primary game closure by integrate-arsenal-relay.py. */'
    at = source.rfind('</template>') + len('</template>')
    head, current = source[:at], source[at:]
    if marker in current:
        start = current.index(marker)
        end = current.index('const buildButton=document.createElement', start)
        current = current[:start] + current[end:]

    def hook(before, after):
        nonlocal current
        if after in current:
            return
        if current.count(before) != 1:
            raise ValueError(f'Arsenal Relay integration anchor must be unique: {before[:110]}')
        current = current.replace(before, after, 1)

    active = 'window.NeonArsenalRelay?.active()'
    relay = 'window.NeonArsenalRelay'
    if 'const spawnEnemy=(type=null,xOverride=null,yOverride=null,random=Math.random)' not in current:
        start = current.index('const spawnEnemy=(type=null,xOverride=null,yOverride=null)')
        end = current.index('const missionSpawnPools=', start)
        spawn = current[start:end].replace('Math.random()', 'random()').replace('yOverride=null)=>', 'yOverride=null,random=Math.random)=>', 1)
        current = current[:start] + spawn + current[end:]
    hook("if(raw.sectorReceipts&&typeof raw.sectorReceipts==='object')", "if(raw.arsenalRelay&&typeof raw.arsenalRelay==='object'&&!Array.isArray(raw.arsenalRelay))progression.arsenalRelay=raw.arsenalRelay;if(raw.sectorReceipts&&typeof raw.sectorReceipts==='object')")
    hook('window.NeonRuntime.cancelTutorial?.();window.NeonSector.stop();',
         f"{relay}?.stop();$('nar-next-trial').hidden=true;window.NeonRuntime.cancelTutorial?.();window.NeonSector.stop();")
    hook("const endRun=(failure='hull depleted')=>{if(isSector())",
         f"const endRun=(failure='hull depleted')=>{{if({active}){{{relay}.playerDied(failure);return}}if(isSector())")
    hook("else endRun('hull depleted')", "else endRun('Hull depleted · '+reason)")
    hook("onEvent:(type,payload)=>window.NeonTrack.record(type,{slot:activeSlot,eventId:activeRunId+':'+type+':'+(++trackEventSerial)})", f"onEvent:(type,payload)=>{{if(type==='interrupt'&&payload?.weapon?.kind==='infantry-bayonet'){relay}?.mastery('bayonet-counter');window.NeonTrack.record(type,{{slot:activeSlot,eventId:activeRunId+':'+type+':'+(++trackEventSerial)}})}}")
    hook("if(isSector()){const info=window.NeonSector.hud?.();", f"if({active}){{const info={relay}.hud();el.textContent=info.title.toUpperCase()+' · '+info.goal;if(progress)progress.textContent='ARSENAL RELAY · '+Math.floor(info.time/60)+':'+String(info.time%60).padStart(2,'0')+(info.foreign?' · SALVAGED ITEM':'');if(boss)$('wb-boss-hud').querySelector('.boss-label b').textContent=info.boss.toUpperCase();return}}if(isSector()){{const info=window.NeonSector.hud?.();")
    hook('foes.splice(index,1);if(sectorKill', f"foes.splice(index,1);if({active}){{{relay}.enemyKilled(e);if(e.type.id==='signal-core'){{hud();return}}}}if(sectorKill")
    hook('const set=bossAttackSets[bossTheme]||bossAttackSets.relay', 'const set=e.arsenalAttacks||bossAttackSets[bossTheme]||bossAttackSets.relay')
    hook("const bossNameFor=theme=>theme==='archive'?'ARCHIVE SENTINEL':theme==='breach'?'CORE BREAKER':'SIGNAL WARDEN'", f"const bossNameFor=theme=>{relay}?.describeBoss()?.boss.toUpperCase()||(theme==='archive'?'ARCHIVE SENTINEL':theme==='breach'?'CORE BREAKER':'SIGNAL WARDEN')")
    hook("(bossTheme!=='breach'||creativeMode||generatorsDisabled())", "(bossTheme!=='breach'||creativeMode||!!e.arsenalBoss||generatorsDisabled())")
    before = 'drawEnemy(e);drawEnemyBadge(e)'
    after = f'if(!{relay}?.drawBoss(ctx,e,{{quality:graphicsQuality,time:clock,reduced,flash:flashEnabled}}))drawEnemy(e);drawEnemyBadge(e)'
    if after not in current:
        if current.count(before) != 2:
            raise ValueError('Arsenal Relay needs both native enemy render paths')
        current = current.replace(before, after)
    hook('window.NeonSector.tick(dt,{player,enemies:foes,hull,paused,playing,w,h,damageSerial});', f'{relay}?.tick(dt,{{player,enemies:foes,hull,paused,playing,w,h,viewW,viewH,cameraX,cameraY}});window.NeonSector.tick(dt,{{player,enemies:foes,hull,paused,playing,w,h,damageSerial}});')
    hook('window.NeonRuntime.background(ctx,{w,h,cameraX,cameraY,viewW,viewH,palette', f'if(!{relay}?.drawArena(ctx,{{w,h,cameraX,cameraY,viewW,viewH,time:clock,quality:graphicsQuality,reduced}}))window.NeonRuntime.background(ctx,{{w,h,cameraX,cameraY,viewW,viewH,palette')
    hook('drawArenaEvent();drawMissionTargets();', f'drawArenaEvent();if(!{active})drawMissionTargets();')
    hook('drawEnemyWarnings();drawBossWarnings();', f'drawEnemyWarnings();drawBossWarnings();{relay}?.drawWarnings(ctx,{{cameraX,cameraY}});')
    hook("$('wb-restart').addEventListener('click',()=>{if(isSector())", f"$('wb-restart').addEventListener('click',()=>{{if({active}){{{relay}.restart();return}}if(isSector())")
    hook('const buildButton=document.createElement', (work / 'arsenal-relay-bridge.js').read_text(encoding='utf-8') + '\nconst buildButton=document.createElement')
    return head + current


if __name__ == '__main__':
    root = Path(__file__).resolve().parent
    if len(sys.argv) != 3:
        raise SystemExit('Usage: integrate-arsenal-relay.py INPUT OUTPUT')
    origin, destination = map(Path, sys.argv[1:])
    destination.write_text(integrate(origin.read_text(encoding='utf-8'), root), encoding='utf-8')
