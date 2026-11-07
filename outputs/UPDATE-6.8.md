# NEON//NULL v6.8 — Faction Identity

7 November 2026

The 160 faction items now have authored weapon profiles, stronger material palettes, distinct projectile designs, and revised combat roles. Equipment IDs and indices are preserved.

## Play

Open `neon-null-v6.8.html`. On the main menu, open **Five Arsenals** to browse the showroom. Choose a faction, category, and item, then use **Workshop Test Bench** to try it for free. Targets include different distances, moving enemies, armored enemies, groups, and a boss-sized target.

During a run, open **Armory** to inspect equipment. Search by name or effect, or filter by role. Clicking a tile shows its model, signature mechanic, weakness, and a stat comparison. **Buy & equip** spends run scrap. Re-equipping owned gear does not charge again.

## Faction redesign

- **Spectrum Division** uses navy frames, pearl housings, cyan optics, and violet emitters. The Prism Lance rewards tracking. The Vector Railgun charges before piercing a line of targets. The Zero-Line Rifle and Lattice Disruptor use distinct ray patterns. Hardlight Screen is a forward projectile barrier with limited blocks. Rear attacks and blasts bypass it.
- **The Blackpowder Company** uses walnut stocks, iron locks, brass fittings, and burgundy details. Lock ignition, barrel arrangement, committed volleys, single-load reloads, and close-range pellet patterns give weapons different exposure windows.
- **Frontier Union** uses blued steel, leather, wood, copper, and turquoise detail. Cylinders, levers, paired barrels, reload cadence, and follow-up accuracy distinguish its equipment.
- **Brassworks Syndicate** uses oxidized brass, dark machinery, enamel gauges, and teal components. Pressure affects firing power and vent recovery. Rivets, cogs, bearing shots, steam effects, and repair machinery communicate its combat state.

Melee weapons retain distance damage falloff and distinct reach, arcs, effects, and recovery. Support tools include interruptible or mobile repairs, cooling support, marks, movement, area control, and directional sentries. Every faction item has two compatible Workshop choices.

## Rules and fixes

- Co-op pointerdown now reads the actual click/touch location, including a first press after resize or re-entry.
- Social, profile, developer, and settings panels block combat shortcuts. Wheel cycling respects blocked input.
- Ray hits resolve in contact order and penetrating hits generate effects at their real contact points.
- Committed volleys retain their initiating slot attribution through swaps and cancel correctly when the actor becomes downed or disconnected.
- Sentries check scenery visibility. Destroying cover opens their sight line.
- Beam hits apply the intended status effects. Healing fields deliver their final pulse.
- Test Bench resets clear old fields, effects, heat, charge, and recovery before creating the new target.
- Workshop installation checks active reload, charge, heat recovery, and attack recovery in normal play.
- Aim remains independent from screen shake. Reduced-motion and shake settings remain available.
- Sector checkpoints now store mutable gear values without repeating static weapon metadata. This fixes checkpoints exceeding the existing save-size limit.
- Free cosmetic trials preserve the prior Signal Track state when returning to the collection.

## Validation files

`ARSENAL-6.8.csv` records each item's prior behavior, redesigned role, signature, tradeoff, closest comparison, resource values, visual definition, and Workshop options.

`ARSENAL-BALANCE-6.8.csv` and its JSON companion record 480 standard/Workshop configurations in controlled authoritative-engine scenarios. These measurements use finite ammunition and include charge, reload, and vent time. They describe stationary-target tests and do not replace human balance playtesting.

`ARSENAL-VALIDATION-6.8.json` records the 480 solo equipment activations. Separate art checks exercise all 160 models and 80 projectile designs. See `PERFORMANCE-6.8.md` for measured browser results and test limitations.

## Deploy

Extract `neon-null-v6.8-bundle.zip`. Upload its root `index.html` and complete `multiplayer` folder to the GitHub branch used by Render. Deploy both together so the client and shared equipment catalog match.

Keep the existing Render environment variables and start command `node multiplayer/server.cjs`. This update needs no new Supabase migration. After deployment, refresh the Render game and check that the browser tab says **NEON//NULL v6.8**.

Local solo play works from the standalone HTML. Online co-op, account services, and server gifting use the hosted service. Hosted Render performance and live Supabase accounts were not exercised by the local test fixtures.

The fixed-720p local co-op comparison measured a higher render-time p95 in v6.8, at 13.2–14.2 ms versus 9.7–11.7 ms in v6.7. The report includes the recorded frame-time and network-cadence differences. This release makes no claim of an overall performance gain.
