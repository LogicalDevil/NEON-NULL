'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('C:/Users/zrdud/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.setContent('<style>body{margin:0;background:#e9eff1}canvas{width:1280px;height:720px}#word-blaster{font-family:Arial}#wb-menu,#wb-game{display:none}</style><canvas id="canvas" width="1280" height="720"></canvas><section id="word-blaster"><div id="wb-menu"><div class="menu-actions"></div></div><div id="wb-game"><div id="wb-stage"></div></div></section>');
  await page.addScriptTag({content:fs.readFileSync('work/sector-run.js','utf8')});
  const result=await page.evaluate(()=>{
   const store=new Map(),events=[],state={player:{x:900,y:680},w:1800,h:1050,hull:10,enemies:[],playing:true,paused:false};
   NeonSector.init({storage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},pause:value=>state.paused=value,startEncounter:()=>true,captureRun:()=>({schema:1,hull:10}),notify:()=>{},worldEvent:event=>events.push(event),spawn:()=>true});
   NeonSector.begin();NeonSector.choose('gate');NeonSector.tick(.1,state);
   const canvas=document.getElementById('canvas'),ctx=canvas.getContext('2d'),options={cameraX:450,cameraY:420,viewW:900,viewH:506.25,quality:'standard',reduced:false};
   function draw(){ctx.resetTransform();ctx.fillStyle='#f0f3f4';ctx.fillRect(0,0,1280,720);ctx.scale(1280/900,720/506.25);ctx.translate(-options.cameraX,-options.cameraY);NeonSector.draw(ctx,options)}
   function hash(){const pixels=ctx.getImageData(0,0,1280,720).data;let value=2166136261;for(let i=0;i<pixels.length;i+=4)value=Math.imul(value^pixels[i],16777619);return value>>>0}
   draw();const dark=hash(),initial=NeonSector.presentation();for(let i=0;i<30;i++)draw();const cached=NeonSector.presentation();
   const sw=NeonSector.stats().objects.find(item=>item.kind==='switch');state.player.x=sw.x+sw.w/2;state.player.y=sw.y+sw.h/2;NeonSector.tick(.1,state);const nearby=NeonSector.presentation();
   for(let i=0;i<14;i++)NeonSector.interact(state.player,.1);for(let i=0;i<30;i++)NeonSector.tick(.1,state);draw();const light=hash(),powered=NeonSector.presentation();
   for(let i=0;i<15;i++)NeonSector.interact(state.player,.1);const once=events.filter(e=>e.kind==='power-restored').length;
   const clock=NeonSector.presentation().clock;state.paused=true;for(let i=0;i<20;i++)NeonSector.tick(.1,state);const pausedClock=NeonSector.presentation().clock;
   options.quality='low';options.reduced=true;draw();const low=hash();state.paused=false;state.player.x=300;state.player.y=300;NeonSector.tick(.1,state);const far=NeonSector.presentation();
   NeonSector.stop();const stopped=NeonSector.presentation();
   return{dark,light,low,initial,cached,nearby,powered,once,clock,pausedClock,far,stopped};
  });
  assert.notEqual(result.dark,result.light,'Power changes the actual canvas');assert.equal(result.initial.sceneBuilds,result.cached.sceneBuilds,'Stationary scenery is reused');assert.equal(result.cached.cacheEntries,1);assert.equal(result.nearby.interactVisible,true);assert.equal(result.powered.powered,true);assert.equal(result.once,1);assert.equal(result.clock,result.pausedClock);assert.equal(result.far.interactVisible,false);assert.equal(result.stopped.cacheEntries,0);assert.deepEqual(errors,[]);
  await page.screenshot({path:'work/living-yard-verified.png'});
  console.log('PASS actual Canvas yard rendering, cache reuse, one-shot visible power transition, contextual interaction, paused atmosphere clock, low/reduced rendering and resource cleanup');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
