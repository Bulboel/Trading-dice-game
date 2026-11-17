/* v364 — Terrain neutre « Le Colisée » : une arène antique sous le soleil.
   Arène de sable ratissé, plateau de marbre bordé d'une frise à grecques, mur du podium peint de panneaux pompéiens et rythmé de pilastres,
   deux grandes portes (une derrière chaque camp) avec herses, gradins en cuneï séparés par des escaliers, vomitoires, loge impériale à baldaquin
   pourpre, tribune d'honneur, façade extérieure à trois étages d'arcades (en ruine aux deux bouts, là où se place la caméra : la vue sur le plateau reste dégagée),
   mâts à oriflammes, braseros, statues de bronze, pigeons.
   La foule : chaque moitié des gradins soutient un camp (fanions aux couleurs des camps). À chaque lancer de dé, elle réagit :
   lancer réussi → les partisans du lanceur l'acclament (bonds, bras levés, pétales lancés dans l'arène) et les autres le huent (pouces baissés) ;
   lancer raté → ses partisans se prennent la tête et les autres le huent ; tous les dés identiques → ovation générale. De temps en temps, une ola.
   Les gradins montent moins vite (≈35°) que la caméra ne plonge (≈40°) : ils ne cachent jamais le plateau, quel que soit l'angle de vue.
   Coordonnées réelles des cases (root.scale.z = 1/ZS appliqué par clearing-v105.js). Aucun élément n'est favorisé (règles : moteur du jeu). */
import * as THREE from 'three';
export function createColosseum(world,software=false,rows=10){
const root=new THREE.Group();world.add(root);root.visible=false;
let seed=4471;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const HZ=rows/2,BX=4.3,BZ=HZ+.3,TOP=.2,AX=BX+1.45,AZ=BZ+1.45,WALL=1,NT=software?4:7,TD=.42,TH=.3;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.85,...extra});
const add=(geo,material,parent=root,shadow=!software)=>{const m=new THREE.Mesh(geo,material);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m};
const canvasTex=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t};
const updates=[],cellX=x=>x-3.5,cellZ=y=>y-(rows-1)/2,dummy=new THREE.Object3D();
const dotTex=canvasTex(32,32,g=>{const r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.45,'rgba(255,255,255,.5)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,32,32)});
const glow=(color,size,op=.8)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color,transparent:true,opacity:op,depthWrite:false,blending:THREE.AdditiveBlending}));s.scale.setScalar(size);return s};
// Ellipses : angle a mesuré depuis +z (côté du joueur, devant la caméra), dans le sens de +x.
const ring=k=>({sx:AX+k,sz:AZ+k}),onRing=(a,k)=>{const r=ring(k);return[Math.sin(a)*r.sx,Math.cos(a)*r.sz]};
const tangentYaw=(a,k)=>{const r=ring(k);return Math.atan2(Math.sin(a)*r.sz,Math.cos(a)*r.sx)};// x local le long de l'ellipse, +z local vers l'extérieur
const SEG=software?48:72,segA=i=>(i+.5)/SEG*Math.PI*2,angDist=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
const GATE=[0,Math.PI],isGate=a=>GATE.some(g=>angDist(a,g)<.16),BOX=[Math.PI/2,-Math.PI/2],isBox=a=>BOX.some(b=>angDist(a,b)<.2),isAisle=i=>i%9===4;

// ---------- 1. Sable de l'arène : ratissé en cercles, quelques traces ----------
const sandTex=canvasTex(512,512,(g,w,h)=>{g.fillStyle='#e2c58f';g.fillRect(0,0,w,h);for(let i=0;i<16000;i++){const v=rnd();g.fillStyle=v>.55?`rgba(255,240,205,${.15+rnd()*.25})`:`rgba(150,105,55,${.08+rnd()*.18})`;g.fillRect(rnd()*w,rnd()*h,1+rnd()*1.6,1+rnd()*1.6)}
 g.strokeStyle='rgba(160,115,60,.16)';g.lineWidth=2;for(let y=6;y<h;y+=12){g.beginPath();for(let x=0;x<=w;x+=16)g.lineTo(x,y+Math.sin(x*.03+y*.1)*2);g.stroke()}
 for(let i=0;i<26;i++){const x=rnd()*w,y=rnd()*h,a=rnd()*6.3;g.fillStyle='rgba(120,80,40,.18)';g.save();g.translate(x,y);g.rotate(a);g.beginPath();g.ellipse(0,0,5,9,0,0,7);g.fill();g.restore()}});
sandTex.repeat.set(4,4);
const sand=add(new THREE.CircleGeometry(1,64),mat(0xffffff,{map:sandTex,bumpMap:sandTex,bumpScale:.02,roughness:.98}),root,false);sand.rotation.x=-Math.PI/2;sand.scale.set(AX+.3,AZ+.3,1);sand.position.y=.01;

