/* Presentation adapter. Game legality, turns, decks and combat stay in index.html. */
import * as THREE from 'three';
import { orientBoardModel } from './model-facing.js?v=20261103-v73';
import { createEmberlands } from './ember-v239.js?v=20261208-v260';
import { applyLook } from './variant-look.js?v=20261113-v215';
import { createLake } from './lake-v241.js?v=20261122-v241';
import { createSkyIsland } from './sky-v231.js?v=20261128-v247';
import { createWindHighlands } from './wind-v232.js?v=20261123-v242';
import { createWoodland } from './woodland-v238.js?v=20261119-v238';
import { createCombatFx, attackStyle } from './combat-fx-v244.js?v=20261125-v244';
import { createFrostRoad } from './frost-v240.js?v=20261223-v288';
import { createCity } from './city-v246.js?v=20261128-v247';
import { createCave } from './cave-v246.js?v=20261223-v288';
import { createAutumn } from './autumn-v253.js?v=20261202-v253';
import { createNoel } from './noel-v253.js?v=20261202-v253';
import { createElementWheel } from './element-wheel-v252.js?v=20261223-v288';

const game=window.hackeniaGame, BH=game.rows||10, HZ=(BH-1)/2, ZS=BH/10, host=document.getElementById('bw'),homeParent=host.parentElement,homeNextSibling=host.nextElementSibling;
let previewMode=false,previewTerrain=null;
try { initClearing(); } catch(error) {
  console.warn('Clairière 3D indisponible, affichage de secours conservé.',error);
  host.classList.remove('view3d');
  document.getElementById('terrain-status').textContent='Affichage de secours · terre +1';
}
function initClearing(){
const canvas=document.createElement('canvas');canvas.id='landscape';canvas.setAttribute('aria-label','Plateau 3D du Bois tendre, huit colonnes et douze lignes');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});}catch{renderer=new LandscapeCanvasRenderer(canvas);}
renderer.setClearColor(0x172c25,1);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.prepend(canvas);
// Copy the freshly rendered placement to a separate overlay, above the finger.
const placementLens=document.createElement('aside');placementLens.id='placement-lens';placementLens.hidden=true;placementLens.setAttribute('aria-label','Loupe de placement');
const lensCanvas=document.createElement('canvas');lensCanvas.width=lensCanvas.height=320;const lensContext=lensCanvas.getContext('2d'),lensCaption=document.createElement('div');lensCaption.id='placement-lens-caption';placementLens.append(lensCanvas,lensCaption);document.body.append(placementLens);let lensPoint=null;
function updateLens(point){lensPoint=point?{x:point.x,y:point.y}:null}
function drawPlacementLens(){
 const point=lensPoint||(state.mode==='p'?state.pc:null),allowed=active&&!state.over&&(!state.ai||state.cur===0)&&(state.mode==='p'||state.mode==='d')&&point;
 placementLens.hidden=!allowed;if(!allowed)return;
 const r=canvas.getBoundingClientRect(),c=state.b[point.y]?.[point.x],level=.24+(c&&!c.f?.28:0),project=(x,y,z)=>{const p=world.localToWorld(new THREE.Vector3(x,y,z)).project(camera);return{x:(p.x+1)*r.width/2,y:(1-p.y)*r.height/2}};
 const focus=project(point.x-3.5,level+.25,point.y-HZ),points=[];
 const preview=state.preview.length?state.preview:[[point.x,point.y]];
 for(const [x,y]of preview){if(x<0||x>=8||y<0||y>=BH)continue;for(const dx of[-.5,.5])for(const dz of[-.5,.5])points.push(project(x-3.5+dx,level,y-HZ+dz))}
 // v227 — Le dé flottant fait partie du cadrage : la loupe centre ensemble le dé et ses dalles.
 if(state.mode==='p'&&dieGroup.visible)for(const dx of[-.35,.35])for(const dz of[-.35,.35])for(const dy of[.6,1.3])points.push(project(point.x-3.5+dx,dy,point.y-HZ+dz));
 const size=points.length?Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x)):50,sy=points.length?Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y)):50;
 const crop=Math.max(70,Math.min(Math.min(r.width,r.height)*.95,Math.max(size,sy)*1.3)),/* v236 : la loupe s'agrandit pour toujours contenir le dé et toutes ses dalles (zoom, bord de zone) */centerX=points.length?(Math.max(...points.map(p=>p.x))+Math.min(...points.map(p=>p.x)))/2:focus.x,centerY=points.length?(Math.max(...points.map(p=>p.y))+Math.min(...points.map(p=>p.y)))/2:focus.y;
 const left=Math.max(0,Math.min(r.width-crop,centerX-crop/2)),top=Math.max(0,Math.min(r.height-crop,centerY-crop/2)),scale=canvas.width/r.width;
 lensContext.fillStyle='#20392c';lensContext.fillRect(0,0,320,320);lensContext.drawImage(canvas,left*scale,top*scale,crop*scale,crop*scale,0,0,320,320);
 const fx=(focus.x-left)/crop*320,fy=(focus.y-top)/crop*320;lensContext.strokeStyle='#fff0ba';lensContext.lineWidth=2;lensContext.setLineDash([5,4]);lensContext.strokeRect(fx-17,fy-17,34,34);lensContext.setLineDash([]);
 lensCaption.textContent=state.valid?'Placement valide':'Placement impossible';placementLens.dataset.valid=String(state.valid);
 // Move aside if the placement itself is near the upper-left corner.
 placementLens.classList.toggle('right',r.left+focus.x<190&&r.top+focus.y<220);
}

const navigation=document.createElement('div');navigation.id='board-navigation';navigation.setAttribute('role','group');navigation.setAttribute('aria-label','Vue du plateau');
navigation.innerHTML='<button type="button" id="zoom-out" aria-label="Dézoomer le plateau" title="Dézoomer">−</button><output id="zoom-level" aria-live="polite">110 %</output><button type="button" id="zoom-in" aria-label="Zoomer le plateau" title="Zoomer">+</button><button type="button" id="pan-view" aria-label="Déplacer la vue" aria-pressed="false" title="Déplacer la vue : active puis fais glisser le terrain">✥</button><button type="button" id="reset-view" aria-label="Vue entière du plateau" title="Vue entière">⌖</button><button type="button" id="orbit-view" aria-label="Tourner la caméra" aria-pressed="false" title="Tourner autour du plateau : active puis fais glisser">⟳</button><button type="button" id="pan-arrows-toggle" aria-label="Afficher les flèches de déplacement" aria-expanded="false" title="Flèches de déplacement">▦</button><div class="board-pan-pad" aria-label="Explorer le plateau"><button type="button" data-pan="up" title="Vers le haut">↑</button><button type="button" data-pan="left" title="Vers la gauche">←</button><button type="button" data-pan="down" title="Vers le bas">↓</button><button type="button" data-pan="right" title="Vers la droite">→</button></div>';
host.append(navigation);
const panStyle=document.createElement('style');panStyle.textContent='#board-navigation #orbit-view[aria-pressed=true]{background:#5b7251;color:#fff2bf;box-shadow:0 0 0 1px #e1c781}canvas.orbiting{cursor:grab}canvas.orbiting:active{cursor:grabbing}#board-navigation{display:flex;align-items:center;gap:5px;flex-wrap:wrap;max-width:min(96%,540px)}#board-navigation .board-pan-pad{display:grid;grid-template-columns:repeat(3,25px);grid-template-rows:repeat(3,23px);gap:1px;margin-left:5px;border-left:1px solid #c6b68a55;padding-left:9px}#board-navigation .board-pan-pad button{font-size:15px;line-height:1;min-width:25px;width:25px;height:23px;padding:0;border:1px solid #bba97955;border-radius:5px;background:#17362ce8;color:#eadab1;cursor:pointer}#board-navigation .board-pan-pad button:hover{background:#3e624b}#board-navigation .board-pan-pad [data-pan=up]{grid-column:2;grid-row:1}#board-navigation .board-pan-pad [data-pan=left]{grid-column:1;grid-row:2}#board-navigation .board-pan-pad [data-pan=down]{grid-column:2;grid-row:3}#board-navigation .board-pan-pad [data-pan=right]{grid-column:3;grid-row:2}@media(max-width:600px){#board-navigation{max-width:100%;gap:3px}#board-navigation .board-pan-pad{margin-left:0;padding-left:4px}}';document.head.append(panStyle);


let combatFocus=0;const combatCenter=new THREE.Vector3();
let zoom=1.1,panX=0,panY=0,panEnabled=false,panDrag=null,viewSpan=9,viewAspect=1,orbitYaw=Math.atan2(8,16),orbitPitch=Math.atan2(15,Math.hypot(8,16));

