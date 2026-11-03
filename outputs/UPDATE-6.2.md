# v6.2 — Developer Studio

3 November 2026

- Added NEON_DEV username shortcut and Developer Access panels. The server verifies authenticated account IDs against DEVELOPER_USER_IDS; no embedded secret, guest bypass, or username-derived role.
- Added a six-tab Studio with free weapon/operator case tests,1/10/50/100 batches, normal case odds, forced rarity/exact items, test duplicates, probability samples, bounded history, and memory-only collection.
- Added twelve operator designs and twelve weapon designs with distinct construction, silhouette, materials, animation accents, and sound previews. Four melee designs are inspection-only; compatible ranged/operator outfits can be authorized temporarily for co-op.
- Added all-content preview unlocking, comparison, animation/playback controls, operation/light/dark environments, lighting presets, target feedback, clean capture, fullscreen, and optional preview diagnostics.
- Shared exclusive art is available to ordinary clients so authorized co-op outfits render consistently. Server equipment validation, short renewable leases, role revocation, and normal-outfit fallback prevent client identity/ownership fields from granting access.
- Back to Game keeps an explicitly labeled developer session; Exit/End/Reset clears it. Temporary content is excluded from normal inventory, scrap, cloud-save values, cases opened, Track XP, and mission rewards.
- Existing ordinary140 cosmetics, gameplay, accounts, save schema, controls, and public case odds are preserved.

Tests passed: developer authorization and expiry rules with a local identity fixture; zero cloud writes; unchanged ordinary local saves; actual server-backed browser Studio flows;24 distinct designs at low/reduced quality;720 Canvas pose/quality combinations; normal cosmetic/account/protocol checks; tutorial and responsive UI regressions.

See DEVELOPER-STUDIO-SETUP.md for the required owner allowlist setup and scope. Live Supabase/Render access was not tested or configured. No claim of a universally bug-free update is made.
