/* v246 — Terrain neutre « La grotte souterraine » : une salle creusée dans la roche, entre mine et grotte naturelle.
   Le damier est un sol de dalles de roche polie (une par case), bien éclairé. Autour : parois rocheuses, stalagmites,
   cristaux bleus et violets qui luisent, champignons phosphorescents, étais de mine en bois, rails et wagonnet,
   torches qui vacillent, bassin souterrain, gouttes qui tombent et chauves-souris. Aucun élément n'est favorisé.
   Coordonnées réelles des cases (root.scale.z = 1/ZS appliqué par clearing-v105.js). */
import * as THREE from 'three';
export function createCave(world,software=false,rows=10){
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
for(let i=0;i<(software?10:24);i++){let x,z;do{x=(rnd()*2-1)*(FX-.9);z=(rnd()*2-1)*(FZ-.9)}while(outside(x,z)<.5);const front=z>BZ||x>BX;crag(x,z,(front?.35:.6)+rnd()*(front?.3:.7),.12+rnd()*.12,i*3.3)}

// ---------- 4. Cristaux lumineux et champignons phosphorescents ----------
const crystalCols=[[0x8fd8ff,0x2a7fd6],[0xc9a2ff,0x7a3fe0],[0x9ff0e0,0x2aa892]];const glows=[];
function crystals(x,z,s,k){const [c,e]=crystalCols[k%3],m=new THREE.MeshPhysicalMaterial({color:c,emissive:e,emissiveIntensity:.9,roughness:.1,transparent:true,opacity:.9,flatShading:true,clearcoat:1});const g=new THREE.Group();g.position.set(x,floorH(x,z),z);root.add(g);
 for(let i=0;i<5+Math.floor(rnd()*3);i++){const sh=add(new THREE.OctahedronGeometry(1,0),m,g,false);const h=s*(.35+rnd()*.7)*(i?1:1.5);sh.scale.set(s*.11,h,s*.11);sh.position.set((rnd()-.5)*s*.4,h*.55,(rnd()-.5)*s*.4);sh.rotation.set((rnd()-.5)*.7,rnd()*6,(rnd()-.5)*.7)}
 const gl=glow(c,s*1.6,.5);gl.position.y=s*.4;g.add(gl);glows.push({gl,m,p:rnd()*6})}
let ck=0;for(const [x,z,s] of[[-5.6,-FZ+2,.9],[5.3,-FZ+2.2,.7],[-5.4,1.5,.6],[5.4,-1.4,.55],[-5.2,HZ-.2,.6],[5.2,HZ+.6,.5],[-2.6,-BZ-.8,.5],[2.9,-BZ-.9,.6],[0,-FZ+1.3,.75]])if(outside(x,z)>.4)crystals(x,z,s,ck++);
updates.push((t,l,moving)=>{for(const G of glows){const k=moving?Math.sin(t*1.4+G.p):0;G.gl.material.opacity=.42+k*.12;G.m.emissiveIntensity=.8+k*.25}});
const capGeo=new THREE.SphereGeometry(1,10,6,0,Math.PI*2,0,Math.PI/2),shroomCap=new THREE.MeshStandardMaterial({color:0x6ff2e0,emissive:0x1fbfa8,emissiveIntensity:1.1,roughness:.5}),shroomStem=mat(0xd9e8e0);
for(let i=0;i<(software?10:26);i++){let x,z;do{x=(rnd()*2-1)*(FX-.7);z=(rnd()*2-1)*(FZ-.7)}while(outside(x,z)<.35);const y=floorH(x,z),s=.05+rnd()*.06,h=s*(1.6+rnd());const st=add(new THREE.CylinderGeometry(s*.3,s*.4,h,6),shroomStem,root,false);st.position.set(x,y+h/2,z);const cp=add(capGeo,shroomCap,root,false);cp.scale.set(s,s*.6,s);cp.position.set(x,y+h,z)}
updates.push((t,l,moving)=>{shroomCap.emissiveIntensity=1+(moving?Math.sin(t*.9)*.25:0)});

// ---------- 5. La mine : étais de bois, rails, wagonnet ----------
const timber=mat(0x6b4a2e);
for(const [x,z,ry] of[[-5.7,-3.2,Math.PI/2],[-5.7,3.4,Math.PI/2],[0,-FZ+1.05,0]]){const g=new THREE.Group();g.position.set(x,floorH(x,z),z);g.rotation.y=ry;root.add(g);for(const s of[-.55,.55]){const p=add(new THREE.BoxGeometry(.14,1.5,.14),timber,g);p.position.set(s,.75,0)}const top=add(new THREE.BoxGeometry(1.4,.16,.18),timber,g);top.position.y=1.52;const lamp=glow(0xffb45a,.6,.8);lamp.position.set(0,1.3,.1);g.add(lamp);const lb=add(new THREE.SphereGeometry(.05,8,6),new THREE.MeshBasicMaterial({color:0xffd27a}),g,false);lb.position.set(0,1.32,.1)}
const rail=mat(0x5d5d63,{metalness:.7,roughness:.4});{const rz=-FZ+1.95;for(const off of[-.13,.13]){const r=add(new THREE.BoxGeometry(FX*2-1.4,.03,.04),rail,root,false);r.position.set(0,floorH(0,rz)+.06,rz+off)}for(let x=-FX+.8;x<=FX-.8;x+=.35){const sl=add(new THREE.BoxGeometry(.08,.04,.4),timber,root,false);sl.position.set(x,floorH(x,rz)+.03,rz)}
 const cart=new THREE.Group();root.add(cart);const body=add(new THREE.BoxGeometry(.6,.32,.38),mat(0x4f4a45,{metalness:.5,roughness:.5}),cart);body.position.y=.28;const ore=add(new THREE.SphereGeometry(.2,8,6),mat(0x6b5a48,{flatShading:true}),cart);ore.scale.set(1.2,.45,.75);ore.position.y=.45;for(let i=0;i<3;i++){const g2=add(new THREE.OctahedronGeometry(.05,0),new THREE.MeshBasicMaterial({color:0x9fe0ff}),cart,false);g2.position.set(-.15+i*.15,.52,0)}for(const sx of[-.2,.2])for(const sz of[-.13,.13]){const w=add(new THREE.CylinderGeometry(.08,.08,.04,10),rail,cart);w.rotation.x=Math.PI/2;w.position.set(sx,.08,sz)}
 updates.push((t,l,moving)=>{const k=moving?Math.sin(t*.18):-.6,x=k*(FX-2.2);cart.position.set(x,floorH(x,rz)+.04,rz)})}

// ---------- 6. Torches qui vacillent ----------
const flameTex=canvasTex(64,64,g=>{const r=g.createRadialGradient(32,44,2,32,36,30);r.addColorStop(0,'rgba(255,250,200,1)');r.addColorStop(.35,'rgba(255,180,60,.9)');r.addColorStop(1,'rgba(255,80,10,0)');g.fillStyle=r;g.beginPath();g.ellipse(32,36,16,28,0,0,7);g.fill()});
const torches=[];for(const [x,z] of[[-4.8,-BZ+.3],[4.8,-BZ+.3],[-4.8,0],[4.8,0],[-4.8,BZ-.3],[4.8,BZ-.3]]){const y=floorH(x,z);const st=add(new THREE.CylinderGeometry(.035,.05,.9,6),timber);st.position.set(x,y+.45,z);const bowl=add(new THREE.CylinderGeometry(.09,.05,.1,8),mat(0x3c3c3c,{metalness:.6}));bowl.position.set(x,y+.93,z);const f=new THREE.Sprite(new THREE.SpriteMaterial({map:flameTex,transparent:true,depthWrite:false}));f.center.set(.5,.15);f.position.set(x,y+.96,z);f.scale.set(.22,.34,1);root.add(f);const gl=glow(0xff9a3a,1.5,.6);gl.position.set(x,y+1.05,z);root.add(gl);torches.push({f,gl,p:rnd()*6})}
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

return{root,update(t,light,moving){for(const u of updates)u(t,light,moving)}};
}
