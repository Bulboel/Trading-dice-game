/* Presentation adapter. Game legality, turns, decks and combat stay in index.html. */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const game=window.hackeniaGame, host=document.getElementById('bw');
try { initClearing(); } catch(error) {
  console.warn('Clairière 3D indisponible, affichage de secours conservé.',error);
  host.classList.remove('view3d');
  document.getElementById('terrain-status').textContent='Affichage de secours · terre +1';
}
function initClearing(){
const canvas=document.createElement('canvas');canvas.id='landscape';canvas.setAttribute('aria-label','Plateau 3D de la Clairière des murmures, huit colonnes et dix lignes');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'});}catch{renderer=new LandscapeCanvasRenderer(canvas);}
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
 const focus=project(point.x-3.5,level+.25,point.y-4.5),points=[];
 const preview=state.preview.length?state.preview:[[point.x,point.y]];
 for(const [x,y]of preview){if(x<0||x>=8||y<0||y>=10)continue;for(const dx of[-.5,.5])for(const dz of[-.5,.5])points.push(project(x-3.5+dx,level,y-4.5+dz))}
 const size=points.length?Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x)):50,sy=points.length?Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y)):50;
 const crop=Math.max(58,Math.min(140,Math.max(size,sy)*1.22)),centerX=Math.max(size,sy)>115?focus.x:points.length?(Math.max(...points.map(p=>p.x))+Math.min(...points.map(p=>p.x)))/2:focus.x,centerY=Math.max(size,sy)>115?focus.y:points.length?(Math.max(...points.map(p=>p.y))+Math.min(...points.map(p=>p.y)))/2-10:focus.y;
 const left=Math.max(0,Math.min(r.width-crop,centerX-crop/2)),top=Math.max(0,Math.min(r.height-crop,centerY-crop/2)),scale=canvas.width/r.width;
 lensContext.fillStyle='#20392c';lensContext.fillRect(0,0,320,320);lensContext.drawImage(canvas,left*scale,top*scale,crop*scale,crop*scale,0,0,320,320);
 const fx=(focus.x-left)/crop*320,fy=(focus.y-top)/crop*320;lensContext.strokeStyle='#fff0ba';lensContext.lineWidth=2;lensContext.setLineDash([5,4]);lensContext.strokeRect(fx-17,fy-17,34,34);lensContext.setLineDash([]);
 lensCaption.textContent=state.valid?'Placement valide':'Placement impossible';placementLens.dataset.valid=String(state.valid);
 // Move aside if the placement itself is near the upper-left corner.
 placementLens.classList.toggle('right',r.left+focus.x<190&&r.top+focus.y<220);
}

const navigation=document.createElement('div');navigation.id='board-navigation';navigation.setAttribute('role','group');navigation.setAttribute('aria-label','Vue du plateau');
navigation.innerHTML='<button type="button" id="zoom-out" aria-label="Dézoomer le plateau" title="Dézoomer">−</button><output id="zoom-level" aria-live="polite">110 %</output><button type="button" id="zoom-in" aria-label="Zoomer le plateau" title="Zoomer">+</button><button type="button" id="pan-view" aria-label="Déplacer la vue" aria-pressed="false" title="Déplacer la vue : active puis fais glisser le terrain">✥</button><button type="button" id="reset-view" aria-label="Vue entière du plateau" title="Vue entière">⌖</button>';
host.append(navigation);
const zoneLabels=[{owner:1,z:-5.65,title:'Zone orange',hint:'Entrée des Verts : +1 point'},{owner:0,z:5.65,title:'Zone verte',hint:'Entrée des Oranges : +1 point'}].map(data=>{const el=document.createElement('div');el.className='score-zone score-zone-'+data.owner;el.innerHTML='<b>'+data.title+'</b><span>'+data.hint+'</span>';host.append(el);return{...data,el}});
let zoom=1.1,panX=0,panY=0,panEnabled=false,panDrag=null,viewSpan=9,viewAspect=1;

