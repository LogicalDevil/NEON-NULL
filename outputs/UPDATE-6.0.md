# NEON//NULL 6.0 — Echoes of the Relay

Release · 1 November 2026

This expansion adds a branching Relay Yard expedition, behavior-changing weapon modifications, readable stagger and support mechanics, a permanent free 50-tier reward track, and a shared co-op sector. The existing Mission, Endless, Creative Lab, Practice, accounts, cosmetic inventory and legacy archive remain available.

## Relay Yard Sector Run

- Play seven stages with two route decisions: approach, workshop or elite patrol, signal junction, ammunition sabotage or communications array, relay defense, Signal Warden and extraction.
- Route choices have concrete consequences. Repair restores supplies; the elite route offers scrap and a modification token; ammunition sabotage disables the Warden's marked bombardment; communications restores ammunition and reveals incoming groups.
- Interact with switches, terminals, supply lockers and extraction markers. Cover can absorb shots and break. Movement slides around visible obstacles, and destroyed cover releases its collision.
- Save and leave between encounters. Resume restores the last safe encounter boundary, loadout, ammunition, hull, run scrap and selected modifications. An unfinished encounter restarts from that boundary; this is not a mid-fight save.
- The Warden's destructible antennas reduce its lane coverage. Completion and defeat screens settle rewards once and explain the route and outcome.

## Combat builds and enemy information

The Build Workshop offers eight compatible modifications: extra-target Pulse penetration, a tighter shotgun choke, a stronger but slower rail capacitor, returning daggers, stagger-focused fists, a wider scythe sweep, interruptible Medkit regeneration and a spear counter. They spend run resources, show their tradeoffs and remain separate from cosmetic skins. Effective stats are applied during the action and restored afterward, avoiding permanent base-stat mutations or stacked multipliers.

Suitable enemies show stagger buildup and exposure. Interrupting a marked charger clears its pending charge; stun-immunity windows prevent repeated locks. Shield and repair support relationships are visible and can be disrupted. Three recurring faction identities guide sector compositions and briefings: Relay Security, Archive Constructs and Reactor Remnants. Existing attack warnings remain visible above decoration.

## SIGNAL TRACK — ECHOES OF THE RELAY

The Track is free, permanent and contains 50 defined tiers through 34,500 Track XP. It awards existing usable operator cosmetics and weapon finishes, finite scrap bundles, choice vouchers, titles, badges, banners, readable lore and three equipped aura projections. Players can inspect locked previews, claim one reward or all earned tiers, equip profile rewards and redeem vouchers. Duplicate compensation is disclosed before claiming. See [SIGNAL-TRACK.md](SIGNAL-TRACK.md) for the complete reward manifest and exact rules.

Twelve one-time mastery contracts cover weapon families, stagger, weak points, objective work, repair, revives, bosses, clean victories and waves. Mission, Sector and Endless runs earn bounded Track XP from meaningful play; Creative, Practice and legacy play do not. Repeated result IDs cannot grant the same reward twice. Claims include recovery records for interrupted local currency/profile writes.

Co-op Track XP uses the authenticated server result for the individual player. Eligible rooms require confirmed identities with development guests disabled; participation and contribution checks apply. This cosmetic calculation does not require the optional private cash ledger. Browser/cloud profile contents remain client-controlled and are not a tamper-proof entitlement database.

## Co-op sector and teamwork

- A separate shared sector includes route choices, a shootable depot, boss antennas and team extraction, with server-owned progression and damage.
- Choose Vanguard, Engineer, Scout or Medic support skills; compatible modifications follow the selected loadout. Contextual pings communicate danger, supplies, objectives, movement and help.
- Shared objects deliberately have no solid collision online, preserving movement prediction. All four clients use the server's encounter/objective state and per-player results.
- Active rooms still live in one server process. A server restart ends the room; persistent mid-match online resume is not added.

## Comfort, onboarding and interface

Settings adds saved keyboard remapping, selected-text scaling, optional damage numbers, effects intensity and adaptive decorative quality. Sustained slow frames lower decoration quality; stable frame times allow recovery. Important gameplay warnings are retained. Existing reduced motion, screen-flash, music, effects volume and graphics options continue to apply.

