"""Stage only public assets, never server data, secrets, tests or dependencies."""
from pathlib import Path
import json,re,shutil,tempfile
root=Path(__file__).resolve().parent.parent
destination=root/'_site'
out=Path(tempfile.mkdtemp(prefix='saeed-pages-stage-',dir=root.parent))
assets=json.loads(re.search(r'ASSETS=(\[[^;]+?\]),HASHES=',(root/'service-worker.js').read_text())[1])
for relative in assets+['./service-worker.js','./Play-Offline.html']:
 if relative=='./':continue
 path=Path(relative)
 if path.is_absolute() or '..' in path.parts:raise ValueError('Unsafe public path')
 target=out/path;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(root/path,target)
(out/'.nojekyll').touch()
old=out.with_name(out.name+'-old')
if destination.exists():destination.rename(old)
out.rename(destination)
if old.exists():shutil.rmtree(old,ignore_errors=True)
print('GitHub Pages package:',destination)
