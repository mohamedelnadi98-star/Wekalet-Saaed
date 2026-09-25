"""Build the two required deliverables after the public and owner HTML builds."""
from pathlib import Path
import zipfile,hashlib,json,re,tempfile
root=Path(__file__).resolve().parent.parent
version=json.loads((root/'package.json').read_text())['version'].split('.')[0]
out=root.parent
excluded={'node_modules','server-data','.git','_site','private-tools','__pycache__'}
files=[p for p in root.rglob('*') if p.is_file() and '.tmp.' not in p.name and not any(x in excluded for x in p.relative_to(root).parts) and not p.name.startswith('.env') and p.suffix!='.pyc']
public=out/f'Saeed-Agency-v{version}.zip';private=out/f'Saeed-Agency-Developer-v{version}.zip'
owner=root/'private-tools/Play-Owner.html'
if not owner.is_file():raise SystemExit('Both editions are required: restore private-tools/owner.js and build-portable.py --owner first.')
worker=(root/'service-worker.js').read_text();hashes=json.loads(re.search(r'HASHES=(\{[^;]+?\});',worker)[1])
for asset,digest in hashes.items():
 rel='index.html' if asset=='./' else asset.removeprefix('./')
 assert hashlib.sha256((root/rel).read_bytes()).hexdigest()==digest,rel
 assert hashlib.sha256((root/'_site'/rel).read_bytes()).hexdigest()==digest,rel
 assert 'private-tools' not in rel
assert 'private-tools/owner.js' not in (root/'Play-Offline.html').read_text()
assert "import(moduleURL('private-tools/owner.js')).then" in owner.read_text()
with zipfile.ZipFile(public,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted(files):z.write(p,f'Saeed-Agency-v{version}/'+p.relative_to(root).as_posix())
with zipfile.ZipFile(private,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for src,target in [('private-tools/Play-Owner.html','Play-Developer.html'),('private-tools/OWNER_AR.md','OWNER_AR.md'),('private-tools/owner.js','private-tools/owner.js'),('Character-Preview.html','Character-Preview.html')]:z.write(root/src,f'Saeed-Agency-Developer-v{version}/'+target)
for p in [public,private]:
 with zipfile.ZipFile(p) as z:
  assert z.testzip() is None
  with tempfile.TemporaryDirectory() as d:
   z.extractall(d)
   for name in z.namelist():assert hashlib.sha256((Path(d)/name).read_bytes()).digest()==hashlib.sha256(z.read(name)).digest()
  if p==public:
   for f in files:assert z.read(f'Saeed-Agency-v{version}/'+f.relative_to(root).as_posix())==f.read_bytes()
  print(p.name,p.stat().st_size,'bytes',len(z.namelist()),'files',hashlib.sha256(p.read_bytes()).hexdigest())
print('CRC/extraction/source comparison and',len(hashes),'offline hashes verified. Both editions ready.')
