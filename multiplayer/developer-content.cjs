/* Public artwork, never an access credential. Shared by the Studio and co-op renderer. */
(function(root){'use strict';
const operatorNames=['Architect Zero','Null Monarch','Prism Engineer','Archive Phantom','Solar Technician','Lunar Custodian','Storm Cartographer','Clockwork Overseer','Void Diver','Signal Seraph','Prototype Warden','Origin Frame'];
const descriptions=['Porcelain plates and suspended rectangular shoulders','Broken crown, mantle panels and orbiting signal fragments','Faceted glass chassis and angular refracted trails','Narrow scan-line panels and delayed afterimages','Industrial plating, amber reactor and heat vents','Rounded exploration armor and pale crescent fittings','Survey antennae, cables and joint-to-joint electricity','Exposed gears, brass mechanisms and clockwork rhythm','Reinforced diving shell, dark visor and gravitational lens','Folding mechanical fins and a segmented halo','Experimental antenna arrays and Warden armor','Original signal chassis with a geometric assembly sequence'];
const colors=['#74c8d3','#c3a362','#a890de','#7fa6c7','#eab365','#bdc4ec','#75cbd0','#c3a268','#7c8aaa','#c5ddd3','#89bfa4','#91b4c1'];
const weaponNames=['Blueprint Pulse','Foundry Shotgun','Event Horizon Railgun','Prism Carbine','Stormcoil Launcher','Archive Sidearm','Solar Flare Pistol','Phase Daggers','Monarch Greatsword','Lunar Scythe','Clockwork Spear','Origin Knuckles'];
const indices=[0,2,3,4,7,19,16,17,-1,-1,-1,-1],melee=[null,null,null,null,null,null,null,null,'greatsword','scythe','spear','fist'];
const operators=operatorNames.map((name,i)=>({id:'dev-operator-'+i,name,kind:'operator',rarity:'Developer',exclusive:true,index:i,accent:colors[i],desc:descriptions[i]}));
const weapons=weaponNames.map((name,i)=>({id:'dev-weapon-'+i,name,kind:'weapon',rarity:'Developer',exclusive:true,index:i,weaponIndex:indices[i],meleeKind:melee[i],accent:colors[(i+2)%12],desc:['Transparent circuitry receiver','Heavy shroud and exposed heat vents','Suspended accelerator rings','Faceted split crystal receiver','Exposed electrical conductor cage','Folding data shield and holographic sight','Contained solar chamber','Segmented returning blades','Articulated royal blade','Layered crescent construction','Telescoping locking shaft','Compact directional gauntlets'][i]}));
const find=id=>[...operators,...weapons].find(i=>i.id===(typeof id==='string'?id:id?.id));
const TAU=Math.PI*2;
function path(c,points,fill,stroke='#172f3e'){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke()}}
function box(c,x,y,w,h,fill){c.fillStyle=fill;c.fillRect(x,y,w,h);c.strokeStyle='#20394a';c.lineWidth=.8;c.strokeRect(x,y,w,h);c.fillStyle='#ffffff55';c.fillRect(x+1,y+1,Math.max(0,w-2),1)}
function ring(c,x,y,r,color,start=0,end=TAU){c.strokeStyle=color;c.lineWidth=1.2;c.beginPath();c.arc(x,y,r,start,end);c.stroke()}
function drawOperator(c,id,o={}){const d=find(id);if(!d||d.kind!=='operator')return false;const i=d.index,t=Number(o.time)||0,quiet=o.reduced||o.quality==='low',amount=o.intensity??1,a=o.grayscale?'#81919d':d.accent,ink='#1f3445',metal='#8c9ea8',light='#e0e8e9';c.save();if(o.scale)c.scale(o.scale,o.scale);c.fillStyle='#16314220';c.beginPath();c.ellipse(2,23,21,5,0,0,TAU);c.fill();if(!quiet&&o.moving)c.translate(0,Math.sin(t*8+i)*.7);
 if(i===1){path(c,[[-11,-8],[-21,18],[-5,23],[14,20],[10,-8]],'#424358');path(c,[[-8,-22],[-10,-31],[-3,-26],[2,-32],[8,-26],[12,-30],[10,-21]],a)}
 if(i===3&&!quiet&&amount>0){c.save();c.globalAlpha=.13*amount;c.fillStyle=a;c.fillRect(-20,-15,12,30);c.restore()}
 if(i===5){ring(c,-10,-4,19,a,1.4,4.7);ring(c,-12,-4,15,light,1.4,4.7)}
 if(i===6){for(const side of[-1,1]){c.strokeStyle=metal;c.beginPath();c.moveTo(side*8,-15);c.lineTo(side*18,-29);c.stroke();ring(c,side*18,-29,2,a)}}
 if(i===7){c.save();if(!quiet)c.rotate(t*.22);for(let n=0;n<8;n++)box(c,Math.cos(n*TAU/8)*18-2,Math.sin(n*TAU/8)*18-2,4,4,a);ring(c,0,0,16,metal);c.restore()}
 if(i===8){ring(c,0,0,25,metal);box(c,-19,-9,7,23,ink);box(c,12,-9,7,23,ink)}
 if(i===9){for(const side of[-1,1]){const spread=quiet?1:1+.07*Math.sin(t*2);path(c,[[side*8,-8],[side*29*spread,-21],[side*25,8],[side*12,17]],light);for(let n=0;n<3;n++)path(c,[[side*13,-5+n*5],[side*27,-14+n*9],[side*18,9+n*3]],a)}for(let n=0;n<6;n++)ring(c,0,-19,13,a,n*TAU/6,n*TAU/6+.65)}
 if(i===10){box(c,-24,-10,10,21,metal);box(c,14,-10,10,21,metal);for(const side of[-1,1]){box(c,side*19-1,-27,2,19,ink);ring(c,side*19,-29,4,a)}}
 if(i===0){for(const side of[-1,1])box(c,side*20-5,-10+(quiet?0:Math.sin(t*2)*2),10,17,light)}
 if(i===2){path(c,[[-18,-15],[-6,-20],[-11,10],[-22,5]],a);path(c,[[12,-20],[23,-7],[17,13],[9,4]],light)}
 if(i===4){box(c,-19,-7,8,20,metal);box(c,11,-7,8,20,metal);for(let n=0;n<3;n++)box(c,-18,-4+n*5,6,2,ink)}
 box(c,-7,11,5,10,ink);box(c,3,11,5,10,ink);const body=i===0||i===11?light:i===8||i===5?ink:i===2?'#a8acbe':metal;
 if(i===2)path(c,[[-10,-13],[3,-17],[12,-5],[7,14],[-8,11],[-13,0]],body);else if(i===3)path(c,[[-6,-15],[7,-15],[11,17],[-12,17]],ink);else box(c,-10,-13,20,27,body);
 box(c,-7,-23,14,11,i===8?ink:light);box(c,-5,-20,10,4,a);box(c,-5,-3,10,9,i===4?'#f2bf61':ink);box(c,-3,-1,6,4,a);
 if(i===3){c.strokeStyle=a;for(let n=0;n<5;n++){c.beginPath();c.moveTo(-9,-9+n*5);c.lineTo(8,-9+n*5);c.stroke()}}
 if(i===11){for(const side of[-1,1])box(c,side*15-3,-10,6,19,light)}
 if(!quiet&&amount>0){c.save();c.globalAlpha=.55*amount;if(i===0||i===11){for(let n=0;n<3;n++)box(c,-29-n*3,-15+((t*8+n*9)%32),3,3,a)}else if(i===1){for(let n=0;n<3;n++){const v=t*.5+n*TAU/3;box(c,Math.cos(v)*26,Math.sin(v)*22,3,3,a)}}else if(i===6){c.strokeStyle=a;c.beginPath();c.moveTo(-18,-25);c.lineTo(-13,-17);c.lineTo(-17,-12);c.lineTo(-10,-5);c.stroke()}else if(i===4){ring(c,0,1,8+Math.sin(t*2),a)}else if(i===8){ring(c,0,0,27,a,.5+t*.2,1.4+t*.2)}else if(i===2){path(c,[[20,16],[28,18],[23,23]],a,null)}c.restore()}
 if(o.hurt&&o.flash!==false){c.strokeStyle='#bb6972';c.strokeRect(-12,-15,24,31)}if(o.dash&&!quiet){c.strokeStyle=a;c.beginPath();c.moveTo(-35,-5);c.lineTo(-23,-5);c.moveTo(-30,6);c.lineTo(-20,6);c.stroke()}c.restore();return true}
function drawWeapon(c,id,o={}){const d=find(id);if(!d||d.kind!=='weapon')return false;const i=d.index,t=Number(o.time)||0,a=o.grayscale?'#80919a':d.accent,quiet=o.reduced||o.quality==='low';c.save();if(o.scale)c.scale(o.scale,o.scale);if(o.firing&&!quiet){c.translate(-2,0);if(i>=8)c.rotate(-.4+Math.sin(t*9)*.6)}
 if(i>=8){const length=i===10?59:i===8?53:i===9?61:27;box(c,8,-2,i===11?10:30,4,'#213545');if(i===11){box(c,13,-8,14,16,'#c3d0d3');for(let n=0;n<3;n++)box(c,24,-6+n*5,4,3,a)}else if(i===9){path(c,[[38,0],[43,-18],[61,-20],[52,-12],[44,-5]],'#aabdc8');ring(c,43,-9,4,a)}else {path(c,[[i===10?35:20,-5],[length,0],[i===10?35:20,5],[i===10?40:24,0]],'#c4d1d8');box(c,18,-8,3,16,a);if(i===10)for(let n=0;n<3;n++)box(c,14+n*7,-3,3,6,a)}
 }else if(i===7){for(let n=0;n<2;n++){box(c,10,-8+n*15,9,4,'#263c50');path(c,[[20,-10+n*15],[39,-6+n*15],[20,-2+n*15]],'#aab8d1');box(c,23,-8+n*15,8,2,a)}}
 else{const long=i===2?46:i===4?38:32;box(c,8,-6,long-8,12,i===0?'#b1d1dc':i===3?'#a7aacb':'#556b79');box(c,3,-5,7,10,'#283c4d');box(c,15,5,6,10,'#2e4456');box(c,long,-3,9,6,'#a6b6be');if(i===1){box(c,17,-9,22,4,'#84939a');for(let n=0;n<4;n++)box(c,19+n*5,-7,2,3,a)}if(i===2){for(let n=0;n<3;n++)ring(c,25+n*9,0,8,a);box(c,11,-11,13,4,'#273c4e')}if(i===0){c.strokeStyle=a;for(let n=0;n<3;n++){c.beginPath();c.moveTo(12+n*6,-3);c.lineTo(15+n*6,2);c.lineTo(23+n*3,2);c.stroke()}}if(i===3)path(c,[[15,-7],[29,-11],[35,0],[23,5]],a);if(i===4){for(let n=0;n<4;n++)ring(c,19+n*5,0,8,a)}if(i===5){box(c,19,-13,11,4,a);box(c,9,-8,4,18,'#a8bcc9')}if(i===6){ring(c,23,0,6,'#f7ca7a');box(c,30,-5,6,10,a)}
 if(o.reload>0){const offset=quiet?4:Math.sin(o.reload*Math.PI)*9;box(c,15,10+offset,7,7,'#9cabb4')}
 if(o.firing&&o.flash!==false){path(c,[[long+9,-3],[long+20,0],[long+9,3]],a,null)}
 }c.restore();return true}
const api={operators,weapons,find,drawOperator,drawWeapon};if(typeof module==='object'&&module.exports)module.exports=api;else root.NeonDeveloperContent=api;
})(typeof window==='object'?window:globalThis);
