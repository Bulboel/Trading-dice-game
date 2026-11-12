/* v246 — Terrain neutre « La grotte souterraine » : une salle creusée dans la roche, entre mine et grotte naturelle.
   Le damier est un sol de dalles de roche polie (une par case), bien éclairé. Autour : parois rocheuses, stalagmites,
   cristaux bleus et violets qui luisent, champignons phosphorescents, étais de mine en bois, rails et wagonnet,
   torches qui vacillent, bassin souterrain, gouttes qui tombent et chauves-souris. Aucun élément n'est favorisé.
   Coordonnées réelles des cases (root.scale.z = 1/ZS appliqué par clearing-v105.js). */
import * as THREE from 'three';
export function createCave(world,software=false,rows=10,helpers={}){
const root=new THREE.Group();world.add(root);root.visible=false;
let seed=6607;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const HZ=rows/2,BX=4.3,BZ=HZ+.3,TOP=.2,FX=7.2,FZ=HZ+2.45;
const mix=(a,b,t)=>a+(b-a)*t,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
const noise=(x,z)=>Math.sin(x*2.71+Math.sin(z*1.9))*Math.cos(z*2.31-x*.61)*.5+Math.sin(x*7.1+z*5.3)*.15;
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.92,...extra});
const add=(geo,material,parent=root,shadow=!software)=>{const m=new THREE.Mesh(geo,material);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m};
const canvasTex=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t};
const updates=[],cellX=x=>x-3.5,cellZ=y=>y-(rows-1)/2,outside=(x,z)=>Math.max(Math.abs(x)-BX,Math.abs(z)-BZ),dummy=new THREE.Object3D();
const dotTex=canvasTex(32,32,g=>{const r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.45,'rgba(255,255,255,.5)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,32,32)});
const glow=(color,size,op=.8)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color,transparent:true,opacity:op,depthWrite:false,blending:THREE.AdditiveBlending}));s.scale.setScalar(size);return s};

// ---------- 1. Sol de la caverne ----------
const rockTex=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#a49a90';g.fillRect(0,0,w,h);for(let i=0;i<5000;i++){const v=rnd();g.fillStyle=v>.6?`rgba(220,210,198,${.1+rnd()*.15})`:`rgba(40,32,28,${.1+rnd()*.2})`;g.fillRect(rnd()*w,rnd()*h,1+rnd()*3,1+rnd()*3)}g.strokeStyle='rgba(15,12,10,.6)';for(let i=0;i<30;i++){g.lineWidth=.6+rnd();g.beginPath();let x=rnd()*w,y=rnd()*h;g.moveTo(x,y);for(let k=0;k<5;k++){x+=(rnd()-.5)*30;y+=(rnd()-.5)*30;g.lineTo(x,y)}g.stroke()}});rockTex.repeat.set(5,5*FZ/FX);
function floorH(x,z){const d=outside(x,z);return d<0?TOP-.3:mix(TOP-.3,.05,smooth(0,.6,d))+Math.max(0,d-.6)*.1+noise(x*.8,z*.8)*.08*smooth(0,1,d)}
const fg=new THREE.PlaneGeometry(FX*2,FZ*2,software?36:90,software?40:100);fg.rotateX(-Math.PI/2);{const p=fg.attributes.position,c=[];for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,floorH(x,z));const col=new THREE.Color(0x8c7f72).lerp(new THREE.Color(0x5a4f47),smooth(-.3,.4,noise(x*.7,z*.7))*.7);c.push(col.r,col.g,col.b)}fg.setAttribute('color',new THREE.Float32BufferAttribute(c,3));fg.computeVertexNormals()}
add(fg,mat(0xffffff,{vertexColors:true,map:rockTex,bumpMap:rockTex,bumpScale:.05}),root,false);

