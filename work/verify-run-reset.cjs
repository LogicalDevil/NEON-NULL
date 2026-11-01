// Browser-only regression hooks accelerate run setup; purchases and navigation use real UI.
const {chromium}=require('C:/Users/zrdud/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const output=path.resolve('outputs/neon-null.html');
const html=fs.readFileSync(output,'utf8');
assert(html.includes('<title>NEON//NULL v6.0</title>'),'Build v6.0 before running these checks');
const marker="}catch(error){console.error('NEON//NULL startup error'";
assert.equal(html.split(marker).length,2,'Expected exactly one active startup catch');
const hooks=`window.__runQA={
 state:()=>({creativeMode,endlessMode,practiceMode,playing,paused,wave,missionState,activeSlot,weapon,slotIndices:[...slotIndices],scrap,bankedScrap,purchasePressure,held:keys.size,pointerDown:pointer.down,
   items:categoryItems.map(items=>items.map(g=>({name:g.name,cost:g.cost,baseCost:g.baseCost,level:g.level||0,dmg:g.dmg??null,damage:g.damage??null,power:g.power??null,rate:g.rate??null,cooldown:g.cooldown??null,magSize:g.magSize??null,reserveMax:g.reserveMax??null,reloadDuration:g.reloadDuration??null}))),
   cosmetics:{owned:[...progression.owned],ownedSkins:[...progression.ownedSkins],equippedSkins:{...progression.equippedSkins},selected:selectedCosmetic,casesOpened:progression.casesOpened,records:structuredClone(progression.records)}}),
 setScrap:n=>{scrap=n;hud();refreshWeaponButtons()}, intermission:()=>showIntermission()
};`;
(async()=>{
 const browser=await chromium.launchPersistentContext(path.resolve('work/reset-qa-profile'),{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,viewport:{width:1440,height:1000}});
 try{
  const page=await browser.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.stack));
  page.on('console',message=>{if(message.type()==='error'&&/NEON\/\/NULL/.test(message.text()))errors.push(message.text())});
  await page.addInitScript(()=>{
   if(window!==window.top)return;
   if(sessionStorage.getItem('nn-reset-qa-seeded'))return;
   localStorage.clear();sessionStorage.clear();
   sessionStorage.setItem('nn-reset-qa-seeded','true');
   localStorage.setItem('nn.guest.neonNullMissionScrap','777');
   localStorage.setItem('nn.guest.neonNullProgression',JSON.stringify({version:2,owned:['mono','amber'],ownedSkins:['skin-pulse-ghostline'],equippedSkins:{'0':'skin-pulse-ghostline'},selected:'amber',casesOpened:3,records:{relay:{clears:2,bestTime:130}},bestEndlessWave:7}));
  });
  await page.route('https://neon-reset.test/game.html',route=>route.fulfill({contentType:'text/html',body:html.replace(marker,hooks+marker)}));
  await page.goto('https://neon-reset.test/game.html');
  await page.locator('#wb-login-screen').waitFor({state:'visible'});await page.locator('#nn-guest').click();await page.locator('#wb-menu').waitFor({state:'visible'});
  const click=id=>page.locator('#'+id).click(),read=()=>page.evaluate(()=>__runQA.state());
  const deploy=async()=>{await click('wb-play');await page.locator('#wb-mission-select').selectOption('relay',{force:true});await click('wb-deploy');await page.locator('#wb-game').waitFor({state:'visible'})};
  const goMenu=async()=>{if(await page.locator('#wb-run-armory').isVisible())await click('wb-armory-close');if(!(await page.locator('#wb-paused').isVisible()))await click('wb-pause-button');await click('wb-main-menu');await page.locator('#wb-menu').waitFor({state:'visible'})};
  await deploy();const baseline=await read();
  assert.deepEqual(baseline.items.map(x=>x.length),[16,10,10,10]);assert.deepEqual(baseline.slotIndices,[0,0,0,0]);assert.equal(baseline.bankedScrap,777);assert.equal(baseline.items.flat().filter(g=>g.cost===0).length,4);
  assert.deepEqual(baseline.cosmetics.equippedSkins,{'0':'skin-pulse-ghostline'},'Saved skin must hydrate into runtime progression on initial deployment');
  function assertDurable(state){assert.equal(state.bankedScrap,777,'Run operations changed banked scrap');assert.deepEqual(state.cosmetics,baseline.cosmetics,'Run reset changed permanent cosmetics or records')}
  function assertFresh(state,label){assert.deepEqual(state.items,baseline.items,label+': gear properties leaked across deployments');assert.deepEqual(state.slotIndices,[0,0,0,0],label+': prior selections leaked');assert.equal(state.activeSlot,0);assert.equal(state.weapon,0);assert.equal(state.purchasePressure,0);assertDurable(state)}
  await goMenu();await page.reload();await page.locator('#wb-login-screen').waitFor({state:'visible'});await click('nn-guest');assert.deepEqual((await read()).cosmetics.equippedSkins,{'0':'skin-pulse-ghostline'},'Reload must restore equipped skin into actual closure progression');await deploy();assertFresh(await read(),'Mission after reload');
  console.log('PASS saved skin IDs hydrate into actual runtime progression after initial load, browser reload, and new deployment');
  await page.evaluate(()=>__runQA.setScrap(10000));await click('wb-armory-open');await page.locator('#wb-run-armory').waitFor({state:'visible'});assert((await read()).paused);assert.equal(await page.locator('[data-armory-slot]').count(),4);
  const purchaseBefore=await read(),purchaseCost=purchaseBefore.items[0][1].cost;await page.locator('#wb-weapons > button').nth(1).click();const purchased=await read();assert.equal(purchased.items[0][1].cost,0);assert.equal(purchased.scrap,purchaseBefore.scrap-purchaseCost);assert.equal(purchased.slotIndices[0],1);await click('wb-upgrade');const upgraded=await read();assert.equal(upgraded.items[0][1].level,1);assert(upgraded.items[0][1].dmg>baseline.items[0][1].dmg);assert(upgraded.items[0][1].rate<baseline.items[0][1].rate);assertDurable(upgraded);
  await click('wb-armory-close');assert(!(await read()).paused);await page.evaluate(()=>__runQA.intermission());await page.locator('#wb-intermission').waitFor({state:'visible'});await click('wb-next-wave');const wave2=await read();assert.equal(wave2.wave,2);assert.equal(wave2.items[0][1].cost,0);assert.equal(wave2.items[0][1].level,1);assert.equal(wave2.slotIndices[0],1);
  await goMenu();await deploy();assertFresh(await read(),'New Mission deploy');
  console.log('PASS Mission purchases/upgrades persist between waves, then reset to starter equipment on redeploy without touching cosmetics or banked scrap');
  await goMenu();await click('wb-endless-start');await page.locator('#wb-armory-open').waitFor({state:'visible'});assertFresh(await read(),'First Endless deploy');assert.equal((await read()).scrap,0);await page.evaluate(()=>__runQA.setScrap(10000));
  await page.keyboard.down('w');await click('wb-armory-open');assert.equal((await read()).held,0);assert.equal((await read()).pointerDown,false);
  for(let slot=0;slot<4;slot++){
   await page.locator('[data-armory-slot="'+slot+'"]').click();assert.equal(await page.locator('#wb-weapons > button').count(),[16,10,10,10][slot]);const before=await read(),cost=before.items[slot][1].cost;
   await page.locator('#wb-weapons > button').nth(1).click();const owned=await read();assert.equal(owned.items[slot][1].cost,0);assert.equal(owned.scrap,before.scrap-cost);assert.equal(owned.slotIndices[slot],1);await click('wb-upgrade');assert.equal((await read()).items[slot][1].level,1);
  }
  await page.screenshot({path:'work/reset-qa-armory.png'});await click('wb-armory-close');assert(!(await read()).paused);await page.keyboard.up('w');await click('wb-pause-button');await click('wb-armory-pause');assert((await read()).paused);await click('wb-armory-close');assert((await read()).paused,'Armory opened from pause should stay paused on close');assert(await page.locator('#wb-paused').isVisible());await click('wb-restart');assertFresh(await read(),'Endless restart');assert.equal((await read()).scrap,0);
  await click('wb-armory-open');await page.keyboard.press('Escape');assert(!(await page.locator('#wb-run-armory').isVisible()));assert(!(await read()).paused);await goMenu();await click('wb-endless-start');assertFresh(await read(),'Endless redeploy');
  console.log('PASS Endless exposes all46 items in four categories, purchases use run scrap, pause/Armory focus state works, restart and redeploy reset all combat ownership and upgrades');
  await goMenu();await page.locator('#wb-creative-start').evaluate(el=>el.closest('details').open=true);await click('wb-creative-start');await page.locator('#wb-creative-panel').waitFor({state:'visible'});const toggle=page.locator('#wb-creative-scrap-toggle');if((await toggle.textContent()).includes('Off'))await toggle.click();
  for(let slot=0;slot<4;slot++){
   await page.locator('#wb-creative-category').selectOption(String(slot),{force:true});await page.locator('#wb-creative-weapon').selectOption('1',{force:true});await click('wb-equip-test-weapon');await click('wb-creative-upgrade-100');assert.equal((await read()).items[slot][1].level,100);
  }
  const creative=await read();assert(creative.items[0][1].dmg>baseline.items[0][1].dmg+50);assert(creative.items[3][1].cooldown<baseline.items[3][1].cooldown);assertDurable(creative);await click('wb-creative-exit');await click('wb-endless-start');assertFresh(await read(),'Creative to Endless');await goMenu();await deploy();assertFresh(await read(),'Creative to Mission');
  await page.waitForTimeout(500);assert.equal(await page.locator('#wb-paused').isVisible(),false);assert.deepEqual(errors,[]);
  console.log('PASS Creative 100-level mutations across every slot cannot leak into Mission or Endless; no JavaScript/startup/frame errors');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
