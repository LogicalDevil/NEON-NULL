'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('C:/Users/zrdud/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.setContent('<style>body{margin:0}canvas{width:1280px;height:720px}</style><canvas width="1280" height="720"></canvas>');
  await page.addScriptTag({content:fs.readFileSync('work/expansion-runtime.js','utf8')});
  const result=await page.evaluate(()=>{
   const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),original=document.createElement.bind(document);let created=0;document.createElement=(...args)=>{if(args[0]==='canvas')created++;return original(...args)};
   const base={w:1800,h:1050,cameraX:0,cameraY:0,viewW:900,viewH:506.25,palette:['#fff','#f4f4f4','#e9e9e9'],quality:'standard',effects:1,time:1,reduced:false};
   function draw(o){ctx.resetTransform();ctx.scale(1280/900,720/506.25);NeonRuntime.background(ctx,o)}
   function hash(){const pixels=ctx.getImageData(0,0,1280,720).data;let value=2166136261;for(let i=0;i<pixels.length;i+=4)value=Math.imul(value^pixels[i],16777619);return value>>>0}
   const hashes=[];for(const operation of['relay','archive','breach']){draw({...base,operation});hashes.push(hash())}const initial=created;for(let i=0;i<30;i++)draw({...base,operation:'relay',time:i*.1});const repeated=created;
   draw({...base,operation:'relay',reduced:true,time:2});const reducedA=hash();draw({...base,operation:'relay',reduced:true,time:8});const reducedB=hash();
   draw({...base,operation:'breach',effects:0,time:2});const noneA=hash();draw({...base,operation:'breach',effects:0,time:8});const noneB=hash();
   draw({...base,operation:'archive',quality:'low',time:2});const lowA=hash();draw({...base,operation:'archive',quality:'low',time:8});const lowB=hash();
   draw({...base,operation:'archive',cameraX:900,cameraY:543.75});const edge=hash();
   return{hashes,initial,repeated,reducedA,reducedB,noneA,noneB,lowA,lowB,edge};
  });
  assert.equal(new Set(result.hashes).size,3,'Each operation has a distinct actual background');assert.equal(result.initial,3);assert.equal(result.repeated,result.initial,'Frames reuse scenery');assert.equal(result.reducedA,result.reducedB);assert.equal(result.noneA,result.noneB);assert.equal(result.lowA,result.lowB);assert(result.edge);assert.deepEqual(errors,[]);
  await page.screenshot({path:'work/room-environments-verified.png'});
  console.log('PASS actual Canvas relay/archive/reactor distinction, cache reuse, static reduced-motion/effects-zero/low settings and camera-edge sampling');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