const scene=new THREE.Scene(),world=new THREE.Group();scene.add(world);scene.fog=new THREE.Fog(0x304d3d,25,58);
const camera=new THREE.OrthographicCamera(-10,10,10,-10,.1,100);camera.position.set(8,15,16);camera.lookAt(0,0,0);
scene.add(new THREE.HemisphereLight(0xe9f0d5,0x3c5034,2.3));
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
const gridPoints=[];for(let x=0;x<=8;x++)gridPoints.push(new THREE.Vector3(x-4,.205,-5),new THREE.Vector3(x-4,.205,5));for(let y=0;y<=10;y++)gridPoints.push(new THREE.Vector3(-4,.205,y-5),new THREE.Vector3(4,.205,y-5));
const grid=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(gridPoints),new THREE.LineBasicMaterial({color:0xe5d9a0,transparent:true,opacity:.27}));world.add(grid);
function rail(z,color){const m=mesh(box,mat(color,{metalness:.35}));m.scale.set(8.13,.07,.07);m.position.set(0,.22,z);return m}rail(-5,0xbf9165);rail(5,0x9eae73);
// The first and last rows are the original scoring zones, one cell deep.
for(const [z,color]of[[-4.5,0xe2a062],[4.5,0x9cc36b]]){
 const zone=new THREE.Mesh(new THREE.PlaneGeometry(8,1),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.27,side:THREE.DoubleSide,depthWrite:false}));zone.rotation.x=-Math.PI/2;zone.position.set(0,.212,z);world.add(zone);
 rail(z<0?-4:4,color);
 for(let x=-3.5;x<4;x++){const mark=mesh(new THREE.ConeGeometry(.055,.18,3),mat(color));mark.rotation.x=z<0?Math.PI/2:-Math.PI/2;mark.position.set(x,.24,z<0?-4.12:4.12);mark.castShadow=false;}
}
for(const x of[-4.08,4.08]){const m=mesh(box,stone);m.scale.set(.07,.07,10.14);m.position.set(x,.20,0)}
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
function registerFoliage(object,index,matrix,x,z){object.setMatrixAt(index,matrix);const bx=Math.floor(x+4),by=Math.floor(z+5);if(bx>=0&&bx<8&&by>=0&&by<10)foliageRecords.push({object,index,matrix:matrix.clone(),x:bx,y:by})}
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
const pieces=new THREE.Group(),highlights=new THREE.Group();world.add(pieces,highlights);
const tileGeo=new THREE.BoxGeometry(.94,1,.94),topGeo=new THREE.PlaneGeometry(.86,.86),highlightGeo=new THREE.PlaneGeometry(.91,.91),textures=new Map(),tileMats=new Map(),creatureMats=new Map();
const eyeMaterial=mat(0x172d26);
const green=mat(0x3c7959,{roughness:.56}),orange=mat(0xb97844,{roughness:.56});
function label(value,element,bonus=0){const key=value+':'+element+':'+bonus;if(textures.has(key))return textures.get(key);const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.strokeStyle='#f0dfb280';ctx.lineWidth=2;ctx.strokeRect(5,5,118,118);ctx.font='bold 70px Georgia';ctx.textAlign='center';ctx.fillStyle='#fff4d3';ctx.shadowColor='#10261b';ctx.shadowBlur=3;ctx.fillText(value,64,87);if(element){ctx.beginPath();ctx.arc(108,20,8,0,7);ctx.fillStyle=game.elementColors[element];ctx.fill();ctx.strokeStyle='#fff4cf';ctx.stroke()}if(bonus){ctx.font='bold 24px sans-serif';ctx.fillStyle='#f5db84';ctx.fillText('+'+bonus,103,114)}const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const material=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false});textures.set(key,material);return material}
let state,active=true,quality='auto',moving=true,light=false,paused=false,lastFrame=0,currentAngle=0;
const tiles=new Map(),creatures=new Map(),modelCache=new Map();
let modelTools;
function getModelTools(){return modelTools??=Promise.all([import('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js'),import('https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/utils/SkeletonUtils.js')]).then(([a,b])=>({loader:new a.GLTFLoader(),clone:b.clone}))}
async function attachCreatureModel(g,k){
 const mi=k.mi;g.userData.modelId=mi;
 try{const info=await game.modelInfo(mi);if(!info?.glb)return;const url='assets/'+info.glb;
 if(!modelCache.has(url))modelCache.set(url,(async()=>{const exists=await fetch(url,{method:'HEAD'});if(!exists.ok)return null;const tools=await getModelTools();const gltf=await tools.loader.loadAsync(url);return{gltf,clone:tools.clone}})().catch(()=>null));
 const asset=await modelCache.get(url);if(!asset||!g.parent||g.userData.modelId!==mi)return;
 const root=asset.clone(asset.gltf.scene),holder=new THREE.Group();holder.userData.imported=true;holder.add(root);root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3());if(!Number.isFinite(size.y)||size.y<=0)return;
 const scale=Math.min(.95/size.y,.78/Math.max(size.x,.01),.78/Math.max(size.z,.01));root.scale.setScalar(scale);root.position.set(-(bounds.min.x+bounds.max.x)*scale/2,-bounds.min.y*scale+.1,-(bounds.min.z+bounds.max.z)*scale/2);
 root.traverse(o=>{o.userData.imported=true;if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});g.children.forEach((o,i)=>{if(i>0)o.visible=false});g.add(holder);g.userData.model=holder;
 if(asset.gltf.animations.length){const mixer=new THREE.AnimationMixer(root),idle=asset.gltf.animations.find(a=>/idle|stand|breath/i.test(a.name))||asset.gltf.animations[0];mixer.clipAction(idle).play();g.userData.mixer=mixer}
 }catch(error){console.info('Figurine provisoire conservée pour ce modèle.',mi)}
}
function disposeHighlights(){for(const m of [...highlights.children]){highlights.remove(m);m.material.dispose()}}
function highlight(x,y,color,level=.235){const m=new THREE.Mesh(highlightGeo,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.36,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x-3.5,level,y-4.5);highlights.add(m)}
function creature(k){const g=new THREE.Group(),col=game.elementColors[game.monsters[k.mi]?.el]||'#b5c793';let material=creatureMats.get(col);if(!material){material=mat(col,{roughness:.48});creatureMats.set(col,material)}
const foot=mesh(new THREE.CylinderGeometry(.29,.33,.1,16),k.o?orange:green,g);foot.position.y=.05;
const body=mesh(sphere,material,g);body.position.y=.35;body.scale.set(.24,.26,.21);
const head=mesh(sphere,material,g);head.position.set(0,.62,-.04);head.scale.set(.25,.21,.22);
for(const x of[-.11,.11]){const ear=mesh(new THREE.ConeGeometry(.08,.26,5),gold,g);ear.position.set(x,.85,-.035);ear.rotation.z=-x*2;const eye=mesh(sphere,eyeMaterial,g);eye.position.set(x,.66,.155);eye.scale.set(.037,.046,.025)}
const tail=mesh(new THREE.ConeGeometry(.09,.36,7),material,g);tail.position.set(0,.29,-.25);tail.rotation.x=-1;
g.userData.k=k;pieces.add(g);attachCreatureModel(g,k);return g}
function sync(){state=game.snapshot();setActive(state.terrain==='terre');if(!active)return;updateFoliage();
 const live=new Set();for(let y=0;y<10;y++)for(let x=0;x<8;x++){const c=state.b[y][x],key=x+','+y;if(!c)continue;live.add(key);let t=tiles.get(key);if(!t){const pivot=new THREE.Group();pieces.add(pivot);const solid=mesh(tileGeo,c.o?orange:green,pivot),top=new THREE.Mesh(topGeo,label(c.v,c.el));top.rotation.x=-Math.PI/2;pivot.add(top);t={pivot,solid,top};tiles.set(key,t)}
 const h=c.f?.035:.28;t.pivot.position.set(x-3.5,.22,y-4.5);t.pivot.rotation.set(0,0,0);t.solid.scale.y=h;t.solid.position.set(0,h/2,0);t.solid.material=c.o?orange:green;t.top.position.set(0,h+.004,0);t.top.visible=!c.f;t.top.material=label(c.v,c.el,Math.max(0,game.power(x,y)-c.v));t.c=c;t.x=x;t.y=y;t.an=state.anim?.o[key];}
 for(const[key,t]of tiles)if(!live.has(key)){pieces.remove(t.pivot);tiles.delete(key)}
 const liveCr=new Set();for(const k of state.cr){const key=k.id;liveCr.add(key);let g=creatures.get(key);if(!g){g=creature(k);g.position.set(k.x-3.5,.23,k.y-4.5);creatures.set(key,g)}if(g.userData.modelId!==k.mi){g.userData.mixer?.stopAllAction();if(g.userData.model){g.remove(g.userData.model);g.userData.model=null}g.userData.mixer=null;g.children.forEach(o=>o.visible=true);attachCreatureModel(g,k)}g.userData.k=k;const c=state.b[k.y][k.x];g.userData.target=new THREE.Vector3(k.x-3.5,.23+(c&&!c.f?.28:0),k.y-4.5);}
 for(const[key,g]of creatures)if(!liveCr.has(key)){pieces.remove(g);g.userData.mixer?.stopAllAction();g.traverse(o=>{if(o.isMesh&&!o.userData.imported&&o.geometry!==sphere)o.geometry.dispose()});creatures.delete(key)}
 disposeHighlights();for(const a of state.preview)if(a[0]>=0&&a[0]<8&&a[1]>=0&&a[1]<10){const c=state.b[a[1]][a[0]];highlight(a[0],a[1],state.valid?0xf2d880:0xf17964,.24+(c&&!c.f?.28:0))}
 if(state.reachable)for(const key of Object.keys(state.reachable)){if(state.reachable[key]===null)continue;const[x,y]=key.split(',').map(Number),k=state.cr.find(c=>c.x===x&&c.y===y);if(k&&k.o===state.cur)continue;const c=state.b[y][x];highlight(x,y,k?0xed806d:0xa5e2d2,.25+(c&&!c.f?.28:0))}
 if(state.sel)highlight(state.sel.x,state.sel.y,0xffe7a5,.26+(state.b[state.sel.y][state.sel.x]&&!state.b[state.sel.y][state.sel.x].f?.28:0));
 if(state.cu&&Date.now()-state.lastJ<3000){const c=state.b[state.cu.y][state.cu.x];highlight(state.cu.x,state.cu.y,0xe8efb5,.26+(c&&!c.f?.28:0))}
 const show=(state.mode==='p'||state.mode==='r')&&state.pc;dieGroup.visible=!!show;if(show){const D=game.monsters[state.die];dieGroup.userData.target=new THREE.Vector3(state.pc.x-3.5,.95,state.pc.y-4.5);dieBody.material=matForElement(D.el);dieLabel.material=label(D.lv,D.el)}
}
function matForElement(el){if(!tileMats.has(el))tileMats.set(el,mat(game.elementColors[el],{roughness:.38,metalness:.2}));return tileMats.get(el)}
const dieGroup=new THREE.Group();pieces.add(dieGroup);dieGroup.visible=false;const dieBody=mesh(new THREE.BoxGeometry(.72,.72,.72),gold,dieGroup);const dieLabel=new THREE.Mesh(new THREE.PlaneGeometry(.64,.64),label(1,''));dieLabel.rotation.x=-Math.PI/2;dieLabel.position.y=.365;dieGroup.add(dieLabel);
const edges=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(.735,.735,.735)),new THREE.LineBasicMaterial({color:0xe1dbb4}));dieGroup.add(edges);
// Raycasting is shared by board clicks, drag and drop, and touch placement.
const raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2(),pickPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-.22),hit=new THREE.Vector3();
function cellAt(e){const r=canvas.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)return[-1,-1];mouse.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(mouse,camera);
 // Raised faces and creatures must resolve to their own cells, not the plane behind them.
 const hits=raycaster.intersectObjects(pieces.children,true);for(const h of hits){let o=h.object;while(o&&o.parent!==pieces)o=o.parent;if(!o||o===dieGroup)continue;const k=o.userData.k;if(k)return[k.x,k.y];const t=[...tiles.values()].find(t=>t.pivot===o);if(t)return[t.x,t.y]}
 if(!raycaster.ray.intersectPlane(pickPlane,hit))return[-1,-1];world.worldToLocal(hit);const x=Math.floor(hit.x+4),y=Math.floor(hit.z+5);return x>=0&&x<8&&y>=0&&y<10?[x,y]:[-1,-1]}