const scene=new THREE.Scene(),world=new THREE.Group();scene.add(world);scene.fog=new THREE.Fog(0x304d3d,25,58);
const camera=new THREE.OrthographicCamera(-10,10,10,-10,.1,100);camera.position.set(8,15,16);camera.lookAt(0,0,0);
const sky=new THREE.HemisphereLight(0xe9f0d5,0x3c5034,2.3);scene.add(sky);
const sun=new THREE.DirectionalLight(0xffe1a0,3.1);sun.position.set(-7,14,6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-11,right:11,top:11,bottom:-11,near:1,far:40});sun.shadow.bias=-.001;sun.shadow.normalBias=.035;scene.add(sun);
let seed=73491;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.92,...extra});
// Small seamless procedural materials: no additional downloads.
function surfaceTexture(kind,repeat=1){
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');
 ctx.fillStyle=kind==='bark'?'#aa9479':kind==='leaves'?'#b6be97':'#c0c0b1';ctx.fillRect(0,0,256,256);
 if(kind==='bark'){
  for(let i=0;i<160;i++){const x=rand()*256;ctx.strokeStyle=i%3?'#4e443b55':'#e2c39b66';ctx.lineWidth=.5+rand()*2;ctx.beginPath();ctx.moveTo(x,0);for(let y=0;y<=256;y+=16)ctx.lineTo(x+Math.sin(y*.055+i)*2,y);ctx.stroke()}
 }else{
  for(let i=0;i<(kind==='leaves'?1800:5000);i++){const x=rand()*256,y=rand()*256;ctx.fillStyle=kind==='leaves'?(i%3?'#475b2d66':'#eff0bb77'):(i%3?'#454e4a40':'#f0e9d84d');
   if(kind==='leaves'){ctx.beginPath();ctx.ellipse(x,y,.9+rand()*1.2,2+rand()*2,rand()*3,0,7);ctx.fill()}else ctx.fillRect(x,y,.5+rand()*1.3,.5+rand()*1.3);
  }
 }
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(repeat,repeat);texture.anisotropy=4;texture.userData.pixels=ctx.getImageData(0,0,256,256).data;return texture;
}
const stoneTex=surfaceTexture('stone',2),barkTex=surfaceTexture('bark'),leavesTex=surfaceTexture('leaves',2);
const stone=mat(0x92948b,{map:stoneTex,bumpMap:stoneTex,bumpScale:.045,vertexColors:true}),darkStone=mat(0x6e7972,{map:stoneTex,bumpMap:stoneTex,bumpScale:.04,vertexColors:true}),wood=mat(0x75604b,{map:barkTex,bumpMap:barkTex,bumpScale:.07}),leafMats=[0x56733c,0x6d8343,0x3c633b,0x83984e].map(color=>mat(color,{map:leavesTex,bumpMap:leavesTex,bumpScale:.035,vertexColors:true})),gold=mat(0xd8bd79,{metalness:.55,roughness:.4});
const sphere=new THREE.IcosahedronGeometry(1,1),box=new THREE.BoxGeometry(1,1,1);
function mesh(geo,material,parent=world){const m=new THREE.Mesh(geo,material);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
function organicGeometry(type,variation){
 const geo=new THREE.SphereGeometry(1,type==='rock'?10:12,type==='rock'?7:9),pos=geo.attributes.position,cols=[];
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),y=pos.getY(i),z=pos.getZ(i),n=Math.sin(x*5.2+variation)*Math.cos(z*4.1-y*3.7)+Math.sin(y*7+z*2.1)*.35;
  const scale=1+n*(type==='rock'?.13:.085);pos.setXYZ(i,x*scale,y*scale,z*scale);
  const color=type==='rock'?new THREE.Color(0xc0c0b4):new THREE.Color(0xffffff);
  if(type==='rock'&&y>.3&&Math.sin(x*6+z*4+variation)>.1)color.lerp(new THREE.Color(0x738255),.35);
  color.multiplyScalar(type==='rock'?.88+n*.08:.84+Math.max(0,y)*.18+n*.09);cols.push(color.r,color.g,color.b);
 }
 geo.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));geo.computeVertexNormals();return geo;
}
const rockShapes=[0,1.7,3.8,5.4].map(v=>organicGeometry('rock',v)),crownShapes=[0,2,4].map(v=>organicGeometry('crown',v));
function rock(x,z,size=.4){
 const m=mesh(rockShapes[Math.floor(rand()*rockShapes.length)],rand()>.28?stone:darkStone),flatten=.28+rand()*.22;
 m.position.set(x,height(x,z)+size*flatten*.38,z);m.scale.set(size*(.9+rand()*.3),size*flatten,size*(.6+rand()*.45));m.rotation.set((rand()-.5)*.3,rand()*6,(rand()-.5)*.25);return m;
}
const river=x=>.45+Math.sin(x*.48)*.8+Math.sin(x*1.1)*.15;
function height(x,z){
 const d=Math.abs(z-river(x)),edge=Math.max(0,Math.abs(x)-4.1,Math.abs(z)-5.1),land=.05+Math.sin(x*1.7+z*.7)*.035+Math.sin(z*2.4)*.025+Math.min(edge,1.7)*(.16+.08*Math.sin(x+z));
 // Cut the channel through the raised perimeter too: land must never dam the water.
 const bed=-.24+Math.sin(x*1.4)*.008;return THREE.MathUtils.lerp(bed,land,THREE.MathUtils.smoothstep(d,.78,1.4));
}
function waterHeight(x,z,t){return -.045+Math.sin(x*3.2+z*2.2-t*1.8)*.014+Math.sin(x*6.7-z*3.3-t*2.5)*.006}
// Layered meadow colours: moss, dry grass and a narrow, worn footpath.
function groundNoise(x,z){
 const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,u=fx*fx*(3-2*fx),v=fz*fz*(3-2*fz),hash=(a,b)=>{const n=Math.sin(a*127.1+b*311.7)*43758.5453;return n-Math.floor(n)};
 return THREE.MathUtils.lerp(THREE.MathUtils.lerp(hash(ix,iz),hash(ix+1,iz),u),THREE.MathUtils.lerp(hash(ix,iz+1),hash(ix+1,iz+1),u),v);
}
const meadowCanvas=document.createElement('canvas');meadowCanvas.width=meadowCanvas.height=256;const meadowCtx=meadowCanvas.getContext('2d');meadowCtx.fillStyle='#d6d4b7';meadowCtx.fillRect(0,0,256,256);
for(let i=0;i<14000;i++){const x=rand()*256,y=rand()*256;meadowCtx.strokeStyle=i%4?'#6e805932':'#fff4c54d';meadowCtx.lineWidth=.35+rand()*.5;meadowCtx.beginPath();meadowCtx.moveTo(x,y);meadowCtx.lineTo(x+(rand()-.5)*2,y-1-rand()*3);meadowCtx.stroke()}
const meadowTexture=new THREE.CanvasTexture(meadowCanvas);meadowTexture.colorSpace=THREE.SRGBColorSpace;meadowTexture.wrapS=meadowTexture.wrapT=THREE.RepeatWrapping;meadowTexture.repeat.set(9,10);meadowTexture.anisotropy=4;meadowTexture.userData.pixels=meadowCtx.getImageData(0,0,256,256).data;
const ground=new THREE.PlaneGeometry(14,15,80,86);ground.rotateX(-Math.PI/2);
const gp=ground.attributes.position,colors=[];
for(let i=0;i<gp.count;i++){
 const x=gp.getX(i),z=gp.getZ(i),d=Math.abs(z-river(x));gp.setY(i,height(x,z));
 const broad=groundNoise(x*.48+3,z*.48+8),detail=groundNoise(x*1.4-7,z*1.4+2),c=new THREE.Color(0x5d8049);
 c.lerp(new THREE.Color(0xa0a267),THREE.MathUtils.smoothstep(broad,.43,.78)*.72);c.lerp(new THREE.Color(0x345b3f),(1-THREE.MathUtils.smoothstep(detail,.24,.64))*.52);
 const trail=Math.abs(x-(Math.sin(z*.62)*.65+.55)),path=(1-THREE.MathUtils.smoothstep(trail,.12,.48))*(.5+detail*.25);c.lerp(new THREE.Color(0xaaa07b),path);
 const shore=1-THREE.MathUtils.smoothstep(d,.85,1.25);c.lerp(new THREE.Color(0x9c9a73),shore*.24);if(d<.85)c.lerp(new THREE.Color(0x667b70),1-THREE.MathUtils.smoothstep(d,.48,.85));
 c.multiplyScalar(.98+(detail-.5)*.1);colors.push(c.r,c.g,c.b);
}
ground.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));ground.computeVertexNormals();mesh(ground,mat(0xffffff,{vertexColors:true,map:meadowTexture,bumpMap:meadowTexture,bumpScale:.035}));
// A crafted rectangular tray replaces the protruding polygonal island base.
const frameStart=world.children.length;
const frameWood=mat(0x493327,{map:barkTex,bumpMap:barkTex,bumpScale:.035,roughness:.65}),frameDark=mat(0x251f1a,{roughness:.7}),frameBronze=mat(0xb3a16a,{metalness:.65,roughness:.4});
const beamX=new THREE.BoxGeometry(1,1,1,30,1,1),beamZ=new THREE.BoxGeometry(1,1,1,1,1,30);
function frameBeam(x,y,z,w,h,d,material){const m=mesh(w>d?beamX:beamZ,material);m.position.set(x,y,z);m.scale.set(w,h,d);return m}
// Front and rear rails: dark sidewall, moulded wood cap, fine metal inlay.
for(const z of[-7.57,7.57]){
 frameBeam(0,-.36,z,14.7,1.55,.42,frameWood);frameBeam(0,.45,z,14.78,.12,.53,frameDark);frameBeam(0,.54,z,14.75,.1,.47,frameWood);frameBeam(0,.598,z,14.76,.025,.035,frameBronze);for(const edge of[-.16,.16])frameBeam(0,.598,z+edge,14.76,.014,.014,frameBronze);
 frameBeam(0,-1.16,z,14.82,.14,.54,frameDark);
}
// Keep an opening at each side for the river; its outlet remains visible.
for(const x of[-7.08,7.08]){
 const center=river(x<0?-7:7),low=-7.36,high=7.36,opening=.85;
 for(const [a,b]of[[low,center-opening],[center+opening,high]]){
  const z=(a+b)/2,d=b-a;frameBeam(x,-.36,z,.42,1.55,d,frameWood);frameBeam(x,.45,z,.53,.12,d,frameDark);frameBeam(x,.54,z,.47,.1,d,frameWood);frameBeam(x,.598,z,.035,.025,d,frameBronze);for(const edge of[-.16,.16])frameBeam(x+edge,.598,z,.014,.014,d,frameBronze);
 }
 frameBeam(x,-1.16,0,.54,.14,15.28,frameDark);
 // Recessed spillway backing and bronze fittings finish the opening cleanly.
 frameBeam(x<0?-6.985:6.985,-.66,center,.025,1.08,1.7,frameDark);
 for(const z of[center-opening,center+opening])frameBeam(x,-.32,z,.48,1.62,.045,frameBronze);
}
for(const x of[-7.08,7.08])for(const z of[-7.57,7.57]){
 frameBeam(x,.545,z,.53,.13,.53,frameBronze);const pin=mesh(new THREE.CylinderGeometry(.055,.055,.024,10),gold);pin.position.set(x,.635,z);const inset=frameBeam(x,.62,z,.28,.025,.28,frameDark),gem=frameBeam(x,.644,z,.13,.025,.13,frameBronze);gem.rotation.y=Math.PI/4;for(const dx of[-.17,.17])for(const dz of[-.17,.17]){const rivet=mesh(new THREE.CylinderGeometry(.021,.021,.018,7),gold);rivet.position.set(x+dx,.627,z+dz);}
}
// Restrained botanical engraving on the wood apron.
const engravingPoints=[];
function engraveVine(map){
 for(const direction of[-1,1])for(let i=0;i<28;i++){const u=i/28,v=(i+1)/28;engravingPoints.push(map(direction*u*2.2,-.3+Math.sin(u*6.28)*.09),map(direction*v*2.2,-.3+Math.sin(v*6.28)*.09));}
 for(const direction of[-1,1])for(let i=1;i<6;i++){const x=direction*i*.32,y=-.3+Math.sin(i*.32/2.2*6.28)*.09;for(const side of[-1,1]){engravingPoints.push(map(x,y),map(x+direction*.12,y+side*.1),map(x+direction*.12,y+side*.1),map(x+direction*.22,y+side*.07),map(x+direction*.22,y+side*.07),map(x,y));}}
}
for(const z of[-7.786,7.786])engraveVine((x,y)=>new THREE.Vector3(x,y,z));
for(const x of[-7.296,7.296])for(const center of[-4.6,4.6])engraveVine((z,y)=>new THREE.Vector3(x,y,center+z));
world.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(engravingPoints),new THREE.LineBasicMaterial({color:0xb19c67,transparent:true,opacity:.7})));
const boardFrame=new THREE.Group();for(const part of world.children.slice(frameStart)){world.remove(part);boardFrame.add(part)}world.add(boardFrame);
// Narrow ribbons follow the banks exactly, avoiding triangular colour bands.
for(const side of[-1,1]){
 const bankGeo=new THREE.PlaneGeometry(14,.52,100,4);bankGeo.rotateX(-Math.PI/2);const p=bankGeo.attributes.position,c=[];
 for(let i=0;i<p.count;i++){const x=p.getX(i),u=(p.getZ(i)+.26)/.52,z=river(x)+side*(.72+u*.52);p.setXYZ(i,x,Math.max(-.095,height(x,z))+.014,z);const color=new THREE.Color(0xa1a58a).lerp(new THREE.Color(0x526b42),THREE.MathUtils.smoothstep(u,.12,1));c.push(color.r,color.g,color.b)}
 bankGeo.setAttribute('color',new THREE.Float32BufferAttribute(c,3));bankGeo.computeVertexNormals();mesh(bankGeo,mat(0xffffff,{vertexColors:true,roughness:1}));
}
// A transparent turquoise channel: darker centre, pale shallows and fine ripples.
const wg=new THREE.PlaneGeometry(14,1.47,100,12);wg.rotateX(-Math.PI/2);const wp=wg.attributes.position,waterColors=[];
for(let i=0;i<wp.count;i++){
 const x=wp.getX(i),edge=Math.abs(wp.getZ(i))/.735;wp.setZ(i,wp.getZ(i)+river(x));wp.setY(i,waterHeight(x,wp.getZ(i),0));
 const c=new THREE.Color(0x21656d).lerp(new THREE.Color(0x8ab9a0),Math.pow(edge,2.2)*.82);c.multiplyScalar(.96+Math.sin(x*1.8)*.045);waterColors.push(c.r,c.g,c.b);
}
wg.setAttribute('color',new THREE.Float32BufferAttribute(waterColors,3));wg.computeVertexNormals();
const normalCanvas=document.createElement('canvas');normalCanvas.width=normalCanvas.height=128;const normalCtx=normalCanvas.getContext('2d'),normalPixels=normalCtx.createImageData(128,128);
for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4;normalPixels.data[i]=128+Math.sin(x*Math.PI/16+y*Math.PI/32)*17;normalPixels.data[i+1]=128+Math.cos(y*Math.PI/8+x*Math.PI/32)*10;normalPixels.data[i+2]=252;normalPixels.data[i+3]=255}
normalCtx.putImageData(normalPixels,0,0);const waterNormals=new THREE.CanvasTexture(normalCanvas);waterNormals.wrapS=waterNormals.wrapT=THREE.RepeatWrapping;waterNormals.repeat.set(7,2);
const water=mesh(wg,new THREE.MeshPhysicalMaterial({color:0xffffff,vertexColors:true,normalMap:waterNormals,normalScale:new THREE.Vector2(.35,.2),roughness:.23,metalness:.05,transparent:true,opacity:renderer.isSoftware?1:.84,clearcoat:.8,clearcoatRoughness:.28}));water.castShadow=false;water.material.userData.seamless=true;
const waterOrig=Float32Array.from(wp.array),rippleMat=new THREE.LineBasicMaterial({color:0xd4eee0,transparent:true,opacity:.4,depthWrite:false});
const glints=[];for(let i=0;i<34;i++){
 const x=rand()*14-7,lane=(rand()-.5)*1.12,z=river(x)+lane,length=.3+rand()*.5,pts=[];
 for(let j=0;j<6;j++){const u=j/6,v=(j+1)/6;pts.push(new THREE.Vector3((u-.5)*length,0,Math.sin(u*3.14)*.025),new THREE.Vector3((v-.5)*length,0,Math.sin(v*3.14)*.025))}
 const m=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts),rippleMat);m.position.set(x,-.027,z);world.add(m);glints.push({m,x,z,lane,length,phase:rand()*6});
}
const fallingRills=[];
for(const side of[-1,1]){
 const fallGeometry=new THREE.PlaneGeometry(1.44,1.08,10,14),fallPos=fallGeometry.attributes.position,fallColors=[];
 for(let i=0;i<fallPos.count;i++){const across=fallPos.getX(i),down=.54-fallPos.getY(i);fallPos.setXYZ(i,side*(7.012+Math.sin(down*2)*.035),-.045-down,river(side*7)+across);const color=new THREE.Color(0x498e91).lerp(new THREE.Color(0xbed9cb),Math.abs(across)/.72*.4);fallColors.push(color.r,color.g,color.b)}
 fallGeometry.setAttribute('color',new THREE.Float32BufferAttribute(fallColors,3));fallGeometry.computeVertexNormals();const fall=mesh(fallGeometry,new THREE.MeshPhysicalMaterial({color:0xffffff,vertexColors:true,side:THREE.DoubleSide,normalMap:waterNormals,normalScale:new THREE.Vector2(.2,.3),roughness:.28,transparent:true,opacity:renderer.isSoftware?1:.78}));fall.castShadow=false;fall.material.userData.seamless=true;
 for(let i=0;i<9;i++){const lane=(i/8-.5)*1.25,geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(side*7.06,-.1,river(side*7)+lane),new THREE.Vector3(side*7.06,-.32,river(side*7)+lane)]),m=new THREE.LineSegments(geo,rippleMat);world.add(m);fallingRills.push({m,lane,phase:i/9,side})}
}
// Pebbles occur in loose clusters instead of a regular necklace along the banks.
for(let i=0;i<42;i++){const x=rand()*13-6.5,side=rand()>.5?1:-1,z=river(x)+side*(.77+rand()*.48);rock(x,z,.055+Math.pow(rand(),2)*.24)}
// Board lines float just above the landscape, without adding movement restrictions.
const gridPoints=[];for(let x=0;x<=8;x++)gridPoints.push(new THREE.Vector3(x-4,.205,-BH/2),new THREE.Vector3(x-4,.205,BH/2));for(let y=0;y<=BH;y++)gridPoints.push(new THREE.Vector3(-4,.205,y-BH/2),new THREE.Vector3(4,.205,y-BH/2));
const grid=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(gridPoints),new THREE.LineBasicMaterial({color:0xe5d9a0,transparent:true,opacity:.27}));world.add(grid);
const boardMarks=new THREE.Group();world.add(boardMarks);
function rail(z,color){const m=mesh(box,mat(color,{metalness:.35}),boardMarks);m.scale.set(8.13,.07,.07);m.position.set(0,.22,z);return m}rail(-BH/2,0xbf9165);rail(BH/2,0x9eae73);
// The first and last rows are the original scoring zones, one cell deep.
for(const [z,color]of[[-HZ,0xe2a062],[HZ,0x9cc36b]]){
 const zone=new THREE.Mesh(new THREE.PlaneGeometry(8,1),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.27,side:THREE.DoubleSide,depthWrite:false}));zone.rotation.x=-Math.PI/2;zone.position.set(0,.212,z/ZS);zone.scale.y=1/ZS;world.add(zone);
 rail(z<0?-HZ+.5:HZ-.5,color);
 for(let x=-3.5;x<4;x++){const mark=mesh(new THREE.ConeGeometry(.055,.18,3),mat(color),boardMarks);mark.rotation.x=z<0?Math.PI/2:-Math.PI/2;mark.position.set(x,.24,z<0?-HZ+.38:HZ-.38);mark.castShadow=false;}
}
for(const x of[-4.08,4.08]){const m=mesh(box,stone,boardMarks);m.scale.set(.07,.07,BH+.14);m.position.set(x,.20,0)}
// Dressed perimeter: small trees, stones and broken sanctuary columns.
function tree(x,z,s=1){
 const g=new THREE.Group();g.position.set(x,height(x,z),z);world.add(g);
 const trunk=mesh(new THREE.CylinderGeometry(.065*s,.12*s,1.55*s,9),wood,g);trunk.position.y=.73*s;
 for(const side of[-1,1]){const branch=mesh(new THREE.CylinderGeometry(.025*s,.05*s,.65*s,6),wood,g);branch.position.set(side*.13*s,1.13*s,0);branch.rotation.z=-side*.55;}
 for(let j=0;j<6;j++){
  const crown=mesh(crownShapes[j%3],leafMats[Math.floor(rand()*4)],g),angle=j*2.4;
  crown.position.set(Math.cos(angle)*(j===5?.1:.34)*s,(1.5+(j%3)*.21)*s,Math.sin(angle)*.31*s);crown.scale.set((.46+rand()*.13)*s,(.44+rand()*.15)*s,(.43+rand()*.13)*s);
 }
 return g;
}
[[-5.5,-4.9,1.1],[-5.9,-2.8,.8],[5.7,-5.3,1.1],[5.8,-3.7,.8],[-5.6,4.3,.85],[5.8,3.9,.9],[-2.6,-6.1,.7],[2.9,-6.4,.85]].forEach(a=>tree(...a));
for(let i=0;i<24;i++){const side=rand()>.5?1:-1;rock(side*(4.7+rand()*1.8),rand()*12-6,.13+Math.pow(rand(),1.7)*.48)}
for(const [x,z]of[[-4.8,-4.1],[4.9,-4.7]]){const y=height(x,z),plinth=mesh(box,stone);plinth.scale.set(.65,.2,.65);plinth.position.set(x,y+.1,z);const col=mesh(new THREE.CylinderGeometry(.18,.24,.8,6),stone);col.position.set(x,y+.55,z);col.rotation.z=.12;const cap=mesh(box,darkStone);cap.scale.set(.5,.15,.5);cap.position.set(x,y+1,z)}
// Instanced grass: one draw call; vertex wind bends only the blade tips.
const grassGeo=new THREE.BufferGeometry();
grassGeo.setAttribute('position',new THREE.Float32BufferAttribute([-.012,0,0,.012,0,0,.006,.16,0,.024,.16,0,.053,.32,0,.053,.32,0],3));grassGeo.setIndex([0,1,2,1,3,2,2,3,4]);grassGeo.computeVertexNormals();
const grassMaterial=mat(0x9baa72,{side:THREE.DoubleSide});const wind={value:0},windAmount={value:1};
grassMaterial.onBeforeCompile=shader=>{shader.uniforms.uWind=wind;shader.uniforms.uAmount=windAmount;shader.vertexShader='uniform float uWind; uniform float uAmount;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed.x += sin(uWind * 1.35 + instanceMatrix[3].x * 1.8 + instanceMatrix[3].z) * position.y * position.y * 0.8 * uAmount;')};
const foliageRecords=[],hiddenFoliage=new THREE.Matrix4().makeScale(0,0,0);let foliageBoardKey='';
function registerFoliage(object,index,matrix,x,z){object.setMatrixAt(index,matrix);const bx=Math.floor(x+4),by=Math.floor(z*ZS+BH/2);if(bx>=0&&bx<8&&by>=0&&by<BH)foliageRecords.push({object,index,matrix:matrix.clone(),x:bx,y:by})}
function updateFoliage(){const key=state.b.flat().map(c=>c?'1':'0').join('');if(key===foliageBoardKey)return;foliageBoardKey=key;for(const f of foliageRecords){f.object.setMatrixAt(f.index,state.b[f.y][f.x]?hiddenFoliage:f.matrix);f.object.instanceMatrix.needsUpdate=true}}
const grassCapacity=5000,grass=new THREE.InstancedMesh(grassGeo,grassMaterial,grassCapacity),dummy=new THREE.Object3D();let grassCount=0;
function addGrass(x,z,size){if(grassCount>=grassCapacity||Math.abs(z-river(x))<1.22||Math.abs(x)>6.7||Math.abs(z)>7.1)return;dummy.position.set(x,height(x,z)+.01,z);dummy.rotation.set(0,rand()*Math.PI*2,0);dummy.scale.setScalar(size);dummy.updateMatrix();registerFoliage(grass,grassCount,dummy.matrix,x,z);grass.setColorAt(grassCount,new THREE.Color().setHSL(.2+rand()*.06,.25+rand()*.18,.34+rand()*.15));grassCount++}
// Tufts first so they remain present in the lightweight rendering mode.
for(let i=0;i<45;i++){const x=rand()*12.7-6.35,z=rand()*13.5-6.75,radius=.08+rand()*.16;for(let j=0;j<11;j++){const angle=rand()*6.28,r=rand()*radius;addGrass(x+Math.cos(angle)*r,z+Math.sin(angle)*r,.6+rand()*.65)}}
for(let i=0;i<6000&&grassCount<grassCapacity;i++){const x=rand()*13.1-6.55,z=rand()*13.6-6.8;if(Math.abs(x)<4.15&&Math.abs(z)<5.15&&rand()>.38)continue;if(Math.abs(x-(Math.sin(z*.62)*.65+.55))<.25&&rand()>.15)continue;addGrass(x,z,.42+rand()*.75)}
grass.count=grassCount;grass.receiveShadow=true;world.add(grass);
// Small five-petal meadow flowers, grouped around the perimeter and in sparse pockets.
const flowerCount=72,flowerDummy=new THREE.Object3D(),petals=new THREE.InstancedMesh(new THREE.SphereGeometry(1,5,3),mat(0xffffff,{roughness:.85}),flowerCount*5),stems=new THREE.InstancedMesh(new THREE.CylinderGeometry(.007,.009,1,5),mat(0x537643),flowerCount),centres=new THREE.InstancedMesh(new THREE.SphereGeometry(1,5,3),mat(0xf2d171),flowerCount),flowerLeaves=new THREE.InstancedMesh(new THREE.SphereGeometry(1,5,3),mat(0x6c914b),flowerCount*2);
const flowerPatches=[[-5.1,-3.5],[-5.1,3.4],[5.1,-2.7],[5.2,4.6],[-1.9,-6.3],[2.8,6.2],[2.5,2.7],[-2.4,-2.8],[.2,-4.1]],flowerPalette=[0xf0e9ce,0xd58ba9,0x9c9bdc,0x84b8d5,0xe2bf5b,0xc4a7df];
for(let i=0;i<flowerCount;i++){
 const patch=flowerPatches[i%flowerPatches.length],x=patch[0]+(rand()-.5)*.9,z=patch[1]+(rand()-.5)*.9,y=height(x,z),h=.16+rand()*.13,color=new THREE.Color(flowerPalette[Math.floor(rand()*flowerPalette.length)]);
 flowerDummy.position.set(x,y+h/2,z);flowerDummy.rotation.set(0,0,0);flowerDummy.scale.set(1,h,1);flowerDummy.updateMatrix();registerFoliage(stems,i,flowerDummy.matrix,x,z);
 flowerDummy.position.set(x,y+h,z);flowerDummy.scale.set(.027,.018,.027);flowerDummy.updateMatrix();registerFoliage(centres,i,flowerDummy.matrix,x,z);
 for(let j=0;j<5;j++){const angle=j/5*Math.PI*2;flowerDummy.position.set(x+Math.cos(angle)*.047,y+h-.005,z+Math.sin(angle)*.047);flowerDummy.rotation.set(0,-angle,Math.sin(angle)*.12);flowerDummy.scale.set(.052,.014,.03);flowerDummy.updateMatrix();registerFoliage(petals,i*5+j,flowerDummy.matrix,x,z);petals.setColorAt(i*5+j,color)}
 for(let j=0;j<2;j++){flowerDummy.position.set(x+(j?1:-1)*.025,y+h*.45,z);flowerDummy.rotation.set(0,j?.5:-.5,j?-.3:.3);flowerDummy.scale.set(.04,.009,.014);flowerDummy.updateMatrix();registerFoliage(flowerLeaves,i*2+j,flowerDummy.matrix,x,z)}
}
for(const object of[petals,stems,centres,flowerLeaves]){object.receiveShadow=true;world.add(object)}
const moteGeo=new THREE.BufferGeometry(),motePos=[];for(let i=0;i<22;i++)motePos.push(rand()*12-6,.5+rand()*2.3,rand()*12-6);moteGeo.setAttribute('position',new THREE.Float32BufferAttribute(motePos,3));const motes=new THREE.Points(moteGeo,new THREE.PointsMaterial({color:0xffe3a1,size:.045,transparent:true,opacity:.6,depthWrite:false}));world.add(motes);
// Retain the same grid and score zones while switching scenery.
const forest=new THREE.Group(),shared=new Set([grid,boardFrame,...world.children.filter(o=>o.geometry?.type==='PlaneGeometry'&&o.geometry.parameters.width===8&&o.geometry.parameters.height===1)]);for(const o of [...world.children])if(!shared.has(o))forest.add(o);world.add(forest);
/* v238 — sous-bois, rivière vivante et petite faune du Bois tendre */const woodland=createWoodland({forest,river,height,waterHeight,rand,software:!!renderer.isSoftware,crownShapes,leafMats});
let crater=null,lake=null,skyIsland=null,windLand=null,frostRoad=null,cityScene=null,caveScene=null,autumnScene=null,noelScene=null;
// 8×BH board: the scenery is stretched lengthwise; cells, pieces and effects keep their real one-unit spacing.
const decor=new THREE.Group();decor.scale.z=ZS;for(const o of [...world.children]){world.remove(o);decor.add(o)}world.add(decor);
for(const o of [grid,boardMarks])o.scale.z=1/ZS;
const pieces=new THREE.Group(),highlights=new THREE.Group();world.add(pieces,highlights);
const tileGeo=(()=>{const w=.86,r=.12,sh=new THREE.Shape(),hw=w/2;sh.moveTo(-hw+r,-hw);sh.lineTo(hw-r,-hw);sh.quadraticCurveTo(hw,-hw,hw,-hw+r);sh.lineTo(hw,hw-r);sh.quadraticCurveTo(hw,hw,hw-r,hw);sh.lineTo(-hw+r,hw);sh.quadraticCurveTo(-hw,hw,-hw,hw-r);sh.lineTo(-hw,-hw+r);sh.quadraticCurveTo(-hw,-hw,-hw+r,-hw);
 const b=.04,g=new THREE.ExtrudeGeometry(sh,{depth:1-2*b,bevelEnabled:true,bevelThickness:b,bevelSize:.035,bevelSegments:2,curveSegments:5});g.rotateX(-Math.PI/2);g.translate(0,-(1-2*b)/2,0);g.computeVertexNormals();return g})(),topGeo=new THREE.PlaneGeometry(.9,.9),highlightGeo=new THREE.PlaneGeometry(.91,.91),textures=new Map(),tileMats=new Map(),creatureMats=new Map();
