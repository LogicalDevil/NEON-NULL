# Living Yard validation — 2 November 2026

These are local headless Chrome measurements, not Render or Internet performance guarantees. No live Supabase login or cloud round trip was tested. Browser test scripts contain local Chrome/Playwright paths; adjust them on another computer.

## Solo busy combat

| Capture | Duration | Active enemies | Frame interval p95 | Render callback p95 |
| --- | ---: | ---: | ---: | ---: |
| Before presentation changes | 12 seconds | 27–30 | 16.9 ms | 4.4 ms |
| With presentation changes | 20 seconds | 26–30 | 17.0 ms | 4.0 ms |

Fixtures maintained a mixed roster, supplied reserve ammo, and prevented death. Random encounters, unequal durations, and system variation mean the render difference is not evidence of a controlled speed improvement. Both captures also passed 12 restarts, world-size invariance on resize, suspension-gap bounds, and animation-loop cleanup on menu return. The after capture preceded co-op-only sprite-cache tuning; solo behavior was unchanged by that tuning.

Raw captures: immersion-before-results.json and immersion-after-results.json.

## Four-client co-op

Four independent browser processes, actual local HTTP event streams and inputs, four firing players, and 28–30 active enemies for 30.7 seconds. The test also checked loadout/hotbar input, a simulated offline/reconnect cycle, personal menu, and all clients leaving without a stale animation loop or room.

- Final per-client render callback p95: 7.2–8.0 ms.
- Final frame interval p95: 33.4–33.5 ms.
- Incoming decoded snapshot traffic: approximately 112–114 kB/s per client.
- Enemy sprite cache: 67 entries observed, bounded to 192.
- No browser runtime errors or input errors were recorded.
- Largest server simulation callback was 67.6 ms; bounded catch-up discarded approximately 0.62 seconds over the test lifecycle. Occasional scheduling stalls remain possible.

An initial v6.1 capture with four animation phases and state in every sprite key filled the 192-entry cache and had a 50 ms frame-interval p95. The shipped client keeps bounded material sprites and applies inexpensive dynamic pose transforms, with two baked phases only for selected enemy types. The repeated capture improved frame-interval p95 to about 33.5 ms; render time remained variable, so this is not a universal FPS claim. Both raw captures are included for transparency.

Four simultaneous headless browsers compete for CPU/GPU resources on this machine. The previous v6.0 report used a different randomized run; its lower render timings are retained and should not be treated as a directly controlled comparison.

Raw captures: coop-v6.1-initial-results.json and coop-v6.1-results.json. Each co-op capture records its tested HTML SHA-256.

## Functional checks

- enemy-director-test: 15-type distribution, gradual eligibility, burst safety limits, reset, 15% base speed, and missing co-op archetypes.
- verify-immersion-integrated: actual mode launches, 300 selections per eligible pool across six solo modes/wave tiers, all types in Creative150, real damage/death effects, reduced motion, effects-zero gate, heavy-hit pause/recovery, Web Audio start/stop/gain, and power/shutter state.
- verify-enemy-parity: 162 exact shared renderer comparisons across enemy/boss types, health stages, quality, and themes.
- verify-living-yard / verify-room-environments: actual Canvas visuals, cache reuse, power events, contextual interaction, paused atmosphere, quality settings, operation distinction, and viewport-edge sampling.
- Existing combat, modification, movement, protocol, multiplayer server, complete Sector routes, tutorial, and responsive-interface checks passed.

This is a presentation foundation with tested existing gameplay loops. Multi-hour endurance, every physical controller/device, live cloud identity, and production hosting were not verified.
