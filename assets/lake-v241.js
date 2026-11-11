/* v241 — Terrain eau « Le lac rose », repensé : un lac de montagne naturel à l'eau limpide.
   Le rose ne vient pas de l'eau mais du fond : galets roses, sable clair et quartz rose, vus à travers une eau
   transparente parcourue de reflets, de scintillements et de ronds dans l'eau. Le damier est une terrasse de dalles de pierre claire posée
   sur un socle moussu qui sort de l'eau. Autour : rives d'herbe, plage de galets, sapins et bouleaux, rochers de granit,
   roseaux, nénuphars qui flottent avec l'eau, ponton et barque, poissons sous la surface, libellules,
   et sur un îlot le vieux sanctuaire : un cercle de pierres levées autour d'un grand quartz rose.
   Coordonnées réelles des cases (root.scale.z = 1/ZS appliqué par clearing-v105.js). Règles : moteur du jeu. */
import * as THREE from 'three';
export function createLake(world,software=false,rows=10){
const root=new THREE.Group();world.add(root);root.visible=false;
let seed=4417;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const HZ=rows/2,BX=4.3,BZ=HZ+.3,TOP=.2,FX=7.02,FZ=7.5*rows/10,WL=0;// terrasse, haut des dalles, cadre de bois, niveau de l'eau
const mix=(a,b,t)=>a+(b-a)*t,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
const noise=(x,z)=>Math.sin(x*2.71+Math.sin(z*1.9))*Math.cos(z*2.31-x*.61)*.5+Math.sin(x*7.1+z*5.3)*.15;
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.9,...extra});
const add=(geo,material,parent=root,shadow=!software)=>{const m=new THREE.Mesh(geo,material);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m};
const canvasTex=(w,h,draw,srgb=true)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t};
const updates=[],cellX=x=>x-3.5,cellZ=y=>y-(rows-1)/2,outside=(x,z)=>Math.max(Math.abs(x)-BX,Math.abs(z)-BZ),edgeDist=(x,z)=>Math.min(FX-Math.abs(x),FZ-Math.abs(z));
const waveH=(x,z,t)=>Math.sin(x*1.6+t*.9)*.006+Math.sin(z*2.1-t*.7)*.005;// petites vagues : tout ce qui flotte suit la même formule
const dotTex=canvasTex(32,32,g=>{const r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.4,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,32,32)});

// ---------- 1. Le fond du lac : galets roses, sable clair, quartz ----------
const islands=[{x:-5.4,z:-HZ+.9,r:.85,h:.45},{x:5.85,z:1.6,r:.85,h:.4},{x:-5.9,z:HZ-.4,r:.7,h:.32}];
function bedH(x,z){const e=edgeDist(x,z),o=outside(x,z);
 let y=mix(.16+noise(x*.8,z*.8)*.05,-.52+noise(x*.6+3,z*.6)*.06,smooth(.7,1.9,e));// rive → profondeur
 y=Math.max(y,mix(-.3,-.52,smooth(0,.7,o)));// le socle de la terrasse remonte un peu le fond
 for(const i of islands){const d=Math.hypot(x-i.x,(z-i.z)*.9)/i.r;if(d<1.6)y=Math.max(y,mix(i.h+noise(x*2,z*2)*.05,-.55,smooth(.45,1.5,d)))}
 return y}
