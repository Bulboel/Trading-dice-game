/* v253 — Terrain de saison « La forêt d’automne » : une clairière dorée sous les érables.
   Le damier est un parquet de dalles de pierre chaude jonché de feuilles ; autour, un tapis de feuilles orange et rouges,
   des érables flamboyants et des bouleaux, citrouilles (certaines éclairées), champignons, bottes de foin, lanternes,
   un petit ruisseau couvert de feuilles, et des feuilles qui tombent en tourbillonnant. Frolgor et Myconide s'y promènent.
   Terre et Vent y sont favorisés (règles : moteur du jeu). Coordonnées réelles des cases (root.scale.z = 1/ZS). */
import * as THREE from 'three';
export function createAutumn(world,software=false,rows=10,helpers={}){
const root=new THREE.Group();world.add(root);root.visible=false;
let seed=1031;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const HZ=rows/2,BX=4.3,BZ=HZ+.3,TOP=.2,FX=9.5,FZ=HZ+4.2;
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.9,...extra});
const add=(geo,material,parent=root,shadow=!software)=>{const m=new THREE.Mesh(geo,material);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m};
const canvasTex=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t};
const updates=[],cellX=x=>x-3.5,cellZ=y=>y-(rows-1)/2,outside=(x,z)=>Math.max(Math.abs(x)-BX,Math.abs(z)-BZ),dummy=new THREE.Object3D();
const LEAF=['#e8691e','#d2451c','#f29a2e','#b8321c','#f4bf3a','#a8521e','#e07a28'];
const dotTex=canvasTex(32,32,g=>{const r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.45,'rgba(255,255,255,.5)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,32,32)});
const glow=(color,size,op=.8)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color,transparent:true,opacity:op,depthWrite:false,blending:THREE.AdditiveBlending}));s.scale.setScalar(size);return s};
// petite feuille d'érable dessinée (texture partagée)
function mapleLeaf(g,cx,cy,r,rot,col){g.save();g.translate(cx,cy);g.rotate(rot);g.fillStyle=col;g.beginPath();for(let i=0;i<=10;i++){const a=-Math.PI/2+i/10*Math.PI*2,k=i%2?.48:1;g.lineTo(Math.cos(a)*r*k,Math.sin(a)*r*k)}g.closePath();g.fill();g.strokeStyle='rgba(90,30,10,.5)';g.lineWidth=Math.max(1,r*.08);g.beginPath();g.moveTo(0,r*1.1);g.lineTo(0,-r*.6);g.stroke();g.restore()}

// ---------- 1. Sol : tapis de feuilles mortes ----------
const floorTex=canvasTex(512,512,(g,w,h)=>{g.fillStyle='#7a4a24';g.fillRect(0,0,w,h);for(let i=0;i<900;i++){const c=LEAF[Math.floor(rnd()*LEAF.length)];g.globalAlpha=.55+rnd()*.45;mapleLeaf(g,rnd()*w,rnd()*h,5+rnd()*9,rnd()*6.3,c)}g.globalAlpha=1;for(let i=0;i<160;i++){g.fillStyle='rgba(60,35,15,.35)';g.beginPath();g.arc(rnd()*w,rnd()*h,2+rnd()*5,0,7);g.fill()}});
floorTex.repeat.set(5,5*FZ/FX);
const floorGeo=new THREE.PlaneGeometry(FX*2,FZ*2,48,48);floorGeo.rotateX(-Math.PI/2);{const p=floorGeo.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),d=outside(x,z);p.setY(i,d<.4?0:Math.sin(x*.9)*Math.cos(z*.7)*.12*Math.min(1,d-.4)+Math.min(.5,(d-.4)*.05))}floorGeo.computeVertexNormals()}
add(floorGeo,mat(0xffffff,{map:floorTex,bumpMap:floorTex,bumpScale:.02}),root,false).position.y=.01;

