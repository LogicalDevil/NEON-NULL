# NEON//NULL v6.8 measured validation

7 November 2026

The updated build passed the local solo lifecycle and four-client co-op checks below. The new presentation costs more rendering time in the fixed-resolution co-op sample. These measurements do not establish a performance improvement.

The test host reported Intel64 Family 6 Model 186 Stepping 3. Tests used Windows, Chrome 156.0.8078.80 in headless mode, and a 1440×1000 viewport. GPU model and power conditions were not recorded. The co-op fixture launched four independent Chrome processes and one Node server on the same machine. Tests ran sequentially. Encounters are unseeded, so exact target positions and hits differ between samples.

**Solo sample**

The same 20-second fixture maintained up to 30 varied enemies, held the starter primary, replenished reserve ammo, and made the player invulnerable. It also checked 12 restarts, narrow/desktop resizing without changing world size, a simulated two-minute frame gap, and stopping the animation loop on return to menu. Both versions passed those checks and entity limits without captured runtime errors.

| Build | Active enemies sampled | Frame time p95 | Render time p95 |
| --- | --- | --- | --- |
| v6.7 | 26–30 | 17.4 ms | 4.2 ms |
| v6.8 | 26–30 | 24.9 ms | 5.7 ms |

The solo v6.8 sample used the version before the final short beam-cleanup, showroom-layout, compact Sector-checkpoint, and cosmetic-trial state edits. Those later edits received functional checks rather than another performance run.

**Fixed-resolution co-op pair**

The archived v6.7 HTML ran against server files extracted from its v6.7 release bundle. The v6.8 client ran against the updated server. Each room had a Spectrum Prism Lance, Blackpowder Deck Blunderbuss, Frontier Coach Gun, and Brassworks Gearcaster. The fixture held all four primary triggers, kept the players invulnerable, replenished reserve ammo, spawned a boss, and maintained approximately 28–30 enemies.

The controlled window requested ten seconds. The sampled windows lasted 10.9 seconds for v6.7 and 11.4 seconds for v6.8. Both fixtures forced the Standard graphics quality result to keep the arena backing at 1280×720. This fixture override prevents the adaptive system from changing render resolution between builds. Adaptive optional effects remained active. Server metrics were reset immediately before the controlled profile. Browser diagnostic frame/render windows also contain startup into combat and therefore are not an isolated ten-second trace.

| Measurement | v6.7 range across four clients | v6.8 range across four clients |
| --- | --- | --- |
| Frame time median | 16.7 ms | 16.7 ms |
| Frame time p95 | 30.4–32.7 ms | 33.4 ms |
| Render time median | 2.3–2.5 ms | 2.2–2.4 ms |
| Render time p95 | 9.7–11.7 ms | 13.2–14.2 ms |
| Sampled enemies | 28–30 | 28–30 |
| Player projectiles sampled | 0–14 | 0–10 |
| Received stream traffic | 119.2–122.4 KiB/s | 71.6–73.7 KiB/s |
| Input requests per second | 10.2–10.9 | 3.9–4.7 |

The v6.8 run received fewer snapshots and sent fewer input requests. Its server counters reported about 3.0 seconds of dropped simulation catch-up, versus about 1.0 second for v6.7. The lower traffic figure must be interpreted with that lower update cadence. It is not evidence of a network optimization. Server backpressure-drop counters were zero in both runs. The shared-host setup cannot isolate browser scheduling, server work, and operating-system contention sufficiently to assign one cause to the tails.

Both co-op versions passed lobby/loadout/start, authoritative keyboard movement, text-focus isolation, four-slot switching, a forced offline/reconnect cycle, personal-menu controls, and clean leave. The fixed-resolution v6.8 recorded build SHA-256 was `8a96809801efda6955831a86b96cb3d33d41497d7b00779f6316cbdb2e1a9a6f`. The distributed file also includes the final showroom layout and compact Sector-checkpoint fix, verified through functional checks.

An initial 20-second adaptive-resolution co-op pair is also retained. The baseline lowered two canvases to 960 pixels wide while the v6.8 run retained 1280, so its render-time comparison is not like-for-like. That initial pair measured v6.7 frame p95 50.0–52.6 ms and render p95 4.2–6.9 ms, versus v6.8 frame p95 35.8–49.9 ms and render p95 17.6–19.8 ms. All clients in both adaptive runs passed reconnect and clean-leave checks.

**Confirmed input regression**

A two-client check dispatched pointerdown at a new location without a preceding pointermove, representing first-touch or a click following a canvas layout change. The archived v6.7 used stale aim coordinates, producing 318.79 world pixels of error. The v6.8 check measured zero error. Synthetic events have no platform pointer, so the fixture stubs pointer capture while retaining the game’s actual pointerdown handler and its server session.

**Raw records and reproduction**

- `work/redesign-sp-v67-baseline.json` and `work/redesign-sp-v68-final.json` contain the solo samples.
- `work/redesign-coop-v67-fixed.json` and `work/redesign-coop-v68-fixed.json` contain the fixed-resolution pair, including per-client measurements, load, server counters, build hashes, and regression stages.
- `work/redesign-coop-v67-baseline.json` and `work/redesign-coop-v68-final.json` retain the adaptive-resolution pair.
- `work/verify-redesign-sp-performance.cjs` accepts `SP_HTML_PATH`, `SP_PROFILE_SECONDS`, and `SP_RESULT_PATH`.
- `work/verify-redesign-coop-performance.cjs` accepts `COOP_BASELINE_HTML`, `COOP_PROFILE_SECONDS`, `COOP_RESULT_PATH`, optional `COOP_SERVER_PATH`, `COOP_FORCE_QUALITY=standard`, and `COOP_PROFILE_ONLY_METRICS=true`.
- `work/verify-redesign-input.cjs` accepts `INPUT_HTML_PATH`. `EXPECT_STALE=true` verifies the known archived defect. Omit it to verify fixed aim.

No live Supabase account, private user save, or ranked reward was used. These are short local checks. Render hosting, real internet latency, longer sessions, controller/touch hardware, and lower-end GPUs remain unmeasured. More expensive tails remain visible in the recorded co-op results and should guide further performance work.
