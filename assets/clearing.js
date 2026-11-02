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
function height(x,z){const d=Math.abs(z-river(x)),edge=Math.max(0,Math.abs(x)-4.1,Math.abs(z)-5.1);return -.26*Math.exp(-d*d/1.1)+.05+Math.sin(x*1.7+z*.7)*.035+Math.sin(z*2.4)*.025+Math.min(edge,1.7)*(.16+.08*Math.sin(x+z))}
// A continuous sculpted surface, with vertex colours for grass, banks and riverbed.
const ground=new THREE.PlaneGeometry(14,15,56,60);ground.rotateX(-Math.PI/2);
const gp=ground.attributes.position,colors=[];
for(let i=0;i<gp.count;i++){
 const x=gp.getX(i),z=gp.getZ(i),d=Math.abs(z-river(x));gp.setY(i,height(x,z));
 const c=new THREE.Color(0x526b42),bank=new THREE.Color(0x9c9a73),bed=new THREE.Color(0x667b70);
 const shore=1-THREE.MathUtils.smoothstep(d,.85,1.25);c.lerp(bank,shore*.22);if(d<.85)c.lerp(bed,1-THREE.MathUtils.smoothstep(d,.48,.85));
 c.multiplyScalar(.98+Math.sin(x*2.1+z*.7)*.04+Math.cos(z*3.3-x)*.025);colors.push(c.r,c.g,c.b);
}
ground.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));ground.computeVertexNormals();mesh(ground,mat(0xffffff,{vertexColors:true}));
const base=mesh(new THREE.CylinderGeometry(9.3,8.9,1.25,12),mat(0x3b4b34));base.scale.set(.83,1,.88);base.position.y=-1.1;base.visible=!renderer.isSoftware;
const skirtPositions=[];
for(let side=0;side<4;side++)for(let i=0;i<60;i++){
 const a=i/60,b=(i+1)/60;
 const edge=t=>side===0?[-7+t*14,-7.5]:side===1?[7,-7.5+t*15]:side===2?[7-t*14,7.5]:[-7,7.5-t*15];
 const [x,z]=edge(a),[xx,zz]=edge(b),y=height(x,z),yy=height(xx,zz);
 skirtPositions.push(x,y,z,xx,yy,zz,x,-1.15,z,xx,yy,zz,xx,-1.15,zz,x,-1.15,z);
}
const skirt=new THREE.BufferGeometry();skirt.setAttribute('position',new THREE.Float32BufferAttribute(skirtPositions,3));skirt.computeVertexNormals();mesh(skirt,mat(0x596044,{side:THREE.DoubleSide}));
// Narrow ribbons follow the banks exactly, avoiding triangular colour bands.
for(const side of[-1,1]){
 const bankGeo=new THREE.PlaneGeometry(14,.52,100,4);bankGeo.rotateX(-Math.PI/2);const p=bankGeo.attributes.position,c=[];
 for(let i=0;i<p.count;i++){const x=p.getX(i),u=(p.getZ(i)+.26)/.52,z=river(x)+side*(.72+u*.52);p.setXYZ(i,x,Math.max(-.065,height(x,z))+.014,z);const color=new THREE.Color(0xa1a58a).lerp(new THREE.Color(0x526b42),THREE.MathUtils.smoothstep(u,.12,1));c.push(color.r,color.g,color.b)}
 bankGeo.setAttribute('color',new THREE.Float32BufferAttribute(c,3));bankGeo.computeVertexNormals();mesh(bankGeo,mat(0xffffff,{vertexColors:true,roughness:1}));
}
// A transparent turquoise channel: darker centre, pale shallows and fine ripples.
const wg=new THREE.PlaneGeometry(14,1.47,100,12);wg.rotateX(-Math.PI/2);const wp=wg.attributes.position,waterColors=[];
for(let i=0;i<wp.count;i++){
 const x=wp.getX(i),edge=Math.abs(wp.getZ(i))/.735;wp.setZ(i,wp.getZ(i)+river(x));wp.setY(i,-.055);
 const c=new THREE.Color(0x21656d).lerp(new THREE.Color(0x8ab9a0),Math.pow(edge,2.2)*.82);c.multiplyScalar(.96+Math.sin(x*1.8)*.045);waterColors.push(c.r,c.g,c.b);
}
wg.setAttribute('color',new THREE.Float32BufferAttribute(waterColors,3));wg.computeVertexNormals();
const normalCanvas=document.createElement('canvas');normalCanvas.width=normalCanvas.height=128;const normalCtx=normalCanvas.getContext('2d'),normalPixels=normalCtx.createImageData(128,128);
for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4;normalPixels.data[i]=128+Math.sin(x*Math.PI/16+y*Math.PI/32)*17;normalPixels.data[i+1]=128+Math.cos(y*Math.PI/8+x*Math.PI/32)*10;normalPixels.data[i+2]=252;normalPixels.data[i+3]=255}
normalCtx.putImageData(normalPixels,0,0);const waterNormals=new THREE.CanvasTexture(normalCanvas);waterNormals.wrapS=waterNormals.wrapT=THREE.RepeatWrapping;waterNormals.repeat.set(7,2);
const water=mesh(wg,new THREE.MeshPhysicalMaterial({color:0xffffff,vertexColors:true,normalMap:waterNormals,normalScale:new THREE.Vector2(.35,.2),roughness:.23,metalness:.05,transparent:true,opacity:renderer.isSoftware?1:.84,clearcoat:.8,clearcoatRoughness:.28}));water.castShadow=false;water.material.userData.seamless=true;
const waterOrig=Float32Array.from(wp.array),rippleMat=new THREE.LineBasicMaterial({color:0xd4eee0,transparent:true,opacity:.23,depthWrite:false});
const glints=[];for(let i=0;i<34;i++){
 const x=rand()*13-6.5,z=river(x)+(rand()-.5)*1.2,length=.18+rand()*.55,pts=[];
 for(let j=0;j<6;j++){const u=j/6,v=(j+1)/6;pts.push(new THREE.Vector3((u-.5)*length,0,Math.sin(u*3.14)*.025),new THREE.Vector3((v-.5)*length,0,Math.sin(v*3.14)*.025))}
 const m=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts),rippleMat);m.position.set(x,-.027,z);world.add(m);glints.push({m,x,z,phase:rand()*6});
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
const grass=new THREE.InstancedMesh(grassGeo,grassMaterial,1500),dummy=new THREE.Object3D();let grassCount=0;
for(let i=0;i<2200&&grassCount<1500;i++){const x=rand()*13.1-6.55,z=rand()*13.6-6.8;if(Math.abs(z-river(x))<1.28)continue;if(Math.abs(x)<4.15&&Math.abs(z)<5.15&&rand()>.15)continue;dummy.position.set(x,height(x,z)+.015,z);dummy.rotation.set(0,rand()*Math.PI,0);dummy.scale.setScalar(.55+rand()*.85);dummy.updateMatrix();grass.setMatrixAt(grassCount,dummy.matrix);grass.setColorAt(grassCount,new THREE.Color().setHSL(.2+rand()*.06,.24+rand()*.18,.33+rand()*.15));grassCount++}grass.count=grassCount;grass.receiveShadow=true;world.add(grass);
// A few flowers, deliberately kept out of the playing grid.
for(let i=0;i<35;i++){const x=(rand()>.5?1:-1)*(4.3+rand()*1.8),z=rand()*11-5.5;if(Math.abs(z-river(x))<1.1)continue;const f=mesh(sphere,mat(i%3?0xc7b977:0xb0a1c3));f.scale.set(.045,.035,.045);f.position.set(x,height(x,z)+.17,z);f.castShadow=false}
const moteGeo=new THREE.BufferGeometry(),motePos=[];for(let i=0;i<22;i++)motePos.push(rand()*12-6,.5+rand()*2.3,rand()*12-6);moteGeo.setAttribute('position',new THREE.Float32BufferAttribute(motePos,3));const motes=new THREE.Points(moteGeo,new THREE.PointsMaterial({color:0xffe3a1,size:.045,transparent:true,opacity:.6,depthWrite:false}));world.add(motes);
const pieces=new THREE.Group(),highlights=new THREE.Group();world.add(pieces,highlights);
const tileGeo=new THREE.BoxGeometry(.94,1,.94),topGeo=new THREE.PlaneGeometry(.86,.86),highlightGeo=new THREE.PlaneGeometry(.91,.91),textures=new Map(),tileMats=new Map(),creatureMats=new Map();
const eyeMaterial=mat(0x172d26);
const green=mat(0x3c7959,{roughness:.56}),orange=mat(0xb97844,{roughness:.56});
function label(value,element,bonus=0){const key=value+':'+element+':'+bonus;if(textures.has(key))return textures.get(key);const c=document.createElement('canvas');c.width=c.height=128;const ctx=c.getContext('2d');ctx.strokeStyle='#f0dfb280';ctx.lineWidth=2;ctx.strokeRect(5,5,118,118);ctx.font='bold 70px Georgia';ctx.textAlign='center';ctx.fillStyle='#fff4d3';ctx.shadowColor='#10261b';ctx.shadowBlur=3;ctx.fillText(value,64,87);if(element){ctx.beginPath();ctx.arc(108,20,8,0,7);ctx.fillStyle=game.elementColors[element];ctx.fill();ctx.strokeStyle='#fff4cf';ctx.stroke()}if(bonus){ctx.font='bold 24px sans-serif';ctx.fillStyle='#f5db84';ctx.fillText('+'+bonus,103,114)}const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;const material=new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false});textures.set(key,material);return material}
let state,active=true,quality='auto',moving=true,light=false,paused=false,lastFrame=0,currentAngle=0;
const tiles=new Map(),creatures=new Map();
function disposeHighlights(){for(const m of [...highlights.children]){highlights.remove(m);m.material.dispose()}}
function highlight(x,y,color,level=.235){const m=new THREE.Mesh(highlightGeo,new THREE.MeshBasicMaterial({color,transparent:true,opacity:.36,side:THREE.DoubleSide,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x-3.5,level,y-4.5);highlights.add(m)}
function creature(k){const g=new THREE.Group(),col=game.elementColors[game.monsters[k.mi]?.el]||'#b5c793';let material=creatureMats.get(col);if(!material){material=mat(col,{roughness:.48});creatureMats.set(col,material)}
const foot=mesh(new THREE.CylinderGeometry(.29,.33,.1,16),k.o?orange:green,g);foot.position.y=.05;
const body=mesh(sphere,material,g);body.position.y=.35;body.scale.set(.24,.26,.21);
const head=mesh(sphere,material,g);head.position.set(0,.62,-.04);head.scale.set(.25,.21,.22);
for(const x of[-.11,.11]){const ear=mesh(new THREE.ConeGeometry(.08,.26,5),gold,g);ear.position.set(x,.85,-.035);ear.rotation.z=-x*2;const eye=mesh(sphere,eyeMaterial,g);eye.position.set(x,.66,.155);eye.scale.set(.037,.046,.025)}
const tail=mesh(new THREE.ConeGeometry(.09,.36,7),material,g);tail.position.set(0,.29,-.25);tail.rotation.x=-1;
g.userData.k=k;pieces.add(g);return g}
function sync(){state=game.snapshot();setActive(state.terrain==='terre');if(!active)return;
 const live=new Set();for(let y=0;y<10;y++)for(let x=0;x<8;x++){const c=state.b[y][x],key=x+','+y;if(!c)continue;live.add(key);let t=tiles.get(key);if(!t){const pivot=new THREE.Group();pieces.add(pivot);const solid=mesh(tileGeo,c.o?orange:green,pivot),top=new THREE.Mesh(topGeo,label(c.v,c.el));top.rotation.x=-Math.PI/2;pivot.add(top);t={pivot,solid,top};tiles.set(key,t)}
 const h=c.f?.035:.14+.06*c.v;t.pivot.position.set(x-3.5,.22,y-4.5);t.pivot.rotation.set(0,0,0);t.solid.scale.y=h;t.solid.position.set(0,h/2,0);t.solid.material=c.o?orange:green;t.top.position.set(0,h+.004,0);t.top.visible=!c.f;t.top.material=label(c.v,c.el,Math.max(0,game.power(x,y)-c.v));t.c=c;t.x=x;t.y=y;t.an=state.anim?.o[key];}
 for(const[key,t]of tiles)if(!live.has(key)){pieces.remove(t.pivot);tiles.delete(key)}
 const liveCr=new Set();for(const k of state.cr){const key=k.id;liveCr.add(key);let g=creatures.get(key);if(!g){g=creature(k);g.position.set(k.x-3.5,.23,k.y-4.5);creatures.set(key,g)}g.userData.k=k;const c=state.b[k.y][k.x];g.userData.target=new THREE.Vector3(k.x-3.5,.23+(c&&!c.f?.14+.06*c.v:0),k.y-4.5);}
 for(const[key,g]of creatures)if(!liveCr.has(key)){pieces.remove(g);g.traverse(o=>{if(o.isMesh&&o.geometry!==sphere)o.geometry.dispose()});creatures.delete(key)}
 disposeHighlights();for(const a of state.preview)if(a[0]>=0&&a[0]<8&&a[1]>=0&&a[1]<10){const c=state.b[a[1]][a[0]];highlight(a[0],a[1],state.valid?0xf2d880:0xf17964,.24+(c&&!c.f?.14+.06*c.v:0))}
 if(state.reachable)for(const key of Object.keys(state.reachable)){if(state.reachable[key]===null)continue;const[x,y]=key.split(',').map(Number),k=state.cr.find(c=>c.x===x&&c.y===y);if(k&&k.o===state.cur)continue;const c=state.b[y][x];highlight(x,y,k?0xed806d:0xa5e2d2,.25+(c&&!c.f?.14+.06*c.v:0))}
 if(state.sel)highlight(state.sel.x,state.sel.y,0xffe7a5,.26+(state.b[state.sel.y][state.sel.x]?.v||0)*.06+.14);
 if(state.cu&&Date.now()-state.lastJ<3000){const c=state.b[state.cu.y][state.cu.x];highlight(state.cu.x,state.cu.y,0xe8efb5,.26+(c&&!c.f?.14+.06*c.v:0))}
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
function setActive(value){active=value;host.classList.toggle('view3d',value);document.getElementById('land-caption').hidden=!value;document.getElementById('terrain-status').textContent=value?(renderer.isSoftware?'Clairière · rendu léger · terre +1':'Clairière · terre +1'):'Terrain '+game.snapshot().terrain+' · +1 élément';}
function resize(){const r=host.getBoundingClientRect(),aspect=r.width/Math.max(r.height,1);renderer.setSize(r.width,r.height,false);const span=Math.max(8.9,7.1/aspect);viewSpan=span;viewAspect=aspect;camera.left=-span*aspect;camera.right=span*aspect;camera.top=span;camera.bottom=-span;updateCamera()}
function configure(){quality=document.getElementById('quality').value;light=renderer.isSoftware||quality==='light'||quality==='auto'&&(matchMedia('(max-width:700px)').matches||navigator.hardwareConcurrency<=4);moving=quality!=='still'&&!matchMedia('(prefers-reduced-motion:reduce)').matches;renderer.setPixelRatio(Math.min(devicePixelRatio||1,light?1.25:1.8));renderer.shadowMap.enabled=!light;grass.count=renderer.isSoftware?Math.min(200,grassCount):light?Math.min(650,grassCount):grassCount;motes.visible=!light&&moving;windAmount.value=moving?1:0;resize()}
document.getElementById('quality').addEventListener('change',configure);matchMedia('(prefers-reduced-motion:reduce)').addEventListener('change',configure);new ResizeObserver(resize).observe(host);document.addEventListener('visibilitychange',()=>{paused=document.hidden});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();setActive(false);document.getElementById('terrain-status').textContent='Affichage de secours · recharge la page pour retrouver la 3D'});
window.HackeniaView={get active(){return active},cellAt,sync,setActive};configure();sync();
function frame(now){requestAnimationFrame(frame);if(paused||!active||now-lastFrame<(renderer.isSoftware?100:light?32:16))return;const dt=Math.min((now-lastFrame)/1000,.06);lastFrame=now;const t=moving?now/1000:0;
 wind.value=t;waterNormals.offset.set(-t*.012,t*.006);for(let i=0;i<wp.count;i++){const x=waterOrig[i*3],z=waterOrig[i*3+2];wp.setY(i,-.055+Math.sin(x*3+z*5+t*1.3)*.008+Math.cos(x*6-t)*.004)}wp.needsUpdate=true;
 for(const g of glints){g.m.position.x=moving?((g.x+6.5+t*.06)%13)-6.5:g.x;g.m.position.z=river(g.m.position.x)+(g.z-river(g.x));g.m.scale.x=.85+Math.sin(t*.7+g.phase)*.12}
 motes.rotation.y=moving?Math.sin(t*.08)*.06:0;
 const target=-state.rzCur*Math.PI/180;if(!moving)currentAngle=target;currentAngle+=Math.atan2(Math.sin(target-currentAngle),Math.cos(target-currentAngle))*Math.min(1,dt*5);world.rotation.y=currentAngle;world.updateMatrixWorld(true);
 for(const zone of zoneLabels){const point=world.localToWorld(new THREE.Vector3(0,.35,zone.z)).project(camera),rect=host.getBoundingClientRect();zone.el.style.left=((point.x+1)*rect.width/2)+'px';zone.el.style.top=((1-point.y)*rect.height/2)+'px';zone.el.hidden=point.x<-.9||point.x>.9||point.y<-.86||point.y>.9;}

 for(const tile of tiles.values()){let progress=1;const a=tile.an,A=state.anim;if(a&&A&&moving){progress=Math.max(0,Math.min(1,(Date.now()-A.t0-a.d*220)/450))}tile.pivot.visible=progress>0;const eased=1-Math.pow(1-progress,3);tile.pivot.scale.setScalar(Math.max(.001,eased));tile.pivot.position.y=.22+(1-eased)*.55;tile.pivot.rotation.x=a?.c==='u-d'?(1-eased)*Math.PI/2:a?.c==='u-u'?-(1-eased)*Math.PI/2:0;tile.pivot.rotation.z=a?.c==='u-r'?-(1-eased)*Math.PI/2:a?.c==='u-l'?(1-eased)*Math.PI/2:0}
 for(const g of creatures.values()){const k=g.userData.k;g.position.lerp(g.userData.target,moving?Math.min(1,dt*9):1);g.rotation.y=k.o?Math.PI:0;const spawn=state.anim?.o[k.x+','+k.y];g.visible=!spawn||Date.now()>state.anim.t0+spawn.d*220+300;const body=g.children[1];body.position.y=.35+(moving?Math.sin(t*2+k.id)*.012:0);}
 if(dieGroup.visible){dieGroup.position.copy(dieGroup.userData.target);dieGroup.position.y+=moving?Math.sin(t*2)*.08:0;dieGroup.rotation.y=moving&&state.cubeCls!=='land'?t*.7:0;dieGroup.scale.setScalar(state.cubeCls==='poof'?.35:1)}
 highlights.children.forEach(m=>m.material.opacity=moving?.32+Math.sin(t*3)*.09:.4);renderer.render(scene,camera);
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
