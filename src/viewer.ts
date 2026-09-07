import * as T from 'three';
import { publicAsset } from './public-asset';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {MeshoptDecoder} from 'three/addons/libs/meshopt_decoder.module.js';
export type ViewerAPI={camera:(k:string)=>void,set:(key:string,v:boolean)=>void,explode:(v:number)=>void,orbit:()=>void,zoom:(factor:number)=>void,reset:()=>void,dispose:()=>void};
type Hooks={onLoad:()=>void,onProgress:(v:number)=>void,onError:(v:string)=>void};
export async function createViewer(host:HTMLDivElement,hooks:Hooks):Promise<ViewerAPI>{
 const scene=new T.Scene();const camera=new T.PerspectiveCamera(39,1,.05,600);camera.position.set(47,33,52);
 const renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;host.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','可交互的西安钟楼3D模型');renderer.domElement.tabIndex=0;
 // Transparent rendering keeps the stage continuous with the page, in both themes.
 renderer.setClearColor(0x000000,0);
 const pmrem=new T.PMREMGenerator(renderer);const env=new RoomEnvironment();const envMap=pmrem.fromScene(env,.04);scene.environment=envMap.texture;scene.environmentIntensity=.65;env.dispose();pmrem.dispose();
 const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,15.5,0);controls.enableDamping=true;controls.dampingFactor=.075;controls.minDistance=.35;controls.maxDistance=155;controls.maxPolarAngle=Math.PI*.98;controls.autoRotateSpeed=.45;
 const hemi=new T.HemisphereLight('#fffaf2','#b9a995',1.6);scene.add(hemi);
 const sun=new T.DirectionalLight('#fff5df',2.6);sun.position.set(28,58,35);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-30,right:30,top:40,bottom:-35,near:1,far:130});sun.shadow.normalBias=.05;sun.shadow.bias=-.00008;scene.add(sun);
 const fill=new T.DirectionalLight('#e8efe8',.9);fill.position.set(-35,25,-25);scene.add(fill);
 const indoor:T.PointLight[]=[];for(const y of [12.5,20,27]){const p=new T.PointLight('#fff0d7',90,24,1.6);p.position.set(0,y,0);scene.add(p);indoor.push(p);}
 const nightGroup=new T.Group();for(const x of [-14,14])for(const z of [-14,14]){const l=new T.SpotLight('#ffc270',1800,65,.7,.8,1.5);l.position.set(x,9,z);l.target.position.set(0,22,0);nightGroup.add(l,l.target);}nightGroup.visible=false;scene.add(nightGroup);
 const ground=new T.Mesh(new T.PlaneGeometry(500,500),new T.ShadowMaterial({color:'#594c3b',opacity:.16,depthWrite:false}));ground.rotation.x=-Math.PI/2;ground.position.y=-.1;ground.receiveShadow=true;scene.add(ground);
 const dimGroup=new T.Group();const dm=new T.LineBasicMaterial({color:'#d9b071'});function line(p:number[][]){dimGroup.add(new T.Line(new T.BufferGeometry().setFromPoints(p.map(v=>new T.Vector3(...v))),dm));}
 line([[-17.75,.18,21],[-17.75,.18,23],[-17.75,.18,22],[17.75,.18,22],[17.75,.18,21],[17.75,.18,23]]);line([[22,0,0],[24,0,0],[23,0,0],[23,36,0],[22,36,0],[24,36,0]]);scene.add(dimGroup);dimGroup.visible=false;
 const labels:[HTMLDivElement,T.Vector3][]=[];for(const [txt,p] of [['35.50 m',[0,.4,22]],['36.00 m',[23,18,0]]] as [string,number[]][]){const el=document.createElement('div');el.className='dimension-label';el.textContent=txt;el.style.position='absolute';el.style.pointerEvents='none';el.style.display='none';host.appendChild(el);labels.push([el,new T.Vector3(...p)]);}
 let model:T.Group|undefined,disposed=false,raf=0,tween:null|{fromP:T.Vector3,fromT:T.Vector3,toP:T.Vector3,toT:T.Vector3,start:number}=null;
 const poses:Record<string,[number[],number[]]>={overall:[[47,33,52],[0,15.5,0]],front:[[0,24,80],[0,16,0]],back:[[0,24,-80],[0,16,0]],side:[[80,24,0],[0,16,0]],top:[[0,86,.01],[0,10,0]],hall:[[0,11.7,6.4],[0,15.1,-2.6]],upper:[[1.2,19.2,6.5],[0,27,0]],stairs:[[2,12.8,.1],[6.1,13.6,3.8]],vault:[[0,2.5,14.3],[0,4.2,-7]],bracket:[[16.7,14.7,16.7],[10.2,13.8,10.2]],finial:[[6,35.7,7],[0,33.7,0]]};
 let overview=true;
 const overviewMeshes:T.Mesh[]=[];
 function fitOverview(apply=false){
  if(!overviewMeshes.length)return;
  const target=new T.Vector3(0,13,0),direction=new T.Vector3(47,24,52).normalize();
  const right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),direction).normalize();
  const up=new T.Vector3().crossVectors(direction,right);
  const tanV=Math.tan(T.MathUtils.degToRad(camera.fov/2))*.94,tanH=tanV*camera.aspect;
  let distance=0;
  const offset=new T.Vector3();
  // Fit actual vertices: bounding-box corners include empty space above the roofs.
  for(const mesh of overviewMeshes){const positions=mesh.geometry.getAttribute('position');for(let i=0;i<positions.count;i++){offset.fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld).sub(target);const depth=offset.dot(direction);distance=Math.max(distance,Math.abs(offset.dot(right))/tanH+depth,Math.abs(offset.dot(up))/tanV+depth);}}
  const position=target.clone().addScaledVector(direction,distance);
  poses.overall=[position.toArray(),target.toArray()];
  if(apply){camera.position.copy(position);controls.target.copy(target);controls.update();}
 }
 function move(k:string){overview=k==='overall';if(overview)fitOverview();const p=poses[k]??poses.overall;tween={fromP:camera.position.clone(),fromT:controls.target.clone(),toP:new T.Vector3(...p[0]),toT:new T.Vector3(...p[1]),start:performance.now()};controls.autoRotate=false;}
 controls.addEventListener('start',()=>{tween=null;overview=false;});
 function set(key:string,v:boolean){if(key==='roofs')model?.children.filter(n=>n.name.startsWith('Roof')&&n.name!=='RoofFrame'||n.name==='Finial').forEach(n=>n.visible=v);if(key==='doors')model?.getObjectByName('Doors')?.traverse(n=>n.visible=v);if(key==='spin')controls.autoRotate=v;if(key==='dimensions'){dimGroup.visible=v;labels.forEach(([e])=>e.style.display=v?'block':'none');}if(key==='night'){nightGroup.visible=v;hemi.intensity=v?.55:1.6;sun.intensity=v?.25:2.6;fill.intensity=v?.5:.9;scene.environmentIntensity=v?.22:.65;renderer.toneMappingExposure=v?1.45:1.05;}}
 function explode(v:number){if(!model)return;for(const n of model.children){const factor=n.name==='RoofUpper'||n.name==='Finial'?16:n.name==='RoofMiddle'?10:n.name==='RoofLower'?5:0;n.position.y=v/100*factor;}}
 const loader=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);loader.load(publicAsset('model/xian-bell-tower.glb'),g=>{if(disposed)return;model=g.scene;model.traverse(n=>{if(n instanceof T.Mesh){n.castShadow=true;n.receiveShadow=true;for(const value of Array.isArray(n.material)?n.material:[n.material]){const m=value as T.MeshStandardMaterial;for(const tex of [m.map,m.normalMap,m.roughnessMap,m.metalnessMap,m.aoMap])if(tex)tex.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());}}});scene.add(model);model.updateMatrixWorld(true);model.traverse(n=>{if(n instanceof T.Mesh)overviewMeshes.push(n);});fitOverview(true);hooks.onLoad();},e=>{if(e.total)hooks.onProgress(Math.round(e.loaded/e.total*100));},()=>hooks.onError('请检查网络后重新加载。'));
 function resize(){const {width,height}=host.getBoundingClientRect();if(width<=0||height<=0)return;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();if(overview){tween=null;fitOverview(true);}}const ro=new ResizeObserver(resize);ro.observe(host);resize();
 function frame(t:number){raf=requestAnimationFrame(frame);if(tween){const x=Math.min((t-tween.start)/850,1),s=x*x*(3-2*x);camera.position.lerpVectors(tween.fromP,tween.toP,s);controls.target.lerpVectors(tween.fromT,tween.toT,s);if(x===1)tween=null;}controls.update();for(const [e,v] of labels){if(dimGroup.visible){const p=v.clone().project(camera);e.style.left=(p.x*.5+.5)*host.clientWidth+'px';e.style.top=(-p.y*.5+.5)*host.clientHeight+'px';e.style.transform='translate(-50%,-50%)';e.style.visibility=p.z>1?'hidden':'visible';}}renderer.render(scene,camera);}raf=requestAnimationFrame(frame);
 return {camera:move,set,explode,orbit(){controls.autoRotate=!controls.autoRotate;},zoom(factor:number){overview=false;tween=null;const offset=camera.position.clone().sub(controls.target).multiplyScalar(factor);camera.position.copy(controls.target).add(offset);controls.update();},reset(){set('roofs',true);set('doors',true);set('dimensions',false);set('night',false);set('spin',false);explode(0);move('overall');},dispose(){disposed=true;cancelAnimationFrame(raf);ro.disconnect();controls.dispose();scene.traverse(n=>{if(n instanceof T.Mesh){n.geometry.dispose();const ms=Array.isArray(n.material)?n.material:[n.material];for(const m of ms)m.dispose();}});envMap.dispose();renderer.dispose();host.replaceChildren();}};
}
