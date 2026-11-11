/* v240 — Terrain glace « La Route vers Forfalla », entièrement repensé.
   Le damier est une route de dalles de glace bleutée ; la neige tassée dans les joints dessine le quadrillage.
   Autour : congères, sapins chargés de neige, cristaux de givre, glaçons sous la chaussée, pics enneigés et la porte
   de Forfalla au fond, aurore boréale, lanternes et neige qui tombe. Hors damier, sur la rive gauche, un élémentaire
   de feu et un élémentaire de glace se disputent sans fin (boules de feu contre éclats de glace).
   Coordonnées réelles des cases (root.scale.z = 1/ZS appliqué par clearing-v105.js). Règles : moteur du jeu. */
import * as THREE from 'three';
export function createFrostRoad(world,software=false,rows=10){
const root=new THREE.Group();world.add(root);root.visible=false;
let seed=5381;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const HZ=rows/2,BX=4.3,BZ=HZ+.3,TOP=.2,FX=7.2,FZ=HZ+2.45;
const mix=(a,b,t)=>a+(b-a)*t,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
const noise=(x,z)=>Math.sin(x*2.71+Math.sin(z*1.9))*Math.cos(z*2.31-x*.61)*.5+Math.sin(x*7.1+z*5.3)*.15;
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.9,...extra});
const add=(geo,material,parent=root,shadow=!software)=>{const m=new THREE.Mesh(geo,material);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m};
const canvasTex=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t};
const updates=[],cellX=x=>x-3.5,cellZ=y=>y-(rows-1)/2,outside=(x,z)=>Math.max(Math.abs(x)-BX,Math.abs(z)-BZ);
const dotTex=canvasTex(32,32,g=>{const r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.45,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,32,32)});
const glow=(color,size,opacity=.8,normal=false)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color,transparent:true,depthWrite:false,blending:normal?THREE.NormalBlending:THREE.AdditiveBlending,opacity}));s.scale.setScalar(size);return s};

// ---------- 1. Neige : congères douces jusqu'au cadre ----------
const snowTex=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#e3edf4';g.fillRect(0,0,w,h);for(let i=0;i<7000;i++){const v=rnd();g.fillStyle=v>.55?`rgba(255,255,255,${.3+rnd()*.5})`:`rgba(150,180,205,${.05+rnd()*.12})`;const r=.4+rnd()*1.4;g.beginPath();g.arc(rnd()*w,rnd()*h,r,0,7);g.fill()}for(let i=0;i<60;i++){g.strokeStyle=`rgba(160,190,215,${.08+rnd()*.1})`;g.lineWidth=1+rnd()*2;g.beginPath();const x=rnd()*w,y=rnd()*h;g.moveTo(x,y);g.bezierCurveTo(x+20,y-8,x+50,y+6,x+80,y-3);g.stroke()}});snowTex.repeat.set(5,5*(rows+5)/15);
function groundH(x,z){const d=outside(x,z);if(d<0)return TOP-.25;const r=smooth(0,.7,d);return mix(TOP-.25,.12,r)+r*(Math.max(0,d-.7)*.12+noise(x*.7,z*.7)*.1+Math.sin(x*1.3+z*.4)*.04)}
const groundGeo=new THREE.PlaneGeometry(FX*2,FZ*2,software?40:110,software?44:120);groundGeo.rotateX(-Math.PI/2);{const p=groundGeo.attributes.position,c=[];for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=groundH(x,z);p.setY(i,y);const shade=smooth(-.3,.4,noise(x*.9+2,z*.9))*.5,col=new THREE.Color(0xe4eef5).lerp(new THREE.Color(0x8fb0c8),shade*.75);c.push(col.r,col.g,col.b)}groundGeo.setAttribute('color',new THREE.Float32BufferAttribute(c,3));groundGeo.computeVertexNormals()}
add(groundGeo,mat(0xffffff,{vertexColors:true,map:snowTex,bumpMap:snowTex,bumpScale:.03,roughness:.8}),root,false).renderOrder=-2;

