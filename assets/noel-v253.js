/* v253 — Terrain événement « La nuit des Lumières » (Noël) : premier terrain événement d'Hackénia.
   Une place de marbre givré bordée de neige et de sucres d'orge, sous une aurore boréale.
   Au fond, un sapin géant décoré (boules, guirlande qui scintille, étoile d'or), une montagne de cadeaux, des chalets enneigés
   aux fenêtres chaudes, et trois autels des éléments favorisés : un brasero (Feu), un obélisque de givre (Glace)
   et une sphère d'orage (Foudre). Neige qui tombe, feux d'artifice, traîneau qui traverse le ciel.
   Foudre, Glace et Feu y sont favorisés (règles : moteur du jeu). Coordonnées réelles des cases (root.scale.z = 1/ZS). */
import * as THREE from 'three';
export function createNoel(world,software=false,rows=10,helpers={}){
const root=new THREE.Group();world.add(root);root.visible=false;
let seed=2512;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const HZ=rows/2,BX=4.3,BZ=HZ+.3,TOP=.2,FX=10,FZ=HZ+4.6;
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.85,...extra});
const add=(geo,material,parent=root,shadow=!software)=>{const m=new THREE.Mesh(geo,material);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m};
const canvasTex=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t};
const updates=[],cellX=x=>x-3.5,cellZ=y=>y-(rows-1)/2,outside=(x,z)=>Math.max(Math.abs(x)-BX,Math.abs(z)-BZ),dummy=new THREE.Object3D();
const dotTex=canvasTex(32,32,g=>{const r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.4,'rgba(255,255,255,.5)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,32,32)});
const glow=(color,size,op=.8)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color,transparent:true,opacity:op,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));s.scale.setScalar(size);return s};
let lastT=0,dt=0;updates.push(t=>{dt=Math.min(.1,Math.max(0,t-lastT));lastT=t});

// ---------- 1. Sol enneigé qui scintille ----------
const snowTex=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#e9f1fb';g.fillRect(0,0,w,h);for(let i=0;i<500;i++){const v=215+rnd()*40;g.fillStyle=`rgba(${v-20},${v-8},${v},.5)`;g.beginPath();g.arc(rnd()*w,rnd()*h,1+rnd()*5,0,7);g.fill()}for(let i=0;i<140;i++){g.fillStyle='rgba(255,255,255,.95)';g.fillRect(rnd()*w,rnd()*h,1.5,1.5)}});snowTex.repeat.set(6,6*FZ/FX);
const groundGeo=new THREE.PlaneGeometry(FX*2,FZ*2,50,50);groundGeo.rotateX(-Math.PI/2);{const p=groundGeo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),d=outside(x,z);p.setY(i,d<.5?.02:.02+Math.min(.9,(d-.5)*.09)+Math.max(0,Math.sin(x*1.3+z)*Math.cos(z*.9))*.18*Math.min(1,d-.5))}groundGeo.computeVertexNormals()}
add(groundGeo,mat(0xb9c9e6,{map:snowTex,roughness:.7}),root,false);
const sparkle=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(Array.from({length:software?150:420},()=>{let x,z;do{x=(rnd()*2-1)*FX;z=(rnd()*2-1)*FZ}while(outside(x,z)<.5);return[x,.08+Math.min(.9,(outside(x,z)-.5)*.09),z]}).flat(),3)),new THREE.PointsMaterial({map:dotTex,color:0xdff2ff,size:.09,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));root.add(sparkle);

