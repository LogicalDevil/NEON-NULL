/* Shared cosmetic-only artwork. Geometry is cached; no gameplay state is mutated. */
(()=>{'use strict';
const TAU=Math.PI*2,operators=new Map(),weapons=new Map(),cache=new Map(),plainWeapons=new Map();
const materials=['brushed alloy','fractured glass','porcelain ceramic','exposed machinery','faceted crystal','woven ceramic','carbon lattice','segmented titanium','frosted composite','contained energy'];
const auraNames=['orbiting shards','segmented reactor rings','soft radial rays','inward core particles','directional vent exhaust','flowing dash ribbons','assembling geometry','joint-to-joint arcs','drifting material fragments','ground projection'];
const bodyNames=['scout chassis','reinforced diver','split-plate sentinel','robed surveyor','floating construct','broad bastion','crystal explorer','asymmetric engineer','ceremonial guardian','winged courier','suspended oracle','armored nomad','reactor carrier','hooded agent','heavy foundry frame','hollow automaton','blade-shoulder marshal','segmented phantom','deep-space cartographer','sun-core vessel'];
const baseSpecs=[
 [0,0,0,0,0,0],[7,2,1,2,0,7],[2,5,3,8,1,6],[1,1,3,3,8,8],[1,1,9,2,3,4],
 [16,4,6,9,4,8],[18,2,4,7,1,1],[14,0,8,1,3,4],[3,5,9,8,5,5],[8,6,10,6,7,2],
 [17,7,6,0,5,5],[5,8,12,6,7,9],[12,3,13,2,3,4],[11,9,14,3,6,0],[4,10,15,8,1,6],
 [15,11,16,6,9,3],[13,12,17,7,6,1],[10,13,18,5,9,3],[8,11,18,9,7,0],[19,1,7,10,2,2]
];
const originalIds=['mono','amber','archive','polar','cinder','verdigris','lunar','foundry','tide','monarch','spectral','bastion','wildfire','deepfield','parallax','blackstar','eclipse','singularity','nullcrown','firstlight'];
const weaponKinds=['rifle','smg','shotgun','railgun','carbine','coil rifle','nova launcher','seeker launcher','sniper','charge lance','burst rifle','revolver','automatic shotgun','grenade launcher','ricochet launcher','beam emitter','flare pistol','throwing blades','disc launcher','EMP sidearm','seeker darts','scatter pistol','boomerang','harpoon','singularity cannon','shard launcher'];
const kitNames=['suspended rail','armored heat shroud','fractured blade casing','open conductor cage','split receiver','rotary cylinder','offset double chamber','floating fin assembly','crystal spine','segmented disc chamber','skeletal stock','folded shell casing','reactor cradle','exposed reciprocator'];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),num=v=>Number.isFinite(Number(v))?Number(v):0;
function rect(list,x,y,w,h,fill='body',stroke=true){list.push({type:'rect',x,y,w,h,fill,stroke})}
function poly(list,points,fill='body',stroke=true){list.push({type:'poly',points,fill,stroke})}
function circle(list,x,y,r,fill='body',stroke=true){list.push({type:'circle',x,y,r,fill,stroke})}
function line(list,points,fill='edge',width=1){list.push({type:'line',points,fill,width})}
function operatorGeometry(d){
 const list=[],g=d.geometry,{frame,head,pack,shoulder,detail}=g,w=8+frame%5,h=11+frame%4;
 // Back assembly changes the model outline before the chest and head are drawn.
 switch(pack%10){
  case 0:rect(list,-w-4,-7,5,19,'dark');rect(list,-w-6,-3,3,10,'metal');break;
  case 1:for(const y of [-6,5])circle(list,-w-4,y,4,'metal');line(list,[[-w-4,-6],[-w-4,5]],'dark',2);break;
  case 2:poly(list,[[-w,-7],[-w-13,-16],[-w-8,7],[-w,12]],'metal');poly(list,[[w,-7],[w+12,-15],[w+7,8],[w,12]],'body');break;
  case 3:rect(list,-w-7,-12,7,25,'metal');rect(list,-w-9,-18,3,10,'dark');circle(list,-w-8,-18,3,'accent');break;
  case 4:circle(list,-w-5,0,8,'metal');circle(list,-w-7,-2,6,'paper');rect(list,-w-3,-7,5,14,'dark');break;
  case 5:for(let i=0;i<3;i++)poly(list,[[-w-4-i*3,-14+i*8],[-w-9-i*2,-7+i*8],[-w-1,2+i*6]],i%2?'metal':'body');break;
  case 6:poly(list,[[-w,-10],[-w-10,-12],[-w-15,14],[-2,19],[-w+2,7]],'dark');line(list,[[-w-4,-8],[-w-8,10],[-3,16]],'metal');break;
  case 7:circle(list,-w-5,0,11,'metal');circle(list,-w-5,0,7,'dark');circle(list,-w-5,0,3,'accent');break;
  case 8:for(const y of [-10,0,10])rect(list,-w-8,y,6,6,y===0?'accent':'metal');break;
  case 9:rect(list,-w-6,-13,6,27,'dark');for(let i=0;i<4;i++)line(list,[[-w-5,-8+i*6],[-w-1,-8+i*6]],'metal',2);break;
 }
 // Twenty frame outlines, not a single recolored torso.
 switch(frame%5){
  case 0:poly(list,[[-w,-h],[w-2,-h],[w+2,-3],[w-1,h],[-w+2,h],[-w-2,-2]],'body');break;
  case 1:rect(list,-w-2,-h,2*w+3,2*h,'body');rect(list,-w-1,-h-2,2*w,4,'metal');break;
  case 2:poly(list,[[-w-3,-h],[w,-h-3],[w+1,6],[3,h+3],[-w,h]],'body');break;
  case 3:poly(list,[[-w,-h-3],[w,-h],[w+5,h+7],[-w-5,h+7]],'body');line(list,[[0,-h],[1,h+5]],'metal');break;
  case 4:poly(list,[[-w,-h],[-2,-h+4],[w,-h-3],[w+1,h],[-w+2,h+1]],'body');rect(list,-2,-h+3,3,2*h-3,'dark');break;
 }
 // Distinct head constructions: dome, masks, crowns, split lenses, crests, horns.
 const hx=-2,hy=-h-7;
 switch(head%8){
  case 0:rect(list,hx-6,hy-7,13,12,'body');rect(list,hx-4,hy-4,9,3,'accent');break;
  case 1:circle(list,hx,hy,8,'body');rect(list,hx-5,hy-3,11,5,'dark');rect(list,hx-3,hy-2,7,2,'accent');break;
  case 2:poly(list,[[hx-7,hy-5],[hx,hy-10],[hx+8,hy-4],[hx+5,hy+5],[hx-5,hy+5]],'body');line(list,[[hx-4,hy],[hx+4,hy]],'accent',2);break;
  case 3:rect(list,hx-7,hy-5,14,11,'body');for(let i=0;i<3;i++)rect(list,hx-6+i*5,hy-11,3,8,'metal');circle(list,hx,hy,2,'accent');break;
  case 4:poly(list,[[hx-8,hy-8],[hx+7,hy-5],[hx+9,hy+4],[hx,hy+7],[hx-7,hy+1]],'metal');rect(list,hx-5,hy-2,4,3,'dark');rect(list,hx+2,hy-1,4,3,'accent');break;
  case 5:rect(list,hx-7,hy-5,14,11,'body');poly(list,[[hx-6,hy-4],[hx-10,hy-13],[hx-3,hy-6]],'metal');poly(list,[[hx+3,hy-5],[hx+10,hy-12],[hx+6,hy-2]],'metal');break;
  case 6:poly(list,[[hx-7,hy-4],[hx-2,hy-12],[hx+3,hy-9],[hx+7,hy-3],[hx+4,hy+5],[hx-5,hy+4]],'body');rect(list,hx-1,hy-6,2,9,'accent');break;
  case 7:circle(list,hx,hy,7,'metal');rect(list,hx-8,hy-2,16,4,'dark');rect(list,hx+5,hy-1,5,2,'accent');line(list,[[hx-3,hy-7],[hx-5,hy-14]],'dark',2);break;
 }
 // Arm geometry affects both left and right silhouettes, including asymmetry.
 const sw=4+shoulder%4;
 switch(shoulder%5){
  case 0:rect(list,-w-sw,-8,sw,16,'body');rect(list,w,-6,5,13,'body');break;
  case 1:poly(list,[[-w,-10],[-w-sw-4,-13],[-w-sw-5,2],[-w,8]],'metal');rect(list,w,-8,6,17,'body');break;
  case 2:circle(list,-w-3,-6,sw,'metal');circle(list,w+3,-5,Math.max(3,sw-2),'body');rect(list,-w-5,1,5,11,'dark');break;
  case 3:poly(list,[[-w,-9],[-w-8,-16],[-w-5,6],[-w,11]],'body');poly(list,[[w,-6],[w+8,-14],[w+5,8],[w,11]],'metal');break;
  case 4:rect(list,-w-6,-11,6,7,'metal');rect(list,-w-5,0,4,10,'body');rect(list,w+2,-7,5,14,'metal');break;
 }
 // Distinct chest cutouts and material construction.
 switch(detail%7){
  case 0:rect(list,-w+3,-h+4,w+3,4,'accent');rect(list,-3,2,5,6,'dark');break;
  case 1:poly(list,[[-5,-7],[4,-9],[5,3],[-3,8],[-7,1]],'metal');line(list,[[-4,-5],[2,-1],[-1,5]],'dark',2);break;
  case 2:circle(list,0,-1,5,'dark');circle(list,0,-1,2,'accent');for(let i=0;i<3;i++)rect(list,-7+i*6,7,3,3,'metal');break;
  case 3:for(let i=0;i<3;i++)rect(list,-6,-7+i*5,12,2,i===1?'accent':'metal');break;
  case 4:poly(list,[[-6,-7],[5,-4],[-3,6]],'accent');line(list,[[-8,3],[5,6]],'metal');break;
  case 5:rect(list,-5,-8,4,13,'metal');rect(list,2,-6,4,14,'dark');line(list,[[-3,-4],[4,0],[-3,4]],'accent');break;
  case 6:circle(list,-1,-1,6,'metal');circle(list,-1,-1,4,'body');line(list,[[-5,-5],[3,3]],'accent',2);break;
 }
 // Material construction is drawn, rather than existing only as descriptive text.
 switch(materials.indexOf(d.material)){
  case 0:for(let n=0;n<3;n++)line(list,[[-5,-7+n*2],[1,-7+n*2]],'metal');break;
  case 1:line(list,[[-5,-8],[-1,-2],[-5,3],[3,7]],'paper');line(list,[[-1,-2],[5,-5]],'paper');break;
  case 2:line(list,[[-6,-8],[-6,7],[5,7]],'paper');rect(list,3,-5,2,8,'metal',false);break;
  case 3:for(let n=0;n<2;n++){rect(list,-5+n*6,-6,2,13,'dark');rect(list,-5+n*6,-4,2,4,'metal',false)}break;
  case 4:poly(list,[[-5,-7],[2,-9],[6,1],[1,6],[-4,2]],'metal');line(list,[[-5,-7],[1,0],[6,1]],'accent');break;
  case 5:for(let n=0;n<3;n++)for(let k=0;k<2;k++)rect(list,-5+n*4,-4+k*5,2,2,'metal',false);break;
  case 6:line(list,[[-6,-6],[5,5],[-5,5],[4,-5]],'metal');break;
  case 7:for(let n=0;n<3;n++)rect(list,-5,-6+n*5,10,3,'metal');break;
  case 8:for(let n=0;n<4;n++)rect(list,-6+n*3,-8+(n%2)*3,2,2,'paper',false);break;
  case 9:circle(list,-1,-1,6,'dark');circle(list,-1,-1,3,'accent');line(list,[[-1,-7],[-1,5]],'metal');break;
 }
 // Each inventory entry has a fixed structural ankle/boot spacing and notches.
 const gap=3+g.boot%4,bw=4+g.boot%3;
 rect(list,-gap-bw,h-1,bw,6+g.boot%3,'dark');rect(list,gap-1,h-1,bw,5+(g.boot+1)%3,'body');
 rect(list,-gap-bw-1,h+4+g.boot%3,bw+2,3,'metal');rect(list,gap-1,h+4,bw+3,3,'dark');
 return list;
}
function weaponGeometry(d){
 const list=[],g=d.geometry,idx=d.weaponIndex,sidearm=idx>=16,baseLength=[27,21,25,35,27,28,29,27,39,34,28,20,26,29,25,34,22,20,22,22,23,24,22,33,30,25][idx]||27;
 const L=baseLength+g.length,thick=3+g.girth,kind=idx;
 // Native type establishes firing profile before skin-specific receiver is added.
 if([17,22].includes(kind)){poly(list,[[6,-2],[L,-7],[L-4,0],[L,-1],[9,5]],'metal');rect(list,4,-3,7,8,'dark');}
 else if([18,14].includes(kind)){circle(list,15,0,9+g.girth,'metal');circle(list,15,0,5+g.girth,'dark');rect(list,16,-3,L-14,6,'body');}
 else if([6,7,13,24].includes(kind)){rect(list,7,-thick-3,L-10,2*thick+6,'body');circle(list,L-3,0,thick+3,'metal');circle(list,L-3,0,thick,'dark');}
 else if([2,12,21].includes(kind)){rect(list,9,-thick,L-8,thick,'metal');rect(list,9,1,L-8,thick,'dark');rect(list,L,-thick-1,4,2*thick+3,'body');}
 else if([3,8,23].includes(kind)){rect(list,4,-3,L-2,6,'dark');rect(list,12,-2,L-11,3,'metal');rect(list,5,-7,15,4,'body');rect(list,12,-11,9,4,'dark');}
 else if([5,9,15,19].includes(kind)){rect(list,4,-4,L,8,'dark');for(let i=0;i<4;i++)rect(list,10+i*(L-12)/4,-6,2,12,'metal');}
 else{rect(list,5,-thick,L-3,2*thick,'body');rect(list,L-2,-thick-1,4,2*thick+2,'metal');}
 // Fourteen receiver structures retain recognizable base weapon length.
 switch(g.kit%14){
  case 0:rect(list,9,-thick-3,L-13,2,'metal');rect(list,9,thick+1,L-13,2,'metal');line(list,[[11,-thick],[L-6,0],[11,thick]],'accent');break;
  case 1:poly(list,[[7,-thick-4],[L-10,-thick-4],[L-5,-thick],[L-11,thick+3],[8,thick+3]],'metal');for(let i=0;i<3;i++)rect(list,12+i*4,-2,2,4,'dark');break;
  case 2:poly(list,[[8,-thick-5],[L-13,-thick-2],[L-5,-thick-4],[L-11,4],[15,thick+4],[6,3]],'body');line(list,[[10,-3],[15,2],[20,-1],[L-9,3]],'paper');break;
  case 3:rect(list,9,-thick-3,3,2*thick+6,'metal');rect(list,L-12,-thick-3,3,2*thick+6,'metal');circle(list,(L+15)/2,0,3,'accent');break;
  case 4:rect(list,6,-thick-4,L-13,thick,'metal');rect(list,10,2,L-16,thick+2,'body');line(list,[[8,0],[L-9,0]],'accent',2);break;
  case 5:circle(list,14,1,thick+3,'metal');circle(list,14,1,thick,'dark');for(let i=0;i<3;i++)rect(list,11+i*3,-2,1,6,'accent');break;
  case 6:rect(list,5,-thick-5,L-12,5,'body');rect(list,11,1,L-15,6,'metal');line(list,[[6,-1],[L-5,-1]],'dark',2);break;
  case 7:poly(list,[[10,-thick-1],[14,-thick-8],[L-9,-thick-5],[L-5,-thick]],'metal');poly(list,[[13,thick],[L-10,thick+6],[L-7,thick]],'body');break;
  case 8:poly(list,[[7,-thick],[13,-thick-7],[19,-thick-2],[L-8,-thick-5],[L-4,1],[17,3]],'accent');line(list,[[12,-4],[18,-1],[23,-4]],'paper');break;
  case 9:circle(list,14,0,thick+5,'body');circle(list,14,0,thick+2,'metal');circle(list,14,0,2,'accent');break;
  case 10:poly(list,[[4,-4],[-3,-8],[-5,-5],[-1,5],[7,4]],'metal');rect(list,7,-2,5,3,'paper');break;
  case 11:poly(list,[[5,-thick-2],[15,-thick-5],[L-9,-thick],[L-11,thick+2],[9,thick+5]],'body');line(list,[[7,-3],[16,0],[11,5]],'metal',2);break;
  case 12:rect(list,6,-thick-3,3,2*thick+6,'dark');rect(list,22,-thick-3,3,2*thick+6,'dark');circle(list,16,0,5,'metal');circle(list,16,0,3,'accent');break;
  case 13:rect(list,7,-thick-3,L-14,4,'metal');rect(list,12,thick,8,4,'body');line(list,[[8,-thick],[13,thick],[18,-thick],[23,thick]],'dark');break;
 }
 // Stable differences in stock, feed mechanism, sights, and fin arrangements.
 if(![17,22].includes(idx)){poly(list,[[8,2],[12,3],[10,10+g.magazine],[5,10+g.magazine]],'dark');if(!sidearm)poly(list,[[5,-2],[-4-g.stock,-5],[-4-g.stock,5],[5,4]],'body')}
 if(g.sight%3===0){rect(list,14,-thick-7,9+g.sight%4,3,'dark');rect(list,16,-thick-4,2,3,'metal')}
 else if(g.sight%3===1){line(list,[[L-8,-thick],[L-8,-thick-5]],'dark',2);circle(list,L-8,-thick-6,2,'metal')}
 else poly(list,[[L-14,-thick],[L-13,-thick-6],[L-9,-thick]],'metal');
 for(let i=0;i<1+g.notches%3;i++)rect(list,12+i*4,-1,2,2,'paper');
 // Preserve unmistakable native weapon features above the decorative receiver.
 if(idx===11){circle(list,13,0,5,'metal');circle(list,13,0,3,'dark');rect(list,17,-2,8,4,'metal')}
 if([3,8].includes(idx)){rect(list,L-4,-1,9,2,'dark');rect(list,12,-10,12,3,'dark');line(list,[[L-9,3],[L-12,10],[L-7,3],[L-3,10]],'metal')}
 if([2,12,21].includes(idx)){rect(list,17,3,Math.max(4,L-19),3,'body');line(list,[[19,4],[L-4,4]],'accent')}
 if(idx===1){rect(list,10,4,5,10,'dark');rect(list,7,-3,12,6,'body')}
 if([6,7,13,24].includes(idx)){circle(list,L+1,0,thick+3,'metal');circle(list,L+1,0,thick,'dark')}
 if(idx===23){poly(list,[[L,-2],[L+7,0],[L,2]],'metal');line(list,[[L-5,2],[L-10,8]],'dark')}
 d.muzzle=L+4;return list;
}
function colors(item,gray){return gray?{body:'#535353',dark:'#242424',metal:'#999',accent:'#bdbdbd',edge:'#111',paper:'#f7f7f7'}:{body:item.body||'#293239',dark:'#151b20',metal:'#879499',accent:item.accent||item.color||'#81989f',edge:'#121a1f',paper:'#f5f7f5'}}
function execute(ctx,commands,palette){ctx.lineWidth=1;for(const c of commands){ctx.fillStyle=palette[c.fill]||c.fill;ctx.strokeStyle=palette.edge;if(c.type==='rect'){ctx.fillRect(c.x,c.y,c.w,c.h);if(c.stroke)ctx.strokeRect(c.x+.5,c.y+.5,c.w,c.h)}else if(c.type==='circle'){ctx.beginPath();ctx.arc(c.x,c.y,c.r,0,TAU);ctx.fill();if(c.stroke)ctx.stroke()}else{ctx.beginPath();c.points.forEach((point,i)=>i?ctx.lineTo(...point):ctx.moveTo(...point));if(c.type==='poly'){ctx.closePath();ctx.fill();if(c.stroke)ctx.stroke()}else{ctx.strokeStyle=palette[c.fill]||c.fill;ctx.lineWidth=c.width;ctx.stroke();ctx.lineWidth=1}}}}
function sprite(ctx,d,grayscale,vector=false){if(vector){execute(ctx,d.commands,colors(d,grayscale));return}const key=d.kind+':'+d.id+':'+!!grayscale;let canvas=cache.get(key);if(!canvas&&typeof document!=='undefined'){canvas=document.createElement('canvas');canvas.width=112;canvas.height=112;const off=canvas.getContext('2d');off.translate(56,56);execute(off,d.commands,colors(d,grayscale));cache.set(key,canvas)}if(canvas)ctx.drawImage(canvas,-56,-56);else execute(ctx,d.commands,colors(d,grayscale));}
function effect(ctx,d,o,t){const quiet=o.reduced||o.quality==='low',color=o.grayscale?'#666':d.accent||d.color||'#879ba3',n=quiet?2:Math.min(7,3+d.index%5),phase=quiet?0:t*(.35+d.index%4*.12);ctx.save();ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=1;ctx.globalAlpha=quiet?.3:.35;const r=24+d.geometry.detail%5;
 switch(d.aura%10){
  case 0:for(let i=0;i<n;i++){const a=phase+i/n*TAU;ctx.save();ctx.translate(Math.cos(a)*r,Math.sin(a)*r*.75);ctx.rotate(a);ctx.fillRect(-2,-3,4,6);ctx.restore()}break;
  case 1:for(let i=0;i<(quiet?2:4);i++){const a=i*TAU/4+phase;ctx.beginPath();ctx.ellipse(0,0,r,r*.6,0,a,a+.75);ctx.stroke()}break;
  case 2:for(let i=0;i<n;i++){const a=i/n*TAU;const pulse=quiet?0:Math.sin(t*1.7+i)*2;ctx.beginPath();ctx.moveTo(Math.cos(a)*(r-3),Math.sin(a)*(r-3));ctx.lineTo(Math.cos(a)*(r+3+pulse),Math.sin(a)*(r+3+pulse));ctx.stroke()}break;
  case 3:for(let i=0;i<n;i++){const a=i/n*TAU+phase*.2,radius=quiet?r-1:r+5-((t*.4+i/n)%1)*10;ctx.fillRect(Math.cos(a)*radius-1,Math.sin(a)*radius-1,2,2)}break;
  case 4:if(o.moving||o.firing||quiet){for(let i=0;i<(quiet?1:3);i++){const trail=quiet?0:Math.sin(t*5+i)*2;ctx.fillRect(-25-i*3,-3+i*3+trail,5,2)}}break;
  case 5:if(o.moving||o.dash||quiet){for(let i=0;i<(quiet?1:3);i++){ctx.beginPath();ctx.moveTo(-14,-8+i*7);ctx.quadraticCurveTo(-24,Math.sin(phase*5+i)*5,-31-i*2,-6+i*7);ctx.stroke()}}break;
  case 6:{const count=3+d.geometry.head%4;ctx.save();ctx.rotate(phase*.5);ctx.beginPath();for(let i=0;i<=count;i++){const a=i/count*TAU;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.stroke();ctx.restore();break}
  case 7:for(let i=0;i<(quiet?1:3);i++){const y=-10+i*9;ctx.beginPath();ctx.moveTo(-18,y);ctx.lineTo(-12,y-3);ctx.lineTo(-16,y+3);ctx.lineTo(-9,y);ctx.stroke()}break;
  case 8:for(let i=0;i<n;i++){const offset=quiet?0:(t*8+i*5)%17;ctx.fillRect(-19+i*6,-17-offset,2+(i%2),2)}break;
  case 9:ctx.beginPath();ctx.ellipse(0,12,r*.9,r*.38,0,0,TAU);ctx.stroke();for(let i=0;i<(quiet?2:4);i++){const a=i*TAU/4;ctx.fillRect(Math.cos(a)*r*.9-2,12+Math.sin(a)*r*.38-1,4,2)}break;
 }
 ctx.restore();
}
function resolve(map,item){if(typeof item==='string')return map.get(item);if(item?.id&&map.has(item.id))return map.get(item.id);if(item?.name)for(const d of map.values())if(d.name===item.name)return d;return null}
function operatorDefinition(id){return operators.get(typeof id==='string'?id:id?.id)||operators.values().next().value||null}
function weaponDefinition(id){return weapons.get(typeof id==='string'?id:id?.id)||null}
function configure(catalog,skins){operators.clear();weapons.clear();cache.clear();let i=0;for(const [id,item]of Object.entries(catalog||{})){const legacy=originalIds.indexOf(id),extra=legacy<0?(Number(id.split('-')[1])||0):0,spec=legacy>=0?baseSpecs[legacy]:[(extra*7+3)%20,(extra*3+Math.floor(extra/5))%16,(extra*7+Math.floor(extra/10))%21,(extra*3+2)%11,(extra*7+Math.floor(extra/5))%10,(extra+Math.floor(extra/7))%10];const geometry={frame:spec[0],head:spec[1],pack:spec[2],shoulder:spec[3],detail:(i*3+spec[4])%17,boot:(i*5+Math.floor(i/8))%13};const d={...item,id,index:i++,kind:'operator',geometry,aura:spec[5],material:materials[spec[4]%materials.length]};d.silhouette=bodyNames[geometry.frame]+' with '+['split visor','survey dome','angular mask','crown crest','offset lenses','horn array','blade crest','sensor antenna'][geometry.head%8]+', '+['field pack','paired tanks','mechanical wings','sensor mast','crescent backpack','floating armor','segmented cloak','reactor wheel','separate batteries','vent stack'][geometry.pack%10];d.animation=['articulated gait','vent cycling','reactor rotation','armor suspension','cloak sway'][d.index%5];d.effect=auraNames[d.aura];d.quietEffect='Static '+d.effect+'; two decorative elements, no travel or flashing';d.description=d.silhouette+'. '+d.material+'; '+d.animation+' and '+d.effect+'.';d.geometrySignature=JSON.stringify(geometry);if(id!=='mono'){d.body='hsl('+Math.round(d.index*137.508%360)+' 48% 34%)';d.accent='hsl('+Math.round((d.index*137.508+38)%360)+' 88% 65%)'}d.commands=operatorGeometry(d);operators.set(id,d)}
 skins=(skins||[]);for(let n=0;n<skins.length;n++){const item=skins[n],idx=clamp(Math.floor(num(item.weaponIndex)),0,25),geometry={kit:(n*5+Math.floor(n/14))%14,length:(Math.floor(n/14)*2+n%2)-2,girth:(n+Math.floor(n/7))%3,stock:(Math.floor(n/4)%4),magazine:n%4,sight:(n*3+Math.floor(n/7))%11,notches:n%7,detail:n%9,head:n%8};const d={...item,id:item.id,index:n,kind:'weapon',geometry,weaponIndex:idx,material:materials[(n*3+idx)%10],aura:n%10};d.silhouette=weaponKinds[idx]+' with '+kitNames[geometry.kit]+', '+(geometry.sight%3===0?'raised optic':geometry.sight%3===1?'ring sight':'fin sight')+' and '+['straight feed','offset feed','extended chamber','short drum'][geometry.magazine];d.animation=['sliding reload cassette','rotating chamber','charging coils','vent opening','retracting barrel'][n%5];d.effect=['split muzzle petals','segmented muzzle ring','needle muzzle rays','contained energy bloom','directional vent sparks'][n%5];d.quietEffect='Static muzzle outline and material marks; no trail animation';d.description=d.silhouette+'. '+d.material+'; '+d.animation+' and '+d.effect+'.';d.geometrySignature=JSON.stringify({idx,...geometry});d.soundProfile={pitch:.85+(n%9)*.045,texture:n%5,tail:.05+(n%4)*.025};d.body='hsl('+Math.round(n*137.508%360)+' 48% 32%)';d.color='hsl('+Math.round((n*137.508+45)%360)+' 88% 61%)';d.commands=weaponGeometry(d);weapons.set(item.id,d)}return inventory()}
function drawOperator(ctx,item,o={}){const d=resolve(operators,item)||operatorDefinition('mono');if(!d)return;const t=num(o.time),quiet=o.reduced||o.quality==='low';ctx.save();if(o.scale)ctx.scale(o.scale,o.scale);if(o.dash&&!quiet){ctx.save();ctx.globalAlpha=.14;ctx.translate(-10,0);sprite(ctx,d,o.grayscale,o.inspection);ctx.restore()}effect(ctx,d,o,t);if(!quiet&&['Epic','Legendary','Divine'].includes(d.rarity)){ctx.save();ctx.globalAlpha=.08;ctx.fillStyle=o.grayscale?'#777':d.accent;ctx.beginPath();ctx.ellipse(0,0,24,26,0,0,TAU);ctx.fill();ctx.restore()}const bob=o.moving&&!quiet?Math.sin(t*9)*.7:0;ctx.translate(0,bob);sprite(ctx,d,o.grayscale,o.inspection);
 if(!quiet){const frame=d.geometry.frame;if(frame%4===0){ctx.save();ctx.translate(-14,0);ctx.rotate(t*.6);ctx.strokeStyle=o.grayscale?'#777':d.accent;ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*1.3);ctx.stroke();ctx.restore()}if(o.moving){ctx.fillStyle='#343d42';const swing=Math.sin(t*12)*2;ctx.fillRect(-7,17+swing,4,3);ctx.fillRect(4,17-swing,4,3)}}
 if(o.hurt){ctx.strokeStyle='#8b4747';ctx.globalAlpha=.8;ctx.beginPath();ctx.moveTo(-5,-5);ctx.lineTo(2,0);ctx.lineTo(-2,6);ctx.stroke()}if(o.healing){ctx.strokeStyle='#438463';ctx.beginPath();ctx.arc(0,0,27,0,TAU);ctx.stroke()}ctx.restore();}
function defaultWeapon(index){const idx=clamp(Math.floor(num(index)),0,25);let d=plainWeapons.get(idx);if(!d){d={id:'plain-'+idx,index:idx,kind:'plain',body:'#293239',color:'#879499',weaponIndex:idx,geometry:{kit:idx%4,length:0,girth:idx%2,stock:0,magazine:0,sight:idx%3,notches:0,detail:0,head:0}};d.commands=weaponGeometry(d);plainWeapons.set(idx,d)}return d}
function drawWeapon(ctx,item,o={}){const d=resolve(weapons,item)||defaultWeapon(o.weaponIndex);const t=num(o.time),reload=clamp(num(o.reload),0,1),quiet=o.reduced||o.quality==='low';ctx.save();if(o.scale)ctx.scale(o.scale,o.scale);if(o.firing&&!quiet)ctx.translate(-1.5,0);sprite(ctx,d,o.grayscale,o.inspection);ctx.strokeStyle=o.grayscale?'#777':d.color;ctx.fillStyle=ctx.strokeStyle;
 if(reload>0){const p=Math.sin(reload*Math.PI),x=12+(d.index%3)*3;if(d.index%5===0){ctx.fillRect(x,5+p*9,5,4)}else if(d.index%5===1){ctx.save();ctx.translate(14,0);ctx.rotate(reload*TAU);ctx.strokeRect(-4,-4,8,8);ctx.restore()}else if(d.index%5===2){ctx.globalAlpha=.3+.5*reload;ctx.fillRect(12,-1,Math.max(2,(d.muzzle-18)*reload),2)}else if(d.index%5===3){for(let i=0;i<3;i++)ctx.strokeRect(10+i*5,-6-p*3,3,3)}else ctx.fillRect(18+p*5,-3,5,6)}
 if(o.firing){const x=d.muzzle;ctx.globalAlpha=quiet?.5:.75;switch(d.index%5){case 0:ctx.beginPath();ctx.moveTo(x,-2);ctx.lineTo(x+6,-5);ctx.lineTo(x+3,0);ctx.lineTo(x+6,5);ctx.lineTo(x,2);ctx.stroke();break;case 1:ctx.beginPath();ctx.ellipse(x+2,0,3,6,0,0,TAU);ctx.stroke();break;case 2:for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+6,i*4);ctx.stroke()}break;case 3:ctx.strokeRect(x,-3,5,6);break;case 4:ctx.fillRect(x,-1,7,2);ctx.fillRect(x+2,-4,2,8);break}}else if(!quiet&&d.index%4===0){ctx.globalAlpha=.25;ctx.fillRect(12+Math.sin(t*2)*2,-1,5,2)}ctx.restore();}
