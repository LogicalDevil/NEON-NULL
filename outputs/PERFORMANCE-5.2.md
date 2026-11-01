# NEON//NULL 5.2 — verification and measurements

Tested 1 November 2026 on the local Windows machine using Node 24 and four independent headless Chrome processes. Each browser used a 1440 × 1000 viewport with a 1280 × 720 game rendering surface. Clients connected to a real temporary localhost HTTP server as unranked development guests. No live Supabase credentials, user progress or production rewards were used.

## Four-client measurements

The combat fixture replenished enemies toward 28, kept players invulnerable, refilled reserves and held all four firing inputs. The measured enemy count, projectiles and actual durations are in the raw JSON. The second run delayed each input POST by a varying 80, 100 or 120 ms; it does not emulate every kind of Internet packet loss or delay the outgoing snapshot stream.

Per-client ranges across the four browsers:

At one-second sampling, the normal run had 30 enemies and 0–10 friendly projectiles; the delayed run had 23–30 enemies and 1–13 friendly projectiles. Both sampled zero hostile projectiles; attack zones are a separate system. These browser profiles did not exercise the maximum hostile-projectile rendering load.

| Run | Profile duration | Median frame interval, ms | 95th-percentile frame interval, ms | 95th-percentile draw time, ms | Stream KiB/s per client |
| --- | --- | --- | --- | --- | --- |
| Normal local traffic | 15.12 s | 16.70–16.70 | 16.80–16.80 | 1.90–2.10 | 112.52–112.52 |
| 80–120 ms input delay | 20.14 s | 16.70–16.70 | 16.80–16.80 | 1.30–1.50 | 115.64–115.64 |

The delayed movement fixture's largest observed backward frame step was **0.000734 world units**. It samples forward movement followed by stopping; it is not a universal movement-error bound. Local slot feedback was asserted before awaiting the authoritative slot update. Both runs passed keyboard/focus handling, held-click slot release, short connection loss/reconnect, personal menu behavior, room membership preservation and clean leave with no browser runtime errors.

Server metrics include setup and regression phases as well as the combat profile:

| Run | Mean simulation step, ms | Largest step, ms | Simulation time skipped by catch-up bound | Last streamed message, bytes | Backpressure replacements |
| --- | --- | --- | --- | --- | --- |
| Normal | 0.184 | 18.91 | 0.000 s | 7037 | 0 |
| Delayed | 0.161 | 13.39 | 0.100 s | 8270 | 0 |

Skipped simulation time and large scheduling spikes are reported rather than hidden. Catch-up work and movement queues remain bounded. These results do not guarantee a 16.7 ms frame budget on other hardware, a loaded host or Render's shared CPU. Network figures describe the streamed data for this fixture, not all protocol overhead.

## Other completed checks

- Actual single-player attack function and server collision boundaries for all ten melee items: threefold reach, just-inside hits, just-outside misses, angular exclusion and matching effect reach.
- Separate 450-scrap cosmetic case: all six rarity totals equal weapon-case totals and sum to 100%; 69 eligible cosmetics; free default excluded; separate ownership; purchase lock; duplicate refund cap; equip; reload persistence; insufficient balance; independent case-button states. Existing weapon case remains 300 scrap.
- Existing seven-second reveal, published result odds, skip and instant reveal checks passed.
- 108 pixel comparisons between the original single-player enemy renderer and the shared renderer, covering types, three boss themes, health stages and standard/high quality. Multiplayer caches animation phases; this comparison verifies the shared drawing function, not every cached animation frame.
- Four-client elaborate operator/weapon models, reduced remote effects, 960 × 540 Low quality, fullscreen entry/exit and narrow 400-pixel window layout.
- Mission and Endless Armory purchases, upgrades, restart/deployment resets, saved cosmetic hydration and Creative Lab isolation.
- Processed and partial movement acknowledgements, duplicate commands, simulated 200 ms delivery delay, bounded jitter catch-up, stale commands, stationary firing without body drift and down-state cleanup.
- Actual client movement-command recorder at 10, 15, 30, 60, 120 and 144 FPS; in-flight command immutability and bounded suspension catch-up.
- Engine, four-client real HTTP, mock-provider authentication, protocol/backpressure, account-refresh and cosmetic-manifest regressions. The combat rule stress fixture simulated three minutes; the browser profiles above are short sessions, not a long-duration soak test.

## Practical limits and reproduction

Production Render latency, live account confirmation, live cloud-save delivery, ranked rewards and cross-device Internet play were not tested in this update. Keep one server instance and deploy client/server protocol 5.2 together. A hosting restart ends active rooms.

Raw measurements: `coop-v5.2-normal-results.json` and `coop-v5.2-latency-results.json`. The browser test is `work/verify-coop-v5.cjs`; set `COOP_LATENCY=true`, `COOP_PROFILE_SECONDS` and `COOP_RESULT_PATH` to reproduce a delayed profile. Browser checks currently reference this machine's Chrome and Playwright installation paths; adjust those paths on another development machine. Gameplay has no Playwright dependency.

Verified HTML SHA-256: `359030af5657f25e0a790efd0d18372f30328a2b4b322c65fbc5b41008c4e222`.
