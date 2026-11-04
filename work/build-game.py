from pathlib import Path
import shutil
import subprocess
import base64

root = Path(__file__).resolve().parent.parent
out = root / 'outputs/neon-null.html'
source = (root / 'work/neon-null.html').read_text(encoding='utf-8')
for filename, marker in [('../multiplayer/workshop-catalog.cjs','WORKSHOP_CATALOG'),('social-panel.js','SOCIAL'),('profile-panel.js','PROFILES'),('../multiplayer/developer-content.cjs','DEV_CONTENT'),('developer-studio.js','DEV_STUDIO'),('../multiplayer/enemy-director.cjs','DIRECTOR'),('immersion-audio.js','IMMERSION_AUDIO'),('cosmetic-models.js','MODELS'),('cosmetic-studio.js','STUDIO'),('enemy-models.js','ENEMY_MODELS'),('interface-controls.js','INTERFACE'),('combat-effects.js','COMBAT_FX'),('expansion-runtime.js','RUNTIME'),('combat-expansion.js','COMBAT_EXPANSION'),('sector-run.js','SECTOR'),('signal-track.js','TRACK')]:
    start_marker = '<!-- NN_' + marker + '_START -->'
    end_marker = '<!-- NN_' + marker + '_END -->'
    block = start_marker + '\n<script>\n' + (root / 'work' / filename).read_text(encoding='utf-8') + '\n</script>\n' + end_marker
    if start_marker in source:
        start = source.index(start_marker)
        end = source.index(end_marker, start) + len(end_marker)
        source = source[:start] + block + source[end:]
    else:
        at = source.rfind('</template>') + len('</template>')
        source = source[:at] + '\n' + block + '\n' + source[at:]
# Ship the licensed font inside the standalone HTML; no runtime font requests.
license_text = (root/'work/fonts/OFL.txt').read_text(encoding='utf-8')
font_css = '/* Chakra Petch: https://github.com/google/fonts/tree/main/ofl/chakrapetch\n'+license_text+' */\n'
for name, weight in [('Regular',400),('SemiBold',600)]:
    data = base64.b64encode((root/('work/fonts/ChakraPetch-'+name+'.ttf')).read_bytes()).decode('ascii')
    font_css += "@font-face{font-family:'NN Chakra';font-weight:"+str(weight)+";font-style:normal;font-display:swap;src:url(data:font/ttf;base64,"+data+") format('truetype')}\n"
a_marker='<!-- NN_THEME_START -->'; b_marker='<!-- NN_THEME_END -->'
block=a_marker+'<style>'+font_css+(root/'work/interface-theme.css').read_text(encoding='utf-8')+'</style>'+b_marker
if a_marker in source:
    a=source.index(a_marker);b=source.index(b_marker,a)+len(b_marker);source=source[:a]+block+source[b:]
else:
    a=source.rfind('</template>')+len('</template>');source=source[:a]+block+source[a:]

# Reuse the exact single-player enemy drawing code for online play.
start = source.rindex('const drawEnemy=e=>')
end = source.index('const drawMissionTargets=', start)
enemy_draw = source[start:end].strip().replace('if(e.hp<e.max){', 'if(e.hp<e.max&&!e.hideHealthBar){')
module = '<!-- NN_ENEMIES_START --><script>window.NeonEnemyArt={draw(ctx,e,options={}){const graphicsQuality=options.quality||"standard",bossTheme=options.theme||"relay",reduced=!!options.reduced,flashEnabled=options.flash!==false;'+enemy_draw+'drawEnemy(e)}};</script><!-- NN_ENEMIES_END -->'
if '<!-- NN_ENEMIES_START -->' in source:
    a=source.index('<!-- NN_ENEMIES_START -->');b=source.index('<!-- NN_ENEMIES_END -->',a)+len('<!-- NN_ENEMIES_END -->');source=source[:a]+module+source[b:]
else:
    a=source.rfind('</template>')+len('</template>');source=source[:a]+module+source[a:]
for filename, comment in [('account-save.js','/* NEON//NULL save adapter.'),('multiplayer-client.js','/* Network renderer')]:
    start = source.index(comment, source.rfind('</template>'))
    end = source.index('</script>',start)
    source = source[:start] + (root / 'work' / filename).read_text(encoding='utf-8') + '\n' + source[end:]
(root / 'work/neon-null.html').write_text(source, encoding='utf-8')
subprocess.run(['node', str(root / 'multiplayer/build-catalog.cjs')], check=True)
subprocess.run(['node', str(root / 'multiplayer/build-skin-manifest.cjs')], check=True)
baseline = '<style>body{font:14px/1.45 system-ui,"Segoe UI",Arial,sans-serif}button,input,select{font:inherit}.btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:7px 11px;border:1px solid #30393b;border-radius:4px;background:#fff;color:#111;cursor:pointer;font-size:13px;text-decoration:none}.btn-primary{background:#20292d;color:#fff}.btn:disabled{opacity:.5;cursor:default}.form-control{display:block;width:100%;min-height:36px;padding:7px 9px;border:1px solid #7e898b;border-radius:4px;background:#fff;color:#111}.text-small{font-size:12px}input[type=checkbox]{accent-color:#30393b}</style>'
source = baseline + source
html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>NEON//NULL v6.4</title><style>:root{color-scheme:light;background:#f2f2f2}html,body{margin:0;min-height:100%;background:#f2f2f2}body{box-sizing:border-box;padding:0}</style></head><body>' + source + '</body></html>'
out.write_text(html, encoding='utf-8')
shutil.copyfile(out, root / 'outputs/neon-null-v6.4.html')
shutil.copyfile(out, root / 'index.html')
shutil.copyfile(out, root / 'outputs/index.html')
print('Built', out.stat().st_size, 'bytes')
