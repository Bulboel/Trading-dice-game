/* v335 — Terrain « Le quartier des brumes féeriques » (d'après l'illustration du quartier dans l'Histoire et les cartes de la Triade).
   Un parvis de pierre claire semé de pétales, des balustrades de marbre blanc couvertes de fleurs, des glycines roses et mauves,
   des lanternes dorées, un pont en arche au-dessus d'une cascade, des flèches blanches au loin, des pixies lumineuses
   et une brume colorée qui roule au ras du sol. La brume prend la couleur de l'élément favorisé, qui change à chaque tour
   complet (règle : moteur du jeu, terrain multi-élément) : setMist(élément). Pachié, Bulbalina et Max des Brumes s'y promènent.
   Coordonnées réelles des cases (root.scale.z = 1/ZS). */
import * as THREE from 'three';
export function createFairyMists(world,software=false,rows=10,helpers={}){
const root=new THREE.Group();world.add(root);root.visible=false;
let seed=4242;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const HZ=rows/2,BX=4.3,BZ=HZ+.3,TOP=.2,FX=9.5,FZ=HZ+4.2;
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.85,...extra});
const add=(geo,material,parent=root,shadow=!software)=>{const m=new THREE.Mesh(geo,material);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m};
const canvasTex=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t};
const updates=[],cellX=x=>x-3.5,cellZ=y=>y-(rows-1)/2,outside=(x,z)=>Math.max(Math.abs(x)-BX,Math.abs(z)-BZ),dummy=new THREE.Object3D();
const PETAL=['#f7b6d2','#f39bc3','#e9a6f0','#c99af0','#ffd3e6','#f5c6ff'];
const MIST={feu:0xff8a5c,eau:0x5cc8ff,terre:0xd9b57a,vent:0x7dffcf,glace:0xb9f0ff,foudre:0xc59bff,'':0xe7c6ff};
const dotTex=canvasTex(32,32,g=>{const r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.45,'rgba(255,255,255,.5)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,32,32)});
const glow=(color,size,op=.8)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color,transparent:true,opacity:op,depthWrite:false,blending:THREE.AdditiveBlending}));s.scale.setScalar(size);return s};
function petal(g,cx,cy,r,rot,col){g.save();g.translate(cx,cy);g.rotate(rot);g.fillStyle=col;g.beginPath();g.ellipse(0,0,r,r*.55,0,0,7);g.fill();g.restore()}

// ---------- 1. Sol : grandes dalles claires semées de pétales ----------
const floorTex=canvasTex(512,512,(g,w,h)=>{g.fillStyle='#b8a7c4';g.fillRect(0,0,w,h);
 for(let y=0;y<h;y+=64)for(let x=0;x<w;x+=64){const v=170+rnd()*28;g.fillStyle=`rgb(${v},${v-14},${v+12})`;g.fillRect(x+2+(y/64%2)*0,y+2,62,60);g.fillStyle='rgba(80,60,100,.35)';g.fillRect(x,y,64,2);g.fillRect(x,y,2,64)}
 for(let i=0;i<520;i++){g.globalAlpha=.5+rnd()*.5;petal(g,rnd()*w,rnd()*h,3+rnd()*4,rnd()*6.3,PETAL[Math.floor(rnd()*PETAL.length)])}g.globalAlpha=1;
 for(let i=0;i<60;i++){g.fillStyle='rgba(120,170,110,.35)';g.beginPath();g.arc(rnd()*w,rnd()*h,3+rnd()*6,0,7);g.fill()}});
floorTex.repeat.set(4,4*FZ/FX);
const floorGeo=new THREE.PlaneGeometry(FX*2,FZ*2,40,40);floorGeo.rotateX(-Math.PI/2);
add(floorGeo,mat(0xffffff,{map:floorTex,bumpMap:floorTex,bumpScale:.015}),root,false).position.y=.01;

