/* v246 — Terrain neutre « La ville de Dassom » : une place pavée au cœur d'une cité fantasy.
   Le damier est une place de pavés clairs (une dalle par case). Autour : maisons à colombages aux toits de tuiles et d'ardoise,
   fenêtres éclairées, cheminées qui fument, étals de marché aux auvents rayés, tonneaux et caisses, fontaine, lanternes,
   bannières bleu et or de Dassom, et au fond les remparts et le donjon. Aucun élément n'est favorisé (règles : moteur du jeu).
   Coordonnées réelles des cases (root.scale.z = 1/ZS appliqué par clearing-v105.js). */
import * as THREE from 'three';
export function createCity(world,software=false,rows=10,helpers={}){
const root=new THREE.Group();world.add(root);root.visible=false;
let seed=1789;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const HZ=rows/2,BX=4.3,BZ=HZ+.3,TOP=.2,FX=7.2,FZ=HZ+2.45;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.88,...extra});
const add=(geo,material,parent=root,shadow=!software)=>{const m=new THREE.Mesh(geo,material);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m};
const canvasTex=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t};
const updates=[],cellX=x=>x-3.5,cellZ=y=>y-(rows-1)/2,outside=(x,z)=>Math.max(Math.abs(x)-BX,Math.abs(z)-BZ),dummy=new THREE.Object3D();
const dotTex=canvasTex(32,32,g=>{const r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.45,'rgba(255,255,255,.5)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,32,32)});
const glow=(color,size,op=.8)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color,transparent:true,opacity:op,depthWrite:false,blending:THREE.AdditiveBlending}));s.scale.setScalar(size);return s};

// ---------- 1. Rues pavées autour de la place ----------
const cobble=(base,stones)=>canvasTex(256,256,(g,w,h)=>{g.fillStyle=base;g.fillRect(0,0,w,h);for(let y=0;y<h;y+=18)for(let x=(y/18%2)*12;x<w+24;x+=24){const c=stones[Math.floor(rnd()*stones.length)];g.fillStyle='rgba(30,22,16,.35)';g.beginPath();g.ellipse(x+1.5,y+10.5,10.5,7.5,0,0,7);g.fill();g.fillStyle=c;g.beginPath();g.ellipse(x,y+9,10,7,(rnd()-.5)*.3,0,7);g.fill();g.fillStyle='rgba(255,255,255,.12)';g.beginPath();g.ellipse(x-3,y+6,4,2.2,0,0,7);g.fill()}});
const streetTex=cobble('#4d4640',['#7a7068','#857a6e','#6e655d','#8f8578','#766a5f']);streetTex.repeat.set(7,7*FZ/FX);
const street=add(new THREE.PlaneGeometry(FX*2,FZ*2),mat(0xffffff,{map:streetTex,bumpMap:streetTex,bumpScale:.03}),root,false);street.rotation.x=-Math.PI/2;street.position.y=.02;

// ---------- 2. La place : une dalle pavée par case, bordure de pierre ----------
const slabTex=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#b9ab98';g.fillRect(0,0,w,h);for(let y=4;y<h;y+=30)for(let x=4+(Math.floor(y/30)%2)*14;x<w;x+=30){const v=170+rnd()*40;g.fillStyle=`rgb(${v},${v-10},${v-24})`;g.beginPath();g.roundRect?g.roundRect(x,y,26,26,6):g.rect(x,y,26,26);g.fill();g.fillStyle='rgba(255,255,255,.18)';g.fillRect(x+4,y+3,12,3)}g.strokeStyle='rgba(60,45,30,.55)';g.lineWidth=5;g.strokeRect(2.5,2.5,w-5,h-5)});
const plinth=add(new THREE.BoxGeometry(BX*2,.5,BZ*2),mat(0x6b625a));plinth.position.y=TOP-.31;
const slabs=new THREE.InstancedMesh(new THREE.BoxGeometry(.94,.1,.94).translate(0,-.05,0),mat(0xffffff,{map:slabTex,bumpMap:slabTex,bumpScale:.025,roughness:.82}),8*rows);let si=0;
for(let y=0;y<rows;y++)for(let x=0;x<8;x++){dummy.position.set(cellX(x),TOP,cellZ(y));dummy.rotation.set(0,(rnd()-.5)*.02,0);dummy.updateMatrix();slabs.setMatrixAt(si,dummy.matrix);const c=new THREE.Color((x+y)%2?0xe9dcc4:0xcdbfa8);c.offsetHSL(0,0,(rnd()-.5)*.03);slabs.setColorAt(si++,c)}
slabs.castShadow=false;slabs.receiveShadow=true;root.add(slabs);
const curb=mat(0x8f857a);for(const s of[-1,1]){const a=add(new THREE.BoxGeometry(BX*2+.1,.16,.28),curb);a.position.set(0,TOP-.01,s*(BZ-.12));const b=add(new THREE.BoxGeometry(.28,.16,BZ*2-.5),curb);b.position.set(s*(BX-.12),TOP-.01,0)}