// ---------- 2. Le plateau : socle de travertin, dalles de marbre, frise à grecques ----------
const marbleTex=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#efe6d4';g.fillRect(0,0,w,h);for(let k=0;k<7;k++){g.strokeStyle=`rgba(${150+rnd()*40},${140+rnd()*30},${130+rnd()*30},${.18+rnd()*.2})`;g.lineWidth=.6+rnd()*1.4;g.beginPath();let x=rnd()*w,y=0;g.moveTo(x,y);while(y<h){x+=(rnd()-.5)*18;y+=8+rnd()*10;g.lineTo(x,y)}g.stroke()}g.strokeStyle='rgba(90,70,45,.5)';g.lineWidth=4;g.strokeRect(2,2,w-4,h-4)});
const plinth=add(new THREE.BoxGeometry(BX*2,.5,BZ*2),mat(0xcdb48a,{roughness:.9}));plinth.position.y=TOP-.31;
const slabs=new THREE.InstancedMesh(new THREE.BoxGeometry(.95,.1,.95).translate(0,-.05,0),mat(0xffffff,{map:marbleTex,roughness:.45,metalness:.02}),8*rows);let si=0;
for(let y=0;y<rows;y++)for(let x=0;x<8;x++){dummy.position.set(cellX(x),TOP,cellZ(y));dummy.rotation.set(0,(rnd()-.5)*.012,0);dummy.updateMatrix();slabs.setMatrixAt(si,dummy.matrix);const c=new THREE.Color((x+y)%2?0xf4ecdc:0xdccbab);c.offsetHSL(0,0,(rnd()-.5)*.025);slabs.setColorAt(si++,c)}
slabs.castShadow=false;slabs.receiveShadow=true;root.add(slabs);
const keyTex=canvasTex(256,32,(g,w,h)=>{g.fillStyle='#8e2a1f';g.fillRect(0,0,w,h);g.strokeStyle='#e6c26a';g.lineWidth=3;for(let x=0;x<w;x+=32){g.beginPath();g.moveTo(x+2,26);g.lineTo(x+2,6);g.lineTo(x+26,6);g.lineTo(x+26,22);g.lineTo(x+10,22);g.lineTo(x+10,14);g.lineTo(x+18,14);g.stroke();g.beginPath();g.moveTo(x+26,26);g.lineTo(x+34,26);g.stroke()}g.fillStyle='#e6c26a';g.fillRect(0,0,w,2);g.fillRect(0,h-2,w,2)});
for(const s of[-1,1]){const t1=keyTex.clone();t1.needsUpdate=true;t1.repeat.set(BX*2/1.1,1);const a=add(new THREE.BoxGeometry(BX*2+.24,.18,.24),[mat(0xb59a6c),mat(0xb59a6c),mat(0xd8c29a),mat(0xb59a6c),mat(0xffffff,{map:t1}),mat(0xffffff,{map:t1})]);a.position.set(0,TOP-.02,s*(BZ+.02));
 const t2=keyTex.clone();t2.needsUpdate=true;t2.repeat.set(BZ*2/1.1,1);const b=add(new THREE.BoxGeometry(.24,.18,BZ*2+.04),[mat(0xffffff,{map:t2}),mat(0xffffff,{map:t2}),mat(0xd8c29a),mat(0xb59a6c),mat(0xb59a6c),mat(0xb59a6c)]);b.position.set(s*(BX+.02),TOP-.02,0)}

// ---------- 3. Mur du podium : panneaux pompéiens rouges et ocre, pilastres, corniche ----------
const panelTex=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#e9d9b6';g.fillRect(0,0,w,h);g.fillStyle='#9b2f22';g.fillRect(10,22,w-20,h-46);g.strokeStyle='#e6c26a';g.lineWidth=3;g.strokeRect(16,28,w-32,h-58);g.fillStyle='#c98a3a';g.fillRect(0,h-20,w,20);g.fillStyle='#5a4632';g.fillRect(0,0,w,8);
 g.strokeStyle='rgba(240,214,150,.8)';g.lineWidth=2;g.beginPath();g.moveTo(w/2,40);g.quadraticCurveTo(w/2+18,60,w/2,82);g.quadraticCurveTo(w/2-18,60,w/2,40);g.stroke();g.beginPath();g.arc(w/2,61,5,0,7);g.stroke()});
const stone=mat(0xd8c39b,{roughness:.92}),stoneDark=mat(0xb59b72,{roughness:.95}),panelMat=mat(0xffffff,{map:panelTex,roughness:.9});
const wallSegs=new THREE.InstancedMesh(new THREE.BoxGeometry(1,WALL,.28),[stone,stone,stone,stone,stone,panelMat],SEG);let wsi=0;
const pilasters=new THREE.InstancedMesh(new THREE.BoxGeometry(.16,WALL+.12,.36),stoneDark,SEG);let psi=0;
const cornice=new THREE.InstancedMesh(new THREE.BoxGeometry(1,.1,.42),stoneDark,SEG);let csi=0;
for(let i=0;i<SEG;i++){const a=segA(i);if(isGate(a))continue;const a0=i/SEG*Math.PI*2,a1=(i+1)/SEG*Math.PI*2,[x0,z0]=onRing(a0,0),[x1,z1]=onRing(a1,0),len=Math.hypot(x1-x0,z1-z0),[x,z]=onRing(a,0),yaw=tangentYaw(a,0);
 dummy.position.set(x,WALL/2,z);dummy.rotation.set(0,yaw,0);dummy.scale.set(len+.02,1,1);dummy.updateMatrix();wallSegs.setMatrixAt(wsi++,dummy.matrix);
 dummy.position.y=WALL+.04;dummy.updateMatrix();cornice.setMatrixAt(csi++,dummy.matrix);
 if(i%2===0){const [px,pz]=onRing(a0,-.02);dummy.position.set(px,(WALL+.12)/2,pz);dummy.scale.set(1,1,1);dummy.rotation.set(0,tangentYaw(a0,0),0);dummy.updateMatrix();pilasters.setMatrixAt(psi++,dummy.matrix)}}
// la face peinte (−z local) regarde l'intérieur de l'arène
wallSegs.count=wsi;pilasters.count=psi;cornice.count=csi;for(const m of[wallSegs,pilasters,cornice]){m.castShadow=!software;m.receiveShadow=true;root.add(m)}