function updateCamera(){
 const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0),up=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1),offset=right.multiplyScalar(panX).add(up.multiplyScalar(panY));
 camera.position.copy(new THREE.Vector3(8,15,16).add(offset));camera.lookAt(offset);camera.zoom=zoom;camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
}
function changeZoom(value,anchor){
 const next=Math.round(Math.max(1,Math.min(2.4,value))*100)/100;
 if(anchor){const r=canvas.getBoundingClientRect(),nx=(anchor.clientX-r.left)/r.width*2-1,ny=1-(anchor.clientY-r.top)/r.height*2;panX+=nx*viewSpan*viewAspect*(1/zoom-1/next);panY+=ny*viewSpan*(1/zoom-1/next)}
 zoom=next;if(zoom===1){panX=0;panY=0}panX=Math.max(-6,Math.min(6,panX));panY=Math.max(-6,Math.min(6,panY));
 document.getElementById('zoom-level').textContent=Math.round(zoom*100)+' %';document.getElementById('zoom-out').disabled=zoom<=1;document.getElementById('zoom-in').disabled=zoom>=2.4;updateCamera();
}
function resetView(){panX=panY=0;changeZoom(1)}
document.getElementById('zoom-in').onclick=()=>changeZoom(zoom+.2);
document.getElementById('zoom-out').onclick=()=>changeZoom(zoom-.2);
document.getElementById('reset-view').onclick=resetView;
document.getElementById('pan-view').onclick=()=>{panEnabled=!panEnabled;document.getElementById('pan-view').setAttribute('aria-pressed',String(panEnabled));canvas.classList.toggle('panning',panEnabled)};
canvas.addEventListener('wheel',e=>{if(!active||e.ctrlKey)return;e.preventDefault();changeZoom(zoom*Math.exp(-e.deltaY*.0015),e)},{passive:false});
canvas.addEventListener('contextmenu',e=>{if(active)e.preventDefault()});
canvas.onpointerdown=e=>{
 if(panEnabled||e.button===2){e.preventDefault();canvas.setPointerCapture(e.pointerId);panDrag={id:e.pointerId,x:e.clientX,y:e.clientY};return}
 if(state.over||(state.ai&&state.cur===1))return;e.preventDefault();canvas.setPointerCapture(e.pointerId);game.board.onpointerdown({clientX:e.clientX,clientY:e.clientY,pointerId:e.pointerId,preventDefault(){}})
};
// Keep capture on the visible canvas, including when the board is magnified.
const originalCapture=game.board.setPointerCapture.bind(game.board);game.board.setPointerCapture=id=>active?canvas.setPointerCapture(id):originalCapture(id);
canvas.onpointermove=e=>{if(panDrag){if(e.pointerId!==panDrag.id)return;const r=canvas.getBoundingClientRect();panX-=(e.clientX-panDrag.x)/r.width*2*viewSpan*viewAspect/zoom;panY+=(e.clientY-panDrag.y)/r.height*2*viewSpan/zoom;panX=Math.max(-6,Math.min(6,panX));panY=Math.max(-6,Math.min(6,panY));panDrag.x=e.clientX;panDrag.y=e.clientY;updateCamera();return}game.board.onpointermove(e)};
canvas.onpointerup=e=>{if(panDrag){panDrag=null;return}game.board.onpointerup(e)};
canvas.onpointercancel=e=>{if(panDrag){panDrag=null;return}game.board.onpointercancel(e)};
function setActive(value){active=value;if(!value)placementLens.hidden=true;host.classList.toggle('view3d',value);document.getElementById('land-caption').hidden=!value;document.getElementById('terrain-status').textContent=value?(renderer.isSoftware?'Clairière · rendu léger · terre +1':'Clairière · terre +1'):'Terrain '+game.snapshot().terrain+' · +1 élément';}
function resize(){const r=host.getBoundingClientRect();if(r.width<1||r.height<1)return;const aspect=r.width/r.height;renderer.setSize(r.width,r.height,false);const span=Math.max(8.9,7.1/aspect);viewSpan=span;viewAspect=aspect;camera.left=-span*aspect;camera.right=span*aspect;camera.top=span;camera.bottom=-span;updateCamera()}
function configure(){quality=document.getElementById('quality').value;light=renderer.isSoftware||quality==='light'||quality==='auto'&&(matchMedia('(max-width:700px)').matches||navigator.hardwareConcurrency<=4);moving=quality!=='still'&&!matchMedia('(prefers-reduced-motion:reduce)').matches;renderer.setPixelRatio(Math.min(devicePixelRatio||1,light?1.25:1.8));renderer.shadowMap.enabled=!light;grass.count=renderer.isSoftware?Math.min(850,grassCount):light?Math.min(2500,grassCount):grassCount;const flowers=renderer.isSoftware?36:flowerCount;petals.count=flowers*5;stems.count=centres.count=flowers;flowerLeaves.count=flowers*2;motes.visible=!light&&moving;windAmount.value=moving?1:0;resize()}
document.getElementById('quality').addEventListener('change',configure);matchMedia('(prefers-reduced-motion:reduce)').addEventListener('change',configure);new ResizeObserver(resize).observe(host);document.addEventListener('visibilitychange',()=>{paused=document.hidden});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();setActive(false);document.getElementById('terrain-status').textContent='Affichage de secours · recharge la page pour retrouver la 3D'});
window.HackeniaView={get active(){return active},cellAt,sync,setActive,updateLens};configure();sync();
function frame(now){requestAnimationFrame(frame);if(paused||!game.isPlaying()||!active||now-lastFrame<(renderer.isSoftware?100:light?32:16))return;const dt=Math.min((now-lastFrame)/1000,.06);lastFrame=now;const t=moving?now/1000:0;
 wind.value=t;waterNormals.offset.set(-t*.032,t*.013);
 for(let i=0;i<wp.count;i++){const x=waterOrig[i*3],z=waterOrig[i*3+2];wp.setY(i,waterHeight(x,z,t))}wp.needsUpdate=true;if(!renderer.isSoftware)wg.computeVertexNormals();
 for(const g of glints){
  const center=moving?(g.x<0?-1:1)*((Math.abs(g.x)+t*.24)%7):g.x,p=g.m.geometry.attributes.position;g.m.position.set(0,0,0);g.m.scale.set(1,1,1);
  for(let i=0;i<p.count;i++){const u=Math.floor(i/2)/6+(i%2)/6,x=Math.max(-7,Math.min(7,center+(u-.5)*g.length)),z=river(x)+g.lane+Math.sin(u*3.14+g.phase)*.014;p.setXYZ(i,x,waterHeight(x,z,t)+.013,z)}p.needsUpdate=true;
 }
 for(const rill of fallingRills){const down=moving?((t*.35+rill.phase)%1)*.83:rill.phase*.83,p=rill.m.geometry.attributes.position;for(let i=0;i<2;i++){const y=-.06-down-i*.17;p.setXYZ(i,rill.side*(7.065+Math.sin(-y*2)*.035),y,river(rill.side*7)+rill.lane)}p.needsUpdate=true}
 motes.rotation.y=moving?Math.sin(t*.08)*.06:0;
 const target=-state.rzCur*Math.PI/180;if(!moving)currentAngle=target;currentAngle+=Math.atan2(Math.sin(target-currentAngle),Math.cos(target-currentAngle))*Math.min(1,dt*5);world.rotation.y=currentAngle;world.updateMatrixWorld(true);
 for(const zone of zoneLabels){const point=world.localToWorld(new THREE.Vector3(0,.35,zone.z)).project(camera),rect=host.getBoundingClientRect();zone.el.style.left=((point.x+1)*rect.width/2)+'px';zone.el.style.top=((1-point.y)*rect.height/2)+'px';zone.el.hidden=point.x<-.9||point.x>.9||point.y<-.86||point.y>.9;}

 for(const tile of tiles.values()){let progress=1;const a=tile.an,A=state.anim;if(a&&A&&moving){progress=Math.max(0,Math.min(1,(Date.now()-A.t0-a.d*220)/450))}tile.pivot.visible=progress>0;const eased=1-Math.pow(1-progress,3);tile.pivot.scale.setScalar(Math.max(.001,eased));tile.pivot.position.y=.22+(1-eased)*.55;tile.pivot.rotation.x=a?.c==='u-d'?(1-eased)*Math.PI/2:a?.c==='u-u'?-(1-eased)*Math.PI/2:0;tile.pivot.rotation.z=a?.c==='u-r'?-(1-eased)*Math.PI/2:a?.c==='u-l'?(1-eased)*Math.PI/2:0}
 for(const g of creatures.values()){const k=g.userData.k;g.position.lerp(g.userData.target,moving?Math.min(1,dt*9):1);g.rotation.y=k.o?Math.PI:0;const spawn=state.anim?.o[k.x+','+k.y];g.visible=!spawn||Date.now()>state.anim.t0+spawn.d*220+300;const body=g.children[1];body.position.y=.35+(moving?Math.sin(t*2+k.id)*.012:0);if(g.userData.mixer&&moving)g.userData.mixer.update(dt);}
 if(dieGroup.visible){dieGroup.position.copy(dieGroup.userData.target);dieGroup.position.y+=moving?Math.sin(t*2)*.08:0;dieGroup.rotation.y=moving&&state.cubeCls!=='land'?t*.7:0;dieGroup.scale.setScalar(state.cubeCls==='poof'?.35:1)}
 highlights.children.forEach(m=>m.material.opacity=moving?.32+Math.sin(t*3)*.09:.4);renderer.render(scene,camera);drawPlacementLens();
}
requestAnimationFrame(frame);
}

