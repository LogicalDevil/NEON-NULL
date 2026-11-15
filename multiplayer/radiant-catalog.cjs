/* Original Radiant collection definitions and canonical case probabilities. */
(function(root) {
  'use strict';
  const arsenal = typeof module === 'object' && module.exports ? require('./arsenal-catalog.cjs') : root.NeonArsenal;
  const rarityOrder = ['Common','Uncommon','Rare','Epic','Legendary','Divine'];
  const tierOdds = Object.freeze({Common:12.84,Uncommon:35,Rare:25.05,Epic:13.91,Legendary:8.52,Divine:4.68});
  const prices = Object.freeze({Common:1100,Uncommon:1600,Rare:2400,Epic:4000,Legendary:5200,Divine:6400});
  const nativeKinds = [
    ['bolt','rapid','tri','rail','burst','arc','nova','seek','sniper','lance','burst-rifle','revolver','auto-shotgun','grenade','ricochet-cannon','beam'],
    ['flare','dagger','ricochet','emp','seek','burst','boomer','tether','black','shard'],
    ['fist','knife','dual','sword','greatsword','scythe','spear','baton','hammer','drill'],
    ['medkit','horn','warpgrenade','shield','decoy','teleport','ammo','overclock','repair','timeslow']
  ];
  const nativeNames = [
    ['Pulse Rifle','Rapid SMG','Triad Shotgun','Piercer Railgun','Burst Carbine','Arc Rifle','Nova Cannon','Seeker Launcher','Sniper','Charge Lance','Burst Rifle','Heavy Revolver','Auto Shotgun','Grenade Launcher','Ricochet Cannon','Beam Carbine'],
    ['Flare Pistol','Throwing Daggers','Ricochet Disc','EMP Sidearm','Seeker Darts','Scatter Pistol','Boomerang Blade','Tether Harpoon','Singularity','Shard Launcher'],
    ['Fists','Combat Knife','Dual Daggers','Short Sword','Greatsword','Scythe','Spear','Energy Baton','Shock Hammer','Rotary Drill'],
    ['Medkit','War Horn','Warpstone Grenade','Portable Shield','Decoy Beacon','Teleport Beacon','Ammo Cache','Overclock Injector','Repair Drone','Time-Slow Pulse']
  ];
  const factionArt = {
    default:{collection:'Signal Atelier',theme:'alloy',palette:['#bbcbd8','#182b3c','#72e0ff','#f8f1d6'],materials:'Brushed silver, dark ceramic, luminous glass'},
    spectrum:{collection:'Optical Reliquaries',theme:'optical',palette:['#dcecff','#272043','#8bfbf1','#d7a2ff'],materials:'Optical glass, pearl ceramic, silver filaments'},
    blackpowder:{collection:'Crown & Compass',theme:'historical',palette:['#473050','#241f2c','#f6c46c','#e2eff0'],materials:'Engraved iron, walnut, gold inlay, lacquer'},
    frontier:{collection:'Sundown Artisans',theme:'frontier',palette:['#995c42','#24384a','#f4c67a','#8be1d4'],materials:'Blued steel, copper, saddle leather, colored enamel'},
    brassworks:{collection:'Imperial Mechanisms',theme:'brass',palette:['#c2a35c','#213b39','#91efd1','#f7dda0'],materials:'Oxidized brass, vivid enamel, pressure glass, copper'}
  };
  // One concept per item. Geometry and effects consume the authored variant and theme.
  const weaponRows = {
    default:[
      ['default:0:0','Mercury Circuit','Split silver receiver with inset blue conductor rails','A silver-blue pulse and reload light sweep'],
      ['default:0:2','Porcelain Tempest','Three porcelain barrel sleeves and a reinforced slate grip','Three short ice-white muzzle fans'],
      ['default:0:3','Nightglass Surveyor','An open dark rail and a suspended amber rangefinder','A narrow gold trace and concentric contact rings'],
      ['default:0:13','Cinder Observatory','An armored telescope drum around a copper launch chamber','Warm ember fragments clear after the blast'],
      ['default:0:15','Polar Meridian','Forked silver fins enclose a cyan prism spine','A restrained auroral edge follows the real ray'],
      ['default:1:0','Violet Lantern','A violet glass capsule sits inside a protective metal lantern','A small lantern spark marks each accepted flare'],
      ['default:1:1','Silverwing Dispatch','Folded wing guards flank three polished throwing blades','Thin segmented ribbons follow the flying blades'],
      ['default:1:2','Chromatic Compass','An engraved directional dial surrounds a segmented disc rim','A compass glimmer appears at real ricochets'],
      ['default:1:3','Deepwater Dynamo','A dark pressure shell exposes a blue induction coil','Short braided electrical filaments mark contact'],
      ['default:2:0','Pearl Knuckles','Four pearl plates protect a dark articulated glove','Paired impact stars follow real fist contact'],
      ['default:2:5','Moonlit Requiem','A layered crescent blade hangs from a silver segmented haft','A pale crescent traces the actual sweep'],
      ['default:2:9','Obsidian Foundry','Blackened steel, copper bearings and an amber rotary head','Directional metal sparks follow actual drill hits'],
      ['default:3:0','Sanctuary Module','White shutters surround illuminated repair components','Successful healing opens a soft repair ring'],
      ['default:3:3','Citadel Bloom','Petal-like emitter plates fold around a glass shield core','An outlined geometric blossom marks activation']
    ],
    spectrum:[
      ['photon-carbine','Lucent Navigator','A translucent sight bridge rests over split ceramic panels','Precise cyan bands flow toward the emitter'],
      ['prism-lance','Cathedral of Light','Layered glass facets surround a segmented focusing assembly','Facets align with a bright interference-edged beam'],
      ['vector-railgun','Silent Aphelion','Suspended black rails cradle a pale orbital lens','A sharp violet discharge leaves tiny contact rings'],
      ['spectrum-helix-driver','Ribbon Helios','Twin spiral fins expose a gold photon conduit','Two decorative filaments braid along the shot'],
      ['spectrum-zero-line-rifle','Glass Horizon','A thin transparent upper rail floats above a dark receiver','A white line separates into short optical ticks'],
      ['ion-sidearm','Halo Courier','A circular ceramic breech carries three inset ion windows','A brief segmented halo follows accepted firing'],
      ['spectrum-quark-needle','Quicksilver Spire','A needle emitter extends from a faceted silver pressure case','Short diamond motes mark the narrow discharge'],
      ['spectrum-cryo-cell','Winter Lantern','Frosted glass cells sit inside a small porcelain cage','Frost-shaped edge sparks clear before warnings'],
      ['spectrum-afterimage-pistol','Lucid Echo','Offset mirror plates form an asymmetric optical grip','Two faint decorative echoes follow the real shot'],
      ['phase-blade','Roselight Lattice','A rose-gold guard supports overlapping luminous blade plates','A segmented pink edge traces the real slash'],
      ['spectrum-vector-glaive','Orbiting Anthem','Three glass fins encircle a long ceramic blade socket','Sparse orbital marks follow the glaive stroke'],
      ['spectrum-ion-talons','Storm Harp','Curved conductor claws surround a dark insulated knuckle frame','Tiny arcs connect the tips during real contact'],
      ['hardlight-screen','Opaline Pavilion','A folding opal emitter opens six ceramic roof-like vanes','The vanes project a restrained geometric outline'],
      ['spectrum-repair-prism','Lifeline Crystal','A clear repair prism floats in a small articulated cradle','A brief rising crystal lattice accompanies activation']
    ],
    blackpowder:[
      ['line-musket','Royal Nightfall','Indigo lacquer and gold inlays run through an engraved walnut stock','A golden lock spark leads a short gray-violet plume'],
      ['rifled-carbine','Mapmakers Oath','A leather cheek rest and compass engraving frame the long iron barrel','Tiny compass marks catch ignition light'],
      ['deck-blunderbuss','Admirals Tempest','A scalloped brass muzzle rises above a deep navy naval stock','A warm powder fan briefly reveals wave motifs'],
      ['blackpowder-volley-musket','Ivory Procession','Ivory-colored barrel bands line a silver multi-barrel assembly','Each committed volley lights one barrel band'],
      ['blackpowder-fowling-piece','Autumn Emissary','Carved walnut leaves wrap a narrow russet steel barrel','Short feather-shaped sparks accompany the powder cone'],
      ['flintlock-pistol','Gilded Promise','A polished lock plate joins a carved pale grip and dark barrel','A small gold star marks the lock ignition'],
      ['blackpowder-pepperbox','Crown Carousel','Six engraved chambers sit within an ornate brass collar','Chamber highlights advance with the firing pattern'],
      ['blackpowder-rook-pistol','Rook of Midnight','A rook-shaped sight crowns an ink-black lacquer frame','A restrained square glimmer marks discharge'],
      ['blackpowder-signal-flintlock','Rosewood Beacon','A rosewood grip supports a bronze signal cup and ribbon fitting','A warm signal spark unfolds into a tiny crest'],
      ['officers-sabre','Coronation Edge','A swept gold basket guard meets an engraved blue-steel blade','Fine gold dashes follow the sabre arc'],
      ['infantry-bayonet','Silver Standard','A silver socket and crimson binding reinforce the triangular blade','A short silver needle trail follows the thrust'],
      ['blackpowder-naval-boarding-axe','Tidebound Relic','A broad iron head carries mother-of-pearl wave inlays','Compact salt-white fragments mark an actual impact'],
      ['field-dressing','Royal Field Kit','A crimson medical roll uses gold clasps and pale linen wraps','A neat pale cross projection accompanies use'],
      ['powder-satchel','Celestial Magazine','A navy powder chest displays an engraved brass star chart','A turning fuse dial leads brief star-shaped fragments']
    ],
    frontier:[
      ['trail-repeater','Sunline Express','A copper lever and turquoise inlays cross a worn walnut receiver','A narrow warm tracer has a short feather accent'],
      ['coach-gun','Copper Sundial','Twin copper barrels sit over an amber enamel shell plate','Paired muzzle stars reveal a sunburst engraving'],
      ['longhorn-rifle','White Mesa','Pale carved grips frame a dark steel barrel and brass scope','A thin desert-white streak follows the shot'],
      ['frontier-buffalo-sharps','Northern Claim','A reinforced slate stock carries silver mountain engraving','Small angular silver motes mark heavy discharge'],
      ['frontier-pump-scattergun','Canyon Marigold','Orange enamel and leather straps define the pump assembly','A short petal fan follows the actual pellet pattern'],
      ['marshal-revolver','Solar Outlaw','Copper engraving and ivory-colored grips surround a warm cylinder','A mechanical light sweep and small sunburst accent'],
      ['pocket-derringer','Pocket Aurora','A tiny teal frame carries a polished twin-barrel silver crown','A compact paired glimmer accompanies firing'],
      ['frontier-schofield-breaktop','Railway Duchess','A violet enamel cylinder and gold hinge shape the break-top frame','A restrained hinge glint marks the reload'],
      ['frontier-canyon-ricochet','Echo Spur','A leather-wrapped grip supports blue steel and a copper spur sight','Small spur-shaped flashes mark real bounce contacts'],
      ['bowie-knife','Moonstone Bowie','A moonstone pommel balances a broad engraved steel blade','A cool edge glimmer follows the short strike'],
      ['frontier-stock-whip','Copper Serpent','Copper-woven leather coils around a silver serpent handle','A sparse copper ribbon follows the actual whip path'],
      ['frontier-prospector-pick','Opal Claim','An opal sighting stone sits in a dark reinforced pick head','Small mineral chips mark actual contact'],
      ['signal-flare','Sundown Promise','A brass signal housing carries a crimson enamel sunset plate','A short golden signal ring marks activation'],
      ['frontier-lookout-rig','Sentinel of the Mesa','A copper-framed lookout device uses a turquoise optical eye','A narrow mechanical halo signals readiness']
    ],
    brassworks:[
      ['steam-riveter','Sovereign Pressure','Deep cobalt enamel surrounds a tall brass pressure chamber','Piston glints and a short directional vent follow action'],
      ['gearcaster','Clockwork Eclipse','An aged brass feed cage exposes an emerald gear train','A mechanical glimmer marks each real disc contact'],
      ['pressure-coil','Verdigris Dynamo','Oxidized copper rings wrap a violet glass pressure core','Small teal filaments follow the coil discharge'],
      ['brassworks-rotary-stapler','Crimson Escapement','A crimson drum and brass timing wheel frame the rotary feeder','The feed wheel advances with accepted firing'],
      ['brassworks-governor-needle','Pendulum Regent','A long copper needle extends beside an exposed governor dial','Short clock ticks trace the precise projectile'],
      ['pocket-piston','Pocket Coronation','A polished brass piston carries a cobalt sleeve and crown valve','A compact gold piston flash accompanies discharge'],
      ['valve-sprayer','Jade Bellows','Jade enamel chambers connect through exposed copper valves','A brief directional jade-gray vapor marks use'],
      ['brassworks-bearing-pistol','Brass Orrery','A miniature orbital bearing race encloses a dark receiver','A tiny orbit glimmer follows a launched bearing'],
      ['brassworks-copper-spotter','Amber Surveyor','An amber lens and a folding rangefinder rise above copper rails','A short surveying reticle appears on discharge'],
      ['ratchet-wrench','Foundry Laureate','A heavy dark wrench head uses brass pawls and an emerald handle','A small cog arc follows actual contact'],
      ['piston-pike','Imperial Telescopic','Engraved brass sleeves telescope around an emerald pressure shaft','Thin pressure bands follow the real extension'],
      ['brassworks-crown-saw','Radiant Gearblade','A gold toothed crown rotates around a cool blue drive hub','Compact tooth sparks mark close contact'],
      ['clockwork-sentry','Gilded Custodian','Folded brass legs support an armored cobalt optical head','Small readiness gears rotate within the device silhouette'],
      ['brassworks-coolant-station','Porcelain Spring','White reservoir tanks sit within copper support pipes','A short rising coolant-mote ring marks activation']
    ]
  };
  const operatorThemes = [
    ['optical','Prismatic Court',['#e7f2ff','#242440','#7cefe8','#d99dff'],'Ceramic, optical glass, silver',[['Prism Monarch','Segmented crown and split shoulder plates','A thin geometric coronet'],['Lens Warden','Broad refractive collar and shield-like chest','Three quiet lens fragments'],['Crystal Herald','High glass crest and layered courier pack','A short crystal dispatch trail'],['Opal Duelist','Narrow visor and asymmetric blade shoulder','A fine opal edge ribbon'],['Glassway Pilgrim','Robed glass-lined torso and twin lens canisters','Soft ascending optical motes'],['Aurora Castellan','Wide ceramic bastion armor with glass chest windows','A segmented auroral ground arc'],['Mirror Ascendant','Offset mirror shoulder fins and floating collar','Sparse mirror afterimages'],['Photon Sextant','Six-point mechanical headpiece and exposed sight rail','Six small survey marks'],['Ivory Refraction','Ivory mask and layered translucent elbow guards','A pale refraction band'],['Dawn Archivist','Crested observation helm and folded optical wings','A brief dawn-colored wing trail']]],
    ['solar','Helion Expedition',['#cc7550','#392b34','#ffd176','#f3e9c6'],'Heat-treated alloy, copper, fabric',[['Ember Courier','Compact furnace backpack and heavy insulated gloves','A short directional vent'],['Helion Wayfarer','Sunshade helmet and cloth-wrapped segmented armor','Warm drifting dust motes'],['Cinder Captain','Brass-rimmed cap and reinforced asymmetrical shoulders','A restrained ember crest'],['Helion Diver','Round pressure helmet and thick cooling hoses','A small heat-ring wake'],['Furnace Keeper','Broad dark chest cage with a copper fire chamber','Brief furnace glimmer'],['Dawnline Runner','Slim runner frame and angled copper knee guards','A short sunrise dash ribbon'],['Radiant Prospector','Mineral visor and reinforced survey harness','Three warm mineral glints'],['Sunforge Guardian','Wide hammered-alloy shoulders and high collar','A segmented solar arc'],['Ashlight Mechanic','Offset tool pack and articulated leather apron','Small copper tool sparks'],['Amber Voyager','Amber observation dome and layered expedition coat','A subtle amber footprint accent']]],
    ['archive','Haunted Index',['#7f91bd','#202c40','#a1e5f2','#d8b3ff'],'Fractured composite, dark glass, etched alloy',[['Archive Apparition','Separated armor plates and a hollow optical face','Sparse movement afterimages'],['Null Librarian','Hooded reading mask and stacked data-spine pack','Brief falling index marks'],['Echo Custodian','Broad vault armor with a fractured circular chest','Two quiet concentric echoes'],['Ghost Cartographer','Long survey coat and offset antenna hood','A short broken survey trail'],['Cipher Mourner','Veiled angular visor and sealed scroll canisters','Small fading cipher fragments'],['Pale Register','Thin porcelain face and floating shoulder tabs','A pale segmented halo'],['Midnight Curator','Tall crested helm and layered archive robes','An indigo page-like ribbon'],['Fracture Witness','Cracked translucent faceplate and uneven armored arms','A restrained fracture glimmer'],['Vault Whisper','Compact stealth frame and folded signal vanes','Short vanishing line marks'],['Last Annotation','A circular record helm above a split skeletal frame','A brief orbit of punctuation-like geometry']]],
    ['verdant','Living Circuit',['#81ac94','#203b36','#b5efd0','#f0e2a4'],'Glass growth chambers, enamel, woven ceramic',[['Verdant Sentinel','Broad pale armor holding a central growth chamber','A short rising leaf lattice'],['Mossline Scout','Low-profile canopy hood and slim trail harness','Sparse leaf-shaped foot motes'],['Orchid Engineer','Petal shoulder guards and visible nutrient tubes','A small petal rotor'],['Jade Mycelium','Segmented fungal dome and branching chest filaments','A quiet branching ground mark'],['Canopy Herald','Tall frond crest and layered courier panels','A short canopy-colored ribbon'],['Fern Bastion','Wide folded-leaf shield shoulders and glass joints','A segmented fern arc'],['Bloom Technician','Asymmetric laboratory pack and flower-like sensor','Tiny luminous growth particles'],['Willow Surveyor','Long narrow coat and hanging cable roots','A restrained flowing cable trail'],['Vinewalker','Climbing harness and wrapped articulated limbs','Brief vine-like dash lines'],['Seedlight Oracle','A floating seed-pod crown above pale layered armor','Three small seed-shaped orbiters']]],
    ['brass','Imperial Automata',['#baa15a','#2b383b','#8bd8c5','#f5d89a'],'Engraved brass, iron, pressure glass',[['Clockwork Admiral','High mechanical collar and engraved brass shoulder armor','A small turning crown gear'],['Boiler Marquis','Tall pressure pack and broad cobalt chest shell','A short pressure-valve plume'],['Copper Chancellor','Offset copper monocle and formal armored coat','A thin copper ground seal'],['Escapement Guard','Open timing-wheel chest and heavy iron bracers','Segmented clock ticks'],['Steam Harbormaster','Round diving helm and twin exhaust canisters','A brief twin vent wake'],['Gilded Surveyor','Raised rangefinder crown and slim brass legs','Three mechanical survey arcs'],['Pendulum Scholar','Hanging pendulum pack and layered engraved robes','A slow restrained pendulum gleam'],['Cobalt Artificer','Cobalt work apron and articulated tool shoulder','Small gold construction sparks'],['Foundry Baron','Heavy riveted jaw and broad polished furnace armor','A restrained foundry halo'],['Orrery Regent','An orbital mechanical crown above an open brass frame','Three small brass orbital pieces']]],
    ['frontier','Dustline Company',['#a87d5d','#293941','#95d0bf','#f5d69c'],'Leather, steel, canvas, copper',[['Dustline Ranger','Worn expedition coat and reinforced trail boots','A short sand-colored dash wake'],['Mesa Marshal','Wide-brim sensor helm and star-shaped chest plates','A small copper star glimmer'],['Copper Drifter','Wrapped face visor and asymmetric bedroll harness','Sparse drifting copper motes'],['Railway Keeper','Reinforced rail-worker coat and iron forearm guards','A short steel-gray footprint accent'],['Opal Pathfinder','Opal observation lens and slim desert survey pack','Three small mineral glints'],['Canyon Deputy','Split leather shoulder cape and blue steel mask','A restrained curved dust ribbon'],['Saddle Mechanic','Tool-covered saddle harness and raised goggles','Brief mechanical tool sparks'],['Prairie Signalman','Tall signal aerial and pale canvas chest wrap','A small segmented signal ring'],['Sundown Warden','Dark armored duster and amber-rimmed hat','A brief warm horizon trail'],['Silver Claimant','Polished claim-marker crest and reinforced mining frame','A thin silver ground compass']]],
    ['astral','Celestial Navigation',['#7c89bd','#20263d','#a9e0f1','#f1c9eb'],'Dark ceramic, star glass, iridescent alloy',[['Astral Diver','Rounded observation helmet and deep-blue layered panels','A few slowly orbiting geometric pieces'],['Aphelion Captain','Sharp navigation crest and suspended shoulder wings','A faint elliptical halo'],['Comet Envoy','Swept head fins and long segmented travel coat','A short comet-tail ribbon'],['Moonwake Oracle','Crescent head assembly and hollow circular chest','Three pale orbital marks'],['Nebula Nomad','Layered dark robes and a glass star-map pack','Sparse violet star motes'],['Zenith Custodian','Wide armored constellation plates and a high mask','A segmented zenith ground arc'],['Parhelion Scout','Narrow twin-lens visor and lightweight folded panels','Two short optical echoes'],['Starfall Engineer','Offset navigation tools and a transparent power spine','Brief angular starlight sparks'],['Orbit Cartographer','Circular map helm and long survey antennae','A restrained rotating survey triangle'],['Eventide Navigator','Tall layered star-glass crown and split ceramic cloak','A brief horizon-colored dash trail']]]
  ];
  function slug(value) { return value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
  function equipment(value) {
    const entry = typeof value === 'string' ? weaponById(value) : value;
    if (!entry) return null;
    if (entry.faction !== 'default') return arsenal.byId(entry.weaponId);
    return {id:entry.weaponId,kind:nativeKinds[entry.slot][entry.index],name:nativeNames[entry.slot][entry.index],slot:entry.slot,index:entry.index,faction:'default'};
  }
  const rarityPattern = ['Common','Uncommon','Rare','Epic','Legendary','Uncommon','Rare','Epic','Legendary','Rare','Epic','Divine','Epic','Legendary'];
  const weapons = Object.entries(weaponRows).flatMap(([faction,rows]) => rows.map(([weaponId,name,finish,effect],variant) => {
    const native = /^default:(\d):(\d+)$/.exec(weaponId);
    const item = native ? {slot:Number(native[1]),index:Number(native[2]),name:nativeNames[Number(native[1])][Number(native[2])]} : arsenal.byId(weaponId);
    if (!item) throw Error('Radiant compatible equipment missing: '+weaponId);
    const art = factionArt[faction], rarity = rarityPattern[variant];
    return Object.freeze({id:'skin-radiant-'+slug(name),name,kind:'weapon',weaponId,weaponName:item.name,faction,slot:item.slot,index:item.index,
      weaponIndex:arsenal.skinIndex(item.slot,item.index),collection:art.collection,theme:art.theme,variant,design:slug(name),finish,structure:finish,
      palette:Object.freeze([...art.palette]),color:art.palette[2],materials:art.materials,animation:effect,effect,sound:'skin-sfx-radiant-'+slug(name),rarity,cost:prices[rarity],odds:0,directOnly:false,
      unlockRoute:'Weapon case or direct scrap purchase',desc:finish+'. '+effect+'. Cosmetic appearance.'});
  }));
  const operators = operatorThemes.flatMap(([theme,collection,palette,materials,rows]) => rows.map(([name,structure,effect],variant) => {
    const rarity = ['Common','Uncommon','Rare','Epic','Legendary','Uncommon','Rare','Epic','Legendary','Divine'][variant];
    return Object.freeze({id:'operator-radiant-'+slug(name),name,kind:'operator',collection,theme,variant,design:theme+'-'+variant,structure,finish:structure,
      palette:Object.freeze([...palette]),color:palette[2],materials,animation:effect,effect,sound:'operator-sfx-radiant-'+slug(name),rarity,cost:prices[rarity],odds:0,directOnly:false,
      unlockRoute:'Cosmetic case or direct scrap purchase',desc:structure+'. '+effect+'. Operator appearance.'});
  }));
  const weaponLookup = new Map(weapons.map(item => [item.id,item]));
  const operatorLookup = new Map(operators.map(item => [item.id,item]));
  const weaponById = id => weaponLookup.get(typeof id === 'object' ? id?.id : id) || null;
  const operatorById = id => operatorLookup.get(typeof id === 'object' ? id?.id : id) || null;
  function assignOdds(items) {
    const counts = {};
    for (const item of items) if (!item.directOnly && item.cost > 0) counts[item.rarity] = (counts[item.rarity] || 0) + 1;
    for (const item of items) item.odds = item.directOnly || item.cost <= 0 ? 0 : (tierOdds[item.rarity] || 0) / counts[item.rarity];
    return items;
  }
  function casePool(kind, weaponItems, operatorItems) {
    const list = kind === 'operator' ? Object.entries(operatorItems).filter(([,item]) => item.cost > 0).map(([id,item]) => ({id,...item,kind:'operator'})) : weaponItems.filter(item => !item.directOnly).map(item => ({...item,kind:'weapon'}));
    return assignOdds(list);
  }
  const api = {weapons,operators,weaponById,operatorById,equipment,tierOdds,rarityOrder,assignOdds,casePool};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NeonRadiantCatalog = api;
})(typeof window === 'object' ? window : globalThis);
