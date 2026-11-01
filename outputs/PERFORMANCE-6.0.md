# NEON//NULL 6.0 — verification and performance

Checked locally on 1 November 2026 using Chrome headless and Node 24. No live Supabase account or production Render service was modified.

## Measured browser runs

| Fixture | Duration | Sampled enemies | Frame interval p95 | JavaScript draw p95 |
|---|---:|---:|---:|---:|
| Previous v5.6 renderer, current server, four Chrome processes | 30.8s | 29–30 | 33.2–33.3 ms | 6.2–9.0 ms |
| v6.0, four Chrome processes | 60.1s | 28–30 | 33.4–33.4 ms | 2.1–2.4 ms |
| v6.0, four processes, 80/100/120 ms artificial input-request delays | 30.1s | 28–30 | 27.8–31.9 ms | 2.6–2.7 ms |
| v6.0 single-player, one process | 30s | 26–30 | 32.4 ms | 4.0 ms |

All four co-op players held fire. Fixtures refill reserve ammunition, prevent death, and replenish enemies; their sampled counts are reported rather than claiming a constant 30. Rendering includes the real game code at a 1280×720 backing resolution for Standard quality. Random encounter composition and unequal durations mean these are reproducible fixtures, not a controlled proof of a particular speedup. The earlier renderer used the same current backend, so that row does not compare old/new server simulation.

The new renderer's draw work was lower in this sample; frame cadence still varied. This report does not promise a fixed frame rate. Four browser processes share this computer, and neither these runs nor artificial request delays represent actual Internet jitter or Render's free-tier CPU/sleep behavior.

Normal co-op stream traffic was about 139.2 KiB/s per client, with approximately 14.8 streamed updates/s. The delayed run's largest recorded backward movement correction was 0.0017 world pixels. Both runs passed camera bounds, pointer/world aiming, focus isolation, hotbar switching, personal-menu release, brief outage/reconnect and clean leave. Client input errors during the measured combat phases were zero.

Server timing included an occasional scheduling/collection spike: the maximum observed step was 12.3 ms in the normal run and 230.4 ms in the delayed run. Catch-up work remains bounded; the latter run dropped 0.87s of accumulated simulation over the entire setup/test lifecycle. These numbers are retained in the raw reports rather than hidden. Further production profiling is appropriate before making latency guarantees.

## Completed checks

- Server engine and real HTTP: four-client lobby/readiness/leadership, fixed steps, backpressure, sequence validation, damage authority, reconnection, results and cleanup.
- Authentication against a mock provider: invalid token rejection, server-derived identity, duplicate-session replacement and cosmetic ownership; token refresh sharing and remembered/tab session storage.
- Movement command replay at 10/15/30/60/120/144 FPS and 200 ms simulated delivery delay, partial acknowledgements and suspension bounds.
- All 46 equipment actions, per-item ammunition/reload, ten melee arcs/ranges, hit-versus-miss effects, cosmetic protocol, and a 180-second simulated crowded encounter.
- All four co-op Sector route combinations in the engine; one accelerated full route through four actual browser clients, including role skills, pings, real aimed depot/antenna/boss shots, extraction and reconnect.
- Both complete seven-node single-player routes, checkpoints/reload, exact last-event mastery persistence, boss preparation and antennas, failure, duplicate reward suppression and menu recovery. Visible door collision includes a high-speed crossing regression.
- Fifty Track tiers and every threshold, actual reward claims, duplicate compensation, vouchers, interrupted-claim recovery, malformed profiles, mode exclusions, real bank balance and additive Mission payouts.
- Seven training steps with keyboard/mouse, failed-upgrade rejection, remapping/import normalization, pause, successful dash gating, modified fire/reload times, reload HUD/switch/restart and adaptive effect reduction.
- HUD and gameplay controls fit without page scrolling at 1440×1000, 1366×768, 1024×768 and 390×844; UI dropdown keyboard/touch/fullscreen bounds and disabled/live options; 140 cosmetic definitions, ten melee models and the shared enemy/boss renderer. Mission/Endless/Creative ownership reset and Armory access.
- Thirty-second actual-engine single-player combat, 12 restarts, resize/world invariance, a simulated long frame gap and animation-loop cleanup. No runtime errors were recorded by these browser fixtures.

## Remaining limits

- Automated acceleration validates transitions and rules; a human 15–25 minute Sector pacing session and a multi-hour endurance session have not been completed.
- Production Supabase sign-in, account switching, conflicting-device cloud merges, verified cash payouts and live Render deployment were not exercised. Existing local/cloud save plumbing stores the new Track/checkpoint fields, but client/cloud JSON remains unverified data. The mock-auth tests are not a live-service test.
- Co-op Track XP and personal mastery are computed by the server, then stored in the existing client/cloud profile. This is not a server-owned cosmetic entitlement ledger. Development guests earn no Track or mastery progress.
- Active co-op rooms remain in memory. Server restart loses an active room. Single-player Sector saves resume from safe encounter boundaries, not an arbitrary mid-fight state.
- Keyboard/mouse and selected touch UI flows were tested. Complete physical-controller navigation of every new modal and every browser/device combination has not been verified.
- Caps and adaptive decoration reduce overload risk; they cannot eliminate every bug or guarantee performance on all hardware.

## Reproduction

Run `node multiplayer/test.cjs`, `node multiplayer/protocol-test.cjs`, `node multiplayer/expansion-test.cjs`, `node work/verify-sector-integrated.cjs`, `node work/verify-runtime-integration.cjs`, `node work/verify-track-integration.cjs` and `node work/verify-coop-expansion.cjs` from the extracted bundle root. Other focused tests are included alongside them. Browser checks use machine-local Chrome/Playwright paths that must be adjusted on another computer.

The performance fixture is `work/verify-coop-v5.cjs` (historical filename, reads the actual build title). Set `COOP_PROFILE_SECONDS`, `COOP_RESULT_PATH`, and optionally `COOP_LATENCY=true`; `COOP_BASELINE_HTML=outputs/neon-null-v5.6.html` selects the older renderer when that prior build is available. Raw JSON contains the build hash and conditions. Single-player profiling uses `work/verify-sp-performance.cjs`.
