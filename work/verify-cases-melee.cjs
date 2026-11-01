'use strict';
const {chromium}=require('C:/Users/zrdud/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const marker="}catch(error){console.error('NEON//NULL startup error'";
const hook=`window.__caseQA={pool:casePool,state:()=>({scrap:bankedScrap,owned:[...progression.owned],skins:[...progression.ownedSkins],selected:selectedCosmetic,cases:progression.casesOpened,rolling:skinRolling}),
 money:n=>{bankedScrap=n;saveProgression()},ownOperators:()=>{progression.owned=Object.keys(cosmeticCatalog);syncCaseButtons()},
 melee:(index,offset,side)=>{paused=false;const item=meleeWeapons[index];slotIndices[2]=index;meleeCool=0;pointer.x=player.x+1000;pointer.y=player.y;const d=item.reach+14+offset,a=side?item.arc/2+.03:0,e={x:player.x+Math.cos(a)*d,y:player.y+Math.sin(a)*d,r:14,hp:1000,max:1000,type:{id:'drone'},burn:0,burnTick:0,stun:0,vx:0,vy:0};foes.splice(0,foes.length,e);meleeAttack();const result={hit:e.hp<1000,reach:item.reach,visual:meleeSlash?.reach};foes.length=0;return result}};`;
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.stack));page.on('console',m=>{if(m.type()==='error'&&m.text().includes('NEON//NULL'))errors.push(m.text())});
 const html=fs.readFileSync('outputs/neon-null.html','utf8');assert.equal(html.split(marker).length,2);
 await page.addInitScript(()=>{if(window!==window.top)return;if(!sessionStorage.getItem('seeded')){localStorage.clear();sessionStorage.clear();sessionStorage.setItem('seeded','1');localStorage.setItem('nn.guest.neonNullMissionScrap','5000')}});
 await page.route('https://case-qa.invalid/**',r=>r.fulfill({contentType:'text/html',body:html.replace(marker,hook+marker)}));
 await page.goto('https://case-qa.invalid/');await page.locator('#nn-guest').waitFor({state:'visible'});await page.locator('#nn-guest').click();await page.locator('#wb-shop-open').click();
 const state=()=>page.evaluate(()=>__caseQA.state());
 const pools=await page.evaluate(()=>({weapon:__caseQA.pool('weapon'),operator:__caseQA.pool('operator')}));
 const totals=list=>list.reduce((a,i)=>(a[i.rarity]=(a[i.rarity]||0)+i.odds,a),{}),w=totals(pools.weapon),o=totals(pools.operator);
 assert.equal(pools.operator.length,69);assert(!pools.operator.some(i=>i.id==='mono'));assert.equal(Object.keys(o).length,6);
 for(const rarity of Object.keys(w))assert(Math.abs(w[rarity]-o[rarity])<1e-8,rarity+' rarity odds');
 assert(Math.abs(Object.values(o).reduce((a,b)=>a+b,0)-100)<1e-8);
 const item=pools.operator[0],fraction=item.odds/200;
 const force=async()=>page.evaluate(f=>{window.__random=Math.random;Math.random=()=>f},fraction),unforce=async()=>page.evaluate(()=>{Math.random=__random});
 await page.locator('#nn-instant-reveal').uncheck();const before=await state();await force();
 await page.locator('#wb-cosmetic-case-open').evaluate(b=>{b.click();b.click()});await unforce();
 const during=await state();assert.equal(during.scrap,before.scrap-450);assert.equal(during.owned.length,before.owned.length+1);assert.deepEqual(during.skins,before.skins);assert.equal(during.cases,before.cases);
 assert(await page.locator('#wb-case-open').isDisabled());assert(await page.locator('#wb-cosmetic-case-open').isDisabled());assert.equal(await page.locator('#wb-case-kind').inputValue(),'operator');
 await page.locator('#wb-reveal-skip').click();assert((await page.locator('#wb-reveal-name').textContent()).includes(item.name));await page.locator('#wb-reveal-equip').click();assert.equal((await state()).selected,item.id);
 assert(!(await page.locator('#wb-case-open').isDisabled()));assert(!(await page.locator('#wb-cosmetic-case-open').isDisabled()));
 await page.locator('#nn-instant-reveal').check();const duplicateBefore=await state();await force();await page.locator('#wb-cosmetic-case-open').click();await unforce();await page.locator('#wb-reveal-close').waitFor({state:'visible'});
 const duplicate=await state(),refund=Math.min(180,Math.max(8,Math.floor(item.cost*.35)));assert.equal(duplicate.scrap,duplicateBefore.scrap-450+refund);assert.deepEqual(duplicate.owned,duplicateBefore.owned);assert(await page.locator('#wb-reveal-equip').isHidden());await page.locator('#wb-reveal-close').click();
 const weaponBefore=await state();await force();await page.locator('#wb-case-open').click();await unforce();await page.locator('#wb-reveal-close').waitFor({state:'visible'});const weaponAfter=await state();assert.equal(weaponAfter.scrap,weaponBefore.scrap-300);assert.equal(weaponAfter.cases,weaponBefore.cases+1);assert.equal(weaponAfter.skins.length,weaponBefore.skins.length+1);assert.deepEqual(weaponAfter.owned,weaponBefore.owned);await page.locator('#wb-reveal-close').click();
 await page.reload();await page.locator('#nn-guest').waitFor({state:'visible'});await page.locator('#nn-guest').click();const saved=await state();assert.equal(saved.scrap,weaponAfter.scrap);assert.equal(saved.selected,item.id);assert(saved.owned.includes(item.id));assert.deepEqual(saved.skins,weaponAfter.skins);
 await page.locator('#wb-shop-open').click();await page.evaluate(()=>__caseQA.money(449));await page.locator('#wb-cosmetic-case-open').click();assert.equal((await state()).scrap,449);assert((await page.locator('#wb-shop-status').textContent()).includes('Need 1 more'));
 await page.evaluate(()=>__caseQA.ownOperators());assert(await page.locator('#wb-cosmetic-case-open').isDisabled());assert(!(await page.locator('#wb-case-open').isDisabled()));await page.locator('#wb-shop-close').click();
 console.log('PASS 450-scrap cosmetic case, six identical rarity probabilities totaling 100%, separate inventories, one charge per roll, duplicate cap, equip/persistence, affordability and independent button states');
 await page.locator('#wb-creative-start').evaluate(el=>el.closest('details').open=true);await page.locator('#wb-creative-start').click();await page.locator('#wb-creative-panel').waitFor({state:'visible'});
 const old=[44,52,58,64,74,88,102,62,70,56];
 for(let i=0;i<10;i++)for(const[offset,side,hit]of[[-.1,false,true],[.1,false,false],[-1,true,false]]){const result=await page.evaluate(([i,offset,side])=>__caseQA.melee(i,offset,side),[i,offset,side]);assert.equal(result.reach,old[i]*2.25);assert.equal(result.hit,hit,'Single-player melee '+i+' boundary');assert.equal(result.visual,result.reach)}
 assert.deepEqual(errors,[]);console.log('PASS all ten single-player melee attacks: rebalanced reach, distance/arc boundaries and matching swing reach; no runtime errors');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