const eyeMaterial=mat(0x172d26);
const green=mat(0x3c7959,{roughness:.56}),orange=mat(0xb97844,{roughness:.56}); function applyCampMaterials(){const st=getComputedStyle(document.documentElement),a=st.getPropertyValue('--camp0-tile').trim(),b=st.getPropertyValue('--camp1-tile').trim();if(a)green.color.set(a);if(b)orange.color.set(b);for(const [k,m] of textures)if(k.startsWith('c')){m.map?.dispose();m.dispose();textures.delete(k)}} applyCampMaterials();window.addEventListener('hackenia:camps',applyCampMaterials);
// v221 — Dessus des dalles : pierre teintée de la couleur du camp, cadre lumineux de l'élément, symbole d'élément,
// chiffre dans un médaillon et bonus doré. camp = 0/1 pour une dalle posée ; sans camp : aperçu de pose (fond transparent).
function elementGlyph(ctx,el,x,y,s){ctx.save();ctx.translate(x,y);ctx.scale(s/24,s/24);ctx.fillStyle='#fff';ctx.strokeStyle='#fff';ctx.lineWidth=2.6;ctx.lineCap=ctx.lineJoin='round';ctx.beginPath();
 if(el==='foudre'){ctx.moveTo(3,-12);ctx.lineTo(-7,2);ctx.lineTo(0,2);ctx.lineTo(-3,12);ctx.lineTo(8,-3);ctx.lineTo(1,-3);ctx.closePath();ctx.fill()}
 else if(el==='vent'){for(const [yy,w] of [[-6,9],[0,12],[6,7]]){ctx.moveTo(-11,yy);ctx.lineTo(w-5,yy);ctx.arc(w-5,yy-3,3,Math.PI/2,-Math.PI*.9,true)}ctx.stroke()}
 else if(el==='terre'){ctx.moveTo(-12,9);ctx.lineTo(-3,-7);ctx.lineTo(2,1);ctx.lineTo(5,-3);ctx.lineTo(12,9);ctx.closePath();ctx.fill()}
 else if(el==='glace'){for(let k=0;k<3;k++){ctx.save();ctx.rotate(k*Math.PI/3);ctx.moveTo(0,-11);ctx.lineTo(0,11);ctx.moveTo(-4,-8);ctx.lineTo(0,-5);ctx.lineTo(4,-8);ctx.moveTo(-4,8);ctx.lineTo(0,5);ctx.lineTo(4,8);ctx.restore()}ctx.stroke()}
 else if(el==='eau'){ctx.moveTo(0,-12);ctx.bezierCurveTo(6,-3,9,1,9,5);ctx.arc(0,5,9,0,Math.PI);ctx.bezierCurveTo(-9,1,-6,-3,0,-12);ctx.fill()}
 else if(el==='feu'){ctx.moveTo(0,12);ctx.bezierCurveTo(-10,10,-10,0,-5,-5);ctx.bezierCurveTo(-4,-1,-2,0,-1,1);ctx.bezierCurveTo(-2,-6,2,-10,4,-13);ctx.bezierCurveTo(5,-6,10,-3,9,4);ctx.bezierCurveTo(9,9,5,12,0,12);ctx.fill()}
 else{for(let k=0;k<4;k++){ctx.rotate(Math.PI/2);ctx.moveTo(0,-11);ctx.lineTo(3,-3);ctx.lineTo(0,0)}ctx.fill()}
 ctx.restore()}
function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function label(value,element,bonus=0,camp=-1){const campHex=camp<0?'':(camp?orange:green).color.getHexString(),key=(camp<0?'p':'c'+campHex)+':'+value+':'+element+':'+bonus;if(textures.has(key))return textures.get(key);
 const S=256,c=document.createElement('canvas');c.width=c.height=S;const ctx=c.getContext('2d'),multi=element==='multi',ec=multi?'#e9d4ff':(game.elementColors[element]||'#e8d7a8');
 if(camp>=0){const base=new THREE.Color('#'+campHex),light='#'+base.clone().lerp(new THREE.Color('#fff7e0'),.28).getHexString(),dark='#'+base.clone().multiplyScalar(.55).getHexString(),grd=ctx.createLinearGradient(0,0,S,S);grd.addColorStop(0,light);grd.addColorStop(.55,'#'+campHex);grd.addColorStop(1,dark);
  roundRect(ctx,4,4,S-8,S-8,34);ctx.fillStyle=grd;ctx.fill();ctx.save();ctx.clip();let seed=value*97+(element||'x').length*13+1;for(let k=0;k<160;k++){seed=(seed*16807)%2147483647;const px=seed%S;seed=(seed*16807)%2147483647;const py=seed%S;ctx.fillStyle=k%2?'#ffffff10':'#00000014';ctx.fillRect(px,py,3,3)}ctx.restore();
  ctx.lineWidth=4;ctx.strokeStyle='#ffffff40';roundRect(ctx,6,6,S-12,S-12,32);ctx.stroke()}
 ctx.save();ctx.lineWidth=camp<0?9:11;ctx.shadowColor=ec;ctx.shadowBlur=16;let frame=ec;if(multi){frame=ctx.createLinearGradient(0,0,S,S);['#ff6b8b','#ffd36b','#7af0b5','#6fc8ff','#c79bff'].forEach((col,k)=>frame.addColorStop(k/4,col))}ctx.strokeStyle=frame;roundRect(ctx,22,22,S-44,S-44,24);ctx.stroke();ctx.restore();
 const mx=S/2+8,my=S/2+10,md=ctx.createRadialGradient(mx-16,my-20,6,mx,my,80);md.addColorStop(0,'#3a2f22');md.addColorStop(1,'#0f0b07');ctx.beginPath();ctx.arc(mx,my,74,0,Math.PI*2);ctx.fillStyle=md;ctx.globalAlpha=camp<0?.82:.92;ctx.fill();ctx.globalAlpha=1;ctx.lineWidth=6;ctx.strokeStyle='#e9cf8a';ctx.stroke();ctx.lineWidth=2;ctx.strokeStyle='#7a5a24';ctx.beginPath();ctx.arc(mx,my,66,0,Math.PI*2);ctx.stroke();
 ctx.font='bold 116px Georgia, serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=9;ctx.strokeStyle='#120c06';ctx.strokeText(value,mx,my+7);ctx.fillStyle='#fff4d3';ctx.fillText(value,mx,my+7);
 if(element||camp>=0){ctx.beginPath();ctx.arc(56,56,40,0,Math.PI*2);ctx.fillStyle=multi?'#7b5cc4':ec;ctx.fill();ctx.lineWidth=6;ctx.strokeStyle='#fff6dc';ctx.stroke();elementGlyph(ctx,multi?'':element,56,56,46)}
 if(bonus){roundRect(ctx,S-122,S-84,108,70,35);ctx.fillStyle='#f6d36b';ctx.shadowColor='#ffd76a';ctx.shadowBlur=14;ctx.fill();ctx.shadowBlur=0;ctx.lineWidth=6;ctx.strokeStyle='#6b4a12';ctx.stroke();ctx.font='bold 50px system-ui, sans-serif';ctx.fillStyle='#3a2606';ctx.fillText('+'+bonus,S-68,S-47)}
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;const material=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false});textures.set(key,material);return material}

// Project DOM captions through the same camera so both renderers keep them legible.
const boardCaptions=document.createElement('div');boardCaptions.className='board-objectives';boardCaptions.innerHTML='<span class="zone-caption zone-north"></span><span class="zone-caption zone-south"></span><span class="board-destination-arrow" aria-label="Case de destination choisie"><svg viewBox="0 0 128 128" aria-hidden="true"><path d="M45 8h38v59h29l-48 52L16 67h29Z"/></svg></span>';host.append(boardCaptions);
const powerCaptions=new Map();
const zoneCaptions=[...boardCaptions.querySelectorAll('.zone-caption')],destinationMarker=boardCaptions.querySelector('.board-destination-arrow');
// Halo de la zone à envahir : rideau de lumière et particules montantes, à la couleur du camp adverse.
function glowTexture(kind){const c=document.createElement('canvas');c.width=kind==='dot'?64:16;c.height=kind==='dot'?64:128;const g=c.getContext('2d');let grad;
 if(kind==='dot'){grad=g.createRadialGradient(32,32,0,32,32,32);grad.addColorStop(0,'rgba(255,255,255,1)');grad.addColorStop(.35,'rgba(255,255,255,.55)');grad.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=grad;g.fillRect(0,0,64,64)}
 else if(kind==='floor'){grad=g.createLinearGradient(0,0,0,128);grad.addColorStop(0,'rgba(255,255,255,0)');grad.addColorStop(.5,'rgba(255,255,255,.9)');grad.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=grad;g.fillRect(0,0,16,128)}
 else{grad=g.createLinearGradient(0,128,0,0);grad.addColorStop(0,'rgba(255,255,255,.95)');grad.addColorStop(.25,'rgba(255,255,255,.45)');grad.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=grad;g.fillRect(0,0,16,128)}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
const zoneGlow=new THREE.Group(),glowColor=new THREE.Color('#d0453f'),glowMat=o=>new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,color:glowColor,...o});
const curtainMat=glowMat({map:glowTexture('curtain'),opacity:.5}),floorMat=glowMat({map:glowTexture('floor'),opacity:.55}),moteMat=new THREE.SpriteMaterial({map:glowTexture('dot'),color:glowColor,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.8});
const curtain=new THREE.Mesh(new THREE.PlaneGeometry(8.3,1.5),curtainMat);curtain.position.y=.26+.75;zoneGlow.add(curtain);
const curtainBack=new THREE.Mesh(new THREE.PlaneGeometry(8.3,.9),curtainMat);curtainBack.position.y=.26+.45;curtainBack.rotation.y=Math.PI/2;curtainBack.scale.x=.12;zoneGlow.add(curtainBack);curtainBack.visible=false;
const floorGlow=new THREE.Mesh(new THREE.PlaneGeometry(8.6,1.6),floorMat);floorGlow.rotation.x=-Math.PI/2;floorGlow.position.y=.255;zoneGlow.add(floorGlow);
const glowMotes=[];for(let i=0;i<22;i++){const m=new THREE.Sprite(moteMat.clone());m.userData={x:-3.9+Math.random()*7.8,z:(Math.random()-.5)*.8,phase:Math.random(),speed:.18+Math.random()*.16,size:.07+Math.random()*.08};zoneGlow.add(m);glowMotes.push(m)}
pieces.add(zoneGlow);let glowCampKey='',glowCheck=0;
function updateZoneGlow(now){const seat=game.viewerSeat(),z=seat===0?-HZ:HZ;zoneGlow.position.z=z;zoneGlow.visible=!previewMode&&!state?.over;
 if(now-glowCheck>800){glowCheck=now;const key='--camp'+(1-seat)+'-ui',col=getComputedStyle(document.documentElement).getPropertyValue(key).trim()||'#d0453f';if(col!==glowCampKey){glowCampKey=col;glowColor.set(col);curtainMat.color.copy(glowColor);floorMat.color.copy(glowColor);glowMotes.forEach(m=>m.material.color.copy(glowColor))}}
 const t=moving?now/1000:0,pulse=moving?.5+.5*Math.sin(t*1.4):.6;curtainMat.opacity=.32+.16*pulse;floorMat.opacity=.42+.18*pulse;
 for(const m of glowMotes){const u=m.userData,k=moving?(t*u.speed+u.phase)%1:u.phase;m.position.set(u.x+Math.sin(t*.8+u.phase*6)*.08,.3+k*1.6,u.z);m.scale.setScalar(u.size*(1-k*.4));m.material.opacity=(k<.15?k/.15:1-(k-.15)/.85)*.85}}
function updateZoneLabels(){const seat=game.viewerSeat();zoneCaptions.forEach((caption,i)=>{const own=(i===0?1:0)===seat;const text=own?'Zone à protéger':'Zone à envahir';if(caption.textContent!==text)caption.textContent=text;caption.classList.toggle('own',own)});boardCaptions.hidden=previewMode}
function updateCreaturePowers(place){
 const combat=window.HackeniaCombat?.current(),live=new Set();
 for(const [id,g]of creatures){live.add(id);const k=g.userData.k;let badge=powerCaptions.get(id);if(!badge){badge=document.createElement('span');badge.className='creature-pa';boardCaptions.append(badge);powerCaptions.set(id,badge)}
  const i=combat?.fighters.findIndex(c=>c.id===id)??-1,x=Math.max(0,Math.min(7,Math.round(g.position.x+3.5))),y=Math.max(0,Math.min(BH-1,Math.round(g.position.z+HZ))),power=i>=0?combat.stats[i].attack:game.creatureAttack(k,x,y,state.b),text='PA : '+power;
  if(badge.textContent!==text)badge.textContent=text;badge.setAttribute('aria-label',(game.monsters[k.mi]?.cn||k.mn||'Créature')+' · '+text);badge.classList.toggle('opponent',k.o!==game.viewerSeat());badge.style.setProperty?.('--pa',({feu:'#ff5b3a',eau:'#4fb0ff',glace:'#86f2ff',terre:'#f0a548',vent:'#5dff86',foudre:'#c78dff'})[game.monsters[k.mi]?.el]||'#e3a8ff');/* v246 — palette vive dédiée aux PA */badge.style.setProperty?.('--camp-dot','var(--camp'+k.o+'-ui)');
  const height=.9*(g.userData.animationInfo?.boardHeight||1)+.27;place(badge,g.position.x,g.position.y+height,g.position.z);if(!g.visible)badge.hidden=true;const pose=combat?window.HackeniaCombat.pose(combat,k):null;badge.style.opacity=String((pose?1-pose.defeat:1)*(i>=0?1:.88));/* v244 — texte seul : plus besoin de le rendre aussi transparent *//* v242 — PA semi-transparent hors combat : le terrain reste lisible */
 }
 for(const [id,badge]of powerCaptions)if(!live.has(id)){badge.remove();powerCaptions.delete(id)}
}
function projectBoardCaptions(t=0){if(previewMode||!active){boardCaptions.hidden=true;return}boardCaptions.hidden=false;const r=canvas.getBoundingClientRect(),h=host.getBoundingClientRect();const place=(el,x,y,z)=>{const p=world.localToWorld(new THREE.Vector3(x,y,z)).project(camera);el.style.left=(r.left-h.left+(p.x+1)*r.width/2)+'px';el.style.top=(r.top-h.top+(1-p.y)*r.height/2)+'px';el.hidden=p.z < -1||p.z>1};zoneCaptions.forEach((el,i)=>place(el,0,.48,i===0?-HZ:HZ));updateCreaturePowers(place);destinationMarker.hidden=!state.movePlan;if(state.movePlan){const p=state.movePlan,x=p.previewX??p.x,y=p.previewY??p.y,c=state.b[y]?.[x];place(destinationMarker,x-3.5,1.1+(c&&!c.f?.28:0)+(moving?Math.sin(t*4)*.055:0),y-HZ)}}
let state,active=true,moving=true,light=false,paused=false,lastFrame=0,currentAngle=0;
const tiles=new Map(),creatures=new Map(),modelCache=new Map(),combatClipCache=new Map();
let modelTools;
function getModelTools(){return modelTools??=Promise.all([import('./vendor/three/examples/jsm/loaders/GLTFLoader.js'),import('./vendor/three/examples/jsm/utils/SkeletonUtils.js')]).then(([a,b])=>({loader:new a.GLTFLoader(),clone:b.clone}))}

// Dé élémentaire posé : son modèle 3D apparaît au-dessus des dalles, lévite en tournant doucement puis s'efface (aucune créature ne reste).
const pureFx=[];
window.addEventListener('hackenia:pure-placed',async e=>{const {mi,x,y}=e.detail||{};try{const info=await game.modelInfo(mi);if(!info?.glb)return;const url='assets/'+info.glb;
 if(!modelCache.has(url))modelCache.set(url,(async()=>{const exists=await fetch(url,{method:'HEAD'});if(!exists.ok)return null;const tools=await getModelTools();const gltf=await tools.loader.loadAsync(url);return{gltf,clone:tools.clone}})().catch(()=>null));
 const asset=await modelCache.get(url);if(!asset)return;const root=asset.clone(asset.gltf.scene),holder=new THREE.Group(),mats=[];holder.add(root);root.updateMatrixWorld(true);
 const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),scale=(game.monsters[mi]?.pure===1?1.15:2.4)/Math.max(size.x,size.y,size.z,.01);root.scale.setScalar(scale);root.position.set(-(box.min.x+box.max.x)*scale/2,-(box.min.y+box.max.y)*scale/2,-(box.min.z+box.max.z)*scale/2);
 root.traverse(o=>{if(!o.isMesh)return;o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{m.transparent=true;m.depthWrite=false;mats.push(m)})});
 holder.position.set(x-3.5,1.15,y-HZ);holder.scale.setScalar(.6);pieces.add(holder);
 // v199 — Dé Énergie (v3) : même modèle que le v2, mais matériaux lumineux, halo, lumière et éclats de la couleur de l'élément.
 let energy=null;if(game.monsters[mi]?.pure===3){const col=new THREE.Color(game.elementColors[game.monsters[mi].el]||'#ffffff');mats.forEach(m=>{if(m.emissive){m.emissive=col.clone();m.emissiveIntensity=.45}});
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:energyGlowTexture(),color:col,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0}));halo.scale.setScalar(4.2);holder.add(halo);mats.push(halo.material);
  const light=new THREE.PointLight(col,0,6);holder.add(light);const sparks=[];for(let i=0;i<10;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:energyGlowTexture(),color:i%3?col:new THREE.Color('#ffffff'),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0}));sp.scale.setScalar(.35+(i%3)*.12);holder.add(sp);mats.push(sp.material);sparks.push({sp,a:i/10*Math.PI*2,r:1.25+(i%4)*.18,y:(i%5-2)*.32,v:.9+(i%3)*.35})}energy={halo,light,sparks}}
 pureFx.push({holder,mats,energy,start:performance.now(),calm:!document.documentElement.classList.contains('no-motion')&&!matchMedia('(prefers-reduced-motion: reduce)').matches})}catch(error){console.info('Effet du dé élémentaire ignoré.',error)}});
let energyGlow=null;function energyGlowTexture(){if(energyGlow)return energyGlow;const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.25,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,128,128);energyGlow=new THREE.CanvasTexture(c);return energyGlow}
function updatePureFx(now){for(let i=pureFx.length-1;i>=0;i--){const f=pureFx[i],t=(now-f.start)/1000,dur=f.calm?3:1.2,k=Math.min(1,t/dur),ease=1-Math.pow(1-k,3);
 f.holder.position.y=1.15+(f.calm?.7*ease+.06*Math.sin(t*3.2):0);const cam=pieces.worldToLocal(camera.getWorldPosition(new THREE.Vector3())),face=Math.atan2(cam.x-f.holder.position.x,cam.z-f.holder.position.z);f.holder.rotation.y=face+(f.calm?.45*Math.sin(t*1.6):0);f.holder.rotation.z=f.calm?.08*Math.sin(t*1.7):0;f.holder.scale.setScalar(.6+.4*Math.min(1,t/.45));
 const fade=k<.5?1:1-(k-.5)/.5;for(const m of f.mats)m.opacity=Math.max(0,Math.min(1,t/.35))*fade;
 if(f.energy){const glow=Math.max(0,Math.min(1,t/.35))*fade;f.energy.halo.material.opacity=glow*(.75+.25*Math.sin(t*6));f.energy.halo.scale.setScalar(3.6+.5*Math.sin(t*3));f.energy.light.intensity=glow*6;for(const s of f.energy.sparks){const a=s.a+t*s.v;s.sp.position.set(Math.cos(a)*s.r,s.y+.15*Math.sin(t*2+s.a),Math.sin(a)*s.r);s.sp.material.opacity=glow*(.55+.45*Math.sin(t*7+s.a*3))}}
 if(k>=1){pieces.remove(f.holder);f.mats.forEach(m=>m.dispose());pureFx.splice(i,1)}}}