// ---------- 2. Le damier : pierre nacrée, quelques pétales ----------
const slabTex=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#f1e6dc';g.fillRect(0,0,w,h);for(let i=0;i<30;i++){g.fillStyle=`rgba(${200+rnd()*40},${180+rnd()*40},${210+rnd()*40},.3)`;g.beginPath();g.arc(rnd()*w,rnd()*h,5+rnd()*10,0,7);g.fill()}for(let i=0;i<3;i++)petal(g,10+rnd()*108,10+rnd()*108,4+rnd()*4,rnd()*6,PETAL[Math.floor(rnd()*PETAL.length)]);g.strokeStyle='rgba(150,110,150,.5)';g.lineWidth=4;g.strokeRect(2,2,w-4,h-4)});
const plinth=add(new THREE.BoxGeometry(BX*2,.5,BZ*2),mat(0xd8cfe0));plinth.position.y=TOP-.31;
const slabs=new THREE.InstancedMesh(new THREE.BoxGeometry(.94,.1,.94).translate(0,-.05,0),mat(0xffffff,{map:slabTex,roughness:.6,metalness:.05}),8*rows);let si=0;
for(let y=0;y<rows;y++)for(let x=0;x<8;x++){dummy.position.set(cellX(x),TOP,cellZ(y));dummy.rotation.set(0,0,0);dummy.updateMatrix();slabs.setMatrixAt(si,dummy.matrix);const c=new THREE.Color((x+y)%2?0xfff4ef:0xe8dcf2);slabs.setColorAt(si++,c)}
slabs.castShadow=false;slabs.receiveShadow=true;root.add(slabs);

// ---------- 3. Balustrades de marbre et bacs fleuris ----------
const marble=mat(0xf6f1ea,{roughness:.45}),flowerMats=PETAL.map(c=>mat(c,{roughness:.6,emissive:new THREE.Color(c).multiplyScalar(.15)})),leafMat=mat(0x6e9a5e,{flatShading:true});
function balustrade(x,z,len,ry){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;root.add(g);
 const rail=add(new THREE.BoxGeometry(len,.07,.16),marble,g);rail.position.y=.62;const base=add(new THREE.BoxGeometry(len,.08,.2),marble,g);base.position.y=.04;
 const n=Math.round(len/.28);for(let i=0;i<=n;i++){const b=add(new THREE.CylinderGeometry(.045,.06,.52,8),marble,g,false);b.position.set(-len/2+i*len/n,.33,0)}
 for(let i=0;i<Math.round(len/.6);i++){const f=add(new THREE.IcosahedronGeometry(.11,0),rnd()<.3?leafMat:flowerMats[Math.floor(rnd()*flowerMats.length)],g,false);f.position.set(-len/2+rnd()*len,.7+rnd()*.06,(rnd()-.5)*.12);f.scale.set(1+rnd(),.7,1)}}
for(const s of[-1,1]){balustrade(s*(BX+.35),0,BZ*2-.4,Math.PI/2)}
function urn(x,z,s){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);root.add(g);const foot=add(new THREE.CylinderGeometry(.14,.2,.12,10),marble,g);foot.position.y=.06;const bowl=add(new THREE.CylinderGeometry(.3,.16,.32,12),marble,g);bowl.position.y=.28;
 for(let i=0;i<9;i++){const f=add(new THREE.IcosahedronGeometry(.13,0),i%3?flowerMats[Math.floor(rnd()*flowerMats.length)]:leafMat,g,false);const a=rnd()*6.3,r=rnd()*.22;f.position.set(Math.cos(a)*r,.48+rnd()*.12,Math.sin(a)*r)}
 for(let i=0;i<4;i++){const v=add(new THREE.CylinderGeometry(.015,.015,.4,4),leafMat,g,false);const a=i*1.6;v.position.set(Math.cos(a)*.3,.22,Math.sin(a)*.3);v.rotation.z=Math.cos(a)*.4;v.rotation.x=Math.sin(a)*.4}}
for(const [sx,sz] of[[-1,-1],[1,-1],[-1,1],[1,1]])urn(sx*(BX+.45),sz*(BZ+.45),.95);

