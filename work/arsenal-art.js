/* Original canvas art for the Five Arsenals. Rendering only: weapon geometry never sets collision. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NeonArsenalArt = api;
})(globalThis, function (root) {
  'use strict';
  const TAU = Math.PI * 2;
  const themes = Object.freeze({
    spectrum: { floor: '#dbe8ed', panel: '#e9f1f5', line: '#a9bdcd', shade: '#101b40', metal: '#364880', light: '#eef4ff', accent: '#087cc4', flare: '#72fff1', trim: '#a55af2', stock: '#182958', text: 'PRISM ARRAY', serial: '01 / OPTICS' },
    blackpowder: { floor: '#e5d9bf', panel: '#eee4ce', line: '#c8ad83', shade: '#29252a', metal: '#46434c', light: '#edd8a3', accent: '#a12e4c', flare: '#ffc36e', trim: '#bc913c', stock: '#77442b', text: 'IRONWAKE BATTERY', serial: '02 / ORDNANCE' },
    frontier: { floor: '#e8ddcd', panel: '#f2e8d9', line: '#ccad92', shade: '#172c36', metal: '#3b6679', light: '#e7ddd0', accent: '#1b9c9e', flare: '#ffd580', trim: '#be793e', stock: '#a76434', text: 'RED MESA EXCHANGE', serial: '03 / FREIGHT' },
    brassworks: { floor: '#dce2db', panel: '#e8ebe1', line: '#a5b7aa', shade: '#263130', metal: '#b38c38', light: '#fff0c7', accent: '#147c72', flare: '#b2f7d5', trim: '#d87043', stock: '#4e5548', text: 'THE PRESSUREWORKS', serial: '04 / PRESSURE' }
  });
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, Number(x) || 0));
  const catalog = root.NeonArsenal || (typeof require==='function' ? require('../multiplayer/arsenal-catalog.cjs') : null);
  function lookup(item) { return typeof item === 'string' ? (root.NeonArsenal||catalog)?.byId?.(item) : item; }
  function theme(item) { return themes[lookup(item)?.faction] || null; }
  function muzzleOffset(source) {
    const item = lookup(source);
    if (!item) return 0;
    const profile = design(item);
    if (profile) return profile.length;
    if (item.slot === 1) return 29;
    return /lance|railgun|musket|rifle|carbine|repeater/.test(item.id || item.kind) ? 47 : 38;
  }
  const tiles = new Map();
  function polygon(ctx, pts, fill, stroke, width = 1) {
    ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
  }
  function line(ctx, x, y, tx, ty, color, width = 1) {
    ctx.strokeStyle = color; ctx.lineWidth = width;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(tx, ty); ctx.stroke();
  }
  function disk(ctx, x, y, r, fill, border, width = 1) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (border) { ctx.strokeStyle = border; ctx.lineWidth = width; ctx.stroke(); }
  }
  function gear(ctx, x, y, r, angle, fill, border) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    ctx.fillStyle = fill;
    for (let i = 0; i < 8; i++) { ctx.fillRect(-r * .23, -r * 1.1, r * .46, r * .32); ctx.rotate(TAU / 8); }
    disk(ctx, 0, 0, r * .87, fill, border); disk(ctx, 0, 0, r * .44, border, null);
    ctx.restore();
  }
  function tile(id) {
    if (tiles.has(id)) return tiles.get(id);
    const canvas = root.document?.createElement?.('canvas');
    if (!canvas) return null;
    canvas.width = canvas.height = 192;
    const c = canvas.getContext('2d'), p = themes[id];
    if (!c) return null;
    c.fillStyle = p.floor; c.fillRect(0, 0, 192, 192);
    if (id === 'spectrum') {
      for (let y = 0; y < 192; y += 64) for (let x = 0; x < 192; x += 64) {
        polygon(c, [x + 4, y + 15, x + 15, y + 4, x + 60, y + 4, x + 60, y + 51, x + 51, y + 60, x + 4, y + 60], p.panel, p.line);
        line(c, x + 12, y + 48, x + 12, y + 28, '#c9dddd');
        c.fillStyle = '#b6d7d6'; c.fillRect(x + 42, y + 49, 11, 2);
      }
    } else if (id === 'blackpowder') {
      for (let y = 0; y < 192; y += 24) {
        c.fillStyle = y % 48 ? p.panel : '#e9dcc0'; c.fillRect(0, y, 192, 23);
        line(c, 0, y + 21, 192, y + 21, '#d7bd96');
        const seam = 23 + y * .78; line(c, seam, y, seam, y + 23, p.line);
        for (let i = 0; i < 3; i++) {
          const x = (y * 3 + i * 61) % 174;
          line(c, x, y + 8 + 3 * i, x + 17, y + 8 + 3 * i, '#dbc5a1');
        }
        disk(c, seam + 4, y + 5, 1.2, p.line);
      }
    } else if (id === 'frontier') {
      for (let i = 0; i < 30; i++) {
        const x = (i * 97) % 191, y = (i * 53 + 11) % 188;
        c.fillStyle = i % 3 === 0 ? p.line : '#dcc7b2'; c.fillRect(x, y, i % 5 + 2, 1 + i % 2);
      }
      c.strokeStyle = '#d9c4af'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(16, 21); c.bezierCurveTo(45, 39, 69, 7, 101, 20); c.stroke();
      c.beginPath(); c.moveTo(62, 151); c.bezierCurveTo(94, 170, 132, 138, 188, 152); c.stroke();
    } else {
      for (let y = 0; y < 192; y += 48) for (let x = 0; x < 192; x += 96) {
        c.fillStyle = p.panel; c.fillRect(x + 2, y + 2, 92, 44);
        c.strokeStyle = p.line; c.strokeRect(x + 4, y + 4, 88, 40);
        for (let i = 0; i < 4; i++) disk(c, x + (i % 2 ? 86 : 10), y + (i > 1 ? 38 : 10), 1.5, p.line);
        for (let i = 0; i < 6; i++) line(c, x + 34 + i * 6, y + 19, x + 34 + i * 6, y + 29, '#bfcbbf', 2);
      }
    }
    tiles.set(id, canvas);
    return canvas;
  }
  function drawArena(ctx, o = {}) {
    const id = o.faction, p = themes[id];
    if (!p) return false;
    const { w, h, x = 0, y = 0, viewW = w, viewH = h } = o;
    if (![w, h, viewW, viewH].every(v => Number.isFinite(v) && v > 0)) return false;
    const x0 = Math.floor(x / 192) * 192, y0 = Math.floor(y / 192) * 192;
    const x1 = x + viewW, y1 = y + viewH, art = tile(id);
    const quiet = o.reduced || o.quality === 'low';
    const time = quiet ? 0 : Number(o.time) || 0;
    ctx.save();
    ctx.fillStyle = p.floor; ctx.fillRect(x - 16, y - 16, viewW + 32, viewH + 32);
    if (art) for (let ty = y0 - 192; ty <= y1 + 16; ty += 192) for (let tx = x0 - 192; tx <= x1 + 16; tx += 192) ctx.drawImage(art, tx, ty);
    // These perimeter structures are painted into the floor and stay inside a decorative border.
    ctx.strokeStyle = p.metal; ctx.lineWidth = 3; ctx.strokeRect(9, 9, w - 18, h - 18);
    ctx.strokeStyle = p.line; ctx.lineWidth = 1; ctx.strokeRect(15, 15, w - 30, h - 30);
    for (const bx of [18, w - 18]) {
      if (bx < x - 40 || bx > x1 + 40) continue;
      for (let by = Math.max(117, Math.floor((y - 80) / 170) * 170 + 117); by < Math.min(h - 66, y1 + 70); by += 170) {
        const side = bx > w / 2 ? -1 : 1;
        ctx.save(); ctx.translate(bx, by); ctx.scale(side, 1);
        ctx.globalAlpha = .14; ctx.fillStyle = p.shade; ctx.fillRect(-2, -22, 19, 55); ctx.globalAlpha = 1;
        if (id === 'spectrum') {
          polygon(ctx, [0,-29,8,-29,17,-17,17,17,8,29,0,29], p.metal, p.shade, 1.4);
          polygon(ctx, [1,-20,8,-18,12,-8,12,9,8,18,1,20], p.light, p.line);
          line(ctx, 8, -12, 8, 12, p.accent, 2); line(ctx, 8, -12, 8, -2 + ((time * 20) % 9), p.flare, 1);
        } else if (id === 'blackpowder') {
          polygon(ctx, [0,-23,14,-24,17,-14,17,14,14,24,0,23], '#a17c54', p.shade, 1.4);
          for (const offset of [-15, 15]) line(ctx, 0, offset, 17, offset, p.metal, 3);
          disk(ctx, 8, 0, 3, p.light, p.metal);
        } else if (id === 'frontier') {
          polygon(ctx, [0,-25,17,-25,17,18,12,23,0,23], '#b3977d', p.metal);
          line(ctx, 3, -21, 13, 16, p.light, 2); line(ctx, 3, 17, 13, -20, p.metal, 2);
          line(ctx, 1, -26, 16, -26, p.shade, 3);
        } else {
          ctx.fillStyle = p.metal; ctx.fillRect(0, -23, 15, 46);
          line(ctx, 3, -21, 3, 21, p.light, 2);
          disk(ctx, 9, -7, 5, p.light, p.shade); line(ctx, 9, -7, 11, -9, '#934629', 1.4);
          gear(ctx, 8, 12, 6, -time * .6, p.accent, p.shade);
        }
        ctx.restore();
      }
    }
    for (const side of [18, h - 32]) if (side >= y - 32 && side <= y1 + 32) {
      for (let tx = Math.max(36, Math.floor((x - 95) / 140) * 140 + 36); tx < Math.min(w - 78, x1 + 32); tx += 140) {
        if (id === 'spectrum') {
          ctx.fillStyle = p.shade; ctx.fillRect(tx, side, 94, 10);
          ctx.fillStyle = p.accent; ctx.fillRect(tx + 7, side + 3, 80, 4);
          ctx.fillStyle = p.flare; ctx.fillRect(tx + 7 + ((time * 38 + tx) % 66), side + 3, 12, 4);
        } else if (id === 'blackpowder') {
          ctx.fillStyle = p.metal; ctx.fillRect(tx, side, 94, 10);
          for (let i = 0; i < 5; i++) disk(ctx, tx + 9 + i * 19, side + 5, 3, p.light, p.shade);
        } else if (id === 'frontier') {
          line(ctx, tx, side + 3, tx + 94, side + 3, p.metal, 2);
          line(ctx, tx, side + 10, tx + 94, side + 10, p.metal, 2);
          for (let i = 0; i < 6; i++) line(ctx, tx + i * 17, side, tx + i * 17, side + 14, p.line, 3);
        } else {
          line(ctx, tx, side + 6, tx + 95, side + 6, p.metal, 7);
          line(ctx, tx, side + 4, tx + 95, side + 4, p.light, 2);
          gear(ctx, tx + 46, side + 6, 9, time, p.accent, p.shade);
        }
      }
    }
    const lx = w / 2, ly = 61;
    if (lx >= x - 180 && lx <= x1 + 180 && ly >= y - 45 && ly <= y1 + 45) {
      ctx.fillStyle = p.shade; ctx.fillRect(lx - 140, ly - 19, 280, 38);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = p.light;
      ctx.font = '600 15px monospace'; ctx.fillText(p.text, lx, ly - 4);
      ctx.font = '9px monospace'; ctx.fillText(p.serial, lx, ly + 9);
    }
    ctx.restore();
    return true;
  }

  const profileRows = {
    spectrum: [
      ['carbine:46:5:packet','lens:53:7:ribbon','rail:62:4:needle','helix:49:7:helix','triad:43:6:chevron','orb:41:10:sphere','needle:66:3:needle','crystal:45:8:shard','frame:50:6:lattice','micro:48:3:pin'],
      ['micro:30:4:packet','fork:39:6:arc','needle:38:2:pin','beacon:35:7:star','twin:34:6:pair','disc:31:7:disc','lens:32:6:echo','tank:29:9:snow','coil:38:5:arc','crystal:34:8:sphere'],
      ['sword:47:3:cut','hammer:43:11:gravity','foil:54:2:cut','tonfa:34:6:cut','claws:33:5:cut','glaive:63:5:cut','hook:51:7:cut','baton:43:4:cut','axe:45:10:cut','gauntlet:29:9:pulse'],
      ['shield:31:11:field','pack:27:8:field','prism:34:6:field','node:35:9:field','lens:29:8:field','tank:32:10:field','antenna:33:5:field','coil:31:7:field','orb:29:8:field','turret:39:8:field']
    ],
    blackpowder: [
      ['musket:69:3:ball','rifle:59:4:slug','bell:45:8:pellet','volley:63:7:pair','needle:58:3:dart','wall:70:7:slug','cannon:45:11:ball','fowler:61:5:pellet','crank:49:8:ball','mortar:36:11:bomb'],
      ['flint:37:4:ball','twin:39:6:pair','screw:32:4:slug','pepper:33:8:ball','duck:38:7:pellet','beacon:37:6:star','horse:48:4:slug','rook:40:3:dart','mortar:31:9:bomb','dirk:39:4:pair'],
      ['bayonet:61:3:thrust','sabre:49:4:sweep','hanger:44:6:sweep','spontoon:64:6:thrust','boarding:45:10:sweep','ramrod:58:2:thrust','hook:62:6:pull','foil:55:2:thrust','mallet:40:11:impact','pallash:51:6:sweep'],
      ['satchel:30:9:field','dressing:28:7:field','gabion:34:11:field','roll:29:8:field','spurs:34:5:field','pouch:27:8:field','flag:35:8:field','box:31:7:field','basket:35:10:field','swivel:43:8:field']
    ],
    frontier: [
      ['lever:58:4:slug','coach:46:6:pellet','longhorn:66:3:needle','sharps:70:4:needle','pump:56:6:pellet','express:53:5:slug','twin:62:5:pair','quarry:67:4:slug','slugger:43:7:slug','mortar:39:10:bomb'],
      ['revolver:38:6:slug','derringer:27:4:pair','breaktop:35:6:slug','sixgun:37:7:pellet','scout:50:3:star','twin:31:6:pair','disc:37:7:slug','buntline:54:3:needle','pepper:34:8:slug','flare:33:6:star'],
      ['bowie:38:5:cut','hatchet:40:9:impact','spike:42:2:thrust','whip:63:3:lash','hook:54:6:pull','hammer:39:11:impact','club:46:6:impact','machete:49:6:sweep','spurs:30:5:cut','pick:45:9:thrust'],
      ['flare:30:6:field','dynamite:35:6:field','shield:34:11:field','bottle:27:7:field','spurs:33:7:field','spool:29:9:field','flag:34:7:field','belt:34:6:field','bundle:35:9:field','lookout:42:7:field']
    ],
    brassworks: [
      ['riveter:47:7:rivet','pressure:57:6:coil','disc:45:9:cog','stapler:49:8:staple','bell:43:11:steam','flywheel:51:9:cog','driver:60:7:bolt','fork:48:6:pair','lobber:39:11:slag','needle:62:3:needle'],
      ['piston:34:6:rivet','sprayer:32:9:steam','clock:38:7:staple','twin:40:6:pair','bearing:32:7:bearing','bellows:39:5:dart','spotter:37:6:star','popper:30:7:bolt','nozzle:36:9:soot','tank:31:10:slag'],
      ['wrench:43:7:impact','pike:65:4:thrust','tongs:51:8:pull','knuckles:29:10:impact','saw:44:11:saw','cleaver:49:9:sweep','lever:47:4:thrust','spanner:35:7:impact','shears:59:6:thrust','chisel:48:3:thrust'],
      ['vent:31:9:field','sentry:44:8:field','buckler:32:11:field','automaton:35:9:field','boots:34:8:field','coolant:31:11:field','oscillator:35:6:field','feedbox:32:8:field','boiler:33:11:field','crown:45:10:field']
    ]
  };
  const designCache = new Map();
  function design(source) {
    const item = lookup(source);
    if (!item || !profileRows[item.faction]) return null;
    if (designCache.has(item.id)) return designCache.get(item.id);
    const peers = (root.NeonArsenal||catalog)?.groups?.[item.slot]?.filter(candidate => candidate.faction === item.faction);
    const ordinal = peers?.findIndex(candidate => candidate.id === item.id);
    if (ordinal < 0 || ordinal === undefined) return null;
    const [form,length,bulk,projectile] = profileRows[item.faction][item.slot][ordinal].split(':');
    const palettes = {
      spectrum:['#20bfe4','#8970e7','#21b7a5','#6988e7','#ae59e1','#f2a84e','#76b2f7','#57bcae','#be7ae6','#488dd0'],
      blackpowder:['#982e48','#c39548','#6f4635','#7b3755','#b6a275','#b67b36','#bd603f','#687346','#aa8454','#86565c'],
      frontier:['#249395','#ba7445','#577ca1','#826748','#478c8d','#be6247','#437ea5','#9c813b','#5b9d84','#bd865a'],
      brassworks:['#2b897a','#ce7847','#a78836','#468f8d','#ad6942','#b69c54','#498c69','#be7150','#5a98a4','#90733d']
    };
    const result = Object.freeze({id:item.id,form,length:Number(length),bulk:Number(bulk),projectile,ordinal,
      accent:palettes[item.faction][ordinal],material:{spectrum:'pearl ceramic and optical glass',blackpowder:'walnut, iron, and burgundy wraps',frontier:'blued steel, copper, and saddle leather',brassworks:'oxidized brass, enamel, and teal glass'}[item.faction],
      silhouette:form+' construction with '+length+'-unit profile and '+bulk+'-unit receiver'});
    designCache.set(item.id,result);
    return result;
  }
  function ring(ctx,x,y,rx,ry,color,width=1.5) {
    ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();
  }
  function stock(ctx,length,width,p,variant) {
    polygon(ctx,[4,-1,14,-3,29,-width*.45,length-9,-1,length-11,3,20,width,8,width+2,4,4],p.stock,p.shade,1.5);
    line(ctx,8,2,22,1,p.trim,1);
    for(let n=0;n<2+variant%3;n++)line(ctx,11+n*3,3,12+n*3,width-1,p.accent,.75);
  }
  function drawSpectrumGun(ctx,item,d,p,o) {
    const end=d.length,wide=d.bulk,charge=o.charge,open=charge*3;
    const small=item.slot===1,back=small?11:5;
    polygon(ctx,[back,-wide+2,15,-wide,27,-wide-2,34,-wide+1,end-9,-3,end,-2,end,2,end-10,4,30,wide,14,wide,back,wide-3],p.metal,p.shade,1.6);
    polygon(ctx,[12,-wide+2,23,-wide-1,32,-wide+3,29,wide-2,17,wide-1,12,wide-3],p.light,p.shade,1);
    polygon(ctx,[14,wide-1,23,wide,19,wide+7,13,wide+6],p.shade,d.accent);
    if(['rail','needle','lattice'].includes(d.form)){
      line(ctx,29,-4-open,end,-4-open,p.shade,3);
      line(ctx,29,4+open,end,4+open,p.shade,3);
      line(ctx,32,-4-open,end-2,-4-open,d.accent,1.2);
      line(ctx,32,4+open,end-2,4+open,p.light,1);
      line(ctx,32,0,32+(end-32)*charge,0,p.flare,2);
    }else if(['lens','orb','crystal','beacon'].includes(d.form)){
      const radius=d.form==='orb'?wide:wide*.65;
      disk(ctx,end-7,0,radius,p.shade,d.accent,1.6);
      disk(ctx,end-7,0,radius*.68,d.accent,p.light);
      ring(ctx,end-6,0,3,radius+2+charge*2,p.light);
      if(d.form==='crystal')polygon(ctx,[end-12,0,end-6,-wide,end+1,0,end-6,wide],p.flare,d.accent);
    }else if(['fork','twin','frame','helix'].includes(d.form)){
      for(const side of [-1,1]){
        polygon(ctx,[26,side*3,34,side*(wide+1),end,side*(wide*.6),end+1,side*2],p.light,p.shade);
        line(ctx,32,side*(wide-1),end-3,side*3,d.accent,1.6);
      }
      if(d.form==='helix')for(let n=0;n<4;n++)line(ctx,30+n*4,-4,34+n*4,4,d.accent,1);
    }else if(d.form==='disc'){
      disk(ctx,27,0,wide+1,p.shade,p.light);
      ring(ctx,27,0,wide-1,wide-1,d.accent,2);
      line(ctx,26,-3,end,-3,p.light,2);
    }else{
      line(ctx,29,-2,end,-2,d.accent,2.3);
      for(let n=0;n<(d.form==='triad'?3:2);n++)ctx.fillRect(28+n*5,1,3,2);
      if(d.form==='coil')for(let n=0;n<3;n++)ring(ctx,29+n*4,0,2,5,d.accent);
    }
    if(d.form==='triad'){
      polygon(ctx,[25,-9,34,-13,39,-9,36,-4,29,-4],p.light,p.shade);
      disk(ctx,end-3,-5,2,d.accent,p.light);
      disk(ctx,end-3,5,2,d.accent,p.light);
    }else if(d.form==='carbine'){
      polygon(ctx,[23,5,32,6,31,13,24,11],p.metal,p.shade);
      line(ctx,26,7,29,10,d.accent,1.3);
    }else if(d.form==='micro'){
      polygon(ctx,[18,-4,21,-10,27,-9,28,-4],p.light,p.shade);
    }else if(d.form==='frame'){
      polygon(ctx,[26,-9,37,-12,44,-8,43,-4,38,-7,29,-5],p.light,p.shade);
      line(ctx,31,-7,40,-7,d.accent,1.3);
    }else if(d.form==='tank'){
      disk(ctx,20,wide+1,5,p.shade,d.accent,1.5);line(ctx,20,wide+1,34,3,p.light,1.2);
    }
    disk(ctx,20,0,2.2,o.heat>.8?'#e56857':d.accent,p.shade);
    if(o.reload>0){line(ctx,20,wide+2,25,wide+7-Math.sin(o.reload*Math.PI)*5,p.trim,3)}
  }
  function drawBlackpowderGun(ctx,item,d,p,o) {
    const end=d.length,wide=d.bulk;
    stock(ctx,end*.68,wide,p,d.ordinal);
    const cannon=['cannon','mortar','wall'].includes(d.form);
    const volley=['volley','twin','duck','pepper'].includes(d.form);
    const barrels=volley?(d.form==='pepper'?4:d.form==='duck'?3:2):1;
    if(cannon){
      polygon(ctx,[18,-wide,32,-wide-2,end,-wide*.8,end,wide*.8,26,wide+1,18,wide],p.metal,p.shade,2);
      ring(ctx,end-1,0,2,wide*.75,p.trim,2);
      line(ctx,24,-wide+1,end-4,-wide*.7,p.light,1);
      disk(ctx,23,wide+2,4,p.stock,p.shade);
    }else{
      for(let n=0;n<barrels;n++){
        const side=n-(barrels-1)/2,shift=d.form==='duck'?side*5:side*3;
        line(ctx,22,-3+side*3,end,-3+shift,p.shade,3.8);
        line(ctx,25,-4+side*3,end-1,-4+shift,p.light,.8);
        ring(ctx,end,-3+shift,1.2,1.6,p.shade,1);
      }
      if(d.form==='bell')polygon(ctx,[end-13,-4,end,-10,end+1,6,end-13,1],p.metal,p.shade,1.5);
      if(d.form==='screw')ring(ctx,end-4,-3,3,4,p.trim,1.5);
    }
    // Exposed flint lock, pan, and cock are placed alongside the stock.
    line(ctx,18,-3,20,-8,p.shade,2);
    polygon(ctx,[18,-8,20,-11,24,-9,21,-7],p.light,p.shade);
    line(ctx,22,-2,29,-2,p.trim,1.8);
    if(d.form==='crank'){disk(ctx,30,1,6,p.metal,p.trim);line(ctx,31,1,37,6,p.trim,1.7)}
    if(d.form==='dirk')polygon(ctx,[24,3,end+7,4,end,7,24,6],p.light,p.shade);
    if(d.form==='needle'||d.form==='rifle')line(ctx,28,-7,37,-7,p.shade,2);
    if(d.form==='volley')line(ctx,28,5,41,5,p.trim,2.3);
    if(d.form==='fowler'){ring(ctx,25,6,5,3,p.trim);line(ctx,43,-5,43,3,p.trim,1.8)}
    if(d.form==='wall'){line(ctx,26,wide+1,17,wide+8,p.shade,3);line(ctx,26,wide+1,39,wide+8,p.shade,3)}
    if(d.form==='horse')polygon(ctx,[12,3,21,4,19,12,12,10],p.stock,p.shade);
    line(ctx,29,3,end-2,3,p.trim,.85);
    ctx.fillStyle=p.accent;ctx.fillRect(10,1,7,2);
    if(o.reload>0){
      const insertion=Math.sin(o.reload*Math.PI);
      line(ctx,end+11-insertion*15,-1,end-7-insertion*15,-1,p.trim,1.5);
      polygon(ctx,[12,5,19,5,18,9,13,9],p.accent,p.shade);
    }
  }
  function drawFrontierGun(ctx,item,d,p,o) {
    const end=d.length,wide=d.bulk;
    const revolver=['revolver','sixgun','breaktop','buntline','pepper'].includes(d.form);
    const twin=['coach','twin','derringer'].includes(d.form);
    stock(ctx,end*.65,wide,p,d.ordinal);
    polygon(ctx,[15,-wide,28,-wide,33,-3,end,-3,end,1,31,2,25,wide,17,wide],p.metal,p.shade,1.5);
    line(ctx,29,-2,end-1,-2,p.light,1);
    const action=o.firing?Math.sin(o.time*25)*2:0;
    if(revolver){
      disk(ctx,24,-1,wide,p.metal,p.trim,1.2);
      for(let n=0;n<4;n++)line(ctx,21+n*1.6,-wide+1,21+n*1.6,wide-2,p.shade,.7);
      line(ctx,18,-wide,16,-wide-4,p.shade,2);
      polygon(ctx,[13,3,22,5,18,12,12,10],p.stock,p.shade);
      if(d.form==='breaktop'&&o.reload>0)line(ctx,31,-3,39+Math.sin(o.reload*Math.PI)*7,8,p.light,3);
    }else if(twin){
      line(ctx,28,2,end+1,2,p.shade,3);line(ctx,29,1,end,1,p.light,1);
      if(d.form==='coach')ring(ctx,23,6,6,4,p.trim,1);
    }else if(d.form==='lever'||d.form==='express'){
      ring(ctx,22,wide+1+action,7,4,p.shade,1.7);
      line(ctx,20,wide,29,wide+2+action,p.trim,.9);
    }else if(d.form==='pump'){
      ctx.fillStyle=p.stock;ctx.fillRect(31+action,-4,11,8);
      for(let n=0;n<4;n++)line(ctx,33+action+n*2,-3,33+action+n*2,3,p.shade,.75);
    }else if(d.form==='disc'){
      disk(ctx,27,0,6,p.trim,p.shade);ring(ctx,27,0,3,3,p.light);
    }else if(d.form==='mortar'){
      polygon(ctx,[24,-8,end,-9,end,6,24,7],p.metal,p.shade);
      ring(ctx,end,0,2,7,p.trim,2);
    }else{
      line(ctx,24,-6,35,-6,p.shade,2);
      if(['longhorn','sharps','quarry'].includes(d.form))line(ctx,27,-8,40,-8,p.metal,2.5);
    }
    if(d.form==='sharps'){polygon(ctx,[21,4,30,4,28,10,22,9],p.metal,p.shade);line(ctx,22,6,27,6,p.trim,1.5)}
    if(d.form==='quarry'){ring(ctx,end-11,-2,3.5,5,p.trim,1.4);line(ctx,32,4,end-13,4,p.trim,1.3)}
    if(d.form==='slugger'){ctx.fillStyle=p.stock;ctx.fillRect(27,3,9,5);line(ctx,28,4,34,4,p.trim,1)}
    if(d.form==='scout')polygon(ctx,[28,-5,31,-10,38,-10,40,-5],p.metal,p.shade);
    if(d.form==='flare')ring(ctx,end,0,2,5,p.trim,1.6);
    line(ctx,end-5,-3,end-5,-6,p.shade,1.5);
    ctx.fillStyle=d.accent;ctx.fillRect(17,-wide+1,4,2);
    if(o.reload>0){const t=Math.sin(o.reload*Math.PI);line(ctx,29,7,34,7-t*8,p.trim,2.4)}
  }
  function drawBrassworksGun(ctx,item,d,p,o) {
    const end=d.length,wide=d.bulk,phase=o.firing?Math.sin(o.time*26)*3:Math.sin(o.time*2)*.5;
    polygon(ctx,[8,-wide+2,17,-wide,29,-wide+1,34,-4,end,-4,end,4,31,4,24,wide+1,12,wide],p.metal,p.shade,1.8);
    line(ctx,11,-wide+3,28,-wide+2,p.light,1);
    polygon(ctx,[14,wide-1,23,wide,20,wide+7,13,wide+6],p.stock,p.shade);
    const wheel=['disc','flywheel','clock','stapler'].includes(d.form);
    if(wheel){
      gear(ctx,27,-1,wide*.82,o.time*(o.firing?13:2),p.light,p.shade);
      line(ctx,29,-2,end,-2,p.trim,2);
      if(d.form==='stapler'){line(ctx,34,-5,end,-5,p.shade,2);line(ctx,34,4,end,4,p.light,1.5)}
    }else if(['tank','lobber','bell','sprayer','nozzle'].includes(d.form)){
      disk(ctx,22,0,wide,p.stock,p.shade,1.5);
      disk(ctx,22,0,wide*.65,d.accent,p.light);
      if(d.form==='bell'||d.form==='nozzle'||d.form==='sprayer')polygon(ctx,[end-12,-3,end,-9,end+1,7,end-12,3],p.metal,p.shade,1.6);
      else line(ctx,31,-4,end,-4,p.light,2);
    }else if(d.form==='fork'||d.form==='twin'){
      for(const side of [-1,1]){line(ctx,26,side*5,end,side*5,p.shade,4);line(ctx,28,side*4,end-1,side*4,p.light,1.2)}
    }else{
      const shift=['piston','driver','popper'].includes(d.form)?phase:0;
      line(ctx,28,-2,end-1+shift,-2,p.light,3);
      for(let n=0;n<4;n++)line(ctx,31+n*4,-5,32+n*4,4,p.trim,1.5);
      if(d.form==='needle')line(ctx,end-15,0,end+1,0,p.shade,2);
    }
    disk(ctx,17,-1,4.2,p.light,p.shade,1.2);
    const needle=-2.3+o.heat*3.3+o.charge*.9;
    line(ctx,17,-1,17+Math.cos(needle)*2.9,-1+Math.sin(needle)*2.9,p.accent,1.2);
    line(ctx,14,wide-1,31,wide-1,p.trim,1.7);
    ring(ctx,30,wide-1,3,3,p.shade);
    if(d.form==='pressure')for(let n=0;n<4;n++)ring(ctx,31+n*5,0,2.5,6+o.charge*2,p.trim,1.6);
    if(d.form==='driver')line(ctx,23,wide+2,end-6+phase,wide+2,p.shade,3);
    if(d.form==='riveter'){polygon(ctx,[23,wide,34,wide,31,wide+7,25,wide+7],p.stock,p.shade);line(ctx,26,wide+1,29,wide+6,p.trim,1.2)}
    if(d.form==='fork')polygon(ctx,[30,-7,34,-11,43,-11,46,-6],p.stock,p.shade);
    if(d.form==='bellows'){for(let n=0;n<4;n++)line(ctx,14+n*4,-wide,16+n*4,wide,p.stock,1.8)}
    if(o.reload>0){const t=Math.sin(o.reload*Math.PI);polygon(ctx,[21,wide,30,wide,30,wide+5+t*3,21,wide+5+t*3],p.stock,p.shade)}
  }
  function drawMeleeModel(ctx,item,d,p,o) {
    const end=d.length,wide=d.bulk,form=d.form;
    const extension=form==='pike'||form==='shears'?Math.sin((o.attackProgress||0)*Math.PI)*8:0;
    const tip=end+extension;
    line(ctx,8,0,tip-13,0,p.shade,4.7);line(ctx,9,-.7,tip-15,-.7,item.faction==='blackpowder'||item.faction==='frontier'?p.stock:p.metal,2.2);
    for(let n=0;n<3;n++)line(ctx,11+n*3,-2,12+n*3,2,d.accent,1);
    if(['hammer','mallet','wrench','hatchet','axe','pick','boarding','cleaver','gauntlet','knuckles'].includes(form)){
      const left=tip-15;
      const pts=form==='pick'?[left,-2,tip,-wide,tip+4,-wide+3,tip-4,3,left,4]:
        /axe|hatchet|boarding|cleaver/.test(form)?[left,-3,tip-7,-wide,tip+2,-wide+1,tip+4,6,tip-4,wide,left,3]:
        form==='wrench'?[left,-wide,tip,-wide,tip+3,-5,tip-4,-3,tip+3,3,tip-1,wide,left,wide]:
        [left,-wide,tip,-wide,tip+3,-wide+4,tip+3,wide-2,tip-2,wide,left,wide];
      polygon(ctx,pts,p.metal,p.shade,1.8);line(ctx,left+3,-wide+2,tip-2,-wide+2,p.light,1.3);
      if(item.faction==='spectrum')disk(ctx,tip-7,0,3,d.accent,p.light);
      if(item.faction==='brassworks')gear(ctx,tip-7,0,4,o.time*2,p.light,p.shade);
    }else if(['hook','tongs','whip','claws','spurs'].includes(form)){
      if(form==='whip'){
        ctx.beginPath();ctx.moveTo(20,0);ctx.bezierCurveTo(33,-wide*3,tip-8,wide*3,tip,0);ctx.strokeStyle=p.stock;ctx.lineWidth=2.8;ctx.stroke();
      }else for(const side of form==='claws'||form==='tongs'||form==='spurs'?[-1,1]:[1])polygon(ctx,[23,side*2,tip-9,side*wide,tip,side*wide,tip+2,side*2,tip-4,side*4,tip-9,side*(wide-3),23,0],p.light,p.shade,1.3);
    }else if(form==='saw'){
      gear(ctx,tip-9,0,wide,o.time*7,p.light,p.shade);disk(ctx,tip-9,0,3,d.accent,p.shade);
    }else if(form==='club'||form==='ramrod'||form==='baton'||form==='lever'||form==='tonfa'){
      line(ctx,21,0,tip,0,p.shade,wide+1);line(ctx,23,-1,tip-2,-1,p.metal,Math.max(2,wide-2));
      if(form==='tonfa')line(ctx,24,0,24,10,p.shade,4);
      if(item.faction==='spectrum')line(ctx,27,-1,tip-3,-1,d.accent,1.2);
    }else{
      const curve=['sabre','hanger','machete','pallash','glaive','sword'].includes(form)?wide:0;
      polygon(ctx,[22,-2,tip-10,-wide-curve,tip+2,-curve,tip-7,wide*.35,22,2],p.light,p.shade,1.3);
      line(ctx,24,-1,tip-7,-curve,d.accent,1.1);
      line(ctx,21,-wide-2,21,wide+2,p.trim,2);
      if(form==='foil')ring(ctx,19,0,3,5,p.metal,1.2);
      if(form==='shears')polygon(ctx,[27,2,tip-4,wide+3,tip+1,2,27,0],p.metal,p.shade);
    }
  }
  function drawUtilityModel(ctx,item,d,p,o) {
    const form=d.form,x=22,wide=d.bulk;
    const shield=['shield','gabion','buckler'].includes(form);
    const flag=['flag','antenna','oscillator'].includes(form);
    const turret=['turret','sentry','crown','swivel','lookout'].includes(form);
    if(shield){
      polygon(ctx,[9,-wide,24,-wide-2,34,-wide+3,34,wide-4,23,wide+4,9,wide-1],p.metal,p.shade,1.8);
      polygon(ctx,[13,-wide+3,24,-wide+1,29,-wide+5,29,wide-5,23,wide,13,wide-3],d.accent,p.light);
      if(form==='gabion')for(let n=0;n<4;n++)line(ctx,12+n*4,-wide+2,13+n*4,wide-2,p.stock,1);
    }else if(flag){
      line(ctx,16,wide+2,16,-wide-8,p.shade,2.5);
      if(form==='flag')polygon(ctx,[17,-wide-8,d.length,-wide-5,d.length-5,-2,17,-3],d.accent,p.trim,1.1);
      else{ring(ctx,20,-wide,6,3,p.metal);line(ctx,20,-wide,29,-wide-5,d.accent,2);disk(ctx,29,-wide-5,2,p.flare,p.shade)}
      polygon(ctx,[10,wide,23,wide,28,wide+4,8,wide+4],p.metal,p.shade);
    }else if(turret){
      for(const side of [-1,1])line(ctx,22,2,22+side*14,12,p.shade,2.5);
      disk(ctx,22,0,wide,p.metal,p.shade,1.5);
      const aim=o.reduced?0:Math.sin(o.time*.8)*.3;
      ctx.save();ctx.translate(22,0);ctx.rotate(aim);line(ctx,0,-2,d.length-22,-2,p.shade,5);line(ctx,0,-3,d.length-23,-3,p.light,1.5);ctx.restore();
      if(item.faction==='brassworks')gear(ctx,22,1,wide*.7,o.time*2,d.accent,p.shade);
      else disk(ctx,22,0,3,d.accent,p.light);
    }else if(['bottle','orb','boiler','tank','coolant'].includes(form)){
      const round=form==='orb';
      if(round)disk(ctx,x,0,wide,p.metal,p.shade,1.5);
      else{ctx.fillStyle=p.metal;ctx.fillRect(14,-wide,15,wide*2);disk(ctx,x,-wide,7,p.metal,p.shade);disk(ctx,x,wide,7,p.metal,p.shade)}
      line(ctx,19,-wide+3,19,wide-3,p.light,2);disk(ctx,24,0,3,d.accent,p.light);
      line(ctx,x,-wide-3,x,-wide-7,p.shade,3);
    }else if(['spurs','boots','prism'].includes(form)){
      polygon(ctx,[8,-wide,19,-wide,21,-2,34,3,34,wide,12,wide,8,wide-3],p.stock,p.shade,1.6);
      line(ctx,13,-wide+2,17,wide-2,p.light,2);polygon(ctx,[22,-2,29,-7,33,-2,29,3],d.accent,p.shade);
    }else if(['spool','coil'].includes(form)){
      disk(ctx,x,0,wide,p.shade,p.metal,2);ring(ctx,x,0,wide*.7,wide*.7,d.accent,2);disk(ctx,x,0,2,p.light);
      line(ctx,x+wide,0,d.length,5,p.stock,2);
    }else{
      polygon(ctx,[9,-wide+2,15,-wide,29,-wide,34,-wide+4,32,wide,12,wide,9,wide-3],p.stock,p.shade,1.5);
      ctx.fillStyle=p.metal;ctx.fillRect(13,-wide+2,16,wide*2-4);
      if(['dressing','roll','lens','automaton'].includes(form)){line(ctx,x,-5,x,5,p.light,3);line(ctx,x-5,0,x+5,0,p.light,3)}
      else if(['box','feedbox','belt','pack'].includes(form))for(let n=0;n<3;n++)line(ctx,16+n*5,-wide+3,16+n*5,wide-3,p.light,2);
      else if(['dynamite','bundle'].includes(form))for(let n=0;n<3;n++)line(ctx,15+n*5,-wide+1,15+n*5,wide-1,p.trim,3);
      else {disk(ctx,x,0,4,d.accent,p.light);line(ctx,13,-wide+3,29,-wide+3,p.light,1)}
      line(ctx,12,0,32,0,d.accent,1);
    }
  }
  function drawHeld(ctx, source, o = {}) {
    const item=lookup(source),p=theme(item),d=design(item);
    if(!p||!d)return false;
    const quiet=o.reduced||o.quality==='low';
    const pose={time:quiet?0:Number(o.time)||0,heat:clamp(o.heat??item.heat,0,1),
      charge:clamp(o.charge??item.charge??(item.chargeTime&&item.chargeLeft>0?1-item.chargeLeft/item.chargeTime:0),0,1),
      reload:clamp(o.reload,0,1),firing:!!o.firing,reduced:quiet,attackProgress:o.attackProgress||0};
    ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
    if(o.preview){ctx.translate(-12,0);ctx.scale(1.35,1.35)}
    else if(pose.reload>0&&!quiet){ctx.translate(0,Math.sin(pose.reload*Math.PI)*2);ctx.rotate(Math.sin(pose.reload*Math.PI)*.10)}
    // One flat contact shadow keeps the construction grounded without a blur pass.
    ctx.save();ctx.globalAlpha*=.15;ctx.fillStyle=p.shade;
    ctx.beginPath();ctx.ellipse(23,6,Math.max(10,(d.length-8)*.48),Math.max(3,d.bulk*.55),0,0,TAU);ctx.fill();ctx.restore();
    if(item.slot===2)drawMeleeModel(ctx,item,d,p,pose);
    else if(item.slot===3)drawUtilityModel(ctx,item,d,p,pose);
    else gunRenderers[item.faction](ctx,item,d,p,pose);
    ctx.restore();return true;
  }
  const gunRenderers={spectrum:drawSpectrumGun,blackpowder:drawBlackpowderGun,frontier:drawFrontierGun,brassworks:drawBrassworksGun};

  function drawProjectile(ctx, source, o = {}) {
    const item = lookup(source), p = theme(item);
    if (!p) return false;
    const d=design(item),quiet=o.reduced||o.quality==='low',kind=d?.projectile||'slug',accent=d?.accent||p.accent;
    const radius=Math.max(2,Math.min(6,item.shotRadius||3)),t=quiet?0:Number(o.time)||0;
    ctx.save();ctx.lineCap='round';
    if(item.faction==='spectrum'){
      if(['sphere','snow','star'].includes(kind)){
        if(!quiet){ctx.globalAlpha*=.22;disk(ctx,0,0,radius+3,accent);ctx.globalAlpha/=.22}
        disk(ctx,0,0,radius,accent,p.shade,1);
        polygon(ctx,[-radius,0,0,-radius-1,radius+1,0,0,radius+1],p.flare,p.shade,.7);
        if(kind==='snow'){line(ctx,-5,-5,5,5,p.light,1);line(ctx,-5,5,5,-5,p.light,1)}
      }else if(['disc','shard','lattice'].includes(kind)){
        ctx.rotate(t*9);
        if(kind==='disc')ring(ctx,0,0,5,5,accent,2);
        else polygon(ctx,[-6,0,0,-4,5,0,0,4],p.flare,p.shade,1);
        line(ctx,-2,0,3,0,p.light,1);
      }else if(kind==='arc'){
        line(ctx,-12,0,-7,-3,accent,2.5);line(ctx,-7,-3,-3,2,accent,2.5);line(ctx,-3,2,3,0,p.light,1.4);
      }else{
        const length=kind==='needle'?23:kind==='pin'?17:12;
        line(ctx,-length,0,2,0,p.shade,3.5);
        line(ctx,-length+3,0,2,0,accent,2);
        line(ctx,-5,0,3,0,p.light,1);
        if(kind==='helix')for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(-13,side*3);ctx.quadraticCurveTo(-6,side*-3,0,side*2);ctx.strokeStyle=p.trim;ctx.lineWidth=1;ctx.stroke()}
        if(kind==='chevron'||kind==='pair')polygon(ctx,[-7,-4,0,0,-7,4,-4,0],p.flare,p.shade,.6);
        if(!quiet)line(ctx,-length-7,0,-length-2,0,accent,1);
      }
    }else if(item.faction==='blackpowder'){
      if(kind==='bomb'){
        disk(ctx,0,0,5,p.metal,p.shade,1.2);line(ctx,1,-4,5,-7,p.trim,1.5);disk(ctx,5,-7,1.5,p.flare,p.accent);
      }else if(kind==='dart'){
        polygon(ctx,[-8,-1,2,-1,5,0,2,1,-8,1],p.light,p.shade,.8);
      }else{
        if(!quiet){ctx.globalAlpha*=.22;disk(ctx,-8,1,2.5,p.stock);ctx.globalAlpha/=.22}
        if(kind==='slug'||kind==='pair')polygon(ctx,[-5,-2.1,1,-2.1,4,0,1,2.1,-5,2.1],p.metal,p.shade,1);
        else disk(ctx,0,0,kind==='pellet'?2.2:3.4,p.metal,p.shade,.9);
        line(ctx,-2,-1,1,-1,p.light,.8);
        if(kind==='star')line(ctx,-9,0,0,0,p.flare,2);
      }
    }else if(item.faction==='frontier'){
      const length=kind==='needle'?22:kind==='pellet'?5:kind==='star'?11:14;
      if(kind==='bomb'){polygon(ctx,[-5,-3,3,-3,5,0,3,3,-5,3],p.trim,p.shade,1);line(ctx,3,-2,7,-4,p.flare,1.7)}
      else{
        line(ctx,-length,0,1,0,p.shade,2.6);
        line(ctx,-length+2,0,2,0,kind==='star'?p.flare:p.trim,1.2);
        polygon(ctx,[-3,-1.8,1,-1.8,4,0,1,1.8,-3,1.8],p.light,p.shade,.8);
        if(kind==='pair')line(ctx,-6,-3,1,-3,accent,1);
        if(!quiet&&kind==='star')disk(ctx,-6,0,3,null,accent,.8);
      }
    }else{
      if(kind==='cog'||kind==='bearing'){
        if(kind==='cog')gear(ctx,0,0,5,t*13,p.metal,p.shade);
        else disk(ctx,0,0,4,p.light,p.shade,1.2);
        disk(ctx,0,0,1.3,p.shade);
      }else if(kind==='steam'||kind==='soot'||kind==='slag'){
        const shade=kind==='slag'?p.trim:kind==='soot'?p.shade:p.accent;
        polygon(ctx,[-5,-2,-1,-4,4,-2,5,1,1,4,-4,3],shade,p.shade,1);
        line(ctx,-8,1,-3,0,p.light,1);
      }else if(kind==='staple'||kind==='pair'){
        line(ctx,-4,-3,2,-3,p.light,2);line(ctx,2,-3,2,3,p.metal,2);line(ctx,2,3,-4,3,p.light,2);
      }else{
        polygon(ctx,[-7,-2,1,-2,4,0,1,2,-7,2],p.metal,p.shade,1);
        line(ctx,-5,-1,2,-1,p.light,.8);
        line(ctx,-5,-3,-5,3,p.trim,1.5);
        if(!quiet)line(ctx,-13,0,-9,0,accent,1.4);
      }
    }
    // A short payload signature identifies the item inside its faction family.
    // These geometric tails use the model accent and never resemble danger markers.
    if(d){
      const tail=7+d.ordinal*.85+(item.slot===1?2:0);
      const count=1+d.ordinal%3;
      for(let n=0;n<count;n++){
        const y=(n-(count-1)/2)*2.4;
        line(ctx,-tail-5-n*1.2,y,-tail-n*1.2,y,d.accent,item.faction==='spectrum'?1.25:.85);
      }
      if(d.ordinal%2)line(ctx,-tail-1,-2.7,-tail+1,2.7,p.light,.7);
    }
    ctx.restore();
    return true;
  }

  function drawBeam(ctx, beam, o = {}) {
    const { x, y, tx, ty } = beam;
    if (![x,y,tx,ty].every(Number.isFinite)) return false;
    const source=beam.item||beam.kind,item=lookup(source),p = theme(source) || themes.spectrum,d=design(item);
    ctx.save(); ctx.lineCap = 'round';
    if (!o.reduced && o.quality !== 'low') {
      const alpha = ctx.globalAlpha;
      ctx.globalAlpha = alpha * .20 * clamp(o.intensity ?? 1, 0, 1); line(ctx, x, y, tx, ty, d?.accent||p.accent, beam.rail ? 12 : 8); ctx.globalAlpha = alpha;
    }
    line(ctx, x, y, tx, ty, p.shade, beam.rail ? 5 : 4);
    line(ctx, x, y, tx, ty, p.flare, beam.rail ? 2.6 : 2.1);
    line(ctx, x, y, tx, ty, '#f9ffff', 1);
    if(!beam.rail&&!o.reduced&&o.quality!=='low'){
      const dx=tx-x,dy=ty-y,length=Math.hypot(dx,dy)||1;
      ctx.setLineDash([9,14]);line(ctx,x-dy/length*3,y+dx/length*3,tx-dy/length*3,ty+dx/length*3,p.trim,1);ctx.setLineDash([]);
    }
    if (beam.hit) {
      disk(ctx, tx, ty, beam.rail ? 5 : 3.5, '#f9ffff', d?.accent||p.accent, 1.4);
      if(beam.rail)ring(ctx,tx,ty,3,8,p.trim,1.1);
    }
    ctx.restore();
    return true;
  }

  function drawRay(ctx, event, lifeRatio = 1, reduced = false, quality = 'standard') {
    ctx.save(); ctx.globalAlpha = clamp(lifeRatio, .15, 1);
    const result = drawBeam(ctx, { x: event.x, y: event.y, tx: event.endX, ty: event.endY, kind: event.weaponKind, hit: event.hit === true, rail: lookup(event.weaponKind)?.ray==='rail'||event.weaponKind === 'vector-railgun' }, { reduced, quality });
    ctx.restore();
    return result;
  }

  function drawSlash(ctx, source, o = {}) {
    const item = lookup(source), p = theme(item);
    if (!p) return false;
    const reach = clamp(o.reach, 8, 300), arc = clamp(o.arc, .12, TAU), progress = clamp(o.progress, 0, 1);
    const d=design(item),heavy = /maul|hatchet|wrench|mallet|hammer|cleaver/.test(item.id);
    const fade = 1 - progress;
    ctx.save(); ctx.rotate(o.angle || 0);
    ctx.globalAlpha *= fade; ctx.lineCap = 'round';
    const thrust=item.pattern==='lunge'||d?.projectile==='thrust';
    ctx.beginPath();
    if(thrust){ctx.moveTo(reach*.25,0);ctx.lineTo(reach,0)}
    else ctx.arc(0, 0, reach, -arc / 2, arc / 2);
    ctx.strokeStyle = p.shade; ctx.lineWidth = heavy ? 5 : 3.2; ctx.stroke();
    ctx.strokeStyle = d?.accent||p.flare; ctx.lineWidth = heavy ? 2.4 : 1.4; ctx.stroke();
    if (!o.reduced && o.quality !== 'low') {
      ctx.globalAlpha *= .45;
      ctx.beginPath(); ctx.arc(0, 0, reach * (.77 + progress * .1), -arc * .37, arc * .37);
      ctx.strokeStyle = p.accent; ctx.lineWidth = heavy ? 3 : 1.6; ctx.stroke();
    }
    ctx.restore();
    return true;
  }

  function surfacePixels(quality, width, pixelRatio = 1) {
    if (quality === 'low') return 960;
    if (quality !== 'high') return 1280;
    const target = (Number(width) || 900) * clamp(pixelRatio, 1, 1.4);
    return target >= 1420 ? 1600 : 1280;
  }

  function drawBoss(ctx, enemy, o = {}) {
    const p = themes[o.faction];
    if (!p || !enemy) return false;
    const size = Number(enemy.r || enemy.radius || 40), quiet = o.reduced || o.quality === 'low';
    const time = quiet ? 0 : Number(o.time) || 0;
    const open = !!enemy.open, damaged = Number(enemy.hp) < (enemy.max || enemy.maxHp || 1) / 2;
    ctx.save(); ctx.translate(enemy.x, enemy.y); ctx.scale(size / 40, size / 40);
    ctx.globalAlpha = .21; ctx.fillStyle = p.shade; ctx.beginPath(); ctx.ellipse(0, 15, 46, 26, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
    if (o.faction === 'spectrum') {
      polygon(ctx, [0,-40,27,-19,31,12,16,35,-16,35,-31,12,-27,-19], p.shade, '#142230', 2.2);
      for (const side of [-1, 1]) {
        ctx.save(); ctx.translate(side * (open ? 12 : 6), 0); ctx.rotate(side * (.10 + Math.sin(time * .8) * .06));
        polygon(ctx, [side*8,-29,side*33,-19,side*36,11,side*26,24,side*10,13], p.light, p.shade, 2);
        line(ctx, side * 25, -13, side * 27, 10, p.accent, 3); ctx.restore();
      }
      polygon(ctx, [0,-22,11,0,0,21,-11,0], open ? p.flare : p.accent, p.light, 2);
    } else if (o.faction === 'blackpowder') {
      polygon(ctx, [-34,-31,33,-31,40,-19,36,29,0,39,-36,29,-40,-19], p.metal, p.shade, 3);
      for (const side of [-1, 1]) {
        disk(ctx, side * 27, 24, 11, '#896344', p.shade, 2);
        disk(ctx, side * 27, 24, 4, p.light, p.shade);
        polygon(ctx, [side*14,-24,side*35,-22,side*37,3,side*14,6], '#997149', p.shade, 1.6);
        const muzzleY = -37 + (open ? 10 : 0);
        ctx.fillStyle = p.shade; ctx.fillRect(side * 23 - 5, muzzleY, 10, 29);
        line(ctx, side * 23 - 3, muzzleY, side * 23 + 3, muzzleY, p.light, 2);
      }
      disk(ctx, 0, 6, 11, open ? p.flare : p.accent, p.shade, 3);
    } else if (o.faction === 'frontier') {
      polygon(ctx, [-43,-23,39,-23,44,-15,44,21,35,29,-35,29,-44,20,-44,-15], p.metal, p.shade, 3);
      for (const side of [-1, 1]) {
        line(ctx, -40, side * 25, 40, side * 25, p.shade, 5);
        for (let i = 0; i < 4; i++) disk(ctx, -30 + i * 20, side * 25, 4, p.light, p.shade);
      }
      polygon(ctx, [-23,-15,23,-15,29,13,-28,13], '#b78b65', p.shade, 2);
      ctx.save(); ctx.rotate(Math.sin(time) * .15);
      ctx.fillStyle = p.shade; ctx.fillRect(-4, -33 + (open ? 7 : 0), 8, 23); ctx.restore();
      ctx.fillStyle = open ? p.flare : p.accent; ctx.fillRect(-12, -7, 24, 14);
    } else {
      gear(ctx, 0, 1, 38, time * .26, p.metal, p.shade);
      for (const side of [-1, 1]) {
        line(ctx, side * 25, -16, side * 44, 20 + Math.sin(time * 3) * 4, p.shade, 10);
        line(ctx, side * 25, -15, side * 44, 16 + Math.sin(time * 3) * 4, p.light, 4);
      }
      disk(ctx, 0, 1, 24, '#a78248', p.shade, 3);
      disk(ctx, 0, 1, 16, open ? p.flare : p.light, p.shade, 2);
      const a = damaged ? 1.25 : -.85 + Math.sin(time * 1.2) * .45;
      line(ctx, 0, 1, Math.sin(a) * 12, 1 - Math.cos(a) * 12, '#8e3121', 2.4);
    }
    if (damaged) {
      line(ctx, -15, -7, -8, 2, '#2e2825', 2); line(ctx, -8, 2, -12, 10, '#2e2825', 2);
      line(ctx, 19, 10, 25, 16, '#2e2825', 2);
    }
    ctx.restore();
    return true;
  }

  function createFX() {
    const active = [];
    return {
      clear() { active.length = 0; },
      count() { return active.length; },
      event(kind, source, x, y, o = {}) {
        const item = lookup(source), base = theme(item),d=design(item);
        const p=base&&d?{...base,accent:d.accent}:base;
        if (!p || !Number.isFinite(x) || !Number.isFinite(y)) return false;
          const name = item.id || item.kind;
        const powder = ['blackpowder', 'frontier'].includes(item.faction), steam = item.faction === 'brassworks';
        const duration = kind === 'fire' ? (powder || steam ? .35 : .16) : kind === 'slash' ? .23 : .31;
        if (active.length >= 42) active.shift();
        active.push({ kind, p, d, item, x, y, angle: Number(o.angle) || 0, reach: clamp(o.reach || 35, 10, 85), life: duration, age: 0, powder, steam, heavy: /musket|coach|rail|lance|maul|dynamite|satchel/.test(name), width: /blunderbuss|coach|sprayer/.test(name) ? 12 : 6 });
        return true;
      },
      draw(ctx, dt, o = {}) {
        const quiet = o.reduced, low = o.quality === 'low', intensity = clamp(o.intensity ?? 1, 0, 1);
        for (let i = active.length - 1; i >= 0; i--) {
          const e = active[i]; e.age += clamp(dt, 0, .1);
          if (e.age >= e.life) { active.splice(i, 1); continue; }
          if (!intensity || (o.visible && !o.visible(e, e.reach + 20))) continue;
          const progress = e.age / e.life, decay = 1 - progress;
          ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.angle);
          ctx.globalAlpha = decay * intensity; ctx.lineCap = 'round';
          if (e.kind === 'fire') {
            const force = e.heavy ? 1.45 : 1;
            if(progress<.45&&o.flash!==false){
              if(e.item.faction==='spectrum'){
                ring(ctx,2,0,2,4+e.width*.3,e.p.accent,1.4);
                polygon(ctx,[0,-2,12,-1,17*force,0,12,1,0,2],e.p.flare,e.p.shade,.7);
              }else if(e.item.faction==='brassworks'){
                line(ctx,0,-3,14*force,-1,e.p.trim,2);
                line(ctx,0,3,14*force,1,e.p.light,2);
                disk(ctx,4,0,3,e.p.flare,e.p.shade,.8);
              }else{
                polygon(ctx,[0,-3,11,-e.width*.6,9,-2,24*force,0,9,2,11,e.width*.6,0,3],e.p.flare,e.p.accent);
                if(e.item.faction==='blackpowder')disk(ctx,18-muzzleOffset(e.item),-6,2.2,e.p.flare,e.p.trim,.7);
              }
            }
            if ((e.powder || e.steam) && !quiet && !low) {
              ctx.globalAlpha = decay * .16 * intensity; ctx.fillStyle = e.steam ? '#c6ddd5' : '#cfc3b5';
              for (let j = 0; j < 3; j++) {
                ctx.beginPath(); ctx.ellipse(6 + j * 5 + progress * 21, (j - 1) * e.width + progress * 9, 4 + progress * (11 + j), 3 + progress * 5, -.3, 0, TAU); ctx.fill();
              }
            }
          } else if (e.kind === 'vent') {
            const r = 13 + (quiet ? 0 : progress * 21);
            disk(ctx, 0, 0, r, null, e.p.accent, 2);
            if (!quiet && !low) {
              ctx.globalAlpha *= .20;
              for (const side of [-1, 1]) {
                ctx.fillStyle = '#82958a'; ctx.beginPath(); ctx.ellipse(side * r, 4, 8 + progress * 9, 4 + progress * 5, side * .3, 0, TAU); ctx.fill();
              }
            }
          } else if (e.kind === 'slash') {
            ctx.beginPath(); ctx.arc(0, 0, e.reach * (.78 + (quiet ? .08 : progress * .2)), -.62, .62);
            ctx.strokeStyle = e.p.shade; ctx.lineWidth = 3.6; ctx.stroke();
            ctx.strokeStyle = e.p.flare; ctx.lineWidth = 1.6; ctx.stroke();
          } else {
            const n = low || quiet ? 4 : e.heavy ? 9 : 6;
            const stretch = quiet ? 5 : 5 + progress * (e.heavy ? 24 : 16);
            for (let j = 0; j < n; j++) {
              const a = j * 2.399, x = Math.cos(a) * stretch, y = Math.sin(a) * stretch;
              if(e.item.faction==='spectrum'){
                polygon(ctx,[x-2,y,x,y-2,x+3,y,x,y+2],j%2?e.p.accent:e.p.light,e.p.shade,.6);
              }else if(e.item.faction==='blackpowder'){
                ctx.fillStyle=j%2?e.p.trim:e.p.shade;ctx.fillRect(x,y,2+j%2,2);
              }else if(e.item.faction==='frontier'){
                line(ctx,x,y,x+Math.cos(a)*(4+j%3),y+Math.sin(a)*(4+j%3),j%2?e.p.trim:e.p.shade,1.1);
              }else{
                if(j===0&&!low&&!quiet)gear(ctx,x,y,3,progress*3,e.p.trim,e.p.shade);
                else line(ctx,x,y,x+Math.cos(a)*3,y+Math.sin(a)*3,j%2?e.p.accent:e.p.shade,1.4);
              }
            }
          }
          ctx.restore();
        }
      }
    };
  }

  const soundFamilies = Object.freeze({
    spectrum: [660, 'sine', .11, .073, 165, 2.2, .22, .007],
    blackpowder: [133, 'triangle', .20, .095, -72, .64, .32, .029],
    frontier: [242, 'square', .13, .072, -100, .64, .24, .018],
    brassworks: [310, 'triangle', .15, .072, -112, 1.68, .32, .024]
  });
  function registerSounds(defineSound, items = root.NeonArsenal?.groups?.flat()) {
    for (const item of items || []) {
      if (!theme(item)) continue;
      const [base, wave, length, volume, sweep, ratio, layer, noise] = soundFamilies[item.faction];
      const id = item.id, slot = item.slot,d=design(item);
      const intervals=[0,7,3,10,5,12,2,9,4,14];
      const pitch=(base+slot*37)*Math.pow(2,intervals[d?.ordinal||0]/24);
      const heavy = /railgun|musket|coach|maul|dynamite|satchel|cannon|mortar|wall/.test(id);
      const firingPattern = item.burstGap?[0,item.burstGap,item.burstGap*2]:/double|coach|volley/.test(id) ? [0, .024] : item.chargeTime||/coil|railgun/.test(id) ? [0, .058] : [0];
      const ring=['sphere','cog','bearing','ribbon'].includes(d?.projectile),sharp=['pin','needle','dart'].includes(d?.projectile);
      const texture=noise*(sharp?.6:ring?1.15:1)+(slot===2?.003:0);
      defineSound(item.sfx || 'arsenal-' + id, pitch * (heavy ? .73 : 1), sharp&&item.faction==='spectrum'?'triangle':wave, length + (heavy ? .064 : ring?.04:0), volume, sweep*(sharp?1.4:ring?.55:1), ratio+(d?.ordinal%3||0)*.13, layer, texture, firingPattern);
      if(item.chargeTime)defineSound('arsenal-charge-'+item.kind,pitch*.6,'sine',Math.min(.5,item.chargeTime),.035,pitch*.5,1.4,.12,.002);
      if(item.heatPerShot)defineSound('arsenal-vent-'+item.kind,110+(d?.ordinal||0)*11,'triangle',.20,.045,-70,1.2,.16,.035);
      if (slot < 2) {
        const style = item.reloadStyle || 'arsenal-' + id;
        const reloadPattern = /musket|flintlock/.test(id) ? [0,.10,.20] : item.reloadMode==='incremental'||/revolver|repeater|coach/.test(id) ? [0,.082] : [0];
        defineSound('reload-' + style, pitch * .68 + 135, wave, .105, .047, -44, 1.45, .15, noise * .66, reloadPattern);
        defineSound('reload-action-' + style, pitch * .8 + 194, wave, .064, .038, -58, 1.3, .16, noise * .6);
        defineSound('reload-complete-' + style, pitch + 159, 'triangle', .115, .053, 76, 1.5, .18, noise * .35);
      } else if (slot === 2) {
        defineSound('melee-impact-' + item.kind, pitch * .5, 'triangle', .11, .065, -80, 1.4, .25, noise);
      }
    }
  }
  function itemDefinition(source) {
    const item=lookup(source),d=design(item),p=theme(item);
    if(!d||!p)return null;
    return {...d,colors:[p.shade,p.metal,p.light,d.accent,p.trim],materials:d.material,animation:
      item.slot===2?d.form+' windup and recovery':item.slot===3?d.form+' placement cue':
      item.chargeTime?'charge opens the '+d.form+' assembly':item.reloadMode==='incremental'?'individual loading stroke':
      item.faction==='brassworks'?'pressure gauge, piston stroke, and vent':item.faction==='frontier'?'mechanical action and ejection':'ignition and reload cycle'};
  }
  return { themes, design, itemDefinition, drawArena, drawHeld, drawProjectile, drawBeam, drawRay, drawSlash, drawBoss, muzzleOffset, surfacePixels, createFX, registerSounds };
});