// v213 — Aura des divins : un halo doux au sol et quelques lueurs qui montent autour du personnage.
// Couleur de l'élément, transparence élevée, rien au-dessus de la tête : la lecture du plateau reste nette.
const auras=new Set();let auraRingTex=null;
function auraRingTexture(){if(auraRingTex)return auraRingTex;const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),r=g.createRadialGradient(64,64,10,64,64,64);r.addColorStop(0,'rgba(255,255,255,0)');r.addColorStop(.55,'rgba(255,255,255,.45)');r.addColorStop(.72,'rgba(255,255,255,.9)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,128,128);auraRingTex=new THREE.CanvasTexture(c);return auraRingTex}
function addDivineAura(g,d){if(g.userData.aura)return;const col=new THREE.Color(game.elementColors?.[d?.el]||'#ffe7a3'),group=new THREE.Group();group.userData.imported=true;
 const ringMat=new THREE.MeshBasicMaterial({map:auraRingTexture(),color:col,transparent:true,opacity:.42,depthWrite:false,blending:THREE.AdditiveBlending}),ring=new THREE.Mesh(new THREE.PlaneGeometry(1.5,1.5),ringMat);ring.rotation.x=-Math.PI/2;ring.position.y=.13;ring.renderOrder=2;group.add(ring);
 const motes=[];for(let i=0;i<7;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:energyGlowTexture(),color:i%3?col:new THREE.Color('#ffffff'),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));sp.scale.setScalar(.09+(i%3)*.03);group.add(sp);motes.push({sp,a:i/7*Math.PI*2,r:.36+(i%3)*.07,v:.35+(i%4)*.08,o:i/7})}
 g.add(group);g.userData.aura={group,ring,motes};auras.add(g)}
/* v269 — Dés Crépitants : des étincelles claquent autour de la créature (flash bref, nouvelle position à chaque éclair). */
const crackles=new Set();
function addCrackle(g){if(g.userData.crackle)return;const group=new THREE.Group();group.userData.imported=true;const cols=['#ffffff','#9fe9ff','#ff9ff0','#c9a7ff'],sparks=[];
 for(let i=0;i<14;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:energyGlowTexture(),color:new THREE.Color(cols[i%4]),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));sp.scale.setScalar(.07);group.add(sp);sparks.push({sp,seed:Math.random()*100,rate:1.6+Math.random()*3.4})}
 g.add(group);g.userData.crackle={group,sparks};crackles.add(g)}
function updateCrackles(now){const t=now/1000,still=document.documentElement.classList.contains('no-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
 for(const g of crackles){const c=g.userData.crackle;if(!g.parent||!c){crackles.delete(g);continue}
  for(const s of c.sparks){const x=t*s.rate+s.seed,i=Math.floor(x),k=x-i,h=Math.abs(Math.sin(i*12.9898+s.seed)*43758.5453)%1,h2=Math.abs(Math.sin(i*78.233+s.seed*3.1)*12345.678)%1,h3=Math.abs(Math.sin(i*3.7+s.seed))%1,a=h*Math.PI*2,r=.26+h2*.36;
   s.sp.position.set(Math.cos(a)*r,.12+h3*1.15,Math.sin(a)*r);const flash=still?.5:Math.max(0,1-k*3.4);s.sp.material.opacity=flash*flash*.95;s.sp.scale.setScalar(.05+flash*.14)}}}
function updateAuras(now){const t=now/1000,still=document.documentElement.classList.contains('no-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
 for(const g of auras){const a=g.userData.aura;if(!g.parent||!a){auras.delete(g);continue}
  a.ring.material.opacity=.38+(still?0:.12*Math.sin(t*2.1));a.ring.scale.setScalar(1+(still?0:.06*Math.sin(t*1.4)));
  for(const m of a.motes){const k=still?.5:(t*m.v+m.o)%1,ang=m.a+(still?0:t*.6);m.sp.position.set(Math.cos(ang)*m.r,.08+k*.95,Math.sin(ang)*m.r);m.sp.material.opacity=.7*Math.sin(Math.PI*k)}}}
// v234 — Effets des interactions de terrain : éclairs qui frappent deux cases, rafale qui pousse les créatures.
// v235 — Nénuphar sacré (lac rose) : grande fleur de lotus lumineuse posée sur la case qui donne +1.
function makeLotus(){const g=new THREE.Group();g.visible=false;const petalGeo=new THREE.SphereGeometry(1,10,8);petalGeo.scale(.07,.035,.2);petalGeo.translate(0,.02,.15);
 const outer=new THREE.MeshStandardMaterial({color:0xffc2dd,emissive:0xff5fa8,emissiveIntensity:.55,roughness:.45}),inner=new THREE.MeshStandardMaterial({color:0xfff0f6,emissive:0xff8cc4,emissiveIntensity:.45,roughness:.4});
 const petals=[];for(const [n,mat2,tilt,sc] of[[10,outer,.32,1.25],[8,inner,.75,.95],[6,inner,1.1,.7]])for(let k=0;k<n;k++){const p=new THREE.Mesh(petalGeo,mat2);p.rotation.set(0,k/n*Math.PI*2+tilt,0,'YXZ');p.rotation.x=-tilt;p.scale.setScalar(sc);g.add(p);petals.push(p)}
 const pad=new THREE.Mesh(new THREE.CircleGeometry(.44,24,.3,Math.PI*2-.6),new THREE.MeshStandardMaterial({color:0x3f8a58,roughness:.6,side:THREE.DoubleSide}));pad.rotation.x=-Math.PI/2;pad.position.y=-.005;g.add(pad);
 const heart=new THREE.Mesh(new THREE.SphereGeometry(.06,10,8),new THREE.MeshStandardMaterial({color:0xffd76a,emissive:0xffb020,emissiveIntensity:1.1}));heart.position.y=.07;g.add(heart);
 const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:energyGlowTexture(),color:0xff9fce,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false}));glow.scale.setScalar(1.5);glow.position.y=.1;g.add(glow);
 const light=new THREE.PointLight(0xff8fc6,0,2.6,2);light.position.y=.5;g.add(light);pieces.add(g);return{g,glow,light,born:0,key:''}}
const lotusPool=[];
// v260 — Murs de glace et pièges (dés de carte) : blocs de glace translucides ; pièges à pointes visibles seulement pour leur propriétaire.
const wallPool=[],trapPool=[];
function makeWall(){const g=new THREE.Group(),ice=new THREE.MeshPhysicalMaterial({color:0xcdeeff,transparent:true,opacity:.74,roughness:.06,metalness:0,emissive:0x4fb8ff,emissiveIntensity:.3,clearcoat:1}),blk=new THREE.Mesh(new THREE.BoxGeometry(.9,.78,.9),ice);blk.position.y=.39;g.add(blk);
 for(const [x,z,h] of[[-.2,.1,.5],[.22,-.15,.62],[.05,.28,.4]]){const c=new THREE.Mesh(new THREE.OctahedronGeometry(.16,0),ice);c.scale.set(.7,h*2.2,.7);c.position.set(x,.78+h*.3,z);g.add(c)}
 const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:energyGlowTexture(),color:0x8fd8ff,transparent:true,opacity:.5,depthWrite:false,blending:THREE.AdditiveBlending}));glow.scale.setScalar(1.7);glow.position.y=.5;g.add(glow);g.visible=false;world.add(g);return{g,glow,key:''}}
function makeTrap(){const g=new THREE.Group(),plate=new THREE.Mesh(new THREE.BoxGeometry(.78,.05,.78),new THREE.MeshStandardMaterial({color:0x2b2220,roughness:.8,metalness:.4}));plate.position.y=.03;g.add(plate);
 const sp=new THREE.MeshStandardMaterial({color:0xd8cfc0,metalness:.6,roughness:.35});for(const [x,z] of[[0,0],[-.22,-.22],[.22,-.22],[-.22,.22],[.22,.22]]){const c=new THREE.Mesh(new THREE.ConeGeometry(.07,.26,6),sp);c.position.set(x,.17,z);g.add(c)}
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.36,.025,6,24),new THREE.MeshBasicMaterial({color:0xff5a2a}));ring.rotation.x=Math.PI/2;ring.position.y=.07;g.add(ring);g.visible=false;world.add(g);return{g,ring,key:''}}
// Lanterne du mineur : anneau lumineux sur la case que le prochain événement du terrain va viser.
const forecastPool=[],FORECAST_COL={foudre:0xc78dff,vent:0x5dff86,eau:0xff9ad0,noel:0xffd36a};
function makeForecast(){const g=new THREE.Group(),ring=new THREE.Mesh(new THREE.TorusGeometry(.42,.035,8,32),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.95,depthTest:false})),beam=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,1.4,20,1,true),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending}));ring.rotation.x=Math.PI/2;ring.position.y=.08;ring.renderOrder=30;beam.position.y=.7;g.add(ring,beam);g.visible=false;world.add(g);return{g,ring,beam}}
function updateForecast(){const f=state.forecast,cells=f?.cells||[];while(forecastPool.length<cells.length)forecastPool.push(makeForecast());forecastPool.forEach((o,i)=>{const c=cells[i];if(!c){o.g.visible=false;return}const col=FORECAST_COL[f.t]||0xffffff;o.ring.material.color.setHex(col);o.beam.material.color.setHex(col);const cell=state.b[c[1]]?.[c[0]];o.g.position.set(c[0]-3.5,.22+(cell&&!cell.f?.28:0),c[1]-HZ);o.g.visible=true})}
function animateForecast(){const now=performance.now();for(const o of forecastPool){if(!o.g.visible)continue;const k=.5+.5*Math.sin(now/260);o.ring.scale.setScalar(.9+.18*k);o.beam.material.opacity=.14+.16*k}}
function updateFxBoard(){updateForecast();const W=state.walls||[],T=state.traps||[];while(wallPool.length<W.length)wallPool.push(makeWall());while(trapPool.length<T.length)trapPool.push(makeTrap());
 const top=(x,y)=>{const c=state.b[y]?.[x];return .22+(c&&!c.f?.28:0)};
 wallPool.forEach((o,i)=>{const w=W[i];if(!w){o.g.visible=false;o.key='';return}const key=w.x+','+w.y;if(key!==o.key){o.key=key;o.born=performance.now()}o.g.position.set(w.x-3.5,top(w.x,w.y),w.y-HZ);o.g.visible=true});
 trapPool.forEach((o,i)=>{const t=T[i];if(!t){o.g.visible=false;o.key='';return}o.g.position.set(t.x-3.5,top(t.x,t.y),t.y-HZ);o.g.visible=true})}
function animateFxBoard(){const now=performance.now();for(const o of wallPool){if(!o.g.visible)continue;const k=Math.min(1,(now-(o.born||0))/600),e=1-Math.pow(1-k,3);o.g.scale.set(1,.2+.8*e,1);o.glow.material.opacity=.4+(moving?.15*Math.sin(now/400):0)}for(const o of trapPool){if(!o.g.visible)continue;o.ring.material.color.setHex(Math.floor(now/450)%2?0xff5a2a:0xaa2a10)}}
// v253 — Cadeau de Noël (Nuit des Lumières) : un paquet qui tombe du ciel et scintille sur la case qui donne +1.
const giftPool=[],GIFT_COLS=[0xd6202c,0x2e6fe0,0x1f8a4c,0x8a2be2];
function makeGift(i){const g=new THREE.Group(),col=GIFT_COLS[i%4],box=new THREE.Mesh(new THREE.BoxGeometry(.34,.28,.34),new THREE.MeshStandardMaterial({color:col,roughness:.45,emissive:col,emissiveIntensity:.15})),rib=new THREE.MeshStandardMaterial({color:0xf2c75a,metalness:.7,roughness:.3,emissive:0x5a3a00,emissiveIntensity:.4});box.position.y=.14;g.add(box);
 for(const [w,d] of[[.36,.07],[.07,.36]]){const r=new THREE.Mesh(new THREE.BoxGeometry(w,.29,d),rib);r.position.y=.14;g.add(r)}for(const s of[-1,1]){const bow=new THREE.Mesh(new THREE.TorusGeometry(.07,.025,6,12),rib);bow.position.set(s*.06,.32,0);bow.rotation.set(0,Math.PI/2,s*.6);g.add(bow)}
 const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:energyGlowTexture(),color:0xffe7a0,transparent:true,opacity:.6,depthWrite:false,blending:THREE.AdditiveBlending}));glow.scale.setScalar(.9);glow.position.y=.2;g.add(glow);g.visible=false;world.add(g);return{g,glow,born:0,key:''}}
function updateGifts(){const list=state.terrain==='noel'?(state.lotus||[]):[];while(giftPool.length<list.length)giftPool.push(makeGift(giftPool.length));
 giftPool.forEach((G,n)=>{const l=list[n];if(!l){G.g.visible=false;G.key='';return}const key=l.x+','+l.y;if(key!==G.key){G.key=key;G.born=performance.now()}const c=state.b[l.y]?.[l.x];G.g.position.set(l.x-3.5+.26,.22+(c&&!c.f?.28:0),l.y-HZ-.26);G.baseY=G.g.position.y;G.g.visible=true})}
function animateGifts(){for(const G of giftPool){if(!G.g.visible)continue;const t=(performance.now()-G.born)/1000,drop=Math.min(1,t/.7),e=1-Math.pow(1-drop,3);G.g.position.y=(G.baseY||.22)+(1-e)*2.5+(moving?Math.sin(t*2.2)*.03:0);G.g.rotation.y=moving?t*.6:0;G.g.scale.setScalar(1.3);G.glow.material.opacity=.45+(moving?.2*Math.sin(t*3):0)}}
function updateLotus(){const list=state.terrain==='eau'?(state.lotus||[]):[];updateGifts();updateFxBoard();while(lotusPool.length<list.length)lotusPool.push(makeLotus());
 lotusPool.forEach((L,n)=>{const l=list[n];if(!l){L.g.visible=false;L.key='';return}const key=l.x+','+l.y;if(key!==L.key){L.key=key;L.born=performance.now()}const c=state.b[l.y]?.[l.x];L.g.position.set(l.x-3.5-.24,.22+(c&&!c.f?.28:0)+.012,l.y-HZ+.24);L.g.visible=true})}
function animateLotus(){for(const L of lotusPool){if(!L.g.visible)continue;const t=(performance.now()-L.born)/1000,open=Math.min(1,t/1.1),e=1-Math.pow(1-open,3);L.g.scale.setScalar((.2+.8*e)*.55);L.g.rotation.y=t*.25;L.glow.material.opacity=.45+.25*Math.sin(t*2.2);L.light.intensity=renderer.isSoftware?0:1.6+.6*Math.sin(t*2.2)}}
const weatherFx=[];
function jaggedBolt(top,bottom,jag,branches){const pts=[];let prev=top.clone();const seg=16;for(let i=1;i<=seg;i++){const p=top.clone().lerp(bottom,i/seg);if(i<seg){p.x+=(Math.random()-.5)*jag;p.z+=(Math.random()-.5)*jag}pts.push(prev,p);
 if(branches&&i>3&&i<seg-2&&Math.random()<.2){let q=p.clone();const end=p.clone().add(new THREE.Vector3((Math.random()-.5)*1.4,-.8-Math.random(),(Math.random()-.5)*1.4));for(let k=1;k<=4;k++){const r=p.clone().lerp(end,k/4);r.x+=(Math.random()-.5)*.2;pts.push(q,r);q=r}}prev=p}return new THREE.BufferGeometry().setFromPoints(pts)}
window.addEventListener('hackenia:lightning',e=>{if(!active)return;const calm=document.documentElement.classList.contains('no-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
 for(const [x,y] of e.detail?.cells||[]){const group=new THREE.Group(),cx=x-3.5,cz=y-HZ,base=new THREE.Vector3(cx,.32,cz);pieces.add(group);const mats=[];
  const geo=jaggedBolt(new THREE.Vector3(cx+(Math.random()-.5)*1.2,9,cz+(Math.random()-.5)*1.2),base,.55,true);
  const pos=geo.attributes.position,path=new THREE.CurvePath();for(let k=0;k<pos.count;k+=2)path.add(new THREE.LineCurve3(new THREE.Vector3().fromBufferAttribute(pos,k),new THREE.Vector3().fromBufferAttribute(pos,k+1)));geo.dispose();
  for(const [color,op,rad] of [[0x6fc8ff,.55,.16],[0xf4fcff,1,.05]]){const m=new THREE.MeshBasicMaterial({color,transparent:true,opacity:calm?0:op,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});mats.push(m);const tube=new THREE.Mesh(new THREE.TubeGeometry(path,pos.count,rad,5,false),m);tube.frustumCulled=false;group.add(tube)}
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:energyGlowTexture(),color:0xbfe9ff,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false}));glow.position.copy(base);glow.scale.setScalar(3.2);group.add(glow);mats.push(glow.material);
  const scorch=new THREE.Mesh(new THREE.CircleGeometry(.48,24),new THREE.MeshBasicMaterial({map:energyGlowTexture(),color:0x2a1d14,transparent:true,opacity:.85,depthWrite:false}));scorch.rotation.x=-Math.PI/2;scorch.position.set(cx,.215,cz);group.add(scorch);mats.push(scorch.material);
  const light=new THREE.PointLight(0xcdeeff,calm?4:60,8,1.4);if(!calm){const fl=document.createElement('div');fl.className='storm-flash';host.append(fl);setTimeout(()=>fl.remove(),700)}light.position.set(cx,1.4,cz);group.add(light);
  weatherFx.push({kind:'bolt',group,mats,light,glow,scorch,start:performance.now()+Math.random()*120})}});