function drawProjectile(ctx,item,o={}){const d=resolve(weapons,item);if(!d)return;ctx.save();ctx.strokeStyle=o.grayscale?'#555':d.color;ctx.fillStyle=ctx.strokeStyle;ctx.lineWidth=1;ctx.globalAlpha=.65;switch(d.index%5){case 0:ctx.strokeRect(-3,-2,6,4);break;case 1:ctx.beginPath();ctx.arc(0,0,3,0,TAU);ctx.stroke();break;case 2:ctx.beginPath();ctx.moveTo(-4,0);ctx.lineTo(3,-2);ctx.lineTo(3,2);ctx.closePath();ctx.stroke();break;case 3:ctx.fillRect(-4,-1,7,2);break;case 4:ctx.beginPath();ctx.moveTo(-3,-2);ctx.lineTo(3,2);ctx.moveTo(-3,2);ctx.lineTo(3,-2);ctx.stroke();break}ctx.restore();}
function inventory(){return [...operators.values(),...weapons.values()].map(({commands,...d})=>({...d,commands:undefined}))}
window.NeonCosmetics={configure,operatorDefinition,weaponDefinition,drawOperator,drawWeapon,drawProjectile,inventory,stats:()=>({operators:operators.size,weapons:weapons.size,cachedSprites:cache.size})};
})();
