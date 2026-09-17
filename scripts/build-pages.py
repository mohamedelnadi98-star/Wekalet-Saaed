"""Stage only public assets, never server data, secrets, tests or dependencies."""
from pathlib import Path
import json,re,shutil
root=Path(__file__).resolve().parent.parent
out=root/'_site'
if out.exists():shutil.rmtree(out)
out.mkdir()
assets=json.loads(re.search(r'ASSETS=(\[[^;]+?\]),HASHES=',(root/'service-worker.js').read_text())[1])
for relative in assets+['./service-worker.js','./Play-Offline.html']:
 if relative=='./':continue
 path=Path(relative)
 if path.is_absolute() or '..' in path.parts:raise ValueError('Unsafe public path')
 target=out/path;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(root/path,target)
(out/'.nojekyll').touch()
print('GitHub Pages package:',out)