// ---------- 4. Glycines roses et mauves ----------
const trunkMat=mat(0x8a6a5a),wisteria=['#c99af0','#e7a6e6','#f3b3d3','#b48ae6'].map(c=>mat(c,{flatShading:true,roughness:.7,emissive:new THREE.Color(c).multiplyScalar(.12)})),crownMat=mat(0xd9a6e8,{flatShading:true,roughness:.7});
const crownGeo=new THREE.IcosahedronGeometry(1,1),hangGeo=new THREE.ConeGeometry(.12,.55,6).translate(0,-.27,0);
function tree(x,z,s){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rnd()*6;g.scale.setScalar(s);root.add(g);
 const t=add(new THREE.CylinderGeometry(.12,.2,2,7),trunkMat,g);t.position.y=1;t.rotation.z=(rnd()-.5)*.25;
 for(let i=0;i<4;i++){const c=add(crownGeo,i?wisteria[Math.floor(rnd()*wisteria.length)]:crownMat,g);const a=i/4*6.3;c.position.set(Math.cos(a)*.5*(i?1:0),2.15+rnd()*.3+(i?0:.3),Math.sin(a)*.5*(i?1:0));c.scale.set(.85,.55,.85)}
 for(let i=0;i<(software?5:11);i++){const h=add(hangGeo,wisteria[Math.floor(rnd()*wisteria.length)],g,false);const a=rnd()*6.3,r=.4+rnd()*.6;h.position.set(Math.cos(a)*r,1.95+rnd()*.2,Math.sin(a)*r);h.scale.setScalar(.8+rnd()*.6);h.rotation.x=Math.PI}
 return g}
const spots=[];for(let i=0;i<(software?16:30);i++){let x,z,k=0;do{x=(rnd()*2-1)*FX*.95;z=(rnd()*2-1)*FZ*.95;k++}while((outside(x,z)<1.5||spots.some(p=>Math.hypot(p[0]-x,p[1]-z)<1.4)||(x>2&&z>HZ-1&&outside(x,z)<3.4))&&k<40);if(k>=40)continue;spots.push([x,z]);tree(x,z,(x>0&&z>0?.6:.8)+rnd()*.3)}

// ---------- 5. Lanternes dorées ----------
const lights=[];
function lantern(x,z){const g=new THREE.Group();g.position.set(x,0,z);root.add(g);const post=add(new THREE.CylinderGeometry(.04,.06,1.45,8),mat(0x3b3346,{metalness:.4,roughness:.5}),g);post.position.y=.72;
 const cage=add(new THREE.CylinderGeometry(.12,.09,.24,6),new THREE.MeshStandardMaterial({color:0xffe1a0,emissive:0xffb85a,emissiveIntensity:1.5}),g,false);cage.position.y=1.55;const cap=add(new THREE.ConeGeometry(.15,.14,6),mat(0x3b3346,{metalness:.5}),g,false);cap.position.y=1.74;
 const gl=glow(0xffcc77,1.2,.5);gl.position.y=1.55;g.add(gl);lights.push({gl,p:rnd()*6})}
for(const sz of[-1,1])for(const sx of[-1,1])lantern(sx*(BX+1.05),sz*(BZ-1.2));
lantern(-BX-1.05,0);lantern(BX+1.05,0);

// ---------- 6. Au fond : pont en arche, cascade, flèches blanches ----------
const back=new THREE.Group();back.position.set(0,0,-FZ+.9);root.add(back);
const arch=add(new THREE.TorusGeometry(2.2,.22,8,24,Math.PI),marble,back);arch.position.set(-1.5,0,0);
const deck=add(new THREE.BoxGeometry(5,.14,.7),marble,back);deck.position.set(-1.5,2.25,0);
for(const s of[-1,1]){const r=add(new THREE.BoxGeometry(5,.3,.08),marble,back,false);r.position.set(-1.5,2.45,s*.3)}
const fallTex=canvasTex(64,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'rgba(200,230,255,0)');gr.addColorStop(.5,'rgba(235,248,255,.95)');gr.addColorStop(1,'rgba(200,230,255,0)');g.fillStyle=gr;g.fillRect(0,0,w,h);g.strokeStyle='rgba(255,255,255,.7)';for(let i=0;i<40;i++){g.beginPath();const x=rnd()*w;g.moveTo(x,rnd()*h);g.lineTo(x+(rnd()-.5)*4,rnd()*h);g.stroke()}});
const fall=add(new THREE.PlaneGeometry(2.4,2.1),new THREE.MeshBasicMaterial({map:fallTex,transparent:true,depthWrite:false}),back,false);fall.position.set(-1.5,1.05,-.1);
const pool=add(new THREE.CircleGeometry(1.7,24),new THREE.MeshStandardMaterial({color:0x9fd2ff,emissive:0x3a6fa0,emissiveIntensity:.35,roughness:.1,transparent:true,opacity:.85}),back,false);pool.rotation.x=-Math.PI/2;pool.position.set(-1.5,.03,.6);
const spray=glow(0xe8f6ff,2.6,.35);spray.position.set(-1.5,.4,.3);back.add(spray);
const roofMats=[mat(0xb89ae0),mat(0xe7a6d8),mat(0x9ac7e8)];
function spire(x,z,h,s){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);back.add(g);const tw=add(new THREE.CylinderGeometry(.35,.42,h,10),marble,g);tw.position.y=h/2;const roof=add(new THREE.ConeGeometry(.5,1.1,10),roofMats[Math.floor(rnd()*3)],g);roof.position.y=h+.5;
 for(let i=0;i<3;i++){const w=add(new THREE.PlaneGeometry(.12,.22),new THREE.MeshStandardMaterial({color:0xffe6a8,emissive:0xffc070,emissiveIntensity:1.2}),g,false);w.position.set(0,h*.35+i*h*.2,.425)}}
