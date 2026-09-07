import json, math, sys
from pathlib import Path
import numpy as np
from PIL import Image
from numba import njit
ROOT=Path('/workspace/scratch/c0712837f0ef/render-data');OUT=Path('public/model/views');OUT.mkdir(parents=True,exist_ok=True)
@njit(cache=True)
def raster(vertices,normals,uvs,indices,tex,R,eye,f,W,H,depth,img,interior):
 # camera coordinates + clip against the near plane, then perspective-correct textured rasterization
 cv=(vertices-eye)@R.T;cn=normals
 for it in range(len(indices)):
  ids=indices[it];poly=np.empty((6,8),np.float64);count=0
  for j in range(3):
   a=ids[j];b=ids[(j+1)%3];za=cv[a,2];zb=cv[b,2]
   if za>=.06:
    poly[count,:3]=cv[a];poly[count,3:6]=cn[a];poly[count,6:8]=uvs[a];count+=1
   if (za>=.06)!=(zb>=.06):
    t=(.06-za)/(zb-za);poly[count,:3]=cv[a]+t*(cv[b]-cv[a]);poly[count,3:6]=cn[a]+t*(cn[b]-cn[a]);poly[count,6:8]=uvs[a]+t*(uvs[b]-uvs[a]);count+=1
  for sub in range(1,count-1):
   v=np.empty((3,8),np.float64);v[0]=poly[0];v[1]=poly[sub];v[2]=poly[sub+1]
   xs=np.empty(3);ys=np.empty(3);iz=1/v[:,2]
   for j in range(3):xs[j]=W*.5+v[j,0]*f*iz[j];ys[j]=H*.5-v[j,1]*f*iz[j]
   area=(xs[1]-xs[0])*(ys[2]-ys[0])-(ys[1]-ys[0])*(xs[2]-xs[0])
   if abs(area)<.00001:continue
   # Exterior normals determine visibility: matching GLB single-sided material.
   face=np.cross(v[1,:3]-v[0,:3],v[2,:3]-v[0,:3]);
   if np.dot(face,v[0,:3])<=0:continue
   xmin=max(0,int(math.floor(min(xs))));xmax=min(W-1,int(math.ceil(max(xs))));ymin=max(0,int(math.floor(min(ys))));ymax=min(H-1,int(math.ceil(max(ys))))
   for yy in range(ymin,ymax+1):
    for xx in range(xmin,xmax+1):
     px=xx+.5;py=yy+.5;b0=((xs[1]-px)*(ys[2]-py)-(ys[1]-py)*(xs[2]-px))/area;b1=((xs[2]-px)*(ys[0]-py)-(ys[2]-py)*(xs[0]-px))/area;b2=1-b0-b1
     if min(b0,b1,b2)<-.00001:continue
     dd=b0*iz[0]+b1*iz[1]+b2*iz[2];z=1/dd
     if z>=depth[yy,xx]:continue
     w0=b0*iz[0]/dd;w1=b1*iz[1]/dd;w2=b2*iz[2]/dd
     u=v[0,6]*w0+v[1,6]*w1+v[2,6]*w2;vv=v[0,7]*w0+v[1,7]*w1+v[2,7]*w2
     n=v[0,3:6]*w0+v[1,3:6]*w1+v[2,3:6]*w2;nl=np.linalg.norm(n)
     if nl>0:n=n/nl
     lum=.57+.65*max(0,n[0]*.43+n[1]*.75+n[2]*.5)+.18*max(0,-n[0]*.6+n[1]*.5-n[2]*.6)
     if interior:lum=.82+.3*max(0,n[1]*-.5+n[2]*.4)
     tx=int((u%1)*tex.shape[1])%tex.shape[1];ty=int((vv%1)*tex.shape[0])%tex.shape[0]
     for ch in range(3):img[yy,xx,ch]=min(255,max(0,tex[ty,tx,ch]*lum))
     depth[yy,xx]=z
poses={'overall':([59,42,65],[0,15.5,0]),'front':([0,24,80],[0,16,0]),'back':([0,24,-80],[0,16,0]),'side':([80,24,0],[0,16,0]),'top':([0,86,.01],[0,10,0]),'hall':([0,11.7,6.4],[0,15.1,-2.6]),'upper':([1.2,19.2,6.5],[0,27,0]),'stairs':([2,12.8,.1],[6.1,13.6,3.8]),'vault':([0,2.5,14.3],[0,4.2,-7]),'bracket':([16.7,14.7,16.7],[10.2,13.8,10.2]),'finial':([6,35.7,7],[0,33.7,0])}
manifest=json.loads((ROOT/'manifest.json').read_text());meshes=[];textures={}
for m in manifest:
 i=m['id'];mat=m['mat'];a=[np.fromfile(ROOT/f'{i}-{k}.bin',dtype=np.uint32 if k=='idx' else np.float32).reshape(-1,n) for k,n in [('pos',3),('norm',3),('uv',2),('idx',3)]]
 if mat not in textures:textures[mat]=np.asarray(Image.open(f'public/model/textures/{mat}-color.png').convert('RGB').resize((1024,1024)))
 meshes.append((m,a))
for name in (sys.argv[1:] or poses.keys()):
 eye,target=map(lambda x:np.array(x,dtype=np.float64),poses[name]);forward=target-eye;forward/=np.linalg.norm(forward);right=np.cross(forward,[0,1,0]);right/=np.linalg.norm(right);up=np.cross(right,forward);R=np.stack([right,up,forward]);W,H=1400,1160;f=H/(2*np.tan(np.deg2rad(39)/2));depth=np.full((H,W),1e9);img=np.zeros((H,W,3),np.uint8)
 for y in range(H):img[y,:,:]=np.array([24,41,55])+(y/H)*np.array([7,8,8])
 for m,a in meshes:raster(*a,textures[m['mat']],R,eye,f,W,H,depth,img,name in ['hall','upper','stairs','vault'])
 Image.fromarray(img).save(OUT/f'{name}.jpg',quality=93,subsampling=0)
 print(name, 'rendered',flush=True)
