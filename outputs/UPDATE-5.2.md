# NEON//NULL 5.2 — 1 November 2026

## Multiplayer movement, camera and rendering

Replaced the repeated correction toward an old snapshot with numbered movement commands, acknowledgements for movement actually simulated, and replay of only outstanding commands. Partial command consumption is reported separately. Retries cannot move a character twice. Gun recoil now affects the weapon's appearance rather than physically pushing the player backward.

Movement queues, prediction history and catch-up work are bounded. A small server-time credit lets delayed commands catch up after delivery jitter or a skipped simulation tick without accepting unlimited client movement time. Stale queued movement expires. Disconnects and downed states clear pending movement; deliberate dash and teleport changes are reconciled explicitly.

The command recorder preserves normal movement duration at 10–144 FPS and splits longer frames into legal command sizes. A long suspended frame is capped rather than replaying seconds of held input. Slot changes update the local hotbar immediately; input changes made during an in-flight request are coalesced into a follow-up request instead of waiting for another polling interval.

Each client now has its own player-following, edge-clamped camera viewing a 900 × 506.25 world-space region. The world remains 1280 × 800. Standard/high rendering uses 1280 × 720; Low uses 960 × 540. Pointer aiming converts from the displayed canvas through the camera into world coordinates. Off-screen bodies and projectiles are culled, while server combat continues. Boss warnings and revive markers have edge indicators.

The online renderer reuses the single-player enemy drawing function and palette. Cached body artwork, live health bars and warning overlays reduce redraw work. Local eligible firing gets immediate visual recoil, muzzle feedback and sound; the server still owns projectiles, ammunition and damage. Confirmation suppresses the corresponding duplicate firing cue.

## Separate cosmetic case

- Added **Open Cosmetic Case · 450 Scrap** alongside the existing 300-scrap weapon case.
- Cosmetic cases award operator cosmetics. Weapon cases award weapon skins. Their ownership lists remain separate.
- Both cases use the same six rarity tiers and the same total probability for each tier, calculated from the existing weapon case. Within a cosmetic rarity, eligible items share that tier's probability equally. Individual item odds therefore depend on how many cosmetics belong to that tier.
- The free Signal Suit is excluded. Exact item odds are visible in the shop; buying either case selects its odds list automatically.
- One shared purchase lock prevents concurrent charges. Rewards save before the reveal; existing skip/instant options remain available. Duplicates use the existing capped scrap refund.
- Cosmetic rewards can be equipped immediately and persist with the existing account/local save system. No database migration is required.

## Melee reach and fixes

All ten current melee weapons, including Fists, have **200% more reach**, meaning **3× their former attack distance**, in single-player and co-op. Fists increased from 44 to 132 world units; Spear increased from 102 to 306. Damage, cooldowns, costs and attack angles remain as before. Swing effects use the matching reach; online arcs now use the actual weapon's angle.

Fixed an undefined `dt` reference in single-player melee hits that could interrupt combat. Hit-flash decay now happens in the frame update. Also fixed cosmetic reveal audio calling the sound engine without a sound name and case buttons incorrectly sharing an ownership-disabled state.

## Deploy this update

1. Extract `neon-null-v5.2-bundle.zip`.
2. Upload its **contents** to the root of the existing `LogicalDevil/NEON-NULL` repository: replace `index.html` and the supplied `multiplayer`, `outputs` and `work` files. The bundle already contains a correctly named root `index.html`; do not rename the ZIP or upload it as the website entry.
3. Commit the changes. In the existing Render service, deploy the latest commit if automatic deployment has not started.
4. Keep the current environment variables and one server instance. Build Command remains `true`; Start Command remains `node multiplayer/server.cjs`.
5. When Render reports Live, open its game URL and hard-refresh. The title should show **v5.2**. Friends must refresh too: this release's server and client both use protocol **5.2**.

GitHub Pages receives the new static game from the same repository commit. No new Supabase SQL or key changes are needed. Redeploying the process ends active co-op rooms; cloud saves and the existing save schema are preserved.

See `PERFORMANCE-5.2.md` for the actual local test results and their limits. Production Render performance and live Supabase delivery are not claimed as tested.

## Follow-up melee balance — 1 November 2026

All ten melee weapons now deal 30% less base damage and take 25% longer between attacks. Reach is reduced 25% from the initial 5.2 release (Fists: 99; Spear: 229.5 world units). Linear radial damage falloff, measured from the player/attack origin to the nearest edge of the target, reduces damage to 35% at maximum reach. Combo bonuses and hammer splash follow the damage nerf and falloff. Single-player preserves fractional damage so low-damage fists are not rounded back up. The same rules apply online. Earlier performance measurements describe the initial 5.2 build, before this balance follow-up.

## Interface refresh — 1 November 2026

Wider game layout, grouped hull/dash and secondary stats, hotbar below the arena, calmer typography and spacing. Cosmetic Exchange now separates collection, preview and case controls; fixed the grid row sizing that squeezed browsing space. Responsive desktop/tablet/mobile layouts retain all purchases, odds and preview controls.