function windStreakTexture(){if(windStreakTexture.t)return windStreakTexture.t;const c=document.createElement('canvas');c.width=256;c.height=32;const g=c.getContext('2d'),gr=g.createLinearGradient(0,0,256,0);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.5,'rgba(255,255,255,.95)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.beginPath();g.ellipse(128,16,128,5,0,0,7);g.fill();return windStreakTexture.t=new THREE.CanvasTexture(c)}
window.addEventListener('hackenia:wind',e=>{if(!active)return;const now=performance.now(),calm=document.documentElement.classList.contains('no-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const ids=new Set((e.detail?.moves||[]).map(m=>m.id));for(const g of creatures.values())if(ids.has(g.userData.k?.id)){g.userData.shakeStart=now;g.userData.holdUntil=now+(calm?0:750);g.userData.windSlide=now+2200}
 if(calm)return;const group=new THREE.Group();pieces.add(group);const streaks=[];
 for(let i=0;i<30;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(2.6+Math.random()*3,.3),new THREE.MeshBasicMaterial({map:windStreakTexture(),color:0xffffff,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,fog:false}));m.rotation.x=-.45;m.renderOrder=6;group.add(m);
  streaks.push({m,z:(Math.random()-.5)*BH,y:.45+Math.random()*1.4,speed:7+Math.random()*4,delay:Math.random()*.6})}
 const veil=document.createElement('div');veil.className='wind-veil';veil.innerHTML='<span>🍃 Rafale !</span>';host.append(veil);setTimeout(()=>veil.remove(),1900);weatherFx.push({kind:'wind',group,streaks,start:now})});
// v244 — Vents de Hacko : une petite tornade se forme, fait tournoyer la créature, l'emporte (avec sa dalle) et la dépose ailleurs.
function tornadoTexture(){if(tornadoTexture.t)return tornadoTexture.t;const c=document.createElement('canvas');c.width=128;c.height=256;const g=c.getContext('2d');g.fillStyle='rgba(255,255,255,.38)';g.fillRect(0,0,128,256);for(let i=0;i<10;i++){g.fillStyle='rgba(255,255,255,.18)';g.fillRect(Math.random()*128,0,6+Math.random()*14,256)}for(let i=0;i<46;i++){const y=Math.random()*256,w=40+Math.random()*80,x=Math.random()*128;g.strokeStyle=`rgba(255,255,255,${.25+Math.random()*.55})`;g.lineWidth=1+Math.random()*3;g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+w*.3,y-10,x+w*.7,y+8,x+w,y-4);g.stroke()}const v=g.createLinearGradient(0,0,0,256);v.addColorStop(0,'rgba(0,0,0,1)');v.addColorStop(.75,'rgba(0,0,0,.8)');v.addColorStop(1,'rgba(0,0,0,0)');g.globalCompositeOperation='destination-in';g.fillStyle=v;g.fillRect(0,0,128,256);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return tornadoTexture.t=t}
window.addEventListener('hackenia:tornado',e=>{if(!active)return;const d=e.detail||{},now=performance.now(),calm=document.documentElement.classList.contains('no-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const from=new THREE.Vector3(d.from[0]-3.5,0,d.from[1]-HZ),to=d.to?new THREE.Vector3(d.to[0]-3.5,0,d.to[1]-HZ):null;
 if(d.id!=null&&to&&!calm)for(const g of creatures.values())if(g.userData.k?.id===d.id){g.userData.fly={from:from.clone(),to:to.clone(),start:now,dur:2600}}
 if(calm)return;const group=new THREE.Group();group.position.copy(from);pieces.add(group);const layers=[];
 for(let k=0;k<3;k++){const prof=[];for(let i=0;i<=10;i++){const h=i/10;prof.push(new THREE.Vector2(.08+Math.pow(h,1.6)*(.62+k*.12),h*(1.9+k*.15)))}const m=new THREE.Mesh(new THREE.LatheGeometry(prof,28),new THREE.MeshBasicMaterial({map:tornadoTexture(),color:k===0?0x5f7a68:k===1?0xf4fbf6:0xd8e8dc,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,fog:false}));m.material.map=tornadoTexture();m.renderOrder=7;group.add(m);layers.push({m,speed:7+k*2.5,base:k===0?.7:.95-k*.1})}/* couche intérieure sombre : le tourbillon se détache sur l'herbe claire */
 const debris=[];for(let i=0;i<16;i++){const m=new THREE.Mesh(new THREE.PlaneGeometry(.09,.05),new THREE.MeshBasicMaterial({color:i%3?0x7fb35a:0xc9b27a,side:THREE.DoubleSide,transparent:true,opacity:0}));group.add(m);debris.push({m,a:Math.random()*6,h:.2+Math.random()*1.6,r:.25+Math.random()*.45,v:5+Math.random()*4})}
 const dust=new THREE.Mesh(new THREE.RingGeometry(.2,.75,32),new THREE.MeshBasicMaterial({color:0xd9e6d4,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));dust.rotation.x=-Math.PI/2;dust.position.y=.24;group.add(dust);
 const veil=document.createElement('div');veil.className='wind-veil';veil.innerHTML='<span>🌪️ Tornade !</span>';host.append(veil);setTimeout(()=>veil.remove(),1900);
 weatherFx.push({kind:'tornado',group,layers,debris,dust,from,to,start:now})});
function updateWeather(){const now=performance.now();for(let i=weatherFx.length-1;i>=0;i--){const f=weatherFx[i],t=(now-f.start)/1000;if(t<0)continue;
 if(f.kind==='bolt'){const flick=t<.1?1:t<.18?.25:t<.3?1:t<.38?.4:Math.max(0,1-(t-.38)/.5);f.mats[0].opacity=f.mats[0].opacity&&.55*flick;f.mats[1].opacity=f.mats[1].opacity&&flick;f.glow.material.opacity=Math.max(0,1-t/1);f.glow.scale.setScalar(3.2+t*2.5);f.light.intensity=flick*60;f.scorch.material.opacity=.85*Math.max(0,1-Math.max(0,t-1.2)/1.3);
  if(t>2.6){pieces.remove(f.group);f.group.traverse(o=>{o.geometry?.dispose?.();o.material?.dispose?.()});weatherFx.splice(i,1)}}
 else if(f.kind==='tornado'){const T=3.1,grow=Math.min(1,t/.75),fade=Math.max(0,Math.min(1,(t-2.15)/.95)),move=f.to?Math.max(0,Math.min(1,(t-.78)/1.2)):0,ease=move*move*(3-2*move);if(f.to)f.group.position.copy(f.from).lerp(f.to,ease);
  const k=grow*(1-fade);for(const L of f.layers){L.m.rotation.y=-t*L.speed;L.m.scale.set(.4+.6*k,.3+.7*k,.4+.6*k);L.m.material.opacity=L.base*k;L.m.material.map.offset.set(t*.9,-t*.6)}
  for(const D of f.debris){const a=D.a+t*D.v;D.m.position.set(Math.cos(a)*D.r*(.5+D.h*.4),D.h*k,Math.sin(a)*D.r*(.5+D.h*.4));D.m.rotation.set(a,a*1.3,0);D.m.material.opacity=k}
  f.dust.material.opacity=.45*k;f.dust.scale.setScalar(.8+Math.sin(t*6)*.06+k*.4);
  if(t>T){pieces.remove(f.group);f.group.traverse(o=>{o.geometry?.dispose?.();if(o.material&&o.material.map!==tornadoTexture.t)o.material.dispose?.();else o.material?.dispose?.()});weatherFx.splice(i,1)}}
 else{let alive=false;for(const s of f.streaks){const u=t-s.delay;if(u<0){alive=true;continue}const x=7-u*s.speed;s.m.position.set(x,s.y,s.z);s.m.material.opacity=x>-7?.9*Math.min(1,u*3)*Math.min(1,(x+7)/3):0;s.m.position.y=s.y+Math.sin(u*4+s.z)*.15;if(x>-7)alive=true}
  if(!alive){pieces.remove(f.group);f.group.traverse(o=>{o.geometry?.dispose?.();o.material?.dispose?.()});weatherFx.splice(i,1)}}}}
// v247 — Passants des décors (ville de Dassom) : un personnage du jeu avec son animation de marche, à taille de figurant.
async function spawnWalker(key,height=.8,kind='walk',tint=null){try{const man=await (spawnWalker.man??=fetch('assets/manifest.json').then(r=>r.json())),info=man.creatures?.[key];if(!info?.glb||(kind&&!info.animations?.[kind]))return null;/* v248 : n'importe quel clip (marche, attaque…), ou aucun (modèle statique), avec teinte élémentaire */const url='assets/'+info.glb;
 if(!modelCache.has(url))modelCache.set(url,(async()=>{const tools=await getModelTools();const gltf=await tools.loader.loadAsync(url);return{gltf,clone:tools.clone}})().catch(()=>null));
 const asset=await modelCache.get(url);if(!asset)return null;const root=asset.clone(asset.gltf.scene),pivot=new THREE.Group(),group=new THREE.Group();pivot.add(root);group.add(pivot);root.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(root),size=b.getSize(new THREE.Vector3());if(!(size.y>0))return null;
 const sc=height/size.y;root.scale.setScalar(sc);root.position.set(-(b.min.x+b.max.x)*sc/2,-b.min.y*sc,-(b.min.z+b.max.z)*sc/2);root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});if(tint)applyLook(root,{kind:'tint',color:tint});pivot.rotation.y=info.boardYaw??0;
 if(!kind)return{group,update(){}};const clip=await getCombatClip(info.animations[kind]);if(!clip)return null;const mixer=new THREE.AnimationMixer(root);mixer.clipAction(clip,root).play();
 return{group,update(dt){mixer.update(dt);orientBoardModel(root,pivot,{},info.boardYaw??0,THREE)}}}catch{return null}}
/* v267 — Combattant décoratif : pose d'attente (clip embarqué dans le modèle) et attaque à la demande (clip du manifeste), fondu enchaîné. */
async function spawnFighter(key,height=.9){try{const man=await (spawnWalker.man??=fetch('assets/manifest.json').then(r=>r.json())),info=man.creatures?.[key];if(!info?.glb)return null;const url='assets/'+info.glb;
 if(!modelCache.has(url))modelCache.set(url,(async()=>{const tools=await getModelTools();const gltf=await tools.loader.loadAsync(url);return{gltf,clone:tools.clone}})().catch(()=>null));
 const asset=await modelCache.get(url);if(!asset)return null;const root=asset.clone(asset.gltf.scene),pivot=new THREE.Group(),group=new THREE.Group();pivot.add(root);group.add(pivot);root.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(root),size=b.getSize(new THREE.Vector3());if(!(size.y>0))return null;
 const sc=height/size.y;root.scale.setScalar(sc);root.position.set(-(b.min.x+b.max.x)*sc/2,-b.min.y*sc,-(b.min.z+b.max.z)*sc/2);root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});pivot.rotation.y=info.boardYaw??0;
 const mixer=new THREE.AnimationMixer(root),idleClip=asset.gltf.animations?.[0],idle=idleClip?mixer.clipAction(idleClip,root):null;idle?.play();
 let atk=null;const attackClip=info.animations?.spell?await getCombatClip(info.animations.spell):null;if(attackClip){atk=mixer.clipAction(attackClip,root);atk.setLoop(THREE.LoopOnce,1);atk.clampWhenFinished=false}
 return{group,pivot,update(dt){mixer.update(dt);orientBoardModel(root,pivot,{},info.boardYaw??0,THREE)},attack(){if(!atk)return;atk.reset().setEffectiveWeight(1).fadeIn(.12).play();idle?.crossFadeTo?.(atk,.15,false);setTimeout(()=>{idle?.reset().play().fadeIn(.25);atk.fadeOut(.25)},Math.max(400,(attackClip.duration||1.2)*1000-250))}}}catch{return null}}
/* v268 — Dés double et triple élément : plusieurs bébémentaires réduits sur la même case. Chacun a son propre mixeur ; un « mixeur composite »
   reprend l'interface d'un seul (clipAction, update, stopAllAction) pour que les clips d'attaque, de marche et de victoire jouent sur tous à la fois. */
class PartsAction{constructor(a){this.a=a}reset(){this.a.forEach(x=>x.reset());return this}setLoop(m,n){this.a.forEach(x=>x.setLoop(m,n));return this}set clampWhenFinished(v){this.a.forEach(x=>{x.clampWhenFinished=v})}
 setEffectiveTimeScale(v){this.a.forEach(x=>x.setEffectiveTimeScale(v));return this}setEffectiveWeight(v){this.a.forEach(x=>x.setEffectiveWeight(v));return this}fadeIn(d){this.a.forEach(x=>x.fadeIn(d));return this}fadeOut(d){this.a.forEach(x=>x.fadeOut(d));return this}play(){this.a.forEach(x=>x.play());return this}stop(){this.a.forEach(x=>x.stop());return this}}
const fittedClips=new WeakMap();/* clip du premier bébémentaire réutilisé sur les autres : on retire les pistes dont l'os n'existe pas (pas d'avertissements) */
function fitClip(clip,root){let m=fittedClips.get(clip);if(!m)fittedClips.set(clip,m=new WeakMap());if(m.has(root))return m.get(root);const names=new Set();root.traverse(o=>names.add(o.name));const tracks=clip.tracks.filter(t=>names.has(t.name.split('.')[0]));const c=new THREE.AnimationClip(clip.name,clip.duration,tracks);m.set(root,c);return c}
class PartsMixer{constructor(p){this.p=p}clipAction(clip){return new PartsAction(this.p.map(q=>q.mixer.clipAction(fitClip(clip,q.root),q.root)))}update(dt){this.p.forEach(q=>q.mixer.update(dt))}stopAllAction(){this.p.forEach(q=>q.mixer.stopAllAction())}}
async function attachCompositeModel(g,k,info){const mi=k.mi;const man=await (spawnWalker.man??=fetch('assets/manifest.json').then(r=>r.json()));
 const three=info.parts.length>2,layout=three?[[-.27,.17],[.27,.17],[0,-.2]]:[[-.25,.06],[.25,.06]],H=(three?.66:.8)*(game.monsters[mi]?.boardScale||1);
 const holder=new THREE.Group();holder.userData.imported=true;g.userData.idleModelYaw=info.boardYaw??0;holder.rotation.y=g.userData.idleModelYaw;const parts=[];
 for(let i=0;i<info.parts.length;i++){const pi=man.creatures?.[info.parts[i]];if(!pi?.glb)return;const url='assets/'+pi.glb;
  if(!modelCache.has(url))modelCache.set(url,(async()=>{const exists=await fetch(url,{method:'HEAD'});if(!exists.ok)return null;const tools=await getModelTools();const gltf=await tools.loader.loadAsync(url);return{gltf,clone:tools.clone}})().catch(()=>null));
  const asset=await modelCache.get(url);if(!asset||!g.parent||g.userData.modelId!==mi)return;
  const root=asset.clone(asset.gltf.scene),sub=new THREE.Group();sub.add(root);root.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(root),size=b.getSize(new THREE.Vector3());if(!(size.y>0))return;
  const sc=H/size.y;root.scale.setScalar(sc);root.position.set(-(b.min.x+b.max.x)*sc/2,-b.min.y*sc+.1,-(b.min.z+b.max.z)*sc/2);sub.position.set(layout[i][0],0,layout[i][1]);
  if(game.monsters[mi]?.variant)applyLook(root,game.monsters[mi].variant);root.traverse(o=>{o.userData.imported=true;if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});holder.add(sub);parts.push({root,asset,mixer:asset.gltf.animations.length?new THREE.AnimationMixer(root):null})}
 g.children.forEach((o,i)=>{if(i>0)o.visible=false});g.add(holder);g.userData.model=holder;g.userData.modelRoot=parts[0].root;g.userData.animationInfo=info;if(game.monsters[mi]?.shiny)addCrackle(g);
 if(game.rarity?.(game.monsters[mi]||{})===6)addDivineAura(g,game.monsters[mi]);
 const live=parts.filter(q=>q.mixer);if(live.length){const idleOf=q=>q.asset.gltf.animations.find(a=>/idle|stand|breath/i.test(a.name))||q.asset.gltf.animations[0];
  const idle=new PartsAction(live.map(q=>q.mixer.clipAction(idleOf(q))));idle.play();g.userData.idleAction=idle;g.userData.activeAction=idle;g.userData.mixer=new PartsMixer(live);
  for(const kind of ['spell','victory','walk'])if(info.animations?.[kind])getCombatClip(info.animations[kind]).catch(()=>null)}}
async function attachCreatureModel(g,k){
 const mi=k.mi;g.userData.modelId=mi;
 try{const info=await game.modelInfo(mi);if(!info?.glb)return;if(info.parts?.length>1){await attachCompositeModel(g,k,info);return}const url='assets/'+info.glb+(mi===37?'?revision=kala-idle-dc1986a2':mi===36?'?revision=eberien-idle-14d7089a':'');
 if(!modelCache.has(url))modelCache.set(url,(async()=>{const exists=await fetch(url,{method:'HEAD'});if(!exists.ok)return null;const tools=await getModelTools();const gltf=await tools.loader.loadAsync(url);return{gltf,clone:tools.clone}})().catch(()=>null));
 const asset=await modelCache.get(url);if(!asset||!g.parent||g.userData.modelId!==mi)return;
 const root=asset.clone(asset.gltf.scene),holder=new THREE.Group();holder.userData.imported=true;if(game.monsters[mi]?.variant)applyLook(root,game.monsters[mi].variant);g.userData.idleModelYaw=info.boardYaw??0;holder.rotation.y=g.userData.idleModelYaw;holder.add(root);root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3());if(!Number.isFinite(size.y)||size.y<=0)return;
 const scale=.9*(info.boardHeight?info.boardHeight/size.y:Math.min(.95/size.y,.78/Math.max(size.x,.01),.78/Math.max(size.z,.01)))*(game.monsters[mi]?.boardScale||1);root.scale.setScalar(scale);/* v256 — boardScale : version plus grosse d'un même modèle */root.position.set(-(bounds.min.x+bounds.max.x)*scale/2,-bounds.min.y*scale+.1,-(bounds.min.z+bounds.max.z)*scale/2);if(mi===37){/* Le modèle est déjà centré dans root.position avant rotation. Ne pas le décaler une seconde fois. */holder.position.z=.42;}
 root.traverse(o=>{o.userData.imported=true;if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});g.children.forEach((o,i)=>{if(i>0)o.visible=false});if(info.gesture){const gest=new THREE.Group();gest.userData.imported=true;gest.add(holder);g.add(gest);g.userData.gest={node:gest,kind:info.gesture,phase:Math.random()*6}}else g.add(holder);g.userData.model=holder;
 g.userData.animationInfo=info;g.userData.modelRoot=root;if(game.monsters[mi]?.shiny)addCrackle(g);
 // v207 — Personnage sans clips d'animation (ex. Messire Balai) : petits bonds sur place de temps en temps.
 if(!info.animations&&!info.gesture)g.userData.hop={base:holder.position.y,phase:Math.random()*3.2};
 if(game.rarity?.(game.monsters[mi]||{})===6)addDivineAura(g,game.monsters[mi]);
 if(asset.gltf.animations.length){const mixer=new THREE.AnimationMixer(root),idle=asset.gltf.animations.find(a=>/idle|stand|breath/i.test(a.name))||asset.gltf.animations[0];g.userData.idleAction=mixer.clipAction(idle);g.userData.idleAction.play();g.userData.activeAction=g.userData.idleAction;g.userData.mixer=mixer;for(const kind of ['spell','victory','walk'])if(info.animations?.[kind])getCombatClip(info.animations[kind]).catch(()=>null)}
 }catch(error){console.info('Figurine provisoire conservée pour ce modèle.',mi)}
}
/* v256 — Gestuelle procédurale des créatures sans clip (araignées) : respiration au repos, coup de tête en avant
   quand elle attaque, cabrage de joie quand elle gagne un combat ou la partie. */
function animateGesture(g,k,f,combat,t){const G=g.userData.gest,n=G.node,T=moving?t:0;let z=0,rx=.07*Math.sin(T*1.9+G.phase),y=.02*Math.abs(Math.sin(T*2.6+G.phase)),rz=.09*Math.sin(T*1.3+G.phase),sy=1+.07*Math.sin(T*2.6+G.phase),sxz=1-.035*Math.sin(T*2.6+G.phase);/* v262 — respiration et balancement plus marqués : l'araignée blanche n'a pas de clip d'animation */
 if(G.kind==='horse'&&moving){/* v267 — Jordan n'a pas de clip : il piaffe (coup de sabot) et secoue la crinière */const t6=Math.pow(Math.max(0,Math.sin(T*1.7+G.phase)),6);rx-=.16*t6;y+=.05*t6;rz+=.05*Math.sin(T*5+G.phase)*t6}
 if(f&&combat&&!combat.reduced){const p=combat.progress,att=k.id===combat.fighters[0].id;
  if(att&&p>.16&&p<.3){const s=Math.sin(Math.PI*(p-.16)/.14);rx=-.22*s;z=-.06*s}
  else if(att&&p>=.3&&p<.58){const s=Math.sin(Math.PI*(p-.3)/.28);rx=.5*s;z=.32*s;y=.04*s}
  if(!f.loser&&p>.7&&combat.stats[0].attack!==combat.stats[1].attack){const s=Math.abs(Math.sin((p-.7)*Math.PI*6));rx=-.38*s;y=.1*s}}
 else if(G.celebrate&&moving){const s=Math.abs(Math.sin(T*4+G.phase));rx=-.34*s;y=.08*s}
 n.position.set(0,y,z);n.rotation.set(rx,0,rz);n.scale.set(sxz,sy,sxz)}