spire(3.4,-.6,4.2,1);spire(5.2,-1.1,5.4,1.1);spire(6.8,-.4,3.6,.9);spire(-5.6,-.9,4.8,1);spire(-7.2,-.3,3.4,.85);

// ---------- 7. Brume colorée (élément favorisé) ----------
const mistTex=canvasTex(128,128,g=>{const r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba(255,255,255,.75)');r.addColorStop(.6,'rgba(255,255,255,.25)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,128,128)});
const mistMat=new THREE.SpriteMaterial({map:mistTex,color:MIST[''],transparent:true,opacity:.42,depthWrite:false});
const puffs=[];for(let i=0;i<(software?14:34);i++){const s=new THREE.Sprite(mistMat);let x,z,k=0;do{x=(rnd()*2-1)*FX;z=(rnd()*2-1)*FZ;k++}while(outside(x,z)<.2&&k<20);s.position.set(x,.35+rnd()*.4,z);const sc=3+rnd()*3;s.scale.set(sc,sc*.5,1);root.add(s);puffs.push({s,x,z,p:rnd()*6,v:.15+rnd()*.2})}
const boardMist=glow(MIST[''],7,.0);boardMist.position.set(0,.4,0);boardMist.scale.set(10,4,1);root.add(boardMist);
// halo coloré au ras du damier : la couleur de l'élément favorisé se lit d'un coup d'œil
const ringTex=canvasTex(256,256,g=>{const r=g.createRadialGradient(128,128,60,128,128,128);r.addColorStop(0,'rgba(255,255,255,0)');r.addColorStop(.55,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,256,256)});
const ring=add(new THREE.PlaneGeometry(BX*2+3.2,BZ*2+3.2),new THREE.MeshBasicMaterial({map:ringTex,color:MIST[''],transparent:true,opacity:.75,depthWrite:false,blending:THREE.AdditiveBlending}),root,false);ring.rotation.x=-Math.PI/2;ring.position.y=.05;

