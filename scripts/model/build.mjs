import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {Document,NodeIO} from '@gltf-transform/core';
import fs from 'node:fs';
import validator from 'gltf-validator';
import {weld,meshopt} from '@gltf-transform/functions';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptEncoder} from 'meshoptimizer';
const out='public/model', groups={}, counts={inner:0,outer:0,eave:0,square:0};
const mats=['brick','stone','red','wood','green','gold','paint','ceiling'];
function add(g,mat,group,x=0,y=0,z=0,rot=null){if(rot)g.applyMatrix4(new T.Matrix4().makeRotationFromEuler(new T.Euler(...rot)));g.translate(x,y,z);let k=group+'|'+mat;(groups[k]??=[]).push(g);}
function box(w,h,d,x,y,z,mat='wood',group='Beams',ry=0){add(new T.BoxGeometry(w,h,d),mat,group,x,y,z,[0,ry,0]);}
function cyl(r1,r2,h,x,y,z,mat='red',group='Columns',n=16){add(new T.CylinderGeometry(r1,r2,h,n,1),mat,group,x,y,z);}
function ball(rx,ry,rz,x,y,z,mat,group='Decor'){const g=new T.SphereGeometry(1,10,6);g.scale(rx,ry,rz);add(g,mat,group,x,y,z);}
function beam(a,b,w,d,mat='wood',group='Beams'){const v=new T.Vector3(...b).sub(new T.Vector3(...a));let g=new T.BoxGeometry(w,v.length(),d);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize()));add(g,mat,group,...new T.Vector3(...a).add(new T.Vector3(...b)).multiplyScalar(.5));}
function path(points,r,mat='gold',group='Decor',segments=24,radial=6){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));add(new T.TubeGeometry(curve,segments,r,radial,false),mat,group);}
function shapeExtrude(pts,depth,mat,group,x=0,y=0,z=0,ry=0){const s=new T.Shape();s.moveTo(...pts[0]);for(const p of pts.slice(1))s.lineTo(...p);s.closePath();const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,steps:1});g.translate(0,0,-depth/2);add(g,mat,group,x,y,z,[0,ry,0]);}
function slabHole(y,half=8.32,h=.22){ // stair void x=4.55..7.75, z=0.7..6.9
 box(half+4.55,h,half*2,(-half+4.55)/2,y,0,'wood','Floors');
 box(half-7.75,h,half*2,(half+7.75)/2,y,0,'wood','Floors');
 box(3.2,h,half+.7,6.15,y,(-half+.7)/2,'wood','Floors');
 box(3.2,h,half-6.9,6.15,y,(half+6.9)/2,'wood','Floors');
}
// Base: four corner solids + four closed arched roof extrusions + central groin vault.
const H=8.6,R=17.75;
for(const sx of [-1,1])for(const sz of [-1,1])box(R-3,H,R-3,sx*(R+3)/2,H/2,sz*(R+3)/2,'brick','Base');
const arch=[[-3,H],[-3,3]];for(let i=0;i<=32;i++){let a=Math.PI-i*Math.PI/32;arch.push([3*Math.cos(a),3+3*Math.sin(a)]);}arch.push([3,H]);
for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5])shapeExtrude(arch,R-3,'brick','Vaults',Math.sin(a)*(R+3)/2,0,Math.cos(a)*(R+3)/2,a);
// Closed central crossed barrel vault volume. Each grid quad is underside; diagonal cusp aligns grid.
{
let p=[],idx=[],uv=[],n=32;for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){let x=-3+6*i/n,z=-3+6*j/n,y=3+Math.sqrt(9-Math.min(x*x,z*z));p.push(x,y,z);uv.push(i/n,j/n);}
for(let j=0;j<n;j++)for(let i=0;i<n;i++){let a=j*(n+1)+i,b=a+1,c=a+n+1,d=c+1;idx.push(a,b,c,b,d,c);}
const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();add(g,'brick','Vaults');box(6,H-6,6,0,(H+6)/2,0,'brick','Base');
}
box(35.5,.12,35.5,0,8.66,0,'stone','Base'); // top cap no obstruction of vault
box(35.5,.06,6,0,.03,0,'stone','Vaults');box(6,.06,35.5,0,.03,0,'stone','Vaults');
// Decorative archivolts and horizontal stone coping.
for(let side=0;side<4;side++){
 const a=side*Math.PI/2;const tr=(x,y,z)=>[Math.cos(a)*x+Math.sin(a)*z,y,-Math.sin(a)*x+Math.cos(a)*z];
 for(let i=0;i<25;i++){let t=(i+.5)*Math.PI/25;const g=new T.BoxGeometry(.37,.36,.14);g.rotateZ(t-Math.PI/2);g.rotateY(a);const p=tr(3.18*Math.cos(t),3+3.18*Math.sin(t),R+.02);add(g,'stone','Decor',...p);}
 for(const x of [-3.18,3.18]){const p=tr(x,1.5,R+.02);box(.36,3,.14,...p,'stone','Decor',a);}
 const p=tr(0,8.45,R);box(35.5,.26,.22,...p,'stone','Base',a);
}
// Railing: stone square posts, open balusters, three horizontal members.
function rail(a,b,stone=true,group='Railings',height=1){const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av),len=v.length(),m=stone?'stone':'red',n=Math.ceil(len/1.8);for(let i=0;i<=n;i++){const q=av.clone().addScaledVector(v,i/n);box(.18,height,.18,q.x,q.y+height/2,q.z,m,group);if(stone)ball(.14,.13,.14,q.x,q.y+height+.02,q.z,m,group);}for(const h of [.18,.5,.94])beam([a[0],a[1]+h,a[2]],[b[0],b[1]+h,b[2]],.09,.09,m,group);for(let i=0;i<n*4;i++){const q=av.clone().addScaledVector(v,(i+.5)/(n*4));box(.055,.4,.055,q.x,q.y+.7,q.z,m,group);}}
for(let s=0;s<4;s++){let a=s*Math.PI/2,tr=(x,z)=>[Math.cos(a)*x+Math.sin(a)*z,8.76,-Math.sin(a)*x+Math.cos(a)*z];if(s===0){rail(tr(-17,-17),tr(-2,-17));rail(tr(2,-17),tr(17,-17));}else rail(tr(-17,-17),tr(17,-17));}
// Attached paired exterior stairs, both rising from the east/west to central northern landing.
for(const sign of [-1,1]){const run=13.2,n=48;for(let i=0;i<n;i++){let h=(i+1)*8.6/n;box(run/n,8.6/n,2.1,sign*(run-(i+.5)*run/n),h-4.3/n,-18.8,'stone','StairsExterior');}beam([sign*13.2,.15,-18.8],[0,8.45,-18.8],.28,2.1,'stone','StairsExterior');rail([sign*13.2,.15,-17.7],[0,8.75,-17.7],true,'StairsExterior');rail([sign*13.2,.15,-19.9],[0,8.75,-19.9],true,'StairsExterior');}box(2,.24,4.3,0,8.48,-17.75,'brick','StairsExterior');
box(22.3,.3,22.3,0,8.75,0,'stone','Base');
// Columns, bases and collars; first floor count is exactly 44.
function column(x,z,h,diam,kind,foot=8.9){cyl(diam*.95/2,diam/2,h,x,foot+h/2,z,'red','Columns');cyl(diam*.72,diam*.8,.25,x,foot+.08,z,'stone','Columns',16);box(diam*1.9,.17,diam*1.9,x,foot-.05,z,'stone','Columns');cyl(diam*.56,diam*.56,.13,x,foot+.26,z,'gold','Decor');if(kind)counts[kind]++;}
for(const x of [-4,4])for(const z of [-4,4])column(x,z,17.4,.72,'inner');
for(const x of [-8.32,-4,4,8.32])for(const z of [-8.32,-4,4,8.32])if(Math.abs(x)===8.32||Math.abs(z)===8.32)column(x,z,8.158,.62,'outer');
const ring=[-10.72,-8.32,-4,4,8.32,10.72];for(const x of ring)for(const z of ring)if(Math.abs(x)===10.72||Math.abs(z)===10.72)column(x,z,4.12,.5,'eave');
for(let s=0;s<4;s++){let a=s*Math.PI/2;for(const x of [-6.16,6.16]){box(.35,4.12,.35,Math.cos(a)*x+Math.sin(a)*10.72,10.96,-Math.sin(a)*x+Math.cos(a)*10.72,'red','Columns');counts.square++;}}
for(const x of [-8.32,-4,4,8.32])for(const z of [-8.32,-4,4,8.32])if(Math.abs(x)===8.32||Math.abs(z)===8.32)column(x,z,5.543,.54,null,17.1);
for(const x of ring)for(const z of ring)if(Math.abs(x)===10.72||Math.abs(z)===10.72)column(x,z,2.544,.347,null,17.1);
// Lower beams, upper frame, and balcony. Beam UVs are adjusted at export for ornamental bands.
for(const y of [12.65,16.45,19.25,22.25])for(let s=0;s<4;s++){const a=s*Math.PI/2,half=y===22.25?8.32:10.72;box(half*2,.44,.36,Math.sin(a)*half,y,Math.cos(a)*half,'paint','Beams',a);box(half*2,.09,.46,Math.sin(a)*half,y+.26,Math.cos(a)*half,'gold','Beams',a);}
for(const y of [16.45,22.25,25.9])for(const z of [-4,4]){box(y===25.9?8:16.64,.52,.4,0,y,z,'paint','Beams');box(.4,.52,y===25.9?8:16.64,z,y,0,'paint','Beams');}
slabHole(16.98);for(let s=0;s<4;s++){let a=s*Math.PI/2;box(21.44,.24,2.4,Math.sin(a)*9.52,16.98,Math.cos(a)*9.52,'wood','Floors',a);const tr=(x,z)=>[Math.cos(a)*x+Math.sin(a)*z,17.1,-Math.sin(a)*x+Math.cos(a)*z];rail(tr(-10.6,10.6),tr(10.6,10.6),false);}
box(16.64,.1,16.64,0,8.94,0,'wood','Floors');
// Low relief panels and genuinely open wooden lattice for every facade bay.
function relief(x,y,z,a,variant){const tr=(xx,yy,zz)=>[x+Math.cos(a)*xx+Math.sin(a)*zz,y+yy,z-Math.sin(a)*xx+Math.cos(a)*zz];for(let k=0;k<3;k++){const xx=-.29+k*.28,yy=.05+Math.sin(k+variant)*.12;ball(.08,.1,.025,...tr(xx,yy+.19,.07),'red','Doors');shapeExtrude([[-.13,-.15],[.13,-.15],[.07,.15],[-.06,.15]],.028,'red','Doors',...tr(xx,yy-.03,.06),a);}for(let k=0;k<2;k++){const p=[[-.43,-.36,.07],[-.25+k*.08,-.2,.08],[.04,-.25,.08],[.3,.08,.08],[.45,.3,.07]].map(v=>tr(...v));path(p,.018,'gold','Doors',12,4);}}
for(let s=0;s<4;s++){
 const a=s*Math.PI/2,tr=(x,y,z)=>[Math.cos(a)*x+Math.sin(a)*z,y,-Math.sin(a)*x+Math.cos(a)*z];
 for(let floor=0;floor<2;floor++){
  const y0=floor?17.1:8.99,wallH=floor?4.55:6.95;
  for(let k=0;k<16;k++){
   const x=-7.8+k*1.04;
   if(!floor&&Math.abs(x)<1.1)continue;
   let p=tr(x,y0+1.15,8.32);box(.98,2.3,.15,...p,'red','Doors',a);
   p=tr(x,y0+.58,8.43);relief(...p,a,k+s*4);
   for(const dx of [-.48,.48]){p=tr(x+dx,y0+wallH/2,8.32);box(.065,wallH,.16,...p,'red','Doors',a);}
   for(let yy=2.3;yy<wallH;yy+=.28){p=tr(x,y0+yy,8.32);box(.98,.032,.075,...p,'red','Doors',a);}
   for(let xx=-.36;xx<=.4;xx+=.18){p=tr(x+xx,y0+(wallH+2.3)/2,8.32);box(.032,wallH-2.3,.075,...p,'red','Doors',a);}
   for(const yy of [1.1,2.3,wallH]){p=tr(x,y0+yy,8.32);box(.98,.11,.17,...p,'paint','Doors',a);}
  }
 }
}
// Interior winding staircase: three U-turn flights with landings, floor opening above.
const flights=[[[4.95,8.99,1.05],[4.95,11.69,5.25]],[[6.75,11.69,5.25],[6.75,14.39,1.05]],[[4.95,14.39,1.05],[4.95,17.09,5.25]]];
for(const [a,b] of flights){const n=15;for(let i=0;i<n;i++){let t=(i+.5)/n;box(1.2,.12,.30,a[0],a[1]+(i+1)*(b[1]-a[1])/n,a[2]+t*(b[2]-a[2]),'wood','StairsInterior');}for(const dx of [-.5,.5]){beam([a[0]+dx,a[1]-.15,a[2]],[b[0]+dx,b[1]-.15,b[2]],.14,.16,'wood','StairsInterior');rail([a[0]+dx,a[1],a[2]],[b[0]+dx,b[1],b[2]],false,'StairsInterior',.95);}}
box(3,.15,1.2,5.85,11.64,5.8,'wood','StairsInterior');box(3,.15,1.2,5.85,14.34,.6,'wood','StairsInterior');box(1.5,.15,1.65,4.95,16.99,6.12,'wood','StairsInterior');
rail([4.5,17.1,.7],[4.5,17.1,4.4],false,'StairsInterior');rail([7.8,17.1,.7],[7.8,17.1,6.9],false,'StairsInterior');
// First floor painted coffer ceiling, exact opening retained.
for(const [w,d,x,z] of [[12.87,16.64,-1.885,0],[.57,16.64,8.035,0],[3.2,9.02,6.15,-3.81],[3.2,1.42,6.15,7.61]]){
 const g=new T.PlaneGeometry(w,d);g.rotateX(Math.PI/2); // faces down
 const uv=g.getAttribute('uv');const pos=g.getAttribute('position');for(let i=0;i<uv.count;i++)uv.setXY(i,(pos.getX(i)+x+8.32)/16.64,(pos.getZ(i)+z+8.32)/16.64);
 add(g,'ceiling','Ceiling',x,16.78,z);
}
for(let q=-8;q<=8;q+=2){box(.075,.14,16.3,q,16.7,0,'paint','Ceiling');if(q<.7||q>6.9)box(16.3,.14,.075,0,16.7,q,'paint','Ceiling');else box(12.8,.14,.075,-1.92,16.7,q,'paint','Ceiling');}
// Bracket families with stacked bearing blocks, curved gong arms, transverse arms and projecting struts.
function bracket(x,y,z,a,scale,levels,corner=false,group='Brackets'){
 const tr=(xx,yy,zz)=>[x+Math.cos(a)*xx+Math.sin(a)*zz,y+yy,z-Math.sin(a)*xx+Math.cos(a)*zz];
 for(let l=0;l<levels;l++){
  const s=scale,w=(.6+l*.28)*s,yy=l*.23*s,dep=l*.17*s;
  for(const xx of l===0?[0]:[-w*.36,w*.36]){const p=tr(xx,yy,dep);box(.24*s,.17*s,.27*s,...p,'paint',group,a);}
  const pts=[[-w/2,0],[-w/2,.12*s],[-w*.32,.15*s],[-w*.2,.05*s],[w*.2,.05*s],[w*.32,.15*s],[w/2,.12*s],[w/2,0],[w*.2,-.07*s],[-w*.2,-.07*s]];
  shapeExtrude(pts,.12*s,'paint',group,...tr(0,yy+.15*s,dep),a);
  beam(tr(0,yy+.07*s,-.16*s),tr(0,yy+.2*s,dep+.3*s),.12*s,.15*s,'wood',group);
 }
 const p=tr(0,levels*.23*scale,.25*scale);box(1.1*scale,.13*scale,.6*scale,...p,'paint',group,a);
 if(corner)beam(tr(0,0,0),tr(.7*scale,.7*scale,.7*scale),.16*scale,.16*scale,'red',group);
}
for(const [y,half,scale,levels] of [[13.0,10.72,1,3],[15.87,9.55,.9,3],[19.64,10.72,.84,3],[22.7,8.32,1.12,4]]){
 for(let s=0;s<4;s++){let a=s*Math.PI/2,n=Math.round(half*2/1.2);for(let i=0;i<n;i++){let xx=-half+i*2*half/n;const x=Math.cos(a)*xx+Math.sin(a)*half,z=-Math.sin(a)*xx+Math.cos(a)*half;bracket(x,y,z,a,scale,levels,i===0);}}
 for(const sx of [-1,1])for(const sz of [-1,1])bracket(sx*half,y,sz*half,Math.atan2(sx,sz),scale,levels,true);
}
// Roof profiles: curved three eaves; two annular canopies and a single four-sided pyramid.
const roofs=[{name:'RoofLower',o:13.3,i:8.45,y:14.0,rise:2.05,lift:.82},{name:'RoofMiddle',o:12.55,i:8.43,y:20.5,rise:1.75,lift:.74},{name:'RoofUpper',o:12.15,i:0,y:24.4,rise:7.07,lift:1.12}];
function roofPoint(r,u,t,s,under=0){let w=r.o+(r.i-r.o)*t;let y=r.y+r.rise*(.48*t+.52*t*t)+r.lift*Math.pow(Math.abs(u),9)*Math.pow(1-t,3)-under;const a=s*Math.PI/2;return [Math.cos(a)*u*w+Math.sin(a)*w,y,-Math.sin(a)*u*w+Math.cos(a)*w];}
for(const r of roofs){for(let s=0;s<4;s++){
 const nx=68,ny=24,p=[],uv=[],idx=[];for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){let u=-1+2*i/nx,t=j/ny;p.push(...roofPoint(r,u,t,s));uv.push(i/nx*5,j/ny*3);}
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){let a=j*(nx+1)+i,b=a+1,c=a+nx+1,d=c+1;idx.push(a,b,c,b,d,c);}
 let g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();add(g,'green',r.name);
 // underside solid offset curved boards (opposite winding), with closed outer fascia
 const gu=g.clone();gu.translate(0,-.16,0);let gi=gu.index;for(let k=0;k<gi.count;k+=3){let t=gi.getX(k);gi.setX(k,gi.getX(k+1));gi.setX(k+1,t);}gu.computeVertexNormals();add(gu,'wood',r.name);
 // Individually articulated convex barrel tile strips, with transverse lap seams.
 const nt=Math.round(r.o*2/.24);
 for(let i=0;i<=nt;i++){
  let u=-.99+1.98*i/nt;const points=[];const maxT=r.i===0?.985:1;for(let j=0;j<=12;j++)points.push(roofPoint(r,u,j/12*maxT,s,-.05));
  path(points,.065,'green',r.name,18,5);
  const e=roofPoint(r,u,0,s,-.015);ball(.092,.095,.09,...e,'green',r.name);
  if(i%2===0){path(Array.from({length:13},(_,j)=>roofPoint(r,u,j/12*.94,s,.25)),.06,'wood',r.name,12,5);}
 }
 for(let j=1;j<ny;j+=2){const t=j/ny;path(Array.from({length:9},(_,k)=>roofPoint(r,-1+k/4,t,s,-.03)),.026,'green',r.name,8,4);}
 path(Array.from({length:25},(_,k)=>roofPoint(r,-1+k/12,0,s,.1)),.12,'paint',r.name,24,6);
 // hip ridges with gold-green edging and decorative corner dragon heads
 const hip=Array.from({length:15},(_,k)=>roofPoint(r,1,k/14*(r.i===0?.99:1),s,-.14));path(hip,.16,'green',r.name,24,7);
 const e=roofPoint(r,1,0,s,-.18);ball(.16,.2,.38,...e,'green',r.name);
 const a=s*Math.PI/2;path([e,[e[0]+.38*Math.cos(a),e[1]+.35,e[2]-.38*Math.sin(a)],[e[0]+.55*Math.cos(a),e[1]+.6,e[2]-.55*Math.sin(a)]],.09,'green',r.name,8,5);
 // Different beast silhouettes (layout estimated): 3 lower/middle, 5 upper per corner.
 const nb=r.i===0?5:3;for(let k=0;k<nb;k++){const p=roofPoint(r,1,.08+k*.062,s,-.3);beast(p,a+Math.PI/4,k,r.name);}
}}
function beast(p,a,k,group){const tr=(x,y,z)=>[p[0]+Math.cos(a)*x+Math.sin(a)*z,p[1]+y,p[2]-Math.sin(a)*x+Math.cos(a)*z];box(.25,.08,.48,...tr(0,0,0),'green',group,a);ball(.12,.15+k%2*.04,.22,...tr(0,.2,0),'green',group);ball(.1,.12,.12,...tr(0,.35,.16),'green',group);for(const x of [-.08,.08])for(const z of [-.12,.12])cyl(.035,.045,.14,...tr(x,.1,z),'green',group,6);path([tr(0,.21,-.16),tr(0,.34,-.3),tr(0,.43,-.23)],.035,'green',group,6,4);if(k%2===0)for(const x of [-.1,.1])beam(tr(x,.25,0),tr(x*2.4,.43,-.08),.06,.12,'green',group);else for(const x of [-.06,.06])cyl(.005,.04,.14,...tr(x,.47,.16),'gold',group,5);}
// Open upper roof frame: diagonal corner beams and radial rafters.
for(const [h,r] of [[23.2,7.9],[25.9,4],[28.1,2.1]]){
 const pts=[[r,h,r],[-r,h,r],[-r,h,-r],[r,h,-r]];for(let i=0;i<4;i++)beam(pts[i],pts[(i+1)%4],.37,.5,'paint','RoofFrame');
 for(const sx of [-1,1])for(const sz of [-1,1])beam([sx*r,h,sz*r*.5],[sx*r*.5,h,sz*r],.36,.48,'paint','RoofFrame');
}
for(let s=0;s<4;s++)for(let i=0;i<13;i++){const u=-.94+i*1.88/12;path(Array.from({length:13},(_,j)=>roofPoint(roofs[2],u,.25+j/12*.70,s,.4)),.09,'wood','RoofFrame',12,6);}
// Finial: glazed pedestal starts at 31.47, gold section exactly 1.86m, total summit 36.
const profile=[[0,0],[1.12,0],[1.12,.22],[.8,.34],[.75,.65],[.64,.88],[.74,1.1],[.78,1.28],[.62,1.45],[.6,2.25],[.74,2.45],[.55,2.67],[0,2.67]];
add(new T.LatheGeometry(profile.map(p=>new T.Vector2(...p)),32),'green','Finial',0,31.47,0);
const goldprof=[[0,0],[.58,0],[.63,.13],[.44,.26],[.38,.4],[.5,.55],[.52,.8],[.46,1.02],[.27,1.18],[.22,1.34],[.15,1.48],[.12,1.62],[0,1.86]];
add(new T.LatheGeometry(goldprof.map(p=>new T.Vector2(...p)),32),'gold','Finial',0,34.14,0);
for(let i=0;i<12;i++){const a=i*Math.PI/6;beam([Math.cos(a)*.64,32.85,Math.sin(a)*.64],[Math.cos(a)*.64,33.55,Math.sin(a)*.64],.055,.055,'gold','Finial');}
// Export using glTF-Transform from Three.js geometries, fully embedded PBR.
const doc=new Document();const buffer=doc.createBuffer();const scene=doc.createScene('Xi’an Bell Tower — metres');const materialMap={};
for(const name of mats){const tex={};for(const type of ['color','normal','orm'])tex[type]=doc.createTexture(name+'-'+type).setImage(new Uint8Array(fs.readFileSync(`${out}/textures/${name}-${type}.png`))).setMimeType('image/png');const m=doc.createMaterial(name).setBaseColorTexture(tex.color).setNormalTexture(tex.normal).setOcclusionTexture(tex.orm).setMetallicRoughnessTexture(tex.orm).setMetallicFactor(name==='gold'?1:0).setRoughnessFactor(1);for(const info of [m.getBaseColorTextureInfo(),m.getNormalTextureInfo(),m.getOcclusionTextureInfo(),m.getMetallicRoughnessTextureInfo()])info.setWrapS(10497).setWrapT(10497);materialMap[name]=m;}
const nodes={},stats={triangles:0,vertices:0,meshes:0,columns:counts,units:'metres',dimensions:{base:[35.5,8.6,35.5],height:36},approximated:['Stair layout','Bracket node configurations','Roof profiles','Relief motifs','Beast arrangements'],generator:'Three.js geometry + glTF-Transform, cloud Node.js; no Blender'};
for(const [key,geos] of Object.entries(groups)){
 const [group,mat]=key.split('|');
 for(const g of geos){if(!g.index){const n=g.getAttribute('position').count;g.setIndex(Array.from({length:n},(_,i)=>i));}for(const name of Object.keys(g.attributes))if(!['position','normal','uv'].includes(name))g.deleteAttribute(name);}
 const g=mergeGeometries(geos,false);
 const clean=[];const va=new T.Vector3(),vb=new T.Vector3(),vc=new T.Vector3();for(let i=0;i<g.index.count;i+=3){const a=g.index.getX(i),b=g.index.getX(i+1),c=g.index.getX(i+2);va.fromBufferAttribute(g.attributes.position,a);vb.fromBufferAttribute(g.attributes.position,b);vc.fromBufferAttribute(g.attributes.position,c);if(vb.sub(va).cross(vc.sub(va)).lengthSq()>1e-16)clean.push(a,b,c);}g.setIndex(clean);const pos=g.getAttribute('position');const uv=g.getAttribute('uv');
 if(mat==='brick'){for(let i=0;i<uv.count;i++){const n=g.getAttribute('normal');const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i);if(Math.abs(n.getY(i))>.7)uv.setXY(i,x/2.88,z/2.88);else uv.setXY(i,(Math.abs(n.getX(i))>.6?z:x)/2.88,y/2.88);}}
 if(mat==='paint'){for(let i=0;i<uv.count;i++)uv.setY(i,uv.getY(i)/8);}
 g.computeTangents();
 const primitive=doc.createPrimitive().setMaterial(materialMap[mat]);
 for(const [name,semantic,size] of [['position','POSITION',3],['normal','NORMAL',3],['uv','TEXCOORD_0',2],['tangent','TANGENT',4]]){primitive.setAttribute(semantic,doc.createAccessor().setType(size===3?'VEC3':size===4?'VEC4':'VEC2').setArray(new Float32Array(g.getAttribute(name).array)).setBuffer(buffer));}
 primitive.setIndices(doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(g.index.array)).setBuffer(buffer));
 const mesh=doc.createMesh(group+'_'+mat).addPrimitive(primitive);const n=doc.createNode(group+'_'+mat).setMesh(mesh);if(!nodes[group]){nodes[group]=doc.createNode(group);scene.addChild(nodes[group]);}nodes[group].addChild(n);
 stats.triangles+=g.index.count/3;stats.vertices+=pos.count;stats.meshes++;
}
scene.setExtras({units:'m',north:'-Z',east:'+X',accuracy:'Documented overall dimensions; selected local details are interpretive. See model-notes.json.'});
await MeshoptEncoder.ready;await doc.transform(weld(),meshopt({encoder:MeshoptEncoder,level:'medium',quantizePosition:16,quantizeNormal:12,quantizeTexcoord:14}));
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.encoder':MeshoptEncoder});await io.write(`${out}/xian-bell-tower.glb`,doc);stats.vertices=doc.getRoot().listMeshes().reduce((sum,m)=>sum+m.listPrimitives().reduce((s,p)=>s+p.getAttribute('POSITION').getCount(),0),0);stats.bytes=fs.statSync(`${out}/xian-bell-tower.glb`).size;
const result=await validator.validateBytes(new Uint8Array(fs.readFileSync(`${out}/xian-bell-tower.glb`)),{uri:'xian-bell-tower.glb',maxIssues:1000});fs.writeFileSync(`${out}/validation.json`,JSON.stringify(result,null,2));stats.validation={errors:result.issues.numErrors,warnings:result.issues.numWarnings};fs.writeFileSync(`${out}/model-notes.json`,JSON.stringify(stats,null,2));console.log(stats);
if(result.issues.numErrors)process.exitCode=1;
