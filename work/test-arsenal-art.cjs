/* Faction render paths and resolution behavior in Chromium's real 2D canvas. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('C:/Users/zrdud/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
    const faults = [];
    page.on('pageerror', error => faults.push(error.message));
    await page.setContent('<style>body{margin:0;background:#18252e;color:white;font:16px monospace}canvas{display:block}</style><canvas width="1024" height="768"></canvas>');
    for (const script of ['multiplayer/arsenal-catalog.cjs', 'work/arsenal-art.js']) {
      await page.addScriptTag({ content: fs.readFileSync(script, 'utf8') });
    }
    const summary = await page.evaluate(() => {
      const art = window.NeonArsenalArt, catalog = window.NeonArsenal;
      const ctx = document.querySelector('canvas').getContext('2d');
      const sounds = new Map(), floorPixels = [];
      const factions = catalog.factions.filter(faction => faction.id !== 'default');
      art.registerSounds((name, ...profile) => sounds.set(name, profile));
      let models = 0, projectileArt = 0, slashes = 0;
      for (const [index, faction] of factions.entries()) {
        const x = (index % 2) * 512, y = Math.floor(index / 2) * 384;
        ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.rect(0, 0, 512, 384); ctx.clip();
        art.drawArena(ctx, { faction: faction.id, w: 512, h: 384, time: 2, quality: 'high' });
        art.drawBoss(ctx, { x: 252, y: 213, r: 45, hp: 45, max: 100, open: true }, { faction: faction.id, time: 2, quality: 'high' });
        const gear = catalog.groups.flat().filter(item => item.faction === faction.id);
        for (const [n, item] of gear.entries()) {
          ctx.save(); ctx.translate(20 + (n % 3) * 172, 280 + 31 * Math.floor(n / 3));
          models += Number(art.drawHeld(ctx, item, { time: 2, charge: .8, heat: .5, reduced: true, quality: 'low' }));
          if (item.slot < 2) {
            ctx.translate(75, 0);
            projectileArt += Number(art.drawProjectile(ctx, item, { quality: 'high' }));
          } else if (item.slot === 2) {
            ctx.translate(49, 0);
            slashes += Number(art.drawSlash(ctx, item, { reach: 14, arc: item.arc, progress: .3, quality: 'low', reduced: true }));
          }
          ctx.restore();
        }
        ctx.restore();
        floorPixels.push(Array.from(ctx.getImageData(x + 70, y + 100, 1, 1).data).join(','));
      }
      const fx = art.createFX(), item = catalog.groups[0][0];
      for (let i = 0; i < 240; i++) fx.event('fire', item, 120, 130, { angle: 0 });
      const maxFX = fx.count();
      for (let i = 0; i < 5; i++) fx.draw(ctx, .1, { reduced: true, flash: false, quality: 'low', intensity: 0 });
      const hasAudio = catalog.groups.flat().every(item => sounds.has(item.sfx) && (!item.chargeTime||sounds.has('arsenal-charge-'+item.kind)) && (!item.heatPerShot||sounds.has('arsenal-vent-'+item.kind)) && (item.slot > 1 || sounds.has('reload-' + item.reloadStyle) && sounds.has('reload-complete-' + item.reloadStyle)));
      return { models, projectileArt, slashes, floors: new Set(floorPixels).size, maxFX, activeFX: fx.count(), hasAudio,
        resolutions: ['low', 'standard', 'high'].map(quality => art.surfacePixels(quality, 1600, 1.25)),
        invalidRay: art.drawRay(ctx, { x: 0, y: 0, endX: NaN, endY: 80 }) };
    });
    assert.deepEqual(faults, []);
    assert.deepEqual(summary, { models: 160, projectileArt: 80, slashes: 40, floors: 4, maxFX: 42, activeFX: 0, hasAudio: true, resolutions: [960, 1280, 1600], invalidRay: false });
    if (process.env.NEON_ART_SCREENSHOT) await page.screenshot({ path: process.env.NEON_ART_SCREENSHOT });
    console.log('Arsenal artwork in Chromium:', summary);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
