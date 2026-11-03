# v6.3 validation — 3 November 2026

## Functional checks

- Workshop shared coverage:36/36 weapons,8/10 utilities,21 kit definitions; at least two choices per weapon. All46 indexed items have icons.
- Actual game action probes verify21 kits, paid Mission/free Creative installation, independent same-kind primary/secondary kits, fractional projectile and hit damage, preserved ammo/reload/cooldown state, checkpoint keys, and responsive browser-row containment.
- PostgreSQL(PGlite0.5.14) executes the actual social migration twice. Tests authenticate distinct users and verify search20-result pagination, pending/crossed/accepted requests, duplicate suppression, participant-only chat, message nonce/body checks, unread/read markers, history pagination, archived unfriend history, blocking, privacy, rename identity, invitation rules, rate gates, and denied direct table/helper access.
- Real HTTP game-server tests use six authenticated local fixture accounts with the actual database RPC. They validate server-generated room codes/version, recipient acceptance, live stream/leader checks, sharing opt-in, capacity/current-room/countdown, expiry, forged records, unfriend/block, offline hosts, and leader changes.
- Social UI tests cover debounce, list/history paging, failed-send retry after an accepted-but-lost response, plain text instead of executable HTML, memory-only drafts, privacy/report controls, peer-block cleanup even on old history pages, logout, timers, focus and mobile layout.
- Full-game Social UI verifies solo pause/resume and typing isolation. Four actual co-op clients verify shared combat continues while Social neutralizes local controls, plus roles, modifications, reconnect, objectives, boss and extraction.
- Existing account, cosmetic, protocol, runtime/tutorial, responsive-interface, both Sector routes, rewards and checkpoint tests passed.

## Measurement scope

Raw captures accompany this release: workshop-v6.3-results.json, singleplayer-v6.3-results.json, coop-v6.3-results.json and the initial co-op capture. Preview/menu measurements use local headless Chrome; server measurements use local HTTP, not Render or Internet latency. Different runs have randomized encounter mixes and scheduling contention, so they are not controlled before/after speed comparisons.

The first four-process co-op capture recorded substantial scheduling stalls (maximum server callback about489ms and9.13s discarded catch-up over its full lifecycle). It remains included rather than being hidden. The repeated capture resets server counters at controlled-combat start to separate browser-launch work; consult its actual values below. No zero-lag or universal frame-rate claim is made.

## Reproduce

Run the ordinary JavaScript unit/browser scripts from the project root using Node. Browser scripts contain this machine's Chrome and Playwright paths; adjust them elsewhere.

To run the database tests, install a temporary test-only dependency with `npm install --prefix work/sql-test-runtime @electric-sql/pglite@0.5.14`, then run:

- `node work/test-social-database.cjs`
- `node work/test-social-lobbies.cjs`

The scripts also support the local extracted package path used during development. The large PostgreSQL/WASM test runtime is intentionally excluded from the downloadable game bundle and is never needed by the deployed game server.

Other focused commands:

- `node work/test-workshop-expanded.cjs`
- `node work/verify-workshop-integrated.cjs`
- `node work/verify-social-panel.cjs`
- `node work/verify-social-integrated.cjs`
- `node work/verify-coop-expansion.cjs`

## Limits

No live Supabase accounts or production Render deployment were configured or tested. PGlite executes real PostgreSQL but uses a single connection; this does not prove multi-process concurrent transaction behavior. SQL locking and authorization checks are present, with sequential conflicting-action tests. Multi-hour endurance, very large player populations, every controller/device, and production moderation operations remain unverified.

Social refreshes every5seconds only while open. General substring search is rate-limited and returns bounded pages but may scan profile rows; the setup guide describes indexing considerations at larger scale. No cosmetic avatars are extracted from private save documents and no claimed online-presence feed is fabricated.

## Recorded measurements

- Workshop open/render/layout: 17.3 ms, 16.7 ms, 22.6 ms, 24.1 ms, 13.9 ms, 16.3 ms, 16.2 ms, 16.0 ms across eight cached-icon openings.
- Solo20-second crowded fixture: frame-interval p95 28.0 ms; render callback p95 4.7 ms; active enemies 25–30. Twelve restart and resize/suspension checks passed.
- Repeated four-client fixture: pilot0 frame p95 33.2 ms / render p95 7.3 ms, pilot1 frame p95 50.0 ms / render p95 18.2 ms, pilot2 frame p95 50.1 ms / render p95 11.8 ms, pilot3 frame p95 50.0 ms / render p95 11.1 ms.
- Repeated controlled-combat server max callback 268.5 ms; discarded bounded catch-up 6.13 s. These remaining stalls and input latency prevent claiming smoothness on all setups. All reconnect/leave/control regressions passed.
- Browser diagnostics use bounded rolling samples; frame intervals include scheduling and rendering, whereas render timings cover callbacks only. Randomized fixtures, hardware load, and headless browser contention limit comparisons.

The final build also corrects Social list pagination invalidation/search relationship labels after friend changes. Combat profiling preceded those UI-only changes; raw co-op reports retain the SHA-256 of their measured build. Final functional Social/Workshop tests were rerun after them.
