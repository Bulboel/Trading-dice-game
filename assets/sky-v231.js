/* v231 — Terrain foudre « Île céleste » : un sanctuaire d'ardoise flottant au-dessus d'une mer de nuages orageux.
   Entièrement procédural : terrasse aux veines électriques, falaises suspendues, mer de nuages, éclairs dans les nuages,
   pylônes de cuivre qui crépitent, îlots flottants à cristaux, étincelles. Les règles restent dans le moteur du jeu. */
import * as THREE from 'three';
export function createSkyIsland(world,software=false,rows=10){
const root=new THREE.Group();world.add(root);root.visible=false;
let seed=7331;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const HZ=rows/2,BX=4.25,BZ=HZ+.25;
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.9,...extra});
const add=(geo,material,parent=root,shadow=true)=>{const m=new THREE.Mesh(geo,material);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m};
const canvasTex=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t};
const updates=[],ELEC=new THREE.Color(0x9fe8ff),VIOLET=new THREE.Color(0xb9a6ff);

// ---------- 1. Terrasse d'ardoise aux veines électriques (zone de jeu) ----------
const cracks=[];// fissures partagées entre la texture et sa lueur
for(let k=0;k<26;k++){let x=rnd()*512,y=rnd()*64*rows;const pts=[[x,y]];for(let s=0;s<6;s++){x+=(rnd()-.5)*46;y+=(rnd()-.5)*46;pts.push([x,y])}cracks.push(pts)}
const slate=canvasTex(512,64*rows,(g,w,h)=>{g.fillStyle='#2b3140';g.fillRect(0,0,w,h);const cw=w/8,ch=h/rows;
 for(let y=0;y<rows;y++)for(let x=0;x<8;x++){const t=70+Math.floor(rnd()*22),gr=g.createLinearGradient(x*cw,y*ch,x*cw+cw,y*ch+ch);gr.addColorStop(0,`rgb(${t+6},${t+12},${t+26})`);gr.addColorStop(1,`rgb(${t-14},${t-10},${t+2})`);g.fillStyle=gr;g.fillRect(x*cw+3,y*ch+3,cw-6,ch-6);
  for(let k=0;k<40;k++){g.fillStyle=`rgba(${rnd()<.5?'210,225,255':'10,12,20'},${.04+rnd()*.05})`;g.fillRect(x*cw+4+rnd()*(cw-10),y*ch+4+rnd()*(ch-10),2+rnd()*4,1+rnd()*2)}}
 g.strokeStyle='#161a24';g.lineWidth=6;for(let x=0;x<=8;x++){g.beginPath();g.moveTo(x*cw,0);g.lineTo(x*cw,h);g.stroke()}for(let y=0;y<=rows;y++){g.beginPath();g.moveTo(0,y*ch);g.lineTo(w,y*ch);g.stroke()}
 g.strokeStyle='rgba(12,16,26,.9)';g.lineWidth=2;for(const p of cracks){g.beginPath();g.moveTo(...p[0]);for(const q of p.slice(1))g.lineTo(...q);g.stroke()}});
const veins=canvasTex(512,64*rows,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);g.shadowColor='#7fdcff';g.shadowBlur=8;g.strokeStyle='#bff0ff';g.lineWidth=1.6;for(const p of cracks){g.beginPath();g.moveTo(...p[0]);for(const q of p.slice(1))g.lineTo(...q);g.stroke()}
 g.shadowBlur=0;g.strokeStyle='rgba(120,200,255,.35)';g.lineWidth=1;const cw=w/8,ch=h/rows;for(let x=0;x<=8;x++){g.beginPath();g.moveTo(x*cw,0);g.lineTo(x*cw,h);g.stroke()}for(let y=0;y<=rows;y++){g.beginPath();g.moveTo(0,y*ch);g.lineTo(w,y*ch);g.stroke()}});