// ---------- 4. Les deux grandes portes (une derrière chaque camp), herses ----------
const ironMat=mat(0x2e2a28,{metalness:.6,roughness:.45}),woodDark=mat(0x4a3324);
for(const ga of GATE){const g=new THREE.Group();const [x,z]=onRing(ga,0);g.position.set(x,0,z);g.rotation.y=tangentYaw(ga,0)+Math.PI;root.add(g);
 for(const s of[-1,1]){const p=add(new THREE.BoxGeometry(.5,1.75,.6),stone,g);p.position.set(s*.95,.875,0);const cap=add(new THREE.BoxGeometry(.62,.12,.7),stoneDark,g);cap.position.set(s*.95,1.81,0)}
 const arch=add(new THREE.TorusGeometry(.7,.16,8,20,Math.PI),stone,g);arch.position.set(0,1.05,0);arch.scale.set(1,1,1.8);
 const lintel=add(new THREE.BoxGeometry(2.4,.32,.62),stone,g);lintel.position.y=1.95;
 const dark=new THREE.Mesh(new THREE.PlaneGeometry(1.4,1.75),new THREE.MeshBasicMaterial({color:0x140e0a}));dark.position.set(0,.87,-.25);g.add(dark);
 for(let k=-3;k<=3;k++){const bar=add(new THREE.BoxGeometry(.035,1.55,.035),ironMat,g,false);bar.position.set(k*.19,.92,.05)}for(const y of[.45,1.05,1.55]){const bar=add(new THREE.BoxGeometry(1.25,.035,.035),ironMat,g,false);bar.position.set(0,y,.05)}
 const plaque=add(new THREE.BoxGeometry(.9,.24,.04),mat(0xc9a24a,{metalness:.7,roughness:.35}),g,false);plaque.position.set(0,1.95,.33)}

// ---------- 5. Gradins : marches en cuneï, escaliers clairs, vomitoires ----------
const steps=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,TD+.02),mat(0xffffff,{roughness:.93}),SEG*NT);let sti=0;
const vomit=new THREE.InstancedMesh(new THREE.BoxGeometry(.34,.26,.02),new THREE.MeshBasicMaterial({color:0x1c140f}),SEG*2);let vti=0;
const tierK=t=>.35+t*TD,tierY=t=>WALL+.06+(t+1)*TH;
for(let t=0;t<NT;t++)for(let i=0;i<SEG;i++){const a=segA(i),k=tierK(t)+TD/2,a0=i/SEG*Math.PI*2,a1=(i+1)/SEG*Math.PI*2,[x0,z0]=onRing(a0,k),[x1,z1]=onRing(a1,k),len=Math.hypot(x1-x0,z1-z0),[x,z]=onRing(a,k),h=tierY(t);
 dummy.position.set(x,h/2,z);dummy.rotation.set(0,tangentYaw(a,k),0);dummy.scale.set(len+.03,h,1);dummy.updateMatrix();steps.setMatrixAt(sti,dummy.matrix);
 const aisle=isAisle(i),c=new THREE.Color(aisle?0xeadcbf:(t+i)%2?0xd7c29a:0xcfb88f);c.offsetHSL(0,0,(rnd()-.5)*.03);steps.setColorAt(sti++,c);
 if(aisle&&(t===2||t===5)&&!isBox(a)&&!isGate(a)){const kk=tierK(t)-.005,[vx,vz]=onRing(a,kk);dummy.position.set(vx,tierY(t-1)+.15,vz);dummy.rotation.set(0,tangentYaw(a,kk),0);dummy.scale.set(1,1,1);dummy.updateMatrix();vomit.setMatrixAt(vti++,dummy.matrix)}}
steps.count=sti;vomit.count=vti;steps.castShadow=!software;steps.receiveShadow=true;root.add(steps);root.add(vomit);
// balustrade au-dessus du podium (entre le mur et le premier gradin)
{const posts=new THREE.InstancedMesh(new THREE.CylinderGeometry(.025,.03,.22,6),stone,SEG*2);let n=0;for(let i=0;i<SEG*2;i++){const a=(i+.5)/(SEG*2)*Math.PI*2;if(isGate(a))continue;const [x,z]=onRing(a,.12);dummy.position.set(x,WALL+.2,z);dummy.rotation.set(0,0,0);dummy.scale.set(1,1,1);dummy.updateMatrix();posts.setMatrixAt(n++,dummy.matrix)}posts.count=n;root.add(posts)}

// ---------- 6. Façade extérieure : trois étages d'arcades (en ruine côté caméra) ----------
const FK=tierK(NT)+.12,FH=tierY(NT-1)+.9;
const arcTex=canvasTex(128,384,(g,w,h)=>{g.fillStyle='#d6be92';g.fillRect(0,0,w,h);for(let i=0;i<500;i++){g.fillStyle=`rgba(${120+rnd()*60},${95+rnd()*45},${60+rnd()*30},${.1+rnd()*.15})`;g.fillRect(rnd()*w,rnd()*h,2+rnd()*3,1+rnd()*2)}
 const story=h/3;for(let s=0;s<3;s++){const y0=s*story;g.fillStyle='#b99c6e';g.fillRect(0,y0,w,10);g.fillRect(0,y0+story-8,w,8);
  if(s>0){g.fillStyle='#2b1f17';g.beginPath();g.moveTo(26,y0+story-8);g.lineTo(26,y0+44);g.arc(w/2,y0+44,w/2-26,Math.PI,0);g.lineTo(w-26,y0+story-8);g.fill();g.strokeStyle='#e8d6ae';g.lineWidth=5;g.beginPath();g.arc(w/2,y0+44,w/2-23,Math.PI,0);g.stroke()}
  else{g.fillStyle='#2b1f17';g.fillRect(w/2-14,y0+46,28,30)}
  g.fillStyle='#c8ad80';g.fillRect(4,y0+10,14,story-18);g.fillRect(w-18,y0+10,14,story-18)}});