// ---------- 2. La route : socle de pierre givrée, dalles de glace, neige dans les joints ----------
const stoneTex=canvasTex(256,64,(g,w,h)=>{g.fillStyle='#6d7f8d';g.fillRect(0,0,w,h);for(let x=0;x<w;x+=18+rnd()*14){g.fillStyle=`rgba(${80+rnd()*40},${95+rnd()*40},${110+rnd()*40},.9)`;g.fillRect(x,0,16+rnd()*12,h)}g.strokeStyle='rgba(40,52,64,.7)';g.lineWidth=2;for(let x=0;x<w;x+=24+rnd()*10){g.beginPath();g.moveTo(x,0);g.lineTo(x+(rnd()-.5)*4,h);g.stroke()}g.fillStyle='rgba(245,250,255,.85)';g.fillRect(0,0,w,7)});stoneTex.repeat.set(4,1);
const plinth=add(new THREE.BoxGeometry(BX*2,.9,BZ*2),[mat(0xffffff,{map:stoneTex}),mat(0xffffff,{map:stoneTex}),mat(0xdfe9f0),mat(0x5b6b78),mat(0xffffff,{map:stoneTex}),mat(0xffffff,{map:stoneTex})]);plinth.position.y=TOP-.53;
const joint=add(new THREE.PlaneGeometry(8.06,rows+.06),mat(0xf7fbff,{roughness:.75,map:snowTex}),root,false);joint.rotation.x=-Math.PI/2;joint.position.y=TOP-.07;
const iceTex=canvasTex(128,128,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#e6f6ff');gr.addColorStop(.5,'#c4e6f7');gr.addColorStop(1,'#dff2fc');g.fillStyle=gr;g.fillRect(0,0,w,h);
 for(let i=0;i<5;i++){g.strokeStyle=`rgba(255,255,255,${.35+rnd()*.35})`;g.lineWidth=.6+rnd()*.9;g.beginPath();let x=rnd()*w,y=rnd()*h;g.moveTo(x,y);for(let k=0;k<5;k++){x+=(rnd()-.5)*46;y+=(rnd()-.5)*46;g.lineTo(x,y)}g.stroke()}
 for(let i=0;i<14;i++){g.strokeStyle='rgba(255,255,255,.45)';g.lineWidth=.6;g.beginPath();g.arc(rnd()*w,rnd()*h,.8+rnd()*2,0,7);g.stroke()}
g.strokeStyle='rgba(255,255,255,.75)';g.lineWidth=5;g.strokeRect(2.5,2.5,w-5,h-5);g.strokeStyle='rgba(120,170,200,.35)';g.lineWidth=1.5;g.strokeRect(7,7,w-14,h-14)});
const slabGeo=new THREE.BoxGeometry(.92,.1,.92);slabGeo.translate(0,-.05,0);
const iceMat=new THREE.MeshPhysicalMaterial({color:0xffffff,map:iceTex,roughness:.12,metalness:.04,clearcoat:1,clearcoatRoughness:.12,sheen:0});
const slabs=new THREE.InstancedMesh(slabGeo,iceMat,8*rows),dummy=new THREE.Object3D();let si=0;
for(let y=0;y<rows;y++)for(let x=0;x<8;x++){dummy.position.set(cellX(x),TOP,cellZ(y));dummy.rotation.set(0,(rnd()-.5)*.025,0);dummy.updateMatrix();slabs.setMatrixAt(si,dummy.matrix);const c=new THREE.Color((x+y)%2?0xbfe0f2:0x96c6e2);c.offsetHSL(0,0,(rnd()-.5)*.03);slabs.setColorAt(si++,c)}
slabs.count=si;slabs.castShadow=false;slabs.receiveShadow=true;root.add(slabs);
// Reflets qui glissent lentement sur la glace (un seul plan additif, discret).
const sheenTex=canvasTex(256,32,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.45,'rgba(255,255,255,0)');gr.addColorStop(.5,'rgba(255,255,255,.55)');gr.addColorStop(.55,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,w,h)});
const sheen=new THREE.Mesh(new THREE.PlaneGeometry(8,rows),new THREE.MeshBasicMaterial({map:sheenTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.35}));sheen.rotation.x=-Math.PI/2;sheen.rotation.z=.6;sheen.position.y=TOP+.004;sheen.renderOrder=1;if(!software)root.add(sheen);
updates.push((t,l,moving)=>{if(moving)sheenTex.offset.x=(t*.03)%1});
// Bordure : margelle de pierre coiffée de neige, glaçons qui pendent sous la chaussée.
const curbMat=mat(0x7b8c99,{map:stoneTex}),capMat=mat(0xffffff,{roughness:.7,map:snowTex});
for(const s of[-1,1]){const a=add(new THREE.BoxGeometry(BX*2+.06,.14,.28),curbMat);a.position.set(0,TOP+.0,s*(BZ-.14));const b=add(new THREE.BoxGeometry(.28,.14,BZ*2-.56),curbMat);b.position.set(s*(BX-.14),TOP,0);
 const ca=add(new THREE.CapsuleGeometry(.08,BX*2-.1,3,8).rotateZ(Math.PI/2),capMat);ca.scale.set(1,.55,1.5);ca.position.set(0,TOP+.08,s*(BZ-.14));const cb=add(new THREE.CapsuleGeometry(.08,BZ*2-.5,3,8).rotateX(Math.PI/2),capMat);cb.scale.set(1.5,.55,1);cb.position.set(s*(BX-.14),TOP+.08,0)}