const pebbleTex=canvasTex(512,512,(g,w,h)=>{g.fillStyle='#e9c3c8';g.fillRect(0,0,w,h);for(let i=0;i<4000;i++){g.fillStyle=`rgba(${215+rnd()*40},${160+rnd()*50},${165+rnd()*40},.5)`;g.fillRect(rnd()*w,rnd()*h,1.5,1.5)}
 const pal=['#f2a7bf','#e98aa9','#f6c3cf','#d9748f','#fbe3e8','#c9657f','#f0b2a5','#ffffff','#b7a7ad'];
 for(let i=0;i<2600;i++){const x=rnd()*w,y=rnd()*h,r=2.5+Math.pow(rnd(),2)*7,a=rnd()*Math.PI,c=pal[Math.floor(rnd()*pal.length)];
  for(const [ox,oy] of[[0,0],[w,0],[-w,0],[0,h],[0,-h]]){if(x+ox<-20||x+ox>w+20||y+oy<-20||y+oy>h+20)continue;g.save();g.translate(x+ox,y+oy);g.rotate(a);g.fillStyle='rgba(90,40,60,.1)';g.beginPath();g.ellipse(.8,1.1,r,r*.72,0,0,7);g.fill();g.fillStyle=c;g.beginPath();g.ellipse(0,0,r,r*.72,0,0,7);g.fill();g.fillStyle='rgba(255,255,255,.35)';g.beginPath();g.ellipse(-r*.3,-r*.25,r*.4,r*.22,0,0,7);g.fill();g.restore()}}});
pebbleTex.repeat.set(6,6*FZ/FX);
const bedGeo=new THREE.PlaneGeometry(FX*2,FZ*2,software?50:120,software?60:140);bedGeo.rotateX(-Math.PI/2);
{const p=bedGeo.attributes.position,c=[];for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=bedH(x,z);p.setY(i,y);let col;
 if(y>WL+.03){const k=smooth(WL+.03,WL+.12,y);col=new THREE.Color(0xf1e4dc).lerp(new THREE.Color(0x6f9450).lerp(new THREE.Color(0x587d42),smooth(-.3,.4,noise(x*1.3,z*1.3))),k)}// plage → herbe
 else{const depth=smooth(WL,-.5,y);col=new THREE.Color(0xffd9e3).lerp(new THREE.Color(0xec7aa0),Math.min(1,depth*1.4)).lerp(new THREE.Color(0xb23f70),depth*depth*.6)}// plus c'est profond, plus le rose est soutenu
 c.push(col.r,col.g,col.b)}bedGeo.setAttribute('color',new THREE.Float32BufferAttribute(c,3));bedGeo.computeVertexNormals()}
add(bedGeo,mat(0xffffff,{vertexColors:true,map:pebbleTex,bumpMap:pebbleTex,bumpScale:.025,roughness:.75}),root,false).renderOrder=-3;