// ---------- 2. Le damier : dalles de roche polie, bien éclairées ----------
const slabTex=canvasTex(128,128,(g,w,h)=>{const img=g.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const e=Math.min(x,y,w-1-x,h-1-y),bevel=smooth(0,9,e),n=noise(x*.07,y*.07)*.5+noise(x*.2,y*.23)*.25,v=clamp(.66+n*.14+(rnd()-.5)*.06)*(.62+.38*bevel),i=(y*w+x)*4;img.data[i]=v*235;img.data[i+1]=v*222;img.data[i+2]=v*205;img.data[i+3]=255}g.putImageData(img,0,0)});
const plinth=add(new THREE.BoxGeometry(BX*2,.5,BZ*2),mat(0x2d2926));plinth.position.y=TOP-.31;
const slabs=new THREE.InstancedMesh(new THREE.BoxGeometry(.93,.1,.93).translate(0,-.05,0),mat(0xffffff,{map:slabTex,bumpMap:slabTex,bumpScale:.03,roughness:.75}),8*rows);let si=0;
for(let y=0;y<rows;y++)for(let x=0;x<8;x++){dummy.position.set(cellX(x),TOP,cellZ(y));dummy.rotation.set(0,(rnd()-.5)*.03,0);dummy.updateMatrix();slabs.setMatrixAt(si,dummy.matrix);const c=new THREE.Color((x+y)%2?0xe6d8c2:0xc7b8a1);c.offsetHSL(0,0,(rnd()-.5)*.03);slabs.setColorAt(si++,c)}
slabs.castShadow=false;slabs.receiveShadow=true;root.add(slabs);

// ---------- 3. Parois rocheuses et stalagmites ----------
const wallMat=mat(0xffffff,{vertexColors:true,flatShading:true,map:rockTex});
function crag(x,z,h,r,seedOff){const g=new THREE.ConeGeometry(r,h,8,5);g.translate(0,h/2,0);const p=g.attributes.position,c=[];for(let i=0;i<p.count;i++){const X=p.getX(i),Y=p.getY(i),Z=p.getZ(i),n=noise(X*2+seedOff,Z*2+Y);if(Y<h*.97){p.setX(i,X*(1+n*.3));p.setZ(i,Z*(1+n*.3))}const col=new THREE.Color(0x857868).lerp(new THREE.Color(0x4a413a),smooth(0,h,Y)*.55+n*.2);c.push(col.r,col.g,col.b)}g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.computeVertexNormals();const m=add(g,wallMat);m.position.set(x,floorH(x,z)-.05,z);m.rotation.y=rnd()*6;return m}
// Parois : un anneau de rochers hauts au fond et sur les côtés gauche, plus bas devant et à droite (vue dégagée).
for(let x=-FX;x<=FX;x+=.7)crag(x+(rnd()-.5)*.3,-FZ+.35+rnd()*.3,2.2+rnd()*1.6,.55+rnd()*.25,x);
for(let z=-FZ+1;z<=FZ-.5;z+=.8)crag(-FX+.3+rnd()*.25,z,1.8+rnd()*1.2,.5+rnd()*.2,z+9);
for(let z=-FZ+1;z<=FZ-.5;z+=.9)crag(FX-.3-rnd()*.2,z,.7+rnd()*.5,.45+rnd()*.2,z+19);
for(let x=-FX+.6;x<=FX-.6;x+=.9)crag(x,FZ-.3,.45+rnd()*.35,.4+rnd()*.15,x+29);
for(let i=0;i<(software?10:24);i++){let x,z;do{x=(rnd()*2-1)*(FX-.9);z=(rnd()*2-1)*(FZ-.9)}while(outside(x,z)<.85);const front=z>BZ||x>BX;crag(x,z,(front?.35:.6)+rnd()*(front?.3:.7),.12+rnd()*.12,i*3.3)}