const icicleGeo=new THREE.ConeGeometry(.035,1,5);icicleGeo.rotateX(Math.PI);icicleGeo.translate(0,-.5,0);const icicles=new THREE.InstancedMesh(icicleGeo,new THREE.MeshPhysicalMaterial({color:0xd8f1ff,roughness:.1,transparent:true,opacity:.85,clearcoat:1}),software?60:150);let ii=0;
for(let i=0;i<icicles.count;i++){const side=i%4,u=rnd()*2-1;let x,z;if(side<2){x=u*(BX-.05);z=(side?1:-1)*(BZ+.01)}else{z=u*(BZ-.05);x=(side===2?1:-1)*(BX+.01)}dummy.position.set(x,TOP-.08,z);dummy.rotation.set(0,0,0);const h=.08+Math.pow(rnd(),2)*.3;dummy.scale.set(.6+rnd()*.7,h,.6+rnd()*.7);dummy.updateMatrix();icicles.setMatrixAt(ii++,dummy.matrix)}root.add(icicles);

// ---------- 3. Sapins chargés de neige, rochers, cristaux de givre ----------
const pineMat=mat(0x2f5a4e,{roughness:.85}),pineDark=mat(0x24463e),trunkMat=mat(0x5a4032),snowCap=mat(0xf6fbff,{roughness:.6});
const tierGeo=new THREE.ConeGeometry(1,1,8,1),capGeo=new THREE.ConeGeometry(1,1,8,1,true);
function pine(x,z,s){const g=new THREE.Group();g.position.set(x,groundH(x,z),z);g.rotation.y=rnd()*6;root.add(g);const tr=add(new THREE.CylinderGeometry(.05*s,.08*s,.4*s,6),trunkMat,g);tr.position.y=.2*s;
 for(let k=0;k<4;k++){const r=(.62-k*.13)*s,h=(.62-k*.08)*s,y=(.3+k*.33)*s;const c=add(tierGeo,k%2?pineDark:pineMat,g);c.scale.set(r,h,r);c.position.y=y+h/2;const sn=add(capGeo,snowCap,g);sn.scale.set(r*.82,h*.42,r*.82);sn.position.y=y+h*.82}
 return g}
const pineSpots=[];const duelZone=(x,z,pad=0)=>x<-4.5+pad&&Math.abs(z)<3.9+pad;const tryPine=(x,z,s)=>{if(outside(x,z)<.55||duelZone(x,z,.3))return;if(pineSpots.some(([a,b,r])=>Math.hypot(a-x,b-z)<(r+s)*.55))return;pineSpots.push([x,z,s]);pine(x,z,s)};
for(const [x,z,s] of[[-6.4,-FZ+2.6,1.3],[6.3,-FZ+2.4,1.25],[-6.5,-4.6,1.05],[-6.5,3.9,1.15],[6.6,-.6,1.0],[6.5,3.3,.95],[-5.2,FZ-1.2,.8],[5.6,FZ-1.1,.75],[-6.7,4.6,.8],[6.7,1.5,.8]])tryPine(x,z,s);
for(let i=0;i<(software?6:16);i++){const side=rnd()>.5?1:-1;tryPine(side*(5.2+rnd()*1.8),(rnd()*2-1)*(FZ-1.2),.55+rnd()*.5)}
const rockMat=mat(0x6f7f8c,{flatShading:true});const rockGeo=new THREE.IcosahedronGeometry(1,1);{const p=rockGeo.attributes.position;for(let i=0;i<p.count;i++){const n=noise(p.getX(i)*3,p.getZ(i)*3+p.getY(i));p.setXYZ(i,p.getX(i)*(1+n*.2),p.getY(i)*(1+n*.15),p.getZ(i)*(1+n*.2))}rockGeo.computeVertexNormals()}
for(let i=0;i<(software?10:22);i++){const side=rnd()>.5?1:-1,alongX=rnd()>.4,x=alongX?side*(4.9+rnd()*2.1):(rnd()*2-1)*6.4,z=alongX?(rnd()*2-1)*(FZ-.7):(rnd()>.5?1:-1)*(BZ+.7+rnd()*1.2);if(outside(x,z)<.45||duelZone(x,z,.2))continue;const s=.1+Math.pow(rnd(),1.5)*.28,m=add(rockGeo,rockMat);m.position.set(x,groundH(x,z)+s*.2,z);m.scale.set(s,s*.7,s*(.7+rnd()*.4));m.rotation.y=rnd()*6;const cap=add(rockGeo,snowCap);cap.position.set(x,groundH(x,z)+s*.55,z);cap.scale.set(s*.85,s*.3,s*.8*(.7+rnd()*.4))}
const crystalMat=new THREE.MeshPhysicalMaterial({color:0xaee6ff,emissive:0x2a7fb0,emissiveIntensity:.45,roughness:.08,transparent:true,opacity:.88,clearcoat:1,flatShading:true});
const shardGeo=new THREE.OctahedronGeometry(1,0);
function crystals(x,z,s){const g=new THREE.Group();g.position.set(x,groundH(x,z),z);root.add(g);for(let k=0;k<4+Math.floor(rnd()*3);k++){const m=add(shardGeo,crystalMat,g);const h=s*(.4+rnd()*.7);m.scale.set(s*.12,h,s*.12);m.position.set((rnd()-.5)*s*.4,h*.6,(rnd()-.5)*s*.4);m.rotation.set((rnd()-.5)*.6,rnd()*6,(rnd()-.5)*.6)}const gl=glow(0x9fe3ff,s*1.2,.35);gl.position.y=s*.35;g.add(gl)}
for(const [x,z,s] of[[5.4,-3.2,.8],[-5.3,-5.2,.7],[5.3,5.0,.6],[-5.0,5.3,.7],[2.7,-BZ-.8,.55],[-3.2,BZ+.9,.5],[3.4,BZ+1,.45]])if(outside(x,z)>.4)crystals(x,z,s);

