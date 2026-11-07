'use strict';
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/zrdud/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
  const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1600,height:1200}}),errors=[];
    page.on('pageerror',error=>errors.push(error.stack));
    await page.setContent('<canvas id="sheet" width="1600" height="2140"></canvas><canvas id="spectrum" width="1600" height="620"></canvas><canvas id="gray" width="1600" height="2140"></canvas>');
    await page.addScriptTag({content:fs.readFileSync('multiplayer/arsenal-catalog.cjs','utf8')});
    await page.addScriptTag({content:fs.readFileSync('work/arsenal-art.js','utf8')});
    const result=await page.evaluate(()=>{
      const art=NeonArsenalArt,items=NeonArsenal.groups.flat(),signatures=new Set(),graySignatures=new Set(),projectiles=new Set();
      const sheet=document.querySelector('#sheet'),ctx=sheet.getContext('2d'),spectrum=document.querySelector('#spectrum'),sp=spectrum.getContext('2d');
      ctx.fillStyle='#f5f6f8';ctx.fillRect(0,0,sheet.width,sheet.height);
      sp.fillStyle='#e5eaf6';sp.fillRect(0,0,spectrum.width,spectrum.height);
      const groups=NeonArsenal.factions.slice(1);
      let count=0;
      for(const [factionIndex,faction]of groups.entries()){
        const rowBase=factionIndex*530;
        ctx.fillStyle=art.themes[faction.id].shade;ctx.fillRect(0,rowBase,1600,35);
        ctx.fillStyle='#fff';ctx.font='bold 20px sans-serif';ctx.fillText(faction.name.toUpperCase(),16,rowBase+25);
        const own=items.filter(item=>item.faction===faction.id).sort((a,b)=>a.slot-b.slot||a.index-b.index);
        for(const [n,item]of own.entries()){
          const x=n%10*160,y=rowBase+40+Math.floor(n/10)*120;
          const icon=document.createElement('canvas');icon.width=144;icon.height=72;const pen=icon.getContext('2d');
          pen.translate(20,35);pen.scale(1.5,1.5);
          if(!art.drawHeld(pen,item,{quality:'high',reduced:true,heat:.62,charge:.7,reload:.26}))throw Error(item.id);
          signatures.add(icon.toDataURL());
          const pixels=pen.getImageData(0,0,144,72);
          for(let k=0;k<pixels.data.length;k+=4){const lum=Math.round(pixels.data[k]*.299+pixels.data[k+1]*.587+pixels.data[k+2]*.114);pixels.data[k]=pixels.data[k+1]=pixels.data[k+2]=lum}
          const gray=document.createElement('canvas');gray.width=144;gray.height=72;gray.getContext('2d').putImageData(pixels,0,0);
          graySignatures.add(gray.toDataURL());
          ctx.fillStyle='#fff';ctx.fillRect(x+3,y+3,154,111);ctx.strokeStyle='#ced6df';ctx.strokeRect(x+3,y+3,154,111);
          ctx.drawImage(icon,x+7,y+4);
          ctx.fillStyle='#233747';ctx.font='11px sans-serif';ctx.fillText(item.name.slice(0,24),x+9,y+87);
          ctx.fillStyle='#5a6775';ctx.font='9px monospace';ctx.fillText(art.design(item).form+' / '+art.design(item).projectile,x+9,y+103);
          if(item.slot<2){
            const shot=document.createElement('canvas');shot.width=70;shot.height=40;const s=shot.getContext('2d');s.translate(36,20);
            if(!art.drawProjectile(s,item,{time:1,quality:'high',reduced:false}))throw Error('projectile '+item.id);
            projectiles.add(shot.toDataURL());
            ctx.drawImage(shot,x+88,y+32);
          }
          if(factionIndex===0){
            const sx=n%10*160,sy=Math.floor(n/10)*145;
            sp.drawImage(icon,sx+8,sy+10);sp.drawImage(gray,sx+8,sy+78,144,52);
            sp.fillStyle='#132348';sp.font='10px sans-serif';sp.fillText(item.name.slice(0,24),sx+8,sy+139);
          }
          const definition=art.itemDefinition(item);
          if(!definition.colors.length||!definition.materials||!definition.silhouette)throw Error('missing definition '+item.id);
          count++;
        }
      }
      const gray=document.querySelector('#gray'),gc=gray.getContext('2d');gc.filter='grayscale(1)';gc.drawImage(sheet,0,0);
      return {count,colored:signatures.size,grayscale:graySignatures.size,projectileProfiles:projectiles.size};
    });
    assert.equal(result.count,160);assert.equal(result.colored,160);assert.equal(result.grayscale,160);assert(result.projectileProfiles>=65);
    for(const [id,name]of [['sheet','contact'],['spectrum','spectrum'],['gray','grayscale']]){
      const url=await page.locator('#'+id).evaluate(canvas=>canvas.toDataURL());
      fs.writeFileSync('work/arsenal-redesign-'+name+'.png',Buffer.from(url.split(',')[1],'base64'));
    }
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify(result));
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
