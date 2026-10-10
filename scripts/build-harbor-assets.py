"""Compile CC0 Kenney OBJ models and palette into native indexed JS geometries.
Usage: build-city-assets.py /source/city-kit
       build-city-assets.py /source/car-kit --cars
"""
import sys,json,shutil
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parent.parent;source=Path(sys.argv[1]);ships='--ships' in sys.argv;out=root/'assets/harbor';out.mkdir(exist_ok=True)
objdir=source/'Models/OBJ format';image=Image.open(objdir/'Textures/colormap.png').convert('RGB');data={}
for name in (['ship-cargo-a','ship-cargo-b','boat-tug-a','cargo-container-a','buoy'] if ships else ['building-i','building-j','building-k','building-s','building-p','shipping-container-a','detail-tank']):
 pos=[];uv=[];nor=[];vertices=[];normals=[];colors=[];indices=[];seen={}
 for ln in (objdir/(name+'.obj')).read_text().splitlines():
  p=ln.split()
  if not p:continue
  if p[0]=='v':pos.append(list(map(float,p[1:4])))
  elif p[0]=='vt':uv.append(list(map(float,p[1:3])))
  elif p[0]=='vn':nor.append(list(map(float,p[1:4])))
  elif p[0]=='f':
   face=[]
   for v in p[1:]:
    if v not in seen:
     a,b,c=[int(x)-1 for x in v.split('/')];seen[v]=len(vertices)//3;vertices+=pos[a];normals+=nor[c];u,w=uv[b];rgb=image.getpixel((min(image.width-1,max(0,int(u*image.width))),min(image.height-1,max(0,int((1-w)*image.height)))))
     colors += [round((((x/255+.055)/1.055)**2.4 if x/255>.04045 else x/255/12.92)*.88+.025,5) for x in rgb]
    face.append(seen[v])
   for i in range(1,len(face)-1):indices += [face[0],face[i],face[i+1]]
 lo=[min(vertices[k::3]) for k in range(3)];hi=[max(vertices[k::3]) for k in range(3)]
 for i in range(0,len(vertices),3):vertices[i]-=(lo[0]+hi[0])/2;vertices[i+1]-=lo[1];vertices[i+2]-=(lo[2]+hi[2])/2
 data[name]={'p':[round(v,5) for v in vertices],'n':[round(v,5) for v in normals],'c':colors,'i':indices,'size':[round(hi[k]-lo[k],5) for k in range(3)]}
shutil.copyfile(source/'License.txt',out/('WATERCRAFT-LICENSE.txt' if ships else 'INDUSTRIAL-LICENSE.txt'))
file=out/('ships.js' if ships else 'industrial.js');file.write_text(('export const SHIP_MESHES=' if ships else 'export const INDUSTRIAL_MESHES=')+json.dumps(data,separators=(',',':'))+';\n')
(out/('WATERCRAFT-SOURCE.md' if ships else 'INDUSTRIAL-SOURCE.md')).write_text(('Kenney Watercraft Kit\nhttps://kenney.nl/assets/watercraft-kit' if ships else 'Kenney City Kit Industrial 2.0\nhttps://kenney.nl/assets/city-kit-industrial')+'\nCC0. Original OBJ meshes, embedded vertex palette, normalized ground origin. No runtime network requests.\n')
print(len(data),'models',sum(len(x['i'])//3 for x in data.values()),'triangles',file.stat().st_size,'bytes')
print({k:v['size'] for k,v in data.items()})