// ---------- 2. Le damier : dalles de pierre chaude, quelques feuilles posées dessus ----------
const slabTex=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#c7a77c';g.fillRect(0,0,w,h);for(let i=0;i<40;i++){const v=180+rnd()*40;g.fillStyle=`rgba(${v},${v-25},${v-60},.35)`;g.beginPath();g.arc(rnd()*w,rnd()*h,4+rnd()*10,0,7);g.fill()}for(let i=0;i<4;i++)mapleLeaf(g,10+rnd()*108,10+rnd()*108,5+rnd()*5,rnd()*6,LEAF[Math.floor(rnd()*LEAF.length)]);g.strokeStyle='rgba(70,40,20,.55)';g.lineWidth=5;g.strokeRect(2.5,2.5,w-5,h-5)});
const plinth=add(new THREE.BoxGeometry(BX*2,.5,BZ*2),mat(0x5b3d26));plinth.position.y=TOP-.31;
const slabs=new THREE.InstancedMesh(new THREE.BoxGeometry(.94,.1,.94).translate(0,-.05,0),mat(0xffffff,{map:slabTex,bumpMap:slabTex,bumpScale:.025,roughness:.85}),8*rows);let si=0;
for(let y=0;y<rows;y++)for(let x=0;x<8;x++){dummy.position.set(cellX(x),TOP,cellZ(y));dummy.rotation.set(0,(rnd()-.5)*.02,0);dummy.updateMatrix();slabs.setMatrixAt(si,dummy.matrix);const c=new THREE.Color((x+y)%2?0xf3dcb4:0xdcbb8c);c.offsetHSL((rnd()-.5)*.02,0,(rnd()-.5)*.03);slabs.setColorAt(si++,c)}
slabs.castShadow=false;slabs.receiveShadow=true;root.add(slabs);
// bordure : rondins de bois
const logMat=mat(0x6b4426,{roughness:1}),cutMat=mat(0xd9b07a);
function log(x,z,len,ry){const g=new THREE.Group();g.position.set(x,TOP-.02,z);g.rotation.y=ry;root.add(g);const l=add(new THREE.CylinderGeometry(.14,.15,len,10),logMat,g);l.rotation.z=Math.PI/2;for(const s of[-1,1]){const c=add(new THREE.CircleGeometry(.14,10),cutMat,g,false);c.position.x=s*len/2+s*.002;c.rotation.y=s*Math.PI/2}}
for(const s of[-1,1]){log(0,s*(BZ+.05),BX*2+.2,0);log(s*(BX+.05),0,BZ*2-.1,Math.PI/2)}

// ---------- 3. Arbres : érables flamboyants et bouleaux ----------
const trunkMat=mat(0x5a3820),birchMat=mat(0xece6da),crownMats=['#e05a1c','#c8341a','#f29a2e','#f4c03a','#b02a18','#e8782a'].map(c=>mat(c,{flatShading:true,roughness:.8}));
const crownGeo=new THREE.IcosahedronGeometry(1,1);
function tree(x,z,s,birch=false){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rnd()*6;g.scale.setScalar(s);root.add(g);
 const h=birch?2.6:1.9;const t=add(new THREE.CylinderGeometry(birch?.08:.13,birch?.11:.2,h,7),birch?birchMat:trunkMat,g);t.position.y=h/2;
 if(birch)for(let i=0;i<5;i++){const m=add(new THREE.BoxGeometry(.17,.03,.03),mat(0x2b2620),g,false);m.position.set(0,.4+i*.42,.07);m.rotation.y=rnd()*3}
 const n=birch?3:4+Math.floor(rnd()*2);for(let i=0;i<n;i++){const c=add(crownGeo,crownMats[Math.floor(rnd()*crownMats.length)],g);const a=i/n*6.3+rnd();c.position.set(Math.cos(a)*.45*(i?1:0),h+.25+rnd()*.5+(i?0:.35),Math.sin(a)*.45*(i?1:0));c.scale.set(.75+rnd()*.3,.62+rnd()*.25,.75+rnd()*.3).multiplyScalar(birch?.62:.9)}
 return g}
