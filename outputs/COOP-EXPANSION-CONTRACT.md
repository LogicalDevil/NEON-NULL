# Co-op expansion integration contract

## Track XP and trust

The server calculates cosmetic Track XP independently from the optional private cash/scrap reward ledger. At match creation, `trackEligible` is true only when development guests are disabled and every room member has an authenticated account identity obtained from the confirmed-account authentication branch. The optional private service-role configuration controls cash delivery, not cosmetic Track eligibility.

Each player still needs at least 60 seconds of connected presence, at least 15 seconds of active input, and damage, revival, interaction, or support contribution. Per-player Track XP is capped at 800 per run. Development guests, idle players, short-presence players and players without meaningful contribution receive zero.

Results contain a stable `id`, `trackXPByPlayer`, `trackXP` (the maximum per-player value, not a shared grant), and `trackSource`. Clients must use their own `trackXPByPlayer[ticket]`, not the maximum. `trackSource: server-reported` describes where the calculation occurred; it is not a claim that the later browser/cloud-JSON profile is tamper-proof. This update introduces no private server key in the client and does not alter the existing cash ledger SQL.

## Frontend fields

- Create lobby: `mode: endless | sector`.
- Ready: `role: vanguard | engineer | scout | medic`, plus `mods: [primaryId|null, secondaryId|null, meleeId|null, utilityId|null]`. IDs are validated against the selected gear on the server.
- Input: rising-edge `skill` and `interact`; `ping: {type,x,y}` where type is danger, supply, objective, move or help. Existing input sequence validation remains active.
- Snapshot: pings, repair fields, support links, sector stage/title/objects; player role/skill cooldown; enemy faction, stagger, staggerMax, exposed and marked fields. Packed enemy tuples append those five enemy fields after name.

The co-op sector has six combat stages, two route choices, a shootable depot, two boss antennas and a team extraction gate. Objects are deliberately non-solid, so they introduce no invisible movement walls or client/server collision mismatch. Rooms remain in memory; server restart ends active co-op runs.

## Validation

`multiplayer/expansion-test.cjs` covers all four route combinations, objective/boss/extraction gating, repeated grants, eight compatible kits, all four skills, ping caps, stagger immunity, invalid input, and Track eligibility. `work/verify-coop-expansion.cjs` adds a four-client real-HTTP route test with accelerated encounter state and real user actions. Browser execution requires localhost permission in the executing environment.

## Personal mastery summaries

Results include masteryByPlayer keyed by participant ID. Only eligible participants receive nonzero counters. Kills use the item category recorded when a projectile was created, even after switching. Boss credit belongs to the final blow; objective credit belongs to the activating player or component destroyer. Healing counts actual restored hull credited to its source, and revive credit goes only to fresh, nearby helpers. Waves count completed waves while connected and alive. Clients forward their own summary into the Track result, including fractional damage taken, rather than shared team totals. These summaries are stable after match completion.
