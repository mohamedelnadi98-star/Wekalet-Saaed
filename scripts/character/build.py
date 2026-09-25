from pathlib import Path
import json,math,collections,numpy as np
from scipy.spatial.transform import Rotation as Rot
from PIL import Image
ROOT=Path(__file__).resolve().parents[3]/'character-work';S=ROOT/'source';A=S/'system';OUT=ROOT.parent/'saeed-agency/assets/manager';OUT.mkdir(parents=True,exist_ok=True)
def obj(p):
 v=[];uv=[];fs=[];g=''
 for l in Path(p).read_text().splitlines():
  a=l.split()
  if not a:continue
  if a[0]=='v':v.append(list(map(float,a[1:4])))
  elif a[0]=='vt':uv.append(list(map(float,a[1:3])))
  elif a[0]=='g':g=a[1]
  elif a[0]=='f':fs.append(([(int(x.split('/')[0])-1,int(x.split('/')[1])-1) for x in a[1:]],g))
 return np.array(v),np.array(uv),fs
v,uv,fs=obj(S/'base.obj')
for name,w in [('caucasian-male-young',.8),('african-male-young',.2)]:
 for l in (S/(name+'.target')).read_text().splitlines():
  a=l.split()
  if a and not a[0].startswith('#'):v[int(a[0])]+=np.array(list(map(float,a[1:])))*w
sk=json.load(open(S/'default.mhskel'))
def joint(n):return v[sk['joints'][sk['bones'][n]['head']]].mean(0)
bones=[('hips',None,'spine05'),('spine','hips','spine03'),('chest','spine','spine01'),('neck','chest','neck01'),('head','neck','head')]
for side in ['L','R']:
 bones.extend([(f'upperarm.{side}','chest',f'upperarm01.{side}'),(f'forearm.{side}',f'upperarm.{side}',f'lowerarm01.{side}'),(f'hand.{side}',f'forearm.{side}',f'wrist.{side}'),(f'thigh.{side}','hips',f'upperleg01.{side}'),(f'shin.{side}',f'thigh.{side}',f'lowerleg01.{side}'),(f'foot.{side}',f'shin.{side}',f'foot.{side}')])
for side in ['L','R']:
 for digit in range(1,6):
  for seg in range(1,4):
   n=f'finger{digit}-{seg}.{side}';bones.append((n,f'hand.{side}' if seg==1 else f'finger{digit}-{seg-1}.{side}',n))
names=[b[0] for b in bones];parents=[names.index(b[1]) if b[1] else -1 for b in bones];heads=np.array([joint(b[2]) for b in bones])
def remap(n):
 side=n[-1]
 for prefix,target in [('upperarm','upperarm'),('lowerarm','forearm'),('upperleg','thigh'),('lowerleg','shin'),('foot','foot'),('toe','foot'),('wrist','hand'),('metacarpal','hand')]:
  if n.startswith(prefix):return target+'.'+side
 if n.startswith('finger'):return n
 if n.startswith(('root','pelvis','spine05','spine04')):return 'hips'
 if n.startswith(('spine03','spine02','breast')):return 'spine'
 if n.startswith(('spine01','shoulder','clavicle')):return 'chest'
 if n.startswith('neck'):return 'neck'
 return 'head'
bw=np.zeros((len(v),len(bones)))
for n,ws in json.load(open(S/'default_weights.mhw'))['weights'].items():
 for i,w in ws:bw[i,names.index(remap(n))]+=w
bw/=np.maximum(bw.sum(1,keepdims=True),1e-10)
rots=[];posed=[]
def align(a,b):return Rot.align_vectors([a/np.linalg.norm(a)],[b/np.linalg.norm(b)])[0].as_matrix()
for i,(name,parent,source) in enumerate(bones):
 p=parents[i];pr=rots[p] if p>=0 else np.eye(3);local=np.eye(3);side=name[-1];sgn=1 if side=='L' else -1
 if name.startswith('upperarm'):local=align(np.array([sgn*.10,-1,0]),joint('lowerarm01.'+side)-heads[i])
 elif name.startswith('forearm'):local=pr.T@align(np.array([0,-1,.065]),pr@(joint('wrist.'+side)-heads[i]))@pr
 elif name.startswith('thigh'):local=align(np.array([sgn*.012,-1,.015]),joint('lowerleg01.'+side)-heads[i])
 elif name.startswith('shin'):local=pr.T@align(np.array([sgn*.005,-1,0]),pr@(joint('foot.'+side)-heads[i]))@pr
 elif name.startswith('foot'):local=pr.T
 rots.append(pr@local);posed.append(posed[p]+pr@(heads[i]-heads[p]) if p>=0 else heads[i])