const facadeGeo=new THREE.BoxGeometry(1,1,.34);
const facade=new THREE.InstancedMesh(facadeGeo,mat(0xffffff,{map:arcTex,roughness:.92}),SEG);let fi=0;
// hauteur de la façade selon l'angle : complète sur les côtés, ruinée aux deux bouts (la caméra s'y place selon le camp qui joue : la vue reste dégagée)
const RUIN=[.4,Math.PI+.4],facadeH=a=>{const front=Math.max(...RUIN.map(r=>1-smooth(.5,1.35,angDist(a,r))));const ruin=.24+.22*Math.abs(Math.sin(a*7.3))+.12*Math.abs(Math.sin(a*17.1));return FH*(1-front*(1-ruin))};
for(let i=0;i<SEG;i++){const a=segA(i),a0=i/SEG*Math.PI*2,a1=(i+1)/SEG*Math.PI*2,[x0,z0]=onRing(a0,FK),[x1,z1]=onRing(a1,FK),len=Math.hypot(x1-x0,z1-z0),[x,z]=onRing(a,FK),h=facadeH(a);
 dummy.position.set(x,h/2,z);dummy.rotation.set(0,tangentYaw(a,FK)+Math.PI,0);dummy.scale.set(len+.02,h,1);dummy.updateMatrix();facade.setMatrixAt(fi++,dummy.matrix)}
facade.castShadow=!software;facade.receiveShadow=true;root.add(facade);
// UV verticales : la texture des trois étages suit la hauteur réelle (une ruine montre ses arcades basses, pas des arcades écrasées)
facade.material.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <uv_vertex>','#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv.y*=instanceMatrix[1][1]/'+FH.toFixed(3)+';\n#endif')};
// sol extérieur (esplanade) jusqu'au cadre de la scène
{const base=add(new THREE.CylinderGeometry(1,1.02,.5,72),[mat(0x9c8462,{roughness:1}),mat(0xbfa67c,{roughness:1}),mat(0x6e5b44)],root,false);base.scale.set(AX+FK+.55,1,AZ+FK+.55);base.position.y=-.245;
 const curbR=add(new THREE.TorusGeometry(1,.035,5,96),stoneDark,root,false);curbR.rotation.x=Math.PI/2;curbR.scale.set(AX+FK+.55,AZ+FK+.55,1);curbR.position.y=.0}

// ---------- 7. Loge impériale (baldaquin pourpre), tribune d'honneur ----------
const purple=mat(0x5b2068,{roughness:.8}),gold=mat(0xd8b04a,{metalness:.65,roughness:.35});
function loge(a,royal){const g=new THREE.Group(),k=tierK(1),[x,z]=onRing(a,k+.4);g.position.set(x,tierY(0),z);g.rotation.y=tangentYaw(a,k)+Math.PI;root.add(g);
 const floor=add(new THREE.BoxGeometry(1.6,.12,1),stone,g);floor.position.y=.06;
 for(const sx of[-.7,.7])for(const sz of[-.38,.38]){const c=add(new THREE.CylinderGeometry(.05,.06,1.1,10),royal?gold:stone,g);c.position.set(sx,.67,sz)}
 const roof=add(new THREE.BoxGeometry(1.75,.1,1.1),royal?purple:mat(0x8e2a1f),g);roof.position.y=1.26;const ped=new THREE.Shape();ped.moveTo(-.9,0);ped.lineTo(0,.32);ped.lineTo(.9,0);ped.closePath();const pd=add(new THREE.ExtrudeGeometry(ped,{depth:.1,bevelEnabled:false}),royal?gold:stone,g);pd.position.set(0,1.31,.5);
 const drape=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.5),new THREE.MeshStandardMaterial({color:royal?0x6a2478:0xa8322a,side:THREE.DoubleSide,roughness:.9}));drape.position.set(0,.05,.52);g.add(drape);
 const hem=add(new THREE.BoxGeometry(1.5,.05,.02),gold,g,false);hem.position.set(0,-.18,.53);
 if(royal){const th=add(new THREE.BoxGeometry(.36,.42,.3),gold,g);th.position.set(0,.33,-.2);const back=add(new THREE.BoxGeometry(.36,.5,.06),purple,g);back.position.set(0,.6,-.34);
  const emperor=new THREE.Group();g.add(emperor);emperor.position.set(0,.3,-.12);const body=add(new THREE.CylinderGeometry(.09,.13,.36,10),mat(0xf3ead6),emperor);body.position.y=.18;const toga=add(new THREE.CylinderGeometry(.1,.135,.2,10),purple,emperor);toga.position.set(0,.12,0);toga.rotation.z=.25;
  const head=add(new THREE.SphereGeometry(.075,10,8),mat(0xe1b48c),emperor);head.position.y=.44;const wreath=add(new THREE.TorusGeometry(.07,.014,5,14),mat(0x6b8f2e),emperor,false);wreath.rotation.x=Math.PI/2;wreath.position.y=.47;
  const arm=add(new THREE.BoxGeometry(.04,.2,.04).translate(0,-.1,0),mat(0xe1b48c),emperor,false);arm.position.set(.12,.33,0);emperor.userData.arm=arm;emperorArm=arm}
 // fanions
 for(const sx of[-.7,.7]){const f=new THREE.Mesh(new THREE.PlaneGeometry(.22,.4),new THREE.MeshStandardMaterial({map:bannerTex,side:THREE.DoubleSide,roughness:.8}));f.position.set(sx,1.05,.56);g.add(f)}}
