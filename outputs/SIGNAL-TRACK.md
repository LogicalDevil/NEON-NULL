# SIGNAL TRACK — ECHOES OF THE RELAY

Free permanent 50-tier cosmetic progression. Tier costs are `200 + 20 × (tier − 1)`; total completion requires 34,500 Track XP. This feature adds no paid track or combat-stat bonuses.

## Reward manifest

| Tier | Total XP | Reward | Category | Rarity |
|---|---:|---|---|---|
| 1 | 200 | Relay Initiate | badge | Common |
| 2 | 420 | Supply Stipend | scrap | Common |
| 3 | 660 | The First Voice | lore | Common |
| 4 | 920 | Signal Runner | title | Rare |
| 5 | 1200 | Ghostline Pulse | weapon | Common |
| 6 | 1500 | Relay Grid | banner | Rare |
| 7 | 1820 | Field Allowance | scrap | Common |
| 8 | 2160 | Yard Technician | badge | Common |
| 9 | 2520 | Missing Manifest | lore | Common |
| 10 | 2900 | Relay Brass | operator | Common |
| 11 | 3300 | Recovery Reserve | scrap | Common |
| 12 | 3720 | Night Frequency | title | Rare |
| 13 | 4160 | Weapon Finish Choice | voucher | Rare |
| 14 | 4620 | Custodian Order | lore | Common |
| 15 | 5100 | Archive Seeker Profile | bundle | Epic |
| 16 | 5600 | Circuit Stipend | scrap | Common |
| 17 | 6120 | Circuit Breaker | badge | Common |
| 18 | 6660 | Circuit Wanderer | title | Rare |
| 19 | 7220 | The Power Address | lore | Common |
| 20 | 7800 | Copper Vein Arc | weapon | Uncommon |
| 21 | 8400 | Exploration Reserve | scrap | Common |
| 22 | 9020 | Reactor Brass | banner | Rare |
| 23 | 9660 | Operator Cosmetic Choice | voucher | Rare |
| 24 | 10320 | Echo Array | lore | Common |
| 25 | 11000 | Parallax Agent | operator | Legendary |
| 26 | 11700 | Deep Sector Allowance | scrap | Common |
| 27 | 12420 | Relay Defender | badge | Common |
| 28 | 13160 | The Silent Watch | title | Rare |
| 29 | 13920 | Watch Without End | lore | Common |
| 30 | 14700 | Relay Sweep | animation | Legendary |
| 31 | 15500 | Surveyor Stipend | scrap | Common |
| 32 | 16320 | Core Cartographer | title | Rare |
| 33 | 17160 | Weapon Finish Choice II | voucher | Rare |
| 34 | 18020 | Ghost Protocol | lore | Common |
| 35 | 18900 | Chronoglass Disc | weapon | Divine |
| 36 | 19800 | Warden Reserve | scrap | Common |
| 37 | 20720 | Warden Breaker | badge | Common |
| 38 | 21660 | Void Signal | banner | Rare |
| 39 | 22620 | Extraction Log | lore | Common |
| 40 | 23600 | Null Crown | operator | Divine |
| 41 | 24600 | Final Approach Allowance | scrap | Common |
| 42 | 25620 | Archive Orbit | animation | Rare |
| 43 | 26660 | Last Transmission | title | Rare |
| 44 | 27720 | Operator Cosmetic Choice II | voucher | Rare |
| 45 | 28800 | Afterimage Distinction | bundle | Legendary |
| 46 | 29900 | Extraction Stipend | scrap | Common |
| 47 | 31020 | Origin Transmission | lore | Common |
| 48 | 32160 | Firstlight Array | banner | Rare |
| 49 | 33320 | Extraction Beacon | animation | Rare |
| 50 | 34500 | Echoes of the Relay — Completion Set | bundle | Divine |

## Earning and persistence

Mission, Sector Run and Endless completion awards are bounded to 800 Track XP per run. Successful runs require at least 30 active seconds and meaningful kills, objectives or boss completion. Defeated partial runs require at least 60 active seconds and five kills. Menu time alone earns nothing. Creative, Practice and legacy tests earn no Track XP.

