# NEON//NULL 5.4 — 1 November 2026

## Visual polish

- All 70 operator cosmetics retain their unique silhouettes, palettes and aura identities, with inset joints, connected neck collars, armor edge highlights, recessed shading and light contact shadows.
- All 70 gun skins and 26 plain weapon defaults retain their native weapon shapes, with grip/receiver details, small material-dependent markings, top-edge highlights and restrained lower-edge shading. Reload and firing animations continue to use the same shared definitions as the shop and Creative Lab.
- Standard caches models at twice their logical resolution; High uses three times the logical resolution and adds fine edge detail. Low uses simpler shading and native-size cached artwork. Rendering surfaces and gameplay scale are unchanged.
- The shared sprite cache has a 300-entry limit and a 32 MiB raw pixel budget. It includes quality in cache keys and evicts old entries. Material details are generated when artwork is cached, not rebuilt for every frame.
- Light contact shading was added to operator cosmetics and pickups; weapons receive a faint offset depth layer. Existing enemy shadows remain. These are stylized model-space highlights and flat contact shadows, not physically simulated lighting or expensive blur filters.
- Shared projectiles now distinguish metallic rounds, energy beams, explosive rounds, blades/harpoons and discs. Skin accents and short decorative tails provide variation. Hostile shots retain a red danger accent. Reduced motion and Low settings simplify tails.
- Single-player previously drew the old projectile artwork underneath the skin overlay. That duplicate layer has been replaced with the shared projectile renderer. Co-op now uses it for plain, skinned and hostile shots as well. Bullet collision centers, radii, damage, speed and firing cadence were not changed.
- Particle shading adds brief highlight and lower-edge depth where supported. Existing smoke, impact, explosion, healing, shield and melee effects keep their bounded lifetimes, caps and accessibility settings. No additional screen shake, sound voices or persistent particle spawners were introduced.

This is a polish pass on the stylized artwork. Skin IDs, ownership, prices, sound profiles, gameplay statistics, ammunition, mission rules and the previous melee balance remain unchanged. Existing muzzle flashes stay attached to each model's muzzle; physical projectile spawn rules remain unchanged.

## Validation

Automated model checks exercised all 140 cosmetic definitions at all quality/reduced-motion combinations, including weapon projectiles, transform cleanup and finite coordinates. Actual Canvas checks confirmed 70 distinct grayscale operator images and 70 weapon images, shop thumbnails, preview actions, compare/grayscale inspection, persistence, firing/reload, reduced effects and no gameplay-state mutation. Representative preview images were visually inspected.

Four local co-op clients passed a mixed-enemy/boss arena, elaborate suits/weapon skins, low graphics, fullscreen, a 400-pixel window and clean leave. Custom selector/touch-emulation, shop purchase/save and melee regression checks also passed during this update. These checks do not establish production Render performance, physical touch-device behavior or long-session stability.

## Local render measurements

The fixture used a 1280 × 720 Canvas with 12 operators, 12 guns and 48 projectiles, 180 frames per quality setting after warmup. It measures the shared renderer, not the complete game's FPS. Other browser validation work ran on the same machine, so scheduling contention affects frame intervals and comparisons between quality settings.

| Quality | Median frame interval | 95th-percentile interval | Median drawing | 95th-percentile drawing |
| --- | --- | --- | --- | --- |
| Low | 16.7 ms | 26.2 ms | 1.0 ms | 2.7 ms |
| Standard | 16.7 ms | 25.0 ms | 1.1 ms | 2.2 ms |
| High | 16.7 ms | 17.1 ms | 1.4 ms | 6.4 ms |

These are observed local results, not universal frame-rate promises or evidence that High is faster. Raw results and cache sizes are in `RENDER-5.4.json`; the fixture is `work/verify-render-v54.cjs`.

## Deployment

Extract `neon-null-v5.4-bundle.zip`, replace the supplied files in the GitHub repository, commit, and redeploy the existing Render service. Root `index.html` is already named correctly. Keep existing environment variables; no new Supabase SQL is required. Co-op protocol remains 5.2. Existing legacy archive builds keep their historical artwork. The standalone `neon-null-v5.4.html` includes its fonts and rendering modules.