// ---------- 2. Le damier : marbre givré, liseré d'or ----------
const slabTex=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#e8eef7';g.fillRect(0,0,w,h);g.strokeStyle='rgba(150,175,210,.45)';for(let i=0;i<6;i++){g.lineWidth=.5+rnd()*1.5;g.beginPath();let x=rnd()*w,y=0;g.moveTo(x,y);while(y<h){x+=(rnd()-.5)*24;y+=10+rnd()*14;g.lineTo(x,y)}g.stroke()}g.strokeStyle='#c9a24a';g.lineWidth=4;g.strokeRect(3,3,w-6,h-6);g.strokeStyle='rgba(255,255,255,.8)';g.lineWidth=1;g.strokeRect(7,7,w-14,h-14)});
const plinth=add(new THREE.BoxGeometry(BX*2,.5,BZ*2),mat(0x8fa3bd,{roughness:.5}));plinth.position.y=TOP-.31;
const slabs=new THREE.InstancedMesh(new THREE.BoxGeometry(.94,.1,.94).translate(0,-.05,0),mat(0xffffff,{map:slabTex,roughness:.35,metalness:.05}),8*rows);let si=0;
for(let y=0;y<rows;y++)for(let x=0;x<8;x++){dummy.position.set(cellX(x),TOP,cellZ(y));dummy.rotation.set(0,0,0);dummy.updateMatrix();slabs.setMatrixAt(si,dummy.matrix);slabs.setColorAt(si++,new THREE.Color((x+y)%2?0xffffff:0xd9e5f4))}
slabs.castShadow=false;slabs.receiveShadow=true;root.add(slabs);
// bourrelets de neige et corde dorée sur le pourtour
const bankMat=mat(0xf6faff,{roughness:.6});
for(const s of[-1,1]){const a=add(new THREE.CapsuleGeometry(.17,BX*2,4,10),bankMat);a.rotation.z=Math.PI/2;a.position.set(0,TOP-.04,s*(BZ+.06));a.scale.y=.75;const b=add(new THREE.CapsuleGeometry(.17,BZ*2,4,10),bankMat);b.rotation.x=Math.PI/2;b.position.set(s*(BX+.06),TOP-.04,0);b.scale.x=.75}
const goldMat=mat(0xe2b64a,{metalness:.8,roughness:.3,emissive:0x3a2600,emissiveIntensity:.4});
// sucres d'orge aux coins et le long des bords
const caneTex=canvasTex(64,256,(g,w,h)=>{g.fillStyle='#fff';g.fillRect(0,0,w,h);g.fillStyle='#d61f2c';for(let y=-64;y<h+64;y+=36){g.beginPath();g.moveTo(0,y);g.lineTo(w,y+40);g.lineTo(w,y+56);g.lineTo(0,y+16);g.fill()}});
const caneMat=mat(0xffffff,{map:caneTex,roughness:.35});
function cane(x,z,ry,s=1){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;g.scale.setScalar(s);root.add(g);const st=add(new THREE.CylinderGeometry(.06,.06,1.1,10),caneMat,g);st.position.y=.55;const hook=add(new THREE.TorusGeometry(.17,.06,8,14,Math.PI),caneMat,g);hook.position.set(.17,1.1,0);return g}
for(const [sx,sz] of[[-1,-1],[1,-1],[-1,1],[1,1]])cane(sx*(BX+.3),sz*(BZ+.3),sx<0?Math.PI:0,1.1);
for(const s of[-1,1])for(const z of[-HZ*.5,HZ*.5])cane(s*(BX+.35),z,s<0?Math.PI:0,.7);