const bannerTex=canvasTex(64,128,(g,w,h)=>{g.fillStyle='#8e2a1f';g.fillRect(0,0,w,h-18);g.beginPath();g.moveTo(0,h-18);g.lineTo(w/2,h);g.lineTo(w,h-18);g.fill();g.strokeStyle='#e6c26a';g.lineWidth=3;g.strokeRect(5,5,w-10,h-30);g.fillStyle='#e6c26a';g.font='bold 22px Georgia';g.textAlign='center';g.fillText('SPQH',w/2,52);g.beginPath();g.arc(w/2,80,10,0,7);g.lineWidth=2;g.stroke()});
let emperorArm=null;loge(BOX[0],true);loge(BOX[1],false);

// ---------- 8. Braseros, oriflammes, statues de bronze ----------
const flames=[];
for(let i=0;i<SEG;i+=9){const a=segA(i+4.5)-Math.PI/SEG*0;if(isGate(a)||isBox(a))continue;const [x,z]=onRing(a,-.05);const g=new THREE.Group();g.position.set(x,WALL+.1,z);root.add(g);
 const tri=add(new THREE.CylinderGeometry(.02,.03,.36,5),ironMat,g,false);tri.position.y=.18;const bowl=add(new THREE.CylinderGeometry(.16,.08,.12,12,1,true),mat(0x8a6a3a,{metalness:.5,roughness:.5,side:THREE.DoubleSide}),g,false);bowl.position.y=.4;
 const fl=new THREE.Mesh(new THREE.ConeGeometry(.1,.3,8),new THREE.MeshBasicMaterial({color:0xffa13a,transparent:true,opacity:.9}));fl.position.y=.56;g.add(fl);const gl=glow(0xff9a3a,.9,.6);gl.position.y=.6;g.add(gl);flames.push({fl,gl,p:rnd()*6})}
updates.push((t,l,moving)=>{for(const f of flames){const k=moving?Math.sin(t*9+f.p)*.5+Math.sin(t*13.7+f.p*2)*.3:0;f.fl.scale.set(1+k*.12,1+k*.25,1+k*.12);f.gl.material.opacity=.5+k*.12}});
const flagMats=[];
for(let i=0;i<SEG;i+=6){const a=segA(i);if(RUIN.some(r=>angDist(a,r)<1.05))continue;const [x,z]=onRing(a,FK),h=facadeH(a);const pole=add(new THREE.CylinderGeometry(.025,.025,1.3,6),mat(0x5a4632),root,false);pole.position.set(x,h+.65,z);
 const fg=new THREE.PlaneGeometry(.55,.32,6,1).translate(.275,0,0);const f=new THREE.Mesh(fg,new THREE.MeshStandardMaterial({color:i%12?0x8e2a1f:0x5b2068,side:THREE.DoubleSide,roughness:.85}));f.position.set(x,h+1.12,z);f.rotation.y=rnd()*6;root.add(f);flagMats.push({f,p:rnd()*6,base:Float32Array.from(fg.attributes.position.array)})}
updates.push((t,l,moving)=>{if(!moving)return;for(const F of flagMats){const p=F.f.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=F.base[i*3];p.setZ(i,Math.sin(t*4+F.p+x*6)*.05*x*2)}p.needsUpdate=true}});
function statue(a){const g=new THREE.Group(),[x,z]=onRing(a,-.35);g.position.set(x,0,z);g.rotation.y=Math.atan2(-x,-z);root.add(g);const bronze=mat(0x8a6236,{metalness:.75,roughness:.35});
 const ped=add(new THREE.BoxGeometry(.5,.5,.5),stone,g);ped.position.y=.25;const body=add(new THREE.CylinderGeometry(.11,.15,.5,10),bronze,g);body.position.y=.82;const head=add(new THREE.SphereGeometry(.09,10,8),bronze,g);head.position.y=1.16;
 const helm=add(new THREE.ConeGeometry(.1,.16,10),bronze,g);helm.position.y=1.26;const crest=add(new THREE.BoxGeometry(.03,.12,.2),mat(0x9b2f22),g,false);crest.position.y=1.33;
 const shield=add(new THREE.CylinderGeometry(.17,.17,.04,16),bronze,g);shield.rotation.x=Math.PI/2;shield.position.set(-.16,.82,.1);const spear=add(new THREE.CylinderGeometry(.012,.012,1.2,5),bronze,g,false);spear.position.set(.18,1.05,.02);
 for(const s of[-1,1]){const leg=add(new THREE.CylinderGeometry(.045,.04,.3,6),bronze,g,false);leg.position.set(s*.06,.6,0)}}
for(const ga of[Math.PI])for(const s of[-1,1])statue(ga+s*.2);

// ---------- 9. La foule ----------
const SKIN=[0xf1c9a5,0xe0ac80,0xc68a5e,0x9c6640,0x6e4428,0xf5d6bd],TUNIC=[0xf3ecdc,0xe8dcc0,0xb8432f,0x2f5f8f,0xc98a3a,0x4d7a3a,0x7a3f8a,0xe0b84a,0x8d6e52,0xffffff];
const spots=[];const SP=software?.62:.34;
for(let t=0;t<NT;t++){const k=tierK(t)+TD*.62,r=ring(k),per=2*Math.PI*Math.sqrt((r.sx*r.sx+r.sz*r.sz)/2),n=Math.floor(per/SP);
 for(let j=0;j<n;j++){const a=(j+(t%2)*.5)/n*Math.PI*2,i=Math.floor(a/(Math.PI*2)*SEG)%SEG;if(isAisle(i)||isBox(a)||(isGate(a)&&t<2)||rnd()<.06)continue;
  const [x,z]=onRing(a,k);spots.push({x,z,y:tierY(t),a,yaw:Math.atan2(-x,-z),side:Math.cos(a)>0?0:1,ph:rnd()*6.28,sp:.8+rnd()*.5,flag:rnd()<.16,skin:SKIN[Math.floor(rnd()*SKIN.length)],tunic:TUNIC[Math.floor(rnd()*TUNIC.length)],hair:rnd()<.7})}}