const treeSpots=[];
for(let i=0;i<(software?26:46);i++){let x,z,k=0;do{x=(rnd()*2-1)*FX*.95;z=(rnd()*2-1)*FZ*.95;k++}while((outside(x,z)<1.3||treeSpots.some(p=>Math.hypot(p[0]-x,p[1]-z)<1.15)||(x>2&&z>HZ-1&&outside(x,z)<3.2))&&k<40);// rien de haut juste devant la caméra
 if(k>=40)continue;treeSpots.push([x,z]);const front=x>0&&z>0;tree(x,z,(front?.55:.75)+rnd()*.35,rnd()<.25)}

// ---------- 4. Petit ruisseau couvert de feuilles (côté gauche) ----------
const streamPts=[];for(let i=0;i<=24;i++){const z=-FZ+i/24*FZ*2;streamPts.push(new THREE.Vector3(-BX-1.5+Math.sin(z*.6)*.45,.035,z))}
const streamCurve=new THREE.CatmullRomCurve3(streamPts);const sg=new THREE.TubeGeometry(streamCurve,60,.32,6,false);sg.scale(1,.06,1);
const water=add(sg,new THREE.MeshStandardMaterial({color:0x6fb6c8,emissive:0x1d4a58,emissiveIntensity:.35,roughness:.12,metalness:.15,transparent:true,opacity:.9}),root,false);
const floating=new THREE.InstancedMesh(new THREE.PlaneGeometry(.12,.12).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color:0xffffff,side:THREE.DoubleSide,map:canvasTex(32,32,(g)=>mapleLeaf(g,16,16,13,0,'#fff')),transparent:true,alphaTest:.3}),40);
const floatData=[];for(let i=0;i<40;i++){floatData.push({u:rnd(),r:rnd()*6,s:.8+rnd()*.6,off:(rnd()-.5)*.35});floating.setColorAt(i,new THREE.Color(LEAF[i%LEAF.length]))}root.add(floating);
const bridge=new THREE.Group();bridge.position.set(-BX-1.5+Math.sin(-1*.6)*.45,0,-1);root.add(bridge);for(let i=0;i<6;i++){const p=add(new THREE.BoxGeometry(.9,.05,.14),mat(0x8a5a32),bridge);p.position.set(0,.16,-.4+i*.16)}for(const s of[-1,1]){const r=add(new THREE.BoxGeometry(.05,.05,1),mat(0x6b4426),bridge);r.position.set(s*.42,.42,0);for(const zz of[-.45,.45]){const post=add(new THREE.BoxGeometry(.05,.3,.05),mat(0x6b4426),bridge);post.position.set(s*.42,.28,zz)}}

// ---------- 5. Citrouilles, champignons, foin, lanternes ----------
const pumpkinMat=mat(0xe8741c,{roughness:.6}),stemMat=mat(0x4b5a24),carved=new THREE.MeshStandardMaterial({color:0xffb347,emissive:0xff8a1f,emissiveIntensity:1.6});
const lights=[];
function pumpkin(x,z,s,lit=false){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rnd()*6;g.scale.setScalar(s);root.add(g);
 for(let i=0;i<6;i++){const lobe=add(new THREE.SphereGeometry(.2,12,10),pumpkinMat,g);const a=i/6*6.3;lobe.position.set(Math.cos(a)*.07,.17,Math.sin(a)*.07);lobe.scale.set(.75,.85,.75)}
 const st=add(new THREE.CylinderGeometry(.025,.035,.12,6),stemMat,g);st.position.y=.36;st.rotation.z=.25;
 if(lit){for(const [ex,ey,w] of[[-.07,.22,.05],[.07,.22,.05],[0,.12,.12]]){const e=add(new THREE.BoxGeometry(w,.035,.02),carved,g,false);e.position.set(ex,ey,.2)}const gl=glow(0xff9a3a,.9,.55);gl.position.set(0,.2,.18);g.add(gl);lights.push({gl,p:rnd()*6})}
 return g}