// ---------- 4. Les pics et la porte de Forfalla, au bout de la route ----------
const peakGeo=(h,r,k)=>{const g=new THREE.ConeGeometry(r,h,7,6);g.translate(0,h/2,0);const p=g.attributes.position,c=[];for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),n=noise(x*2.3+k,z*2.3+y*.8);if(y<h*.98){p.setX(i,x*(1+n*.22));p.setZ(i,z*(1+n*.22))}const snow=smooth(h*.42,h*.58,y+n*h*.12),col=new THREE.Color(0x5d6f7e).lerp(new THREE.Color(0x8193a1),smooth(-.3,.4,n)*.5).lerp(new THREE.Color(0xf4f9fd),snow);c.push(col.r,col.g,col.b)}g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.computeVertexNormals();return g};
const peakMat=mat(0xffffff,{vertexColors:true,flatShading:true,roughness:.85});
for(const [x,h,r] of[[-6.1,2.5,1.05],[-4.4,1.9,.9],[-2.6,1.5,.85],[2.7,1.6,.85],[4.5,2.1,.95],[6.2,2.7,1.05],[-5.3,1.3,.7],[5.4,1.4,.7]]){const z=-FZ+.95+(rnd()-.5)*.25;const m=add(peakGeo(h,r,x),peakMat);m.position.set(x,groundH(x,z)-.05,z);m.rotation.y=rnd()*6}
// Route pavée qui file du damier vers la porte.
const cobTex=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#e9f1f6';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=16)for(let x=(y/16%2)*10;x<w;x+=20){g.fillStyle=`rgb(${110+rnd()*30},${125+rnd()*30},${140+rnd()*30})`;g.beginPath();g.ellipse(x+9,y+8,8,6,0,0,7);g.fill()}});cobTex.repeat.set(1,2);
const roadLen=FZ-BZ,road=add(new THREE.PlaneGeometry(2.1,roadLen),mat(0xffffff,{map:cobTex,roughness:.8}),root,false);road.rotation.x=-Math.PI/2;road.position.set(0,.13,-BZ-roadLen/2);
const gateStone=mat(0x8a9aa7,{map:stoneTex}),gz=-FZ+1.05;
for(const s of[-1,1]){const pil=add(new THREE.BoxGeometry(.42,1.7,.42),gateStone);pil.position.set(s*1.25,.98,gz);const top=add(new THREE.BoxGeometry(.52,.14,.52),gateStone);top.position.set(s*1.25,1.9,gz);const cap=add(new THREE.SphereGeometry(.24,10,6,0,Math.PI*2,0,Math.PI/2),snowCap);cap.scale.y=.5;cap.position.set(s*1.25,1.97,gz);
 const ban=new THREE.Mesh(new THREE.PlaneGeometry(.34,.85),new THREE.MeshStandardMaterial({map:canvasTex(64,160,(g,w,h)=>{g.fillStyle='#24507e';g.fillRect(0,0,w,h-20);g.beginPath();g.moveTo(0,h-20);g.lineTo(w/2,h);g.lineTo(w,h-20);g.fill();g.strokeStyle='#d9ecff';g.lineWidth=3;g.strokeRect(5,5,w-10,h-34);g.translate(w/2,62);for(let k=0;k<6;k++){g.rotate(Math.PI/3);g.beginPath();g.moveTo(0,0);g.lineTo(0,-20);g.moveTo(0,-12);g.lineTo(6,-17);g.moveTo(0,-12);g.lineTo(-6,-17);g.stroke()}}),side:THREE.DoubleSide,roughness:.8}));ban.position.set(s*1.25,1.25,gz+.23);root.add(ban);updates.push((t,l,moving)=>{ban.rotation.x=moving?Math.sin(t*1.3+s)*.06:0;ban.rotation.y=moving?Math.sin(t*.9+s)*.08:0});
 const lamp=glow(0xffc77a,.55,.85);lamp.position.set(s*1.25,1.62,gz+.3);root.add(lamp);const bulb=add(new THREE.SphereGeometry(.06,8,6),new THREE.MeshBasicMaterial({color:0xffd99a}),root,false);bulb.position.copy(lamp.position)}
const arch=add(new THREE.TorusGeometry(1.25,.13,8,24,Math.PI),gateStone);arch.position.set(0,1.9,gz);const archSnow=add(new THREE.TorusGeometry(1.25,.09,6,24,Math.PI),snowCap);archSnow.position.set(0,1.98,gz);archSnow.scale.set(1,1.02,1.2);
const key=add(new THREE.OctahedronGeometry(.16,0),crystalMat);key.position.set(0,3.15,gz);updates.push((t,l,moving)=>{key.rotation.y=moving?t*.6:0});const keyGlow=glow(0x9fe3ff,.9,.6);keyGlow.position.copy(key.position);root.add(keyGlow);