const shape=new THREE.Shape(),r=.4;shape.moveTo(-BX+r,-BZ);shape.lineTo(BX-r,-BZ);shape.quadraticCurveTo(BX,-BZ,BX,-BZ+r);shape.lineTo(BX,BZ-r);shape.quadraticCurveTo(BX,BZ,BX-r,BZ);shape.lineTo(-BX+r,BZ);shape.quadraticCurveTo(-BX,BZ,-BX,BZ-r);shape.lineTo(-BX,-BZ+r);shape.quadraticCurveTo(-BX,-BZ,-BX+r,-BZ);
const terraceGeo=new THREE.ExtrudeGeometry(shape,{depth:.5,bevelEnabled:true,bevelThickness:.07,bevelSize:.1,bevelSegments:3,curveSegments:6});terraceGeo.rotateX(-Math.PI/2);terraceGeo.translate(0,-.37,0);
{const p=terraceGeo.attributes.position,uv=terraceGeo.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)+4)/8,(p.getZ(i)+HZ)/rows)}
const topMat=mat(0xffffff,{map:slate,emissiveMap:veins,emissive:0x8fe3ff,emissiveIntensity:.55,roughness:.7,metalness:.15}),edgeMat=mat(0x343a4a,{roughness:.85,metalness:.1});
add(terraceGeo,[topMat,edgeMat]);
// Liseré de cuivre autour de la terrasse.
const copper=mat(0xb87333,{roughness:.35,metalness:.85});
for(const [x,z,w,d] of[[0,-BZ-.1,BX*2+.2,.08],[0,BZ+.1,BX*2+.2,.08],[-BX-.1,0,.08,BZ*2+.2],[BX+.1,0,.08,BZ*2+.2]]){const b=add(new THREE.BoxGeometry(w,.07,d),copper);b.position.set(x,.13,z)}
updates.push((t,light,moving)=>{topMat.emissiveIntensity=.42+(moving?.16*Math.sin(t*2.1)+.08*Math.sin(t*7.3):0)});

// ---------- 2. Falaises suspendues sous l'île ----------
const cliffMat=mat(0x2a2f3b,{roughness:.95,flatShading:true}),cliffLight=mat(0x3e4555,{roughness:.95,flatShading:true});
function hanging(w,d,depth,detail=5){const g=new THREE.ConeGeometry(1,1,detail+3,4,false);g.rotateX(Math.PI);g.translate(0,-.5,0);const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i),k=1+(rnd()-.5)*.35*(1+y);p.setX(i,p.getX(i)*k);p.setZ(i,p.getZ(i)*k)}g.computeVertexNormals();g.scale(w,depth,d);return g}
const under=add(hanging(BX*1.18,BZ*1.12,5.2,9),cliffMat);under.position.y=-.32;
for(let i=0;i<(software?8:16);i++){const a=rnd()*Math.PI*2,x=Math.cos(a)*BX*.85*rnd(),z=Math.sin(a)*BZ*.85*rnd(),s=.5+rnd()*1.1;const m=add(hanging(s,s*.9,1.5+rnd()*2.5,4),i%3?cliffMat:cliffLight);m.position.set(x,-.5-rnd()*.6,z);m.rotation.y=rnd()*6}
// Bord rocheux irrégulier autour de la terrasse.
const edgeRock=new THREE.DodecahedronGeometry(1,0);
for(let i=0;i<(software?24:46);i++){const side=i%4,u=rnd()*2-1;let x,z;if(side<2){x=(side?1:-1)*(BX+.3+rnd()*.25);z=u*BZ}else{z=(side===2?1:-1)*(BZ+.3+rnd()*.25);x=u*BX}const s=.2+rnd()*.25,m=add(edgeRock,i%2?cliffMat:cliffLight);m.position.set(x,-.05-rnd()*.25,z);m.scale.set(s,s*1.3,s);m.rotation.set(rnd(),rnd()*6,rnd())}