const N=spots.length;
const bodyGeo=new THREE.CylinderGeometry(.07,.095,.27,7).translate(0,.135,0),headGeo=new THREE.SphereGeometry(.062,8,6),armGeo=new THREE.BoxGeometry(.038,.17,.038).translate(0,-.085,0),hairGeo=new THREE.SphereGeometry(.066,8,5,0,Math.PI*2,0,Math.PI*.55);
const flagGeo=new THREE.PlaneGeometry(.16,.1).translate(.08,.16,0),poleGeo=new THREE.CylinderGeometry(.008,.008,.34,4).translate(0,.04,0);
const crowdMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.85}),flagMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.8,side:THREE.DoubleSide});
const nFlags=spots.filter(s=>s.flag).length,nHair=spots.filter(s=>s.hair).length;
const bodies=new THREE.InstancedMesh(bodyGeo,crowdMat,N),heads=new THREE.InstancedMesh(headGeo,crowdMat,N),arms=new THREE.InstancedMesh(armGeo,crowdMat,N*2),hair=new THREE.InstancedMesh(hairGeo,crowdMat,nHair),flagsM=new THREE.InstancedMesh(flagGeo,flagMat,nFlags),poles=new THREE.InstancedMesh(poleGeo,mat(0x5a4632),nFlags);
const HAIR=[0x2a1b12,0x4a2f1c,0x6b4423,0x1a1410,0xc9a05a,0x8c8c8c];
{let h=0,f=0;spots.forEach((s,i)=>{bodies.setColorAt(i,new THREE.Color(s.tunic));heads.setColorAt(i,new THREE.Color(s.skin));arms.setColorAt(i*2,new THREE.Color(s.skin));arms.setColorAt(i*2+1,new THREE.Color(s.skin));if(s.hair){s.hi=h;hair.setColorAt(h++,new THREE.Color(HAIR[Math.floor(rnd()*HAIR.length)]))}if(s.flag)s.fi=f++})}
for(const m of[bodies,heads,arms,hair,flagsM,poles]){m.castShadow=false;m.receiveShadow=!software;m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.frustumCulled=false;root.add(m)}
// couleurs des fanions = couleurs des camps (réglables dans les options)
function campColor(o){try{const v=getComputedStyle(document.documentElement).getPropertyValue('--camp'+o+'-ui').trim();if(v)return new THREE.Color(v)}catch{}return new THREE.Color(o?0xf08a2b:0x3fbf6a)}
function paintFlags(){const c=[campColor(0),campColor(1)];for(const s of spots)if(s.flag)flagsM.setColorAt(s.fi,c[s.side]);if(flagsM.instanceColor)flagsM.instanceColor.needsUpdate=true}
paintFlags();window.addEventListener('hackenia:camps',paintFlags);
// Humeur de chaque moitié des gradins : idle, cheer (acclame), boo (hue), dismay (se prend la tête), ovation
const mood=[{m:'idle',t0:0,d:0,k:0},{m:'idle',t0:0,d:0,k:0}];let clock=0,olaT=-99,nextOla=14+rnd()*10;
const Q=new THREE.Quaternion(),E=new THREE.Euler(),P=new THREE.Vector3(),S1=new THREE.Vector3(1,1,1),M4=new THREE.Matrix4();
function setInst(mesh,i,x,y,z,rx,ry,rz,sx=1,sy=1,sz=1){E.set(rx,ry,rz,'YXZ');Q.setFromEuler(E);P.set(x,y,z);S1.set(sx,sy,sz);M4.compose(P,Q,S1);mesh.setMatrixAt(i,M4)}
function pose(t,moving){
 for(let i=0;i<N;i++){const s=spots[i],md=mood[s.side],e=md.m==='idle'?0:clamp((t-md.t0)/.25)*clamp((md.t0+md.d-t)/.8),ph=s.ph,sp=s.sp;
  let jump=0,lean=0,armA=.15,armB=.15,armSpread=.12,headYaw=moving?Math.sin(t*.3+ph)*.25:0,bob=moving?Math.sin(t*1.3*sp+ph)*.006:0;
  // ola : une vague qui fait le tour des gradins
  const olaK=moving?clamp(1-Math.abs(((t-olaT)*1.6-((s.a/(Math.PI*2)+1)%1)*6.28))/0.7):0;
  if(olaK>0){jump=Math.max(jump,olaK*.07);armA=armB=Math.max(armA,olaK*2.9)}
  if(e>0&&moving){const m=md.m;
   if(m==='cheer'||m==='ovation'){const amp=(m==='ovation'?1:.75)*md.k;jump=Math.max(jump,Math.max(0,Math.sin(t*11*sp+ph))*.09*amp*e);armA=armB=.15+(2.75+Math.sin(t*14+ph)*.25)*e;armSpread=.12+.35*e}
   else if(m==='boo'){lean=.18*e;armA=.15+(1.25+Math.sin(t*16+ph)*.12)*e;armB=.15+(s.flag?.1:1.15+Math.sin(t*15+ph)*.12)*e;headYaw+=Math.sin(t*9+ph)*.35*e}
   else if(m==='dismay'){lean=-.12*e;armA=armB=.15+2.55*e;armSpread=.12+.55*e;bob-=.02*e}}
  const y=s.y+jump+bob,cy=Math.cos(s.yaw),sy=Math.sin(s.yaw);
  setInst(bodies,i,s.x,y,s.z,lean,s.yaw,0);
  const hx=s.x+sy*lean*.3,hz=s.z+cy*lean*.3;setInst(heads,i,hx,y+.33,hz,0,s.yaw+headYaw,0);if(s.hair)setInst(hair,s.hi,hx,y+.345,hz,0,s.yaw+headYaw,0);
  for(const sd of[-1,1]){const ox=cy*sd*.095,oz=-sy*sd*.095,ang=sd<0?armA:armB;setInst(arms,i*2+(sd>0?1:0),s.x+ox+sy*lean*.2,y+.25,s.z+oz+cy*lean*.2,-ang,s.yaw,sd*armSpread*(ang>1?1:.4))}
  if(s.flag){const wave=moving?Math.sin(t*(e>0&&mood[s.side].m!=='boo'?12:2.4)+ph)*.5:0;const ang=Math.max(armB,1.2);const ox=cy*.095,oz=-sy*.095;
   const hxp=s.x+ox+sy*Math.sin(ang)*.17,hyp=y+.25-Math.cos(ang)*.17,hzp=s.z+oz+cy*Math.sin(ang)*.17;setInst(poles,s.fi,hxp,hyp+.02,hzp,0,s.yaw,0);setInst(flagsM,s.fi,hxp,hyp+.02,hzp,0,s.yaw+wave,0)}}
 for(const m of[bodies,heads,arms,hair,flagsM,poles])m.instanceMatrix.needsUpdate=true}
