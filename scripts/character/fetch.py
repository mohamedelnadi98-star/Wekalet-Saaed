from pathlib import Path
import urllib.request,zipfile,concurrent.futures
r=Path(__file__).resolve().parents[3]/'character-work/source';r.mkdir(parents=True,exist_ok=True)
base='https://raw.githubusercontent.com/makehumancommunity/makehuman/master/makehuman/data/'
jobs=[(base+p,Path(p).name,None) for p in ['3dobjs/base.obj','rigs/default.mhskel','rigs/default_weights.mhw','targets/macrodetails/caucasian-male-young.target','targets/macrodetails/african-male-young.target']]
for p,d in [('makehuman_system_assets','system'),('system_clothes_materials01','materials')]:jobs.append((f'https://files2.makehumancommunity.org/asset_packs/{p}/{p}_cc0.zip',p+'.zip',d))
def get(job):
 u,n,d=job
 with urllib.request.urlopen(u,timeout=60) as response,open(r/n,'wb') as f:
  while b:=response.read(1024*1024):f.write(b)
 if d:zipfile.ZipFile(r/n).extractall(r/d)
 print(n,'ready',flush=True)
with concurrent.futures.ThreadPoolExecutor(5) as pool:list(pool.map(get,jobs))