Co-op awards are accepted only from a server-supplied result with a stable run ID and finite per-player Track XP. A room is eligible only when development guests are disabled and every member has a confirmed authenticated account identity. Each player needs at least 60 seconds of connected presence, 15 seconds of active input and meaningful damage, revival, interaction or support contribution. Awards are capped at 800 per player. The client uses its own `trackXPByPlayer` value, never the maximum shown in the shared result. Development guests and idle or ineligible players receive zero.

Server-reported cosmetic Track XP is independent of the optional private cash-reward ledger. No service-role key is needed in the browser. The current profile remains an unverified client save that can be backed up through existing cloud saving; server-side XP calculation does not establish tamper-proof online cosmetic ownership or verify later client/cloud JSON edits.

The reward data is nested at `progression.signalTrack` inside the existing profile schema. The main loader must preserve that object; module initialization normalizes it. Local reward receipts are capped at 256, active-run event deduplication is bounded, and Track XP caps at 34,500. Existing local/cloud profile isolation remains owned by NeonSave.

Claim All invokes the same claim operation as individual tiers. A persisted journal records reward ID and scrap balance before/after a currency grant, allowing recovery after a process stops between the two existing storage-key writes. Reward claiming is synchronous; the bridge must update scrap in memory and then call the existing profile saver. Blocked browser storage is still a limitation and is surfaced by the existing save adapter.

Duplicate weapon skins compensate 75 scrap; duplicate operator cosmetics compensate 100. The selected reward shows compensation before claiming. Vouchers redeem an unowned item from the actual catalog; if every eligible item is owned, the voucher converts to the same fixed compensation. A voucher is consumed once.

## Usable profile rewards

Titles, badges and banners appear in the main-menu pilot card and can be equipped in the Track Profile section. Recovered lore can be read there. Three aura rewards expose shared `drawAura(ctx,pose)` artwork; the game integration renders the equipped aura around the local single-player operator. Aura previews are available before unlocking, and reduced motion freezes their projection. No cosmetic ownership or gameplay stats are changed merely by viewing a preview.

## Mastery and contracts

Twelve one-time challenges cover kills by family, stagger/interrupts, weak points, objectives, actual hull repair, revives, bosses, clean victory and waves. Counters bank only on eligible completed runs, and a selected contract exposes a compact `contractProgress()` summary. The root engine must emit the corresponding action records or server summary counters. Challenges give Track XP; cosmetic rewards follow the deterministic track.

## Integration API

`NeonTrack.init({getProgress,getScrap,addScrap,save,catalogs,preview,notify,root})` initializes the UI and model. `catalogs()` returns `{operators: cosmeticCatalog, weapons: weaponSkins}`. Optional `ownOperator` and `ownSkin` callbacks can handle inventory insertions; direct existing inventory arrays are the fallback. `addScrap` must adjust memory without saving itself.

`resetRun(id,mode)` is idempotent for an existing run ID. `record(type,payload)` supports kill `{slot,boss,eventId}`, stagger, interrupt, weak-hit, objective, heal `{amount}`, revive, wave and damage. Finish with `finishRun({runId,mode,activeSeconds,kills,bosses,objectives,waves,victory,damageTaken,...familyCounts})`. Co-op additionally requires `serverVerified:true` and `trackXP` from the actual server result.

`open`, `close`, `refresh`, `state`, `appearance`, `drawAura` and `contractProgress` support root integration. Pure `createModel`, `cleanState`, `tier`, `thresholds`, `manifest` and `challenges` are exported for regression testing.

## Checks

`node work/test-signal-track.cjs` checks all tier boundaries, the 50-entry manifest, claim-all parity, duplicate compensation, vouchers, interrupted-grant recovery, repeated results, excluded modes, bounded XP, challenge claims and malformed profiles.

`node work/verify-signal-track.cjs` exercises all 50 UI tiers, locked previews, claim-all replay, profile/aura equipment, voucher redemption, reload persistence, results entry, narrow layout, focus trapping and Escape using offline Chrome fixtures. `node work/verify-track-integration.cjs` tests actual game bridges: malformed-profile hydration, Mission/Endless XP once, bank/run-scrap separation, additive Mission payouts, tier grants into the real bank, persisted reload and excluded testing modes. These are automated local checks; production authentication, account switching and cloud-save round trips were not verified by these tests. Browser paths are machine-local and need adjustment elsewhere.