const capMat=mat(0xc8321e,{roughness:.5}),dotMat=mat(0xfff6e6),mStem=mat(0xf0e6d0);
function mushroom(x,z,s){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);root.add(g);const st=add(new THREE.CylinderGeometry(.04,.05,.18,8),mStem,g,false);st.position.y=.09;const cap=add(new THREE.SphereGeometry(.11,12,8,0,6.3,0,1.6),capMat,g,false);cap.position.y=.17;cap.scale.y=.7;for(let i=0;i<4;i++){const d=add(new THREE.SphereGeometry(.018,6,4),dotMat,g,false);const a=i*1.6;d.position.set(Math.cos(a)*.07,.22,Math.sin(a)*.07)}}
function hay(x,z,ry){const h=add(new THREE.BoxGeometry(.7,.42,.45),mat(0xd8b25a,{map:canvasTex(64,64,(g,w,hh)=>{g.fillStyle='#d6ae55';g.fillRect(0,0,w,hh);g.strokeStyle='rgba(140,100,30,.6)';for(let i=0;i<50;i++){g.beginPath();const y=rnd()*hh;g.moveTo(0,y);g.lineTo(w,y+(rnd()-.5)*8);g.stroke()}})}));h.position.set(x,.21,z);h.rotation.y=ry;for(const s of[-1,1]){const band=add(new THREE.BoxGeometry(.03,.43,.46),mat(0x7a4e22),root,false);band.position.set(x+Math.cos(ry)*s*.18,.21,z-Math.sin(ry)*s*.18);band.rotation.y=ry}}
function lantern(x,z){const g=new THREE.Group();g.position.set(x,0,z);root.add(g);const post=add(new THREE.CylinderGeometry(.035,.045,1.3,6),mat(0x3a2a1c),g);post.position.y=.65;const arm=add(new THREE.BoxGeometry(.3,.03,.03),mat(0x3a2a1c),g,false);arm.position.set(.13,1.27,0);const box=add(new THREE.BoxGeometry(.16,.2,.16),new THREE.MeshStandardMaterial({color:0xffd27a,emissive:0xffa53a,emissiveIntensity:1.4}),g,false);box.position.set(.27,1.14,0);const gl=glow(0xffb45a,1.1,.5);gl.position.set(.27,1.14,0);g.add(gl);lights.push({gl,p:rnd()*6})}
// coins du damier : citrouilles et lanternes
for(const [sx,sz] of[[-1,-1],[1,-1],[-1,1],[1,1]]){pumpkin(sx*(BX+.55),sz*(BZ+.5),.95,true);pumpkin(sx*(BX+.95),sz*(BZ+.2),.6);lantern(sx*(BX+.45),sz*(BZ-.9))}
for(let i=0;i<(software?10:22);i++){let x,z,k=0;do{x=(rnd()*2-1)*FX*.9;z=(rnd()*2-1)*FZ*.9;k++}while(outside(x,z)<.6&&k<30);const r=rnd();if(r<.4)pumpkin(x,z,.5+rnd()*.45,rnd()<.3);else mushroom(x,z,.8+rnd()*.8)}
hay(BX+1.5,-HZ+.8,.3);hay(BX+1.9,-HZ+1.4,-.2);hay(-BX-2.8,HZ-1,.6);
// tas de feuilles
const pileGeo=new THREE.SphereGeometry(.5,10,6,0,6.3,0,1.3);for(let i=0;i<(software?6:12);i++){let x,z,k=0;do{x=(rnd()*2-1)*FX*.9;z=(rnd()*2-1)*FZ*.9;k++}while(outside(x,z)<.8&&k<30);const p=add(pileGeo,mat(LEAF[Math.floor(rnd()*LEAF.length)],{flatShading:true}),root,false);p.position.set(x,-.1,z);p.scale.set(.6+rnd()*.6,.35,.6+rnd()*.6)}