pose(0,false);

// Pétales lancés dans l'arène lors des acclamations
const PET=software?40:160,petals=new THREE.InstancedMesh(new THREE.PlaneGeometry(.06,.045),new THREE.MeshStandardMaterial({color:0xffffff,side:THREE.DoubleSide,roughness:.7}),PET);petals.frustumCulled=false;root.add(petals);
const PCOL=[0xd8323a,0xf6f0e4,0xe6c26a,0xe46a9a,0xffffff],pet=[];for(let i=0;i<PET;i++){pet.push({live:0});petals.setColorAt(i,new THREE.Color(PCOL[i%PCOL.length]));dummy.position.set(0,-5,0);dummy.updateMatrix();petals.setMatrixAt(i,dummy.matrix)}
function throwPetals(side,n){const fans=spots.filter(s=>side==null||s.side===side);for(let k=0;k<n;k++){const p=pet.find(q=>!q.live);if(!p||!fans.length)return;const s=fans[Math.floor(rnd()*fans.length)];
 p.live=1;p.x=s.x;p.y=s.y+.4;p.z=s.z;const tx=(rnd()-.5)*AX*1.4,tz=(rnd()-.5)*AZ*1.4,T=1.1+rnd()*.5;p.vx=(tx-s.x)/T;p.vz=(tz-s.z)/T;p.vy=(0-p.y)/T+4.9*T*.5;p.rx=rnd()*6;p.ry=rnd()*6;p.spin=(rnd()-.5)*12;p.rest=0}}
updates.push((t,l,moving,dt)=>{let any=false;pet.forEach((p,i)=>{if(!p.live)return;any=true;if(p.rest){p.rest+=dt;if(p.rest>4){p.live=0;dummy.position.set(0,-5,0);dummy.scale.setScalar(1);dummy.updateMatrix();petals.setMatrixAt(i,dummy.matrix);return}}
  else{p.vy-=4.9*dt;p.vx*=.995;p.vz*=.995;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.rx+=p.spin*dt;p.ry+=p.spin*.7*dt;const floor=Math.abs(p.x)<BX&&Math.abs(p.z)<BZ?TOP+.005:.02;if(p.y<=floor&&p.vy<0){p.y=floor;p.rest=.001;p.rx=-Math.PI/2;p.ry=0}}
  dummy.position.set(p.x,p.y,p.z);dummy.rotation.set(p.rx,p.ry,0);dummy.scale.setScalar(p.rest>3?Math.max(.01,4-p.rest):1);dummy.updateMatrix();petals.setMatrixAt(i,dummy.matrix)});if(any)petals.instanceMatrix.needsUpdate=true});

// ---------- 10. Sons de foule (synthétisés : pas de fichier à télécharger) ----------
let ac=null;
function audio(){const st=window.HackeniaSettings?.get?.()||{};if(!st.sound||!(st.volume>0)||document.hidden)return null;try{ac??=new (window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();return ac.state==='closed'?null:ac}catch{return null}}
let noiseBuf=null;function noise(c){if(noiseBuf)return noiseBuf;const b=c.createBuffer(1,c.sampleRate*2,c.sampleRate),d=b.getChannelData(0);let last=0;for(let i=0;i<d.length;i++){const w=Math.random()*2-1;last=last*.6+w*.4;d[i]=last}return noiseBuf=b}
function crowdSound(kind,strength=1){const c=audio();if(!c)return;const vol=(window.HackeniaSettings?.get?.().volume??.5)*.55*strength,t=c.currentTime,out=c.createGain();out.connect(c.destination);
 const env=(g,a,s,r,v)=>{g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+a);g.gain.setValueAtTime(v,t+a+s);g.gain.exponentialRampToValueAtTime(.0005,t+a+s+r)};
 const src=c.createBufferSource();src.buffer=noise(c);src.loop=true;const end=t+3.6;
 if(kind==='boo'){const lp=c.createBiquadFilter();lp.type='lowpass';lp.frequency.value=520;const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=300;bp.Q.value=1.2;const g=c.createGain();src.connect(lp);lp.connect(bp);bp.connect(g);g.connect(out);env(g,.35,1.3,1.1,vol*1.3);
  for(let k=0;k<6;k++){const o=c.createOscillator(),og=c.createGain(),f=c.createBiquadFilter();o.type='sawtooth';const f0=105+k*9+Math.random()*12;o.frequency.setValueAtTime(f0,t);o.frequency.linearRampToValueAtTime(f0*.86,t+2.5);f.type='lowpass';f.frequency.value=420;o.connect(f);f.connect(og);og.connect(out);env(og,.4+Math.random()*.2,1.1,1,vol*.05);o.start(t);o.stop(end)}}
 else{const bp=c.createBiquadFilter();bp.type='bandpass';bp.frequency.value=950;bp.Q.value=.6;const hp=c.createBiquadFilter();hp.type='bandpass';hp.frequency.value=2600;hp.Q.value=.9;const g=c.createGain(),g2=c.createGain();src.connect(bp);bp.connect(g);g.connect(out);src.connect(hp);hp.connect(g2);g2.connect(out);
  const big=kind==='ovation';env(g,.18,big?1.8:1.2,1.3,vol*(big?1.6:1.2));env(g2,.18,big?1.6:1,1.1,vol*.45);
  for(let k=0;k<(big?6:3);k++){const o=c.createOscillator(),og=c.createGain(),st=t+.2+Math.random()*1.2;o.type='sine';o.frequency.setValueAtTime(1700+Math.random()*500,st);o.frequency.exponentialRampToValueAtTime(2500+Math.random()*700,st+.18);o.frequency.exponentialRampToValueAtTime(1600,st+.42);og.gain.setValueAtTime(0,st);og.gain.linearRampToValueAtTime(vol*.06,st+.05);og.gain.exponentialRampToValueAtTime(.0005,st+.45);o.connect(og);og.connect(out);o.start(st);o.stop(st+.5)}}
 src.start(t);src.stop(end);setTimeout(()=>{try{out.disconnect()}catch{}},4200)}