rots=np.array(rots);posed=np.array(posed)
def repose(a,w):
 result=np.zeros_like(a)
 for i in range(len(bones)):result+=((a-heads[i])@rots[i].T+posed[i])*w[:,i,None]
 return result
body=repose(v,bw);bodyids=list({i for f,g in fs if g=='body' for i,t in f});floor=body[bodyids,1].min();scale=1.82/np.ptp(body[bodyids,1])
def coords(a):a=a.copy();a[:,1]-=floor;return a*scale
def fitted(path):
 cv,cu,cf=obj(path.with_suffix('.obj'));maps=[];deleted=set();sc=np.ones(3);state=''
 for l in path.read_text().splitlines():
  a=l.split()
  if not a or a[0].startswith('#'):continue
  if a[0] in ['x_scale','y_scale','z_scale']:
   k='xyz'.index(a[0][0]);sc[k]=abs(v[int(a[1]),k]-v[int(a[2]),k])/float(a[3])
  elif a[0]=='verts':state='v'
  elif a[0]=='delete_verts':state='d'
  elif state=='v' and a[0].lstrip('-').isdigit():
   if len(a)==1:maps.append(([int(a[0])],[1.],np.zeros(3)))
   elif len(a)>=9:maps.append((list(map(int,a[:3])),list(map(float,a[3:6])),np.array(list(map(float,a[6:9])))))
  elif state=='d':
   i=0
   while i<len(a):
    if i+2<len(a) and a[i+1]=='-':deleted.update(range(int(a[i]),int(a[i+2])+1));i+=3
    else:deleted.add(int(a[i]));i+=1
 assert len(maps)==len(cv)
 cw=np.zeros((len(cv),len(bones)))
 for i,(ids,ws,off) in enumerate(maps):cv[i]=(v[ids]*np.array(ws)[:,None]).sum(0)+off*sc;cw[i]=(bw[ids]*np.array(ws)[:,None]).sum(0)
 cw=np.maximum(cw,0);cw/=np.maximum(cw.sum(1,keepdims=True),1e-9);return cv,cu,cf,cw,deleted
materials=[{'name':'Skin','map':'skin.png','color':[.94,.88,.8],'roughness':.83},{'name':'Linen shirt','map':'suit.png','normal':'suit-normal.png','color':[.89,.84,.71],'roughness':.94},{'name':'Charcoal trousers','map':'suit.png','normal':'suit-normal.png','color':[.26,.28,.30],'roughness':.92},{'name':'Leather shoes','map':'shoes.png','normal':'shoes-normal.png','color':[.65,.56,.46],'roughness':.73},{'name':'Short hair','map':'hair.png','color':[.20,.16,.13],'roughness':.94,'alphaTest':.4,'doubleSide':True},{'name':'Eyes','map':'eyes.png','color':[.85,.83,.8],'roughness':.34},{'name':'Eyebrows','map':'brows.png','color':[.65,.57,.5],'roughness':1,'alphaTest':.18,'doubleSide':True}];meshes=[]
def add(name,a,tu,faces,w,mat):
 a=coords(repose(a,w));lookup={};p=[];tex=[];ws=[];ix=[]
 for f,g in faces:
  ids=[]
  for key in f:
   if key not in lookup:lookup[key]=len(p);p.append(a[key[0]]);tex.append(tu[key[1]]);ws.append(w[key[0]])
   ids.append(lookup[key])
  for i in range(1,len(ids)-1):ix.extend([ids[0],ids[i],ids[i+1]])
 p=np.array(p);ws=np.array(ws);order=np.argsort(-ws,axis=1)[:,:4];ws=np.take_along_axis(ws,order,1);ws/=np.maximum(ws.sum(1,keepdims=True),1e-10);ws=ws.round(8);ws[:,0]=1-ws[:,1:].sum(1);order[ws<1e-8]=0
 tri=np.array(ix).reshape(-1,3);norm=np.zeros_like(p);fn=np.cross(p[tri[:,1]]-p[tri[:,0]],p[tri[:,2]]-p[tri[:,0]])
 for k in range(3):np.add.at(norm,tri[:,k],fn)
 weld=collections.defaultdict(list)
 for (vi,ti),j in lookup.items():weld[vi].append(j)
 for ids in weld.values():norm[ids]=norm[ids].sum(0)
 norm/=np.maximum(np.linalg.norm(norm,axis=1,keepdims=True),1e-10)
 meshes.append({'name':name,'material':mat,'position':p.round(6).ravel().tolist(),'normal':norm.round(6).ravel().tolist(),'uv':np.array(tex).round(6).ravel().tolist(),'index':ix,'skinIndex':order.ravel().tolist(),'skinWeight':ws.ravel().tolist()})