// ---------- 4. Cristaux lumineux et champignons phosphorescents ----------
// v247 — Cristaux retravaillés : gerbes de prismes hexagonaux à pointe, plantés dans un socle de roche, cœur lumineux,
// halo coloré projeté au sol et petits éclats qui scintillent.
const crystalCols=[[0x7fd4ff,0x1f6fd0,0xd8f3ff],[0xc39bff,0x6a35d8,0xeedfff],[0x8ff0dc,0x1f9a86,0xdcfff6]];const glows=[];
const prismGeo=new THREE.CylinderGeometry(.82,1,1,6);prismGeo.translate(0,.5,0);const tipGeo=new THREE.ConeGeometry(.82,.55,6);tipGeo.translate(0,1.275,0);
const floorGlowTex=canvasTex(64,64,g=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,.9)');r.addColorStop(.5,'rgba(255,255,255,.3)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64)});
function crystals(x,z,s,k){const [c,e,hi]=crystalCols[k%3],body=new THREE.MeshPhysicalMaterial({color:c,emissive:e,emissiveIntensity:.75,roughness:.14,clearcoat:1,clearcoatRoughness:.1,flatShading:true}),tip=new THREE.MeshPhysicalMaterial({color:hi,emissive:c,emissiveIntensity:.55,roughness:.1,clearcoat:1,flatShading:true});
 const g=new THREE.Group();g.position.set(x,floorH(x,z),z);g.rotation.y=rnd()*6;root.add(g);
 const mound=add(new THREE.DodecahedronGeometry(1,1),mat(0x4a413a,{flatShading:true}),g);mound.scale.set(s*.55,s*.16,s*.5);mound.position.y=s*.04;
 const n=6+Math.floor(rnd()*3);for(let i=0;i<n;i++){const centre=i===0,a=i/(n-1)*Math.PI*2+rnd()*.5,tilt=centre?(rnd()-.5)*.12:.28+rnd()*.42,h=s*(centre?1.25:.45+rnd()*.55),r=s*(centre?.11:.05+rnd()*.045),p=new THREE.Group();
  p.position.set(centre?0:Math.cos(a)*s*.2,s*.06,centre?0:Math.sin(a)*s*.2);p.rotation.set(Math.sin(a)*tilt,rnd()*1,-Math.cos(a)*tilt);g.add(p);const b=add(prismGeo,body,p,false);b.scale.set(r,h,r);const t=add(tipGeo,tip,p,false);t.scale.set(r,h,r);t.position.y=h-h*1 ;t.scale.y=r*2.2;t.position.y=h-1*r*2.2}
 const fl=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:floorGlowTex,color:c,transparent:true,opacity:.5,depthWrite:false,blending:THREE.AdditiveBlending}));fl.rotation.x=-Math.PI/2;fl.position.y=.04;fl.scale.setScalar(s*3.2);g.add(fl);
 const gl=glow(c,s*1.1,.35);gl.position.y=s*.75;g.add(gl);const sparks=[];for(let i=0;i<3;i++){const sp=glow(hi,s*.16,0);sp.position.set((rnd()-.5)*s*.6,s*(.3+rnd()*.9),(rnd()-.5)*s*.6);g.add(sp);sparks.push({sp,p:rnd()*6,v:1.5+rnd()*2})}
 glows.push({gl,fl,body,sparks,p:rnd()*6})}
let ck=0;for(const [x,z,s] of[[-5.9,-FZ+2.1,1],[5.6,-FZ+2.3,.8],[-5.7,1.6,.65],[5.7,-1.4,.6],[-5.6,HZ-.1,.65],[5.6,HZ+.7,.55],[-2.6,-BZ-1,.55],[2.9,-BZ-1.05,.6],[0,-FZ+1.2,.8]])if(outside(x,z)>.6)crystals(x,z,s,ck++);
updates.push((t,l,moving)=>{for(const G of glows){const k=moving?Math.sin(t*1.4+G.p):0;G.gl.material.opacity=.3+k*.1;G.fl.material.opacity=.42+k*.12;G.body.emissiveIntensity=.7+k*.2;for(const S of G.sparks)S.sp.material.opacity=moving?Math.pow(Math.max(0,Math.sin(t*S.v+S.p)),8)*.95:0}});
const capGeo=new THREE.SphereGeometry(1,10,6,0,Math.PI*2,0,Math.PI/2),shroomCap=new THREE.MeshStandardMaterial({color:0x6ff2e0,emissive:0x1fbfa8,emissiveIntensity:1.1,roughness:.5}),shroomStem=mat(0xd9e8e0);
for(let i=0;i<(software?10:26);i++){let x,z;do{x=(rnd()*2-1)*(FX-.7);z=(rnd()*2-1)*(FZ-.7)}while(outside(x,z)<.75);const y=floorH(x,z),s=.05+rnd()*.06,h=s*(1.6+rnd());const st=add(new THREE.CylinderGeometry(s*.3,s*.4,h,6),shroomStem,root,false);st.position.set(x,y+h/2,z);const cp=add(capGeo,shroomCap,root,false);cp.scale.set(s,s*.6,s);cp.position.set(x,y+h,z)}
updates.push((t,l,moving)=>{shroomCap.emissiveIntensity=1+(moving?Math.sin(t*.9)*.25:0)});