// CPU projection fallback for browsers without WebGL. Uses the same scene and picking.
// It trades shadows and wind for broad compatibility; no second game implementation.
function LandscapeCanvasRenderer(canvas){
 const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('Canvas indisponible');
 this.isSoftware=true;this.shadowMap={enabled:false};this.setClearColor=()=>{};let w=1,h=1,ratio=1;
 this.setPixelRatio=r=>{ratio=Math.min(r,1.25)};this.setSize=(x,y)=>{w=x;h=y;canvas.width=Math.round(x*ratio);canvas.height=Math.round(y*ratio)};
 const instanceTint=new THREE.Color();
 const vp=new THREE.Matrix4(),mvp=new THREE.Matrix4(),inst=new THREE.Matrix4(),model=new THREE.Matrix4(),nmat=new THREE.Matrix3(),v=new THREE.Vector3(),normal=new THREE.Vector3(),light=new THREE.Vector3(-.4,.85,.3).normalize(),tempColor=new THREE.Color();
 this.render=(scene,camera)=>{
 scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);vp.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);const faces=[];
 ctx.setTransform(ratio,0,0,ratio,0,0);const bg=ctx.createRadialGradient(w*.5,h*.4,0,w*.5,h*.5,Math.max(w,h)*.7);bg.addColorStop(0,'#6c8157');bg.addColorStop(1,'#1b352b');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 scene.traverseVisible(o=>{
 if(!(o.isMesh||o.isLineSegments)||!o.geometry)return;const geo=o.geometry,pos=geo.attributes.position,vc=geo.attributes.color,norm=geo.attributes.normal,idx=geo.index,material=Array.isArray(o.material)?o.material[0]:o.material;
 if(!pos||!material||material.visible===false)return;const step=o.isLineSegments?2:3,count=idx?idx.count:pos.count;
 const copies=o.isInstancedMesh?o.count:1;for(let instance=0;instance<copies;instance++){
 model.copy(o.matrixWorld);if(o.isInstancedMesh){o.getMatrixAt(instance,inst);model.multiply(inst)}mvp.multiplyMatrices(vp,model);nmat.getNormalMatrix(model);if(o.isInstancedMesh&&o.instanceColor)o.getColorAt(instance,instanceTint);else instanceTint.set(0xffffff);
 const projected=new Float32Array(pos.count*3);for(let i=0;i<pos.count;i++){v.fromBufferAttribute(pos,i).applyMatrix4(mvp);projected[i*3]=(v.x+1)*w/2;projected[i*3+1]=(1-v.y)*h/2;projected[i*3+2]=v.z}
 // Number textures use a projected quadrilateral instead of per-triangle mapping.
 if(material.map?.image&&o.geometry.type==='PlaneGeometry'&&pos.count===4){
 const p=[0,1,3,2].map(i=>[projected[i*3],projected[i*3+1]]),depth=(projected[2]+projected[5]+projected[8]+projected[11])/4;
 faces.push({p,depth,image:material.map.image,alpha:material.opacity});continue;
 }
 for(let i=0;i<count;i+=step){const ids=[];for(let j=0;j<step;j++)ids.push(idx?idx.getX(i+j):i+j);const p=ids.map(id=>[projected[id*3],projected[id*3+1]]),depth=ids.reduce((a,id)=>a+projected[id*3+2],0)/step;
 if(depth<-1||depth>1||p.every(a=>a[0]<-50)||p.every(a=>a[0]>w+50)||p.every(a=>a[1]<-50)||p.every(a=>a[1]>h+50))continue;
 if(step===3&&material.side!==THREE.DoubleSide){const cross=(p[1][0]-p[0][0])*(p[2][1]-p[0][1])-(p[1][1]-p[0][1])*(p[2][0]-p[0][0]);if(cross>0)continue}
 tempColor.copy(material.color||new THREE.Color('white'));if(vc&&material.vertexColors){const count=ids.length;tempColor.multiply(new THREE.Color(ids.reduce((s,id)=>s+vc.getX(id),0)/count,ids.reduce((s,id)=>s+vc.getY(id),0)/count,ids.reduce((s,id)=>s+vc.getZ(id),0)/count))}
 if(o.isInstancedMesh)tempColor.multiply(instanceTint);
 const texture=material.map,uv=geo.attributes.uv;
 if(texture?.userData.pixels&&uv){const id=ids[0],tx=((uv.getX(id)*texture.repeat.x+texture.offset.x)%1+1)%1,ty=((uv.getY(id)*texture.repeat.y+texture.offset.y)%1+1)%1,ix=(Math.floor((1-ty)*255)*256+Math.floor(tx*255))*4,pixels=texture.userData.pixels;tempColor.multiply(new THREE.Color(pixels[ix]/255,pixels[ix+1]/255,pixels[ix+2]/255))}
 if(norm&&!material.isMeshBasicMaterial){normal.fromBufferAttribute(norm,ids[0]).applyMatrix3(nmat).normalize();tempColor.multiplyScalar(.72+Math.max(0,normal.dot(light))*.45)}
 faces.push({p,depth,color:'#'+tempColor.getHexString(),alpha:material.opacity??1,line:step===2,seamless:!!material.userData.seamless});
 }
 }
 });
 faces.sort((a,b)=>b.depth-a.depth);
 for(const f of faces){ctx.globalAlpha=f.alpha;const p=f.p;if(f.image){const image=f.image,iw=image.width,ih=image.height;ctx.save();ctx.transform((p[1][0]-p[0][0])/iw,(p[1][1]-p[0][1])/iw,(p[3][0]-p[0][0])/ih,(p[3][1]-p[0][1])/ih,p[0][0],p[0][1]);ctx.drawImage(image,0,0);ctx.restore();continue}ctx.beginPath();ctx.moveTo(...p[0]);for(let i=1;i<p.length;i++)ctx.lineTo(...p[i]);if(f.line){ctx.strokeStyle=f.color;ctx.lineWidth=.7;ctx.stroke()}else{ctx.closePath();ctx.fillStyle=f.color;ctx.fill();if(f.seamless){ctx.strokeStyle=f.color;ctx.lineWidth=.6;ctx.stroke()}}}
 ctx.globalAlpha=1;
 };
}

