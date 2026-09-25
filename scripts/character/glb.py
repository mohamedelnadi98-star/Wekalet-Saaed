import json,struct,numpy as np,math,io
from pathlib import Path
from scipy.spatial.transform import Rotation as R
from PIL import Image
ROOT=Path(__file__).resolve().parents[3]/'character-work';A=ROOT.parent/'saeed-agency/assets/manager';d=json.load(open(ROOT/'manager-data.json'));raw=bytearray();g={'asset':{'version':'2.0','generator':'Saeed Agency complete character pipeline'},'scene':0,'scenes':[{'nodes':[]}],'nodes':[],'meshes':[],'skins':[],'materials':[],'images':[],'textures':[],'samplers':[{'magFilter':9729,'minFilter':9987,'wrapS':33071,'wrapT':33071}],'animations':[],'buffers':[{}],'bufferViews':[],'accessors':[]}
def view(b,target=None):
 while len(raw)%4:raw.append(0)
 v={'buffer':0,'byteOffset':len(raw),'byteLength':len(b)};raw.extend(b)
 if target:v['target']=target
 g['bufferViews'].append(v);return len(g['bufferViews'])-1
def acc(a,kind='VEC3',target=None,bounds=False):
 a=np.asarray(a);v={'bufferView':view(a.tobytes(),target),'componentType':{np.dtype('float32'):5126,np.dtype('uint16'):5123}[a.dtype],'count':len(a),'type':kind}
 if bounds:v.update(min=a.min(0).reshape(-1).tolist(),max=a.max(0).reshape(-1).tolist())
 g['accessors'].append(v);return len(g['accessors'])-1
ti={}
for m in d['materials']:
 for k in ['map','normal']:
  if m.get(k) and m[k] not in ti:
   name=m[k];b=(A/name).read_bytes();im=Image.open(io.BytesIO(b));im.load();ti[name]=len(g['textures']);g['images'].append({'bufferView':view(b),'mimeType':'image/png','name':name});g['textures'].append({'source':len(g['images'])-1,'sampler':0})
for m in d['materials']:
 p={'baseColorFactor':m['color']+[1],'metallicFactor':0,'roughnessFactor':m['roughness']}
 if m.get('map'):p['baseColorTexture']={'index':ti[m['map']]}
 a={'name':m['name'],'pbrMetallicRoughness':p,'doubleSided':m.get('doubleSide',False)}
 if m.get('normal'):a['normalTexture']={'index':ti[m['normal']],'scale':.45}
 if m.get('alphaTest'):a.update(alphaMode='MASK',alphaCutoff=m['alphaTest'])
 g['materials'].append(a)
for i,b in enumerate(d['bones']):
 p=b['parent'];pos=np.array(b['position'])
 if p>=0:pos-=d['bones'][p]['position']
 g['nodes'].append({'name':b['name'],'translation':pos.tolist()})
 if p>=0:g['nodes'][p].setdefault('children',[]).append(i)
 else:g['scenes'][0]['nodes'].append(i)
inv=[]
for b in d['bones']:
 m=np.eye(4,dtype=np.float32);m[:3,3]=-np.array(b['position']);inv.append(m.T.ravel())