// ---------- 5. La mine : étais de bois, rails, wagonnet ----------
const timber=mat(0x6b4a2e);
for(const [x,z,ry] of[[-5.7,-3.2,Math.PI/2],[-5.7,3.4,Math.PI/2],[0,-FZ+1.05,0]]){const g=new THREE.Group();g.position.set(x,floorH(x,z),z);g.rotation.y=ry;root.add(g);for(const s of[-.55,.55]){const p=add(new THREE.BoxGeometry(.14,1.5,.14),timber,g);p.position.set(s,.75,0)}const top=add(new THREE.BoxGeometry(1.4,.16,.18),timber,g);top.position.y=1.52;const lamp=glow(0xffb45a,.6,.8);lamp.position.set(0,1.3,.1);g.add(lamp);const lb=add(new THREE.SphereGeometry(.05,8,6),new THREE.MeshBasicMaterial({color:0xffd27a}),g,false);lb.position.set(0,1.32,.1)}
const rail=mat(0x5d5d63,{metalness:.7,roughness:.4});{const rz=-FZ+1.95;for(const off of[-.13,.13]){const r=add(new THREE.BoxGeometry(FX*2-1.4,.03,.04),rail,root,false);r.position.set(0,floorH(0,rz)+.06,rz+off)}for(let x=-FX+.8;x<=FX-.8;x+=.35){const sl=add(new THREE.BoxGeometry(.08,.04,.4),timber,root,false);sl.position.set(x,floorH(x,rz)+.03,rz)}
 const cart=new THREE.Group();root.add(cart);const body=add(new THREE.BoxGeometry(.6,.32,.38),mat(0x4f4a45,{metalness:.5,roughness:.5}),cart);body.position.y=.28;const ore=add(new THREE.SphereGeometry(.2,8,6),mat(0x6b5a48,{flatShading:true}),cart);ore.scale.set(1.2,.45,.75);ore.position.y=.45;for(let i=0;i<3;i++){const g2=add(new THREE.OctahedronGeometry(.05,0),new THREE.MeshBasicMaterial({color:0x9fe0ff}),cart,false);g2.position.set(-.15+i*.15,.52,0)}for(const sx of[-.2,.2])for(const sz of[-.13,.13]){const w=add(new THREE.CylinderGeometry(.08,.08,.04,10),rail,cart);w.rotation.x=Math.PI/2;w.position.set(sx,.08,sz)}
 updates.push((t,l,moving)=>{const k=moving?Math.sin(t*.18):-.6,x=k*(FX-2.2);cart.position.set(x,floorH(x,rz)+.04,rz)})}

