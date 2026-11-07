/* Canonical faction equipment and shared combat geometry. Default catalog indices are preserved. */
(function (root) {
  'use strict';
  const defaultSizes = [16, 10, 10, 10];
  const groups = [[], [], [], []];
  const factions = [{
    id: 'default', name: 'Default', tagline: 'A flexible arsenal with familiar ammunition and handling.',
    color: '#597482', starter: [0, 0, 0, 0]
  }];
  let faction;
  function begin(id, name, tagline, color) {
    faction = {id, name, tagline, color, starter: groups.map((items, slot) => defaultSizes[slot] + items.length)};
    factions.push(faction);
  }
  function add(slot, kind, name, style, cost, desc, stats) {
    const index = defaultSizes[slot] + groups[slot].length;
    const sfx = 'arsenal-' + kind;
    groups[slot].push(Object.freeze({
      id: kind, kind, name, style, slot, index, faction: faction.id, color: faction.color, cost, desc, sfx,
      vfx: ['spark','pulse','wind','smoke'][slot], ...stats
    }));
  }
  function ranged(slot, kind, name, style, cost, desc, dmg, rate, speed, magSize, reserveMax, reloadDuration, extra = {}) {
    add(slot, kind, name, style, cost, desc, {
      dmg, damage: dmg, rate, cooldown: rate, speed, magSize, reserveMax, reloadDuration, reloadTime: reloadDuration,
      mag: magSize, reserve: reserveMax, reloadLeft: 0, lastEmptyNotice: -1, reloadStyle: 'arsenal-' + kind,
      spread: 1, recoil: .07, range: 640, ...extra
    });
  }
  function melee(kind, name, style, cost, desc, damage, cooldown, reach, arc, extra = {}) {
    add(2, kind, name, style, cost, desc, {damage, cooldown, rate: cooldown, reach, arc, ...extra});
  }
  function utility(kind, name, style, cost, desc, cooldown, power, radius, extra = {}) {
    add(3, kind, name, style, cost, desc, {cooldown, rate: cooldown, power, radius, ...extra});
  }

  begin('spectrum', 'Spectrum Division', 'Precision beams and electrical control. Heat limits sustained fire.', '#387fc9');
  ranged(0,'photon-carbine','Photon Carbine','pulse',0,'Compact energy pulses. Sustained fire heats the coil.',1.5,.21,650,13,65,1.15,{heatPerShot:.11,heatRecovery:.39});
  ranged(0,'prism-lance','Prism Lance','beam',120,'Continuous beam, with one energy cell spent per damage tick. Release the trigger to cool it.',1.5,.13,0,18,72,1.55,{ray:'beam',range:455,heatPerShot:.15,heatRecovery:.28,recoil:.02});
  ranged(0,'vector-railgun','Vector Railgun','rail',160,'Hold to charge. The discharge pierces two aligned enemies, with reduced damage after the first hit.',10,1.08,0,2,14,1.95,{ray:'rail',chargeTime:.48,penetration:2,range:900,recoil:.19});
  ranged(1,'ion-sidearm','Ion Sidearm','ion',0,'Accurate, low-recoil bolts with a fast follow-up.',1.6,.25,710,8,40,1.04,{range:420,recoil:.025});
  ranged(1,'arc-projector','Arc Projector','arc',96,'A conductor bolt jumps to one nearby enemy for 65% damage.',2.6,.52,610,5,25,1.3,{chainRadius:132,chainFactor:.65,range:490});
  melee('phase-blade','Phase Blade','phase',0,'A quick narrow cut that bypasses armor.',3.3,.38,118,.62,{armor:true});
  melee('graviton-maul','Graviton Maul','maul',104,'A slow, heavy swing that builds extra stagger and can interrupt a charging enemy.',6.8,1.3,146,1.12,{staggerMultiplier:1.75,counterBrace:true});
  utility('hardlight-screen','Hardlight Screen','screen',0,'Absorbs two incoming hits for up to seven seconds.',18,2,0,{duration:7,integerPower:true});
  utility('capacitor-pack','Capacitor Pack','capacitor',94,'Cools equipped heat weapons and restores up to three energy cells to each reserve.',17,3,0,{integerPower:true});

  begin('blackpowder', 'The Blackpowder Company', 'Single-shot impact, measured reloads, and space control.', '#95653d');
  ranged(0,'line-musket','Line Musket','musket',0,'A powerful single shot followed by a ramrod reload.',9.4,.64,810,1,20,1.85,{recoil:.22,range:680,staggerMultiplier:1.22});
  ranged(0,'rifled-carbine','Rifled Carbine','rifled',100,'An accurate rifle that trades peak damage for faster single-round reloads.',7,.54,970,1,26,1.34,{range:870,recoil:.135});
  ranged(0,'deck-blunderbuss','Deck Blunderbuss','blunderbuss',132,'A wide six-pellet burst that loses force rapidly beyond close range.',2.1,.85,520,1,22,1.75,{range:290,spread:6,spreadWidth:.17,falloff:.7,recoil:.24});
  ranged(1,'flintlock-pistol','Flintlock Pistol','flintlock',0,'A single heavy finishing shot with a short reload.',4.6,.58,695,1,18,1.25,{range:405,recoil:.115});
  ranged(1,'double-barrel-flintlock','Double-Barrel Flintlock','double-flintlock',85,'Fire either barrel quickly, then reload both together.',4,.33,670,2,20,1.7,{range:390,recoil:.12});
  melee('infantry-bayonet','Infantry Bayonet','bayonet',0,'A long thrust that can interrupt charge windups.',4,.77,193,.48,{counterBrace:true});
  melee('officers-sabre','Officer’s Sabre','sabre',98,'A broad slash for catching several targets at once.',4.75,.78,154,1.55);
  utility('powder-satchel','Powder Satchel','satchel',95,'Place a charge in the arena. A marked circle warns before it bursts.',15,12,112,{fuse:1.3});
  utility('field-dressing','Field Dressing','dressing',0,'Restores three hull over six seconds. Taking damage interrupts the repair.',25,3,0,{duration:6,integerPower:true});

  begin('frontier', 'Frontier Union', 'Quick follow-up shots and reliable handling between fights.', '#b98026');
  ranged(0,'trail-repeater','Trail Repeater','lever',0,'A lever-action rifle with steady follow-up shots and a moderate reload.',3.9,.43,805,6,36,1.55,{range:680,recoil:.105});
  ranged(0,'coach-gun','Coach Gun','coach',100,'Two heavy close-range shells. Load each barrel individually and interrupt the reload to fire.',2.15,.43,585,2,24,.76,{range:310,spread:7,spreadWidth:.13,falloff:.58,recoil:.24,reloadMode:'incremental'});
  ranged(0,'longhorn-rifle','Longhorn Rifle','longhorn',145,'Deliberate long-range fire that punches through one extra target.',6.2,.79,1030,4,24,1.79,{range:940,penetration:2,recoil:.14});
  ranged(1,'marshal-revolver','Marshal Revolver','marshal',0,'A six-shot backup with a deliberate cylinder reload.',2.9,.35,820,6,30,1.48,{range:515,recoil:.10});
  ranged(1,'pocket-derringer','Pocket Derringer','derringer',80,'Very fast shots with low recoil and short effective range.',2.25,.18,660,2,26,1.04,{range:285,recoil:.045});
  melee('bowie-knife','Bowie Knife','bowie',0,'A rapid close strike that leaves a short damaging cut.',2.9,.43,112,.76,{bleed:.85});
  melee('ranch-hatchet','Ranch Hatchet','hatchet',92,'A slower chop that staggers more and drives light enemies backward.',4.9,.89,135,.95,{staggerMultiplier:1.5,knockback:24});
  utility('signal-flare','Signal Flare','signal',0,'Marks enemies in the target circle. All players deal 15% more damage to marked targets.',14,6,145);
  utility('stick-of-dynamite','Stick of Dynamite','dynamite',110,'Throws a charge toward the aim point. It skips once, then detonates in the marked area.',13,10,98,{fuse:1.15});

  begin('brassworks', 'Brassworks Syndicate', 'Pressure-powered weapons, stagger, and deployable cover fire.', '#647f68');
  ranged(0,'steam-riveter','Steam Riveter','riveter',0,'Fast rivets build pressure. At the limit the weapon vents before it can fire again.',1.7,.185,650,15,75,1.45,{heatPerShot:.16,heatRecovery:.28,ventDuration:1.12,range:550});
  ranged(0,'pressure-coil','Pressure Coil','pressure',116,'Hold to build pressure, then fire a dense bolt that briefly stuns the target.',7.8,.74,860,4,24,1.72,{chargeTime:.38,stun:.42,range:740,recoil:.15});
  ranged(0,'gearcaster','Gearcaster','disc',138,'Launches a toothed disc that ricochets off one arena wall.',4.8,.61,630,5,30,1.63,{bouncesMax:1,range:1110,recoil:.10});
  ranged(1,'pocket-piston','Pocket Piston','piston',0,'A pneumatic sidearm with a strong stagger hit.',2.4,.38,740,7,35,1.12,{range:460,staggerMultiplier:1.36});
  ranged(1,'valve-sprayer','Valve Sprayer','sprayer',92,'A close pressure cone that briefly slows enemies.',1.15,.43,455,6,30,1.46,{range:245,spread:5,spreadWidth:.14,slow:1.1,recoil:.04});
  melee('ratchet-wrench','Ratchet Wrench','wrench',0,'A measured swing that builds extra stagger on direct hits.',3.7,.64,127,1.05,{staggerMultiplier:1.6});
  melee('piston-pike','Piston Pike','pike',105,'A narrow extended jab. The pneumatic stroke briefly stuns a target.',5.1,.95,205,.42,{stun:.24});
  utility('steam-vent','Steam Vent','vent',0,'Pushes light enemies outward and briefly slows enemies within the steam ring.',12,62,133);
  utility('clockwork-sentry','Clockwork Sentry','sentry',120,'Deploy one short-lived sentry. It fires at enemies in a fixed 130-degree arc.',22,8,300,{arc:Math.PI*130/180,shotDamage:1.8});

  // Append in a separate pass so every v6.6 equipment index stays valid.
  const expansion = {
    spectrum: [
      ['Helix Driver|helix|helix|curve','Trinary Pulse|carbine|burst|heat','Sunspot Projector|lens|orb|splash','Zero-Line Rifle|rail|charge|pierce','Iceglass Refractor|prism|fan|slow','Lattice Disruptor|frame|double|chain','Null Needle|needle|tap|armor'],
      ['Quark Needle|needle|tap|pierce','Beacon Pistol|flare|charge|mark','Twin Ion Splitter|fork|fork|heat','Phase Skip|disc|bank|stun','Afterimage Pistol|lens|burst|curve','Cryo Cell|tank|fan|slow','Static Dart|coil|double|chain','Flare Matrix|prism|orb|splash'],
      ['Monofilament Foil|foil|lunge|armor','Photon Tonfa|tonfa|jab|stun','Ion Talons|claws|close|bleed','Vector Glaive|glaive|sweep|push','Flux Anchor|hook|lunge|pull','Null Baton|baton|guard|interrupt','Lens Axe|axe|cleave|slow','Pulse Gauntlet|gauntlet|close|push'],
      ['Holo Step|prism|blink','Aegis Node|frame|shield','Repair Prism|lens|heal','Cryogenic Curtain|tank|slow','Target Uplink|antenna|mark','Echo Cell|coil|refill','Null Charge|orb|blast','Particle Turret|turret|sentry']
    ],
    blackpowder: [
      ['Volley Musket|fork|double|pierce','Breech Needle|needle|tap|armor','Fortress Wall Gun|rail|charge|stun','Swivel Cannon|tank|orb|splash','Fowling Piece|long|fan|push','Puckle Gun|crank|burst|stagger','Coach Mortar|bell|arc|splash'],
      ['Turn-Off Pistol|stub|tap|armor','Pepperbox|cluster|burst|stagger','Duckfoot Pistol|fork|fan|push','Signal Flintlock|flare|charge|mark','Horse Pistol|long|double|pierce','Rook Pistol|needle|tap|slow','Grenado Thrower|bell|arc|splash','Spring Dirk Pistol|blade|fork|bleed'],
      ['Hanger Sword|sabre|cleave|bleed','Spontoon|glaive|lunge|interrupt','Naval Boarding Axe|axe|sweep|pull','Iron Ramrod|baton|jab|stun','Pike Hook|hook|lunge|pull','Officer’s Smallsword|foil|guard|armor','Powder Mallet|mallet|close|push','Dragoon Pallash|cleaver|cleave|stagger'],
      ['Gabion Shield|basket|shield','Surgeon’s Roll|roll|heal','Messenger’s Spurs|spur|dash','Caltrop Pouch|bag|slow','Survey Flag|flag|mark','Cartridge Box|box|refill','Grenado Basket|basket|blast','Picket Swivel|turret|sentry']
    ],
    frontier: [
      ['Buffalo Sharps|long|charge|pierce','Pump Scattergun|pump|fan|push','Express Repeater|lever|burst|stagger','Side-by-Side Express|fork|double|armor','Quarry Rifle|rail|bank|pierce','Prospector’s Slugger|stub|tap|stun','Claim Jumper|bell|arc|splash'],
      ['Schofield Breaktop|hinge|tap|armor','Snake Shot Sixgun|cluster|fan|bleed','Trail Scout’s Pistol|long|charge|mark','Gambler’s Twin|fork|double|stagger','Canyon Ricochet|disc|bank|stun','Buntline Special|needle|tap|pierce','Belt Pepperbox|crank|burst|push','Survey Flare Gun|flare|orb|splash'],
      ['Rail Spike|foil|jab|armor','Stock Whip|lash|sweep|pull','Fence Hook|hook|lunge|pull','Blacksmith Hammer|mallet|cleave|stagger','Saloon Chair Leg|baton|guard|interrupt','Trail Machete|cleaver|sweep|bleed','Brawler’s Spurs|claws|close|slow','Prospector Pick|axe|lunge|stun'],
      ['Saddle Shield|plate|shield','Trail Remedy|bottle|heal','Spur Kick|spur|dash','Tripwire Spool|spool|slow','Survey Beacon|flag|mark','Cartridge Belt|roll|refill','Quarry Charge|bundle|blast','Lookout Rig|turret|sentry']
    ],
    brassworks: [
      ['Rotary Stapler|crank|burst|heat','Boiler Bell|bell|fan|slow','Flywheel Rebounder|disc|bank|pierce','Hammerlock Driver|piston|charge|stagger','Pressure Fork|fork|fork|push','Slag Lobber|tank|arc|splash','Governor Needle|needle|tap|armor'],
      ['Escapement Repeater|clock|burst|stagger','Twin Valve|fork|double|slow','Bearing Pistol|disc|bank|stun','Bellows Dart|needle|tap|bleed','Copper Spotter|flare|charge|mark','Piston Popper|piston|fork|push','Soot Nozzle|bell|fan|slow','Condensate Thrower|tank|orb|splash'],
      ['Pipe Tongs|hook|guard|pull','Spring Knuckles|gauntlet|close|push','Crown Saw|saw|sweep|bleed','Flywheel Cleaver|cleaver|cleave|stagger','Trip Lever|baton|jab|interrupt','Valve Spanner|tonfa|close|stun','Telescoping Shear|glaive|lunge|armor','Frost Chisel|foil|jab|slow'],
      ['Pressure Buckler|plate|shield','Patch Automaton|clock|heal','Piston Boots|spur|dash','Coolant Station|tank|slow','Survey Oscillator|antenna|mark','Universal Feedbox|box|refill','Boiler Bomb|bundle|blast','Crown Turret|turret|sentry']
    ]
  };
  const gunPatterns = {
    tap:{label:'Single aimed shot'}, double:{label:'Alternating offset barrels',alternate:.10},
    burst:{label:'Three timed shots',spread:3,burstGap:.069,spreadWidth:.043},
    fork:{label:'Parallel twin shots',spread:2,parallel:11,spreadWidth:0},
    fan:{label:'Wide pellet fan',spread:5,spreadWidth:.146,falloff:.60},
    bank:{label:'Wall ricochet',bouncesMax:1},
    charge:{label:'Hold to charge',chargeTime:.4},
    orb:{label:'Slow impact sphere',shotRadius:5.4},
    arc:{label:'Curves during flight',curve:1.3,shotRadius:4},
    helix:{label:'Opposing curved shots',spread:2,spreadWidth:.095,curve:1.8,mirrorCurve:true}
  };
  const gunTraits = {
    heat:{label:'builds heat',heatPerShot:.15,heatRecovery:.35,ventDuration:.85},
    curve:{label:'curves in flight',curve:.94}, pierce:{label:'pierces two targets',penetration:2},
    splash:{label:'damages nearby enemies on impact',splashRadius:66},
    slow:{label:'briefly slows targets',slow:1.25}, chain:{label:'jumps to a nearby enemy',chainRadius:112,chainFactor:.57},
    armor:{label:'bypasses armor',armor:true}, mark:{label:'marks enemies for increased damage',mark:3.4},
    stun:{label:'briefly stuns on impact',stun:.48}, stagger:{label:'builds extra stagger',staggerMultiplier:1.55},
    push:{label:'knocks back light enemies',knockback:16}, bleed:{label:'inflicts a brief bleed',bleed:.84}
  };
  const meleeForms = {
    lunge:[.82,185,.44,'Long narrow thrust'], jab:[.49,133,.54,'Quick jab'], guard:[.71,128,.91,'Guard strike'],
    close:[.41,100,1.05,'Close-range strike'], sweep:[.87,154,1.77,'Broad sweep'], cleave:[1.12,165,1.16,'Heavy cleave']
  };
  const meleeTraits = {...gunTraits,
    interrupt:{label:'interrupts a charge windup',counterBrace:true,staggerMultiplier:1.55},
    pull:{label:'pulls light enemies inward',knockback:-24}
  };
  const supports = {
    blink:[19,175,0,'Blink toward the aim point','Short immunity after arrival'],
    dash:[14,120,58,'Surge toward the aim point','Shoves light enemies at the destination'],
    shield:[21,2,94,'Block two hits','Brief protection for nearby allies in co-op'],
    heal:[24,2,108,'Restore two hull over time','Works within the marked repair area'],
    slow:[16,2.4,117,'Deploy a slowing field','Continuous control without direct damage'],
    mark:[14,4.5,124,'Mark targets at the aim point','Marked targets take 15% more damage'],
    refill:[17,5,0,'Restore reserve ammo and clear heat','Leaves magazines and active reloads intact'],
    blast:[17,10,88,'Place a delayed blast','Targets can move out before detonation'],
    sentry:[25,6,238,'Deploy one directional sentry','Its fixed arc leaves the rear uncovered']
  };
  const addExpansion = (entry, slot, ordinal) => {
    const [name, shape, pattern, trait] = entry.split('|');
    const id = faction.id + '-' + name.normalize('NFKD').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');
    const visual = {shape, ordinal};
    if (slot < 2) {
      const {label,...behavior} = gunPatterns[pattern];
      const {label: effect,...impact} = gunTraits[trait];
      const resource = faction.id==='spectrum'?'cell':faction.id==='brassworks'?'pressure':faction.id==='blackpowder'?'powder':'cartridge';
      const oneLoad = resource==='powder' && ['tap','charge','arc','orb','fan'].includes(pattern);
      const mag = oneLoad?1:pattern==='burst'?(slot===0?9:6):pattern==='fan'?2+(ordinal%3):4+((ordinal*3+slot)%7);
      const staged = mag>1 && (resource==='powder'||(resource==='cartridge'&&['fan','bank','tap'].includes(pattern)));
      const rate = ({tap:.4,double:.38,burst:.69,fork:.46,fan:.76,bank:.57,charge:.83,orb:.66,arc:.72,helix:.53})[pattern]+ordinal*.012;
      const dmg = ({tap:4.1,double:3.4,burst:1.85,fork:2.25,fan:1.65,bank:4.8,charge:7.6,orb:4.4,arc:5.3,helix:2.2})[pattern]*(slot===1?.82:1)*(oneLoad?1.28:1);
      const rounds = pattern==='burst'?3:pattern==='fork'&&resource==='cartridge'?2:1;
      const range = ({tap:620,double:460,burst:490,fork:430,fan:295,bank:775,charge:780,orb:390,arc:475,helix:520})[pattern]-(slot===1?55:0)+ordinal*5;
      const reload = staged?.52+ordinal*.045:oneLoad?1.48+ordinal*.067:1.08+ordinal*.067+(resource==='pressure'?.25:0);
      ranged(slot,id,name,shape,72+ordinal*8+(slot===0?18:0),
        label+' that '+effect+'. '+(staged?'Loads one round at a time.':oneLoad?'One load before reloading.':pattern==='burst'?'Consumes three rounds per burst.':'Refills in a single cycle.'),
        Number(dmg.toFixed(2)),Number(rate.toFixed(3)),pattern==='orb'||pattern==='arc'?385+ordinal*20:565+ordinal*39,mag,mag*(3+(ordinal%3)),Number(reload.toFixed(3)),
        {...behavior,...impact,visual,pattern,role:trait,resource,range,ammoPerShot:rounds,reloadMode:staged?'incremental':'full',recoil:.047+ordinal*.012});
    } else if (slot===2) {
      const [cooldown,reach,arc,label] = meleeForms[pattern], {label:effect,...impact} = meleeTraits[trait];
      melee(id,name,shape,65+ordinal*9,label+' that '+effect+'. '+(cooldown>.8?'Commit to the longer recovery.':'Useful between enemy attacks.'),
        Number((1.8+cooldown*3.6+ordinal*.12).toFixed(2)),cooldown+ordinal*.015,reach+ordinal*2,arc,
        {...impact,visual,role:trait,pattern,falloff:pattern==='lunge'?.48:pattern==='sweep'?.72:.62});
    } else {
      const [cooldown,power,radius,label,tradeoff] = supports[pattern];
      utility(id,name,shape,85+ordinal*8,label+'. '+tradeoff+'.',cooldown+ordinal%3,power,radius,
        {visual,role:pattern,utilityMode:pattern,...(pattern==='shield'?{duration:4.5,integerPower:true}:pattern==='heal'?{duration:5,integerPower:true}:
          pattern==='blast'?{fuse:.95+ordinal*.08}:pattern==='sentry'?{arc:1.4+ordinal*.15,shotDamage:1.55}:{})});
    }
  };
  for (const entry of factions.slice(1)) {
    faction = entry;
    expansion[entry.id].forEach((items,slot)=>items.forEach((item,index)=>addExpansion(item,slot,index)));
  }
  const signatures = {
    spectrum: ['Optical pulse','Tracking light','Aligned rail','Phase helix','Metered triad','Collapsing sphere','Zero-line rail','Frost prism','Arc lattice','Armor needle'],
    blackpowder: ['Single heavy ball','Rifled shot','Powder fan','Two-barrel volley','Breech needle','Braced wall shot','Cannon ball','Fowling cone','Cranked volley','Mortar shell'],
    frontier: ['Lever cadence','Twin shells','Penetrating rifle','Braced buffalo shot','Pump fan','Express burst','Alternating barrels','Canyon bank shot','Stagger slug','Quarry shell'],
    brassworks: ['Pressure rivets','Charged piston','Rebounding gear','Rotary staples','Condensate cone','Flywheel rebound','Hammerlock charge','Split pressure jets','Slag glob','Governor needle']
  };
  const roleNames = {armor:'Armor breach',pierce:'Line control',splash:'Group damage',slow:'Movement control',chain:'Linked targets',
    mark:'Priority marking',stun:'Interruption',stagger:'Stagger',push:'Spacing',pull:'Position control',bleed:'Damage over time',heat:'Sustained pressure',
    curve:'Prediction',interrupt:'Counterattack',blink:'Reposition',dash:'Escape',shield:'Protection',heal:'Recovery',refill:'Ammunition',blast:'Area control',sentry:'Flank protection'};
  const overrides = {
    'prism-lance': {beamWidth:2.2},
    'vector-railgun': {beamWidth:1.8},
    'spectrum-zero-line-rifle': {ray:'rail',beamWidth:1.2,range:805,penetration:3,chargeTime:.58,magSize:2,reserveMax:14,damage:8.4,dmg:8.4},
    'spectrum-lattice-disruptor': {ray:'beam',beamWidth:4.6,spread:1,range:280,rate:.2,damage:1.5,dmg:1.5,heatPerShot:.13,heatRecovery:.32},
    'spectrum-flare-matrix': {shotRadius:6.2,splashRadius:94,speed:315,rate:.91,magSize:3,reserveMax:18},
    'spectrum-phase-skip': {bouncesMax:2,range:820,damage:2.8,dmg:2.8},
    'blackpowder-volley-musket': {spread:2,burstGap:.14,spreadWidth:.024,alternate:0,ammoPerShot:2,magSize:2,reserveMax:18,reloadMode:'full',reloadDuration:1.95},
    'blackpowder-fortress-wall-gun': {chargeTime:.62,penetration:2,damage:11.8,dmg:11.8,rate:1.0},
    'blackpowder-puckle-gun': {spread:3,burstGap:.11,magSize:9,ammoPerShot:3,reloadDuration:2.3},
    'blackpowder-duckfoot-pistol': {spread:4,spreadWidth:.22,falloff:.72,damage:1.8,dmg:1.8,magSize:1,reloadMode:'full'},
    'frontier-side-by-side-express': {spread:2,parallel:8,alternate:0,spreadWidth:0,ammoPerShot:2,magSize:4,reloadMode:'incremental',reloadDuration:.64},
    'frontier-buffalo-sharps': {chargeTime:.44,penetration:3,range:960,rate:.9},
    'frontier-gamblers-twin': {spread:2,burstGap:.085,alternate:0,spreadWidth:.045,ammoPerShot:2,magSize:6},
    'frontier-quarry-rifle': {bouncesMax:2,damage:3.8,dmg:3.8,range:920},
    'brassworks-flywheel-rebounder': {bouncesMax:2,range:980,heatPerShot:.24,damage:4.0,dmg:4.0},
    'brassworks-hammerlock-driver': {chargeTime:.5,pressureBonus:.7,staggerMultiplier:2.1,heatPerShot:.3},
    'brassworks-pressure-fork': {parallel:15,spread:2,spreadWidth:0,heatPerShot:.23},
    'brassworks-soot-nozzle': {spread:4,range:190,falloff:.75,slow:1.8,damage:1.05,dmg:1.05},
    'brassworks-crown-saw': {bleed:1.1,arc:1.75,damage:3.9,cooldown:.96,rate:.96},
    'spectrum-flux-anchor': {knockback:-38,reach:166,cooldown:.97,rate:.97},
    'blackpowder-pike-hook': {knockback:-29,counterBrace:true,arc:.36,cooldown:1.02,rate:1.02},
    'frontier-stock-whip': {knockback:-18,reach:195,damage:3.3,arc:1.6},
    'brassworks-pipe-tongs': {knockback:-32,reach:132,staggerMultiplier:1.4},
    'hardlight-screen': {utilityMode:'barrier',radius:86,duration:5.5,arc:1.9,power:4,signature:'Directional hardlight barrier',weakness:'Blocks four projectiles across its forward arc. Rear attacks and blasts bypass it.'},
    'spectrum-aegis-node': {radius:122,duration:3.4},
    'blackpowder-gabion-shield': {duration:7.2,radius:60,power:2,cooldown:25,rate:25},
    'frontier-saddle-shield': {duration:3.7,radius:90,power:2,cooldown:17,rate:17},
    'brassworks-pressure-buckler': {duration:4.8,radius:72,power:3,cooldown:26,rate:26},
    'spectrum-cryogenic-curtain': {radius:145,power:2.8},
    'spectrum-repair-prism': {duration:4,power:2,signature:'Place a compact repair prism',weakness:'Two repair pulses require staying inside its small field.'},
    'blackpowder-surgeons-roll': {duration:6,power:3,interruptOnDamage:true,signature:'Set out a surgeon’s treatment roll',weakness:'Incoming damage interrupts the remaining treatment.'},
    'frontier-trail-remedy': {duration:3.5,power:2,followOwner:true,interruptOnDamage:true,signature:'Mobile trail remedy',weakness:'Recover while moving, but a hit cancels the remaining treatment.'},
    'brassworks-patch-automaton': {duration:6,power:2,followOwner:true,coolingField:true,signature:'Following repair automaton',weakness:'Two slow repair pulses and cooling help sustained pressure weapons.'},
    'blackpowder-caltrop-pouch': {radius:84,power:5.0,contactDamage:.6},
    'frontier-tripwire-spool': {radius:97,power:4.0,rootPulse:.22},
    'brassworks-coolant-station': {radius:110,power:3.5,coolingField:true},
    'spectrum-particle-turret': {radius:305,arc:1.1,shotDamage:1.35,shotInterval:.38},
    'blackpowder-picket-swivel': {radius:275,arc:1.65,shotDamage:3.3,shotInterval:1.05},
    'frontier-lookout-rig': {radius:360,arc:.95,shotDamage:2.8,shotInterval:.82},
    'brassworks-crown-turret': {radius:235,arc:2.9,shotDamage:1.45,shotInterval:.5}
  };
  const seenBySlot = new Map();
  for (const list of groups) for (let index=0;index<list.length;index++) {
    const before=list[index], item={...before}, key=item.faction+':'+item.slot;
    const order=seenBySlot.get(key)||0;seenBySlot.set(key,order+1);
    item.previous={description:before.desc,damage:before.damage,rate:before.rate,range:before.range,reload:before.reloadDuration};
    item.color={spectrum:'#18b8e5',blackpowder:'#bd782f',frontier:'#32a99f',brassworks:'#bf943f'}[item.faction];
    if(item.slot<2){
      if(item.faction==='blackpowder'){item.ignitionDelay=.065+(order%4)*.022;item.damage*=1.06;item.dmg=item.damage}
      if(item.faction==='frontier'){item.recoil*=.8;item.spreadWidth=(item.spreadWidth||.12)*.92}
      if(item.faction==='brassworks'){item.heatPerShot=item.heatPerShot||.13+(order%3)*.025;item.heatRecovery=item.heatRecovery||.26;item.ventDuration=item.ventDuration||.92;item.pressureBonus=.35}
      item.signature=item.slot===0?(signatures[item.faction][order]||item.name):item.name+' · '+item.desc.split('.')[0];
      item.mechanic=item.ray||item.pattern||item.style;
      item.role=roleNames[item.role]||(item.ray==='beam'?'Tracking':item.penetration?'Line control':item.spread>2?'Crowd pressure':'Precision');
      item.weakness=item.spread>2?'Pellet coverage loses single-target efficiency at distance.':
        item.chargeTime?'The charge leaves a readable delay before damage.':item.faction==='blackpowder'?'Ignition and reload windows reward a protected firing position.':
        item.faction==='brassworks'?'Pressure raises output but forces a vent at the limit.':item.magSize<=3?'Low capacity requires a reliable backup.':'Sustained firing consumes reserves and exposes reload timing.';
    }else if(item.slot===2){
      item.signature=(item.pattern||item.style)+' · '+(roleNames[item.role]||item.desc.split('.')[0]);
      item.role=roleNames[item.role]||'Close combat';
      item.mechanic=item.pattern||item.style;
      if(item.arc>1.5){item.damage*=.9;item.cooldown*=1.08;item.rate=item.cooldown}
      if(item.pattern==='guard')item.counterBrace=true;
      item.weakness=item.arc<.7?'Narrow contact angle requires deliberate aim.':item.reach>165?'Outer contact deals reduced damage.':'Close range leaves little room against overlapping attacks.';
    }else{
      item.signature=item.desc.split('.')[0];
      item.role=roleNames[item.utilityMode]||'Tactical support';
      item.mechanic=item.utilityMode||item.style;
      item.weakness=item.utilityMode==='sentry'?'Targets behind its firing arc remain uncovered.':item.utilityMode==='heal'?'Stay within the repair field while recovering.':item.fuse?'Enemies can leave the marked zone before the charge explodes.':'Limited duration and cooldown require deliberate use.';
    }
    Object.assign(item,overrides[item.id]||{});
    item.mechanic=item.ray||item.pattern||item.utilityMode||item.style;
    if(item.slot<2){
      item.damage=Number(item.damage.toFixed(3));item.dmg=item.damage;item.mag=item.magSize;item.reserve=item.reserveMax;
      item.reloadTime=item.reloadDuration;
      item.cooldown=item.rate;
      const nominal=item.damage*(item.spread||1), cycle=item.rate+(item.chargeTime||0);
      if(item.cost>0)item.cost=Math.round(Math.max(72,Math.min(185,70+nominal/cycle*6+(item.penetration?14:0)))/5)*5;
    }
    item.desc=item.signature+'. '+item.weakness;
    list[index]=Object.freeze(item);
  }
  function patternShots(item, serial, emit) {
    const count = Math.min(7,item.spread||1);
    for(let n=0;n<count;n++){
      const center=n-(count-1)/2;
      const offset=center*(item.spreadWidth??.12)+(item.alternate?(serial%2?1:-1)*item.alternate:0);
      emit(offset,(item.ignitionDelay||0)+n*(item.burstGap||0),center*(item.parallel||0),(item.curve||0)*(item.mirrorCurve&&n%2?-1:1));
    }
  }
  function steerShot(shot,dt) {
    if(!shot.curve)return;
    const angle=shot.curve*dt,cos=Math.cos(angle),sin=Math.sin(angle);
    const vx=shot.vx;
    shot.vx=vx*cos-shot.vy*sin;
    shot.vy=vx*sin+shot.vy*cos;
  }
  const catalog = new Map(groups.flat().map(item => [item.id, item]));
  const lookup = new Map(factions.map(entry => [entry.id, entry]));
  function byId(id) { return catalog.get(id) || null; }
  function factionById(id) { return lookup.get(id) || null; }
  function skinIndex(slot, index) {
    if (slot < 0 || slot > 1 || index < 0 || index >= defaultSizes[slot]) return -1;
    return slot === 0 ? index : defaultSizes[0] + index;
  }
  function rayContacts(x, y, angle, range, targets, eligible, radius = e => e.r) {
    const dx = Math.cos(angle), dy = Math.sin(angle), result = [];
    for (const entity of targets) {
      if (!eligible(entity)) continue;
      const ox = entity.x - x, oy = entity.y - y, r = radius(entity);
      const forward = ox * dx + oy * dy, cross = ox * dy - oy * dx;
      if (forward + r < 0 || forward - r > range || Math.abs(cross) > r) continue;
      const chord = Math.sqrt(Math.max(0,r*r-cross*cross)), entry = forward-chord;
      if (forward+chord >= 0 && entry <= range) result.push({entity, distance: Math.max(0,entry)});
    }
    return result.sort((a,b) => a.distance - b.distance);
  }
  function boundary(x, y, angle, width, height, range) {
    const dx = Math.cos(angle), dy = Math.sin(angle);
    const horizontal = Math.abs(dx) < 1e-9 ? Infinity : ((dx > 0 ? width : 0) - x) / dx;
    const vertical = Math.abs(dy) < 1e-9 ? Infinity : ((dy > 0 ? height : 0) - y) / dy;
    return Math.max(0, Math.min(range, horizontal, vertical));
  }
  function segmentHits(ax, ay, bx, by, x, y, radius) {
    const dx = bx-ax, dy = by-ay;
    const t = Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1)));
    return (x-ax-t*dx)**2+(y-ay-t*dy)**2 < radius*radius;
  }
  function barrierContact(field,ax,ay,bx,by){
    const dx=bx-ax,dy=by-ay,length=Math.hypot(dx,dy);
    if(!length)return false;
    const contacts=rayContacts(ax,ay,Math.atan2(dy,dx),length,[field],()=>true,f=>f.radius);
    if(!contacts.length)return false;
    const distance=contacts[0].distance,x=ax+dx/length*distance,y=ay+dy/length*distance;
    const angle=Math.atan2(y-field.y,x-field.x)-field.angle;
    return Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)))<=field.arc/2;
  }
  const api = {groups, factions, defaultSizes, byId, factionById, skinIndex, rayContacts, boundary, segmentHits, patternShots, steerShot, barrierContact};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NeonArsenal = api;
})(typeof window === 'object' ? window : globalThis);
