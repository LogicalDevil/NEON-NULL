'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const {chromium} = require('C:/Users/zrdud/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const arsenal = require('../multiplayer/arsenal-catalog.cjs');
const marker = "}catch(error){console.error('NEON//NULL startup error'";
const hooks = `window.__arsenalLoadout = {
  deploy:()=>{menu.hidden=true;game.hidden=false;start(false,true,false)},
  menu:returnToMenu,
  fund:()=>{scrap=1000;hud()},
  state:()=>({scrap,faction:nnActiveFaction,bench:nnBench,creativeMode,selected:[...slotIndices],gear:categoryItems.map((list,slot)=>list[slotIndices[slot]].kind),foes:foes.length}),
  openArmory:openRunArmory
};`;
(async () => {
  const html = fs.readFileSync('outputs/neon-null-v6.8.html', 'utf8');
  assert.equal(html.split(marker).length, 2);
  const browser = await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:920}});
    const errors = [];
    page.on('pageerror', error => errors.push(error.stack));
    page.on('console', message => { if (message.type() === 'error' && message.text().startsWith('NEON//NULL')) errors.push(message.text()); });
    await page.route('https://arsenals.invalid/**', route => route.fulfill({contentType:'text/html',body:html.replace(marker,hooks+marker)}));
    await page.goto('https://arsenals.invalid/');
    await page.locator('#nn-guest').click();
    const chooser = page.locator('#nn-deployment-faction');
    const preview = page.locator('#nn-faction-item-copy');
    const kit = page.locator('#nn-faction-kit span');
    await page.locator('.nn-arsenal-selector summary').click();
    for (const faction of arsenal.factions) {
      await chooser.selectOption(faction.id,{force:true});
      assert.equal(await kit.count(),4);
      assert((await preview.textContent()).length > 20);
      await page.evaluate(() => __arsenalLoadout.deploy());
      assert.deepEqual((await page.evaluate(() => __arsenalLoadout.state())).selected,faction.starter);
      await page.evaluate(() => __arsenalLoadout.openArmory());
      assert.equal(await page.locator('#wb-weapons button').count(),faction.id==='default'?16:10);
      await page.evaluate(() => __arsenalLoadout.menu());
    }
    await chooser.selectOption('spectrum',{force:true});
    await page.evaluate(()=>{__arsenalLoadout.deploy();__arsenalLoadout.fund();__arsenalLoadout.openArmory()});
    const before=await page.evaluate(()=>__arsenalLoadout.state());
    await page.locator('#wb-weapons button').filter({hasText:'Prism Lance'}).click();
    assert.equal((await page.evaluate(()=>__arsenalLoadout.state())).scrap,before.scrap,'inspection must not purchase gear');
    await page.locator('#nn-armory-action').click();
    assert((await page.evaluate(()=>__arsenalLoadout.state())).scrap<before.scrap);
    assert.equal((await page.evaluate(()=>__arsenalLoadout.state())).gear[0],'prism-lance');
    const purchased=await page.evaluate(()=>__arsenalLoadout.state());
    await page.locator('#nn-armory-action').click();
    assert.equal((await page.evaluate(()=>__arsenalLoadout.state())).scrap,purchased.scrap,'equipping owned gear must not spend again');
    await page.locator('#nn-armory-search').fill('rail');
    assert((await page.locator('#wb-weapons button').count())>0);
    await page.screenshot({path:'work/arsenal-armory-v68.png'});
    await page.evaluate(()=>__arsenalLoadout.menu());
    await page.locator('#nn-faction-item').selectOption('0:'+arsenal.byId('prism-lance').index,{force:true});
    await page.locator('#nn-workshop-bench').click();
    let state = await page.evaluate(() => __arsenalLoadout.state());
    assert(state.bench && state.creativeMode);
    assert.equal(state.gear[0],'prism-lance');
    await page.getByRole('button',{name:'Armored',exact:true}).click();
    state = await page.evaluate(() => __arsenalLoadout.state());
    assert.equal(state.foes,1);
    await page.getByRole('button',{name:'Group',exact:true}).click();
    assert.equal((await page.evaluate(()=>__arsenalLoadout.state())).foes,5);
    await page.getByRole('button',{name:'Boss-sized',exact:true}).click();
    assert.equal((await page.evaluate(()=>__arsenalLoadout.state())).foes,1);
    await page.locator('#nx-build-open').click();
    await page.locator('.ncb-equipment').selectOption('0:'+arsenal.byId('prism-lance').index,{force:true});
    assert.equal(await page.locator('.ncb-list button').count(),2);
    assert.match(await page.locator('.ncb-detail').textContent(),/Heat|Continuous/);
    await page.locator('.ncb-list button').first().click();
    assert.match(await page.locator('.ncb-summary').textContent(),/Prism Lance/i);
    await page.setViewportSize({width:390,height:844});
    assert(await page.locator('.ncb-card').isVisible());
    await page.locator('.ncb-close').click();
    await page.evaluate(() => __arsenalLoadout.menu());
    await page.evaluate(() => __arsenalLoadout.deploy());
    assert.equal((await page.evaluate(() => __arsenalLoadout.state())).gear[0],'photon-carbine');
    assert.deepEqual(errors,[]);
    console.log('PASS all five faction deployments, Armory filtering, live test bench, modification UI, narrow layout, and no test gear leakage.');
  } finally {
    await browser.close();
  }
})().catch(error => {console.error(error);process.exitCode=1;});