// ---------- 6. Torches qui vacillent ----------
const flameTex=canvasTex(64,64,g=>{const r=g.createRadialGradient(32,44,2,32,36,30);r.addColorStop(0,'rgba(255,250,200,1)');r.addColorStop(.35,'rgba(255,180,60,.9)');r.addColorStop(1,'rgba(255,80,10,0)');g.fillStyle=r;g.beginPath();g.ellipse(32,36,16,28,0,0,7);g.fill()});
const torches=[];for(const [x,z] of[[-5.15,-BZ+.3],[5.15,-BZ+.3],[-5.15,0],[5.15,0],[-5.15,BZ-.3],[5.15,BZ-.3]]){const y=floorH(x,z);const st=add(new THREE.CylinderGeometry(.035,.05,.9,6),timber);st.position.set(x,y+.45,z);const bowl=add(new THREE.CylinderGeometry(.09,.05,.1,8),mat(0x3c3c3c,{metalness:.6}));bowl.position.set(x,y+.93,z);const f=new THREE.Sprite(new THREE.SpriteMaterial({map:flameTex,transparent:true,depthWrite:false}));f.center.set(.5,.15);f.position.set(x,y+.96,z);f.scale.set(.22,.34,1);root.add(f);const gl=glow(0xff9a3a,1.5,.6);gl.position.set(x,y+1.05,z);root.add(gl);torches.push({f,gl,p:rnd()*6})}
updates.push((t,l,moving)=>{for(const T of torches){const k=moving?Math.sin(t*9+T.p)*.12+Math.sin(t*13.7+T.p)*.06:0;T.f.scale.set(.22*(1-k*.5),.34*(1+k),1);T.gl.material.opacity=.5+k*.5}});
if(!software){const warm=new THREE.PointLight(0xffa04a,2.4,9,1.6);warm.position.set(0,2.2,0);root.add(warm);const cold=new THREE.PointLight(0x6fb8ff,1.6,8,1.6);cold.position.set(-5,1.5,-FZ+2);root.add(cold);updates.push((t,l,moving)=>{warm.intensity=2.4+(moving?Math.sin(t*7)*.15+Math.sin(t*11)*.1:0)})}

// ---------- 7. Bassin souterrain, gouttes, chauves-souris ----------
{const px=5.6,pz=-FZ+3.6,pool=new THREE.Mesh(new THREE.CircleGeometry(.9,24),new THREE.MeshPhysicalMaterial({color:0x1f4f6a,roughness:.04,clearcoat:1,transparent:true,opacity:.92,emissive:0x0c2a3c,emissiveIntensity:.5}));pool.rotation.x=-Math.PI/2;pool.scale.set(1,.7,1);pool.position.set(px,floorH(px,pz)+.04,pz);root.add(pool);
 const rings=[];for(let i=0;i<3;i++){const r=new THREE.Mesh(new THREE.RingGeometry(.05,.07,20),new THREE.MeshBasicMaterial({color:0xbfe8ff,transparent:true,opacity:0,depthWrite:false}));r.rotation.x=-Math.PI/2;r.position.set(px+(rnd()-.5)*.8,floorH(px,pz)+.05,pz+(rnd()-.5)*.5);root.add(r);rings.push({r,p:i/3})}
 updates.push((t,l,moving)=>{for(const R of rings){const k=moving?(t*.5+R.p)%1:0;R.r.scale.setScalar(1+k*5);R.r.material.opacity=moving?(1-k)*.6:0}})}
