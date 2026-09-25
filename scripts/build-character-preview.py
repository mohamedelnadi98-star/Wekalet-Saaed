from pathlib import Path
import re,json,posixpath,base64
root=Path(__file__).resolve().parent.parent;sources={}
def collect(file):
 if file in sources:return
 s=(root/file).read_text();sources[file]=s
 for m in re.finditer(r'''from\s*(['"])(\.[^'"]+)\1''',s):collect(posixpath.normpath(posixpath.join(posixpath.dirname(file),m[2])))
collect('character-viewer.js');textures={p.name:'data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode() for p in (root/'assets/manager').glob('*.png') if '.tmp.' not in p.name}
boot='window.SAEED_MANAGER_TEXTURES='+json.dumps(textures)+';const sources='+json.dumps(sources)+',urls={};'+r'''
function resolve(f,r){const a=f.split('/');a.pop();for(const p of r.split('/'))if(p==='..')a.pop();else if(p!=='.')a.push(p);return a.join('/')}
function mod(f){if(urls[f])return urls[f];return urls[f]=URL.createObjectURL(new Blob([sources[f].replace(/from\s*(['"])(\.[^'"]+)\1/g,(_,q,p)=>'from '+q+mod(resolve(f,p))+q)],{type:'text/javascript'}))}
import(mod('character-viewer.js')).catch(e=>{document.querySelector('h1').textContent='تعذرت المعاينة: '+e.message;console.error(e)});
'''
html=(root/'character-preview.html').read_text().replace('<script type="module" src="character-viewer.js"></script>','<script type="module">'+boot.replace('</script','<\\/script')+'</script>');(root/'Character-Preview.html').write_text(html);print('Standalone preview built:',len(html.encode()),'bytes')
