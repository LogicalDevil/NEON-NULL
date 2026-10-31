from pathlib import Path
import shutil
import subprocess

root = Path(__file__).resolve().parent.parent
out = root / 'outputs/neon-null.html'
source = (root / 'work/neon-null.html').read_text(encoding='utf-8')
for filename, marker in [('cosmetic-models.js','MODELS'),('cosmetic-studio.js','STUDIO')]:
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
for filename, comment in [('account-save.js','/* NEON//NULL save adapter.'),('multiplayer-client.js','/* Network renderer')]:
    start = source.index(comment, source.rfind('</template>'))
    end = source.index('</script>',start)
    source = source[:start] + (root / 'work' / filename).read_text(encoding='utf-8') + '\n' + source[end:]
(root / 'work/neon-null.html').write_text(source, encoding='utf-8')
subprocess.run(['node', str(root / 'multiplayer/build-catalog.cjs')], check=True)
subprocess.run(['node', str(root / 'multiplayer/build-skin-manifest.cjs')], check=True)
baseline = '<style>body{font:14px/1.45 system-ui,"Segoe UI",Arial,sans-serif}button,input,select{font:inherit}.btn{display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:7px 11px;border:1px solid #30393b;border-radius:4px;background:#fff;color:#111;cursor:pointer;font-size:13px;text-decoration:none}.btn-primary{background:#20292d;color:#fff}.btn:disabled{opacity:.5;cursor:default}.form-control{display:block;width:100%;min-height:36px;padding:7px 9px;border:1px solid #7e898b;border-radius:4px;background:#fff;color:#111}.text-small{font-size:12px}input[type=checkbox]{accent-color:#30393b}</style>'
source = baseline + source
html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>NEON//NULL v4.9</title><style>:root{color-scheme:light;background:#f2f2f2}html,body{margin:0;min-height:100%;background:#f2f2f2}body{box-sizing:border-box;padding:0}</style></head><body>' + source + '</body></html>'
out.write_text(html, encoding='utf-8')
shutil.copyfile(out, root / 'outputs/neon-null-v4.9.html')
print('Built', out.stat().st_size, 'bytes')