const drops=[];for(let i=0;i<(software?0:14);i++){const d=new THREE.Mesh(new THREE.SphereGeometry(.018,5,4),new THREE.MeshBasicMaterial({color:0xbfe8ff,transparent:true,opacity:.8}));let x,z;do{x=(rnd()*2-1)*(FX-.5);z=(rnd()*2-1)*(FZ-.5)}while(outside(x,z)<.3);root.add(d);drops.push({d,x,z,p:rnd(),v:.5+rnd()*.4})}
updates.push((t,l,moving)=>{for(const D of drops){const k=moving?(t*D.v+D.p)%1:D.p;D.d.position.set(D.x,3.2-k*3.1+floorH(D.x,D.z),D.z);D.d.visible=moving}});
const bats=[];const batGeo=new THREE.BufferGeometry();batGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,-.16,.03,-.06,-.08,0,.06,0,0,0,.16,.03,-.06,.08,0,.06],3));batGeo.computeVertexNormals();
for(let i=0;i<(software?1:4);i++){const m=new THREE.Mesh(batGeo,new THREE.MeshBasicMaterial({color:0x14110f,side:THREE.DoubleSide}));root.add(m);bats.push({m,p:rnd()*6,r:1.2+rnd()*1.4,cx:(rnd()-.5)*8,cz:-FZ+1.6+rnd()})}
updates.push((t,l,moving)=>{const T=moving?t:0;for(const B of bats){const a=T*.9+B.p;B.m.position.set(B.cx+Math.cos(a)*B.r,2.6+Math.sin(T*2+B.p)*.3,B.cz+Math.sin(a)*B.r*.4);B.m.rotation.y=-a;B.m.scale.y=moving?.4+Math.abs(Math.sin(t*16+B.p)):1}});
// Poussière qui flotte dans la lumière des torches.
if(!software){const n=60,geo=new THREE.BufferGeometry(),pos=new Float32Array(n*3),sd=[];for(let i=0;i<n;i++)sd.push({x:(rnd()*2-1)*FX,z:(rnd()*2-1)*FZ,y:.3+rnd()*2.4,p:rnd()*6});geo.setAttribute('position',new THREE.BufferAttribute(pos,3));const pts=new THREE.Points(geo,new THREE.PointsMaterial({map:dotTex,color:0xffe1b0,size:3,sizeAttenuation:false,transparent:true,opacity:.5,depthWrite:false}));pts.frustumCulled=false;root.add(pts);
 updates.push((t,l,moving)=>{const T=moving?t:0;sd.forEach((s,i)=>{pos[i*3]=s.x+Math.sin(T*.2+s.p)*.3;pos[i*3+1]=s.y+Math.sin(T*.3+s.p)*.2;pos[i*3+2]=s.z+Math.cos(T*.25+s.p)*.3});geo.attributes.position.needsUpdate=true})}

// ---------- 8. v247 — La vie de la mine : mineurs qui piochent, et deux mineurs poursuivis par de petites araignées noires ----------
// Figurines provisoires (formes simples) : elles seront remplacées par les modèles 3D dédiés (groupes nommés « miner » et « cave-spider »).
const skin=mat(0xe2b48c),helmetMat=mat(0xe9b93a,{metalness:.3,roughness:.5}),bootMat=mat(0x3a2c22),pickMetal=mat(0x8d9299,{metalness:.7,roughness:.35});
function miner(shirt,withPick){const g=new THREE.Group();g.name='miner';const P={g,legs:[],arms:[]};
 for(const s of[-1,1]){const leg=new THREE.Group();leg.position.set(s*.06,.26,0);g.add(leg);const l=add(new THREE.BoxGeometry(.08,.26,.09),mat(0x4a5a78),leg);l.position.y=-.13;const b=add(new THREE.BoxGeometry(.09,.06,.13),bootMat,leg);b.position.set(0,-.25,.02);P.legs.push(leg)}
 const torso=add(new THREE.BoxGeometry(.22,.26,.14),mat(shirt),g);torso.position.y=.4;P.torso=torso;
 const head=add(new THREE.SphereGeometry(.085,10,8),skin,g);head.position.y=.62;const helm=add(new THREE.SphereGeometry(.095,10,6,0,Math.PI*2,0,Math.PI/2),helmetMat,g);helm.position.y=.64;const lamp=glow(0xfff0b0,.28,.9);lamp.position.set(0,.68,.1);g.add(lamp);const beard=add(new THREE.BoxGeometry(.1,.06,.04),mat(0x6b4a2e),g,false);beard.position.set(0,.57,.075);
 for(const s of[-1,1]){const arm=new THREE.Group();arm.position.set(s*.14,.5,0);g.add(arm);const a=add(new THREE.BoxGeometry(.06,.24,.07),mat(shirt),arm);a.position.y=-.11;const hand=add(new THREE.SphereGeometry(.035,6,5),skin,arm,false);hand.position.y=-.24;P.arms.push(arm)}
 if(withPick){const pick=new THREE.Group();pick.position.y=-.24;P.arms[1].add(pick);const handle=add(new THREE.CylinderGeometry(.012,.012,.42,5),timber,pick);handle.rotation.x=Math.PI/2;handle.position.z=.18;const hd=add(new THREE.BoxGeometry(.26,.035,.035),pickMetal,pick);hd.position.z=.39}
 root.add(g);return P}
