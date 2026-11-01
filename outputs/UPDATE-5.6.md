# NEON//NULL 5.6 — 1 November 2026

Confirmed melee hits now produce short local anime-inspired impact frames, radial hit sparks, directional wind strokes and fading ground dust. All ten melee types participate. The ink/white contact accent targets roughly 45 milliseconds (subject to the displayed frame rate) and is rate-limited to one per 120 milliseconds. It is local to the contact point, not a full-screen flash. Screen-flash controls disable that accent; reduced motion removes wind, moving dust and impact-frame flashes, preserving quiet hit marks. Gameplay is never frozen or slowed for these cosmetic frames.

Craters now have layered depressions, a light-facing broken rim, deterministic radial cracks and scattered stone fragments. Fresh impacts release a brief ground-hugging dust plume. Hammer and greatsword hits create appropriately sized scars; existing explosive crater triggers remain. Craters are decorative, do not create walls or affect collision, and fade automatically. Off-screen craters are culled.

The shared drawing module supports both current single-player and co-op. Multiplayer uses a server-confirmed melee-hit event rather than assuming every swing connected. Existing melee damage, range, falloff, cooldowns, rewards and physics are unchanged. Impact markers are capped at 24; existing crater caps remain 32 in single-player and 24 online. Restart, arena clearing and menu exit clear the transient effects.

Checks: all ten server melee items emit hit events on contact and none on misses; existing collision boundaries pass. Shared effects checked for bounded arrays, expiry/reset, finite drawing coordinates, balanced transforms and all quality/reduced-motion combinations. Single-player purchase/save and melee regressions passed. Four-client co-op and actual Canvas model/reload checks passed. No production Render or long-duration performance test is claimed.

Deploy by extracting the v5.6 bundle into the repository, committing and redeploying Render. No new Supabase SQL is needed. Update the server files too so co-op emits confirmed contact events. Protocol remains 5.2; historical legacy builds retain their old visuals.