// ---------- 8. Pixies lumineuses et pétales qui volent ----------
const pixies=[];const PX=software?8:16;for(let i=0;i<PX;i++){const c=new THREE.Color(PETAL[i%PETAL.length]);const s=glow(c,.28,.95);root.add(s);const trail=glow(c,.5,.25);root.add(trail);pixies.push({s,trail,cx:(rnd()*2-1)*FX*.8,cz:(rnd()*2-1)*FZ*.8,r:.6+rnd()*1.4,h:.9+rnd()*1.6,w:.4+rnd()*.7,p:rnd()*6})}
const petalTex=canvasTex(32,32,g=>petal(g,16,16,13,0,'#ffffff'));
const N=software?40:120,petals=new THREE.InstancedMesh(new THREE.PlaneGeometry(.1,.1),new THREE.MeshStandardMaterial({map:petalTex,side:THREE.DoubleSide,transparent:true,alphaTest:.3,roughness:.7}),N);petals.castShadow=false;
const drift=[];for(let i=0;i<N;i++){drift.push({x:(rnd()*2-1)*FX,z:(rnd()*2-1)*FZ,y:rnd()*5,v:.18+rnd()*.25,sw:rnd()*6,r:rnd()*6,spin:1+rnd()*2});petals.setColorAt(i,new THREE.Color(PETAL[i%PETAL.length]))}root.add(petals);
let lastT=0,mistTarget=new THREE.Color(MIST['']);
updates.push((t,l,moving)=>{const dt=Math.min(.1,Math.max(0,t-lastT));lastT=t;const T=moving?t:0;
 for(let i=0;i<N;i++){const f=drift[i];if(moving){f.y-=f.v*dt;if(f.y<.05){f.y=4.5+rnd();f.x=(rnd()*2-1)*FX;f.z=(rnd()*2-1)*FZ}}dummy.position.set(f.x+Math.sin(T*1.2+f.sw)*.5,f.y,f.z+Math.cos(T*.9+f.sw)*.3);dummy.rotation.set(T*f.spin+f.r,T*.6+f.r,Math.sin(T*2+f.sw)*.8);dummy.scale.setScalar(1);dummy.updateMatrix();petals.setMatrixAt(i,dummy.matrix)}petals.instanceMatrix.needsUpdate=true;
 for(const P of pixies){const a=T*P.w+P.p,x=P.cx+Math.cos(a)*P.r,z=P.cz+Math.sin(a*1.3)*P.r*.7,y=P.h+Math.sin(T*2.2+P.p)*.25;P.s.position.set(x,y,z);const b=T*P.w+P.p-.25;P.trail.position.set(P.cx+Math.cos(b)*P.r,P.h+Math.sin(T*2.2+P.p-.4)*.25,P.cz+Math.sin(b*1.3)*P.r*.7);P.s.material.opacity=.75+(moving?Math.sin(T*9+P.p)*.25:0)}
 mistMat.color.lerp(mistTarget,Math.min(1,dt*1.5+(moving?0:1)));boardMist.material.color.copy(mistMat.color);ring.material.color.copy(mistMat.color);
 for(const M of puffs){M.s.position.x=M.x+Math.sin(T*M.v+M.p)*.8;M.s.position.z=M.z+Math.cos(T*M.v*.7+M.p)*.5}
 boardMist.material.opacity=.16+(moving?Math.sin(T*.8)*.04:0);
 fallTex.offset.y=moving?-(t*.6)%1:0;
 for(const L of lights)L.gl.material.opacity=.42+(moving?Math.sin(t*3+L.p)*.08:0)});

// ---------- 9. Promeneurs : Pachié, Bulbalina et Max des Brumes ----------
const LX=5.3,LZ0=-(BZ+.95),LZ1=BZ+.85,loop=[[-LX,LZ0],[LX,LZ0],[LX,LZ1],[-LX,LZ1]],segLen=loop.map((p,i)=>{const q=loop[(i+1)%4];return Math.hypot(q[0]-p[0],q[1]-p[1])}),total=segLen.reduce((a,b)=>a+b,0);
function onLoop(d){d=((d%total)+total)%total;let i=0;while(d>segLen[i]){d-=segLen[i];i++}const p=loop[i],q=loop[(i+1)%4],k=d/segLen[i];return{x:p[0]+(q[0]-p[0])*k,z:p[1]+(q[1]-p[1])*k,yaw:Math.atan2(q[0]-p[0],q[1]-p[1])}}
const walkers=[];let lastW=0;
if(!software&&helpers.spawnWalker){[['pachie',1,.2,0],['bulbalina',-1,.22,.4],['max',1,.25,.72]].forEach(([key,dir,speed,start],n)=>setTimeout(()=>helpers.spawnWalker(key,.9).then(w=>{if(!w)return;root.add(w.group);walkers.push({w,dir,speed,d:start*total,yaw:0})}),700+n*900))}
updates.push((t,l,moving)=>{const dt=Math.min(.1,Math.max(0,t-lastW));lastW=t;for(const W of walkers){if(moving)W.d+=W.dir*W.speed*dt;const p=onLoop(W.d),yaw=p.yaw+(W.dir<0?Math.PI:0);let dy=yaw-W.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));W.yaw+=dy*Math.min(1,dt*6+(moving?0:1));W.w.group.position.set(p.x,.03,p.z);W.w.group.rotation.y=W.yaw;if(moving)W.w.update(dt)}});
function setMist(el){mistTarget=new THREE.Color(MIST[el]??MIST[''])}
return{root,setMist,update(t,light,moving){for(const u of updates)u(t,light,moving)}};
}