// Mineurs qui piochent la paroi : le bras se lève, s'abat, une étincelle jaillit.
const diggers=[];for(const [x,z,ry,shirt] of[[-5.95,-4.3,-Math.PI/2,0x9c4a3a],[3.7,-FZ+1.35,Math.PI,0x3e7a5a]].slice(0,software?1:2)){const m=miner(shirt,true);m.g.position.set(x,floorH(x,z),z);m.g.rotation.y=ry;m.arms[0].rotation.x=-.3;const spark=glow(0xffd27a,.3,0);spark.position.set(0,.35,.5);m.g.add(spark);diggers.push({m,spark,p:rnd()*3})}
updates.push((t,l,moving)=>{for(const D of diggers){const k=moving?((t*.9+D.p)%1):.2,up=k<.6?k/.6:1-(k-.6)/.4,swing=-2.6*Math.sin(up*Math.PI/2)*(k<.6?1:1);D.m.arms[1].rotation.x=k<.6?-2.5*(k/.6):-2.5*(1-(k-.6)/.25<0?0:1-(k-.6)/.25);D.m.torso.rotation.x=k>.6&&k<.85?.25:0;D.spark.material.opacity=moving&&k>.84&&k<.94?1:0;void up;void swing}});
// Petites araignées noires : corps luisant, yeux rouges, huit pattes qui tricotent.
const spiderBody=new THREE.MeshStandardMaterial({color:0x0c0b0d,roughness:.3,metalness:.2}),eyeMat=new THREE.MeshBasicMaterial({color:0xff2a2a});
function spider(sc){const g=new THREE.Group();g.name='cave-spider';const ab=add(new THREE.SphereGeometry(.09,10,8),spiderBody,g);ab.scale.set(1,.8,1.25);ab.position.set(0,.09,-.07);const hd=add(new THREE.SphereGeometry(.055,8,6),spiderBody,g);hd.position.set(0,.08,.06);for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.012,5,4),eyeMat);e.position.set(s*.022,.1,.105);g.add(e)}
 const legs=[];for(let i=0;i<8;i++){const s=i<4?-1:1,k=i%4,leg=new THREE.Group();leg.position.set(s*.04,.08,.05-k*.035);leg.rotation.y=s*(.5-k*.33);g.add(leg);const up=add(new THREE.BoxGeometry(.12,.012,.012),spiderBody,leg,false);up.position.set(s*.06,.03,0);up.rotation.z=s*.5;const lo=add(new THREE.BoxGeometry(.012,.11,.012),spiderBody,leg,false);lo.position.set(s*.115,.005,0);legs.push({leg,s,k})}
 g.scale.setScalar(sc);root.add(g);return{g,legs}}
