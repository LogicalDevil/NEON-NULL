/* Shared v7 equipment tuning. Apply to canonical definitions before run upgrades. */
(function(root) {
  'use strict';
  const revision = '7.0';
  const flare = Object.freeze({damage: 1.6, radius: 63, duration: 2, tick: .35, burnDamage: .9});
  const tuning = {
    rapid: {damageFactor: .92, note: 'Rapid suppression trades ammunition efficiency for handling.'},
    beam: {damageFactor: 1.25, recoveryFactor: .9, note: 'Armor-piercing bursts reward a clear firing lane.'},
    'auto-shotgun': {damageFactor: 1.15, note: 'Closer pellet hits reward its expensive crowd-control role.'},
    'ricochet-cannon': {damageFactor: 1.18, note: 'Banked shots retain their recovery and aiming commitment.'},
    'phase-blade': {damageFactor: .94, recoveryFactor: 1.1},
    'rifled-carbine': {damageFactor: 1.14},
    'blackpowder-fowling-piece': {damageFactor: 1.24, reloadFactor: .84},
    'blackpowder-breech-needle': {damageFactor: 1.16, reloadFactor: .9},
    'blackpowder-puckle-gun': {damageFactor: 1.12, reloadFactor: .88},
    'blackpowder-swivel-cannon': {damageFactor: 1.18},
    'spectrum-iceglass-refractor': {damageFactor: 1.12},
    'frontier-pump-scattergun': {damageFactor: 1.12},
    'brassworks-boiler-bell': {damageFactor: 1.12},
    'brassworks-crown-turret': {shotDamageFactor: 1.15},
    'spectrum-particle-turret': {shotDamageFactor: 1.12},
    'frontier-lookout-rig': {shotDamageFactor: 1.12}
  };
  const rounded = value => Math.round(value * 10000) / 10000;
  function apply(item, slot, checkpoint = false) {
    if (item.balanceRevision === revision) return item;
    const authoredCost = Number(item.cost) || 0;
    const beforeCost = checkpoint ? authoredCost : authoredCost > 0 ? Math.max(1, Math.ceil(authoredCost * .25)) : 0;
    item.cost = beforeCost;
    item.balanceBaseCost = beforeCost;
    if (slot < 2 && beforeCost > 0) {
      const factor = beforeCost <= 16 ? 1.25 : beforeCost <= 33 ? 1.35 : 1.5;
      item.cost = Math.round(beforeCost * factor);
      if (Number.isFinite(item.baseCost)) item.baseCost = item.cost;
    }
    const profile = tuning[item.kind];
    if (profile) {
      if (profile.damageFactor) {
        const damage = rounded((item.dmg ?? item.damage) * profile.damageFactor);
        item.damage = damage;
        if (slot < 2) item.dmg = damage;
      }
      if (profile.recoveryFactor) {
        if (Number.isFinite(item.rate)) item.rate = rounded(item.rate * profile.recoveryFactor);
        if (Number.isFinite(item.cooldown)) item.cooldown = rounded(item.cooldown * profile.recoveryFactor);
      }
      if (profile.reloadFactor) for (const key of ['reloadTime', 'reloadDuration']) {
        if (Number.isFinite(item[key])) item[key] = rounded(item[key] * profile.reloadFactor);
      }
      if (profile.shotDamageFactor) item.shotDamage = rounded(item.shotDamage * profile.shotDamageFactor);
      if (profile.note) item.desc += ' ' + profile.note;
    }
    if (item.kind === 'flare') {
      item.damage = item.dmg = flare.damage;
      item.flareRadius = flare.radius;
      item.desc = 'A short burning flare with a 63-unit splash. Burns refresh one effect and never stack; nine-tenths damage every 0.35 seconds for two seconds.';
    }
    if (item.kind === 'drill') {
      item.damage = rounded(item.damage * .82);
      item.cooldown = rounded(item.cooldown * 1.25);
      item.rate = item.cooldown;
      item.desc = 'A close rotary strike with 0.25-second recovery. Contact and distance falloff determine damage.';
    }
    item.balanceRevision = revision;
    return item;
  }
  function migrateCheckpoint(saved, slot) {
    if (!saved || saved.balanceRevision === revision) return saved;
    return apply({...saved}, slot, true);
  }
  const api = {revision, flare, apply, migrateCheckpoint};
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NeonCombatBalance = api;
})(typeof window === 'object' ? window : globalThis);
