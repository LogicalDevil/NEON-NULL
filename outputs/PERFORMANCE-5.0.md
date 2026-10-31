# NEON//NULL 5.0 performance and verification

Measured on 31 October 2026 using four separate headless Chrome processes on one Windows machine. Viewports were 1440×1000. The final client matched its canvas backing resolution to the displayed arena. This is a local development server with unranked test accounts, not a measurement of the deployed Render service or Internet latency.

## Observed browser results

| Measurement | Previous renderer | Final v5.0 |
|---|---:|---:|
| Profile duration | 35.4s | 75.5s |
| Median frame interval across clients | 16.70–16.70ms | 16.70–16.70ms |
| 95th percentile frame interval | 25.00–25.00ms | 16.90–16.90ms |
| 95th percentile draw work | 2.20–2.50ms | 1.10–1.10ms |
| Mean received stream traffic per client | 181.8KiB/s | 106.5KiB/s |

The median frame rate was approximately 60 FPS locally. Observed stream traffic fell approximately 41%. The previous renderer was connected to the current server with full object packets; this is not a controlled historical server benchmark. Runs had different durations and randomized encounters, so these numbers describe this setup rather than a universal speedup.

The final fixture sampled 26–30 enemies (mean 28.6), up to 9 friendly projectiles and 11 hostile projectiles. All four players held fire. It replenished reserve ammo and used invulnerability to sustain the workload. A boss was present; unit checks separately exercised all three bosses' five patterns.

Server instrumentation across startup/lobby/combat recorded 2844 fixed steps, mean 0.127ms and maximum 2.179ms. The simulation target is 33.33ms per step; snapshots target 15Hz. Dropped simulation backlog in the final browser run was 0.000s. The isolated engine stress also ran 180 simulated seconds with 30 enemies and bounded projectile arrays; added combat behavior costs more CPU than the old engine, rather than making the simulation itself faster.

The leader's sampled JS heap ranged 4.71–8.30MiB and ended at 6.34MiB, versus 5.99MiB at the first sample. This short run is not proof that no long-duration leak exists.

## Checks completed

- Four real browser clients: lobby creation/joining, all ready, shared launch/loadouts, keyboard movement, input focus, fresh trigger after slot selection, visible hull/dash HUD, busy combat, personal menu, clean leave and stopped animation loops. No browser runtime exceptions were observed in the final run.
- Forced one player's stream closed while offline, then restored networking. The player rejoined the same match without duplicate party members, within the existing reconnect window.
- Engine checks: all 46 equipment choices, per-item cooldowns, held melee cadence, burst ammo cost, continued reloads across switches, normalized movement, one-shot dash, stale revive rejection, bomber damage rules, independent boss patrols, supply timer, lance piercing, shield capacity and all five attack patterns per boss.
- Real HTTP protocol checks: limits/readiness/leadership, malformed requests, replay rejection, prior-match input rejection, compact entity reconstruction, authoritative damage, monotonic packets, stream replacement/backpressure, heartbeat, bounded catch-up and static file routing.
- Authentication against a simulated provider: verified identity, usernames, owned compatible cosmetics and duplicate account sessions. Concurrent token refresh checks cover both remembered and tab-only sessions. No live passwords, tokens or personal progress were used.
- Shared cosmetic rendering checks covered four elaborate operator/weapon skins, reduced remote effects, low quality, browser fullscreen and a 400px-wide hotbar/hull layout. Existing single-player regression checks cover mission/Endless redeploy equipment resets, Armory access and cosmetic/save isolation.

## Limits

Live Supabase email delivery, ranked reward SQL/service-key delivery and the user's hosting configuration were not tested. Internet jitter, very slow devices and Render's CPU scheduling can still cause corrections or lower frame rates. Co-op keeps a fixed shared arena and supports keyboard/mouse; it does not include every campaign objective, shop or single-player world feature.

An intermediate run encountered Chrome ERR_NETWORK_IO_SUSPENDED and expired sessions; the final isolated run passed the forced outage check. An OS or network suspension lasting longer than the 20-second reconnect window still requires joining a new lobby. Optional effects may be skipped under stream congestion while authoritative combat state catches up.

For raw samples see the included coop-v5-browser-results.json and coop-v5-baseline-results.json. Reproduce the current fixture with `node work/verify-coop-v5.cjs` after providing Playwright/Chrome on the local test machine. The test script uses this workspace's bundled Playwright path and needs adaptation on other systems; the game server itself has no npm dependencies.
