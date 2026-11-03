# NEON//NULL v6.3 — Workshop and Pilot Network

3 November 2026

## Workshop

- All36 weapons are supported:16 Primary,10 Secondary,10 Melee. Coverage is100%, exceeding the requested80% target. Each weapon has at least two compatible choices.8 of10 utilities have kits; teleport and ammo cache retain their original specialized behavior.
- Added21 shared kit definitions, preserving all eight original IDs. One kit per item; duplicate weapon kinds in different categories now have independent selections.
- Added a searchable equipment browser, category filters, current build summary, upgraded-base/effective comparisons, costs, run-scrap balance, install/remove/restore controls, locked/insufficient states, and a collapsible bottom index with all46 equipment icons.
- Statistics distinguish projectile damage, projectiles per attack, reload, ammunition, melee reach/arc/falloff, and utility behavior. Solo explosive splash values are labeled separately from direct hits and conditional co-op rules. No misleading guaranteed-DPS number is presented.
- Kits are run-only purchases. Creative testing is free; being a developer does not make Mission purchases free. Existing Developer Studio cosmetic previews remain isolated.
- Sector checkpoints preserve per-item selection keys. Legacy kind-key checkpoints remain supported.
- Switching a kit does not refill ammo, cancel an existing reload, or reset cooldowns. Updated stats apply to subsequent actions.
- Fixed ranged damage rounding at projectile creation and collision so fractional tradeoffs such as1.0→0.9 actually apply. Server/client definitions are shared; compatible armor handling and recoil defaults are aligned.

## Friends and private chat

- Added Social from the main menu and multiplayer lobby: authenticated username search, incoming/sent requests, acceptance, cancellation, removal, blocking/unblocking, privacy settings, reports, and archived conversations.
- Friendship identity uses account UUIDs and survives username changes. Search exposes public usernames and social IDs, not emails or private saves.
- Added private text chat with latest50/older pagination, stable IDs, server timestamps, unread/read positions, memory-only drafts, failed-message retry, and nonce-based duplicate protection.
- Only accepted, unblocked friends can send. Removing a friend makes previous history read-only. Blocking denies history/new contact and clears cached conversation data when checked.
- Social polls at5-second intervals only while open. No combat-frame polling or permanent message subscriptions are added. Message notifications are throttled and respect game sound settings.
- Added host-validated lobby invitations and opt-in Join Friend. The running server verifies authentication, current friendship, blocks, live lobby ownership/membership, invitation/version/expiry, capacity, and match state before joining. Database room codes alone do not bypass room validation.
- Opening Social pauses solo play. In co-op it neutralizes local input while the shared match continues. Typing does not fire, move, reload, dash, or switch slots.

## Required setup

Friends and chat require **outputs/supabase-social.sql** to be run once in your existing Supabase project. Copy the file's entire contents into a new SQL Editor query; do not enter only its filename. See SOCIAL-SETUP.md.

Replace repository-root index.html and the full multiplayer folder together, commit, and let Render redeploy. No new secret key or environment variable is required. Keep the existing account configuration, single server instance, and DEV_GUESTS=false for production.

The Workshop works locally. Cloud friends/chat need reachable configured Supabase and the migration; friend lobby joins should use the Render game/server URL.

## Verification

Passed actual PostgreSQL(PGlite) execution of the migration twice, authenticated friendship/message/privacy/rate/pagination checks, and real HTTP lobby checks backed by that database. These use a local identity-provider fixture, not live Supabase.

Passed all21 real-game kit action probes, paid/free Workshop UI and checkpoint checks,46-entry index and responsive layout, Social UI/full-game input isolation and retry flows, both full Sector routes, existing account/cosmetic/combat/protocol checks, and four-player co-op routes/reconnect with Social input isolation.

See VALIDATION-6.3.md for measurements, commands, and limits. Production Render/Supabase configuration and multi-process database concurrency were not tested here. This release does not claim zero lag or absence of all bugs.
