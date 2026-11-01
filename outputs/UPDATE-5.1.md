# NEON//NULL 5.1

Multiplayer now uses the exact single-player enemy drawing function, extracted automatically at build time. Enemy shapes, palette, damage cracks and standard model sizes follow that source. Body artwork is cached; warning overlays and health bars retain live values. The prior alternate multiplayer models were removed.

Inputs dispatch immediately on movement/action keys and firing instead of waiting for the next input interval. Local movement reconciliation now accounts for measured request latency. Canvas resolution follows the displayed arena with a device pixel ratio cap of one to reduce rendering work on high-DPI screens. The HUD shows FPS and request round-trip time so slow rendering can be distinguished from delayed server replies.

Deploy the extracted v5.1 bundle contents to the same GitHub repository and deploy its latest commit on Render. The server still uses protocol5.0; replace root index.html and the multiplayer/outputs/work files together. No new Supabase SQL is required.

The earlier v5.0 performance report is historical. This patch does not guarantee a particular frame rate or hosting latency. Local browser checks use unranked accounts rather than live Supabase data.

Validation: four actual local Chrome clients passed combat, input focus, hotbar release, forced disconnect/reconnect and cleanup without runtime errors. Median frame intervals were about16.7ms; the loaded run had18.5–19.1ms upper frame percentiles and draw spikes, so it is not a zero-lag claim. No production Render or Internet test was performed. Engine and real HTTP regression checks passed.
