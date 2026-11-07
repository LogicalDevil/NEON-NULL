def apply(client):
    def replace(old, new):
        nonlocal client
        if client.count(old) != 1:
            raise ValueError(f'Arsenal co-op anchor missing or ambiguous: {old[:100]}')
        client = client.replace(old, new, 1)

    bridge = """
const coopFactionKits = new Map();
function setupCoopArsenal() {
  const label = document.createElement('label');
  label.textContent = 'Arsenal faction';
  const select = document.createElement('select');
  select.id = 'nc-arsenal';
  for (const faction of window.NeonArsenal.factions) select.append(new Option(faction.name, faction.id));
  label.append(select);
  panel.querySelector('.nc-loadout').before(label);
  select.addEventListener('change', () => {
    const previous = select.dataset.active || 'default';
    coopFactionKits.set(previous, [0, 1, 2, 3].map(slot => $('gear-' + slot).value));
    populateCoopArsenal();
  });
}
function populateCoopArsenal() {
  const chooser = $('arsenal');
  const faction = chooser.value;
  const kit = coopFactionKits.get(faction);
  chooser.dataset.active = faction;
  for (let slot = 0; slot < 4; slot++) {
    const select = $('gear-' + slot);
    select.replaceChildren();
    for (const [index, item] of (catalog[slot] || []).entries()) {
      if ((item.faction || 'default') !== faction) continue;
      const option = new Option(item.name, index);
      option.title = item.desc || item.kind;
      select.append(option);
    }
    if (kit && Array.from(select.options).some(option => option.value === kit[slot])) select.value = kit[slot];
    refreshCoopMods(slot);
  }
  if (catalog.length && faction !== 'default' && !$('gear-0').options.length) {
    chooser.value = 'default';
    populateCoopArsenal();
  }
}
"""
    replace("function isBlocked(){return window.NeonSocial?.isOpen()||", "function isBlocked(){return window.NeonProfiles?.isOpen()||window.NeonDeveloperStudio?.isOpen()||window.NeonSocial?.isOpen()||")
    replace("if(window.NeonSocial?.isOpen()||window.NeonDeveloperStudio?.isOpen()||panel.hidden", "if(window.NeonProfiles?.isOpen()||window.NeonSocial?.isOpen()||window.NeonDeveloperStudio?.isOpen()||panel.hidden")
    replace("canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();pointerUV.x=clamp((e.clientX-r.left)/r.width,0,1);pointerUV.y=clamp((e.clientY-r.top)/r.height,0,1);aimWorld()});",
        "const updateCanvasPointer=e=>{const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;pointerUV.x=clamp((e.clientX-r.left)/r.width,0,1);pointerUV.y=clamp((e.clientY-r.top)/r.height,0,1);aimWorld()};canvas.addEventListener('pointermove',updateCanvasPointer);")
    replace("canvas.addEventListener('pointerdown',e=>{if(e.button===0", "canvas.addEventListener('pointerdown',e=>{updateCanvasPointer(e);if(e.button===0")
    replace("e.preventDefault();selectSlot(slot+(e.deltaY>0?1:-1))", "e.preventDefault();if(!isBlocked())selectSlot(slot+(e.deltaY>0?1:-1))")
    replace('function coopModView(', bridge + '\nfunction coopModView(')
    start = client.index("for(let s=0;s<4;s++){const select=$('gear-'+s);select.replaceChildren();")
    end = client.index('reconnectUntil=', start)
    client = client[:start] + 'populateCoopArsenal();' + client[end:]
    replace('setupCoopExpansion();buildBackground();', 'setupCoopExpansion();setupCoopArsenal();buildBackground();')
    replace("for(let i=0;i<4;i++)$('gear-'+i).disabled=room.state!=='lobby'||local?.ready===true;", "$('arsenal').disabled=room.state!=='lobby'||local?.ready===true;for(let i=0;i<4;i++)$('gear-'+i).disabled=$('arsenal').disabled;")
    replace("gear:[0,1,2,3].map(i=>Number($('gear-'+i).value)),role:", "gear:[0,1,2,3].map(i=>Number($('gear-'+i).value)),faction:$('arsenal').value,role:")
    replace("weaponIndex=slot===0?index:slot===1?(catalog[0]?.length||16)+index:-1", "weaponIndex=window.NeonArsenal.skinIndex(slot,index)")
    return client
