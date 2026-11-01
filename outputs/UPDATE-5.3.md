# NEON//NULL 5.3 — 1 November 2026

## Interface

- Embedded Chakra Petch Regular and SemiBold for offline sci-fi headings, equipment labels and tabular counters. Descriptions retain a clean system font. No external font download is needed by the current release.
- Shared equipment-panel buttons across the current menus, shop, Armory, Creative Lab, accounts, Settings and co-op: angular corners, restrained shading, slate/brass accents, visible focus, pressed/selected indicators and disabled states. Buttons do not move their surrounding layout on hover.
- Custom single-choice dropdowns preserve the original select values, IDs, change handlers and saved preferences. Native controls remain the fallback; multiple-selection controls are not replaced.
- Arrow, Home/End, Enter/Space, Escape and letter navigation; searchable long lists; selected checkmarks; disabled options; touch-sized options; viewport-aware popup positioning. Opening a selector releases held combat input. Escape closes its popup before parent menus, and gameplay shortcuts are suppressed while operating it.
- Dynamic option lists, programmatic value changes, disabled controls and popup cleanup are synchronized through events and bounded DOM observers, not a new animation loop.
- Fixed the main container's box sizing and narrow co-op overflow. The wider HUD and three-part Cosmetic Exchange remain in place.

## Enemy models

All 15 regular enemy designs and the three operation bosses were remodeled with layered armor, clearer silhouettes, sharp panel edges, inset sensors, readable role accents and staged damage cracks. The Signal Warden retains its antenna/cannon silhouette, Archive Sentinel its floating prism, and Core Breaker its heavy siege frame.

Single-player and co-op use the same new drawing module. Health bars, stun/burn cues, hit flashes, existing attack telegraphs and boss warnings remain. Collision radii, AI, health, attack damage, rewards and spawn rules were not changed by this visual update. Low quality simplifies damage detailing. Online body sprite caches remain bounded and now include the graphics setting in their cache keys.

The preceding melee balance remains: 30% less base damage, 25% longer cooldowns, 25% less reach than the initial 5.2 update, with distance falloff.

## Verification

- Offline font loading; real mouse/keyboard selectors; search; Escape isolation; programmatic values; dynamic/disabled options; responsive popup bounds; fullscreen; touch emulation and reduced motion.
- Cosmetic case price, odds, duplicate refund, purchase locking, equip and saved ownership checks; all ten melee collision checks.
- 162 pixel comparisons between the single-player and shared enemy renderer across types, boss themes, health stages and all three quality settings. A contact sheet of all designs was visually inspected.
- Four local co-op clients with elaborate cosmetics, a mixed enemy arena and boss, low graphics, fullscreen, a 400-pixel window and clean leave. No browser runtime errors in these checks.

These are local checks, not a guarantee of no bugs or a production performance benchmark. Physical touch devices and assistive-technology sessions were not tested. Historical performance reports describe earlier builds. Legacy archive builds retain their historical interface and artwork.

## Updating the live game

Extract `neon-null-v5.3-bundle.zip`, replace its supplied files in the existing GitHub repository, commit, and let Render redeploy (or deploy the latest commit manually). Root `index.html` is already named correctly. Keep the existing environment variables and single server instance. No new Supabase SQL is needed. Co-op remains compatible with protocol 5.2; the application title is now v5.3.

The standalone `neon-null-v5.3.html` also includes the fonts, license and drawing modules. Browser-local saves remain associated with the origin from which the game is opened.
