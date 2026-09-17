from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parent.parent
files=sorted(p for p in root.rglob('*') if p.is_file() and p.suffix in ['.html','.js','.css','.json','.png','.svg','.glb'] and not any(part in ['tests','scripts','server-data','node_modules','.git','.github','_site'] for part in p.relative_to(root).parts) and p.name not in ['service-worker.js','Play-Offline.html','package.json','package-lock.json','release.json'])
template=(root/'scripts/service-worker-template.js').read_text()
version=hashlib.sha256(template.encode()+(root/'package.json').read_bytes()+b''.join(str(p.relative_to(root)).encode()+p.read_bytes() for p in files)).hexdigest()[:16]
(root/'release.json').write_text(json.dumps({'build':version,'version':json.loads((root/'package.json').read_text())['version']})+'\n')
files.append(root/'release.json')
assets=['./']+['./'+p.relative_to(root).as_posix() for p in files]
hashes={path:hashlib.sha256((root/('index.html' if path=='./' else path[2:])).read_bytes()).hexdigest() for path in assets}
worker=template.replace('__VERSION__',json.dumps(version)).replace('__ASSETS__',json.dumps(assets)).replace('__HASHES__',json.dumps(hashes))
(root/'service-worker.js').write_text(worker)
print(f'Verified offline release: {len(assets)} assets, build {version}')