// ---------- 3. Mer de nuages orageux ----------
const cloudTex=canvasTex(256,256,(g,w,h)=>{for(let k=0;k<14;k++){const x=78+rnd()*100,y=100+rnd()*56,rr=28+rnd()*36,gr=g.createRadialGradient(x,y-rr*.25,rr*.1,x,y,rr);gr.addColorStop(0,'rgba(235,240,250,.95)');gr.addColorStop(.55,'rgba(150,160,180,.55)');gr.addColorStop(1,'rgba(80,88,110,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,rr,0,7);g.fill()}
 // bords toujours transparents : aucun contour carré visible
 g.globalCompositeOperation='destination-in';const m=g.createRadialGradient(128,128,40,128,128,126);m.addColorStop(0,'rgba(0,0,0,1)');m.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=m;g.fillRect(0,0,w,h)});
const clouds=[];const cloudCount=software?34:72;
// Nappe continue tout en bas : la mer de nuages n'a jamais de trou.
const seaTex=canvasTex(512,512,(g,w,h)=>{g.fillStyle='#262c3b';g.fillRect(0,0,w,h);for(let k=0;k<90;k++){const x=rnd()*w,y=rnd()*h,rr=30+rnd()*70,gr=g.createRadialGradient(x,y,0,x,y,rr);gr.addColorStop(0,'rgba(120,132,160,.35)');gr.addColorStop(1,'rgba(120,132,160,0)');g.fillStyle=gr;for(const ox of[-w,0,w])for(const oy of[-h,0,h]){g.save();g.translate(ox,oy);g.fillRect(x-rr,y-rr,rr*2,rr*2);g.restore()}}});seaTex.wrapS=seaTex.wrapT=THREE.RepeatWrapping;seaTex.repeat.set(11,11);
const sea=add(new THREE.PlaneGeometry(220,220),new THREE.MeshBasicMaterial({map:seaTex,color:0x8a93ab,fog:true}),root,false);sea.rotation.x=-Math.PI/2;sea.position.y=-4.4;updates.push((t,light,moving)=>{if(moving)seaTex.offset.set(t*.004,t*.002)});
for(let i=0;i<cloudCount;i++){const m=new THREE.SpriteMaterial({map:cloudTex,color:0x8d96ab,transparent:true,opacity:.92,depthWrite:false,fog:true}),sp=new THREE.Sprite(m);let x,z;do{x=rnd()*24-12;z=rnd()*24-12}while(Math.abs(x)<BX*.5&&Math.abs(z)<BZ*.5);
 const y=-1.1-rnd()*2.8,s=4.5+rnd()*4.5;sp.position.set(x,y,z);sp.scale.set(s,s*.55,1);root.add(sp);clouds.push({sp,m,x,z,y,speed:.05+rnd()*.08,base:new THREE.Color(0x8d96ab).lerp(new THREE.Color(0x5d6478),rnd()*.6)})}
for(const c of clouds)c.m.color.copy(c.base);
// Voiles de brume qui passent au niveau de l'île, sur les bords (jamais au-dessus des cases).
const wisps=[];for(let i=0;i<(software?5:10);i++){const m=new THREE.SpriteMaterial({map:cloudTex,color:0xaab4cc,transparent:true,opacity:.3,depthWrite:false}),sp=new THREE.Sprite(m),side=i%2?1:-1,x=side*(BX+1.6+rnd()*1.8),z=rnd()*14-7,s=2.4+rnd()*2;sp.position.set(x,-.2+rnd()*.9,z);sp.scale.set(s,s*.45,1);root.add(sp);wisps.push({sp,z,phase:rnd()*6,sp2:.15+rnd()*.15})}
updates.push((t,light,moving)=>{if(!moving)return;for(const w of wisps){w.sp.position.z=((w.z+t*w.sp2+7.5)%15)-7.5;w.sp.material.opacity=.22+.12*Math.sin(t*.5+w.phase)}});
// ---------- 4. Éclairs dans les nuages ----------
const flashLight=new THREE.PointLight(0xbfe9ff,0,22,1.5);flashLight.position.set(0,-1.5,0);root.add(flashLight);
const boltMat=new THREE.LineBasicMaterial({color:0xe6f8ff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}),glowMat=new THREE.LineBasicMaterial({color:0x7fd0ff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
function boltGeometry(a,b,jag=.5,branches=2){const pts=[],seg=12;let prev=a.clone();for(let i=1;i<=seg;i++){const t=i/seg,p=a.clone().lerp(b,t);if(i<seg){p.x+=(rnd()-.5)*jag;p.z+=(rnd()-.5)*jag}pts.push(prev,p);
  if(branches&&rnd()<.22){const end=p.clone().add(new THREE.Vector3((rnd()-.5)*1.6,-rnd()*1.2,(rnd()-.5)*1.6));let q=p.clone();for(let k=1;k<=4;k++){const r2=p.clone().lerp(end,k/4);r2.x+=(rnd()-.5)*.25;pts.push(q,r2);q=r2}}prev=p}
 return new THREE.BufferGeometry().setFromPoints(pts)}
const flashHalo=new THREE.Sprite(new THREE.SpriteMaterial({map:cloudTex,color:0xbfeaff,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));flashHalo.scale.set(7,4,1);root.add(flashHalo);
const bolt=new THREE.LineSegments(new THREE.BufferGeometry(),boltMat),boltGlow=new THREE.LineSegments(new THREE.BufferGeometry(),glowMat);bolt.frustumCulled=boltGlow.frustumCulled=false;root.add(boltGlow,bolt);
let nextStrike=2,strikeT=-10,strikeAt=new THREE.Vector3();
function strike(t){let x,z;do{x=rnd()*20-10;z=rnd()*20-10}while(Math.abs(x)<BX+1.5&&Math.abs(z)<BZ+1.5);strikeAt.set(x,-1.6,z);const top=new THREE.Vector3(x+(rnd()-.5)*2,1.6,z+(rnd()-.5)*2),bot=new THREE.Vector3(x,-4.3,z);
 bolt.geometry.dispose();boltGlow.geometry.dispose();const g=boltGeometry(top,bot,1.1,3);flashHalo.position.set(x,-1.3,z);bolt.geometry=g;boltGlow.geometry=g.clone();flashLight.position.copy(strikeAt);strikeT=t;nextStrike=t+2.5+rnd()*4.5}
updates.push((t,light,moving)=>{if(!moving){boltMat.opacity=glowMat.opacity=flashHalo.material.opacity=0;flashLight.intensity=0;return}if(t>nextStrike)strike(t);const e=t-strikeT,f=e<0?0:e<.08?1:e<.16?.25:e<.24?.85:Math.max(0,1-(e-.24)/.35);
 boltMat.opacity=f;glowMat.opacity=f*.6;flashHalo.material.opacity=f*.75;flashLight.intensity=light?0:f*30;for(const c of clouds){const d=Math.hypot(c.sp.position.x-strikeAt.x,c.sp.position.z-strikeAt.z),k=f*Math.max(0,1-d/7);c.m.color.copy(c.base).lerp(ELEC,k*.8)}});
updates.push((t,light,moving)=>{if(!moving)return;for(const c of clouds){c.sp.position.x=c.x+Math.sin(t*c.speed+c.z)*1.2;c.sp.position.y=c.y+Math.sin(t*c.speed*1.7+c.x)*.12}});

// ---------- 5. Pylônes de cuivre qui crépitent ----------
const orbMat=new THREE.MeshStandardMaterial({color:0xd9f6ff,emissive:0x7fdcff,emissiveIntensity:1.6,roughness:.2});
const ringGeo=new THREE.TorusGeometry(.16,.025,8,24);ringGeo.rotateX(Math.PI/2);
const pylons=[];
for(const [x,z] of[[-BX-.55,-BZ+.6],[BX+.55,-BZ+.6],[-BX-.55,BZ-.6],[BX+.55,BZ-.6]]){const g=new THREE.Group();g.position.set(x,0,z);root.add(g);
 const base=add(new THREE.CylinderGeometry(.24,.3,.22,8),edgeMat,g);base.position.y=.05;const mast=add(new THREE.CylinderGeometry(.06,.09,1.3,8),copper,g);mast.position.y=.8;
 for(let k=0;k<3;k++){const ring=add(ringGeo,copper,g);ring.position.y=.55+k*.28;ring.scale.setScalar(1-k*.18)}
 const orb=add(new THREE.SphereGeometry(.13,16,12),orbMat,g,false);orb.position.y=1.55;
 if(!software){const l=new THREE.PointLight(0x8fe0ff,2.4,3.6,2);l.position.y=1.55;g.add(l)}
 const arc=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xdff7ff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));arc.frustumCulled=false;g.add(arc);
 pylons.push({g,orb,arc,next:rnd()*2,t0:-9})}
updates.push((t,light,moving)=>{orbMat.emissiveIntensity=1.3+(moving?.5*Math.sin(t*6.3)*Math.sin(t*2.1):0);if(!moving){for(const p of pylons)p.arc.material.opacity=0;return}
 for(const p of pylons){if(t>p.next){p.arc.geometry.dispose();const a=new THREE.Vector3(0,1.55,0),b=new THREE.Vector3((rnd()-.5)*.9,1.55+(rnd()-.2)*.5,(rnd()-.5)*.9);p.arc.geometry=boltGeometry(a,b,.18,0);p.t0=t;p.next=t+.6+rnd()*2.2}
  const e=t-p.t0;p.arc.material.opacity=e<.12?1:Math.max(0,1-(e-.12)/.12)}});

// ---------- 6. Îlots flottants à cristaux ----------
const crystalMat=new THREE.MeshStandardMaterial({color:0xcfe9ff,emissive:0x8a7dff,emissiveIntensity:1.2,roughness:.25,metalness:.1,transparent:true,opacity:.9});
const crystalGeo=new THREE.OctahedronGeometry(.14,0);crystalGeo.scale(1,2.2,1);
const islets=[];
for(const [x,z,s,y] of[[-6.3,-4.6,.9,.2],[6.4,-2.2,.7,.5],[-6.6,3.2,.75,.35],[6.1,4.9,1,.15],[-2.6,-7.1,.55,.6],[3.2,7.2,.6,.45]]){const g=new THREE.Group();g.position.set(x,y,z);root.add(g);
 const top=add(new THREE.CylinderGeometry(.75,.6,.18,7),cliffLight,g);top.scale.set(s,1,s*.85);const below=add(hanging(.7*s,.6*s,1.4*s,4),cliffMat,g);below.position.y=-.09;
 const n=1+Math.floor(rnd()*3);for(let k=0;k<n;k++){const c=add(crystalGeo,crystalMat,g,false);c.position.set((rnd()-.5)*.6*s,.25+rnd()*.15,(rnd()-.5)*.5*s);c.rotation.set((rnd()-.5)*.5,rnd()*6,(rnd()-.5)*.5);c.scale.setScalar(.7+rnd()*.7)}
 islets.push({g,y,phase:rnd()*6})}
updates.push((t,light,moving)=>{crystalMat.emissiveIntensity=1+(moving?.35*Math.sin(t*1.5):0);if(!moving)return;for(const i of islets){i.g.position.y=i.y+Math.sin(t*.6+i.phase)*.12;i.g.rotation.y=Math.sin(t*.2+i.phase)*.15}});

// ---------- 7. Étincelles et poussière électrique ----------
const softTex=canvasTex(64,64,(g,w,h)=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.35,'rgba(255,255,255,.4)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,w,h)});
const sparkCount=software?16:40,sparkGeo=new THREE.BufferGeometry(),sparkPos=new Float32Array(sparkCount*3),sparkSeeds=[];
for(let i=0;i<sparkCount;i++){let x,z;do{x=rnd()*14-7;z=rnd()*15-7.5}while(Math.abs(x)<BX-.2&&Math.abs(z)<BZ-.2&&rnd()<.85);sparkSeeds.push({x,z,y:.3+rnd()*1.8,sp:.3+rnd()*.6,phase:rnd()*6})}
sparkGeo.setAttribute('position',new THREE.BufferAttribute(sparkPos,3));
const sparks=new THREE.Points(sparkGeo,new THREE.PointsMaterial({map:softTex,color:0xbfeeff,size:.22,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));sparks.frustumCulled=false;root.add(sparks);
function placeSparks(t){for(let i=0;i<sparkCount;i++){const s=sparkSeeds[i];sparkPos[i*3]=s.x+Math.sin(t*s.sp+s.phase)*.3;sparkPos[i*3+1]=s.y+((t*s.sp*.3+s.phase)%1.6)-.8;sparkPos[i*3+2]=s.z+Math.cos(t*s.sp+s.phase)*.3}sparkGeo.attributes.position.needsUpdate=true}
placeSparks(0);updates.push((t,light,moving)=>{if(moving)placeSparks(t);sparks.material.opacity=.55+(moving?.45*Math.abs(Math.sin(t*3.1)):0)});
return{root,update(t,light,moving){for(const u of updates)u(t,light,moving)}};
}
