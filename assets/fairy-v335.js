/* v336 — Terrain « Le quartier des brumes féeriques », version nocturne.
   La nuit tombe sur le quartier des fées : sol de mousse bleu nuit parcouru de runes, damier d'ardoise irisée,
   pierres runiques aux couleurs des six éléments, champignons géants bioluminescents, cristaux, et quelques habitations
   magiques façon D&D (tour de mage tordue coiffée d'un cristal, maisons-champignons, chaumière au toit vrillé) aux fenêtres
   allumées. Les pixies sont de petites billes de lumière de toutes les couleurs qui se baladent partout.
   La brume mêle plusieurs couleurs ; une partie prend la couleur de l'élément favorisé, qui change à chaque tour complet
   (règle : moteur du jeu, terrain multi-élément) : setMist(élément). Pachié, Bulbalina et Max des Brumes s'y promènent.
   Coordonnées réelles des cases (root.scale.z = 1/ZS). */
import * as THREE from 'three';
export function createFairyMists(world,software=false,rows=10,helpers={}){
const root=new THREE.Group();world.add(root);root.visible=false;
let seed=7331;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const HZ=rows/2,BX=4.3,BZ=HZ+.3,TOP=.2,FX=9.5,FZ=HZ+4.2;
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.85,...extra});
const glowMat=(color,i=1.4)=>new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:i,roughness:.4});
const add=(geo,material,parent=root,shadow=!software)=>{const m=new THREE.Mesh(geo,material);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m};
const canvasTex=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t};
const updates=[],cellX=x=>x-3.5,cellZ=y=>y-(rows-1)/2,outside=(x,z)=>Math.max(Math.abs(x)-BX,Math.abs(z)-BZ),dummy=new THREE.Object3D();
const RAINBOW=[0xff5a5a,0x4fb6ff,0x5dff9a,0x7df9ff,0xffd34f,0xb07cff,0xff7ad9];
const MIST={feu:0xff6a3a,eau:0x3aa8ff,terre:0xe0b060,vent:0x4dffb8,glace:0x9fe8ff,foudre:0xb07cff,'':0xb48cff};
const dotTex=canvasTex(32,32,g=>{const r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.35,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,32,32)});
const glow=(color,size,op=.8)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color,transparent:true,opacity:op,depthWrite:false,blending:THREE.AdditiveBlending}));s.scale.setScalar(size);return s};
const pick=a=>a[Math.floor(rnd()*a.length)];

// ---------- 1. Sol : mousse bleu nuit, runes et poussière luminescente ----------
const floorTex=canvasTex(512,512,(g,w,h)=>{g.fillStyle='#141a33';g.fillRect(0,0,w,h);
 for(let i=0;i<1400;i++){const v=18+rnd()*28;g.fillStyle=`rgba(${v},${v+12},${v+40},.6)`;g.beginPath();g.arc(rnd()*w,rnd()*h,1+rnd()*5,0,7);g.fill()}
 for(let i=0;i<260;i++){const c=new THREE.Color(pick(RAINBOW));g.fillStyle=`rgba(${c.r*255|0},${c.g*255|0},${c.b*255|0},${.25+rnd()*.5})`;g.beginPath();g.arc(rnd()*w,rnd()*h,.8+rnd()*1.6,0,7);g.fill()}
 g.strokeStyle='rgba(160,140,255,.18)';g.lineWidth=2;for(let i=0;i<6;i++){const x=rnd()*w,y=rnd()*h,r=20+rnd()*30;g.beginPath();g.arc(x,y,r,0,7);g.stroke();g.beginPath();g.arc(x,y,r*.7,0,7);g.stroke();for(let k=0;k<6;k++){const a=k/6*6.3;g.beginPath();g.moveTo(x+Math.cos(a)*r*.7,y+Math.sin(a)*r*.7);g.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);g.stroke()}}});