// guirlandes lumineuses tendues entre les sucres d'orge, le long des deux grands côtés
const edgeBulbs=[];for(const s of[-1,1]){for(let i=0;i<=(software?10:22);i++){const k=i/(software?10:22),z=-BZ-.3+k*(2*BZ+.6),g=glow([0xffd36a,0xff5a5a,0x7fd0ff,0x9dff9d][i%4],.26,.9);g.position.set(s*(BX+.33),.95-Math.sin(k*Math.PI*4)**2*.25,z);root.add(g);edgeBulbs.push({g,p:i*.7})}}
updates.push((t,l,moving)=>{for(const b of edgeBulbs)b.g.material.opacity=moving?(Math.sin(t*2.5+b.p)>-.2?.95:.3):.8});
// ---------- 3. Le grand sapin, l'étoile, la guirlande ----------
const tree=new THREE.Group();tree.position.set(-BX-3.6,0,.8);tree.scale.setScalar(1.2);root.add(tree);// à gauche du damier : bien visible à l'écran
const needle=mat(0x1f5a3a,{flatShading:true,roughness:.9}),needle2=mat(0x174a30,{flatShading:true}),snowCap=mat(0xffffff,{flatShading:true,roughness:.6});
add(new THREE.CylinderGeometry(.22,.3,1,8),mat(0x5a3820),tree).position.y=.5;
const tiers=[[2.3,1.9,1],[1.95,1.75,2.1],[1.55,1.6,3.1],[1.15,1.45,4],[.75,1.3,4.85]];
tiers.forEach(([r,h,y],i)=>{const c=add(new THREE.ConeGeometry(r,h,10,1),i%2?needle2:needle,tree);c.position.y=y;const sc=add(new THREE.ConeGeometry(r*.98,h*.18,10,1,true),snowCap,tree,false);sc.position.y=y-h*.38;sc.scale.set(1.02,1,1.02)});
const baubleCols=[0xd6202c,0xe2b64a,0x2e6fe0,0xd6202c,0xc8d8ff,0x8a2be2];const baubles=[];
for(let i=0;i<(software?26:46);i++){const y=1+rnd()*4.1,rr=2.3*(1-(y-.6)/5.4)*.98+.05,a=rnd()*6.3;const col=baubleCols[i%baubleCols.length];const b=add(new THREE.SphereGeometry(.11+rnd()*.05,12,10),new THREE.MeshStandardMaterial({color:col,metalness:.7,roughness:.18,emissive:col,emissiveIntensity:.18}),tree,false);b.position.set(Math.cos(a)*rr,y,Math.sin(a)*rr);baubles.push(b)}
// guirlande lumineuse en spirale
const bulbs=[];const garCols=[0xffd36a,0xff5a5a,0x7fd0ff,0x9dff9d];for(let i=0;i<(software?40:110);i++){const k=i/(software?40:110),y=.9+k*4.4,rr=2.25*(1-(y-.6)/5.4)+.08,a=k*6.3*5;const g=glow(garCols[i%4],.32,.9);g.position.set(Math.cos(a)*rr,y,Math.sin(a)*rr);tree.add(g);bulbs.push({g,p:rnd()*6,s:.26+rnd()*.1})}
// étoile d'or
const starShape=new THREE.Shape();for(let i=0;i<=10;i++){const a=Math.PI/2+i/10*Math.PI*2,r=i%2?.2:.48;i?starShape.lineTo(Math.cos(a)*r,Math.sin(a)*r):starShape.moveTo(Math.cos(a)*r,Math.sin(a)*r)}
const star=add(new THREE.ExtrudeGeometry(starShape,{depth:.12,bevelEnabled:true,bevelSize:.03,bevelThickness:.03,bevelSegments:1}).center(),new THREE.MeshStandardMaterial({color:0xffe08a,emissive:0xffc43a,emissiveIntensity:1.6,metalness:.6,roughness:.25}),tree,false);star.position.y=5.85;
const starGlow=glow(0xffe7a0,2.6,.85);starGlow.position.y=5.85;tree.add(starGlow);const starHalo=glow(0xfff2c8,5.5,.25);starHalo.position.y=5.85;tree.add(starHalo);
const starLight=new THREE.PointLight(0xffd27a,software?0:14,9,1.6);starLight.position.y=5.6;tree.add(starLight);
updates.push((t,l,moving)=>{const T=moving?t:0;star.rotation.y=T*.8;starGlow.material.opacity=.75+Math.sin(T*2.4)*.15;starHalo.scale.setScalar(5.3+Math.sin(T*1.3)*.5);for(const b of bulbs){const k=moving?(Math.sin(t*3+b.p)>.2?1:.35):.8;b.g.material.opacity=.95*k;b.g.scale.setScalar(b.s*(.8+.4*k))}});
// montagne de cadeaux au pied du sapin
const ribbon=['#e2b64a','#ffffff','#d6202c','#2e8b57'],papers=['#d6202c','#2e6fe0','#1f8a4c','#8a2be2','#e2b64a','#f2f2f2','#ff7a2e'];
function gift(x,z,s,ry,parent=root){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;parent.add(g);const w=s*(.8+rnd()*.5),h=s*(.6+rnd()*.6),d=s*(.8+rnd()*.5);const pc=papers[Math.floor(rnd()*papers.length)],rc=ribbon[Math.floor(rnd()*ribbon.length)];
 add(new THREE.BoxGeometry(w,h,d),mat(pc,{roughness:.5}),g).position.y=h/2;const rm=mat(rc,{roughness:.35,metalness:.3});add(new THREE.BoxGeometry(w+.01,h+.01,d*.16),rm,g,false).position.y=h/2;add(new THREE.BoxGeometry(w*.16,h+.01,d+.01),rm,g,false).position.y=h/2;
 for(const s2 of[-1,1]){const bow=add(new THREE.TorusGeometry(s*.13,s*.04,6,10),rm,g,false);bow.position.set(s2*s*.1,h+s*.08,0);bow.rotation.set(0,Math.PI/2,s2*.5)}return g}