g['skins'].append({'name':'Full character rig','skeleton':0,'joints':list(range(len(d['bones']))),'inverseBindMatrices':acc(np.array(inv,dtype=np.float32),'MAT4')})
for m in d['meshes']:
 p=np.array(m['position'],dtype=np.float32).reshape(-1,3);n=np.array(m['normal'],dtype=np.float32).reshape(-1,3);uv=np.array(m['uv'],dtype=np.float32).reshape(-1,2);uv[:,1]=1-uv[:,1];w=np.array(m['skinWeight'],dtype=np.float32).reshape(-1,4);w[:,0]=1-w[:,1:].sum(1,dtype=np.float64);j=np.array(m['skinIndex'],dtype=np.uint16).reshape(-1,4);j[w==0]=0
 attrs={'POSITION':acc(p,target=34962,bounds=True),'NORMAL':acc(n,target=34962),'TEXCOORD_0':acc(uv,'VEC2',34962),'JOINTS_0':acc(j,'VEC4',34962),'WEIGHTS_0':acc(w,'VEC4',34962)}
 if d['materials'][m['material']].get('normal'):
  tangent=np.zeros(p.shape);bit=np.zeros(p.shape)
  for a,b,c in np.array(m['index']).reshape(-1,3):
   e1=p[b]-p[a];e2=p[c]-p[a];u1=uv[b]-uv[a];u2=uv[c]-uv[a];den=u1[0]*u2[1]-u1[1]*u2[0]
   if abs(den)<1e-10:continue
   tangent[[a,b,c]]+=(e1*u2[1]-e2*u1[1])/den;bit[[a,b,c]]+=(e2*u1[0]-e1*u2[0])/den
  nn=n.astype(float);nn/=np.maximum(np.linalg.norm(nn,axis=1,keepdims=True),1e-10);tangent-=nn*(nn*tangent).sum(1,keepdims=True)
  for i in np.where(np.linalg.norm(tangent,axis=1)<1e-10)[0]:tangent[i]=np.cross(nn[i],[0,1,0] if abs(nn[i,1])<.9 else [1,0,0])
  tangent/=np.maximum(np.linalg.norm(tangent,axis=1,keepdims=True),1e-10);hand=np.where((np.cross(nn,tangent)*bit).sum(1)<0,-1.,1.);attrs['TANGENT']=acc(np.column_stack([tangent,hand]).astype(np.float32),'VEC4',34962)
 g['meshes'].append({'name':m['name'],'primitives':[{'attributes':attrs,'indices':acc(np.array(m['index'],dtype=np.uint16),'SCALAR',34963),'material':m['material']}]});g['scenes'][0]['nodes'].append(len(g['nodes']));g['nodes'].append({'name':m['name'],'mesh':len(g['meshes'])-1,'skin':0})
for mode in ['Idle','Walk','Carry']:
 times=np.linspace(0,2,49,dtype=np.float32);timeacc=acc(times,'SCALAR',bounds=True);anim={'name':mode,'channels':[],'samplers':[]}
 for i,b in enumerate(d['bones']):
  name=b['name'];q=[]
  for t in times:
   step=math.sin(float(t)*math.pi*2)*.38 if mode=='Walk' else 0;x=y=z=0
   if name=='head':y=math.sin(float(t)*math.pi)*.025
   if name=='chest':x=math.sin(float(t)*math.pi)*.004
   if name.startswith('thigh'):x=step if name.endswith('R') else -step
   if name.startswith('shin'):x=max(0,-step if name.endswith('R') else step)*.65
   if name.startswith('upperarm'):
    x=-step if name.endswith('R') else step
    if mode=='Carry':x=-.65;z=-.14 if name.endswith('R') else .14
   if name.startswith('forearm'):x=-.9 if mode=='Carry' else -.08
   if name.startswith('finger') and not name.startswith('finger1-'):z=(-1 if name.endswith('L') else 1)*(.42 if mode=='Carry' else .08)
   q.append(R.from_euler('XYZ',[x,y,z]).as_quat())
  out=acc(np.array(q,dtype=np.float32),'VEC4');anim['channels'].append({'sampler':len(anim['samplers']),'target':{'node':i,'path':'rotation'}});anim['samplers'].append({'input':timeacc,'output':out,'interpolation':'LINEAR'})
 g['animations'].append(anim)
while len(raw)%4:raw.append(0)
g['buffers'][0]['byteLength']=len(raw);js=json.dumps(g,separators=(',',':')).encode();js+=b' '*((-len(js))%4);out=struct.pack('<4sII',b'glTF',2,28+len(js)+len(raw))+struct.pack('<I4s',len(js),b'JSON')+js+struct.pack('<I4s',len(raw),b'BIN\x00')+raw;(A/'warehouse-manager.glb').write_bytes(out);print('GLB complete',len(out),'bytes; embedded textures decoded successfully')