floorTex.repeat.set(4,4*FZ/FX);
const floorGeo=new THREE.PlaneGeometry(FX*2,FZ*2,40,40);floorGeo.rotateX(-Math.PI/2);{const p=floorGeo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),d=outside(x,z);p.setY(i,d<.5?0:Math.sin(x*.8)*Math.cos(z*.6)*.15*Math.min(1,d-.5))}floorGeo.computeVertexNormals()}
add(floorGeo,mat(0xffffff,{map:floorTex,roughness:1}),root,false).position.y=.01;

// ---------- 2. Le damier : ardoise irisée, liseré lumineux à la couleur de la brume ----------
const slabTex=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#5a5f86';g.fillRect(0,0,w,h);for(let i=0;i<26;i++){g.fillStyle=`rgba(${120+rnd()*80},${110+rnd()*80},${190+rnd()*60},.18)`;g.beginPath();g.arc(rnd()*w,rnd()*h,6+rnd()*12,0,7);g.fill()}g.strokeStyle='rgba(190,170,255,.45)';g.lineWidth=3;g.strokeRect(2,2,w-4,h-4)});
const plinth=add(new THREE.BoxGeometry(BX*2,.5,BZ*2),mat(0x23243e));plinth.position.y=TOP-.31;
const slabs=new THREE.InstancedMesh(new THREE.BoxGeometry(.94,.1,.94).translate(0,-.05,0),mat(0xffffff,{map:slabTex,roughness:.45,metalness:.15}),8*rows);let si=0;
for(let y=0;y<rows;y++)for(let x=0;x<8;x++){dummy.position.set(cellX(x),TOP,cellZ(y));dummy.rotation.set(0,0,0);dummy.updateMatrix();slabs.setMatrixAt(si,dummy.matrix);slabs.setColorAt(si++,new THREE.Color((x+y)%2?0xe2dcff:0xc4ccf2))}
slabs.castShadow=false;slabs.receiveShadow=true;root.add(slabs);
const rimMat=new THREE.MeshBasicMaterial({color:MIST[''],transparent:true,opacity:.85});
for(const s of[-1,1]){const a=add(new THREE.BoxGeometry(BX*2+.1,.03,.05),rimMat,root,false);a.position.set(0,TOP-.04,s*(BZ+.02));const b=add(new THREE.BoxGeometry(.05,.03,BZ*2+.1),rimMat,root,false);b.position.set(s*(BX+.02),TOP-.04,0)}

// ---------- 3. Pierres runiques aux couleurs des éléments ----------
const lights=[];
function runestone(x,z,color){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rnd()*6;root.add(g);const st=add(new THREE.BoxGeometry(.32,.9,.18),mat(0x2c2f45,{roughness:.95}),g);st.position.y=.45;st.rotation.z=(rnd()-.5)*.12;
 const rune=add(new THREE.PlaneGeometry(.16,.4),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.95}),g,false);rune.position.set(0,.5,.092);const gl=glow(color,.9,.55);gl.position.set(0,.55,.2);g.add(gl);lights.push({gl,p:rnd()*6,base:.5})}
[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sz],i)=>runestone(sx*(BX+.45),sz*(BZ+.45),RAINBOW[i]));
runestone(-BX-.5,0,RAINBOW[4]);runestone(BX+.5,0,RAINBOW[5]);

