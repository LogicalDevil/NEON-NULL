/* Drawing-only combat feedback. Bounded effects never alter damage or simulation time. */
(()=>{'use strict';const TAU=Math.PI*2,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const materials={asteroid:'stone',orb:'energy',brute:'armor','shield-carrier':'shield','signal-core':'armor','blink-stalker':'energy'};
function material(enemy){const type=typeof enemy==='string'?enemy:enemy?.type?.id;return materials[type]||'metal'}
function intensity(options){return clamp(Number.isFinite(options.intensity)?options.intensity:1,0,1)}
function crater(ctx,c,options={}){
 const amount=intensity(options);if(!amount)return;
 const r=clamp(c.radius||c.r||30,3,120),age=Math.max(0,c.age??6-(c.life??6)),fade=clamp(1-age/(c.duration||6.2),0,1)*amount,low=options.quality==='low',quiet=options.reduced;
 ctx.save();ctx.translate(c.x,c.y);ctx.globalAlpha=.24*fade;ctx.fillStyle='#26343b';ctx.beginPath();ctx.ellipse(1,2,r,r*.48,0,0,TAU);ctx.fill();
 // A lit upper rim, dark interior and uneven fractures imply depth without a blur.
 ctx.globalAlpha=.32*fade;ctx.fillStyle='#677279';ctx.beginPath();ctx.ellipse(0,0,r*.85,r*.37,0,0,TAU);ctx.fill();ctx.fillStyle='#25333d';ctx.beginPath();ctx.ellipse(0,2,r*.64,r*.26,0,0,TAU);ctx.fill();ctx.strokeStyle='#e2e5df';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(-1,-1,r*.93,r*.44,0,Math.PI,TAU);ctx.stroke();ctx.strokeStyle='#44525c';ctx.lineWidth=1;
 for(let i=0;i<(low?4:9);i++){const a=i*2.399+(c.x%17)*.1,inner=r*.69,outer=r*(.92+(i%3)*.12);ctx.beginPath();ctx.moveTo(Math.cos(a)*inner,Math.sin(a)*inner*.46);ctx.lineTo(Math.cos(a+.06)*outer,Math.sin(a+.06)*outer*.48);ctx.lineTo(Math.cos(a)*outer*1.09,Math.sin(a)*outer*.5);ctx.stroke();if(!low){ctx.fillStyle=i%2?'#adb4b5':'#435059';ctx.fillRect(Math.cos(a)*outer,Math.sin(a)*outer*.48,3+i%3,2)}}
 if(!quiet&&!low&&age<1.2){const t=age/1.2;for(let i=0;i<5;i++){const a=i*TAU/5;ctx.globalAlpha=(1-t)*.12*fade;ctx.fillStyle='#7d8a90';ctx.beginPath();ctx.ellipse(Math.cos(a)*(r*.6+t*r*.8),Math.sin(a)*r*.22+5-t*9,6+t*12,3+t*5,0,0,TAU);ctx.fill()}}ctx.restore()
}
function create(){let hits=[],impacts=[],clock=0,lastFrame=-1;
 const push=e=>{if(impacts.length>=48)impacts.shift();impacts.push(e)};
 return{
 clear(){hits=[];impacts=[];clock=0;lastFrame=-1},
 hit(x,y,kind,angle=0,radius=18){if(hits.length>=24)hits.shift();hits.push({x,y,kind,angle,r:clamp(radius,12,38),t:0,frame:clock-lastFrame>.12});if(clock-lastFrame>.12)lastFrame=clock},
 impact(x,y,surface='metal',angle=0,radius=14,heavy=false){if(!Number.isFinite(x+y+angle+radius))return;push({x,y,material:surface,angle,r:clamp(radius,4,50),t:0,duration:heavy?.48:.3,heavy,death:false})},
 defeat(x,y,type,radius=18){if(!Number.isFinite(x+y+radius))return;push({x,y,material:material(type),angle:0,r:clamp(radius,6,60),t:0,duration:.7,heavy:true,death:true})},
 draw(ctx,dt,options={}){
  dt=clamp(Number.isFinite(dt)?dt:0,0,2);clock+=dt;const quiet=options.reduced,low=options.quality==='low',amount=intensity(options);
  for(let i=hits.length-1;i>=0;i--){const h=hits[i],previous=h.t;h.t+=dt;if(h.t>.32){hits.splice(i,1);continue}if(!amount)continue;
   const p=h.t/.32,travel=quiet?0:p;ctx.save();ctx.translate(h.x,h.y);ctx.rotate(h.angle);
   if(h.frame&&previous<.045&&!quiet&&options.flash!==false){ctx.globalAlpha=amount;ctx.fillStyle='#18252de0';ctx.beginPath();ctx.ellipse(0,0,h.r,h.r*.8,0,0,TAU);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-h.r,0);ctx.lineTo(h.r,0);ctx.moveTo(0,-h.r);ctx.lineTo(0,h.r);ctx.stroke()}
   ctx.globalAlpha=(1-p)*amount;ctx.strokeStyle=h.kind==='baton'?'#559783':'#344c5d';ctx.lineWidth=low?1:2;const n=quiet?3:low?4:8;
   for(let j=0;j<n;j++){const a=j*2.399,length=(j%3+1)*3;ctx.beginPath();ctx.moveTo(Math.cos(a)*(4+travel*12),Math.sin(a)*(4+travel*12));ctx.lineTo(Math.cos(a)*(8+travel*22+length),Math.sin(a)*(8+travel*22+length));ctx.stroke()}
   if(!quiet&&!low){ctx.strokeStyle='#8ea4af';ctx.lineWidth=1;for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(-22-p*18,(-1+j)*8);ctx.quadraticCurveTo(-8,(-1+j)*13,19+p*20,(-1+j)*4);ctx.stroke()}ctx.globalAlpha=(1-p)*.14*amount;ctx.fillStyle='#85949c';ctx.beginPath();ctx.ellipse(-8-p*12,10+p*6,8+p*10,3+p*4,0,0,TAU);ctx.fill()}ctx.restore()
  }
  for(let i=impacts.length-1;i>=0;i--){const e=impacts[i];e.t+=dt;if(e.t>=e.duration){impacts.splice(i,1);continue}if(!amount)continue;
   const p=e.t/e.duration,travel=quiet?.15:p,s=e.r,surface=e.material,n=quiet?3:low?4:e.death?10:7;
   ctx.save();ctx.translate(e.x,e.y);ctx.rotate(e.angle);ctx.globalAlpha=(1-p)*amount;ctx.lineWidth=surface==='armor'?1.7:1.2;
   ctx.strokeStyle=surface==='shield'?'#658d9a':surface==='energy'?'#728caa':surface==='stone'?'#68716f':'#a89472';ctx.fillStyle=surface==='stone'?'#60716f':'#5c7480';
   // Shield/energy contact forms a local ripple rather than an opaque flash.
   if(surface==='shield'||surface==='energy'){ctx.beginPath();ctx.arc(0,0,3+travel*s*(e.death?1.65:1),-.9,quiet?.9:TAU-.5);ctx.stroke();if(!low&&!quiet){ctx.beginPath();ctx.arc(0,0,6+travel*s*.6,.2,2.1);ctx.stroke()}}
   for(let j=0;j<n;j++){
    const a=e.death?j*2.399:(j/(n-1)-.5)*2.2,spread=3+travel*s*(e.death?1.8:1.2),x=Math.cos(a)*spread,y=Math.sin(a)*spread;
    if(surface==='stone'||e.death&&surface!=='energy'){ctx.save();ctx.translate(x,y+(quiet?0:p*p*8));ctx.rotate(j*.7+travel);const size=(e.death?3:2)+(j%3);ctx.fillRect(-size/2,-size/2,size,size*.6);ctx.restore()}
    else {ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*(3+j%3),y+Math.sin(a)*(3+j%3));if(surface==='energy'&&!low){ctx.lineTo(x+Math.cos(a+.6)*8,y+Math.sin(a+.6)*8)}ctx.stroke()}
   }
   if(e.heavy&&!quiet&&!low){ctx.globalAlpha=(1-p)*.1*amount;ctx.fillStyle='#6f8087';for(let j=0;j<3;j++){ctx.beginPath();ctx.ellipse((j-1)*(s*.2+travel*s*.6),s*.4-travel*9,4+travel*s*.6,2+travel*s*.18,0,0,TAU);ctx.fill()}}
   ctx.restore()
  }
 },stats(){return{hits:hits.length,impacts:impacts.length}}
 }
}
window.NeonCombatFX={create,crater,material};})();
