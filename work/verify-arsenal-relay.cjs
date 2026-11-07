'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium} = require('C:/Users/zrdud/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const marker = "}catch(error){console.error('NEON//NULL startup error'";
const hooks = `window.relayQA={
  pump(steps,kill=true){
    if(raf)cancelAnimationFrame(raf);raf=0;hurtCooldown=999;
    for(let i=0;i<steps&&playing&&!paused;i++){
      arsenalRelay.tick(.1,{player,enemies:foes,playing,paused,w,h,viewW,viewH,cameraX,cameraY});
      if(kill)for(const e of [...foes]){e.hp=0;killEnemy(e,foes.indexOf(e));}
    }
    hud();
  },
  approach(){const o=arsenalRelay.current().objective;player.x=o.x;player.y=o.y;},
  draw(){if(raf)cancelAnimationFrame(raf);raf=0;last=performance.now()-16;renderFrame(performance.now());if(raf)cancelAnimationFrame(raf);raf=0;},
  read(){return{run:arsenalRelay.current(),missionState,playing,paused,slotIndices:[...slotIndices],gear:slotIndices.map((i,s)=>categoryItems[s][i].name),foes:foes.map(e=>({id:e.type.id,boss:e.arsenalBoss,attacks:e.arsenalAttacks,elite:e.rarity==='elite'})),mag:currentItem().mag,record:structuredClone(progression.arsenalRelay||{})};},
  fail(){endRun('Hull depleted · test attack');}
};`;

(async()=>{
  const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1420,height:930}});
    page.setDefaultTimeout(8000);
    const html=fs.readFileSync(process.argv[2]||'outputs/neon-null.html','utf8');
    assert.equal(html.split(marker).length,2,'Expected primary engine injection point');
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error'&&/NEON\/\/NULL.+error/.test(m.text()))errors.push(m.text());});
    await page.route('https://arsenal-relay.invalid/**',route=>route.fulfill({contentType:'text/html',body:html.replace(marker,hooks+marker)}));
    await page.goto('https://arsenal-relay.invalid/');
    await page.locator('#nn-guest').click();
    const read=()=>page.evaluate(()=>relayQA.read());
    const pump=(n,kill=true)=>page.evaluate(([n,kill])=>relayQA.pump(n,kill),[n,kill]);
    const draw=()=>page.evaluate(()=>relayQA.draw());
    const approach=()=>page.evaluate(()=>relayQA.approach());
    const click=(name,exact=true)=>page.getByRole('button',{name,exact}).click();

    await click('Play Arsenal Relay');
    await page.locator('.nar-card').filter({hasText:'Spectrum Division'}).getByRole('button',{name:'Try Kit'}).click();
    assert.equal((await read()).gear[0],'Photon Carbine');
    assert.equal((await read()).run.mode,'trial');
    const before=(await read()).mag;
    await page.locator('#wb-canvas').click({position:{x:200,y:110}});
    assert.equal((await read()).mag,before-1,'Faction gun fires in the native trial');
    await click('Next Faction Trial');
    assert.equal((await read()).gear[0],'Line Musket');
    await page.locator('#wb-menu-button').click();
    await page.locator('#wb-main-menu').click();

    const locationsSeen=new Set();
    for(const [routeId,faction] of [['repair','spectrum'],['convoy','frontier'],['sabotage','blackpowder']]){
      await click('Play Arsenal Relay');
      await page.locator('.nar-card').filter({hasText:({spectrum:'Spectrum Division',frontier:'Frontier Union',blackpowder:'The Blackpowder Company'})[faction]}).getByRole('button',{name:'Deploy',exact:true}).click();
      await draw();
      await pump(360);
      let state=await read();
      assert.equal(state.run.phase,'route');
      assert(state.paused);
      assert.equal(state.run.location,faction);
      locationsSeen.add(state.run.location);
      const route=state.run.layout.routes.find(r=>r.id===routeId);
      await page.locator('.nar-card').filter({hasText:route.title}).getByRole('button').click();
      await draw();
      await pump(540);
      state=await read();
      assert.equal(state.run.location,route.location);
      locationsSeen.add(state.run.location);
      if(routeId==='convoy'){
        assert.equal(state.run.objective.kind,'convoy');
        await approach();await pump(2);
        assert.equal((await read()).run.phase,'salvage');
        const slot=3;
        const recover=page.getByRole('button',{name:'Recover Utility',exact:true});
        assert.equal(await recover.count(),10);
        await recover.last().click();
        state=await read();
        assert.equal(state.run.foreign.slot,slot);
        assert.equal(state.slotIndices[slot],state.run.foreign.index);
      }else if(routeId==='sabotage'){
        assert.equal(state.run.objective.kind,'terminal');
        await approach();await pump(25);
        assert.equal((await read()).run.sabotaged,true);
      }
      await pump(400,false);
      await pump(1,true);
      for(let i=0;i<32&&(await read()).run.phase!=='boss-ready';i++)await pump(20,true);
      assert.equal((await read()).run.phase,'boss-ready');
      await pump(36,false);
      state=await read();
      assert.equal(state.run.phase,'boss');
      const boss=state.foes.find(e=>e.id==='signal-core');
      assert(boss);assert.equal(boss.boss,route.location);
      const info=await page.evaluate(()=>NeonArsenalRelay.describeBoss());
      assert.deepEqual(boss.attacks,info.attacks);
      if(routeId==='sabotage')assert(!boss.attacks.includes(info.removed));
      await draw();
      assert.match(await page.locator('#wb-boss-intro-name').innerText(),new RegExp(info.boss,'i'));
      await pump(1,true);await pump(1,false);
      assert.equal((await read()).run.phase,'extract');
      await approach();await pump(1,false);
      state=await read();
      assert(state.run.result.success);
      assert(state.record[faction].extracts>=1);
      assert(await page.getByRole('heading',{name:'RELAY EXTRACTED'}).isVisible());
      if(routeId==='sabotage'){
        await click('Practice This Boss');await draw();
        assert.equal((await read()).run.mode,'practice');
        assert.equal((await read()).foes[0].boss,route.location);
        await pump(1,true);await pump(1,false);
        assert.equal((await read()).record[faction].extracts,1);
      }
      await click('Main Menu');
      assert(await page.locator('#wb-menu').isVisible());
      console.log(`PASS ${routeId} route, ${info.boss}, extraction, and return to menu`);
    }
    await page.reload();await page.locator('#nn-guest').click();
    assert.equal((await read()).record.spectrum.extracts,1);
    await click('Play Arsenal Relay');
    await page.getByRole('textbox',{name:'Arsenal Relay challenge code'}).fill('AR1-123-F-C');
    await click('Play Challenge');await draw();
    assert.equal((await read()).run.seed,'123');
    await pump(360);
    assert.equal((await read()).run.route.id,'convoy');
    await page.evaluate(()=>relayQA.fail());
    assert.match(await page.locator('.nar-copy').innerText(),/test attack/);
    assert.deepEqual(errors,[]);
    console.log(`PASS faction trial firing, mastery reload, seeded challenge, defeat reporting, and clean browser runtime (${locationsSeen.size} distinct arenas visited)`);
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