// ---------- 4. Habitations magiques ----------
const wood=mat(0x3b2a3a),stone=mat(0x6a6b8e,{roughness:.9}),win=c=>new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:1.6});
function windows(g,r,y0,n,color,h=.16){for(let i=0;i<n;i++){const a=i/n*6.3+.4;const w=add(new THREE.CircleGeometry(.07,10),win(color),g,false);w.position.set(Math.cos(a)*r*1.01,y0+(i%2)*h,Math.sin(a)*r*1.01);w.lookAt(Math.cos(a)*r*3,y0+(i%2)*h,Math.sin(a)*r*3);const gl=glow(color,.45,.5);gl.position.copy(w.position);g.add(gl);lights.push({gl,p:rnd()*6,base:.45})}}
function wizardTower(x,z,s){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);root.add(g);let y=0,r=.55;for(let i=0;i<4;i++){const h=.75;const seg=add(new THREE.CylinderGeometry(r*.9,r,h,10),stone,g);seg.position.set(Math.sin(i*1.3)*.08,y+h/2,Math.cos(i*1.1)*.06);seg.rotation.z=(i%2?.06:-.05);windows(g,r*.92,y+.35,3,i%2?0xffc46b:0xb9a3ff);y+=h;r*=.86}
 const roof=add(new THREE.ConeGeometry(r*1.5,1.2,10,1,true),mat(0x5a3a8a,{side:THREE.DoubleSide}),g);roof.position.y=y+.55;roof.rotation.z=.12;
 const crystal=add(new THREE.OctahedronGeometry(.28,0),glowMat(0x8fe6ff,2),g,false);crystal.position.set(.1,y+1.45,0);crystal.scale.y=1.6;const cg=glow(0x8fe6ff,2.4,.7);cg.position.copy(crystal.position);g.add(cg);
 updates.push((t,l,mv)=>{crystal.rotation.y=mv?t*.8:0;crystal.position.y=y+1.45+(mv?Math.sin(t*1.6)*.08:0);cg.position.y=crystal.position.y;cg.material.opacity=.6+(mv?Math.sin(t*2.3)*.15:0)})}
function mushroomHouse(x,z,s,cap){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rnd()*6;g.scale.setScalar(s);root.add(g);const stem=add(new THREE.CylinderGeometry(.45,.55,1.1,12),mat(0xd9cdb8),g);stem.position.y=.55;
 const c=add(new THREE.SphereGeometry(1,16,10,0,6.3,0,1.45),mat(cap,{emissive:cap,emissiveIntensity:.35,roughness:.6}),g);c.position.y=1.05;c.scale.set(1,.65,1);
 for(let i=0;i<7;i++){const d=add(new THREE.SphereGeometry(.09,8,6),glowMat(0xfff4c8,1.2),g,false);const a=rnd()*6.3,r=.3+rnd()*.5;d.position.set(Math.cos(a)*r,1.05+Math.sqrt(Math.max(0,1-r*r))*.62,Math.sin(a)*r)}
 const door=add(new THREE.CircleGeometry(.2,12,0,Math.PI),mat(0x3b2a1e),g,false);door.position.set(0,.02,.551);windows(g,.47,.62,3,0xffd27a,.0)}
function cottage(x,z,s){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rnd()*6;g.scale.setScalar(s);root.add(g);const body=add(new THREE.BoxGeometry(1.2,.9,1),mat(0x5b4a6e),g);body.position.y=.45;
 for(const sx of[-.6,.6]){const beam=add(new THREE.BoxGeometry(.06,.92,1.02),wood,g,false);beam.position.set(sx,.46,0)}
 const roof=add(new THREE.ConeGeometry(1.05,1.4,4),mat(0x2f6b6a),g);roof.position.y=1.55;roof.rotation.y=Math.PI/4;
 const tip=add(new THREE.ConeGeometry(.2,.6,6),mat(0x2f6b6a),g);tip.position.set(.18,2.35,0);tip.rotation.z=-.6;
 const chimney=add(new THREE.BoxGeometry(.18,.5,.18),stone,g);chimney.position.set(-.35,1.6,.2);
 for(const wx of[-.3,.3]){const w=add(new THREE.PlaneGeometry(.22,.24),win(0xffb86b),g,false);w.position.set(wx,.5,.51);const gl=glow(0xffb86b,.6,.45);gl.position.set(wx,.5,.56);g.add(gl);lights.push({gl,p:rnd()*6,base:.45})}
 const smoke=[];for(let i=0;i<5;i++){const p=glow(0xc9b8ff,.5,.18);p.position.set(-.35,1.9,.2);g.add(p);smoke.push({p,o:i/5})}
 updates.push((t,l,mv)=>{for(const S of smoke){const k=((mv?t*.25:0)+S.o)%1;S.p.position.set(-.35+Math.sin(k*6+S.o*9)*.15,1.9+k*1.4,.2);S.p.scale.setScalar(.35+k*.6);S.p.material.opacity=.22*(1-k)}})}