for(let i=0;i<(software?8:16);i++){const a=rnd()*6.3,r=3+rnd()*.9;gift(tree.position.x+Math.cos(a)*r,tree.position.z+Math.sin(a)*r,.32+rnd()*.25,rnd()*6)}

// ---------- 4. Chalets enneigés aux fenêtres chaudes ----------
const wallCols=[0x7a4a2c,0x8c5a34,0x6a3f26],warm=new THREE.MeshStandardMaterial({color:0xffcf7a,emissive:0xffa040,emissiveIntensity:1.3});
function chalet(x,z,w,d,h,ry){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;root.add(g);add(new THREE.BoxGeometry(w,h,d),mat(wallCols[Math.floor(rnd()*3)]),g).position.y=h/2;
 const roof=new THREE.Shape();roof.moveTo(-w/2-.18,0);roof.lineTo(0,h*.75);roof.lineTo(w/2+.18,0);roof.lineTo(-w/2-.18,0);const rg=new THREE.ExtrudeGeometry(roof,{depth:d+.3,bevelEnabled:false});rg.translate(0,0,-(d+.3)/2);const r=add(rg,mat(0xffffff,{roughness:.6}),g);r.position.y=h;
 for(const side of[-1,1]){const n=Math.max(1,Math.round(w/.7));for(let i=0;i<n;i++){const win=add(new THREE.BoxGeometry(.24,.28,.03),warm,g,false);win.position.set(-w/2+(i+.5)*w/n,h*.55,side*(d/2+.01))}}
 const ch=add(new THREE.BoxGeometry(.2,.5,.2),mat(0x6b6460),g);ch.position.set(w*.25,h+h*.5,0);const sm=glow(0xbfc7d6,.5,.25);sm.position.set(w*.25,h+h*.5+.5,0);g.add(sm);smokes.push({sm,p:rnd()*6,base:sm.position.y});
 const wl=glow(0xffb45a,1.4,.22);wl.position.set(0,h*.5,d/2+.3);g.add(wl);return g}
const smokes=[];
chalet(BX+3.1,-HZ+.6,1.9,1.5,1.2,-.2);chalet(BX+3.4,-HZ+3.4,1.6,1.4,1,-.1);chalet(-BX-3.4,-HZ+.6,1.8,1.5,1.15,.2);chalet(-BX-3.1,HZ+.9,1.6,1.3,1,.15);chalet(-1.2,-BZ-2.4,1.8,1.4,1.1,0);chalet(2.2,-BZ-2.6,1.6,1.3,1,-.1);chalet(5.6,-BZ-2.2,1.5,1.3,1,-.3);
updates.push((t,l,moving)=>{for(const s of smokes){const k=moving?((t*.25+s.p)%1):.3;s.sm.position.y=s.base+k*1.2;s.sm.material.opacity=.3*(1-k);s.sm.scale.setScalar(.4+k*.8)}});
// sapins enneigés en bordure
const pineMat=mat(0x24563c,{flatShading:true});for(let i=0;i<(software?18:34);i++){let x,z,k=0;do{x=(rnd()*2-1)*FX*.95;z=(rnd()*2-1)*FZ*.95;k++}while((outside(x,z)<1.6||(x>1.5&&z>HZ&&outside(x,z)<3.5)||Math.hypot(x-tree.position.x,z-tree.position.z)<4.1)&&k<40);if(k>=40)continue;const s=.5+rnd()*.5,g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);root.add(g);add(new THREE.CylinderGeometry(.08,.1,.4,6),mat(0x5a3820),g).position.y=.2;for(let j=0;j<3;j++){add(new THREE.ConeGeometry(.75-j*.2,.8,8),pineMat,g).position.y=.6+j*.45;const cap=add(new THREE.ConeGeometry(.5-j*.15,.28,8),snowCap,g,false);cap.position.y=.82+j*.45}}

