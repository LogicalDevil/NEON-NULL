# NEON//NULL v6.1 — Living Yard

2 November 2026

## Faster, more representative encounters

- All 15 ordinary enemy types receive a 1.15 multiplier on base movement speed, in solo and authoritative co-op. Solo charger/dasher rush speed, co-op rush speed, and boss patrol speed also increase. Projectile speed and warning duration are unchanged.
- Random tie-breaking among the least-represented eligible enemies replaces independent random selection and operation lists that excluded several types. This balances representation across encounters while preserving unpredictable order.
- Five starter types, eight at tier 2, eleven at tier 3, and all fifteen at tier 4. Missions reach tier 4 in their final wave; Endless and Practice reach it at wave 4. Creative exposes all fifteen immediately. Sector encounters introduce the full roster by the fourth encounter.
- Individual bursts still limit bombers/minelayers and heavy brutes. Therefore a short burst may not contain every type; representation balances over successive bursts. Creative's 150-enemy queue rotates all types rather than treating 150 as a single safety batch.
- Added previously missing asteroid, orb, stalker, charger, and blink-stalker archetypes to co-op, using the same shared artwork. Existing co-op archetype indices remain compatible.

## World, impacts, and animation

- Relay, Archive, and Reactor use distinct cached material/environment treatments. Restrained rain, dust, steam, architecture, conduit markings, boundary equipment, and floor detail keep targets readable.
- Sector Relay Yard has additional layered machinery, contact shadows, wear, puddles, grates, and deterministic atmosphere. Power restoration lights a switch-to-door path, animates the shutter, and gives a localized steam response. Completed encounter checkpoint flags power subsequent scenery.
- Interact appears only near usable objects. Existing destruction, solid collision removal, supplies, terminals, and extraction remain tied to real object state.
- Metal, stone, energy, and shields have distinct directional contact effects. Defeats produce material-appropriate fragments, arcs, smoke, or ripples once.
- Refined crater rims/fractures, ground smoke, and directional wind accents. All decoration is bounded and respects intensity, quality, and reduced motion.
- Enemy and boss models retain their silhouettes and collision dimensions while adding anticipation, recovery, scan, damaged flight, plate, and exposed-core detail. Co-op retains the shared renderer and bounded sprite cache.
- Heavy hammer/greatsword contact can briefly pause solo presentation (35 ms maximum at full intensity). Reduced motion disables this response; co-op simulation is never paused by impact feedback.

## One adaptive soundtrack

- Original offline synthesized score with synchronized atmosphere, harmony, melody, bass, percussion, and boss layers.
- Relay, Archive, and Reactor motifs; combat-pressure hysteresis; power-restoration harmony; warning ducking; cosmetic timbre/transpose changes without restarting the musical clock.
- Single controller and timer, 48-note voice cap, cleanup on stop, pause-aware musical position, and skipped scheduling backlog after tab suspension.
- Fixed conflicting music gain multipliers: changing master/effects settings no longer makes music roughly 23 times quieter.

## Preserved systems and scope

Existing save schemas, accounts, skins/preview flow, mission objectives, Sector routes, tutorials, accessibility, legacy templates, and controls are preserved. This release builds the first Relay Yard presentation stage and shared audio/rendering foundation. It does not introduce a new 3D engine, new campaign map, additional tutorial boss, destructible-conduit hazard system, or fully spatial environmental audio loops. Existing environmental interactions remain in place. Further expansion of those systems should build on this tested foundation.

## Validation

Passed deterministic roster/speed tests, 46-item co-op combat checks, server authority/protocol/movement checks, both full Sector routes with checkpoints/rewards/boss/extraction, real browser audio lifecycle, power transition/cache tests, all-operation scenery tests, effects/motion tests, seven training steps, responsive UI, and 162 exact shared enemy renderer comparisons.

See PERFORMANCE-6.1.md for local busy-fight and four-client results. Tests use local Chrome; no live Supabase or Render session was validated. These checks do not establish universal hardware performance or absence of all bugs.

## Deploy

1. Extract neon-null-v6.1-bundle.zip.
2. Replace repository-root index.html and the complete multiplayer folder together. The server now requires multiplayer/enemy-director.cjs.
3. Commit the changes; let the connected Render service redeploy, or use Manual Deploy → Deploy latest commit.
4. Keep the existing Supabase environment variables and single server instance. No new database SQL is required.
5. Open the Render game and refresh. Confirm the browser title says v6.1. Local file changes alone do not update the hosted game.

Start command remains node multiplayer/server.cjs. The wire protocol remains 5.2; the release version is 6.1.
