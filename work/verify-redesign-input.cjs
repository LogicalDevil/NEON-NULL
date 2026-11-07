'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const {chromium} = require('C:/Users/zrdud/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {createGameServer} = require('../multiplayer/server.cjs');

(async()=>{
  const html = fs.readFileSync(process.env.INPUT_HTML_PATH||'outputs/neon-null.html','utf8');
  const service=createGameServer({dev:true});
  await new Promise(resolve=>service.server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+service.server.address().port;
  const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const errors=[],contexts=[],pages=[];
  try{
    for(let i=0;i<2;i++){
      const context=await browser.newContext({viewport:{width:1440,height:1000}});contexts.push(context);
      const page=await context.newPage();pages.push(page);
      page.on('pageerror',error=>errors.push(error.message));
      await page.route(base+'/',route=>route.fulfill({contentType:'text/html',body:html}));
      await page.goto(base);await page.locator('#nn-guest').click();await page.locator('#wb-multiplayer').click();
      await page.locator('#nc-panel>details').first().locator('summary').click();
      await page.locator('#nc-url').fill(base);await page.locator('#nc-guest-name').fill('InputQA'+i);
    }
    const leader=pages[0];await leader.locator('#nc-create').click();
    await leader.waitForFunction(()=>/^ROOM [A-F0-9]{6}$/i.test(document.getElementById('nc-code').textContent));
    const code=(await leader.locator('#nc-code').textContent()).split(' ')[1];
    await pages[1].locator('#nc-room').fill(code);await pages[1].locator('#nc-join').click();
    for(const page of pages)await page.locator('#nc-ready').click();
    await leader.locator('#nc-start').click();await leader.locator('#nc-canvas').waitFor({state:'visible'});
    const match=service.rooms.get(code).match;
    for(const p of match.players)p.invuln=999;
    // Pointerdown may occur without an earlier pointermove (touch or resize).
    const click=await leader.evaluate(()=>{
      const canvas=document.getElementById('nc-canvas'),r=canvas.getBoundingClientRect();
      // Synthetic pointer events have no platform pointer to capture.
      canvas.setPointerCapture=()=>{};
      canvas.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0,pointerId:71,clientX:r.left+r.width*.82,clientY:r.top+r.height*.23}));
      const d=NeonCoop.diagnostics();
      window.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,button:0,pointerId:71}));
      return {actual:d.aimWorld,expected:{x:d.camera.x+.82*d.camera.width,y:d.camera.y+.23*d.camera.height}};
    });
    const error=Math.hypot(click.actual.x-click.expected.x,click.actual.y-click.expected.y);
    if(process.env.EXPECT_STALE==='true')assert(error>100,'Baseline stale-pointer defect should reproduce');
    else assert(error<1,'Initial pointerdown must aim where the user pressed');
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({build:html.match(/<title>([^<]+)/)?.[1],pointerDownAimErrorPixels:error,expectedStale:process.env.EXPECT_STALE==='true'}));
    for(const page of pages)await page.locator('#nc-leave').click();
  }finally{
    for(const context of contexts)await context.close();
    await browser.close();
    await service.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