// ---------- 5. Les trois autels : Feu, Glace, Foudre ----------
const altarStone=mat(0x9aa7b8,{roughness:.6});
function altar(x,z){const g=new THREE.Group();g.position.set(x,0,z);root.add(g);add(new THREE.CylinderGeometry(.42,.52,.35,8),altarStone,g).position.y=.17;const ring=add(new THREE.TorusGeometry(.43,.035,6,24),goldMat,g,false);ring.rotation.x=Math.PI/2;ring.position.y=.36;return g}
// Feu : brasero
const fire=altar(BX+1.6,HZ*.15);add(new THREE.CylinderGeometry(.3,.18,.3,10,1,true),mat(0x3a3330,{side:THREE.DoubleSide,metalness:.6}),fire).position.y=.5;
const flames=[];for(let i=0;i<(software?5:12);i++){const f=glow(i%3?0xff7a2e:0xffd24a,.5,.9);fire.add(f);flames.push({f,p:rnd()*6,r:rnd()*.12})}const fireLight=new THREE.PointLight(0xff8a3a,software?0:6,4,1.8);fireLight.position.y=1;fire.add(fireLight);
// Glace : obélisque de givre
const ice=altar(-BX-1.5,-HZ*.45);const crystal=add(new THREE.OctahedronGeometry(.32,0),new THREE.MeshStandardMaterial({color:0xbfeaff,emissive:0x5fb8ff,emissiveIntensity:.8,metalness:.1,roughness:.05,transparent:true,opacity:.88}),ice,false);crystal.scale.set(.7,2.2,.7);crystal.position.y=1.05;
for(let i=0;i<5;i++){const c=add(new THREE.OctahedronGeometry(.12,0),crystal.material,ice,false);const a=i/5*6.3;c.position.set(Math.cos(a)*.3,.5,Math.sin(a)*.3);c.scale.set(.6,1.8,.6);c.rotation.z=(rnd()-.5)*.6}
const iceGlow=glow(0x8fd8ff,1.8,.45);iceGlow.position.y=1.05;ice.add(iceGlow);
// Foudre : sphère d'orage
const storm=altar(BX+1.7,-HZ*.55);const orb=add(new THREE.SphereGeometry(.3,18,14),new THREE.MeshStandardMaterial({color:0x9c7cff,emissive:0x7a4dff,emissiveIntensity:1,transparent:true,opacity:.6,roughness:.1}),storm,false);orb.position.y=1;const orbGlow=glow(0xb79cff,1.6,.6);orbGlow.position.y=1;storm.add(orbGlow);
const arcs=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xe6dcff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));arcs.position.y=1;storm.add(arcs);let arcT=-1;
updates.push((t,l,moving)=>{const T=moving?t:0;
 flames.forEach((F,i)=>{const k=moving?((t*1.4+F.p)%1):.4;F.f.position.set(Math.cos(F.p*5+T)*F.r,.6+k*.75,Math.sin(F.p*5+T)*F.r);F.f.material.opacity=.9*(1-k);F.f.scale.setScalar(.55*(1-k*.6))});fireLight.intensity=software?0:5+(moving?Math.sin(t*13)*1.2+Math.sin(t*7.3)*.8:0);
 crystal.rotation.y=T*.5;crystal.position.y=1.05+Math.sin(T*1.2)*.05;iceGlow.material.opacity=.38+Math.sin(T*1.7)*.08;
 orb.rotation.y=T;orbGlow.material.opacity=.5+(moving?Math.random()*.25:0);
 if(moving&&t-arcT>.09){arcT=t;const pts=[];for(let i=0;i<5;i++){let a=new THREE.Vector3();const dir=new THREE.Vector3(rnd()-.5,rnd()-.5,rnd()-.5).normalize();for(let j=1;j<=4;j++){const b=dir.clone().multiplyScalar(j*.13).add(new THREE.Vector3((rnd()-.5)*.08,(rnd()-.5)*.08,(rnd()-.5)*.08));pts.push(a,b);a=b}}arcs.geometry.dispose();arcs.geometry=new THREE.BufferGeometry().setFromPoints(pts)}arcs.visible=moving});

