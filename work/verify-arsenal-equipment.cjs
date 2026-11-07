'use strict';
const {chromium}=require('C:/Users/zrdud/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');

const inject=`window.__arsenalEquipmentQA = () => {
  const tested=[];
  for(const definition of window.NeonArsenal.groups.flat()){
    const choices=window.NeonCombatExpansion.mods.filter(m=>m.kinds.includes(definition.kind));
    for(const mod of [null,...choices]){
    start(true);
    paused=false;activeSlot=definition.slot;slotIndices[definition.slot]=definition.index;
    if(activeSlot===0)weapon=definition.index;
    const item=currentItem(), px=player.x, py=player.y;
    if(item.kind!==definition.kind)throw Error('Wrong equipped item '+definition.kind);
    hull=5;pointer.x=px+90;pointer.y=py;
    if(item.kind==='capacitor-pack'){
      const spectrum=window.NeonArsenal.factionById('spectrum');
      slotIndices[0]=weapon=spectrum.starter[0];slotIndices[1]=spectrum.starter[1];
      weapons[weapon].reserve--;
    }
    const enemy=spawnEnemy(enemyKinds.find(e=>e.id==='drone'),px+115,py);
    enemy.hp=enemy.max=100;enemy.type.speed=0;enemy.fire=9999;
    if(mod&&!window.NeonCombatExpansion.apply(item,mod.id))throw Error('Workshop choice rejected '+mod.id);
    activateSelectedItem();
    if(item.chargeTime){
      pointer.down=true;pointer.slot=activeSlot;
      for(let tick=0;tick<22;tick++)arsenalTick(.033);
      activateSelectedItem();
      pointer.down=false;
    }
    if(activeSlot<2 && !(shots.length||arsenalTrace.length))throw Error('No rendered shot '+item.kind);
    if(activeSlot===2&&!meleeSlash)throw Error('No melee swing '+item.kind);
    if(activeSlot===3&&utilityCool!==0)throw Error('Creative cooldown '+item.kind);
    if(raf)cancelAnimationFrame(raf);
    raf=0;last=performance.now()-.017*1000;
    renderFrame(last+.017*1000);
    tested.push([item.kind,mod?.id||null]);
    }
  }
  returnToMenu();
  return tested;
};
window.__shakeQA = () => {
  start(true);
  if(raf)cancelAnimationFrame(raf);
  const result=[];
  pointer.viewX=311;pointer.viewY=147;
  for(const [enabled,motion,level] of [[true,false,1],[false,false,1],[true,true,1],[true,false,0]]){
    screenShakeEnabled=enabled;reduced=motion;shakeLevel=level;screenShake=.35;
    last=1000;
    renderFrame(1016);
    if(raf)cancelAnimationFrame(raf);raf=0;
    result.push({aimX:pointer.x-cameraX,aimY:pointer.y-cameraY,x:shakeX,y:shakeY});
  }
  returnToMenu();
  return result;
};`;
(async()=>{
  const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try{
    const page=await browser.newPage({viewport:{width:1360,height:840}}),errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('console',event=>{if(event.type()==='error'&&event.text().includes('NEON//NULL'))errors.push(event.text())});
    let html=fs.readFileSync(process.env.NEON_BUILD||'outputs/neon-null-v6.8.html','utf8');
    const anchor="}catch(error){console.error('NEON//NULL startup error'";
    assert(html.includes(anchor));
    html=html.replace(anchor,inject+anchor);
    await page.route('https://arsenal.invalid/**',route=>route.fulfill({contentType:'text/html',body:html}));
    await page.goto('https://arsenal.invalid/');
    await page.locator('#nn-guest').click();
    const checked=await page.evaluate(()=>window.__arsenalEquipmentQA());
    assert.equal(checked.length,480);
    const shake=await page.evaluate(()=>window.__shakeQA());
    for(const frame of shake){assert(Math.abs(frame.aimX-311)<.01);assert(Math.abs(frame.aimY-147)<.01)}
    assert(Math.abs(shake[0].x)+Math.abs(shake[0].y)>.01);
    for(const frame of shake.slice(1)){assert(frame.x===0&&frame.y===0)}
    assert.deepEqual(errors,[]);
    fs.writeFileSync('outputs/ARSENAL-VALIDATION-6.8.json',JSON.stringify({
      build:'v6.8',sha256:require('node:crypto').createHash('sha256').update(fs.readFileSync(process.env.NEON_BUILD||'outputs/neon-null-v6.8.html')).digest('hex'),
      checks:checked.map(([id,kit])=>({id,kit:kit||'standard',equipped:true,activated:true,frameRendered:true})),
      shakeAimAndSettings:true,browserErrors:errors,
      conditions:'Chromium actual solo engine. A native combat frame and activation for each standard/Workshop configuration. Visual art and sound profiles are checked separately.'
    },null,2));
    console.log('PASS 160 weapons and utilities selected and activated in the standalone browser build, all Workshop choices fit, native combat frame rendered, no runtime errors.');
  } finally {await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