cv,cu,cf,cw,covered=fitted(A/'clothes/male_casualsuit01/male_casualsuit01.mhclo');shirt=[];pants=[];cuffs=[];vl=cv.tolist();ul=cu.tolist();wl=cw.tolist()
for f,g in cf:
 ids=[i for i,t in f];cat=1 if cv[ids,1].mean()>1.65 else 2
 if cat==1 and abs(cv[ids,0].mean())>2.7:
  side='L' if cv[ids[0],0]>0 else 'R';el=joint('lowerarm01.'+side);direction=joint('wrist.'+side)-el
  def dist(i):return np.dot(cv[i]-el,direction)/np.dot(direction,direction)-.18
  clipped=[];cuts=[]
  for a,b in zip(f,f[1:]+f[:1]):
   da,db=dist(a[0]),dist(b[0]);inside=da<=0
   if inside:clipped.append(a)
   if inside!=(db<=0):
    t=da/(da-db);new=(len(vl),len(ul));vl.append((cv[a[0]]*(1-t)+cv[b[0]]*t).tolist());ul.append((cu[a[1]]*(1-t)+cu[b[1]]*t).tolist());wl.append((cw[a[0]]*(1-t)+cw[b[0]]*t).tolist());clipped.append(new);cuts.append(new)
  if len(clipped)>=3:shirt.append((clipped,g))
  if len(cuts)==2:cuffs.append((cuts,direction,el))
 else:(shirt if cat==1 else pants).append((f,g))
for (a,b),direction,el in cuffs:
 center=el+.18*direction;unit=direction/np.linalg.norm(direction);rings=[]
 for shift,inflate in [(-.16,.015),(-.11,.055),(.01,.045),(.02,0)]:
  pair=[]
  for old in [a,b]:
   point=np.array(vl[old[0]]);rad=point-center;rad-=unit*np.dot(rad,unit);rad/=max(np.linalg.norm(rad),1e-9);new=(len(vl),len(ul));vl.append((point+unit*shift+rad*inflate).tolist());ul.append(ul[old[1]]);wl.append(wl[old[0]]);pair.append(new)
  rings.append(pair)
 for j in range(3):shirt.append(([rings[j][0],rings[j][1],rings[j+1][1],rings[j+1][0]],''))
cv=np.array(vl);cu=np.array(ul);cw=np.array(wl);add('Fitted linen shirt',cv,cu,shirt,cw,1);add('Tailored trousers',cv,cu,pants,cw,2)
a,b,c,d,e=fitted(A/'clothes/shoes01/shoes01.mhclo');covered|=e;pg=coords(repose(a,d));c=[(f,g) for f,g in c if pg[[i for i,t in f],1].mean()<.148];add('Leather work shoes',a,b,c,d,3)
armbones=[i for i,n in enumerate(names) if n.startswith(('forearm','hand','finger'))];exposed=[]
for f,g in fs:
 if g!='body':continue
 ids=[i for i,t in f]
 if not any(i in covered for i in ids) or bw[ids][:,armbones].sum(1).max()>.02:exposed.append((f,g))
add('Anatomical body',v,uv,exposed,bw,0)
for name,path,mat in [('Textured short hair','hair/short02/short02',4),('Eyes','eyes/low-poly/low-poly',5),('Eyebrows','eyebrows/eyebrow009/eyebrow009',6)]:
 a,b,c,d,e=fitted(A/(path+'.mhclo'));add(name,a,b,c,d,mat)
tex={'skin.png':A/'skins/young_caucasian_male2/young_lightskinned_male_diffuse2.png','suit.png':S/'materials/clothes/male_casualsuit01/toigo_male_casual_suit_01_white_shirt/male_casualsuit01_whiteShirt.png','suit-normal.png':A/'clothes/male_casualsuit01/male_casualsuit01_normal.png','shoes.png':A/'clothes/shoes01/shoes01_diffuse.png','shoes-normal.png':A/'clothes/shoes01/shoes01_normal.png','hair.png':A/'hair/short02/short02_diffuse.png','eyes.png':A/'eyes/materials/brownlight_eye.png','brows.png':A/'eyebrows/eyebrow009/eyebrow009.png'}
for name,path in tex.items():
 pixels=np.array(Image.open(path).convert('RGBA'));tmp=OUT/(name+'.tmp.png');Image.fromarray(pixels).save(tmp);assert np.array_equal(pixels,np.array(Image.open(tmp)));tmp.replace(OUT/name)
data={'height':1.82,'bones':[{'name':n,'parent':parents[i],'position':coords(posed)[i].round(6).tolist()} for i,(n,p,s) in enumerate(bones)],'materials':materials,'meshes':meshes};js=json.dumps(data,separators=(',',':'));(ROOT/'manager-data.json').write_text(js);(OUT/'manager-data.js').write_text('export const MANAGER_DATA='+js+';\n');print('Complete character:',sum(len(m['index'])//3 for m in meshes),'triangles,',len(bones),'bones. No apron.',flush=True)
