# NEON//NULL 5.0 · 31 October 2026

Online co-op now shares the current operator and weapon skin renderer, equipment sounds, ammo profiles and four-slot interface. Remote players, enemies and projectiles interpolate between snapshots; local movement predicts a bounded lead and corrects against authoritative positions. A cached arena background, bounded effects and throttled HUD avoid repeated work during combat.

All 46 loadout choices remain available. Equipment keeps independent cooldowns, ranged reloads continue across switches, and held LMB cannot activate a newly selected item. Burst ammo costs, spread, recoil, homing, piercing, chaining, ricochets, returning blades, EMP, melee specialties and tactical utilities have distinct server behavior. Healing pickups restore one hull. Medkit retains its 30-second cooldown. Horn buffs nearby allies; shields, decoys, pointer-targeted teleport/blasts, overclock, repair and slow have their own roles.

Co-op enemies now include shield carriers, weavers, supports and mine layers. Bosses patrol independently, have arrivals and themed warned attacks, summon reinforcements and can roll useful supplies every 10 seconds. Blast, charge, lane, volley and shockwave cues reflect server damage areas. Bomber blasts damage players and leave bombers alive.

Server simulation stays at 30 Hz with bounded catch-up; snapshots stay at 15 Hz. Idle lobbies/results stop sending duplicate full state. Event IDs, packet sequence numbers, compact projectile packets, bounded stream backpressure and heartbeat/reconnect handling reduce redundant traffic and stale state. Account refresh requests now share one operation rather than rotating the same token concurrently.

This release uses multiplayer protocol 5.0. Update the game and server together; older clients are asked to refresh. Co-op remains a fixed shared arena with 2–4 players, Endless waves, revives and capped ranked rewards. Mission objectives, shops and single-player run progression remain in their existing modes. The two simulations are not identical.

## Redeploy

1. Extract neon-null-v5.0-bundle.zip and upload its contents into the repository root, replacing index.html plus the multiplayer, outputs and work folders. Keep the folder structure. Do not upload private environment files or reward outbox data.
2. Commit to the branch Render deploys. Render now prefers root index.html and falls back to outputs/neon-null.html, so GitHub Pages and Render can use the same current file.
3. Use Node 22+, build command `true`, start command `node multiplayer/server.cjs`, health check `/health` and one instance. Retain the existing Supabase environment variables with DEV_GUESTS=false.
4. If automatic deploy is off, choose Manual Deploy → Deploy latest commit. Wait for Live, refresh the Render URL and confirm the tab says v5.0 and /health reports version 5.0.
5. Invite friends using the Render URL. Each creates/confirms an account, chooses a username and joins a shared lobby code. The current HTML includes the public project configuration. No new SQL is required for this update; optional ranked rewards still need the previous reward SQL and private server setup.

See PERFORMANCE-5.0.md for measurements and verification limits. Local tests do not measure Render's CPU allocation or Internet latency.