A replayable, skippable seven-step training sequence teaches movement, firing, reload, dash, melee, interaction and an actual upgrade purchase. Invalid or conflicting imported bindings reset safely. Training stops on menu exit, and failed purchases do not complete its upgrade step. Less frequently used modes are grouped in the main menu. The arena measures the surrounding HUD/controls and fits the viewport, keeping Pause, Menu, Armory and Workshop reachable without gameplay page scrolling at the tested desktop, tablet and portrait sizes. Shared dropdowns reposition within scrolling panels and respect keyboard focus.

## Reliability and validation

This update corrects identified reward-balance, training, control and modal issues. Mission deployment starts with run scrap instead of copying the bank; a successful result adds remaining run scrap and its reward once. Track normalization handles missing or malformed fields, reward claims and receipts are bounded, and excluded testing modes do not mint Track XP. UI work happens on interaction rather than rebuilding whole panels every frame. Entity, effects, pickup, ping and audio budgets remain bounded.

Focused automated checks completed for the 50-tier model, reward boundaries, duplicate/voucher claims, interrupted grants, malformed saves, Track UI and the actual game currency/Track bridge. The training integration test completes all seven steps with keyboard/mouse and actual engine actions, including reload completion, pause gating, failed-purchase rejection, menu cancellation and remapped movement. It also verifies temporary modification-stat restoration, actual modified firing/reload times, reload progress and switch/pause/reset handling, zero-intensity particle suppression and adaptive quality reduction under simulated slow-frame samples. Both complete Sector routes, the real four-client co-op sector, client reconnects, manual/automatic reload behavior, all ten melee ranges, all 140 cosmetic definitions, and all 46 item combat actions passed automated local checks. See [PERFORMANCE-6.0.md](PERFORMANCE-6.0.md) for conditions, measured frame times and remaining limits. These checks do not establish that every combination is free of defects.

Validation commands include `node work/test-signal-track.cjs`, `node work/verify-signal-track.cjs`, `node work/verify-track-integration.cjs`, `node work/verify-runtime-integration.cjs`, `node work/test-sector-run.cjs`, `node work/verify-sector-integrated.cjs`, `node multiplayer/expansion-test.cjs` and `node work/verify-coop-expansion.cjs`. Browser scripts currently contain machine-local Chrome/Playwright paths. Accelerated automated encounter tests do not establish human pacing, extended-session reliability or internet latency. Production Supabase authentication/cloud round trips and the live Render deployment were not tested by the Track/training checks.

## Deployment

Extract neon-null-v6.0-bundle.zip. Replace the repository root index.html and the complete multiplayer folder from the bundle, and commit them together. Render should redeploy the same service automatically; otherwise choose Manual Deploy → Deploy latest commit. GitHub Pages uses the new root index.html. The outputs and work folders are included for downloadable builds, documentation and reproducible source; they are not substitutes for the root index.html. Preserve the existing environment variables and keep private service credentials outside the client/repository. No new Supabase SQL is required for the Track or Sector checkpoint data; they use the existing save/profile mechanisms. The existing optional cash-ledger setup remains a separate server configuration. Keep a backup of player saves and the previous build before replacement.

## Additional defects corrected

- Checkpoint writes now flush the latest mastery events before saving a Sector boundary.
- Closed thin doors reject high-speed dash crossings; ordinary enemies use the same visible obstacle resolution before collision damage.
- Scoped modification stats now control actual recovery and reload timers, including reload rings and cosmetic animations.
- In-flight multiplayer acknowledgements never roll backward after canceled input. Joined players see the actual room mode and ready-state controls.
- Completed matches stop showing stale input errors as reconnecting, hide the inactive arena and display a clear result summary.
- Sector transitions clear stale Endless labels/toasts. Imported keybindings normalize safely and invalid maps restore working controls.
- Co-op mastery uses actor-specific server summaries, including actual healing, fresh nearby revives and the original projectile slot.

## Arena layout adjustment — 1 November 2026

Reduced gameplay header, HUD, hotbar and action-bar spacing, moved the long control reference to the existing menu help, and retained the viewport-aware arena fit. The arena now gets substantially more screen space, including shorter 1280×660 browser windows. Shop/menu typography is unchanged. Verified desktop/tablet/portrait bounds and visible Menu/Workshop controls without page scrolling.
