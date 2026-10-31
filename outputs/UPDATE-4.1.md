# NEON//NULL 4.1 — cosmetic models and fresh-run equipment

Open `neon-null.html`, or the versioned `neon-null-v4.1.html`. Use the updated file rather than a previously opened release.

## Mission and Endless equipment

Every new deployment and restart restores the starting loadout: Pulse, Flare Pistol, Fists and Medkit. Other combat equipment must be bought again with run scrap. Weapon damage, fire rate, utility power, cooldown upgrades, ammo, selected slots, and purchase-driven difficulty pressure reset together.

Purchases and upgrades remain available between waves in the same run. Deploying another operation is a new run. Creative Lab's free testing and level boosts do not carry into Mission or Endless.

This does **not** reset accounts, usernames, banked scrap, purchased operator cosmetics, weapon-skin ownership, equipped skins, case counts or records. Those remain saved. Cosmetic skins apply when their compatible weapon is equipped again.

## Find all equipment in Endless

Choose **Armory · Buy / Equip** below the arena, or from the pause screen. The dedicated Armory pauses single-player combat and shows all four categories: 16 primaries, 10 secondaries, 10 melee weapons and 10 utilities. The panel displays current run scrap, prices, descriptions, ammo/reload information, owned state, upgrades and the next unlock.

Buy items directly from the list, or use Unlock Next Weapon. Select the four category buttons or keys 1–4 while the Armory is open. Back to Run or Escape closes it. If opened from the pause screen, closing it returns to pause; otherwise play resumes. Purchases never require an off-screen dropdown or page scrolling during combat.

## Models and previews

The collection retains 70 operators and 70 weapon skins with the same IDs, prices, 300-scrap case cost, odds and duplicate refunds. Static geometry is cached. The redesign combines distinct head/chassis/shoulder/backpack/armor construction, material patterns, animated details and ten restrained effect families. Weapon skins change their compatible weapon's receiver, barrel, chamber, stock, magazine and sights rather than only its color.

The same Canvas model functions render shop thumbnails, live gameplay and co-op. The shop provides Idle, Move, Fire, Reload and Dash inspection; comparison against equipped gear; an actual-size view; and inspection without color. Skin-specific firing and reload-start/completion sound textures stay within existing audio limits and never change reload timing.

Settings includes **Reduce other players' cosmetic effects**, saved alongside accessibility preferences and included in cloud saves. Reduced motion and low effects keep the structural model and a quiet signature. Decorative geometry does not change collisions or attack hitboxes. Important enemy warnings retain their foreground drawing order.

See `COSMETIC-INVENTORY.md` for all 140 IDs and assigned silhouettes, materials, animations and effects. Procedural model assemblies are intentional; this release uses the existing 2D Canvas renderer and does not introduce a 3D engine.

## Multiplayer update

Deploy the updated server bundle alongside the updated HTML for weapon-skin synchronization. The server verifies owned suit IDs and compatible owned weapon skins from the account's cloud save. Sync new cosmetic purchases before reconnecting to a lobby. It transmits item IDs and combat animation states; decorative effects are generated locally.

Existing Supabase account, username and save tables continue working. There is no new SQL migration for this update. Multiplayer still requires the running backend described in `MULTIPLAYER-SETUP.md`; this update does not create a public hosted server.

## Verification

- Mission purchases/upgrades survive waves and reset on redeployment.
- Endless exposes all 46 equipment choices; purchasing, upgrading, restart, pause, Escape and input clearing were checked in a real browser.
- Creative level-100 upgrades do not leak into either mode.
- Durable ownership, banked scrap and equipped skin IDs survive run resets and browser reload. An existing initialization-order bug that skipped equipped-skin restoration was fixed.
- All 140 model definitions were drawn in real Canvas; each category produced 70 distinct grayscale images. Geometry bounds, drawing budgets and transform cleanup were checked.
- Shop actions, comparison, reduced motion, low quality, preview cleanup and bounded caches were checked. Previews do not mutate equipment state.
- Four local browser clients rendered distinct elaborate suits and compatible weapon skins in a busy co-op arena, including reduced remote effects and low quality.
- Backend authentication and cosmetic ownership checks passed against a simulated provider. A live Supabase project and Internet-hosted service were not accessed or deployed.

Historical archived snapshots remain unchanged.