// ---------- 2. L'eau : limpide, légèrement turquoise, reflets mouvants ----------
const normalTex=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),img=g.createImageData(128,128);for(let y=0;y<128;y++)for(let x=0;x<128;x++){const a=Math.sin(x/128*Math.PI*6+Math.sin(y/128*Math.PI*4)*1.3),b=Math.cos(y/128*Math.PI*8+Math.cos(x/128*Math.PI*2)*1.1),i=(y*128+x)*4;img.data[i]=128+a*34;img.data[i+1]=128+b*34;img.data[i+2]=255;img.data[i+3]=255}g.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(6,6*FZ/FX);return t})();
const waterGeo=new THREE.PlaneGeometry(FX*2,FZ*2,software?1:56,software?1:64);waterGeo.rotateX(-Math.PI/2);
const waterMat=new THREE.MeshPhysicalMaterial({color:0xa8ebe6,transparent:true,opacity:software?.45:.36,roughness:.04,metalness:0,clearcoat:1,clearcoatRoughness:.05,normalMap:normalTex,normalScale:new THREE.Vector2(.35,.35),depthWrite:false});
{const p=waterGeo.attributes.position,c=[];for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),d=smooth(WL,-.5,bedH(x,z)),col=new THREE.Color(0xe8fbfa).lerp(new THREE.Color(0xb5e6e6),d);c.push(col.r,col.g,col.b,software?1:.14+d*.26)}waterGeo.setAttribute('color',new THREE.Float32BufferAttribute(c,4));waterMat.vertexColors=true;waterMat.opacity=1;waterMat.color.set(0xffffff)}
const water=add(waterGeo,waterMat,root,false);water.position.y=WL;water.renderOrder=2;const wPos=waterGeo.attributes.position,wOrig=Float32Array.from(wPos.array);
updates.push((t,light,moving)=>{if(!moving)return;normalTex.offset.set(t*.01,t*.006);if(light||software)return;for(let i=0;i<wPos.count;i++)wPos.setY(i,waveH(wOrig[i*3],wOrig[i*3+2],t));wPos.needsUpdate=true});
// Reflet du ciel qui glisse lentement sur l'eau, et ronds dans l'eau (poissons qui gobent).
if(!software){const skyTex=canvasTex(256,64,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.42,'rgba(255,255,255,0)');gr.addColorStop(.5,'rgba(235,250,255,.5)');gr.addColorStop(.58,'rgba(255,255,255,0)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,w,h)});skyTex.repeat.set(1.4,1);
 const sky=new THREE.Mesh(new THREE.PlaneGeometry(FX*2,FZ*2),new THREE.MeshBasicMaterial({map:skyTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.3}));sky.rotation.x=-Math.PI/2;skyTex.center.set(.5,.5);skyTex.rotation=.5;sky.position.y=WL+.008;sky.renderOrder=3;root.add(sky);updates.push((t,l,moving)=>{if(moving)skyTex.offset.x=(t*.02)%1});
 const ringTex=canvasTex(64,64,g=>{g.strokeStyle='rgba(255,255,255,.9)';g.lineWidth=3;g.beginPath();g.arc(32,32,27,0,7);g.stroke();g.strokeStyle='rgba(255,255,255,.4)';g.lineWidth=2;g.beginPath();g.arc(32,32,18,0,7);g.stroke()});const rings=[];
 for(let k=0;k<5;k++){const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:ringTex,transparent:true,depthWrite:false,opacity:0}));m.rotation.x=-Math.PI/2;m.renderOrder=4;root.add(m);rings.push({m,p:k/5,slot:-1})}
 updates.push((t,l,moving)=>{for(const r of rings){const T=moving?t*.22+r.p:r.p,slot=Math.floor(T),k=T-slot;if(slot!==r.slot){r.slot=slot;let x,z,n=0,q=slot;do{x=(Math.sin(q*12.9898+r.p*78.233)*43758.5453%1)*(FX-.8);z=(Math.sin(q*93.9898+r.p*47.233)*24634.6345%1)*(FZ-.8);q+=.37;n++}while((outside(x,z)<.4||bedH(x,z)>-.08)&&n<20);r.m.position.set(x,WL+.01,z)}r.m.scale.setScalar(.1+k*.7);r.m.material.opacity=moving?(1-k)*.55:0}})}
// Écume douce au bord de l'eau, autour du socle de la terrasse.
const foamTex=canvasTex(256,16,(g,w,h)=>{for(let x=0;x<w;x+=2){g.fillStyle=`rgba(255,255,255,${.25+rnd()*.5})`;g.fillRect(x,2+rnd()*4,2+rnd()*4,3+rnd()*6)}});
for(const [w,d,x,z,rot] of[[BX*2+.2,.16,0,-BZ-.08,0],[BX*2+.2,.16,0,BZ+.08,0],[BZ*2+.2,.16,-BX-.08,0,Math.PI/2],[BZ*2+.2,.16,BX+.08,0,Math.PI/2]]){const f=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({map:foamTex,transparent:true,depthWrite:false,opacity:.6}));f.rotation.set(-Math.PI/2,0,rot);f.position.set(x,WL+.012,z);f.renderOrder=3;root.add(f);updates.push((t,l,moving)=>{f.material.opacity=.45+(moving?Math.sin(t*1.3+x+z)*.15:0)})}
// Scintillements du soleil.
const glints=[];if(!software)for(let i=0;i<26;i++){let x,z;do{x=(rnd()*2-1)*(FX-.6);z=(rnd()*2-1)*(FZ-.6)}while(outside(x,z)<.2||bedH(x,z)>WL-.05);const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color:0xfff8e6,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0}));sp.position.set(x,WL+.03,z);sp.renderOrder=4;root.add(sp);glints.push({sp,p:rnd()*7,v:1.1+rnd()*1.4,s:.08+rnd()*.07})}
updates.push((t,l,moving)=>{for(const g of glints){const k=moving?Math.pow(Math.max(0,Math.sin(t*g.v+g.p)),6):.2;g.sp.material.opacity=k*.9;g.sp.scale.setScalar(g.s*(.6+k))}});