// ---------- 6. Aurore boréale ----------
const auroraTex=canvasTex(256,64,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(140,255,200,0)');gr.addColorStop(.55,'rgba(120,255,190,.55)');gr.addColorStop(.8,'rgba(170,120,255,.4)');gr.addColorStop(1,'rgba(170,120,255,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);for(let x=0;x<w;x+=3){g.fillStyle=`rgba(255,255,255,${rnd()*.12})`;g.fillRect(x,0,1,h)}});
const auroras=[];for(let i=0;i<3;i++){const geo=new THREE.PlaneGeometry(22,4.5,48,1);const m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:auroraTex,transparent:true,opacity:.5,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));if(i<2){m.position.set(1+i*3,3.6+i*.9,-FZ-.6-i*.8);m.rotation.y=.12}else{m.position.set(-FX-.6,4.2,-2);m.rotation.y=Math.PI/2-.1}root.add(m);auroras.push({m,base:geo.attributes.position.array.slice(),p:i*2.1})}
updates.push((t,l,moving)=>{if(!moving)return;for(const A of auroras){const p=A.m.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=A.base[i*3];p.setZ(i,Math.sin(x*.35+t*.4+A.p)*1.2);p.setY(i,A.base[i*3+1]+Math.sin(x*.5+t*.6+A.p)*.35)}p.needsUpdate=true;A.m.material.opacity=.38+Math.sin(t*.5+A.p)*.12}});

// ---------- 7. Neige qui tombe ----------
const NS=software?120:420,snowPos=new Float32Array(NS*3),snowV=[];for(let i=0;i<NS;i++){snowPos.set([(rnd()*2-1)*FX,rnd()*9,(rnd()*2-1)*FZ],i*3);snowV.push(.35+rnd()*.4)}
const snow=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(snowPos,3)),new THREE.PointsMaterial({map:dotTex,color:0xffffff,size:.13,transparent:true,depthWrite:false,opacity:.95}));root.add(snow);
updates.push((t,l,moving)=>{if(!moving)return;for(let i=0;i<NS;i++){let y=snowPos[i*3+1]-snowV[i]*dt;if(y<0){y=9;snowPos[i*3]=(rnd()*2-1)*FX;snowPos[i*3+2]=(rnd()*2-1)*FZ}snowPos[i*3+1]=y;snowPos[i*3]+=Math.sin(t+i)*dt*.15}snow.geometry.attributes.position.needsUpdate=true});

// ---------- 8. Feux d'artifice ----------
const fireworks=[];const FWC=[0xff5a5a,0xffd36a,0x7fd0ff,0x9dff9d,0xd59bff,0xffffff];
function burst(){const side=rnd()<.6,x=side?(rnd()*2-1)*6+2:-FX+rnd()*2,y=4.5+rnd()*2.5,z=side?-FZ+rnd()*2:(rnd()*2-1)*5,col=FWC[Math.floor(rnd()*FWC.length)],n=software?10:26,parts=[];for(let i=0;i<n;i++){const s=glow(col,.28,1);s.position.set(x,y,z);root.add(s);const a=rnd()*6.3,b=Math.acos(2*rnd()-1);parts.push({s,v:new THREE.Vector3(Math.sin(b)*Math.cos(a),Math.cos(b),Math.sin(b)*Math.sin(a)).multiplyScalar(1.6+rnd()*.6)})}const flash=glow(col,3,.6);flash.position.set(x,y,z);root.add(flash);fireworks.push({parts,flash,age:0})}
let nextBurst=2;
updates.push((t,l,moving)=>{if(moving&&t>nextBurst){nextBurst=t+1.6+rnd()*3.2;burst()}for(let i=fireworks.length-1;i>=0;i--){const F=fireworks[i];F.age+=dt;const k=F.age/1.8;F.flash.material.opacity=Math.max(0,.6-k*3);for(const P of F.parts){P.s.position.addScaledVector(P.v,dt*(1-k*.6));P.s.position.y-=dt*k*.8;P.s.material.opacity=Math.max(0,1-k)}if(k>=1){for(const P of F.parts){root.remove(P.s);P.s.material.dispose()}root.remove(F.flash);F.flash.material.dispose();fireworks.splice(i,1)}}});

