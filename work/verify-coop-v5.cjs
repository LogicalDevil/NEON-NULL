/* Local, unranked browser integration and performance check. No Supabase account data is used. */
'use strict';
const {chromium}=require('C:/Users/zrdud/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {createGameServer}=require('../multiplayer/server.cjs');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const seconds=Number(process.env.COOP_PROFILE_SECONDS)||60;
const htmlPath=process.env.COOP_BASELINE_HTML||(fs.existsSync('outputs/neon-null.html')?'outputs/neon-null.html':'outputs/index.html');
let html=fs.readFileSync(htmlPath,'utf8');
const baseline=!html.includes('diagnostics()');
if(baseline){
 assert(process.env.COOP_ALLOW_BASELINE==='true','Build the upgraded client first (or COOP_ALLOW_BASELINE=true for a recorded old-client baseline)');
 const injection=`const qaFrames=[],qaRenders=[];let qaLast=0;const qaDraw=draw;draw=function(now){if(qaLast)qaFrames.push(now-qaLast);qaLast=now;const start=performance.now();qaDraw(now);qaRenders.push(performance.now()-start);if(qaFrames.length>7200)qaFrames.shift();if(qaRenders.length>7200)qaRenders.shift()};window.__coopBaselineMetrics=()=>{const percentile=(v,q)=>{const s=v.slice().sort((a,b)=>a-b);return s[Math.min(s.length-1,Math.floor(s.length*q))]||0};return{baseline:true,frameCount:qaFrames.length,frameP50:percentile(qaFrames,.5),frameP95:percentile(qaFrames,.95),renderP50:percentile(qaRenders,.5),renderP95:percentile(qaRenders,.95),status:room?.state||'offline'}};`;
 html=html.replace('window.NeonCoop={init(options)',injection+'window.NeonCoop={init(options)');
 html=html.replace("const VERSION='4.0';let ticket=","const VERSION='5.0';let ticket=");
}
const readDiagnostics=page=>page.evaluate(()=>NeonCoop.diagnostics?.()||window.__coopBaselineMetrics());
const waitUntil=async(test,message,timeout=10000)=>{const start=Date.now();while(!test()){if(Date.now()-start>timeout)throw Error(message);await sleep(50)}};

(async()=>{
 const service=createGameServer({dev:true,compactSnapshots:!baseline});
 await new Promise(resolve=>service.server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+service.server.address().port;
 const browsers=[],contexts=[],pages=[],errors=[],traffic=[],expectedOffline=new Set(),phases=[],testStart=Date.now();let maintain,resultPath;
 const mark=(phase,details={})=>{const entry={phase,atSeconds:Number(((Date.now()-testStart)/1000).toFixed(2)),...details};phases.push(entry);console.log('PHASE',JSON.stringify(entry))};
 try{
  for(let i=0;i<4;i++){
   const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows']});browsers.push(browser);
   const context=await browser.newContext({viewport:{width:1440,height:1000}});contexts.push(context);
   const page=await context.newPage();pages.push(page);traffic.push({bytes:0,inputRequests:0,snapChunks:0});
   await page.route(base+'/',route=>route.fulfill({contentType:'text/html',body:html}));
   page.on('pageerror',error=>errors.push('pilot'+i+': '+error.stack));
   page.on('requestfailed',request=>{if(!expectedOffline.has(i)&&request.url().includes('/api/')&&request.failure()?.errorText!=='net::ERR_ABORTED')console.error('Request failed:',request.url(),request.failure()?.errorText)});
   const cdp=await context.newCDPSession(page),streams=new Set();await cdp.send('Network.enable');
   cdp.on('Network.requestWillBeSent',event=>{if(event.request.url===base+'/api/events')streams.add(event.requestId);if(event.request.url===base+'/api/input')traffic[i].inputRequests++});
   cdp.on('Network.dataReceived',event=>{if(streams.has(event.requestId)){traffic[i].bytes+=event.dataLength;traffic[i].snapChunks++}});
   await page.goto(base);await page.locator('#nn-guest').waitFor({state:'visible'});await page.locator('#nn-guest').click();await page.locator('#wb-multiplayer').click();
   await page.locator('#nc-panel details summary').click();await page.locator('#nc-url').fill(base);await page.locator('#nc-guest-name').fill('QA'+i);
  }
  const leader=pages[0];await leader.locator('#nc-create').click();
  await leader.waitForFunction(()=>/^ROOM [A-F0-9]{6}$/i.test(document.getElementById('nc-code').textContent));
  const code=(await leader.locator('#nc-code').textContent()).split(' ')[1];
  for(const page of pages.slice(1)){await page.locator('#nc-room').fill(code);await page.locator('#nc-join').click();await page.locator('#nc-ready').waitFor({state:'visible'})}
  assert.equal(service.rooms.get(code).members.length,4,'All four clients must share one room');
  for(let i=0;i<4;i++){await pages[i].locator('#nc-gear-0').selectOption(String([0,2,9,15][i]));await pages[i].locator('#nc-ready').click()}
  await leader.locator('#nc-start').click();await leader.locator('#nc-canvas').waitFor({state:'visible'});
  const room=service.rooms.get(code);assert(room.match,'Match did not start');const match=room.match;
  mark('match-started',{connected:match.players.map(p=>p.connected)});
  for(const p of match.players)p.invuln=999;
  for(const page of pages)await page.waitForFunction(()=>typeof window.NeonCoop.diagnostics==='function'||typeof window.__coopBaselineMetrics==='function');
  await leader.bringToFront();
  const local=match.players.find(p=>p.name==='QA0'),xBefore=local.x;
  await leader.keyboard.down('d');await sleep(300);await leader.keyboard.up('d');await sleep(200);
  assert(local.x>xBefore+15,'Keyboard movement must reach authoritative simulation');
  const xFocus=local.x;await leader.evaluate(()=>{const i=document.createElement('input');i.id='qa-focus';document.getElementById('nc-panel').appendChild(i);i.focus()});
  await leader.keyboard.press('d');await sleep(150);assert(Math.abs(local.x-xFocus)<4,'Typing into a field must not move player');await leader.evaluate(()=>document.getElementById('qa-focus').remove());
  for(const page of pages){const r=await page.locator('#nc-canvas').boundingBox();await page.mouse.move(r.x+r.width*.5,r.y+r.height*.25);await page.mouse.down()}
  if(!match.enemies.some(e=>e.boss))match.spawn(true);
  maintain=setInterval(()=>{
   for(const p of match.players){p.invuln=999;for(const g of p.gear.slice(0,2))g.reserve=g.reserveMax}
   while(match.enemies.filter(e=>!e.dead).length<28)match.spawn();
  },800);
  const t0=Date.now(),startTraffic=traffic.map(t=>({...t})),memory=[],load=[];
  while(Date.now()-t0<seconds*1000){await sleep(1000);memory.push(await leader.evaluate(()=>performance.memory?.usedJSHeapSize||0));load.push({enemies:match.enemies.length,shots:match.shots.length,hostile:match.hostile.length,playersFiring:match.players.filter(p=>p.input.fire).length});if(match.done)throw Error('Controlled performance run ended early')}
  clearInterval(maintain);maintain=null;for(const page of pages)await page.mouse.up();
  const elapsed=(Date.now()-t0)/1000,metrics=[];
  for(let i=0;i<4;i++){const diagnostics=await readDiagnostics(pages[i]);metrics.push({pilot:i,diagnostics,networkKBps:(traffic[i].bytes-startTraffic[i].bytes)/1024/elapsed,inputHz:(traffic[i].inputRequests-startTraffic[i].inputRequests)/elapsed,streamChunksHz:(traffic[i].snapChunks-startTraffic[i].snapChunks)/elapsed})}
  resultPath=baseline?'work/coop-v5-baseline-results.json':'work/coop-v5-browser-results.json';
  const result={mode:'local unranked',htmlPath,baseline,clients:4,durationSeconds:elapsed,metrics,serverMetrics:structuredClone(service.metrics||null),regressions:'pending',load:Object.fromEntries(['enemies','shots','hostile','playersFiring'].map(key=>[key,{min:Math.min(...load.map(s=>s[key])),max:Math.max(...load.map(s=>s[key])),mean:load.reduce((sum,s)=>sum+s[key],0)/load.length}])),heapSamples:{first:memory[0],last:memory.at(-1),min:Math.min(...memory),max:Math.max(...memory)},observedGameplay:{wave:match.wave,kills:match.kills,bosses:match.bosses},notes:['Four independent Chrome headless processes on one machine; this does not measure Internet RTT or Render CPU performance.','Performance fixture replenishes toward 28 enemies every 800ms, spare reserve ammo and invulnerability; actual sampled load is reported. Control traffic and combat still use real browser/server routes.','No live Supabase credentials, ranked rewards or persistent user progress are used.','Baseline changes only handshake version to connect the old renderer to the current server; it does not compare old network/server code.']};
  fs.writeFileSync(resultPath,JSON.stringify(result,null,2));
  mark('profile-saved',{connected:match.players.map(p=>p.connected),sessions:service.sessions.size});
  mark('screenshot-start');
  await leader.screenshot({path:baseline?'work/verified-v411-coop-baseline.png':'work/verified-v5-coop.png'});
  mark('screenshot-finished');
  if(!baseline){
   mark('hotbar-regression-start');
   assert(await leader.locator('#nc-health').isVisible(),'Persistent player health HUD');assert(await leader.locator('#nc-dash').isVisible(),'Persistent dash cooldown HUD');
   const r=await leader.locator('#nc-canvas').boundingBox();await leader.mouse.move(r.x+r.width*.6,r.y+r.height*.3);await leader.mouse.down();await sleep(120);await leader.keyboard.press('2');await sleep(300);
   assert.equal(local.slot,1,'Number hotkey must switch to secondary');assert.equal(local.input.fire,false,'Switching slots while holding LMB must not auto-use the next item');await leader.mouse.up();await leader.locator('#nc-slot-0').click();
   mark('hotbar-regression-finished',{connected:match.players.map(p=>p.connected)});
  }
  // A short offline interruption must preserve party membership and resume the same match.
  const reconnectPlayer=match.players.find(p=>p.name==='QA3');expectedOffline.add(3);mark('offline-start',{connected:match.players.map(p=>p.connected),sessions:service.sessions.size});await contexts[3].setOffline(true);service.sessions.get(reconnectPlayer.id).stream?.destroy();await waitUntil(()=>!reconnectPlayer.connected,'Server must see interrupted stream disconnect');mark('offline-disconnected',{connected:match.players.map(p=>p.connected)});await sleep(1800);mark('online-restore-start');await contexts[3].setOffline(false);mark('online-restored');
  await waitUntil(()=>reconnectPlayer.connected,'Client must reconnect within the reconnect window',18000);
  mark('reconnected',{connected:match.players.map(p=>p.connected),sessions:service.sessions.size});
  expectedOffline.delete(3);
  await sleep(1000);assert.equal(service.rooms.get(code).members.length,4,'Reconnect must not duplicate room members');assert.equal(service.rooms.get(code).match.matchId,match.matchId,'Reconnect must preserve the existing match');
  // Personal pause releases input without stopping the server clock or other clients.
  mark('personal-menu-start');
  await leader.bringToFront();await leader.keyboard.press('Space');await sleep(250);assert(!local.input.fire&&!local.input.x&&!local.input.y,'Personal menu must release controls');
  const timeBefore=match.time;await sleep(250);assert(match.time>timeBefore,'Online personal menu must not pause server');await leader.keyboard.press('Space');
  // Leaving cleans browser work and server room state even after reconnect.
  mark('leave-start');for(let i=0;i<pages.length;i++){await pages[i].locator('#nc-leave').click();await pages[i].locator('#wb-menu').waitFor({state:'visible'});mark('pilot-left',{pilot:i})}
  await sleep(300);assert.equal(service.rooms.size,0,'Empty lobby must be removed');assert.deepEqual(errors,[],'Browser runtime errors');
  if(!baseline)for(const page of pages)assert.equal((await readDiagnostics(page)).rafActive,false,'Leaving multiplayer must stop its animation loop');
  result.regressions='passed';result.phases=phases;fs.writeFileSync(resultPath,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));console.log('PASS 4 browser clients: lobby/loadout/start, keyboard/focus, sustained busy combat, network outage/reconnect, personal menu and clean leave.');
 }catch(error){mark('failure',{error:error.message});if(resultPath&&fs.existsSync(resultPath)){const saved=JSON.parse(fs.readFileSync(resultPath,'utf8'));saved.regressions='failed';saved.failure=error.message;saved.phases=phases;fs.writeFileSync(resultPath,JSON.stringify(saved,null,2))}console.error('Browser errors:',JSON.stringify(errors));for(let i=0;i<pages.length;i++)console.error('pilot'+i+':',await pages[i].locator('#nc-status').textContent().catch(()=>'(no status)'));console.error('rooms/sessions',service.rooms.size,service.sessions.size);throw error}
 finally{if(maintain)clearInterval(maintain);await Promise.all(browsers.map(browser=>browser.close()));await service.close()}
})().catch(error=>{console.error(error.stack);process.exitCode=1});