// ---------- 3. Maisons à colombages ----------
const plasterCols=[0xeee2c6,0xe9d6b5,0xf3ead6,0xd8c6a6,0xe6d0c2],roofCols=[0x9c3f2c,0x7a3527,0x4d5a6b,0x5d4a3c,0xa4512f],beam=mat(0x4a3324),glass=new THREE.MeshStandardMaterial({color:0xffc66b,emissive:0xff9a3a,emissiveIntensity:.9,roughness:.4});
const smokes=[];
function house(x,z,w,d,h,ry,front=false){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;root.add(g);if(front)h*=.62;
 const body=add(new THREE.BoxGeometry(w,h,d),mat(plasterCols[Math.floor(rnd()*plasterCols.length)]),g);body.position.y=h/2;
 const base=add(new THREE.BoxGeometry(w+.04,.35,d+.04),mat(0x8a7d6e),g);base.position.y=.175;
 // colombages : poteaux, sablières et croix de Saint-André en façade
 for(const side of[-1,1]){const f=d/2*side+.012*side;for(let i=0;i<=3;i++){const p=add(new THREE.BoxGeometry(.06,h-.35,.03),beam,g,false);p.position.set(-w/2+.03+i*(w-.06)/3,.35+(h-.35)/2,f)}
  for(const yy of[.35,h*.62,h-.03]){const r=add(new THREE.BoxGeometry(w,.06,.03),beam,g,false);r.position.set(0,yy,f)}
  if(!front)for(let i=0;i<3;i++){const cx=-w/2+(i+.5)*w/3,cy=(h*.62+h)/2;for(const s2 of[-1,1]){const xb=add(new THREE.BoxGeometry(Math.hypot(w/3,h*.38)*.92,.05,.03),beam,g,false);xb.position.set(cx,cy,f);xb.rotation.z=s2*Math.atan2(h*.38,w/3)}}
  const nw=Math.max(1,Math.round(w/.6));for(let i=0;i<nw;i++){const win=add(new THREE.BoxGeometry(.22,.26,.02),glass,g,false);win.position.set(-w/2+(i+.5)*w/nw,h*.62+(h-h*.62)/2-(front?0:.0),f+.01*side);if(front)win.position.y=h*.45}}
 const door=add(new THREE.BoxGeometry(.3,.5,.03),mat(0x5a3a24),g,false);door.position.set(w*.2,.6,d/2+.02);
 // toit à deux pans
 const rs=new THREE.Shape();rs.moveTo(-w/2-.12,0);rs.lineTo(0,h*.55+.25);rs.lineTo(w/2+.12,0);rs.closePath();const roofGeo=new THREE.ExtrudeGeometry(rs,{depth:d+.24,bevelEnabled:false});roofGeo.translate(0,0,-(d+.24)/2);
 const roof=add(roofGeo,mat(roofCols[Math.floor(rnd()*roofCols.length)],{roughness:.7}),g);roof.position.y=h;
 if(rnd()>.25){const ch=add(new THREE.BoxGeometry(.16,.5,.16),mat(0x7d6b5c),g);ch.position.set(-w*.25,h+.45,-d*.15);const p=new THREE.Vector3();ch.getWorldPosition(p);smokes.push({x:x+Math.cos(ry)*(-w*.25)+Math.sin(ry)*(-d*.15),z:z-Math.sin(ry)*(-w*.25)+Math.cos(ry)*(-d*.15),y:h+.75,ph:rnd()})}
 return g}