wizardTower(-6.6,-HZ-1.6,1.15);mushroomHouse(6.4,-HZ-1.2,1.05,0xd85aa8);mushroomHouse(-7.4,HZ-1.4,.85,0x4fa8e8);cottage(7,HZ-2.4,1);mushroomHouse(6.6,.6,.7,0x8a5ae8);

// ---------- 5. Champignons géants bioluminescents, cristaux, arbres sombres ----------
function glowShroom(x,z,s,color){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);root.add(g);const st=add(new THREE.CylinderGeometry(.05,.08,.6,8),mat(0xcfc6e6),g,false);st.position.y=.3;st.rotation.z=(rnd()-.5)*.3;
 const cap=add(new THREE.SphereGeometry(.28,12,8,0,6.3,0,1.5),glowMat(color,.9),g,false);cap.position.y=.6;cap.scale.y=.55;const gl=glow(color,1.1,.4);gl.position.y=.55;g.add(gl);lights.push({gl,p:rnd()*6,base:.38})}
function crystals(x,z,color){const g=new THREE.Group();g.position.set(x,0,z);root.add(g);for(let i=0;i<4;i++){const c=add(new THREE.OctahedronGeometry(.12+rnd()*.1,0),glowMat(color,1.3),g,false);c.position.set((rnd()-.5)*.3,.15,(rnd()-.5)*.3);c.scale.y=2+rnd();c.rotation.set((rnd()-.5)*.6,rnd()*3,(rnd()-.5)*.6)}const gl=glow(color,1,.4);gl.position.y=.3;g.add(gl);lights.push({gl,p:rnd()*6,base:.38})}
const crownMats=[0x1e4a52,0x2a3a6a,0x3a2a5e].map(c=>mat(c,{flatShading:true,roughness:.9}));
function darkTree(x,z,s){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rnd()*6;g.scale.setScalar(s);root.add(g);const t=add(new THREE.CylinderGeometry(.1,.18,1.8,7),mat(0x2a2030),g);t.position.y=.9;for(let i=0;i<3;i++){const c=add(new THREE.IcosahedronGeometry(.8,1),pick(crownMats),g);c.position.set((rnd()-.5)*.6,2+i*.35,(rnd()-.5)*.6);c.scale.set(1,.7,1).multiplyScalar(1-i*.2)}
 for(let i=0;i<4;i++){const f=glow(pick(RAINBOW),.25,.8);f.position.set((rnd()-.5)*1.4,1.6+rnd()*1.1,(rnd()-.5)*1.4);g.add(f)}}
const taken=[[-6.6,-HZ-1.6],[6.4,-HZ-1.2],[-7.4,HZ-1.4],[7,HZ-2.4],[6.6,.6]];
const free=(x,z,d)=>!taken.some(p=>Math.hypot(p[0]-x,p[1]-z)<d);
for(let i=0;i<(software?8:14);i++){let x,z,k=0;do{x=(rnd()*2-1)*FX*.95;z=(rnd()*2-1)*FZ*.95;k++}while((outside(x,z)<1.6||!free(x,z,2)||(x>2&&z>HZ-1&&outside(x,z)<3.4))&&k<40);if(k>=40)continue;taken.push([x,z]);darkTree(x,z,.7+rnd()*.35)}
for(let i=0;i<(software?14:30);i++){let x,z,k=0;do{x=(rnd()*2-1)*FX*.92;z=(rnd()*2-1)*FZ*.92;k++}while((outside(x,z)<.7||!free(x,z,.9))&&k<40);if(k>=40)continue;taken.push([x,z]);if(rnd()<.6)glowShroom(x,z,.7+rnd()*1.1,pick(RAINBOW));else crystals(x,z,pick(RAINBOW))}

