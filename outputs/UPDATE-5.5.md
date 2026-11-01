# NEON//NULL 5.5 — 1 November 2026

Ten distinct melee models now use the shared renderer in single-player and co-op: armored knuckles, combat knife, paired daggers, short sword, greatsword, hooked scythe, spear, energy baton, shock hammer and rotary drill. Metal highlights, grips, guards and inset panels match the current cosmetic style.

Melee selection displays the actual held item. Single-player previously displayed a primary gun in that slot; multiplayer previously omitted the held melee model. Strike artwork now uses each weapon’s reach and arc, with thrusts for knives/spears, sweeps for heavy blades, and distinct fist, baton, hammer and drill artwork. Reduced-motion and graphics settings remain supported.

Damage, reach, attack angles, cooldowns, costs and all existing mechanics remain unchanged. The existing balance and distance falloff remain in effect.

Validation: all ten model/strike renderers checked for finite coordinates and balanced transforms at all three graphics settings; model contact sheet visually inspected; single-player collision boundaries and case/save regressions passed. Four-client co-op testing includes melee equipped, fullscreen, low quality and narrow layout. No production Render testing is claimed.

Extract the 5.5 bundle and replace the supplied repository files, commit and redeploy Render. No Supabase migration is required; network protocol remains 5.2.
