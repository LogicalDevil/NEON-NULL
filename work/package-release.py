from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

root = Path(__file__).resolve().parent.parent
files = [
    'multiplayer/engine.cjs', 'multiplayer/server.cjs', 'multiplayer/catalog.json',
    'multiplayer/skin-manifest.json', 'multiplayer/build-skin-manifest.cjs',
    'multiplayer/package.json', 'multiplayer/.env.example', 'multiplayer/.gitignore',
    'multiplayer/test.cjs', 'multiplayer/combat-test.cjs', 'multiplayer/account-session-test.cjs', 'multiplayer/protocol-test.cjs', 'multiplayer/auth-test.cjs', 'multiplayer/cosmetic-test.cjs',
    'multiplayer/build-catalog.cjs', 'outputs/neon-null.html',
    'outputs/supabase-setup.sql', 'outputs/supabase-usernames.sql',
    'outputs/supabase-multiplayer.sql', 'outputs/MULTIPLAYER-SETUP.md',
    'outputs/CLOUD-SAVES.md', 'outputs/COSMETIC-INVENTORY.md', 'outputs/UPDATE-4.1.md', 'outputs/UPDATE-4.2.md', 'outputs/UPDATE-4.3.md', 'outputs/UPDATE-4.4.md', 'outputs/UPDATE-4.5.md', 'outputs/UPDATE-4.7.md', 'outputs/UPDATE-4.8.md', 'outputs/UPDATE-4.9.md', 'outputs/UPDATE-4.10.md', 'outputs/UPDATE-4.11.md', 'outputs/UPDATE-5.0.md', 'outputs/UPDATE-5.1.md', 'outputs/coop-v5.1-browser-results.json', 'outputs/PERFORMANCE-5.0.md', 'outputs/coop-v5-browser-results.json', 'outputs/coop-v5-baseline-results.json',
    'index.html', 'work/neon-null.html', 'work/verify-coop-v5.cjs', 'work/build-game.py', 'work/account-save.js',
    'work/multiplayer-client.js', 'work/cosmetic-models.js', 'work/cosmetic-studio.js',
    'work/interface-theme.css', 'work/interface-controls.js', 'work/enemy-models.js',
    'work/fonts/ChakraPetch-Regular.ttf', 'work/fonts/ChakraPetch-SemiBold.ttf', 'work/fonts/OFL.txt',
    'outputs/UPDATE-5.3.md', 'outputs/UPDATE-5.4.md', 'outputs/UPDATE-5.5.md','outputs/UPDATE-5.6.md','work/combat-effects.js','work/test-combat-effects.cjs','multiplayer/melee-impact-test.cjs', 'work/verify-melee-art.cjs', 'outputs/RENDER-5.4.json', 'work/verify-render-v54.cjs', 'work/verify-model-browser.cjs', 'outputs/FONT-LICENSES.md', 'work/verify-interface-v53.cjs', 'work/verify-ui-refresh.cjs',
    'work/test-cosmetic-models.cjs', 'work/package-release.py',
    'multiplayer/movement-test.cjs', 'multiplayer/client-movement-test.cjs', 'multiplayer/melee-test.cjs',
    'work/verify-enemy-parity.cjs', 'work/verify-cases-melee.cjs',
    'work/verify-model-coop.cjs', 'work/verify-run-reset.cjs',
    'outputs/UPDATE-5.2.md', 'outputs/PERFORMANCE-5.2.md',
    'outputs/coop-v5.2-normal-results.json', 'outputs/coop-v5.2-latency-results.json',
]
files += [
    'multiplayer/modifications.cjs', 'multiplayer/expansion-test.cjs',
    'work/expansion-runtime.js', 'work/combat-expansion.js', 'work/sector-run.js', 'work/signal-track.js',
    'work/test-sector-run.cjs', 'work/test-signal-track.cjs', 'work/verify-sector-run.cjs',
    'work/verify-sector-integrated.cjs', 'work/verify-signal-track.cjs', 'work/verify-track-integration.cjs',
    'work/verify-runtime-integration.cjs', 'work/verify-coop-expansion.cjs', 'work/verify-sp-performance.cjs',
    'outputs/UPDATE-6.0.md', 'outputs/SIGNAL-TRACK.md', 'outputs/COOP-EXPANSION-CONTRACT.md',
    'outputs/PERFORMANCE-6.0.md', 'outputs/coop-v6.0-results.json',
    'outputs/coop-v6.0-latency-results.json', 'outputs/coop-v6.0-before-renderer-results.json',
    'outputs/singleplayer-v6.0-results.json', 'outputs/neon-null-v6.3.html',
]
files = list(dict.fromkeys(files))
files += ['multiplayer/enemy-director.cjs','multiplayer/enemy-director-test.cjs','work/immersion-audio.js','work/test-immersion-audio.cjs','work/test-immersion-art.cjs','work/verify-immersion-art.cjs','work/verify-immersion-integrated.cjs','work/verify-room-environments.cjs','work/verify-living-yard.cjs','outputs/UPDATE-6.1.md','outputs/PERFORMANCE-6.1.md','outputs/immersion-before-results.json','outputs/immersion-after-results.json','outputs/coop-v6.1-results.json','outputs/coop-v6.1-initial-results.json']
files += ['multiplayer/developer-access.cjs','multiplayer/developer-content.cjs','multiplayer/case-catalog.json','multiplayer/developer-test.cjs','work/developer-studio.js','work/test-developer-art.cjs','work/verify-developer-studio.cjs','outputs/UPDATE-6.2.md','outputs/DEVELOPER-STUDIO-SETUP.md','outputs/developer-studio-results.json']
files += ['multiplayer/workshop-catalog.cjs','work/social-panel.js','work/test-workshop-expanded.cjs','work/verify-workshop-expanded.cjs','work/verify-workshop-integrated.cjs','work/verify-social-panel.cjs','work/verify-social-integrated.cjs','work/test-social-database.cjs','work/test-social-lobbies.cjs','outputs/supabase-social.sql','outputs/SOCIAL-SETUP.md','outputs/UPDATE-6.3.md','outputs/VALIDATION-6.3.md','outputs/workshop-v6.3-results.json','outputs/singleplayer-v6.3-results.json','outputs/coop-v6.3-results.json','outputs/coop-v6.3-initial-results.json']
files += ['work/profile-panel.js','work/test-profiles-gifts.cjs','work/verify-profiles-integrated.cjs','outputs/supabase-profiles-gifts.sql','outputs/PROFILES-GIFTS-SETUP.md','outputs/UPDATE-6.4.md','outputs/neon-null-v6.5.html']
files += [
    'multiplayer/arsenal-catalog.cjs', 'multiplayer/arsenal-test.cjs',
    'work/apply-arsenal-equipment.py', 'work/arsenal-equipment.js',
    'work/apply-arsenal-loadout.py', 'work/arsenal-loadout-bridge.js',
    'work/apply-arsenal-coop.py', 'work/apply_arsenal_art.py', 'work/apply_arsenal_coop_art.py', 'work/arsenal-art.js',
    'work/integrate-arsenal-relay.py', 'work/arsenal-relay-bridge.js', 'work/arsenal-relay.js',
    'work/test-arsenal-art.cjs', 'work/verify-arsenal-loadout.cjs', 'work/verify-arsenal-relay.cjs', 'work/verify-arsenal-equipment.cjs',
    'work/export-arsenal-roster.cjs', 'outputs/neon-null-v6.7.html', 'outputs/neon-null-v6.8.html', 'outputs/UPDATE-6.8.md', 'outputs/ARSENAL-6.8.csv',
    'work/audit-arsenal-balance.cjs', 'outputs/ARSENAL-BALANCE-6.8.csv', 'outputs/ARSENAL-BALANCE-6.8.json',
    'outputs/ARSENAL-VALIDATION-6.8.json', 'outputs/PERFORMANCE-6.8.md',
    'work/verify-arsenal-redesign-art.cjs', 'work/verify-redesign-input.cjs',
    'work/verify-redesign-sp-performance.cjs', 'work/verify-redesign-coop-performance.cjs',
    'work/arsenal-redesign-contact.png', 'work/arsenal-redesign-grayscale.png', 'work/arsenal-redesign-spectrum.png',
    'work/redesign-sp-v67-baseline.json', 'work/redesign-sp-v68-final.json',
    'work/redesign-coop-v67-baseline.json', 'work/redesign-coop-v68-final.json',
    'work/redesign-coop-v67-fixed.json', 'work/redesign-coop-v68-fixed.json',
]
target = root / 'outputs/neon-null-v6.8-bundle.zip'
with ZipFile(target, 'w', ZIP_DEFLATED) as archive:
    for name in files:
        archive.write(root / name, name)
print(f'Packaged {len(files)} files ({target.stat().st_size} bytes); no private keys or browser data included')
