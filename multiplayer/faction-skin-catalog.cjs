/* Cosmetic-only, stable bindings. Shared by the browser and server manifest. */
(function(root){
  'use strict';
  const arsenal=typeof module==='object'&&module.exports?require('./arsenal-catalog.cjs'):root.NeonArsenal;
  const definitions=[
    ['aurora-interferometer','Aurora Interferometer','prism-lance','Divine','aurora',['#eefcff','#17254c','#64ffe8','#c07aff'],'Three transparent focusing rings and suspended ceramic petals align around an aurora chamber.','Glass, pearl ceramic, refractive silver','Synchronized ring alignment and interference bands'],
    ['event-horizon-array','Event Horizon Array','vector-railgun','Legendary','horizon',['#17203e','#090e20','#cfa6ff','#6ee4ff'],'Open split rails cradle a suspended core and a constellation of small lens plates.','Obsidian alloy, optical crystal, violet filaments','Lens plates open during charge and collapse on discharge'],
    ['stormglass-circuit','Stormglass Circuit','arc-projector','Epic','stormglass',['#e0f6fa','#1b3d59','#4ce0ff','#efb8ff'],'Twin conductor horns frame a faceted stormglass capsule with branching silver veins.','Stormglass, ceramic, polished silver','A short braided electrical corona follows a real contact'],
    ['dawnfold-edge','Dawnfold Edge','phase-blade','Legendary','dawnfold',['#f3edff','#27234e','#ff9ce8','#71fff2'],'A crescent of layered translucent plates wraps the original phase edge.','Iridescent glass, white titanium, rose-gold guard','Segmented edge lights trace the actual slash'],
    ['seraphim-screen','Seraphim Screen','hardlight-screen','Epic','seraphim',['#f5f5ff','#192342','#ffe49a','#81eafa'],'A folding emitter has six small geometric vanes and an engraved central aperture.','White enamel, hardlight, champagne metal','Vanes unfold along the barrier’s real coverage'],
    ['midnight-cartographer','Midnight Cartographer','line-musket','Legendary','cartographer',['#3b2445','#211925','#edbd63','#c2dce8'],'A polished walnut stock carries a fine original map motif and brass compass fittings.','Dark walnut, engraved iron, aged brass','Map lines catch a warm lock spark and loading stroke'],
    ['crimson-admiralty','Crimson Admiralty','deck-blunderbuss','Epic','admiralty',['#842b43','#2a1f29','#e1ba69','#fff0c7'],'Burgundy lacquer, a reinforced scalloped muzzle, and carved wave panels frame the broad barrel.','Lacquer, weathered brass, carved walnut','A brief amber plume clears around the wide muzzle'],
    ['phoenix-reliquary','Phoenix Reliquary','flintlock-pistol','Rare','phoenix',['#702b31','#241d22','#ffc173','#f2deae'],'A compact flintlock wears feather engraving, a gold lock plate, and a dark red grip.','Burnished steel, red lacquer, gilt engraving','Tiny feather sparks mark ignition without hiding the shot'],
    ['gilded-duelist','Gilded Duelist','officers-sabre','Epic','duelist',['#e9c786','#302338','#c98e54','#e3c4ef'],'An ornate basket guard and engraved spine preserve the sabre’s recognizable curve.','Gilded steel, leather, violet cloth','Fine gold segments follow the saber arc'],
    ['astral-powder-chest','Astral Powder Chest','powder-satchel','Legendary','astral',['#273f61','#182335','#d9ac58','#a9e1ed'],'A compact brass-bound powder chest has dark-blue panels and a small mechanical star dial.','Blue lacquer, brass clasps, stitched leather','The fuse dial turns once and the detonation leaves brief star fragments'],
    ['thunderbird-circuit','Thunderbird Circuit','trail-repeater','Legendary','thunderbird',['#1a858c','#193842','#dc9c5a','#b5f5ed'],'Turquoise enamel panels, dark steel, and layered wing engraving surround the lever action.','Turquoise enamel, steel, copper, warm wood','Lever movement opens a copper mechanism and short feather tracers'],
    ['sunset-cathedral','Sunset Cathedral','coach-gun','Epic','sunset',['#a45b54','#302838','#ffd298','#9de4db'],'A copper barrel brace and amber stained-enamel panels sit above a warm saddle-leather stock.','Copper, amber enamel, saddle leather','Barrel bands illuminate with each actual shell discharge'],
    ['copper-eclipse','Copper Eclipse','marshal-revolver','Legendary','eclipse',['#b76a42','#26303d','#f5cf7b','#5dd6d5'],'An exposed copper cylinder, circular eclipse inlay, and dark frame emphasize its mechanics.','Copper, blued steel, black leather','A restrained arc follows the cylinder through reload'],
    ['desert-opal','Desert Opal','bowie-knife','Rare','opal',['#e3c7a0','#403a42','#6ee1d5','#df9ae8'],'An opal inset and carved sandstone-colored grip accent the heavy Bowie profile.','Opal, weathered steel, carved bone-like ceramic','A compact prismatic edge flicker follows close strikes'],
    ['prospectors-meteor','Prospector’s Meteor','stick-of-dynamite','Epic','meteor',['#a95d45','#38272b','#ffd27d','#d6f4ee'],'Three wrapped charges carry copper braces, tiny mineral insets, and a readable fuse.','Canvas wrap, copper, mineral glass','A single fuse sparkle leads to warm mineral fragments'],
    ['royal-boiler','Royal Boiler','steam-riveter','Legendary','boiler',['#244d8c','#202e3c','#e5bd62','#8de7d0'],'Cobalt enamel plates surround a brass boiler, tall pressure gauge, and visible piston travel.','Cobalt enamel, aged brass, colored pressure glass','A real pressure rise moves the gauge and releases a short directional vent'],
    ['cathedral-engine','Cathedral Engine','gearcaster','Divine','cathedral',['#246b58','#23342f','#f4d181','#9df4c6'],'An emerald-glass feed chamber and engraved flying braces expose the gear train.','Emerald glass, engraved brass, dark iron','Toothed disc rings and compact clockwork sparks follow real bounces'],
    ['chronometer-piston','Chronometer Piston','pocket-piston','Epic','chronometer',['#657b86','#26363b','#eac577','#b6e9eb'],'A silver-blue clock dial, brass piston sleeve, and copper trigger assembly create a compact mechanism.','Brushed steel, brass, blue enamel','The dial ticks once per shot and the piston returns in recovery'],
    ['emerald-pendulum','Emerald Pendulum','piston-pike','Legendary','pendulum',['#2b775d','#263730','#e1bd77','#a4f4d0'],'An emerald counterweight, long engraved sleeve, and hinged brass guard follow the extension mechanism.','Emerald glass, brass, iron, green leather','A small pendulum and edge bands respond to the actual stroke'],
    ['aurelian-automaton','Aurelian Automaton','clockwork-sentry','Divine','automaton',['#b99a4d','#283a3b','#fce3a1','#9deadd'],'Aurelian brass armor, folding legs, and a pale teal optical head refine the sentry silhouette.','Gold-toned brass, pale enamel, teal optical glass','The targeting aperture and small flywheels animate within the firing arc']
  ];
  const prices={Rare:2880,Epic:4000,Legendary:5100,Divine:6200};
  const items=definitions.map(([slug,name,weaponId,rarity,design,palette,finish,materials,animation])=>{
    const weapon=arsenal.byId(weaponId);
    if(!weapon)throw Error('Faction skin weapon missing: '+weaponId);
    return Object.freeze({
      id:'skin-faction-'+slug,name,weaponId,faction:weapon.faction,slot:weapon.slot,index:weapon.index,
      weaponIndex:1000+weapon.slot*1000+weapon.index,kind:'weapon',rarity,odds:0,directOnly:true,
      cost:prices[rarity],color:palette[2],finish,materials,animation,design,palette:Object.freeze(palette),
      sound:'skin-sfx-faction-'+slug,unlockRoute:'Cosmetic Exchange · direct scrap purchase',
      effect:design+' muzzle, trail, impact, and action accents'
    });
  });
  const lookup=new Map(items.map(item=>[item.id,item]));
  const weaponLookup=new Map(items.map(item=>[item.weaponIndex,arsenal.byId(item.weaponId)]));
  const byId=id=>lookup.get(typeof id==='object'?id?.id:id)||null;
  const forWeapon=weaponId=>items.filter(item=>item.weaponId===weaponId);
  const compatible=(skinId,weaponId)=>byId(skinId)?.weaponId===weaponId;
  const weaponForIndex=index=>weaponLookup.get(Number(index))||null;
  const api={items,byId,forWeapon,compatible,weaponForIndex};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.NeonFactionSkinCatalog=api;
})(typeof window==='object'?window:globalThis);