// ---------- 5. Lanternes le long de la route ----------
for(const [x,z] of[[-4.75,-3.6],[-4.75,3.6],[4.75,-3.6],[4.75,3.6],[-4.75,-BZ+.3],[4.75,-BZ+.3]]){const y=groundH(x,z);const post=add(new THREE.CylinderGeometry(.03,.04,.62,6),mat(0x3b3f48,{metalness:.5,roughness:.5}));post.position.set(x,y+.31,z);const box=add(new THREE.BoxGeometry(.13,.15,.13),new THREE.MeshBasicMaterial({color:0xffd18a}),root,false);box.position.set(x,y+.68,z);const roof=add(new THREE.ConeGeometry(.12,.08,4),snowCap);roof.position.set(x,y+.79,z);roof.rotation.y=Math.PI/4;const gl=glow(0xffb866,.6,.7);gl.position.set(x,y+.68,z);root.add(gl);updates.push((t,l,moving)=>{gl.material.opacity=.62+(moving?Math.sin(t*3.1+x*z)*.08:0)})}

// ---------- 6. La dispute des élémentaires (rive gauche, hors damier) ----------
const DX=-5.8,DS=1.6,DZ=2.1/DS;// échelle du duel : bien visible depuis la caméra
const duel=new THREE.Group();duel.name='elemental-duel';duel.position.set(DX,groundH(DX,0),0);duel.scale.setScalar(DS);root.add(duel);
const groundAt=z=>(groundH(DX,z*DS)-duel.position.y)/DS;
// Sol : flaque fondue côté feu, étoile de givre côté glace.
const puddle=new THREE.Mesh(new THREE.CircleGeometry(.6,24),new THREE.MeshPhysicalMaterial({color:0x5c7488,roughness:.05,clearcoat:1,transparent:true,opacity:.85}));puddle.rotation.x=-Math.PI/2;puddle.position.set(0,groundAt(DZ)+.03,DZ);duel.add(puddle);
const scorch=new THREE.Mesh(new THREE.RingGeometry(.55,.8,24),new THREE.MeshBasicMaterial({color:0x3a3330,transparent:true,opacity:.35,depthWrite:false}));scorch.rotation.x=-Math.PI/2;scorch.position.set(0,groundAt(DZ)+.025,DZ);duel.add(scorch);
const frostStar=new THREE.Mesh(new THREE.CircleGeometry(.75,6),new THREE.MeshBasicMaterial({map:canvasTex(128,128,(g,w,h)=>{g.translate(64,64);g.strokeStyle='rgba(200,240,255,.9)';g.lineCap='round';for(let k=0;k<6;k++){g.rotate(Math.PI/3);g.lineWidth=4;g.beginPath();g.moveTo(0,0);g.lineTo(0,-58);g.stroke();g.lineWidth=2.5;for(const d of[20,36]){g.beginPath();g.moveTo(0,-d);g.lineTo(12,-d-12);g.moveTo(0,-d);g.lineTo(-12,-d-12);g.stroke()}}}),transparent:true,depthWrite:false}));frostStar.rotation.x=-Math.PI/2;frostStar.position.set(0,groundAt(-DZ)+.03,-DZ);duel.add(frostStar);
// Élémentaire de feu : roche volcanique fendue de lave, couronne et mains de flammes.
const lavaCrack=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#2a1612';g.fillRect(0,0,w,h);g.strokeStyle='#ff7a1e';for(let i=0;i<14;i++){g.lineWidth=1+rnd()*2.5;g.beginPath();let x=rnd()*w,y=rnd()*h;g.moveTo(x,y);for(let k=0;k<4;k++){x+=(rnd()-.5)*40;y+=(rnd()-.5)*40;g.lineTo(x,y)}g.stroke()}});
const emberRock=new THREE.MeshStandardMaterial({color:0x2e1a16,map:lavaCrack,emissive:0xffffff,emissiveMap:lavaCrack,emissiveIntensity:2.4,roughness:.8,flatShading:true});
const flameTex=canvasTex(128,128,g=>{const fg=g.createRadialGradient(64,99,2,64,75,59);fg.addColorStop(0,'rgba(255,251,193,1)');fg.addColorStop(.18,'rgba(255,213,80,.95)');fg.addColorStop(.43,'rgba(255,112,20,.72)');fg.addColorStop(.72,'rgba(205,31,10,.17)');fg.addColorStop(1,'rgba(170,15,5,0)');g.fillStyle=fg;g.beginPath();g.moveTo(30,123);g.bezierCurveTo(12,93,52,72,57,12);g.bezierCurveTo(89,48,75,60,98,84);g.bezierCurveTo(113,113,85,129,30,123);g.fill()});
const flameSprites=[];const flameSprite=(parent,x,y,z,s)=>{const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:flameTex,transparent:true,depthWrite:false}));sp.center.set(.5,.15);sp.position.set(x,y,z);sp.scale.set(s,s*1.4,1);parent.add(sp);flameSprites.push({sp,s,p:rnd()*6});return sp};
const fire=new THREE.Group();fire.position.set(0,groundAt(DZ),DZ);duel.add(fire);const fireBody=new THREE.Group();fire.add(fireBody);
const rockShape=new THREE.IcosahedronGeometry(1,0);
const torso=add(rockShape,emberRock,fireBody);torso.scale.set(.26,.32,.22);torso.position.y=.78;const hips=add(rockShape,emberRock,fireBody);hips.scale.set(.18,.14,.16);hips.position.y=.46;
const head=add(rockShape,emberRock,fireBody);head.scale.setScalar(.15);head.position.y=1.18;flameSprite(fireBody,0,1.12,0,.7);flameSprite(fireBody,0,.6,0,.62);for(const s of[-1,1])flameSprite(fireBody,s*.26,.98,.04,.36);flameSprite(fireBody,0,.85,.12,.5);
for(const s of[-1,1]){const eye=add(new THREE.SphereGeometry(.028,6,4),new THREE.MeshBasicMaterial({color:0xfff2b0}),fireBody,false);eye.position.set(s*.055,1.2,-.13)}
const fireArms=[];for(const s of[-1,1]){const arm=new THREE.Group();arm.position.set(s*.34,.92,0);fireBody.add(arm);const fore=add(rockShape,emberRock,arm);fore.scale.set(.09,.2,.09);fore.position.y=-.16;const fist=add(rockShape,emberRock,arm);fist.scale.setScalar(.1);fist.position.y=-.36;flameSprite(arm,0,-.45,0,.42);fireArms.push(arm)}
const fireLight=software?null:new THREE.PointLight(0xff7a2a,2.2,3.2,1.6);if(fireLight){fireLight.position.set(0,1,0);fire.add(fireLight)}
// Élémentaire de glace : golem de cristaux, cœur lumineux, épaules hérissées.
const iceBodyMat=new THREE.MeshPhysicalMaterial({color:0x6ec3f0,emissive:0x1f6fa8,emissiveIntensity:.55,roughness:.06,clearcoat:1,transparent:true,opacity:.92,flatShading:true});
const ice=new THREE.Group();ice.position.set(0,groundAt(-DZ),-DZ);duel.add(ice);const iceBody=new THREE.Group();ice.add(iceBody);
const chest=add(shardGeo,iceBodyMat,iceBody);chest.scale.set(.27,.36,.22);chest.position.y=.8;const ihead=add(shardGeo,iceBodyMat,iceBody);ihead.scale.set(.13,.18,.13);ihead.position.y=1.28;
const legs=[];for(const s of[-1,1]){const leg=add(shardGeo,iceBodyMat,iceBody);leg.scale.set(.09,.24,.09);leg.position.set(s*.12,.3,0);legs.push(leg);const spike=add(shardGeo,crystalMat,iceBody);spike.scale.set(.06,.22,.06);spike.position.set(s*.27,1.12,0);spike.rotation.z=-s*.5}
const core=glow(0x2fb6ff,.5,.9,true);core.position.set(0,.82,-.08);iceBody.add(core);for(const s of[-1,1]){const eye=add(new THREE.SphereGeometry(.024,6,4),new THREE.MeshBasicMaterial({color:0xe9fbff}),iceBody,false);eye.position.set(s*.05,1.3,.1)}
const iceArms=[];for(const s of[-1,1]){const arm=new THREE.Group();arm.position.set(s*.34,.98,0);iceBody.add(arm);const a=add(shardGeo,iceBodyMat,arm);a.scale.set(.08,.24,.08);a.position.y=-.2;const hand=add(shardGeo,crystalMat,arm);hand.scale.set(.09,.12,.09);hand.position.y=-.45;iceArms.push(arm)}
const iceLight=software?null:new THREE.PointLight(0x7fd4ff,1.8,3,1.6);if(iceLight){iceLight.position.set(0,1,0);ice.add(iceLight)}
const frostMotes=[];for(let i=0;i<(software?3:8);i++){const g=glow(0x7fd4ff,.08,.9,true);ice.add(g);frostMotes.push({g,a:i/8*Math.PI*2,r:.35+rnd()*.2,p:rnd()*6})}
// Projectiles et impacts.
const fireball=new THREE.Group();duel.add(fireball);fireball.add(new THREE.Mesh(new THREE.SphereGeometry(.09,10,8),new THREE.MeshBasicMaterial({color:0xffa53a})));const fbGlow=glow(0xff7a22,.5,.85,true);fireball.add(fbGlow);const trail=[];for(let i=0;i<6;i++){const g=glow(0xff6a1a,.3-i*.035,.6-i*.08,true);duel.add(g);trail.push(g)}
const shard=new THREE.Group();duel.add(shard);const shardMesh=add(shardGeo,crystalMat,shard);shardMesh.scale.set(.06,.06,.2);const shGlow=glow(0x3fb4ff,.35,.8,true);shard.add(shGlow);const iceTrail=[];for(let i=0;i<5;i++){const g=glow(0x5cc4ff,.2-i*.03,.55-i*.08,true);duel.add(g);iceTrail.push(g)}
const burst=[];for(let i=0;i<(software?8:18);i++){const g=glow(0xffffff,.1,0,true);duel.add(g);burst.push({g,v:new THREE.Vector3((rnd()-.5)*2,rnd()*1.6+.3,(rnd()-.5)*2)})}
const steam=[];for(let i=0;i<4;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color:0xb8c8d4,transparent:true,depthWrite:false,opacity:0}));duel.add(s);steam.push(s)}
const PERIOD=4.6;
function arc(from,to,k,lift){return new THREE.Vector3(0,mix(from.y,to.y,k)+Math.sin(k*Math.PI)*lift,mix(from.z,to.z,k))}
updates.push((t,light,moving)=>{const T=moving?t:1.2,ph=(T%PERIOD)/PERIOD;
 // Respiration et lévitation
 fireBody.position.y=Math.sin(T*2.1)*.05+.05;iceBody.position.y=Math.sin(T*1.7+1)*.04+.04;
 const fPos=new THREE.Vector3(0,fire.position.y+.95,DZ-.3),iPos=new THREE.Vector3(0,ice.position.y+.95,-DZ+.3);
 // Phase 0-.12 : le feu arme ; .12-.42 : boule de feu ; .42-.5 : impact sur la glace ; .5-.62 : la glace arme ; .62-.9 : éclat ; .9-1 : impact sur le feu
 const windF=smooth(0,.12,ph)*(1-smooth(.12,.16,ph)),windI=smooth(.5,.62,ph)*(1-smooth(.62,.66,ph));
 fireArms[0].rotation.x=windF*2.2;fireArms[1].rotation.x=windF*1.2+Math.sin(T*3)*.1;iceArms[0].rotation.x=-windI*2.2;iceArms[1].rotation.x=-windI*1.1+Math.sin(T*2.6)*.08;// face à face le long de z : le feu regarde -z, la glace +z
 const fbK=clamp((ph-.12)/.3),shK=clamp((ph-.62)/.28);
 fireball.visible=moving&&fbK>0&&fbK<1;if(fireball.visible){fireball.position.copy(arc(fPos,iPos,fbK,.45));fbGlow.scale.setScalar(.55+Math.sin(T*30)*.06)}
 trail.forEach((g,i)=>{const k=fbK-(i+1)*.035;g.visible=fireball.visible&&k>0;if(g.visible)g.position.copy(arc(fPos,iPos,k,.45))});
 shard.visible=moving&&shK>0&&shK<1;if(shard.visible){const p=arc(iPos,fPos,shK,.3),n=arc(iPos,fPos,Math.min(1,shK+.02),.3);shard.position.copy(p);shard.lookAt(duel.localToWorld(n.clone()));shardMesh.rotation.z=T*12}
 iceTrail.forEach((g,i)=>{const k=shK-(i+1)*.03;g.visible=shard.visible&&k>0;if(g.visible)g.position.copy(arc(iPos,fPos,k,.3))});
 // Impacts : gerbe d'étincelles (sur la glace) ou d'éclats bleutés (sur le feu), recul de la cible, vapeur.
 const hitI=clamp((ph-.42)/.1),hitF=clamp((ph-.9)/.1),hit=ph<.7?hitI:hitF,onIce=ph<.7,at=onIce?iPos:fPos,live=moving&&hit>0&&hit<1;
 burst.forEach((b,i)=>{b.g.visible=live;if(!live)return;const k=hit;b.g.position.set(at.x+b.v.x*k*.35,at.y+b.v.y*k*.35-k*k*.4,at.z+b.v.z*k*.35+(onIce?.1:-.1));b.g.material.color.set(onIce?(i%2?0xff7a1a:0xffb040):(i%2?0x3fb4ff:0x9fdcff));b.g.material.opacity=(1-k)*.95;b.g.scale.setScalar(.12*(1-k*.5))});
 steam.forEach((s,i)=>{const k=clamp(hit*1.3-i*.12);s.visible=live&&k>0;if(!s.visible)return;s.position.set(at.x+(i-1.5)*.1,at.y-.1+k*.7,at.z);s.scale.setScalar(.25+k*.6);s.material.opacity=Math.sin(k*Math.PI)*.45});
 iceBody.position.z=onIce&&live?Math.sin(hit*Math.PI)*-.12:0;fireBody.position.z=!onIce&&live?Math.sin(hit*Math.PI)*.12:0;
 core.material.opacity=.75+Math.sin(T*2.4)*.15+(onIce&&live?(1-hit)*.3:0);if(iceLight)iceLight.intensity=1.6+Math.sin(T*2.4)*.3;if(fireLight)fireLight.intensity=2+Math.sin(T*7)*.35+(windF*1.5);
 for(const f of flameSprites){const k=moving?1+Math.sin(T*6+f.p)*.12+Math.sin(T*9.7+f.p)*.06:1;f.sp.scale.set(f.s*(2-k)*.9,f.s*1.4*k,1)}
 frostMotes.forEach(m=>{const a=m.a+T*.8;m.g.position.set(Math.cos(a)*m.r,.5+((T*.25+m.p)%1)*.9,Math.sin(a)*m.r)});
 });

