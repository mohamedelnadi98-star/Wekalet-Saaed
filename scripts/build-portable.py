"""Build a single offline HTML with native ES modules supplied through blob URLs."""
from pathlib import Path
import base64,json,re,posixpath
root=Path(__file__).resolve().parent.parent
sources={}
def collect(file):
 if file in sources:return
 text=(root/file).read_text()
 if file=='world/effects.js':
  text=text.replace("'./assets/'+file+'.png'",'window.SAEED_ASSETS[file]')
 sources[file]=text
 for match in re.finditer(r"""from\s*(['"])(\.[^'"]+)\1""",text):
  dep=posixpath.normpath(posixpath.join(posixpath.dirname(file),match[2]))
  collect(dep)
collect('game.js')
assets={k:'data:image/png;base64,'+base64.b64encode((root/'assets'/f'{k}.png').read_bytes()).decode() for k in ['wood','concrete']}
portraits={p.stem:'data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode() for p in (root/'assets/portraits').glob('*.png')}
models={} # v7 uses locally constructed adult meshes; no old cartoon assets loaded
boot='window.SAEED_PORTRAITS='+json.dumps(portraits)+';\n'+'window.SAEED_MODELS='+json.dumps(models)+';\n'+"window.SAEED_ASSETS="+json.dumps(assets)+";\nconst sources="+json.dumps(sources,ensure_ascii=False)+",urls={};\n"+r"""
function resolve(file,relative){const parts=file.split('/');parts.pop();for(const p of relative.split('/')){if(p==='..')parts.pop();else if(p!=='.')parts.push(p)}return parts.join('/')}
function moduleURL(file){if(urls[file])return urls[file];const source=sources[file].replace(/from\s*(['"])(\.[^'"]+)\1/g,(_,q,p)=>'from '+q+moduleURL(resolve(file,p))+q);return urls[file]=URL.createObjectURL(new Blob([source],{type:'text/javascript'}))}
import(moduleURL('game.js')).catch(e=>{const el=document.getElementById('loading');el.textContent='تعذر التشغيل: '+e.message;console.error(e)});
"""
html=(root/'index.html').read_text().replace('<link rel="stylesheet" href="style.css">','<style>'+(root/'style.css').read_text()+'</style>')
html=re.sub(r'<link rel="manifest"[^>]*>|<link rel="icon"[^>]*>','',html)
html=html.replace('<script type="module" src="game.js"></script>','<script type="module">'+boot.replace('</script','<\\/script')+'</script>')
(root/'Play-Offline.html').write_text(html)
print(f'Portable build: {len(sources)} modules, {len(html.encode()):,} bytes')
