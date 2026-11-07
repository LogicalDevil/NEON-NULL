from pathlib import Path


def apply_workshop(script):
    stats = """
function arsenalStats(item) {
  const rows = [];
  if (!item.faction) return rows;
  if (Number.isFinite(item.range)) rows.push(['Effective range', item.range.toFixed(0)]);
  if (item.slot<2) {
    rows.push(['Rounds / trigger', String(item.ammoPerShot||1)]);
    rows.push(['Reload method', item.reloadMode==='incremental'?'One round at a time · fire to interrupt':'Complete cycle']);
    if(item.resource)rows.push(['Ammo', item.resource]);
  }
  if (item.chargeTime) rows.push(['Charge before firing', item.chargeTime.toFixed(2) + ' s']);
  if (item.heatPerShot && item.heatRecovery) {
    rows.push(['Heat / shot', (item.heatPerShot * 100).toFixed(0) + '%']);
    rows.push(['Cooling / second', (item.heatRecovery * 100).toFixed(0) + '%']);
    if (item.ray === 'beam') {
      const ticks = Math.min(item.magSize, Math.ceil(1 / item.heatPerShot));
      rows.push(['Firing time before a stop', (ticks * item.rate).toFixed(2) + ' s (full magazine, cold)']);
    }
  }
  if (item.penetration) rows.push(['Maximum targets pierced', String(item.penetration)]);
  if (item.radius) rows.push(['Effect radius / range', item.radius.toFixed(0)]);
  if (item.duration) rows.push(['Effect duration', item.duration.toFixed(1) + ' s']);
  if (item.utilityMode==='barrier') {
    rows.push(['Directional blocks', Math.round(item.power)]);
    rows.push(['Coverage',Math.round(item.arc*180/Math.PI)+'° · protects against projectiles']);
  }
  if (item.kind === 'clockwork-sentry'||item.utilityMode==='sentry') rows.push(['Tracking arc', Math.round(item.arc * 180 / Math.PI) + '°']);
  if (item.fuse) rows.push(['Fuse', item.fuse.toFixed(2) + ' s']);
  return rows;
}
"""
    anchor = "if(item.kind==='teleport')add('Effect','Move to aim point inside arena boundaries')}return rows}"
    if script.count(anchor) != 1:
        raise ValueError('Arsenal Workshop stats anchor missing')
    script = script.replace(anchor, anchor.replace('return rows}', 'return rows.concat(arsenalStats(item))}') + '\n' + stats)
    script = script.replace("selectedKey=entry.key;const {item,slot,index}=entry,",
        "selectedKey=entry.key;panel.querySelector('.ncb-test-item').hidden=!bridge.canTest?.();const {item,slot,index}=entry,")
    script = script.replace("if(slot<2&&window.NeonCosmetics)window.NeonCosmetics.drawWeapon(ctx,null,{weaponIndex:slot===0?index:(groups()[0]?.length||16)+index,",
        "if(window.NeonArsenalArt?.drawHeld(ctx,item,{reduced:true,quality:'low'})){}else if(slot<2&&window.NeonCosmetics)window.NeonCosmetics.drawWeapon(ctx,null,{weaponIndex:window.NeonArsenal?.skinIndex(slot,index)??index,")
    script = script.replace('iconCache.size>=60','iconCache.size>=256')
    script = script.replace('ctx.translate(38,30);ctx.scale(.95,.95);','ctx.translate(19,30);ctx.scale(.95,.95);')
    script = script.replace("visible=entries().filter(e=>(filter", "faction=panel.querySelector('.ncb-faction').value,visible=entries().filter(e=>(faction==='all'||(e.item.faction||'default')===faction)&&(filter")
    script = script.replace("e.item.name,e.item.kind,e.item.desc||''", "e.item.name,e.item.kind,e.item.role,e.item.desc||''")
    return script.replace("root.append(panel);const style=", """root.append(panel);const test=document.createElement('button');
const factionLabel=document.createElement('label'),factionSelect=document.createElement('select');
factionLabel.textContent='Faction';factionSelect.className='ncb-faction';factionSelect.append(new Option('All factions','all'));
for(const faction of window.NeonArsenal?.factions||[])factionSelect.append(new Option(faction.name,faction.id));
factionSelect.onchange=render;factionLabel.append(factionSelect);panel.querySelector('.ncb-tools').append(factionLabel);
test.type='button';test.className='btn ncb-test-item';test.textContent='Equip and test';test.hidden=true;
panel.querySelector('.ncb-standard').after(test);
test.onclick=()=>{const entry=itemEntry();if(entry&&bridge.canTest?.()){close();bridge.testItem(entry.slot,entry.index)}};
const style=""")