// ---------- 3. La terrasse : dalles claires sur un socle moussu ----------
const stoneTex=canvasTex(128,128,(g,w,h)=>{const img=g.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const e=Math.min(x,y,w-1-x,h-1-y),bevel=smooth(0,8,e),n=noise(x*.07,y*.07)*.5+noise(x*.23+5,y*.2)*.25,v=clamp(.84+n*.1+(rnd()-.5)*.05)*(.7+.3*bevel),i=(y*w+x)*4;img.data[i]=v*255;img.data[i+1]=v*247;img.data[i+2]=v*244;img.data[i+3]=255}g.putImageData(img,0,0);for(let k=0;k<6;k++){g.fillStyle=`rgba(120,140,90,${.08+rnd()*.1})`;g.beginPath();g.ellipse(rnd()*w,rnd()*h,4+rnd()*10,3+rnd()*6,rnd()*3,0,7);g.fill()}});
const mossTex=canvasTex(256,64,(g,w,h)=>{g.fillStyle='#6f736c';g.fillRect(0,0,w,h);for(let i=0;i<900;i++){g.fillStyle=`rgba(${70+rnd()*40},${80+rnd()*40},${70+rnd()*30},.6)`;g.fillRect(rnd()*w,rnd()*h,2+rnd()*6,2+rnd()*4)}const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(80,120,60,.75)');gr.addColorStop(.35,'rgba(80,120,60,0)');gr.addColorStop(.62,'rgba(50,60,55,0)');gr.addColorStop(1,'rgba(150,80,105,.4)');g.fillStyle=gr;g.fillRect(0,0,w,h)});mossTex.repeat.set(4,1);
const plinthSide=mat(0xffffff,{map:mossTex});const plinth=add(new THREE.BoxGeometry(BX*2,.9,BZ*2),[plinthSide,plinthSide,mat(0x5c6b55),mat(0x4b4a48),plinthSide,plinthSide]);plinth.position.y=TOP-.51;
const slabGeo=new THREE.BoxGeometry(.93,.12,.93);slabGeo.translate(0,-.06,0);
const slabs=new THREE.InstancedMesh(slabGeo,mat(0xffffff,{map:stoneTex,bumpMap:stoneTex,bumpScale:.025,roughness:.82}),8*rows),dummy=new THREE.Object3D();let si=0;
for(let y=0;y<rows;y++)for(let x=0;x<8;x++){dummy.position.set(cellX(x),TOP,cellZ(y));dummy.rotation.set(0,(rnd()-.5)*.03,0);dummy.updateMatrix();slabs.setMatrixAt(si,dummy.matrix);const c=new THREE.Color((x+y)%2?0xe3d9d3:0xcabfbb);c.offsetHSL(0,0,(rnd()-.5)*.03);slabs.setColorAt(si++,c)}
slabs.castShadow=false;slabs.receiveShadow=true;root.add(slabs);
// Bordure de pierres usées, mousse aux angles.
const curb=mat(0x9a948f,{map:stoneTex}),moss=mat(0x5f8a43,{roughness:1});
for(const s of[-1,1]){const a=add(new THREE.BoxGeometry(BX*2+.06,.13,.26),curb);a.position.set(0,TOP-.02,s*(BZ-.13));const b=add(new THREE.BoxGeometry(.26,.13,BZ*2-.52),curb);b.position.set(s*(BX-.13),TOP-.02,0)}
for(let i=0;i<(software?8:20);i++){const side=Math.floor(rnd()*4),u=rnd()*2-1,x=side<2?u*BX:(side===2?1:-1)*(BX-.12),z=side<2?(side?1:-1)*(BZ-.12):u*BZ,m=add(new THREE.SphereGeometry(1,7,5),moss,root,false);m.scale.set(.12+rnd()*.12,.03,.08+rnd()*.08);m.position.set(x,TOP+.045,z);m.rotation.y=rnd()*6}

// ---------- 4. Arbres de la rive : sapins et bouleaux (aucun sur la terrasse) ----------
const pineMat=mat(0x2f5b3d),pineDark=mat(0x24492f),bark=mat(0x5a4032),birchBark=mat(0xe9e6df,{map:canvasTex(32,128,(g,w,h)=>{g.fillStyle='#ece9e2';g.fillRect(0,0,w,h);for(let i=0;i<22;i++){g.fillStyle=`rgba(30,30,30,${.5+rnd()*.4})`;g.fillRect(rnd()*w,rnd()*h,4+rnd()*12,1+rnd()*2.5)}})}),birchLeaf=[0x8fb35a,0x9fc067,0x7ea24c].map(c=>mat(c,{flatShading:true}));
const tier=new THREE.ConeGeometry(1,1,8),crown=new THREE.IcosahedronGeometry(1,1);
function pine(x,z,s){const g=new THREE.Group();g.position.set(x,bedH(x,z),z);g.rotation.y=rnd()*6;root.add(g);const tr=add(new THREE.CylinderGeometry(.05*s,.08*s,.4*s,6),bark,g);tr.position.y=.2*s;for(let k=0;k<4;k++){const r=(.6-k*.13)*s,h=(.62-k*.08)*s,c=add(tier,k%2?pineDark:pineMat,g);c.scale.set(r,h,r);c.position.y=(.3+k*.33)*s+h/2}}
function birch(x,z,s){const g=new THREE.Group();g.position.set(x,bedH(x,z),z);root.add(g);const tr=add(new THREE.CylinderGeometry(.035*s,.055*s,1.3*s,7),birchBark,g);tr.position.y=.65*s;tr.rotation.z=(rnd()-.5)*.12;for(let k=0;k<5;k++){const c=add(crown,birchLeaf[k%3],g);const a=k*1.3;c.position.set(Math.cos(a)*.22*s,(1.15+(k%3)*.2)*s,Math.sin(a)*.2*s);c.scale.set(.32*s,.38*s,.3*s)}}
const treeSpots=[];const tryTree=(x,z,s,kind)=>{if(outside(x,z)<.7||bedH(x,z)<WL+.06)return;if(treeSpots.some(([a,b])=>Math.hypot(a-x,b-z)<.75))return;treeSpots.push([x,z]);(kind?birch:pine)(x,z,s)};
for(const i of islands.slice(1))for(let k=0;k<2;k++){const a=rnd()*6.28,r=rnd()*i.r*.45;tryTree(i.x+Math.cos(a)*r,i.z+Math.sin(a)*r,.75+rnd()*.35,k%2)}
for(let k=0;k<(software?14:34);k++){const side=Math.floor(rnd()*4),u=rnd()*2-1,inset=.25+rnd()*.35;let x,z;if(side===0){x=u*(FX-.4);z=-FZ+inset}else if(side===1){x=u*(FX-.4);z=FZ-inset}else{z=u*(FZ-.4);x=(side===2?1:-1)*(FX-inset)}const front=z>BZ||x>BX;tryTree(x,z,front?.55+rnd()*.25:.8+rnd()*.5,rnd()>.55?1:0)}

// ---------- 5. Rochers de granit et quartz roses ----------
const granite=mat(0xffffff,{map:canvasTex(64,64,(g,w,h)=>{g.fillStyle='#9a9590';g.fillRect(0,0,w,h);for(let i=0;i<500;i++){const v=rnd();g.fillStyle=v>.75?'#e7b3c2':v>.45?'#5b5654':'#cfc9c2';g.fillRect(rnd()*w,rnd()*h,1+rnd()*2,1+rnd()*2)}}),flatShading:true});
const rockGeo=new THREE.IcosahedronGeometry(1,1);{const p=rockGeo.attributes.position;for(let i=0;i<p.count;i++){const n=noise(p.getX(i)*3,p.getZ(i)*3+p.getY(i));p.setXYZ(i,p.getX(i)*(1+n*.2),p.getY(i)*(1+n*.15),p.getZ(i)*(1+n*.2))}rockGeo.computeVertexNormals()}
for(let i=0;i<(software?14:30);i++){let x,z,tries=0;do{x=(rnd()*2-1)*(FX-.3);z=(rnd()*2-1)*(FZ-.3);tries++}while((outside(x,z)<.35||edgeDist(x,z)>2.2)&&tries<40);const s=.12+Math.pow(rnd(),1.6)*.35,y=bedH(x,z),m=add(rockGeo,granite);m.position.set(x,y+s*.25,z);m.scale.set(s,s*.7,s*(.7+rnd()*.4));m.rotation.y=rnd()*6}
const quartz=new THREE.MeshPhysicalMaterial({color:0xf7b6cb,emissive:0x8a2d54,emissiveIntensity:.25,roughness:.12,transparent:true,opacity:.9,clearcoat:1,flatShading:true});
const prism=new THREE.CylinderGeometry(0,1,1,6);prism.translate(0,.5,0);
function quartzCluster(x,z,s,parent=root){const g=new THREE.Group();g.position.set(x,bedH(x,z),z);parent.add(g);for(let k=0;k<5+Math.floor(rnd()*3);k++){const m=add(prism,quartz,g);const h=s*(.35+rnd()*.7)*(k?1:1.5);m.scale.set(s*.11,h,s*.11);m.position.set((rnd()-.5)*s*.35,-.02,(rnd()-.5)*s*.35);m.rotation.set((rnd()-.5)*.7,rnd()*6,(rnd()-.5)*.7)}return g}
for(const [x,z,s] of[[5.2,-HZ+.2,.55],[-5.0,1.8,.45],[4.9,HZ+.9,.4],[-4.9,-HZ-1.3,.5],[2.8,-BZ-.7,.4],[-2.4,BZ+.75,.4]])if(outside(x,z)>.4)quartzCluster(x,z,s);
// Quartz sous l'eau : on les devine à travers la surface.
for(let i=0;i<(software?4:10);i++){let x,z;do{x=(rnd()*2-1)*(FX-.8);z=(rnd()*2-1)*(FZ-.8)}while(outside(x,z)<.3||bedH(x,z)>-.25);quartzCluster(x,z,.3+rnd()*.2)}

// ---------- 6. Le vieux sanctuaire : pierres levées autour d'un grand quartz (îlot arrière gauche) ----------
{const I=islands[0],stoneMat=mat(0x8e8a84,{map:stoneTex,flatShading:true});for(let k=0;k<5;k++){const a=k/5*Math.PI*2+.3,x=I.x+Math.cos(a)*.62,z=I.z+Math.sin(a)*.55,h=.45+rnd()*.3,m=add(new THREE.BoxGeometry(.16,h,.1),stoneMat);m.position.set(x,bedH(x,z)+h/2-.03,z);m.rotation.set((rnd()-.5)*.12,-a,(rnd()-.5)*.12);const mo=add(new THREE.SphereGeometry(1,6,4),moss,root,false);mo.scale.set(.09,.03,.06);mo.position.set(x,bedH(x,z)+h-.02,z)}
 const heart=quartzCluster(I.x,I.z,.95);const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color:0xff9cc0,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.5}));halo.position.set(I.x,bedH(I.x,I.z)+.6,I.z);halo.scale.setScalar(1.3);root.add(halo);updates.push((t,l,moving)=>{halo.material.opacity=.4+(moving?Math.sin(t*1.2)*.12:0)})}