// ---------- 6. Ciel : grande lune et étoiles ----------
const moon=glow(0xe6e2ff,5,.85);moon.position.set(-4,7.5,-FZ-3);root.add(moon);const moonCore=glow(0xffffff,2.2,.95);moonCore.position.copy(moon.position);root.add(moonCore);
const starGeo=new THREE.BufferGeometry(),sp=[];for(let i=0;i<(software?80:220);i++)sp.push((rnd()*2-1)*FX*1.6,4+rnd()*6,-FZ-1-rnd()*6);starGeo.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));
root.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xdcd6ff,size:.06,transparent:true,opacity:.85,depthWrite:false})));

// ---------- 7. Brume multicolore (une partie suit l'élément favorisé) ----------
const mistTex=canvasTex(128,128,g=>{const r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba(255,255,255,.7)');r.addColorStop(.6,'rgba(255,255,255,.22)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,128,128)});
const followMat=new THREE.SpriteMaterial({map:mistTex,color:MIST[''],transparent:true,opacity:.34,depthWrite:false,blending:THREE.AdditiveBlending});
const puffs=[];for(let i=0;i<(software?16:36);i++){const follow=i%2===0,m=follow?followMat:new THREE.SpriteMaterial({map:mistTex,color:pick(RAINBOW),transparent:true,opacity:.18,depthWrite:false,blending:THREE.AdditiveBlending});const s=new THREE.Sprite(m);let x,z,k=0;do{x=(rnd()*2-1)*FX;z=(rnd()*2-1)*FZ;k++}while(outside(x,z)<.2&&k<20);s.position.set(x,.3+rnd()*.35,z);const sc=2.6+rnd()*2.8;s.scale.set(sc,sc*.45,1);root.add(s);puffs.push({s,x,z,p:rnd()*6,v:.12+rnd()*.18})}
const ringTex=canvasTex(256,256,g=>{const r=g.createRadialGradient(128,128,60,128,128,128);r.addColorStop(0,'rgba(255,255,255,0)');r.addColorStop(.55,'rgba(255,255,255,.5)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,256,256)});
const ring=add(new THREE.PlaneGeometry(BX*2+3.4,BZ*2+3.4),new THREE.MeshBasicMaterial({map:ringTex,color:MIST[''],transparent:true,opacity:.6,depthWrite:false,blending:THREE.AdditiveBlending}),root,false);ring.rotation.x=-Math.PI/2;ring.position.y=.05;

// ---------- 8. Pixies : petites billes de lumière de toutes les couleurs qui se baladent ----------
const pixies=[];const PX=software?14:32;
for(let i=0;i<PX;i++){const c=new THREE.Color(RAINBOW[i%RAINBOW.length]);const core=glow(0xffffff,.12,1),halo=glow(c,.6,.9),trail=[glow(c,.36,.4),glow(c,.24,.22)];root.add(halo);root.add(core);trail.forEach(t=>root.add(t));
 pixies.push({halo,core,trail,cx:(rnd()*2-1)*FX*.75,cz:(rnd()*2-1)*FZ*.75,ax:1.2+rnd()*2.4,az:1+rnd()*2.2,h:.5+rnd()*1.8,f1:.12+rnd()*.18,f2:.07+rnd()*.12,p:rnd()*20})}
const pixiePos=(P,T)=>[P.cx+Math.sin(T*P.f1+P.p)*P.ax+Math.sin(T*P.f2*2.3+P.p*1.7)*P.ax*.4,P.h+Math.sin(T*1.7+P.p)*.22+Math.sin(T*.6+P.p)*.3,P.cz+Math.cos(T*P.f2+P.p*1.3)*P.az+Math.sin(T*P.f1*1.9+P.p)*P.az*.35];
const FF=software?30:80,ffGeo=new THREE.BufferGeometry(),ffPos=new Float32Array(FF*3),ffCol=new Float32Array(FF*3),ffData=[];
for(let i=0;i<FF;i++){const c=new THREE.Color(pick(RAINBOW));ffCol.set([c.r,c.g,c.b],i*3);ffData.push({x:(rnd()*2-1)*FX,z:(rnd()*2-1)*FZ,y:.2+rnd()*1.5,p:rnd()*6})}
ffGeo.setAttribute('position',new THREE.BufferAttribute(ffPos,3));ffGeo.setAttribute('color',new THREE.BufferAttribute(ffCol,3));
const fireflies=new THREE.Points(ffGeo,new THREE.PointsMaterial({size:.07,vertexColors:true,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending}));root.add(fireflies);

let lastT=0,mistTarget=new THREE.Color(MIST['']);
updates.push((t,l,moving)=>{const dt=Math.min(.1,Math.max(0,t-lastT));lastT=t;const T=moving?t:0;
 for(const P of pixies){const [x,y,z]=pixiePos(P,T);P.halo.position.set(x,y,z);P.core.position.set(x,y,z);P.trail.forEach((tr,k)=>{const q=pixiePos(P,T-.18*(k+1));tr.position.set(q[0],q[1],q[2])});P.halo.material.opacity=.7+(moving?Math.sin(T*7+P.p)*.2:0)}
 for(let i=0;i<FF;i++){const f=ffData[i];ffPos[i*3]=f.x+Math.sin(T*.5+f.p)*.4;ffPos[i*3+1]=f.y+Math.sin(T*1.3+f.p)*.15;ffPos[i*3+2]=f.z+Math.cos(T*.4+f.p)*.4}ffGeo.attributes.position.needsUpdate=true;fireflies.material.opacity=.6+(moving?Math.sin(T*2)*.25:0);
 followMat.color.lerp(mistTarget,Math.min(1,dt*1.5+(moving?0:1)));ring.material.color.copy(followMat.color);rimMat.color.copy(followMat.color);
 for(const M of puffs){M.s.position.x=M.x+Math.sin(T*M.v+M.p)*.9;M.s.position.z=M.z+Math.cos(T*M.v*.7+M.p)*.6}
 ring.material.opacity=.5+(moving?Math.sin(T*.9)*.1:0);
 for(const L of lights)L.gl.material.opacity=L.base+(moving?Math.sin(t*2.2+L.p)*.1:0)});

// ---------- 9. Promeneurs : Pachié, Bulbalina et Max des Brumes ----------
const LX=5.3,LZ0=-(BZ+.95),LZ1=BZ+.85,loop=[[-LX,LZ0],[LX,LZ0],[LX,LZ1],[-LX,LZ1]],segLen=loop.map((p,i)=>{const q=loop[(i+1)%4];return Math.hypot(q[0]-p[0],q[1]-p[1])}),total=segLen.reduce((a,b)=>a+b,0);
function onLoop(d){d=((d%total)+total)%total;let i=0;while(d>segLen[i]){d-=segLen[i];i++}const p=loop[i],q=loop[(i+1)%4],k=d/segLen[i];return{x:p[0]+(q[0]-p[0])*k,z:p[1]+(q[1]-p[1])*k,yaw:Math.atan2(q[0]-p[0],q[1]-p[1])}}
const walkers=[];let lastW=0;
if(!software&&helpers.spawnWalker){[['pachie',1,.2,0],['bulbalina',-1,.22,.4],['max',1,.25,.72]].forEach(([key,dir,speed,start],n)=>setTimeout(()=>helpers.spawnWalker(key,.9).then(w=>{if(!w)return;root.add(w.group);walkers.push({w,dir,speed,d:start*total,yaw:0})}),700+n*900))}
updates.push((t,l,moving)=>{const dt=Math.min(.1,Math.max(0,t-lastW));lastW=t;for(const W of walkers){if(moving)W.d+=W.dir*W.speed*dt;const p=onLoop(W.d),yaw=p.yaw+(W.dir<0?Math.PI:0);let dy=yaw-W.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));W.yaw+=dy*Math.min(1,dt*6+(moving?0:1));W.w.group.position.set(p.x,.03,p.z);W.w.group.rotation.y=W.yaw;if(moving)W.w.update(dt)}});
function setMist(el){mistTarget=new THREE.Color(MIST[el]??MIST[''])}
return{root,setMist,update(t,light,moving){for(const u of updates)u(t,light,moving)}};
}