async function getCombatClip(path){const url='assets/'+path;if(!combatClipCache.has(url))combatClipCache.set(url,getModelTools().then(tools=>tools.loader.loadAsync(url)).then(data=>data.animations[0]||null).catch(()=>null));return combatClipCache.get(url)}
async function playCombatClip(g,kind,combat){const tag=combat.sequence+':'+kind;if(g.userData.combatClipTag===tag)return;const path=g.userData.animationInfo?.animations?.[kind];if(!path||!g.userData.mixer)return;g.userData.combatClipTag=tag;const clip=await getCombatClip(path);if(!clip||!g.parent||g.userData.combatClipTag!==tag||window.HackeniaCombat?.current()?.sequence!==combat.sequence)return;if(kind==='spell'&&combat.progress>.65)return;const next=g.userData.mixer.clipAction(clip,g.userData.modelRoot),previous=g.userData.activeAction;if(previous!==next)previous?.fadeOut(.12);next.reset().setLoop(THREE.LoopOnce,1);next.clampWhenFinished=true;if(kind==='victory'){const speed=Math.max(1,clip.duration/4);next.setEffectiveTimeScale(speed);window.HackeniaCombat?.holdVictory(combat.sequence,clip.duration/speed)}else next.setEffectiveTimeScale(1);next.fadeIn(.12).play();g.userData.activeAction=next}
// v198 — Fin de partie : les personnages du camp gagnant jouent leur animation de victoire en boucle.
async function celebrateWinners(seat){for(const g of [...creatures.values()]){const k=g.userData.k;if(k&&g.userData.gest)g.userData.gest.celebrate=k.o===seat;if(!k||k.o!==seat||!g.userData.mixer)continue;const path=g.userData.animationInfo?.animations?.victory;if(!path)continue;const clip=await getCombatClip(path);if(!clip||!g.parent||!g.userData.mixer)continue;const next=g.userData.mixer.clipAction(clip,g.userData.modelRoot),previous=g.userData.activeAction;if(previous!==next)previous?.fadeOut(.25);next.reset().setLoop(THREE.LoopRepeat,Infinity);next.clampWhenFinished=false;next.setEffectiveTimeScale(1);next.fadeIn(.25).play();g.userData.activeAction=next}}
window.addEventListener?.('hackenia-match-end',event=>{const seat=event.detail?.winner;if(seat===0||seat===1)setTimeout(()=>celebrateWinners(seat),400)});
async function playWalkClip(g,k){if(g.userData.walkTag===k.walk.started)return;g.userData.walkTag=k.walk.started;const path=g.userData.animationInfo?.animations?.walk;if(!path||!g.userData.mixer)return;const clip=await getCombatClip(path);if(!clip||!g.parent||g.userData.walkTag!==k.walk.started||Date.now()>k.walk.started+k.walk.duration)return;const next=g.userData.mixer.clipAction(clip,g.userData.modelRoot);g.userData.activeAction?.fadeOut(.12);next.reset().setLoop(THREE.LoopRepeat,Infinity);next.clampWhenFinished=false;next.fadeIn(.12).play();g.userData.activeAction=next}
const combatFX=new THREE.Group();world.add(combatFX);
const combatRingMaterial=new THREE.MeshBasicMaterial({color:0xffdfa4,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false});
const combatRings=[0,1].map(()=>{const ring=new THREE.Mesh(new THREE.RingGeometry(.35,.40,40),combatRingMaterial.clone());ring.rotation.x=-Math.PI/2;combatFX.add(ring);return ring});
const impactRing=new THREE.Mesh(new THREE.RingGeometry(.24,.31,48),combatRingMaterial.clone());impactRing.rotation.x=-Math.PI/2;combatFX.add(impactRing);
const combatOrb=new THREE.Mesh(new THREE.SphereGeometry(.11,10,8),new THREE.MeshBasicMaterial({color:0xffe8aa}));combatFX.add(combatOrb);combatFX.visible=false;let attackFx=null;/* v244 — effets d'attaque par style et élément */
function updateCombatFX(combat){combatFX.visible=!!combat&&combat.kind!=='passage';if(!combat||combat.kind==='passage'){attackFx?.update(null,{});return}const p=combat.progress,[a,d]=combat.fighters,col=game.elementColors[combat.stats[0].element]||'#ffe2a0';for(let i=0;i<2;i++){const unit=combat.fighters[i],ring=combatRings[i];ring.position.set(unit.x-3.5,.525,unit.y-HZ);ring.material.color.set(i===0?col:'#f7a77b');ring.scale.setScalar(combat.reduced?1:1+Math.sin(p*12)*.06);ring.material.opacity=.55}
 const flight=Math.min(1,Math.max(0,(p-.25)/.20));combatOrb.visible=false;attackFx??=createCombatFx(world,energyGlowTexture());{const am=game.monsters[a.mi];attackFx.update(combat,{style:attackStyle(am),element:combat.stats[0].element||am?.el||'',color:col,hz:HZ})}combatOrb.material.color.set(col);combatOrb.position.set(a.x-3.5+(d.x-a.x)*flight,.92+Math.sin(flight*Math.PI)*.2,a.y-HZ+(d.y-a.y)*flight);
 const shock=Math.max(0,(p-.44)/.21);impactRing.visible=p>.44&&p<.65;impactRing.position.set(d.x-3.5,.54,d.y-HZ);impactRing.material.color.set(col);impactRing.scale.setScalar(combat.reduced?1:1+shock*2.5);impactRing.material.opacity=1-Math.min(1,shock);
}
function disposeHighlights(){for(const m of [...highlights.children]){highlights.remove(m);if(!m.userData.cachedLabel)m.material.dispose()}}
function highlight(x,y,color,level=.235,opacity=.36){const m=new THREE.Mesh(highlightGeo,new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x-3.5,level,y-HZ);highlights.add(m)}
function creature(k){const g=new THREE.Group(),col=game.elementColors[game.monsters[k.mi]?.el]||'#b5c793';let material=creatureMats.get(col);if(!material){material=mat(col,{roughness:.48});creatureMats.set(col,material)}
const foot=mesh(new THREE.CylinderGeometry(.29,.33,.1,16),k.o?orange:green,g);foot.position.y=.05;
const body=mesh(sphere,material,g);body.position.y=.35;body.scale.set(.24,.26,.21);
const head=mesh(sphere,material,g);head.position.set(0,.62,-.04);head.scale.set(.25,.21,.22);
for(const x of[-.11,.11]){const ear=mesh(new THREE.ConeGeometry(.08,.26,5),gold,g);ear.position.set(x,.85,-.035);ear.rotation.z=-x*2;const eye=mesh(sphere,eyeMaterial,g);eye.position.set(x,.66,.155);eye.scale.set(.037,.046,.025)}
const tail=mesh(new THREE.ConeGeometry(.09,.36,7),material,g);tail.position.set(0,.29,-.25);tail.rotation.x=-1;
g.userData.k=k;pieces.add(g);attachCreatureModel(g,k);return g}
const layoutGroup=new THREE.Group();world.add(layoutGroup);let layoutKey='';
// v246/v247 — Formes de plateau : un obstacle sur chaque case infranchissable, dans le style du terrain (aussi dans l'aperçu).
let previewLayout='classique';
function layoutObstacle(type,g){const R=Math.random,box=(c,w=.94,h=.12,y=0)=>{const b=mesh(new THREE.BoxGeometry(w,h,w),mat(c,{roughness:.95}),g);b.position.y=y;return b},
  rock=(c,extra={})=>{const r=mesh(new THREE.DodecahedronGeometry(.36,1),mat(c,{roughness:.9,flatShading:true,...extra}),g);r.position.y=.28;r.scale.set(1,.85,1);r.rotation.set(R(),R()*6,R());return r},
  cap=(c,y=.52,s=.2)=>{const m=mesh(new THREE.SphereGeometry(s,8,5,0,Math.PI*2,0,Math.PI/2),mat(c,{roughness:1}),g);m.position.set(.05,y,.02);m.scale.set(1,.35,1);return m};
 if(type==='feu'){box(0x1c1617);const lava=new THREE.Mesh(new THREE.CircleGeometry(.44,20),new THREE.MeshBasicMaterial({color:0xff6a22}));lava.rotation.x=-Math.PI/2;lava.position.y=.065;g.add(lava);rock(0x2a2224,{emissive:0xff4a12,emissiveIntensity:.35});for(let k=0;k<3;k++){const e=new THREE.Mesh(new THREE.SphereGeometry(.04,6,4),new THREE.MeshBasicMaterial({color:0xffb347}));const a=k*2.1;e.position.set(Math.cos(a)*.3,.2+R()*.2,Math.sin(a)*.3);g.add(e)}}
 else if(type==='glace'){box(0xdfe9f0);const ice=mesh(new THREE.IcosahedronGeometry(.36,0),new THREE.MeshPhysicalMaterial({color:0x9fdcf8,roughness:.08,transparent:true,opacity:.88,clearcoat:1,flatShading:true}),g);ice.position.y=.32;ice.scale.set(1,1.15,1);ice.rotation.y=R()*6;cap(0xffffff,.62,.22)}
 else if(type==='vent'){box(0x5f9a4c);const st=mesh(new THREE.CylinderGeometry(.15,.24,.85,6),mat(0xa3ab9f,{flatShading:true}),g);st.position.y=.48;st.rotation.set((R()-.5)*.15,R()*6,(R()-.5)*.15);for(let k=0;k<5;k++){const t=mesh(new THREE.ConeGeometry(.04,.22,4),mat(0x7fc25a),g);const a=k*1.26;t.position.set(Math.cos(a)*.32,.17,Math.sin(a)*.32)}}
 else if(type==='eau'){box(0x9a948f);rock(0xc9a6ac);cap(0x5f8a43)}
 else if(type==='foudre'){box(0x1e1a2c);rock(0x34304a);const c=mesh(new THREE.OctahedronGeometry(.14,0),new THREE.MeshStandardMaterial({color:0xe0ccff,emissive:0x9a6bff,emissiveIntensity:1.3,flatShading:true}),g);c.scale.set(1,2,1);c.position.y=.72;c.rotation.z=.2}
 else if(type==='ville'){box(0x8f857a);const b=mesh(new THREE.BoxGeometry(.6,.5,.6),mat(0xb5a894),g);b.position.y=.31;box(0x8f857a,.7,.08,.6);const pot=mesh(new THREE.IcosahedronGeometry(.2,1),mat(0x5f8f3e,{flatShading:true}),g);pot.position.y=.8;for(let k=0;k<4;k++){const f=mesh(new THREE.SphereGeometry(.04,6,4),mat([0xd8402b,0xf2b632,0xe7a6d8,0xffffff][k]),g);f.position.set(Math.cos(k*1.6)*.16,.92,Math.sin(k*1.6)*.16)}}
 else if(type==='grotte'){box(0x2d2926);for(const [dx,dz,h,r] of[[0,0,.85,.22],[.2,.14,.5,.14],[-.18,-.12,.4,.12]]){const c=mesh(new THREE.ConeGeometry(r,h,7),mat(0x857868,{flatShading:true}),g);c.position.set(dx,.06+h/2,dz)}const m=mesh(new THREE.SphereGeometry(.07,8,5,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:0x6ff2e0,emissive:0x1fbfa8,emissiveIntensity:1.1}),g);m.position.set(-.25,.14,.22)}
 else{box(0x4a4540);rock(0x7d756c);cap(0x6b8f45)}}
function updateLayout(){const terrain=previewMode?previewTerrain:state.terrain,cells=previewMode?(game.layouts?.[previewLayout]?.cells||[]):(game.layoutCells?.()||[]),key=terrain+':'+cells.join('|');if(key===layoutKey)return;layoutKey=key;for(const o of [...layoutGroup.children]){layoutGroup.remove(o);o.traverse(n=>{n.geometry?.dispose?.();n.material?.dispose?.()})}
 for(const [x,y] of cells){const g=new THREE.Group();g.position.set(x-3.5,.2,y-HZ);layoutGroup.add(g);layoutObstacle(terrain,g)}}
function fadeObject(object,opacity){const bindings=object.userData.fadeBindings??=new Map(),materials=object.userData.fadeMaterials??=[];object.traverse(node=>{if(!node.material)return;let binding=bindings.get(node);if(!binding){const clone=material=>{const copy=material.clone();if(material.onBeforeCompile&&material.userData.hkLook){copy.onBeforeCompile=material.onBeforeCompile;copy.customProgramCacheKey=material.customProgramCacheKey;copy.userData.hkLook=true}/* v215 — garde l'effet de variante (statue, métal, teinte) */copy.transparent=true;copy.depthWrite=false;copy.userData.fadeOpacity=material.opacity;materials.push(copy);return copy};binding=Array.isArray(node.material)?node.material.map(clone):clone(node.material);bindings.set(node,binding)}node.material=binding});for(const material of materials)material.opacity=material.userData.fadeOpacity*opacity}
function sync(){state=game.snapshot();updateLayout();const type=previewMode?previewTerrain:state.terrain;setActive(['terre','feu','glace','eau','vent','foudre','ville','grotte','automne','noel'].includes(type),type);if(!active)return;updateFoliage();
 const live=new Set();for(let y=0;y<BH;y++)for(let x=0;x<8;x++){const c=state.b[y][x],key=x+','+y;if(!c)continue;live.add(key);let t=tiles.get(key);if(!t){const pivot=new THREE.Group();pieces.add(pivot);const solid=mesh(tileGeo,c.o?orange:green,pivot),top=new THREE.Mesh(topGeo,label(c.v,c.mu?'multi':c.el,0,c.o?1:0));top.rotation.x=-Math.PI/2;pivot.add(top);t={pivot,solid,top};tiles.set(key,t)}
 const h=c.f?.035:.28;t.pivot.position.set(x-3.5,.22,y-HZ);t.pivot.rotation.set(0,0,0);t.solid.scale.y=h;t.solid.position.set(0,h/2,0);t.solid.material=c.o?orange:green;t.top.position.set(0,h+.004,0);t.top.visible=!c.f;t.top.material=label(c.v,c.mu?'multi':c.el,Math.max(0,game.power(x,y)-c.v),c.o?1:0);t.c=c;t.x=x;t.y=y;t.an=state.anim?.o[key];}
 for(const[key,t]of tiles)if(!live.has(key)){pieces.remove(t.pivot);t.pivot.userData.fadeMaterials?.forEach(m=>m.dispose());tiles.delete(key)}
 const liveCr=new Set();for(const k of state.cr){const key=k.id;liveCr.add(key);let g=creatures.get(key);if(!g){g=creature(k);g.position.set(k.x-3.5,.23,k.y-HZ);creatures.set(key,g)}if(g.userData.modelId!==k.mi){g.userData.mixer?.stopAllAction();if(g.userData.model){g.remove(g.userData.model);g.userData.model=null}g.userData.mixer=null;g.children.forEach(o=>o.visible=true);attachCreatureModel(g,k)}g.userData.k=k;const c=state.b[k.y][k.x];g.userData.target=new THREE.Vector3(k.x-3.5,.23+(c&&!c.f?.28:0),k.y-HZ);}
 for(const[key,g]of creatures)if(!liveCr.has(key)){pieces.remove(g);g.userData.fadeMaterials?.forEach(m=>m.dispose());g.userData.mixer?.stopAllAction();g.traverse(o=>{if(o.isMesh&&!o.userData.imported&&o.geometry!==sphere)o.geometry.dispose()});creatures.delete(key)}
 disposeHighlights();const previewElement=game.monsters[state.die]?.el,previewColor=game.elementColors[previewElement]||0xf2d880;for(const a of state.preview)if(a[0]>=0&&a[0]<8&&a[1]>=0&&a[1]<BH&&!game.isBlocked(a[0],a[1])){const c=state.b[a[1]][a[0]];highlight(a[0],a[1],previewColor,.24+(c&&!c.f?.28:0),.88)}
 if(state.reachable)for(const key of Object.keys(state.reachable)){if(state.reachable[key]===null)continue;const[x,y]=key.split(',').map(Number),k=state.cr.find(c=>c.x===x&&c.y===y);if(k&&k.o===state.cur)continue;const c=state.b[y][x];highlight(x,y,k?0xed806d:0xa5e2d2,.25+(c&&!c.f?.28:0))}
 if(state.tutorial)for(const [x,y] of state.tutorial){const c=state.b[y]?.[x];highlight(x,y,0xffa800,.265+(c&&!c.f?.28:0),.9)}  if(state.movePlan){const p=state.movePlan,x=p.previewX??p.x,y=p.previewY??p.y,c=state.b[y]?.[x];highlight(x,y,0xff303f,.29+(c&&!c.f?.28:0),.95)}
 updateZoneLabels();updateLotus();
 if(state.sel)highlight(state.sel.x,state.sel.y,0xffe7a5,.26+(state.b[state.sel.y][state.sel.x]&&!state.b[state.sel.y][state.sel.x].f?.28:0));
 if(state.cu&&Date.now()-state.lastJ<3000){const c=state.b[state.cu.y][state.cu.x];highlight(state.cu.x,state.cu.y,0xe8efb5,.26+(c&&!c.f?.28:0))}
 for(const [x,y,v] of state.preview){if(x<0||x>=8||y<0||y>=BH||game.isBlocked(x,y)||(state.cr.some(k=>k.x===x&&k.y===y)&&!state.previewCrushed?.some(q=>q[0]===x&&q[1]===y)))continue;const top=new THREE.Mesh(topGeo,label(v,game.monsters[state.die]?.multi?'multi':previewElement,game.previewBonus(x,y)));top.rotation.x=-Math.PI/2;const c=state.b[y][x];top.position.set(x-3.5,.275+(c&&!c.f?.28:0),y-HZ);top.userData.cachedLabel=true;highlights.add(top)}for(const [x,y] of state.previewCrushed||[])highlight(x,y,0xff3b3b,.6,.55);/* v242 — créature adverse de niveau inférieur : elle sera écrasée */
 const show=!previewMode&&(state.mode==='p'||state.mode==='r'||state.mode==='d')&&(state.pc||(state.mode==='d'&&state.hov));dieGroup.visible=!!show;if(show){const D=game.monsters[state.die];dieGroup.userData.target=new THREE.Vector3((state.pc||state.hov).x-3.5,.95,(state.pc||state.hov).y-HZ);dieBody.material=matForElement(D.el);dieLabel.material=label(D.lv,D.el);dieMetal.color.setHex(game.rarity(D)>=6?0xe7d6f5:game.rarity(D)>=3?0xe4b85f:game.rarity(D)===2?0xd4dce1:0xa97e4d)}
 pieces.visible=!previewMode;highlights.visible=!previewMode;
}
function matForElement(el){if(!tileMats.has(el))tileMats.set(el,mat(game.elementColors[el],{roughness:.38,metalness:.2}));return tileMats.get(el)}
const dieGroup=new THREE.Group();pieces.add(dieGroup);dieGroup.visible=false;const dieBody=mesh(new THREE.BoxGeometry(.72,.72,.72),gold,dieGroup);const dieLabel=new THREE.Mesh(new THREE.PlaneGeometry(.64,.64),label(1,''));dieLabel.rotation.x=-Math.PI/2;dieLabel.position.y=.365;dieGroup.add(dieLabel);
const edges=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.755,.755,.755)),new THREE.LineBasicMaterial({color:0xe9d4a2}));dieGroup.add(edges);
const dieMetal=new THREE.MeshStandardMaterial({color:0xcbb47c,metalness:.83,roughness:.24}),dieDark=new THREE.MeshStandardMaterial({color:0x213e34,metalness:.38,roughness:.35});
for(const axis of ['x','y','z'])for(const a of[-.365,.365])for(const b of[-.365,.365]){const bar=mesh(new THREE.CylinderGeometry(.019,.019,.74,8),dieMetal,dieGroup);if(axis==='x'){bar.rotation.z=Math.PI/2;bar.position.set(0,a,b)}else if(axis==='y')bar.position.set(a,0,b);else{bar.rotation.x=Math.PI/2;bar.position.set(a,b,0)}}
for(const x of[-.355,.355])for(const y of[-.355,.355])for(const z of[-.355,.355]){const stud=mesh(new THREE.SphereGeometry(.045,8,6),dieMetal,dieGroup);stud.position.set(x,y,z)}
for(const sign of[-1,1]){const ring=mesh(new THREE.TorusGeometry(.235,.012,6,36),dieMetal,dieGroup);ring.position.y=sign*.369;ring.rotation.x=Math.PI/2}
const sideSigil=new THREE.Group();dieGroup.add(sideSigil);for(const z of[-.375,.375]){const ring=mesh(new THREE.TorusGeometry(.19,.012,6,32),dieMetal,sideSigil);ring.position.z=z;const rune=mesh(new THREE.OctahedronGeometry(.085),dieMetal,sideSigil);rune.position.z=z+Math.sign(z)*.01}
for(const x of[-.375,.375]){const ring=mesh(new THREE.TorusGeometry(.19,.012,6,32),dieMetal,sideSigil);ring.position.x=x;ring.rotation.y=Math.PI/2}

// Raycasting is shared by board clicks, drag and drop, and touch placement.
const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2(),pickPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-.22),hit=new THREE.Vector3();
function cellAt(e){const r=canvas.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)return[-1,-1];mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(mouse,camera);
 // Raised faces and creatures must resolve to their own cells, not the plane behind them.
 const hits=raycaster.intersectObjects(pieces.children,true);for(const h of hits){let o=h.object;while(o&&o.parent!==pieces)o=o.parent;if(!o||o===dieGroup)continue;const k=o.userData.k;if(k)return[k.x,k.y];const t=[...tiles.values()].find(t=>t.pivot===o);if(t)return[t.x,t.y]}
 if(!raycaster.ray.intersectPlane(pickPlane,hit))return[-1,-1];world.worldToLocal(hit);const x=Math.floor(hit.x+4),y=Math.floor(hit.z+BH/2);return x>=0&&x<8&&y>=0&&y<BH?[x,y]:[-1,-1]}