// ---------- 7. Roseaux et nénuphars (qui flottent avec l'eau) ----------
const reedGeo=new THREE.CylinderGeometry(.01,.018,1,5);reedGeo.translate(0,.5,0);const reeds=new THREE.InstancedMesh(reedGeo,mat(0x7f9f4c),software?40:110);let ri=0;
for(let i=0;i<500&&ri<reeds.count;i++){const x=(rnd()*2-1)*(FX-.3),z=(rnd()*2-1)*(FZ-.3),y=bedH(x,z);if(outside(x,z)<.5||y>WL+.04||y<WL-.18)continue;for(let k=0;k<4&&ri<reeds.count;k++){const px=x+(rnd()-.5)*.25,pz=z+(rnd()-.5)*.25;dummy.position.set(px,bedH(px,pz),pz);dummy.rotation.set((rnd()-.5)*.2,0,(rnd()-.5)*.2);dummy.scale.set(1,.45+rnd()*.5-bedH(px,pz),1);dummy.updateMatrix();reeds.setMatrixAt(ri++,dummy.matrix)}}
reeds.count=ri;root.add(reeds);
const padGeo=new THREE.CircleGeometry(1,16,.25,Math.PI*2-.5);padGeo.rotateX(-Math.PI/2);const padMats=[0x4f8a3c,0x5f9a45,0x3f7a35].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.6,side:THREE.DoubleSide}));
const lilyPetal=new THREE.SphereGeometry(1,8,6,0,Math.PI*2,0,Math.PI/2);const floaters=[];
function lilyCluster(cx,cz){for(let k=0;k<4+Math.floor(rnd()*4);k++){const x=cx+(rnd()-.5)*.8,z=cz+(rnd()-.5)*.8;if(outside(x,z)<.35||bedH(x,z)>WL-.06)continue;const g=new THREE.Group(),s=.1+rnd()*.08;const pad=new THREE.Mesh(padGeo,padMats[k%3]);pad.scale.setScalar(s);pad.receiveShadow=true;g.add(pad);
 if(rnd()>.55){const flower=new THREE.Group();for(let j=0;j<7;j++){const p=new THREE.Mesh(lilyPetal,new THREE.MeshStandardMaterial({color:j%2?0xffffff:0xffd8e4,roughness:.5}));p.scale.set(.022,.03,.05);p.position.set(Math.cos(j/7*6.28)*.025,.01,Math.sin(j/7*6.28)*.025);p.rotation.set(-.6,-j/7*6.28+Math.PI/2,0);flower.add(p)}const heart=new THREE.Mesh(new THREE.SphereGeometry(.014,6,4),new THREE.MeshStandardMaterial({color:0xf5c84a}));heart.position.y=.02;flower.add(heart);g.add(flower)}
 g.rotation.y=rnd()*6;root.add(g);g.renderOrder=3;floaters.push({g,x,z,y:.006,p:rnd()*6,spin:(rnd()-.5)*.05})}}