// ---------- 7. Cadre de pierre givrée et d'argent ----------
const frameStone=mat(0x5c6c79,{map:stoneTex}),silver=mat(0xc9d6df,{metalness:.7,roughness:.35});
for(const s of[-1,1]){const zb=add(new THREE.BoxGeometry(FX*2+.6,1.5,.5),frameStone);zb.position.set(0,-.38,s*(FZ+.25));const zt=add(new THREE.BoxGeometry(FX*2+.7,.12,.6),silver);zt.position.set(0,.42,s*(FZ+.25));const zs=add(new THREE.CapsuleGeometry(.12,FX*2+.3,3,8).rotateZ(Math.PI/2),capMat);zs.scale.set(1,.5,1.6);zs.position.set(0,.5,s*(FZ+.25));
 const xb=add(new THREE.BoxGeometry(.5,1.5,FZ*2+1),frameStone);xb.position.set(s*(FX+.25),-.38,0);const xt=add(new THREE.BoxGeometry(.6,.12,FZ*2+1.1),silver);xt.position.set(s*(FX+.25),.42,0);const xs=add(new THREE.CapsuleGeometry(.12,FZ*2+.8,3,8).rotateX(Math.PI/2),capMat);xs.scale.set(1.6,.5,1);xs.position.set(s*(FX+.25),.5,0)}