function updateCamera(){
 const distance=Math.hypot(8,15,16),cp=Math.cos(orbitPitch);
 const direction=new THREE.Vector3(Math.sin(orbitYaw)*cp,Math.sin(orbitPitch),Math.cos(orbitYaw)*cp);
 const right=new THREE.Vector3(Math.cos(orbitYaw),0,-Math.sin(orbitYaw));
 const up=new THREE.Vector3().crossVectors(direction,right).normalize();
 const offset=right.clone().multiplyScalar(panX).add(up.clone().multiplyScalar(panY));
 offset.lerp(combatCenter,combatFocus);
 const targetZoom=document.body.classList.contains('tutorial-mode')?zoom:zoom+(Math.max(zoom,3.2)-zoom)*combatFocus;

 camera.position.copy(direction.multiplyScalar(distance).add(offset));camera.up.set(0,1,0);camera.lookAt(offset);
 camera.zoom=targetZoom;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
}
function changeZoom(value,anchor){
 const next=Math.round(Math.max(1,Math.min(8,value))*100)/100;
 if(anchor){const r=canvas.getBoundingClientRect(),nx=(anchor.clientX-r.left)/r.width*2-1,ny=1-(anchor.clientY-r.top)/r.height*2;panX+=nx*viewSpan*viewAspect*(1/zoom-1/next);panY+=ny*viewSpan*(1/zoom-1/next)}
 zoom=next;if(zoom===1){panX=0;panY=0}panX=Math.max(-18,Math.min(18,panX));panY=Math.max(-18,Math.min(18,panY));
 document.getElementById('zoom-level').textContent=Math.round(zoom*100)+' %';document.getElementById('zoom-out').disabled=zoom<=1;document.getElementById('zoom-in').disabled=zoom>=8;updateCamera();
}
function resetView(){panX=panY=0;orbitYaw=Math.atan2(8,16);orbitPitch=Math.atan2(15,Math.hypot(8,16));changeZoom(1)}
document.getElementById('zoom-in').onclick=()=>changeZoom(zoom+.2);
document.getElementById('zoom-out').onclick=()=>changeZoom(zoom-.2);
document.getElementById('reset-view').onclick=resetView;
document.getElementById('pan-arrows-toggle').onclick=()=>{const expanded=navigation.classList.toggle('show-pan-arrows');document.getElementById('pan-arrows-toggle').setAttribute('aria-expanded',String(expanded))};
navigation.querySelectorAll('[data-pan]').forEach(button=>button.onclick=()=>{const step=Math.max(.35,viewSpan/zoom*.32),dir=button.dataset.pan;if(dir==='left')panX-=step;if(dir==='right')panX+=step;if(dir==='up')panY+=step;if(dir==='down')panY-=step;panX=Math.max(-18,Math.min(18,panX));panY=Math.max(-18,Math.min(18,panY));updateCamera()});
let orbitEnabled=false;document.getElementById('orbit-view').onclick=()=>{orbitEnabled=!orbitEnabled;document.getElementById('orbit-view').setAttribute('aria-pressed',String(orbitEnabled));canvas.classList.toggle('orbiting',orbitEnabled);if(orbitEnabled&&panEnabled)document.getElementById('pan-view').click()};
document.getElementById('pan-view').onclick=()=>{panEnabled=!panEnabled;if(panEnabled&&orbitEnabled)document.getElementById('orbit-view').click();document.getElementById('pan-view').setAttribute('aria-pressed',String(panEnabled));canvas.classList.toggle('panning',panEnabled)};
canvas.addEventListener('wheel',e=>{if(!active||e.ctrlKey)return;e.preventDefault();changeZoom(zoom*Math.exp(-e.deltaY*.0015),e)},{passive:false});
canvas.addEventListener('contextmenu',e=>{if(active)e.preventDefault()});
const touchPointers=new Map();let pinchDistance=0,twistAngle=null,twistMid=null;
/* v254 — deux doigts : pincer pour zoomer, tourner pour faire pivoter la vue, glisser pour déplacer. Un doigt : déplacer le plateau. */
function touchTwist(){const p=[...touchPointers.values()];return{a:Math.atan2(p[1].y-p[0].y,p[1].x-p[0].x),x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2}}
function touchPoint(e){return{x:e.clientX,y:e.clientY}}
function touchPinch(){const p=[...touchPointers.values()];return Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)}
function moveTouchCamera(dx,dy){const r=canvas.getBoundingClientRect();if(orbitEnabled){orbitYaw-=dx/r.width*Math.PI*2;orbitPitch=Math.max(.035,Math.min(Math.PI/2-.035,orbitPitch+dy/r.height*Math.PI))}else{panX-=dx/r.width*2*viewSpan*viewAspect/zoom;panY+=dy/r.height*2*viewSpan/zoom;panX=Math.max(-18,Math.min(18,panX));panY=Math.max(-18,Math.min(18,panY))}updateCamera()}
let touchGesture=null,mouseGesture=null;
canvas.onpointerdown=e=>{
 if(e.pointerType==='touch'){
  touchPointers.set(e.pointerId,touchPoint(e));canvas.setPointerCapture(e.pointerId);
  if(touchPointers.size>1){if(touchGesture)touchGesture.multiple=true;pinchDistance=touchPinch();{const T=touchTwist();twistAngle=T.a;twistMid=T}panDrag=null;if(touchPointers.size===2)game.board.onpointercancel(e);e.preventDefault();return}
  const [x,y]=cellAt(e),unit=state.cr.find(c=>c.x===x&&c.y===y&&c.o===state.cur);
  touchGesture={id:e.pointerId,x:e.clientX,y:e.clientY,unit:unit||null,moved:false,multiple:false,dragUnit:false,placing:state.mode==='p'||state.mode==='d'};
 }
 if(e.pointerType!=='touch'){const [x,y]=cellAt(e);mouseGesture={x:e.clientX,y:e.clientY,unit:state.cr.find(c=>c.x===x&&c.y===y&&c.o===state.cur),dragUnit:false}}
 if(panEnabled||orbitEnabled||e.button===2||e.shiftKey||e.altKey){e.preventDefault();canvas.setPointerCapture(e.pointerId);panDrag={id:e.pointerId,x:e.clientX,y:e.clientY,orbit:orbitEnabled||e.altKey};return}
 if(state.over||(state.aiTurn??(state.ai&&state.cur===1))||window.HackeniaCombat?.busy)return;e.preventDefault();canvas.setPointerCapture(e.pointerId);game.board.onpointerdown({clientX:e.clientX,clientY:e.clientY,pointerId:e.pointerId,preventDefault(){}})
};
// Visible canvas owns capture; a tap must still reach creature selection.
const originalCapture=game.board.setPointerCapture.bind(game.board);game.board.setPointerCapture=id=>active?canvas.setPointerCapture(id):originalCapture(id);
canvas.onpointermove=e=>{
 if(e.pointerType==='touch'&&touchPointers.has(e.pointerId)){
  const previous=touchPointers.get(e.pointerId);touchPointers.set(e.pointerId,touchPoint(e));
  if(touchPointers.size>=2){const distance=touchPinch();if(pinchDistance>0)changeZoom(zoom*distance/pinchDistance);pinchDistance=distance;const T=touchTwist();if(twistAngle!==null){let d=T.a-twistAngle;d=Math.atan2(Math.sin(d),Math.cos(d));if(Math.abs(d)<.5)orbitYaw+=d}if(twistMid){const r=canvas.getBoundingClientRect();panX-=(T.x-twistMid.x)/r.width*2*viewSpan*viewAspect/zoom;panY+=(T.y-twistMid.y)/r.height*2*viewSpan/zoom;panX=Math.max(-18,Math.min(18,panX));panY=Math.max(-18,Math.min(18,panY))}twistAngle=T.a;twistMid=T;updateCamera();return}
  const g=touchGesture;if(g&&Math.hypot(e.clientX-g.x,e.clientY-g.y)>8)g.moved=true;
  if(g?.multiple)return;
  if(g&&!g.placing&&!panDrag&&g.moved){
   if(g.unit&&!state.moved&&!state.over&&(!state.ai||state.cur===0)&&!window.HackeniaCombat?.busy){if(!g.dragUnit){g.dragUnit=true;if(state.sel?.id!==g.unit.id)game.tap(g.unit.x,g.unit.y)}return}
   moveTouchCamera(e.clientX-previous.x,e.clientY-previous.y);return
  }
 }
 if(mouseGesture?.unit&&!panDrag&&state.mode==='i'&&!state.moved&&!state.over&&(!state.ai||state.cur===0)&&!window.HackeniaCombat?.busy&&Math.hypot(e.clientX-mouseGesture.x,e.clientY-mouseGesture.y)>8){if(!mouseGesture.dragUnit){mouseGesture.dragUnit=true;if(state.sel?.id!==mouseGesture.unit.id)game.tap(mouseGesture.unit.x,mouseGesture.unit.y)}return}
 if(panDrag){if(e.pointerId!==panDrag.id)return;const r=canvas.getBoundingClientRect(),dx=e.clientX-panDrag.x,dy=e.clientY-panDrag.y;if(panDrag.orbit){orbitYaw-=dx/r.width*Math.PI*2;orbitPitch=Math.max(.035,Math.min(Math.PI/2-.035,orbitPitch+dy/r.height*Math.PI))}else{panX-=dx/r.width*2*viewSpan*viewAspect/zoom;panY+=dy/r.height*2*viewSpan/zoom;panX=Math.max(-18,Math.min(18,panX));panY=Math.max(-18,Math.min(18,panY))}panDrag.x=e.clientX;panDrag.y=e.clientY;updateCamera();return}
 game.board.onpointermove(e)
};
canvas.onpointerup=e=>{
 const mouse=mouseGesture;mouseGesture=null;if(e.pointerType!=='touch'&&mouse?.dragUnit&&!panDrag){const [x,y]=cellAt(e);if(x!==mouse.unit.x||y!==mouse.unit.y)game.tap(x,y);return}
 if(e.pointerType==='touch'){
  touchPointers.delete(e.pointerId);pinchDistance=0;twistAngle=null;twistMid=null;const g=touchGesture;
  if(g?.multiple){if(!touchPointers.size)touchGesture=null;panDrag=null;return}
  touchGesture=null;if(panDrag){panDrag=null;return}
  if(g?.dragUnit){const [x,y]=cellAt(e);if(x!==g.unit.x||y!==g.unit.y)game.tap(x,y);return}
  if(g?.moved&&!g.placing)return
 }
 if(panDrag){panDrag=null;return}game.board.onpointerup(e)
};
canvas.onpointercancel=e=>{mouseGesture=null;if(e.pointerType==='touch'){touchPointers.delete(e.pointerId);pinchDistance=0;touchGesture=null}panDrag=null;game.board.onpointercancel(e)};
let sceneryKey='';
function setActive(value,terrainOverride=null){
 active=value;const type=terrainOverride||game.snapshot().terrain,fire=type==='feu',ice=type==='glace',lakeOn=type==='eau',skyOn=type==='foudre',windOn=type==='vent',autumnOn=type==='automne',noelOn=type==='noel',cityOn=type==='ville'||autumnOn||noelOn,caveOn=type==='grotte';/* v253 : automne et Noël se comportent comme les scènes neutres (plateau propre au module) */
 if(!value)placementLens.hidden=true;host.classList.toggle('view3d',value);document.getElementById('land-caption').hidden=!value;
 forest.visible=value&&!fire&&!ice&&!lakeOn&&!skyOn&&!windOn&&!cityOn&&!caveOn;if(autumnOn&&value&&!autumnScene){autumnScene=createAutumn(decor,!!renderer.isSoftware,BH,{spawnWalker});autumnScene.root.scale.z=1/ZS}if(autumnScene)autumnScene.root.visible=value&&autumnOn;if(noelOn&&value&&!noelScene){noelScene=createNoel(decor,!!renderer.isSoftware,BH,{spawnWalker});noelScene.root.scale.z=1/ZS}if(noelScene)noelScene.root.visible=value&&noelOn;if(type==='ville'&&value&&!cityScene){cityScene=createCity(decor,!!renderer.isSoftware,BH,{spawnWalker});cityScene.root.scale.z=1/ZS}if(cityScene)cityScene.root.visible=value&&type==='ville';if(caveOn&&value&&!caveScene){caveScene=createCave(decor,!!renderer.isSoftware,BH,{spawnWalker});caveScene.root.scale.z=1/ZS}if(caveScene)caveScene.root.visible=value&&caveOn;/* v246 — terrains neutres */if(windOn&&value&&!windLand){windLand=createWindHighlands(decor,!!renderer.isSoftware,BH);windLand.root.scale.z=1/ZS}if(windLand)windLand.root.visible=value&&windOn;if(skyOn&&value&&!skyIsland){skyIsland=createSkyIsland(decor,!!renderer.isSoftware,BH);skyIsland.root.scale.z=1/ZS}if(skyIsland)skyIsland.root.visible=value&&skyOn;if(lakeOn&&value&&!lake){lake=createLake(decor,!!renderer.isSoftware,BH);lake.root.scale.z=1/ZS}/* v233 : coordonnées réelles des cases, comme les pièces */if(lake)lake.root.visible=value&&lakeOn;boardFrame.visible=value&&!fire&&!skyOn&&!windOn&&!ice&&!cityOn&&!caveOn;if(ice&&value&&!frostRoad){frostRoad=createFrostRoad(decor,!!renderer.isSoftware,BH,{spawnFighter});frostRoad.root.scale.z=1/ZS}if(frostRoad)frostRoad.root.visible=value&&ice;/* v240 — La Route vers Forfalla repensée */grid.visible=true;grid.material.color.set(ice?0x557e98:lakeOn?0x5f7a5a:skyOn?0xb98cff:fire?0xffc27a:0xe5d9a0);grid.material.opacity=ice||cityOn||caveOn?0:lakeOn?0:skyOn?.12:windOn?0:fire?.1:.27;
 if(fire&&value&&!crater){crater=createEmberlands(decor,game.fireVents,!!renderer.isSoftware,BH);crater.root.scale.z=1/ZS}/* v239 — Terres embrasées repensées */if(crater)crater.root.visible=value&&fire;
 if(sceneryKey!==type){
  sceneryKey=type;
  const themes={terre:[0x172c25,0x304d3d,0xe9f0d5,0x3c5034,0xffe1a0,3.1,'LE BOIS TENDRE','La rivière murmure. Le duel commence.'],feu:[0x221b20,0x392328,0xf1c6ab,0x3e2023,0xffb16a,2.5,'LES TERRES EMBRASÉES','La roche respire. Les évents sont impraticables.'],glace:[0x1b2b40,0x3a5870,0xd6e9f8,0x3d5568,0xd2e6ff,1.9,'LA ROUTE VERS FORFALLA','La neige tombe. La glace entraîne les créatures.'],eau:[0x1d3340,0x5d8796,0xf3f8ff,0x6b6a5c,0xfff0d8,2.7,'LE LAC ROSE','Sous l’eau limpide, les galets roses colorent tout le lac.'],vent:[0x2f5a4c,0x4d7f69,0xeaf8e6,0x35503a,0xfff0cc,2.9,'LES VENTS DE HACKO','Sur le haut plateau, le vent chante entre les pierres levées.'],foudre:[0x2c2640,0x2c2640,0xd9c8ff,0x1e1a2c,0xe6dcff,2.2,'L’ÎLE CÉLESTE','Au-dessus des nuages, l’orage gronde sous le sanctuaire.'],ville:[0x2b2a33,0x6b5f58,0xfff1dc,0x5a4c40,0xffd9a8,2.6,'LA VILLE DE DASSOM','Sur la grand-place, les marchands se taisent : un duel commence.'],grotte:[0x0f0d0c,0x221c19,0xb4c2e2,0x3a2f27,0xffc58a,1.7,'LA GROTTE SOUTERRAINE','Les torches vacillent, les cristaux veillent dans l’obscurité.'],automne:[0x3a2416,0x6e4326,0xffe2b8,0x5a3418,0xffb867,2.9,'LA FORÊT D’AUTOMNE','Les érables flamboient, les feuilles tombent en tourbillonnant.'],noel:[0x0a1230,0x1a2650,0x8fa6d8,0x2a3150,0xb8c8ff,1.15,'LA NUIT DES LUMIÈRES','Sous l’aurore, le grand sapin s’illumine. Joyeuses fêtes !']};
  const t=themes[type]||themes.terre;renderer.setClearColor(t[0],1);scene.fog.color.set(t[1]);sky.color.set(t[2]);sky.groundColor.set(t[3]);sky.intensity=ice?1.45:type==='eau'?1.7:type==='foudre'?1.45:type==='vent'?2.1:type==='noel'?1.05:type==='automne'?2.1:cityOn?2.2:caveOn?1.75:2.3;sun.color.set(t[4]);sun.intensity=t[5];
  const caption=document.getElementById('land-caption');caption.querySelector('span').textContent=t[6];caption.querySelector('small').textContent=t[7];canvas.setAttribute('aria-label','Plateau 3D '+t[6].toLowerCase()+', huit colonnes et '+BH+' lignes')
 }
 document.getElementById('terrain-status').textContent=({terre:'Terre +1 · Le Bois tendre',feu:'Feu +1 · 6 évents fumants impraticables',glace:'Glace +1 · sol glissant · arrêt au contact',eau:'Eau +1 · Le lac rose · un nénuphar sacré donne +1 à chaque tour',vent:'Vent +1 · Les vents de Hacko · une tornade déplace une créature à chaque tour',foudre:'Foudre +1 · Île céleste · la foudre frappe 2 cases à chaque tour',ville:'Terrain neutre · La ville de Dassom',grotte:'Terrain neutre · La grotte souterraine',automne:'Terre +1 · Vent +1 · La forêt d’automne',noel:'Foudre, Glace et Feu +1 · Événement de Noël · un cadeau donne +1 à chaque tour'})[type];
}
function resize(){const r=host.getBoundingClientRect();if(r.width<1||r.height<1)return;const aspect=r.width/r.height;renderer.setSize(r.width,r.height,false);const desktopBoard=matchMedia('(min-width: 900px) and (min-height: 660px)').matches;const fit=Math.pow(ZS,.85),span=Math.max((desktopBoard?8.0:8.9)*fit,7.1*ZS/aspect);viewSpan=span;viewAspect=aspect;camera.left=-span*aspect;camera.right=span*aspect;camera.top=span;camera.bottom=-span;updateCamera()}
function configure(){light=renderer.isSoftware;moving=window.HackeniaSettings?.get().motion!==false&&!matchMedia('(prefers-reduced-motion:reduce)').matches;renderer.setPixelRatio(Math.min(devicePixelRatio||1,renderer.isSoftware?1.5:2));renderer.shadowMap.enabled=!renderer.isSoftware;grass.count=renderer.isSoftware?Math.min(850,grassCount):grassCount;const flowers=renderer.isSoftware?36:flowerCount;petals.count=flowers*5;stems.count=centres.count=flowers;flowerLeaves.count=flowers*2;motes.visible=!renderer.isSoftware&&moving;windAmount.value=moving?1:0;resize()}
matchMedia('(prefers-reduced-motion:reduce)').addEventListener('change',configure);new ResizeObserver(resize).observe(host);document.addEventListener('visibilitychange',()=>{paused=document.hidden});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();setActive(false);document.getElementById('terrain-status').textContent='Affichage de secours · recharge la page pour retrouver la 3D'});
function preview(terrain,container,layout='classique'){
 if(!container)return;
 if(previewMode&&previewTerrain===terrain&&previewLayout===layout&&host.parentElement===container)return;
 previewMode=true;previewTerrain=terrain;previewLayout=layout;
 if(host.parentElement!==container)container.appendChild(host);
 host.className='t-'+terrain+' terrain-menu-preview';host.setAttribute('aria-hidden','true');
 state=game.snapshot();setActive(['terre','feu','glace','eau','vent','foudre','ville','grotte','automne','noel'].includes(terrain),terrain);sync();resize();
}
function clearPreview(){
 if(!previewMode)return;
 previewMode=false;previewTerrain=null;host.removeAttribute('aria-hidden');
 if(homeParent)homeParent.insertBefore(host,homeNextSibling&&homeNextSibling.parentNode===homeParent?homeNextSibling:null);
 const type=game.snapshot().terrain;host.className='t-'+type;setActive(['terre','feu','glace','eau','vent','foudre','ville','grotte','automne','noel'].includes(type),type);sync();resize();
}
// Position à l'écran (relative au canevas) du centre d'une case : sert aux repères du tutoriel.
function cellScreen(x,y){if(!active)return null;const r=canvas.getBoundingClientRect(),c=state?.b?.[y]?.[x],level=.24+(c&&!c.f?.28:0),p=world.localToWorld(new THREE.Vector3(x-3.5,level,y-HZ)).project(camera);return{x:r.left+(p.x+1)*r.width/2,y:r.top+(1-p.y)*r.height/2}}
window.HackeniaView={get active(){return active},cellAt,sync,setActive,updateLens,preview,clearPreview,cellScreen};configure();sync();
const portalContent=document.getElementById('portal-content');
if(portalContent){const refreshPreview=()=>{const art=document.getElementById('play-terrain-art');if(art&&document.body.classList.contains('portal-open')){const terrain=document.getElementById('play-terrain')?.value||'terre';preview(terrain,art,document.getElementById('play-layout')?.value||'classique')}else clearPreview()};new MutationObserver(refreshPreview).observe(portalContent,{childList:true,subtree:true});refreshPreview()}
/* v252 — Roue des éléments à droite du plateau (seconde passe de rendu, jamais masquée par le décor). */
let elementWheel=null;const wheelRight=new THREE.Vector3(),wheelAnchor=new THREE.Vector3();
function wheelModel(url){if(!modelCache.has(url))modelCache.set(url,(async()=>{const tools=await getModelTools();const gltf=await tools.loader.loadAsync(url);return{gltf,clone:tools.clone}})().catch(()=>null));return modelCache.get(url).then(a=>a?a.clone(a.gltf.scene):null)}
function renderElementWheel(t){if(previewMode||!renderer.isWebGLRenderer)return;if(window.HackeniaTutorial?.active&&window.HackeniaTutorial.showWheel===false)return;/* v273 : tutoriel, roue masquée avant la leçon des affinités */elementWheel??=createElementWheel({loadModel:wheelModel,software:!!renderer.isSoftware||light});
 const st=state;const d=st&&(st.mode==='p'||st.mode==='d')&&st.die!=null?game.monsters?.[st.die]:null;elementWheel.setFocus(d&&!d.multi?d.el:'');
 wheelRight.set(Math.cos(orbitYaw),0,-Math.sin(orbitYaw));wheelAnchor.copy(wheelRight).multiplyScalar(8.6*Math.max(1,ZS)+6.4).setY(1.2);// sur ordinateur : à droite du plateau
 const cr=canvas.getBoundingClientRect(),hud=cr.width<700;elementWheel.setCompact(hud);
 if(hud){/* v254 — smartphone : petite roue fixe en haut à gauche de la vue, masquée pendant la loupe de pose */if(!placementLens.hidden||!cr.width)return;const D=Math.min(100,cr.width*.25),cx=6+D/2,cy=6+D/2,perPx=(camera.right-camera.left)/camera.zoom/cr.width;
  wheelAnchor.set(cx/cr.width*2-1,1-cy/cr.height*2,.5).unproject(camera);elementWheel.ensureModels();elementWheel.place(camera,wheelAnchor,D/2*perPx/3.1/elementWheel.compactK*1.05)}
 else{const ndc=wheelAnchor.clone().project(camera);if(Math.abs(ndc.x)>2.6||Math.abs(ndc.y)>2.6)return;if(Math.abs(ndc.x)<1.8)elementWheel.ensureModels();// hors champ : ni rendu ni téléchargement
 elementWheel.place(camera,wheelAnchor,1.5*Math.max(1,ZS*.9))}elementWheel.update(t,moving);
 const ac=renderer.autoClear;renderer.autoClear=false;renderer.clearDepth();renderer.render(elementWheel.scene,camera);renderer.autoClear=ac}