for(const [x,z] of[[-5.1,-1.2],[5.3,-HZ+1.6],[-4.9,HZ-1.8],[1.6,BZ+1],[-1.8,-BZ-1.1],[5.2,HZ-.6],[-5.2,3.0]])lilyCluster(x,z);

// ---------- 8. Ponton, barque, poissons, libellules ----------
const plank=mat(0x8a6446,{roughness:.8}),plankDark=mat(0x6a4a34);
{const px=BX+.35,pz=-1.4,len=1.9;for(let k=0;k<9;k++){const b=add(new THREE.BoxGeometry(.22,.04,.7),k%2?plank:plankDark);b.position.set(px+k*.215,TOP-.04,pz)}for(const dz of[-.3,.3])for(let k=0;k<3;k++){const post=add(new THREE.CylinderGeometry(.035,.035,.6,6),plankDark);post.position.set(px+.1+k*.85,TOP-.3,pz+dz)}
 const boat=new THREE.Group();boat.position.set(px+1.15,WL+.08,pz+.75);root.add(boat);const hull=add(new THREE.SphereGeometry(1,14,8,0,Math.PI*2,Math.PI/2,Math.PI/2),plank,boat);hull.scale.set(.62,.2,.24);hull.material=new THREE.MeshStandardMaterial({color:0x8a6446,roughness:.8,side:THREE.DoubleSide});const seat=add(new THREE.BoxGeometry(.06,.02,.4),plankDark,boat);seat.position.y=-.03;const oar=add(new THREE.BoxGeometry(.9,.015,.035),plankDark,boat);oar.position.set(.1,.02,.08);oar.rotation.y=.25;
 updates.push((t,l,moving)=>{boat.position.y=WL+.08+(moving?waveH(boat.position.x,boat.position.z,t)+Math.sin(t*1.1)*.01:0);boat.rotation.z=moving?Math.sin(t*.9)*.04:0;boat.rotation.x=moving?Math.sin(t*.7+1)*.03:0})}