for(const sx of[-1,1])for(const sz of[-1,1]){const c=add(new THREE.BoxGeometry(.72,.24,.72),silver);c.position.set(sx*(FX+.25),.48,sz*(FZ+.25));const gem=add(shardGeo,crystalMat);gem.scale.set(.1,.18,.1);gem.position.set(sx*(FX+.25),.78,sz*(FZ+.25))}

// ---------- 8. Aurore boréale et neige qui tombe ----------
const auroraTex=canvasTex(256,128,(g,w,h)=>{const v=g.createLinearGradient(0,0,0,h);v.addColorStop(0,'rgba(120,255,200,0)');v.addColorStop(.55,'rgba(110,255,190,.55)');v.addColorStop(.8,'rgba(90,200,255,.35)');v.addColorStop(1,'rgba(90,200,255,0)');g.fillStyle=v;for(let x=0;x<w;x++){g.globalAlpha=.3+.7*Math.pow(Math.sin(x*.07)*Math.sin(x*.023+1)*.5+.5,1.4);g.fillRect(x,0,1,h)}g.globalAlpha=1});
const auroras=[];if(!software)for(let k=0;k<2;k++){const geo=new THREE.PlaneGeometry(15,2.4,60,1),m=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:auroraTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,opacity:.95-k*.25,color:k?0xb79bff:0xffffff}));m.position.set(0,2.7+k*.6,-FZ+.15+k*.25);root.add(m);auroras.push({m,orig:Float32Array.from(geo.attributes.position.array),k})}
updates.push((t,l,moving)=>{if(!moving)return;for(const a of auroras){const p=a.m.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=a.orig[i*3];p.setZ(i,Math.sin(x*.5+t*.35+a.k)*.6);p.setY(i,a.orig[i*3+1]+Math.sin(x*.8-t*.5+a.k*2)*.15)}p.needsUpdate=true;auroraTex.offset.x=(t*.01)%1}});
const flakes=software?70:240,fgeo=new THREE.BufferGeometry(),fpos=new Float32Array(flakes*3),fseed=[];for(let i=0;i<flakes;i++)fseed.push({x:(rnd()*2-1)*FX,z:(rnd()*2-1)*FZ,p:rnd(),v:.6+rnd()*.6,w:rnd()*6});fgeo.setAttribute('position',new THREE.BufferAttribute(fpos,3));
const snow=new THREE.Points(fgeo,new THREE.PointsMaterial({map:dotTex,color:0xffffff,size:software?3:4,sizeAttenuation:false,transparent:true,depthWrite:false,opacity:.9}));snow.frustumCulled=false;root.add(snow);
updates.push((t,l,moving)=>{const T=moving?t:0;fseed.forEach((s,i)=>{const a=(T*.05*s.v+s.p)%1;fpos[i*3]=s.x+Math.sin(T*.6+s.w)*.35;fpos[i*3+1]=5-a*5.2;fpos[i*3+2]=s.z+Math.cos(T*.45+s.w)*.3});fgeo.attributes.position.needsUpdate=true});

return{root,update(t,light,moving){for(const u of updates)u(t,light,moving)}};
}
