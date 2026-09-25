import json,math,numpy as np
from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
R=Path(__file__).resolve().parents[3]/'character-work';A=R.parent/'saeed-agency/assets/manager';d=json.load(open(R/'manager-data.json'));textures={m['map']:np.array(Image.open(A/m['map']).convert('RGBA'))/255 for m in d['materials'] if m.get('map')}
def render(angle):
 W,H=480,900;im=np.zeros((H,W,3))+[.12,.145,.165];depth=np.full((H,W),-1e9);rot=np.array([[math.cos(angle),0,math.sin(angle)],[0,1,0],[-math.sin(angle),0,math.cos(angle)]]);light=np.array([-.5,.65,.85]);light/=np.linalg.norm(light)
 for m in d['meshes']:
  pts=np.array(m['position']).reshape(-1,3)@rot.T;norm=np.array(m['normal']).reshape(-1,3)@rot.T;uv=np.array(m['uv']).reshape(-1,2);mat=d['materials'][m['material']];tex=textures[mat['map']];col=np.array(mat['color'],float)
  for ids in np.array(m['index']).reshape(-1,3):
   v=pts[ids];n=np.cross(v[1]-v[0],v[2]-v[0])
   if np.linalg.norm(n)<1e-10 or (n[2]<=0 and not mat.get('doubleSide')):continue
   p=v[:,:2]*450;p[:,0]+=W/2;p[:,1]=H-30-p[:,1];x0=max(0,int(p[:,0].min()));x1=min(W-1,int(np.ceil(p[:,0].max())));y0=max(0,int(p[:,1].min()));y1=min(H-1,int(np.ceil(p[:,1].max())))
   if x0>x1 or y0>y1:continue
   X,Y=np.meshgrid(np.arange(x0,x1+1)+.5,np.arange(y0,y1+1)+.5);den=(p[1,1]-p[2,1])*(p[0,0]-p[2,0])+(p[2,0]-p[1,0])*(p[0,1]-p[2,1])
   if abs(den)<1e-9:continue
   b0=((p[1,1]-p[2,1])*(X-p[2,0])+(p[2,0]-p[1,0])*(Y-p[2,1]))/den;b1=((p[2,1]-p[0,1])*(X-p[2,0])+(p[0,0]-p[2,0])*(Y-p[2,1]))/den;b2=1-b0-b1;z=b0*v[0,2]+b1*v[1,2]+b2*v[2,2];mask=(b0>=0)&(b1>=0)&(b2>=0)&(z>depth[y0:y1+1,x0:x1+1])
   if not mask.any():continue
   u=b0[...,None]*uv[ids[0]]+b1[...,None]*uv[ids[1]]+b2[...,None]*uv[ids[2]];tx=np.clip((u[:,:,0]*(tex.shape[1]-1)).astype(int),0,tex.shape[1]-1);ty=np.clip(((1-u[:,:,1])*(tex.shape[0]-1)).astype(int),0,tex.shape[0]-1);sample=tex[ty,tx]
   if mat.get('alphaTest'):mask&=sample[:,:,3]>=mat['alphaTest']
   N=b0[...,None]*norm[ids[0]]+b1[...,None]*norm[ids[1]]+b2[...,None]*norm[ids[2]];N/=np.maximum(np.linalg.norm(N,axis=2,keepdims=True),1e-9)
   if n[2]<0:N=-N
   color=np.clip(sample[:,:,:3]**2.2*col*(.5+.7*np.maximum(0,N@light))[...,None],0,1)**(1/2.2);depth[y0:y1+1,x0:x1+1][mask]=z[mask];im[y0:y1+1,x0:x1+1][mask]=color[mask]
 return Image.fromarray((np.clip(im,0,1)*255).astype('uint8'))
canvas=Image.new('RGB',(1920,1050),'#20272d');draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',25);draw.text((45,25),'SAEED AGENCY / COMPLETE CHARACTER / NO APRON',font=font,fill='#e5dccb')
for i,(angle,name) in enumerate([(0,'FRONT'),(-.5,'3/4 VIEW'),(math.pi/2,'SIDE'),(math.pi,'BACK')]):canvas.paste(render(angle),(i*480,85));draw.text((i*480+50,1000),name,font=font,fill='#d7c9ae');print(name,'rendered',flush=True)
canvas.save(R.parent/'Saeed-Agency-Character-v15.png')