// ---------- 6. Feuilles qui tombent ----------
const leafTex=canvasTex(64,64,g=>mapleLeaf(g,32,32,26,0,'#ffffff'));
const N=software?40:140,leaves=new THREE.InstancedMesh(new THREE.PlaneGeometry(.16,.16),new THREE.MeshStandardMaterial({map:leafTex,side:THREE.DoubleSide,transparent:true,alphaTest:.3,roughness:.8}),N);leaves.castShadow=false;
const fall=[];for(let i=0;i<N;i++){fall.push({x:(rnd()*2-1)*FX,z:(rnd()*2-1)*FZ,y:rnd()*6,v:.25+rnd()*.35,sw:rnd()*6,r:rnd()*6,spin:1+rnd()*2});leaves.setColorAt(i,new THREE.Color(LEAF[i%LEAF.length]))}root.add(leaves);
let lastT=0;
updates.push((t,l,moving)=>{const dt=Math.min(.1,Math.max(0,t-lastT));lastT=t;
 for(let i=0;i<N;i++){const f=fall[i];if(moving){f.y-=f.v*dt;if(f.y<.05){f.y=5.5+rnd();f.x=(rnd()*2-1)*FX;f.z=(rnd()*2-1)*FZ}}const T=moving?t:0;dummy.position.set(f.x+Math.sin(T*1.1+f.sw)*.45,f.y,f.z+Math.cos(T*.8+f.sw)*.25);dummy.rotation.set(T*f.spin+f.r,T*.7+f.r,Math.sin(T*2+f.sw)*.8);dummy.scale.setScalar(1);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix)}leaves.instanceMatrix.needsUpdate=true;
 for(let i=0;i<floatData.length;i++){const f=floatData[i];if(moving)f.u=(f.u+dt*.02*f.s)%1;const p=streamCurve.getPointAt(f.u);dummy.position.set(p.x+f.off,.06,p.z);dummy.rotation.set(0,f.r+(moving?t*.3:0),0);dummy.updateMatrix();floating.setMatrixAt(i,dummy.matrix)}floating.instanceMatrix.needsUpdate=true;
 for(const L of lights)L.gl.material.opacity=.42+(moving?Math.sin(t*3+L.p)*.08+Math.sin(t*11+L.p)*.04:0)});

// ---------- 7. Promeneurs : Frolgor et Myconide flânent dans les feuilles ----------
const LX=5.3,LZ0=-(BZ+.95),LZ1=BZ+.85,loop=[[-LX,LZ0],[LX,LZ0],[LX,LZ1],[-LX,LZ1]],segLen=loop.map((p,i)=>{const q=loop[(i+1)%4];return Math.hypot(q[0]-p[0],q[1]-p[1])}),total=segLen.reduce((a,b)=>a+b,0);
function onLoop(d){d=((d%total)+total)%total;let i=0;while(d>segLen[i]){d-=segLen[i];i++}const p=loop[i],q=loop[(i+1)%4],k=d/segLen[i];return{x:p[0]+(q[0]-p[0])*k,z:p[1]+(q[1]-p[1])*k,yaw:Math.atan2(q[0]-p[0],q[1]-p[1])}}
const walkers=[];let lastW=0;
if(!software&&helpers.spawnWalker){[['frolgor',1,.22,0],['myconide',-1,.2,.45],['orven',1,.26,.7]].forEach(([key,dir,speed,start],n)=>setTimeout(()=>helpers.spawnWalker(key,.9).then(w=>{if(!w)return;root.add(w.group);walkers.push({w,dir,speed,d:start*total,yaw:0})}),700+n*900))}
updates.push((t,l,moving)=>{const dt=Math.min(.1,Math.max(0,t-lastW));lastW=t;for(const W of walkers){if(moving)W.d+=W.dir*W.speed*dt;const p=onLoop(W.d),yaw=p.yaw+(W.dir<0?Math.PI:0);let dy=yaw-W.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));W.yaw+=dy*Math.min(1,dt*6+(moving?0:1));W.w.group.position.set(p.x,.03,p.z);W.w.group.rotation.y=W.yaw;if(moving)W.w.update(dt)}});
return{root,update(t,light,moving){for(const u of updates)u(t,light,moving)}};
}
