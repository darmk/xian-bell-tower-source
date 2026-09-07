from PIL import Image, ImageDraw, ImageFilter
import numpy as np
from pathlib import Path
P=Path('public/model/textures');P.mkdir(parents=True,exist_ok=True)
N=2048
rng=np.random.default_rng(42)
def save(name,img,h,rough,metal=0):
 img.save(P/f'{name}-color.png',optimize=True)
 a=np.asarray(h.resize((N,N)),dtype=float)/255
 gy,gx=np.gradient(a);norm=np.stack([-gx*10,-gy*10,np.ones_like(a)],-1);norm/=np.linalg.norm(norm,axis=-1)[...,None]
 Image.fromarray(np.uint8((norm*.5+.5)*255)).save(P/f'{name}-normal.png',optimize=True)
 ao=np.uint8(225+a*30);orm=np.stack([ao,np.full_like(ao,round(rough*255)),np.full_like(ao,round(metal*255))],-1)
 Image.fromarray(orm).save(P/f'{name}-orm.png',optimize=True)
def grain(base,wood=False):
 tiny=rng.integers(-7,8,(128,128 if not wood else 16),dtype=np.int16)
 noise=np.asarray(Image.fromarray(np.uint8(tiny+128)).resize((N,N),Image.Resampling.BILINEAR),dtype=np.int16)-128
 return Image.fromarray(np.uint8(np.clip(np.array(base)[None,None,:]+noise[:,:,None],0,255)))
for name,c,r,m in [('red',(135,35,28),.43,0),('wood',(66,37,23),.66,0),('stone',(179,175,158),.82,0),('green',(32,99,64),.27,0),('gold',(199,142,45),.27,1)]:
 img=grain(c,name in ['red','wood']);h=Image.new('L',(N,N),180);d=ImageDraw.Draw(h)
 if name in ['wood','red']:
  for x in range(0,N,26):d.line([(x,0),(x+8,600),(x-4,1500),(x,N)],fill=165,width=2)
 save(name,img,h,r,m)
img=Image.new('RGB',(N,N),(109,105,96));h=Image.new('L',(N,N),70);d=ImageDraw.Draw(img);dh=ImageDraw.Draw(h)
for row in range(32):
 for col in range(-1,9):
  x=col*256+(128 if row%2 else 0);y=row*64
  c=rng.integers(-14,15);d.rectangle((x+3,y+3,x+252,y+60),fill=(int(91+c),int(96+c),int(94+c)));dh.rounded_rectangle((x+3,y+3,x+252,y+60),radius=3,fill=205)
save('brick',img,h,.91)
# Original stylized traditional painted beam atlas: linework is new, never copied photography.
S=4096;img=Image.new('RGB',(S,S),(23,70,84));d=ImageDraw.Draw(img);h=Image.new('L',(S,S),180)
for y in range(0,S,512):
 d.rectangle((0,y+8,S,y+32),fill='#b89048');d.rectangle((0,y+478,S,y+502),fill='#b89048')
 d.line((0,y+55,S,y+55),fill='#83bab0',width=12);d.line((0,y+456,S,y+456),fill='#83bab0',width=12)
 for x in range(0,S,512):
  d.polygon([(x+12,y+256),(x+180,y+80),(x+332,y+80),(x+500,y+256),(x+332,y+430),(x+180,y+430)],fill='#285b48',outline='#d8b15f',width=9)
  for k in range(8):
   ang=k*np.pi/4;cx=x+256+78*np.cos(ang);cy=y+256+78*np.sin(ang)
   d.ellipse((cx-40,cy-40,cx+40,cy+40),fill='#c57d47',outline='#e2bd71',width=7)
  d.ellipse((x+217,y+217,x+295,y+295),fill='#ddc687',outline='#edddad',width=8)
  d.arc((x+22,y+108,x+490,y+402),10,165,fill='#e3bf66',width=9)
save('paint',img,h,.57)
# Shallow first-floor caisson, with radiating colored rays and floral coffer borders.
img=Image.new('RGB',(S,S),(33,74,80));d=ImageDraw.Draw(img);h=Image.new('L',(S,S),180)
for x in range(0,S,512):
 for y in range(0,S,512):
  d.rectangle((x+12,y+12,x+500,y+500),outline='#cda764',width=20)
  for a in range(8):
   t=a*np.pi/4;cx=x+256+78*np.cos(t);cy=y+256+78*np.sin(t);d.ellipse((cx-45,cy-45,cx+45,cy+45),fill='#b86444',outline='#d0ba80',width=8)
  d.ellipse((x+223,y+223,x+289,y+289),fill='#dabc74')
colors=['#db9d52','#3e7e9d','#b64840','#80a8a5','#d9ba75','#706399']
for i in range(120):
 a=i*3;d.pieslice((S*.245,S*.245,S*.755,S*.755),a,a+3,fill=colors[i%6])
for r,c in [(1030,'#dbbd75'),(970,'#233f5e'),(230,'#dabc76'),(180,'#447c73')]:d.ellipse((S/2-r,S/2-r,S/2+r,S/2+r),outline=c,width=25)
d.ellipse((S/2-65,S/2-65,S/2+65,S/2+65),fill='#d6ae54')
save('ceiling',img,h,.62)
print('PBR texture sets:',len(list(P.glob('*-color.png'))))