// ---------- 11. Réaction aux lancers ----------
let toast=null,toastTimer=0;
function say(text,tone){const host=document.getElementById('bw');if(!host)return;if(!toast){toast=document.createElement('div');toast.className='coli-toast';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');host.append(toast)}
 toast.textContent=text;toast.dataset.tone=tone;toast.classList.remove('show');void toast.offsetWidth;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast?.classList.remove('show'),2600)}
const T=x=>window.HackeniaI18n?.t?.(x)||x;
function react(d){if(!root.visible||!d)return;const seat=d.seat?1:0,other=1-seat,margin=d.success?Math.max(0,Math.max(...(d.values||[0]))-(d.need||0)):0,name=d.name||T(seat?'l’adversaire':'le joueur'),now=clock;
 const set=(o,m,dur,k=1)=>{mood[o]={m,t0:now,d:dur,k}};
 if(d.magic||d.sudden){set(0,'ovation',3.6);set(1,'ovation',3.6);throwPetals(null,software?20:90);crowdSound('ovation',1);say('🏟️ '+T('Ovation ! Tout le Colisée se lève pour')+' '+name+' !','cheer');if(emperorArm)emperorArm.userData.salute=now;return}
 if(d.success){set(seat,'cheer',3,.75+Math.min(.25,margin*.08));set(other,'boo',2.6);throwPetals(seat,software?10:30+margin*8);crowdSound('cheer',.8+Math.min(.4,margin*.1));setTimeout(()=>crowdSound('boo',.35),250);say('📣 '+T('La foule acclame')+' '+name+' !','cheer');if(emperorArm&&margin>=2)emperorArm.userData.salute=now}
 else{set(seat,'dismay',2.6);set(other,'boo',3);crowdSound('boo',1);say('👎 '+T('Huées !')+' '+name.charAt(0).toUpperCase()+name.slice(1)+' '+T('rate son lancer.'),'boo')}}
window.addEventListener('hackenia:roll-result',e=>react(e.detail));
window.hackeniaColosseum={react};

// ---------- 12. Pigeons qui tournent au-dessus des gradins ----------
const birds=[];for(let i=0;i<(software?2:7);i++){const g=new THREE.Group();const body=add(new THREE.SphereGeometry(.05,8,6),mat(0x8d8f99),g,false);body.scale.set(1.3,.9,.9);const wings=[];for(const s of[-1,1]){const w=add(new THREE.PlaneGeometry(.12,.05),new THREE.MeshStandardMaterial({color:0x7c7f8a,side:THREE.DoubleSide}),g,false);w.position.set(0,.02,s*.06);w.rotation.x=Math.PI/2;wings.push({w,s})}root.add(g);birds.push({g,wings,p:rnd()*6,r:1.05+rnd()*.15,h:4.2+rnd()*.8})}
updates.push((t,l,moving)=>{const T=moving?t:0;for(const b of birds){const a=T*.12+b.p,[x,z]=onRing(a,FK*b.r-AX*.0);b.g.position.set(x*.92,b.h+Math.sin(T*1.1+b.p)*.2,z*.92);b.g.rotation.y=-a;for(const W of b.wings)W.w.rotation.y=W.s*(moving?Math.sin(t*14+b.p)*.7:.3)}});

let last=0;
return{root,update(t,light,moving){const dt=Math.min(.1,Math.max(0,t-last));last=t;clock=t;
 if(moving&&t-olaT>8&&t>nextOla&&mood.every(m=>m.m==='idle'||t>m.t0+m.d)){olaT=t;nextOla=t+28+rnd()*25}
 for(const m of mood)if(m.m!=='idle'&&t>m.t0+m.d)m.m='idle';
 if(emperorArm){const s=emperorArm.userData.salute;const k=s!=null&&t-s<2.6?Math.sin(clamp((t-s)/2.6)*Math.PI):0;emperorArm.rotation.x=-k*2.6;emperorArm.rotation.z=k*.2}
 if(moving||!this._posed){pose(t,moving);this._posed=true}
 for(const u of updates)u(t,light,moving,dt)}};
}