window.HackeniaElementWheel={get:()=>elementWheel,anchor:()=>wheelAnchor.clone()};
function frame(now){requestAnimationFrame(frame);if(paused||(!game.isPlaying()&&!previewMode)||!active||now-lastFrame<(renderer.isSoftware?100:light?32:16))return;const dt=Math.min((now-lastFrame)/1000,.06);lastFrame=now;if(pureFx.length)updatePureFx(now);if(weatherFx.length)updateWeather(now);animateLotus();animateGifts();animateFxBoard();animateForecast();if(auras.size)updateAuras(now);updateCrackles(now);if(moving)for(const g of creatures.values()){const h=g.userData.hop,m=g.userData.model;if(!h||!m)continue;const u=((now/1000+h.phase)%3.2)/.55;if(u<1){const lift=Math.sin(Math.PI*u);m.position.y=h.base+.24*lift;m.scale.set(1-.05*lift,1+.08*lift,1-.05*lift)}else if(u<1.25){const s=Math.sin(Math.PI*(u-1)/.25);m.position.y=h.base;m.scale.set(1+.07*s,1-.1*s,1+.07*s)}else{m.position.y=h.base;m.scale.set(1,1,1)}}updateZoneGlow(now);const t=moving?now/1000:0;
 if(frostRoad?.root.visible)frostRoad.update(t,light,moving);if(cityScene?.root.visible)cityScene.update(t,light,moving);if(caveScene?.root.visible)caveScene.update(t,light,moving);if(autumnScene?.root.visible)autumnScene.update(t,light,moving);if(noelScene?.root.visible)noelScene.update(t,light,moving);
 if(forest.visible){wind.value=t;waterNormals.offset.set(-t*.032,t*.013);
 for(let i=0;i<wp.count;i++){const x=waterOrig[i*3],z=waterOrig[i*3+2];wp.setY(i,waterHeight(x,z,t))}wp.needsUpdate=true;if(!renderer.isSoftware)wg.computeVertexNormals();
 for(const g of glints){
  const center=moving?(g.x<0?-1:1)*((Math.abs(g.x)+t*.24)%7):g.x,p=g.m.geometry.attributes.position;g.m.position.set(0,0,0);g.m.scale.set(1,1,1);
  for(let i=0;i<p.count;i++){const u=Math.floor(i/2)/6+(i%2)/6,x=Math.max(-7,Math.min(7,center+(u-.5)*g.length)),z=river(x)+g.lane+Math.sin(u*3.14+g.phase)*.014;p.setXYZ(i,x,waterHeight(x,z,t)+.013,z)}p.needsUpdate=true;
 }
 for(const rill of fallingRills){const down=moving?((t*.35+rill.phase)%1)*.83:rill.phase*.83,p=rill.m.geometry.attributes.position;for(let i=0;i<2;i++){const y=-.06-down-i*.17;p.setXYZ(i,rill.side*(7.065+Math.sin(-y*2)*.035),y,river(rill.side*7)+rill.lane)}p.needsUpdate=true}
 motes.rotation.y=moving?Math.sin(t*.08)*.06:0;woodland.update(t,moving);}else crater?.update(t,light,moving);if(lake?.root.visible)lake.update(t,light,moving);if(skyIsland?.root.visible)skyIsland.update(t,light,moving);if(windLand?.root.visible)windLand.update(t,light,moving);

 const target=-state.rzCur*Math.PI/180;if(!moving)currentAngle=target;currentAngle+=Math.atan2(Math.sin(target-currentAngle),Math.cos(target-currentAngle))*Math.min(1,dt*5);world.rotation.y=currentAngle;world.updateMatrixWorld(true);

 for(const tile of tiles.values()){let progress=1;const a=tile.an,A=state.anim;if(a&&A&&moving){progress=Math.max(0,Math.min(1,(Date.now()-A.t0-a.d*220)/450))}tile.pivot.visible=progress>0;const eased=1-Math.pow(1-progress,3);tile.pivot.scale.setScalar(Math.max(.001,eased));tile.pivot.position.y=.22+(1-eased)*.55;tile.pivot.rotation.x=a?.c==='u-d'?(1-eased)*Math.PI/2:a?.c==='u-u'?-(1-eased)*Math.PI/2:0;tile.pivot.rotation.z=a?.c==='u-r'?-(1-eased)*Math.PI/2:a?.c==='u-l'?(1-eased)*Math.PI/2:0}
 const combat=window.HackeniaCombat?.current();updateCombatFX(combat);if(combat?.kind==='passage'){const opacity=1-window.HackeniaCombat.passageFade(combat);for(const [x,y]of combat.cells){const tile=tiles.get(x+','+y);if(tile)fadeObject(tile.pivot,opacity)}}
 const focusTarget=combat&&combat.kind!=='passage'&&!combat.reduced?Math.min(1,combat.progress/.14,(1-combat.progress)/.12):0;combatFocus+=(focusTarget-combatFocus)*Math.min(1,dt*10);if(combat&&combat.kind!=='passage'){const [a,d]=combat.fighters;combatCenter.copy(world.localToWorld(new THREE.Vector3((a.x+d.x)/2-3.5,.65,(a.y+d.y)/2-HZ)))}if(combatFocus>.001||focusTarget)updateCamera();else if(combatFocus!==0){combatFocus=0;updateCamera()}
 for(const g of creatures.values()){const k=g.userData.k,f=combat?window.HackeniaCombat.pose(combat,k):null;const pnow=performance.now();if(!(g.userData.holdUntil>pnow))g.position.lerp(g.userData.target,moving?Math.min(1,dt*(g.userData.windSlide>pnow?2.6:9)):1);g.rotation.set(0,k.o?Math.PI:0,0);if(g.userData.shakeStart){const e=(pnow-g.userData.shakeStart)/1000;if(e<1.6&&moving){g.rotation.z=Math.sin(e*38)*.13*(1-e/1.6);g.rotation.x=Math.sin(e*27)*.05*(1-e/1.6)}else g.userData.shakeStart=0}{const fl=g.userData.fly;if(fl){const e=(pnow-fl.start)/fl.dur;if(e>=1||!moving)g.userData.fly=null;else{const base=g.userData.target.y,lift=e<.3?(e/.3)*.75:e<.76?.75+Math.sin((e-.3)/.46*Math.PI)*1.1:.75*(1-(e-.76)/.24),m=Math.max(0,Math.min(1,(e-.3)/.46)),em=m*m*(3-2*m);g.position.set(fl.from.x+(fl.to.x-fl.from.x)*em,base+lift,fl.from.z+(fl.to.z-fl.from.z)*em);g.rotation.y=(k.o?Math.PI:0)+e*e*26*(1-e*.4);g.rotation.z=Math.sin(e*20)*.12*(1-e)}}}/* v244 — envol dans la tornade */g.scale.setScalar(g.userData.model?1:.9);const spawn=state.anim?.o[k.x+','+k.y];g.visible=!spawn||Date.now()>state.anim.t0+spawn.d*220+300;const body=g.children[1];body.position.y=.35+(moving?Math.sin(t*2+k.id)*.012:0);
 if(f?.passage){g.visible=f.defeat<1;g.position.set(f.x-3.5,g.userData.target.y,f.y-HZ);g.rotation.y=f.angle;if(f.arriving&&!combat.reduced)playWalkClip(g,k);else if(f.winner&&!combat.reduced)playCombatClip(g,'victory',combat);fadeObject(g,1-f.defeat)}
 else if(f){g.visible=f.defeat<1;g.position.set(f.x-3.5,g.userData.target.y+f.lift,f.y-HZ);g.rotation.y=f.angle;g.scale.setScalar(f.scale*(g.userData.model?1:.9));if(!combat.reduced){if(k.id===combat.fighters[0].id&&combat.progress<.65)playCombatClip(g,'spell',combat);if(!f.loser&&combat.progress>.7&&combat.stats[0].attack!==combat.stats[1].attack)playCombatClip(g,'victory',combat);if(f.loser)g.rotation.z=f.defeat*.55}}
 else if(g.userData.combatClipTag){g.userData.combatClipTag=null;g.userData.activeAction?.fadeOut(.15);g.userData.idleAction?.reset().fadeIn(.15).play();g.userData.activeAction=g.userData.idleAction}
 const walk=!combat&&moving&&k.walk&&Date.now()<k.walk.started+k.walk.duration?k.walk:null;
 if(walk){const t=Math.max(0,(Date.now()-walk.started)/walk.duration)*(walk.points.length-1),i=Math.min(walk.points.length-2,Math.floor(t)),a=walk.points[i],b=walk.points[i+1],p=t-i;const ca=state.b[a[1]]?.[a[0]],cb=state.b[b[1]]?.[b[0]],ya=.23+(ca&&!ca.f?.28:0),yb=.23+(cb&&!cb.f?.28:0);g.position.set(a[0]+(b[0]-a[0])*p-3.5,ya+(yb-ya)*p+Math.sin(t*7)*.025,a[1]+(b[1]-a[1])*p-HZ);g.rotation.y=Math.atan2(b[0]-a[0],b[1]-a[1]);playWalkClip(g,k)}
 else if(g.userData.walkTag&&!f?.arriving){g.userData.walkTag=null;if(!combat){g.userData.activeAction?.fadeOut(.12);g.userData.idleAction?.reset().fadeIn(.12).play();g.userData.activeAction=g.userData.idleAction}}
 if(g.userData.mixer&&(moving||(f&&!combat.reduced)))g.userData.mixer.update(dt);if(g.userData.gest)animateGesture(g,k,f,combat,t);if(g.userData.modelRoot&&g.userData.model)orientBoardModel(g.userData.modelRoot,g.userData.model,f||walk,g.userData.idleModelYaw||0,THREE);}

 if(dieGroup.visible){dieGroup.position.copy(dieGroup.userData.target);dieGroup.position.y+=moving?Math.sin(t*2)*.08:0;dieGroup.rotation.y=moving&&state.cubeCls!=='land'?t*.7:0;dieGroup.scale.setScalar(state.cubeCls==='poof'?.35:1)}
 highlights.children.forEach(m=>{if(!m.userData.cachedLabel)m.material.opacity=moving?.32+Math.sin(t*3)*.09:.4});renderer.render(scene,camera);renderElementWheel(t);projectBoardCaptions(t);drawPlacementLens();
}
requestAnimationFrame(frame);
}

// CPU projection fallback for browsers without WebGL. Uses the same scene and picking.
// It trades shadows and wind for broad compatibility; no second game implementation.
function LandscapeCanvasRenderer(canvas){
 const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('Canvas indisponible');
 this.isSoftware=true;this.shadowMap={enabled:false};let clearColor=0x172c25;this.setClearColor=color=>{clearColor=color};let w=1,h=1,ratio=1;
 this.setPixelRatio=r=>{ratio=Math.min(r,1.25)};this.setSize=(x,y)=>{w=x;h=y;canvas.width=Math.round(x*ratio);canvas.height=Math.round(y*ratio)};
 const instanceTint=new THREE.Color();
 const vp=new THREE.Matrix4(),mvp=new THREE.Matrix4(),inst=new THREE.Matrix4(),model=new THREE.Matrix4(),nmat=new THREE.Matrix3(),v=new THREE.Vector3(),normal=new THREE.Vector3(),light=new THREE.Vector3(-.4,.85,.3).normalize(),tempColor=new THREE.Color();
 this.render=(scene,camera)=>{
 scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);vp.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);const faces=[];
 ctx.setTransform(ratio,0,0,ratio,0,0);const bg=ctx.createRadialGradient(w*.5,h*.4,0,w*.5,h*.5,Math.max(w,h)*.7);bg.addColorStop(0,clearColor===0x221b20?'#533536':'#6c8157');bg.addColorStop(1,clearColor===0x221b20?'#171920':'#1b352b');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 scene.traverseVisible(o=>{
 if(!(o.isMesh||o.isLineSegments)||!o.geometry)return;const geo=o.geometry,pos=geo.attributes.position,vc=geo.attributes.color,norm=geo.attributes.normal,idx=geo.index,material=Array.isArray(o.material)?o.material[0]:o.material;
 if(!pos||!material||material.visible===false)return;const step=o.isLineSegments?2:3,count=idx?idx.count:pos.count;
 const copies=o.isInstancedMesh?o.count:1;for(let instance=0;instance<copies;instance++){
 model.copy(o.matrixWorld);if(o.isInstancedMesh){o.getMatrixAt(instance,inst);model.multiply(inst)}mvp.multiplyMatrices(vp,model);nmat.getNormalMatrix(model);if(o.isInstancedMesh&&o.instanceColor)o.getColorAt(instance,instanceTint);else instanceTint.set(0xffffff);
 const projected=new Float32Array(pos.count*3);for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i).applyMatrix4(mvp);projected[i*3]=(v.x+1)*w/2;projected[i*3+1]=(1-v.y)*h/2;projected[i*3+2]=v.z}
 // Number textures use a projected quadrilateral instead of per-triangle mapping.
 if(material.map?.image&&o.geometry.type==='PlaneGeometry'&&pos.count===4){
 const p=[0,1,3,2].map(i=>[projected[i*3],projected[i*3+1]]),depth=(projected[2]+projected[5]+projected[8]+projected[11])/4;
 faces.push({p,depth,layer:o.renderOrder||0,image:material.map.image,alpha:material.opacity});continue;
 }
 for(let i=0;i<count;i+=step){const ids=[];for(let j=0;j<step;j++)ids.push(idx?idx.getX(i+j):i+j);const p=ids.map(id=>[projected[id*3],projected[id*3+1]]),depth=ids.reduce((a,id)=>a+projected[id*3+2],0)/step;
 if(depth<-1||depth>1||p.every(a=>a[0]<-50)||p.every(a=>a[0]>w+50)||p.every(a=>a[1]<-50)||p.every(a=>a[1]>h+50))continue;
 if(step===3&&material.side!==THREE.DoubleSide){const cross=(p[1][0]-p[0][0])*(p[2][1]-p[0][1])-(p[1][1]-p[0][1])*(p[2][0]-p[0][0]);if(cross>0)continue}
 tempColor.copy(material.color||new THREE.Color('white'));if(vc&&material.vertexColors){const count=ids.length;tempColor.multiply(new THREE.Color(ids.reduce((s,id)=>s+vc.getX(id),0)/count,ids.reduce((s,id)=>s+vc.getY(id),0)/count,ids.reduce((s,id)=>s+vc.getZ(id),0)/count))}
 if(o.isInstancedMesh)tempColor.multiply(instanceTint);
 const texture=material.map,uv=geo.attributes.uv;
 if(texture?.userData.pixels&&uv){const id=ids[0],tx=((uv.getX(id)*texture.repeat.x+texture.offset.x)%1+1)%1,ty=((uv.getY(id)*texture.repeat.y+texture.offset.y)%1+1)%1,tw=texture.image.width,th=texture.image.height,ix=(Math.floor((1-ty)*(th-1))*tw+Math.floor(tx*(tw-1)))*4,pixels=texture.userData.pixels;tempColor.multiply(new THREE.Color(pixels[ix]/255,pixels[ix+1]/255,pixels[ix+2]/255))}
 if(norm&&!material.isMeshBasicMaterial){normal.fromBufferAttribute(norm,ids[0]).applyMatrix3(nmat).normalize();tempColor.multiplyScalar(.72+Math.max(0,normal.dot(light))*.45)}
 faces.push({p,depth,layer:o.renderOrder||0,color:'#'+tempColor.getHexString(),alpha:material.opacity??1,line:step===2,seamless:!!material.userData.seamless});
 }
 }
 });
 faces.sort((a,b)=>(a.layer||0)-(b.layer||0)||b.depth-a.depth);
 for(const f of faces){ctx.globalAlpha=f.alpha;const p=f.p;if(f.image){const image=f.image,iw=image.width,ih=image.height;ctx.save();ctx.transform((p[1][0]-p[0][0])/iw,(p[1][1]-p[0][1])/iw,(p[3][0]-p[0][0])/ih,(p[3][1]-p[0][1])/ih,p[0][0],p[0][1]);ctx.drawImage(image,0,0);ctx.restore();continue}ctx.beginPath();ctx.moveTo(...p[0]);for(let i=1;i<p.length;i++)ctx.lineTo(...p[i]);if(f.line){ctx.strokeStyle=f.color;ctx.lineWidth=.7;ctx.stroke()}else{ctx.closePath();ctx.fillStyle=f.color;ctx.fill();if(f.seamless){ctx.strokeStyle=f.color;ctx.lineWidth=.6;ctx.stroke()}}}
 ctx.globalAlpha=1;
 };
}