const fishGeo=new THREE.SphereGeometry(1,8,6);const fishes=[];if(!software)for(let k=0;k<6;k++){const g=new THREE.Group(),c=k%3===0?0xd36a4a:0x58605a,body=new THREE.Mesh(fishGeo,new THREE.MeshStandardMaterial({color:c,roughness:.5}));body.scale.set(.16,.035,.05);g.add(body);const tail=new THREE.Mesh(new THREE.ConeGeometry(.045,.09,4),body.material);tail.rotation.z=Math.PI/2;tail.position.x=-.18;tail.scale.z=.4;g.add(tail);root.add(g);
 let cx,cz;do{cx=(rnd()*2-1)*(FX-1.4);cz=(rnd()*2-1)*(FZ-1.4)}while(outside(cx,cz)<.7||bedH(cx,cz)>-.35);fishes.push({g,tail,cx,cz,r:.35+rnd()*.35,v:(rnd()>.5?1:-1)*(.25+rnd()*.25),p:rnd()*6})}
updates.push((t,l,moving)=>{for(const f of fishes){const a=f.p+(moving?t*f.v:0),x=f.cx+Math.cos(a)*f.r,z=f.cz+Math.sin(a)*f.r*.8;f.g.position.set(x,Math.max(bedH(x,z)+.08,-.24),z);f.g.rotation.y=-a-(f.v>0?Math.PI/2:-Math.PI/2);f.tail.rotation.y=moving?Math.sin(t*9+f.p)*.5:0}});
for(const fl of floaters)updates.push((t,l,moving)=>{fl.g.position.set(fl.x,WL+fl.y+(moving?waveH(fl.x,fl.z,t):0),fl.z);if(moving)fl.g.rotation.y+=fl.spin*.02});
const dWing=new THREE.PlaneGeometry(.18,.04);dWing.translate(.09,0,0);dWing.rotateX(-Math.PI/2);const dWingMat=new THREE.MeshBasicMaterial({color:0xe6f6ff,transparent:true,opacity:.5,side:THREE.DoubleSide,depthWrite:false});const dragons=[];
for(let k=0;k<(software?1:3);k++){const g=new THREE.Group(),body=new THREE.Mesh(new THREE.CapsuleGeometry(.011,.18,2,5).rotateZ(Math.PI/2),new THREE.MeshStandardMaterial({color:[0xd0507e,0x2f6fd0,0x2aa38d][k],metalness:.4,roughness:.3}));g.add(body);const wings=[];for(const off of[.03,-.02])for(const s of[1,-1]){const w=new THREE.Mesh(dWing,dWingMat);w.position.set(off,.012,0);w.rotation.y=s>0?0:Math.PI;g.add(w);wings.push(w)}root.add(g);dragons.push({g,wings,p:rnd()*9,cx:[-5.2,5.4,1.8][k],cz:[-1.5,-HZ+1.4,BZ+1.1][k]})}
updates.push((t,l,moving)=>{for(const d of dragons){const T=moving?t:0,cyc=(T*.3+d.p)%1,hop=smooth(.7,1,cyc),seg=Math.floor(T*.3+d.p)%3,ox=[0,.6,-.4][seg],oz=[0,-.4,.5][seg],nx=[.6,-.4,0][seg],nz=[-.4,.5,0][seg];d.g.position.set(d.cx+mix(ox,nx,hop),.4+Math.sin(T*2+d.p)*.03+Math.sin(hop*Math.PI)*.12,d.cz+mix(oz,nz,hop));d.g.rotation.y=Math.atan2(nz-oz,nx-ox)*-1;const fl=moving?Math.sin(t*55+d.p)*.5:.15;d.wings.forEach((w,i)=>{w.rotation.x=(i%2?-1:1)*fl})}});

update0();function update0(){for(const u of updates)u(0,false,false)}
return{root,update(t,light,moving){for(const u of updates)u(t,light,moving)}};
}