def apply(source):
    legacy, current = source.rsplit('</template>', 1)

    def replace(old, new):
        nonlocal current
        if current.count(old) != 1:
            raise ValueError(f'Arsenal loadout anchor missing or ambiguous: {old[:100]}')
        current = current.replace(old, new, 1)

    bridge = Path(__file__).with_name('arsenal-loadout-bridge.js').read_text(encoding='utf-8')
    replace('const allItems=()=>', bridge + '\nconst allItems=()=>')
    replace("if(raw.signalTrack&&", "if(raw.arsenal&&typeof raw.arsenal==='object')progression.arsenal=raw.arsenal;if(raw.signalTrack&&")
    replace('resetRunEquipment();closeRunArmory', 'resetRunEquipment();nnApplyFaction();closeRunArmory')
    replace("const returnToMenu=()=>{", "const returnToMenu=()=>{nnRestoreTrialProgress();nnBench=false;if(nnBenchPanel)nnBenchPanel.hidden=true;")
    replace("const tryCosmetic=item=>{closeCosmeticShop();",
            "const tryCosmetic=item=>{if(!nnTrialProgress)nnTrialProgress={exists:Object.hasOwn(progression,'signalTrack'),value:structuredClone(progression.signalTrack)};closeCosmeticShop();")
    replace("currentItems().findIndex(g=>g.cost>0)", "currentItems().findIndex((g,i)=>g.cost>0&&nnIsAvailable(g,activeSlot,i))")
    replace("currentItems().forEach((item,i)=>{const b=", """currentItems().forEach((item,i)=>{
      if(!nnIsAvailable(item,activeSlot,i)||!nnArmoryMatches(item))return;
      const b=""")
    replace("b.addEventListener('click',()=>{if(item.cost>0&&!creativeMode){unlockWeapon(i);return}selectLoadoutItem(i,true)});",
        "nnDecorateArmoryItem(b,item,i);b.addEventListener('focus',()=>nnInspectGear(item,i));b.addEventListener('click',()=>nnInspectGear(item,i));")
    replace("const items=currentItems(),item=items[i];if(!item)return false;", "const items=currentItems(),item=items[i];if(!item||!nnIsAvailable(item,activeSlot,i))return false;")
    replace("if(item.cost>0&&!creativeMode&&!force)", "if(item.cost>0&&!creativeMode&&!force&&!nnIsLoaned(activeSlot,i))")
    replace("if(creativeMode||items[i].cost===0){selectLoadoutItem(i,true);return}", "if(nnIsAvailable(items[i],activeSlot,i)&&(creativeMode||items[i].cost===0||nnIsLoaned(activeSlot,i))){selectLoadoutItem(i,true);return}")
    replace("const unlockWeapon=i=>{const item=currentItems()[i];if(!item||item.cost<=0)", "const unlockWeapon=i=>{const item=currentItems()[i];if(!item||!nnIsAvailable(item,activeSlot,i)||item.cost<=0)")
    current = current.replace("slotIndices[activeSlot]=i;if(activeSlot===0)weapon=i;", "slotIndices[activeSlot]=i;if(activeSlot===0)weapon=i;nnRememberFactionKit();")
    replace("const training=document.createElement('button');", "nnArsenalMenu();const training=document.createElement('button');")
    replace("hud();if(!creativePanel.hidden)updateCreativeItems()", "hud();if($('nn-armory-action')){nnInspectGear(currentItem(),slotIndices[activeSlot])}if(!creativePanel.hidden)updateCreativeItems()")
    replace("items:()=>categoryItems,notify:say,spendScrap:", "items:()=>categoryItems,canTest:()=>nnBench,testItem:(slot,index)=>{selectHotbarSlot(slot);selectLoadoutItem(index,true);nnBenchPanel.querySelector('button').click()},canModify:item=>creativeMode||(!(item.reloadLeft>0||item.chargeLeft>0||item.chargeReady||item.arsenalReady>clock||item.overheatUntil>clock)&&(nnFactionOf(item)===nnActiveFaction||categoryItems.some((items,slot)=>nnIsLoaned(slot,items.indexOf(item))))),notify:say,spendScrap:")
    replace("const captureExpedition=()=>({schema:1,hull", "const captureExpedition=()=>({schema:1,arsenalFaction:nnActiveFaction,hull")
    replace("gear:categoryItems.map(items=>items.map(item=>({...item})))", "gear:nnCheckpointGear()")
    replace("weapon=slotIndices[0];window.NeonCombatExpansion.restore(data.mods);",
            "weapon=slotIndices[0];nnActiveFaction=nnFaction(data.arsenalFaction).id;root.dataset.nnArsenal=nnActiveFaction;window.NeonCombatExpansion.restore(data.mods);")
    legacy = legacy.replace('PATCH NOTES · v6.0 · 1 NOV 2026</summary><ul>', 'PATCH NOTES · v6.8 · 7 NOV 2026</summary><ul><li>v6.8 · 7 Nov 2026 · Redesigned faction equipment, projectiles, balance, and Armory previews.</li><li>v6.7 · 7 Nov 2026 · Each new faction now has 40 items. Screen shake no longer moves the aim.</li><li>v6.6 · 7 Nov 2026 · The Five Arsenals adds four factions, Arsenal Relay, and a Workshop Test Bench.</li>', 1)
    return legacy + '</template>' + current