// Rangée du fond (grandes), côtés (moyennes), avant (basses pour ne pas masquer le plateau).
for(let x=-6.4;x<=6.4;x+=1.6){const w=1.3+rnd()*.25;house(x,-FZ+1.2,w,1.1,1.6+rnd()*.9,0)}
for(const s of[-1,1])for(let z=-FZ+3.2;z<=FZ-1.6;z+=1.55){if(s<0&&Math.abs(z-.4)<1.9)continue;if(s>0&&(Math.abs(z+.6)<1.3||Math.abs(z-3.2)<1.1))continue;house(s*(FX-.95),z,1.25,1.1,1.1+rnd()*.7,s<0?Math.PI/2:-Math.PI/2,s>0)}
for(let x=-5.6;x<=5.6;x+=2.2)if(Math.abs(x)>1.4)house(x,FZ-.75,1.4,.8,1,Math.PI,true);
// Fumée des cheminées
const puffs=[];for(const s of smokes)for(let k=0;k<(software?2:4);k++){const m=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color:0xd9d4cc,transparent:true,depthWrite:false,opacity:0}));root.add(m);puffs.push({m,s,p:k/4})}
updates.push((t,l,moving)=>{for(const f of puffs){const k=moving?(t*.12+f.p)%1:f.p;f.m.position.set(f.s.x-k*.5,f.s.y+k*1.4,f.s.z-k*.2);f.m.scale.setScalar(.25+k*.6);f.m.material.opacity=Math.sin(k*Math.PI)*.45}});

// ---------- 4. Marché : étals à auvents rayés, tonneaux, caisses ----------
const stripe=(c1,c2)=>canvasTex(64,16,(g,w,h)=>{for(let x=0;x<w;x+=16){g.fillStyle=c1;g.fillRect(x,0,8,h);g.fillStyle=c2;g.fillRect(x+8,0,8,h)}});
const wood=mat(0x7a5434),barrelMat=mat(0x8a5a32),hoop=mat(0x3c3c3c,{metalness:.6,roughness:.4});
function stall(x,z,ry,c1,c2){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;root.add(g);const t=add(new THREE.BoxGeometry(1,.08,.5),wood,g);t.position.y=.45;for(const sx of[-.45,.45])for(const sz of[-.2,.2]){const leg=add(new THREE.BoxGeometry(.05,.85,.05),wood,g);leg.position.set(sx,.42,sz)}
 const aw=add(new THREE.BoxGeometry(1.1,.03,.7),new THREE.MeshStandardMaterial({map:stripe(c1,c2),roughness:.9}),g);aw.position.set(0,.88,.05);aw.rotation.x=.25;
 const fruitCols=[0xd8402b,0xf2b632,0x7fb04a,0x8d4fb0];for(let i=0;i<7;i++){const f=add(new THREE.SphereGeometry(.05,8,6),mat(fruitCols[i%4]),g,false);f.position.set(-.38+i*.12,.53,(rnd()-.5)*.25)}}
stall(-5.6,1.1,Math.PI/2,'#c0392b','#f4e9d8');stall(-5.6,-1.3,Math.PI/2,'#2d6a9f','#f4e9d8');stall(5.7,3.2,-Math.PI/2,'#3e8d4f','#f4e9d8');
function barrel(x,z){const b=add(new THREE.CylinderGeometry(.17,.17,.42,12),barrelMat);b.position.set(x,.21,z);for(const y of[.08,.34]){const h=add(new THREE.TorusGeometry(.172,.012,4,16),hoop,root,false);h.rotation.x=Math.PI/2;h.position.set(x,y,z)}}
function crate(x,z,s=.32){const c=add(new THREE.BoxGeometry(s,s,s),wood);c.position.set(x,s/2,z);c.rotation.y=rnd()}
for(const [x,z] of[[-5.55,2.3],[-5.55,-2.6],[5.5,4.4],[5.5,-4.6],[-5.5,-4.8],[5.5,1.9]]){barrel(x,z);crate(x,z+.38)}/* v247 : rangés contre les maisons, la rue reste libre pour les passants */

// ---------- 5. Fontaine, lanternes, bannières, arbres en bacs ----------
{const fx=6.0,fz=-.6,g=new THREE.Group();g.position.set(fx,0,fz);root.add(g);const basin=add(new THREE.CylinderGeometry(.62,.68,.32,20),mat(0x9a9286),g);basin.position.y=.16;const water=new THREE.Mesh(new THREE.CircleGeometry(.54,20),new THREE.MeshPhysicalMaterial({color:0x5fa9c9,roughness:.05,clearcoat:1,transparent:true,opacity:.85}));water.rotation.x=-Math.PI/2;water.position.y=.3;g.add(water);
 const col=add(new THREE.CylinderGeometry(.08,.12,.7,10),mat(0x9a9286),g);col.position.y=.6;const bowl=add(new THREE.CylinderGeometry(.28,.12,.14,16),mat(0x9a9286),g);bowl.position.y=.98;
 const jets=[];for(let i=0;i<(software?4:10);i++){const d=new THREE.Mesh(new THREE.SphereGeometry(.025,6,4),new THREE.MeshBasicMaterial({color:0xcfefff,transparent:true,opacity:.8}));g.add(d);jets.push({d,a:i/10*Math.PI*2,p:i/10})}
 updates.push((t,l,moving)=>{for(const j of jets){const k=moving?(t*.9+j.p)%1:j.p;j.d.position.set(Math.cos(j.a)*(.08+k*.38),1.05+Math.sin(k*Math.PI)*.22-k*.7,Math.sin(j.a)*(.08+k*.38));j.d.visible=k<.98}})}