// Circuit de la poursuite : l'anneau de sol dégagé tout autour du damier.
const RX=BX+.42,RZ=BZ+.42,ring=[[-RX,-RZ],[RX,-RZ],[RX,RZ],[-RX,RZ]],rLen=ring.map((p,i)=>{const q=ring[(i+1)%4];return Math.hypot(q[0]-p[0],q[1]-p[1])}),rTot=rLen.reduce((a,b)=>a+b,0);
function onRing(d){d=((d%rTot)+rTot)%rTot;let i=0;while(d>rLen[i]){d-=rLen[i];i++}const p=ring[i],q=ring[(i+1)%4],k=d/rLen[i];return{x:p[0]+(q[0]-p[0])*k,z:p[1]+(q[1]-p[1])*k,yaw:Math.atan2(q[0]-p[0],q[1]-p[1])}}
const runners=[[0x4a78b8,0],[0xb8873a,.55]].map(([shirt,off])=>({m:miner(shirt,false),off,yaw:0})),spiders=(software?[1.5,2.1]:[1.4,1.85,2.3,2.8,3.3]).map((off,i)=>({s:spider(.8+rnd()*.5),off,side:(i%2?1:-1)*(.06+rnd()*.1),p:rnd()*6,yaw:0}));
let chaseD=rnd()*rTot,lastT=0;const turn=(o,yaw,dt)=>{let d=yaw-o.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));o.yaw+=d*Math.min(1,dt*9+(dt?0:1))};
updates.push((t,l,moving)=>{const dt=Math.min(.1,Math.max(0,t-lastT));lastT=t;if(moving)chaseD+=1.5*dt;
 for(const R of runners){const p=onRing(chaseD-R.off);turn(R,p.yaw,dt);const ph=t*13+R.off*9,bob=moving?Math.abs(Math.sin(ph))*.05:0;R.m.g.position.set(p.x,floorH(p.x,p.z)+bob,p.z);R.m.g.rotation.set(.22,R.yaw,0,'YXZ');R.m.legs[0].rotation.x=moving?Math.sin(ph)*1:0;R.m.legs[1].rotation.x=moving?-Math.sin(ph)*1:0;R.m.arms[0].rotation.set(-2.7+Math.sin(ph*1.3)*.25,0,-.35);R.m.arms[1].rotation.set(-2.7+Math.cos(ph*1.3)*.25,0,.35)}
 for(const S of spiders){const p=onRing(chaseD-S.off),sx=Math.cos(p.yaw)*S.side,sz=-Math.sin(p.yaw)*S.side;turn(S,p.yaw,dt);const x=p.x+sx,z=p.z+sz;S.s.g.position.set(x,floorH(x,z)+(moving?Math.abs(Math.sin(t*9+S.p))*.02:0),z);S.s.g.rotation.y=S.yaw;for(const L of S.s.legs)L.leg.rotation.z=moving?Math.sin(t*26+S.p+L.k*1.6+(L.s>0?Math.PI:0))*.35:0}});
// v248 — Les vrais modèles remplacent les figurines dès qu'ils sont chargés : Mineurs (course et attaque) et Araignées.
if(!software&&helpers.spawnWalker){const swap=(fig,model,h)=>{model.group.position.copy(fig.position);model.group.rotation.copy(fig.rotation);fig.visible=false;fig.add?.(new THREE.Group());root.add(model.group);return model};
 runners.forEach((R,i)=>setTimeout(()=>helpers.spawnWalker('mineur',.9,'walk').then(m=>{if(!m)return;R.real=swap(R.m.g,m)}),400+i*500));
 diggers.forEach((D,i)=>setTimeout(()=>helpers.spawnWalker('mineur',.9,'spell').then(m=>{if(!m)return;D.real=swap(D.m.g,m);m.group.add(D.spark);D.m.g.remove(D.spark)}),1500+i*500));
 const tints=[null,'#ff4a24','#9df5b8',null,'#c6f1ff'];spiders.forEach((S,i)=>setTimeout(()=>helpers.spawnWalker('araignee',.3,null,tints[i%tints.length]).then(m=>{if(!m)return;S.real=swap(S.s.g,m)}),2500+i*300))}
let lastReal=0;updates.push((t,l,moving)=>{const dt=Math.min(.1,Math.max(0,t-lastReal));lastReal=t;
 for(const R of runners)if(R.real){R.real.group.position.copy(R.m.g.position);R.real.group.position.y=R.m.g.position.y-(moving?Math.abs(Math.sin(t*13+R.off*9))*.05:0);R.real.group.rotation.y=R.yaw;if(moving)R.real.update(dt)}
 for(const D of diggers)if(D.real&&moving)D.real.update(dt);
 for(const S of spiders)if(S.real){S.real.group.position.copy(S.s.g.position);S.real.group.rotation.y=S.yaw;S.real.group.rotation.z=moving?Math.sin(t*30+S.p)*.05:0}});
return{root,update(t,light,moving){for(const u of updates)u(t,light,moving)}};
}