// ---------- 9. Le traîneau qui traverse le ciel ----------
const sleigh=new THREE.Group();root.add(sleigh);const red=mat(0xb01a24,{metalness:.3,roughness:.4});
add(new THREE.BoxGeometry(.7,.28,.38),red,sleigh,false).position.y=.2;const back=add(new THREE.BoxGeometry(.12,.35,.38),red,sleigh,false);back.position.set(-.32,.42,0);
for(const s of[-1,1]){const run=add(new THREE.TorusGeometry(.4,.025,6,16,Math.PI*.6),goldMat,sleigh,false);run.position.set(0,.05,s*.17);run.rotation.z=Math.PI*.7}
add(new THREE.SphereGeometry(.18,10,8),mat(0x7a1520),sleigh,false).position.set(-.05,.45,0);
const deerMat=mat(0x8a5a32);for(let i=0;i<2;i++){const d=new THREE.Group();d.position.set(.75+i*.5,.25,0);sleigh.add(d);add(new THREE.BoxGeometry(.38,.15,.14),deerMat,d,false);const head=add(new THREE.BoxGeometry(.12,.12,.1),deerMat,d,false);head.position.set(.22,.14,0);for(const s of[-1,1]){const leg=add(new THREE.BoxGeometry(.03,.18,.03),deerMat,d,false);leg.position.set(s*.13,-.14,0)}if(i===1){const nose=glow(0xff3030,.25,1);nose.position.set(.3,.15,0);d.add(nose)}}
const trail=[];for(let i=0;i<14;i++){const s=glow(0xffe7a0,.25-i*.012,.8-i*.05);root.add(s);trail.push(s)}
updates.push((t,l,moving)=>{const T=moving?t:0,k=((T*.06)%1),on=moving&&k<.55,u=k/.55;sleigh.visible=on;trail.forEach(s=>s.visible=on);if(!on)return;const x=-14+u*28,y=5.2+Math.sin(u*Math.PI)*1.2,z=-FZ+.4;sleigh.position.set(x,y,z);sleigh.rotation.z=Math.cos(u*Math.PI)*.12;trail.forEach((s,i)=>{const uu=Math.max(0,u-(i+1)*.012);s.position.set(-14+uu*28-.4,5.3+Math.sin(uu*Math.PI)*1.2,z)})});

// ---------- 10. Bonshommes de neige près du damier ----------
function snowman(x,z,ry){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;root.add(g);const sm=mat(0xffffff,{roughness:.55});add(new THREE.SphereGeometry(.3,14,12),sm,g).position.y=.28;add(new THREE.SphereGeometry(.22,14,12),sm,g).position.y=.7;add(new THREE.SphereGeometry(.15,14,12),sm,g).position.y=1.02;const nose=add(new THREE.ConeGeometry(.03,.16,8),mat(0xff7a1e),g,false);nose.position.set(0,1.02,.17);nose.rotation.x=Math.PI/2;for(const s of[-1,1]){const e=add(new THREE.SphereGeometry(.022,6,4),mat(0x111111),g,false);e.position.set(s*.05,1.07,.13)}const hat=add(new THREE.CylinderGeometry(.12,.12,.18,12),mat(0x1a1a1a),g,false);hat.position.y=1.22;add(new THREE.CylinderGeometry(.19,.19,.02,14),mat(0x1a1a1a),g,false).position.y=1.13;const scarf=add(new THREE.TorusGeometry(.15,.04,6,14),mat(0xd6202c),g,false);scarf.rotation.x=Math.PI/2;scarf.position.y=.87}
snowman(-BX-1.1,-HZ*.75,.6);snowman(BX+1.2,HZ+.6,-.5);
return{root,update(t,light,moving){for(const u of updates)u(t,light,moving)}};
}