const lampMat=new THREE.MeshBasicMaterial({color:0xffd58a});
for(const [x,z] of[[-4.75,-BZ+.4],[4.75,-BZ+.4],[-4.75,BZ-.4],[4.75,BZ-.4],[-4.75,0],[4.75,0]]){const post=add(new THREE.CylinderGeometry(.03,.045,1.05,6),mat(0x2e2e33,{metalness:.5,roughness:.5}));post.position.set(x,.52,z);const lamp=add(new THREE.BoxGeometry(.14,.18,.14),lampMat,root,false);lamp.position.set(x,1.1,z);const cap=add(new THREE.ConeGeometry(.13,.1,4),mat(0x2e2e33),root,false);cap.position.set(x,1.24,z);cap.rotation.y=Math.PI/4;const gl=glow(0xffb866,.7,.65);gl.position.set(x,1.1,z);root.add(gl);updates.push((t,l,moving)=>{gl.material.opacity=.58+(moving?Math.sin(t*3.3+x*z)*.08:0)})}
const bannerTex=canvasTex(64,160,(g,w,h)=>{g.fillStyle='#1f4f8f';g.fillRect(0,0,w,h-22);g.beginPath();g.moveTo(0,h-22);g.lineTo(w/2,h);g.lineTo(w,h-22);g.fill();g.strokeStyle='#e8c35a';g.lineWidth=4;g.strokeRect(5,5,w-10,h-34);g.fillStyle='#e8c35a';g.beginPath();g.moveTo(32,40);g.lineTo(44,64);g.lineTo(32,96);g.lineTo(20,64);g.closePath();g.fill();g.fillRect(14,104,36,6)});
const banners=[];for(const [x,z] of[[-2.2,-BZ-.55],[2.2,-BZ-.55],[-4.6,-2.6],[4.6,2.6]]){const pole=add(new THREE.CylinderGeometry(.025,.025,1.7,6),mat(0x5a4632));pole.position.set(x,.85,z);const b=new THREE.Mesh(new THREE.PlaneGeometry(.36,.9),new THREE.MeshStandardMaterial({map:bannerTex,side:THREE.DoubleSide,roughness:.8}));b.position.set(x,1.15,z+.02);root.add(b);banners.push({b,p:rnd()*6})}
updates.push((t,l,moving)=>{for(const B of banners){B.b.rotation.y=moving?Math.sin(t*1.2+B.p)*.18:0}});
for(const [x,z] of[[-2.6,BZ+.95],[2.6,BZ+.95],[-6.4,FZ-2.2],[6.4,-FZ+3.1]]){const box=add(new THREE.BoxGeometry(.5,.32,.5),mat(0x7a5c3e));box.position.set(x,.16,z);const tr=add(new THREE.CylinderGeometry(.04,.06,.5,6),mat(0x5a3f2a));tr.position.set(x,.55,z);const cr=add(new THREE.IcosahedronGeometry(.36,1),mat(0x5f8f3e,{flatShading:true}));cr.position.set(x,.95,z)}

// ---------- 6. Remparts et donjon au fond ----------
const wallStone=mat(0x8b8377,{map:streetTex});
const wall=add(new THREE.BoxGeometry(FX*2+.6,1.5,.5),wallStone);wall.position.set(0,.75,-FZ-.1);
for(let x=-FX;x<=FX;x+=.5){const m=add(new THREE.BoxGeometry(.28,.28,.5),wallStone,root,false);m.position.set(x,1.64,-FZ-.1)}
for(const x of[-FX+.3,FX-.3,0]){const tw=add(new THREE.CylinderGeometry(.6,.68,2.4,12),wallStone);tw.position.set(x,1.2,-FZ-.1);const r=add(new THREE.ConeGeometry(.75,1,12),mat(0x40495a,{roughness:.7}));r.position.set(x,2.9,-FZ-.1)}
{const keep=add(new THREE.BoxGeometry(1.4,3.4,1.2),wallStone);keep.position.set(-3.2,1.7,-FZ-.6);const kr=add(new THREE.ConeGeometry(1.05,1.4,4),mat(0x3b4556));kr.position.set(-3.2,4.1,-FZ-.6);kr.rotation.y=Math.PI/4;const flag=new THREE.Mesh(new THREE.PlaneGeometry(.5,.28),new THREE.MeshStandardMaterial({map:bannerTex,side:THREE.DoubleSide}));flag.position.set(-2.9,5,-FZ-.6);root.add(flag);const fp=add(new THREE.CylinderGeometry(.02,.02,.6,5),mat(0x5a4632));fp.position.set(-3.2,4.95,-FZ-.6);updates.push((t,l,moving)=>{flag.rotation.y=moving?Math.sin(t*1.7)*.3:0})}
// Côtés et avant : murets bas (la vue sur le plateau reste dégagée).
for(const s of[-1,1]){const w2=add(new THREE.BoxGeometry(.4,.5,FZ*2+.5),wallStone);w2.position.set(s*(FX+.15),.25,0)}
const fw=add(new THREE.BoxGeometry(FX*2+.6,.45,.4),wallStone);fw.position.set(0,.22,FZ+.15);

// ---------- 7. Pigeons qui volettent ----------
const birds=[];for(let i=0;i<(software?2:6);i++){const g=new THREE.Group();const body=add(new THREE.SphereGeometry(.06,8,6),mat(0x8d8f99),g,false);body.scale.set(1.3,.9,.9);const wings=[];for(const s of[-1,1]){const w=add(new THREE.PlaneGeometry(.14,.06),new THREE.MeshStandardMaterial({color:0x7c7f8a,side:THREE.DoubleSide}),g,false);w.position.set(0,.02,s*.07);w.rotation.x=Math.PI/2;wings.push({w,s})}root.add(g);birds.push({g,wings,p:rnd()*6,cx:(rnd()-.5)*10,cz:-FZ+1.8+rnd()*1.2})}
updates.push((t,l,moving)=>{const T=moving?t:0;for(const b of birds){const a=T*.4+b.p;b.g.position.set(b.cx+Math.cos(a)*1.4,2.4+Math.sin(T*1.3+b.p)*.2,b.cz+Math.sin(a)*.5);b.g.rotation.y=-a;for(const W of b.wings)W.w.rotation.y=W.s*(moving?Math.sin(t*14+b.p)*.7:.3)}});

// ---------- 8. v247 — Passants : des personnages du jeu se promènent dans les rues, autour de la place ----------
// Circuit rectangulaire dans la rue (entre la bordure de la place et les maisons) ; certains tournent dans un sens, d'autres dans l'autre.
const LX=4.98,LZ0=-(BZ+.2),LZ1=BZ+.45,loop=[[-LX,LZ0],[LX,LZ0],[LX,LZ1],[-LX,LZ1]],segLen=loop.map((p,i)=>{const q=loop[(i+1)%4];return Math.hypot(q[0]-p[0],q[1]-p[1])}),total=segLen.reduce((a,b)=>a+b,0);
function onLoop(d,lane=0){d=((d%total)+total)%total;let i=0;while(d>segLen[i]){d-=segLen[i];i++}const p=loop[i],q=loop[(i+1)%4],k=d/segLen[i],dx=(q[0]-p[0])/segLen[i],dz=(q[1]-p[1])/segLen[i];return{x:p[0]+(q[0]-p[0])*k+dz*lane,z:p[1]+(q[1]-p[1])*k-dx*lane,yaw:Math.atan2(dx,dz)}}
const walkers=[];let lastT=0;
if(!software&&helpers.spawnWalker){const cast=[['pennedra',1,.34,0],['maebril',-1,.3,.25],['sameron',1,.26,.55],['frolgor',-1,.28,.7],['max',1,.42,.85]];
 cast.forEach(([key,dir,speed,start],n)=>setTimeout(()=>helpers.spawnWalker(key,.95).then(w=>{if(!w)return;root.add(w.group);walkers.push({w,dir,speed,d:start*total,lane:dir>0?.1:-.14,yaw:0})}),600+n*900))}
updates.push((t,l,moving)=>{const dt=Math.min(.1,Math.max(0,t-lastT));lastT=t;for(const W of walkers){if(moving)W.d+=W.dir*W.speed*dt;const p=onLoop(W.d,W.lane),yaw=p.yaw+(W.dir<0?Math.PI:0);let dy=yaw-W.yaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));W.yaw+=dy*Math.min(1,dt*6+(moving?0:1));W.w.group.position.set(p.x,.03,p.z);W.w.group.rotation.y=W.yaw;if(moving)W.w.update(dt)}});
return{root,update(t,light,moving){for(const u of updates)u(t,light,moving)}};
}
