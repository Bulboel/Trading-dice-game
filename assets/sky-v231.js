/* v231 → v243 — Terrain foudre « Île céleste » : un sanctuaire d'ardoise flottant au-dessus d'une mer de nuages orageux.
   v243 : veines électriques fines le long des joints (ramifications de Lichtenberg + impulsions), roches organiques feuilletées,
   filons de cristal sous l'île, îlots détaillés (colonnes, paratonnerres, débris en orbite).
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
const updates=[],ELEC=new THREE.Color(0xc8a0ff),VIOLET=new THREE.Color(0xb9a6ff);

// ---------- 1. Terrasse d'ardoise : de fines veines électriques courent dans les joints (zone de jeu) ----------
// v243 — Les veines suivent les joints entre les dalles et ne s'avancent que de quelques millimètres dans les cases
// (ramifications de Lichtenberg très fines) : le centre de chaque case reste parfaitement net.
const fbm=(x,y,z=0)=>{let v=0,a=.5,f=1;for(let o=0;o<4;o++){v+=a*Math.sin(x*f*1.7+Math.sin(y*f*1.3+z*f*.7)*1.4)*Math.cos(y*f*1.9-z*f*1.1+Math.sin(x*f*.9));a*=.5;f*=2.1}return v};
const CW=128,TW=CW*8,TH=CW*rows;
const slate=canvasTex(TW,TH,(g,w,h)=>{g.fillStyle='#141824';g.fillRect(0,0,w,h);const img=g.getImageData(0,0,w,h),d=img.data;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const cx=x%CW,cy=y%CW,e=Math.min(cx,cy,CW-1-cx,CW-1-cy);if(e<3)continue;const cell=Math.floor(x/CW)+Math.floor(y/CW)*8,tone=((cell*7919)%23)/23,layer=Math.sin(y*.09+fbm(x*.01,y*.01)*3)*.5+.5,grain=fbm(x*.05,y*.05,cell)*.5+.5,bevel=Math.min(1,(e-3)/6),
  v=(.27+tone*.05+layer*.04+grain*.06)*(.72+.28*bevel),i=(y*w+x)*4;d[i]=v*214;d[i+1]=v*194;d[i+2]=v*246}
 g.putImageData(img,0,0)});
const veins=canvasTex(TW,TH,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);g.lineCap='round';g.lineJoin='round';
 // Joints : un fil d'énergie fin, plus vif par endroits.
 const seg=(x1,y1,x2,y2,a,wd)=>{g.strokeStyle=`rgba(190,150,255,${a})`;g.lineWidth=wd;g.beginPath();g.moveTo(x1,y1);const n=8;for(let k=1;k<=n;k++){const t=k/n,j=k<n?(rnd()-.5)*1.6:0;g.lineTo(x1+(x2-x1)*t+(y1===y2?0:j),y1+(y2-y1)*t+(x1===x2?0:j))}g.stroke()};
 g.shadowColor='#a05cff';g.shadowBlur=7;
 for(let X=1;X<8;X++)for(let Y=0;Y<rows;Y++){const hot=rnd()<.3;seg(X*CW,Y*CW,X*CW,(Y+1)*CW,hot?.95:.2,hot?2.6:1.4)}
 for(let Y=1;Y<rows;Y++)for(let X=0;X<8;X++){const hot=rnd()<.3;seg(X*CW,Y*CW,(X+1)*CW,Y*CW,hot?.95:.2,hot?2.6:1.4)}
 // Ramifications de Lichtenberg : partent des intersections, restent dans la bordure des cases (≤ 22 % de la case).
 const branch=(x,y,ang,len,wd,depth)=>{if(depth>4||len<3)return;const steps=Math.max(2,Math.round(len/5));let px=x,py=y;g.strokeStyle=`rgba(228,206,255,${.95-depth*.14})`;g.lineWidth=wd;g.beginPath();g.moveTo(px,py);
  for(let k=0;k<steps;k++){ang+=(rnd()-.5)*.9;px+=Math.cos(ang)*len/steps;py+=Math.sin(ang)*len/steps;g.lineTo(px,py);if(rnd()<.35)branch(px,py,ang+(rnd()<.5?-1:1)*(.5+rnd()*.6),len*.55,wd*.65,depth+1)}g.stroke()};
 for(let X=1;X<8;X++)for(let Y=1;Y<rows;Y++){if(rnd()>.6)continue;const n=1+Math.floor(rnd()*2);for(let k=0;k<n;k++){const q=Math.floor(rnd()*4),ang=q*Math.PI/2+Math.PI/4+(rnd()-.5)*.6;branch(X*CW,Y*CW,ang,CW*(.16+rnd()*.14),2.6,0)}}
 // Le long des joints aussi, de minuscules filaments perpendiculaires.
 for(let k=0;k<rows*22;k++){const vert=rnd()<.5,X=vert?(1+Math.floor(rnd()*7))*CW:rnd()*w,Y=vert?rnd()*h:(1+Math.floor(rnd()*(rows-1)))*CW,ang=(vert?0:Math.PI/2)+(rnd()<.5?0:Math.PI)+(rnd()-.5)*.8;branch(X,Y,ang,CW*(.08+rnd()*.1),2,1)}
 g.shadowBlur=0});
const shape=new THREE.Shape(),r=.4;shape.moveTo(-BX+r,-BZ);shape.lineTo(BX-r,-BZ);shape.quadraticCurveTo(BX,-BZ,BX,-BZ+r);shape.lineTo(BX,BZ-r);shape.quadraticCurveTo(BX,BZ,BX-r,BZ);shape.lineTo(-BX+r,BZ);shape.quadraticCurveTo(-BX,BZ,-BX,BZ-r);shape.lineTo(-BX,-BZ+r);shape.quadraticCurveTo(-BX,-BZ,-BX+r,-BZ);
const terraceGeo=new THREE.ExtrudeGeometry(shape,{depth:.5,bevelEnabled:true,bevelThickness:.07,bevelSize:.1,bevelSegments:3,curveSegments:6});terraceGeo.rotateX(-Math.PI/2);terraceGeo.translate(0,-.37,0);
{const p=terraceGeo.attributes.position,uv=terraceGeo.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)+4)/8,(p.getZ(i)+HZ)/rows)}
const topMat=mat(0xffffff,{map:slate,emissiveMap:veins,emissive:0xb98cff,emissiveIntensity:.9,roughness:.62,metalness:.18}),edgeMat=mat(0x343a4a,{roughness:.85,metalness:.1});
add(terraceGeo,[topMat,edgeMat]);
// Liseré de cuivre autour de la terrasse.
const copper=mat(0xb87333,{roughness:.35,metalness:.85}),orbMatI=new THREE.MeshStandardMaterial({color:0xecdcff,emissive:0xb07dff,emissiveIntensity:1.6,roughness:.2});
for(const [x,z,w,d] of[[0,-BZ-.1,BX*2+.2,.08],[0,BZ+.1,BX*2+.2,.08],[-BX-.1,0,.08,BZ*2+.2],[BX+.1,0,.08,BZ*2+.2]]){const b=add(new THREE.BoxGeometry(w,.07,d),copper);b.position.set(x,.13,z)}
updates.push((t,light,moving)=>{topMat.emissiveIntensity=.8+(moving?.18*Math.sin(t*2.1)+.1*Math.sin(t*7.3)*Math.sin(t*1.3):0)});
// Impulsions d'énergie qui filent d'intersection en intersection, le long des joints.
const pulseTex=canvasTex(64,64,(g,w,h)=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.25,'rgba(220,196,255,.8)');r.addColorStop(1,'rgba(160,110,255,0)');g.fillStyle=r;g.fillRect(0,0,w,h)});
const pulses=[];for(let i=0;i<(software?6:18);i++){const head=new THREE.Sprite(new THREE.SpriteMaterial({map:pulseTex,color:0xe6d2ff,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})),tail=new THREE.Sprite(head.material.clone());head.scale.setScalar(.2);tail.scale.setScalar(.13);tail.material.opacity=.5;root.add(head,tail);
 const X=Math.floor(rnd()*9),Y=Math.floor(rnd()*(rows+1));pulses.push({head,tail,ax:X,ay:Y,bx:X,by:Y,k:1,v:1.4+rnd()*1.4})}
const stepPulse=p=>{p.ax=p.bx;p.ay=p.by;for(let n=0;n<8;n++){const d=[[1,0],[-1,0],[0,1],[0,-1]][Math.floor(rnd()*4)],x=p.ax+d[0],y=p.ay+d[1];if(x>=0&&x<=8&&y>=0&&y<=rows){p.bx=x;p.by=y;break}}p.k=0};
const jointPos=(x,y)=>new THREE.Vector3(x-4,.205,y-HZ);
updates.push((t,light,moving)=>{for(const p of pulses){p.head.visible=p.tail.visible=moving;if(!moving)continue;p.k+=p.v*.016;if(p.k>=1)stepPulse(p);const a=jointPos(p.ax,p.ay),b=jointPos(p.bx,p.by);p.head.position.copy(a).lerp(b,p.k);p.tail.position.copy(a).lerp(b,Math.max(0,p.k-.18));p.head.material.opacity=.75+.25*Math.sin(t*20+p.v)}});

// ---------- 2. Falaises suspendues sous l'île : schiste feuilleté, stalactites et filons de cristal ----------
const cliffMat=mat(0xffffff,{roughness:.92,flatShading:true,vertexColors:true}),cliffLight=cliffMat;
// Roche organique : icosaèdre subdivisé, bruit fractal, strates horizontales claires et sombres.
function stoneGeo(sx,sy,sz,seedOff=0,detail=2,flatTop=false){const g=new THREE.IcosahedronGeometry(1,detail),p=g.attributes.position,c=[];for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const n=fbm(x*1.6+seedOff,y*1.6,z*1.6-seedOff)+fbm(x*4.1,y*4.3+seedOff,z*3.9)*.35;x*=1+n*.32;z*=1+n*.32;y*=1+n*.2;if(flatTop&&y>.35)y=.35+(y-.35)*.15+fbm(x*4,z*4)*.02;p.setXYZ(i,x*sx,y*sy,z*sz);
  const band=Math.sin(y*sy*9+fbm(x,z)*2)*.5+.5,top=flatTop&&y>.3?1:0,col=new THREE.Color(0x1d212c).lerp(new THREE.Color(0x353c4e),band*.7).lerp(new THREE.Color(0x48506a),top*.55);c.push(col.r,col.g,col.b)}
 g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.computeVertexNormals();return g}
function hanging(w,d,depth){const g=new THREE.ConeGeometry(1,1,software?10:18,software?5:10,false);g.rotateX(Math.PI);g.translate(0,-.5,0);const p=g.attributes.position,c=[];for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),a=Math.atan2(z,x),n=fbm(Math.cos(a)*2+w,y*3,Math.sin(a)*2),k=1+n*.3*(1+y);p.setX(i,x*k);p.setZ(i,z*k);p.setY(i,y*(1+Math.max(0,n)*.25));
  const band=Math.sin(y*14+n*2)*.5+.5,col=new THREE.Color(0x1f2430).lerp(new THREE.Color(0x3b4256),band*.6).lerp(new THREE.Color(0x14171f),Math.min(1,-y*.8));c.push(col.r,col.g,col.b)}
 g.setAttribute('color',new THREE.Float32BufferAttribute(c,3));g.computeVertexNormals();g.scale(w,depth,d);return g}
const under=add(hanging(BX*1.18,BZ*1.12,5.2),cliffMat);under.position.y=-.32;
for(let i=0;i<(software?8:16);i++){const a=rnd()*Math.PI*2,x=Math.cos(a)*BX*.85*rnd(),z=Math.sin(a)*BZ*.85*rnd(),s=.5+rnd()*1.1;const m=add(hanging(s,s*.9,1.5+rnd()*2.5),cliffMat);m.position.set(x,-.5-rnd()*.6,z);m.rotation.y=rnd()*6}
// Filons de cristal qui luisent sous l'île.
const veinCrystal=new THREE.MeshStandardMaterial({color:0xe8d8ff,emissive:0xa070ff,emissiveIntensity:1.4,roughness:.2,transparent:true,opacity:.92,flatShading:true});const shardG=new THREE.OctahedronGeometry(1,0);
for(let i=0;i<(software?10:26);i++){const a=rnd()*Math.PI*2,rr=.55+rnd()*.4,y=-.6-rnd()*2.2,k=1-(-y-.3)/5,x=Math.cos(a)*BX*1.05*rr*k,z=Math.sin(a)*BZ*1.0*rr*k,m=add(shardG,veinCrystal,root,false);m.position.set(x,y,z);m.scale.set(.06+rnd()*.05,.18+rnd()*.25,.06+rnd()*.05);m.rotation.set((rnd()-.5)*1.4+Math.PI,rnd()*6,(rnd()-.5)*1.4)}
// Bord rocheux : blocs de schiste organiques autour de la terrasse (jamais sur les cases).
for(let i=0;i<(software?16:30);i++){const side=i%4,u=rnd()*2-1;let x,z;if(side<2){x=(side?1:-1)*(BX+.36+rnd()*.25);z=u*BZ}else{z=(side===2?1:-1)*(BZ+.36+rnd()*.25);x=u*BX}const s=.22+rnd()*.26,m=add(stoneGeo(s,s*.8,s*(.8+rnd()*.4),i*1.7,2,true),cliffMat);m.position.set(x,-.02-rnd()*.2,z);m.rotation.y=rnd()*6}

// ---------- 3. Mer de nuages orageux ----------
const cloudTex=canvasTex(256,256,(g,w,h)=>{for(let k=0;k<14;k++){const x=78+rnd()*100,y=100+rnd()*56,rr=28+rnd()*36,gr=g.createRadialGradient(x,y-rr*.25,rr*.1,x,y,rr);gr.addColorStop(0,'rgba(235,240,250,.95)');gr.addColorStop(.55,'rgba(150,160,180,.55)');gr.addColorStop(1,'rgba(80,88,110,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,rr,0,7);g.fill()}
 // bords toujours transparents : aucun contour carré visible
 g.globalCompositeOperation='destination-in';const m=g.createRadialGradient(128,128,40,128,128,126);m.addColorStop(0,'rgba(0,0,0,1)');m.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=m;g.fillRect(0,0,w,h)});
const clouds=[];const cloudCount=software?34:72;
// Nappe continue tout en bas : la mer de nuages n'a jamais de trou.
const seaTex=canvasTex(512,512,(g,w,h)=>{g.fillStyle='#2b2640';g.fillRect(0,0,w,h);for(let k=0;k<90;k++){const x=rnd()*w,y=rnd()*h,rr=30+rnd()*70,gr=g.createRadialGradient(x,y,0,x,y,rr);gr.addColorStop(0,'rgba(140,124,166,.35)');gr.addColorStop(1,'rgba(140,124,166,0)');g.fillStyle=gr;for(const ox of[-w,0,w])for(const oy of[-h,0,h]){g.save();g.translate(ox,oy);g.fillRect(x-rr,y-rr,rr*2,rr*2);g.restore()}}});seaTex.wrapS=seaTex.wrapT=THREE.RepeatWrapping;seaTex.repeat.set(11,11);
const sea=add(new THREE.PlaneGeometry(220,220),new THREE.MeshBasicMaterial({map:seaTex,color:0x928aab,fog:true}),root,false);sea.rotation.x=-Math.PI/2;sea.position.y=-4.4;updates.push((t,light,moving)=>{if(moving)seaTex.offset.set(t*.004,t*.002)});
for(let i=0;i<cloudCount;i++){const m=new THREE.SpriteMaterial({map:cloudTex,color:0x968dab,transparent:true,opacity:.92,depthWrite:false,fog:true}),sp=new THREE.Sprite(m);let x,z;do{x=rnd()*24-12;z=rnd()*24-12}while(Math.abs(x)<BX*.5&&Math.abs(z)<BZ*.5);
 const y=-1.1-rnd()*2.8,s=4.5+rnd()*4.5;sp.position.set(x,y,z);sp.scale.set(s,s*.55,1);root.add(sp);clouds.push({sp,m,x,z,y,speed:.05+rnd()*.08,base:new THREE.Color(0x968dab).lerp(new THREE.Color(0x645d78),rnd()*.6)})}
for(const c of clouds)c.m.color.copy(c.base);
// Voiles de brume qui passent au niveau de l'île, sur les bords (jamais au-dessus des cases).
const wisps=[];for(let i=0;i<(software?5:10);i++){const m=new THREE.SpriteMaterial({map:cloudTex,color:0xaab4cc,transparent:true,opacity:.3,depthWrite:false}),sp=new THREE.Sprite(m),side=i%2?1:-1,x=side*(BX+1.6+rnd()*1.8),z=rnd()*14-7,s=2.4+rnd()*2;sp.position.set(x,-.2+rnd()*.9,z);sp.scale.set(s,s*.45,1);root.add(sp);wisps.push({sp,z,phase:rnd()*6,sp2:.15+rnd()*.15})}
updates.push((t,light,moving)=>{if(!moving)return;for(const w of wisps){w.sp.position.z=((w.z+t*w.sp2+7.5)%15)-7.5;w.sp.material.opacity=.22+.12*Math.sin(t*.5+w.phase)}});
// ---------- 4. Éclairs dans les nuages ----------
const flashLight=new THREE.PointLight(0xdcc0ff,0,22,1.5);flashLight.position.set(0,-1.5,0);root.add(flashLight);
const boltMat=new THREE.LineBasicMaterial({color:0xf2e6ff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}),glowMat=new THREE.LineBasicMaterial({color:0xa878ff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
function boltGeometry(a,b,jag=.5,branches=2){const pts=[],seg=12;let prev=a.clone();for(let i=1;i<=seg;i++){const t=i/seg,p=a.clone().lerp(b,t);if(i<seg){p.x+=(rnd()-.5)*jag;p.z+=(rnd()-.5)*jag}pts.push(prev,p);
  if(branches&&rnd()<.22){const end=p.clone().add(new THREE.Vector3((rnd()-.5)*1.6,-rnd()*1.2,(rnd()-.5)*1.6));let q=p.clone();for(let k=1;k<=4;k++){const r2=p.clone().lerp(end,k/4);r2.x+=(rnd()-.5)*.25;pts.push(q,r2);q=r2}}prev=p}
 return new THREE.BufferGeometry().setFromPoints(pts)}
const flashHalo=new THREE.Sprite(new THREE.SpriteMaterial({map:cloudTex,color:0xdcc0ff,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));flashHalo.scale.set(7,4,1);root.add(flashHalo);
const bolt=new THREE.LineSegments(new THREE.BufferGeometry(),boltMat),boltGlow=new THREE.LineSegments(new THREE.BufferGeometry(),glowMat);bolt.frustumCulled=boltGlow.frustumCulled=false;root.add(boltGlow,bolt);
let nextStrike=2,strikeT=-10,strikeAt=new THREE.Vector3();
function strike(t){let x,z;do{x=rnd()*20-10;z=rnd()*20-10}while(Math.abs(x)<BX+1.5&&Math.abs(z)<BZ+1.5);strikeAt.set(x,-1.6,z);const top=new THREE.Vector3(x+(rnd()-.5)*2,1.6,z+(rnd()-.5)*2),bot=new THREE.Vector3(x,-4.3,z);
 bolt.geometry.dispose();boltGlow.geometry.dispose();const g=boltGeometry(top,bot,1.1,3);flashHalo.position.set(x,-1.3,z);bolt.geometry=g;boltGlow.geometry=g.clone();flashLight.position.copy(strikeAt);strikeT=t;nextStrike=t+2.5+rnd()*4.5}
updates.push((t,light,moving)=>{if(!moving){boltMat.opacity=glowMat.opacity=flashHalo.material.opacity=0;flashLight.intensity=0;return}if(t>nextStrike)strike(t);const e=t-strikeT,f=e<0?0:e<.08?1:e<.16?.25:e<.24?.85:Math.max(0,1-(e-.24)/.35);
 boltMat.opacity=f;glowMat.opacity=f*.6;flashHalo.material.opacity=f*.75;flashLight.intensity=light?0:f*30;for(const c of clouds){const d=Math.hypot(c.sp.position.x-strikeAt.x,c.sp.position.z-strikeAt.z),k=f*Math.max(0,1-d/7);c.m.color.copy(c.base).lerp(ELEC,k*.8)}});
updates.push((t,light,moving)=>{if(!moving)return;for(const c of clouds){c.sp.position.x=c.x+Math.sin(t*c.speed+c.z)*1.2;c.sp.position.y=c.y+Math.sin(t*c.speed*1.7+c.x)*.12}});

// ---------- 5. Pylônes de cuivre qui crépitent ----------
const orbMat=new THREE.MeshStandardMaterial({color:0xecdcff,emissive:0xb07dff,emissiveIntensity:1.6,roughness:.2});
const ringGeo=new THREE.TorusGeometry(.16,.025,8,24);ringGeo.rotateX(Math.PI/2);
const pylons=[];
for(const [x,z] of[[-BX-.55,-BZ+.6],[BX+.55,-BZ+.6],[-BX-.55,BZ-.6],[BX+.55,BZ-.6]]){const g=new THREE.Group();g.position.set(x,0,z);root.add(g);
 const base=add(new THREE.CylinderGeometry(.24,.3,.22,8),edgeMat,g);base.position.y=.05;const mast=add(new THREE.CylinderGeometry(.06,.09,1.3,8),copper,g);mast.position.y=.8;
 for(let k=0;k<3;k++){const ring=add(ringGeo,copper,g);ring.position.y=.55+k*.28;ring.scale.setScalar(1-k*.18)}
 const orb=add(new THREE.SphereGeometry(.13,16,12),orbMat,g,false);orb.position.y=1.55;
 if(!software){const l=new THREE.PointLight(0xb98cff,2.4,3.6,2);l.position.y=1.55;g.add(l)}
 const arc=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xeedfff,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));arc.frustumCulled=false;g.add(arc);
 pylons.push({g,orb,arc,next:rnd()*2,t0:-9})}
updates.push((t,light,moving)=>{orbMat.emissiveIntensity=1.3+(moving?.5*Math.sin(t*6.3)*Math.sin(t*2.1):0);if(!moving){for(const p of pylons)p.arc.material.opacity=0;return}
 for(const p of pylons){if(t>p.next){p.arc.geometry.dispose();const a=new THREE.Vector3(0,1.55,0),b=new THREE.Vector3((rnd()-.5)*.9,1.55+(rnd()-.2)*.5,(rnd()-.5)*.9);p.arc.geometry=boltGeometry(a,b,.18,0);p.t0=t;p.next=t+.6+rnd()*2.2}
  const e=t-p.t0;p.arc.material.opacity=e<.12?1:Math.max(0,1-(e-.12)/.12)}});

// ---------- 6. Îlots flottants : roche feuilletée, sommet plat, cristaux, colonnes brisées, débris en orbite ----------
const crystalMat=new THREE.MeshStandardMaterial({color:0xe0ccff,emissive:0x8a7dff,emissiveIntensity:1.2,roughness:.25,metalness:.1,transparent:true,opacity:.9,flatShading:true});
const crystalGeo=new THREE.OctahedronGeometry(.14,0);crystalGeo.scale(1,2.2,1);
const runeStone=mat(0x6c7690,{roughness:.8,flatShading:true});const islets=[];
for(const [x,z,s,y,kind] of[[-6.3,-4.6,.9,.2,0],[6.4,-2.2,.7,.5,1],[-6.6,3.2,.75,.35,2],[6.1,4.9,1,.15,0],[-2.6,-7.1,.55,.6,1],[3.2,7.2,.6,.45,2]]){const g=new THREE.Group();g.position.set(x,y,z);root.add(g);
 const top=add(stoneGeo(.8*s,.32*s,.68*s,x+z,software?1:2,true),cliffMat,g);top.position.y=-.02;const below=add(hanging(.72*s,.6*s,1.6*s),cliffMat,g);below.position.y=-.1;
 for(let k=0;k<(software?1:3);k++){const st=add(hanging(.12*s,.12*s,(.4+rnd()*.5)*s),cliffMat,g);st.position.set((rnd()-.5)*.7*s,-.3*s-rnd()*.4*s,(rnd()-.5)*.6*s)}
 const n=2+Math.floor(rnd()*3);for(let k=0;k<n;k++){const c=add(crystalGeo,crystalMat,g,false);c.position.set((rnd()-.5)*.55*s,.12*s+.12,(rnd()-.5)*.45*s);c.rotation.set((rnd()-.5)*.6,rnd()*6,(rnd()-.5)*.6);c.scale.setScalar(.6+rnd()*.8)}
 if(kind===1){const col=add(new THREE.CylinderGeometry(.09,.11,.6,7),runeStone,g);col.position.set(.15*s,.38,-.1*s);col.rotation.z=.12;const cap=add(new THREE.BoxGeometry(.26,.07,.26),runeStone,g);cap.position.set(.18*s,.7,-.1*s);cap.rotation.set(.25,.4,.1)}
 if(kind===2){const rod=add(new THREE.CylinderGeometry(.018,.025,.9,6),copper,g);rod.position.set(-.1*s,.5,.05);const tipO=add(new THREE.SphereGeometry(.05,10,8),orbMatI,g,false);tipO.position.set(-.1*s,.97,.05)}
 const debris=[];for(let k=0;k<(software?2:5);k++){const d=add(stoneGeo(.06+rnd()*.05,.05,.06,k+x,0),cliffMat,g);debris.push({d,a:rnd()*6,r:(.75+rnd()*.4)*s,y:-.25-rnd()*.5,v:.25+rnd()*.3})}
 const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:pulseTex,color:0xa890ff,transparent:true,opacity:.25,depthWrite:false,blending:THREE.AdditiveBlending}));glow.position.y=-.5*s;glow.scale.set(1.6*s,1*s,1);g.add(glow);
 islets.push({g,y,phase:rnd()*6,debris})}
updates.push((t,light,moving)=>{crystalMat.emissiveIntensity=1+(moving?.35*Math.sin(t*1.5):0);veinCrystal.emissiveIntensity=1.2+(moving?.4*Math.sin(t*2.3)*Math.sin(t*.7):0);if(!moving)return;for(const i of islets){i.g.position.y=i.y+Math.sin(t*.6+i.phase)*.12;i.g.rotation.y=Math.sin(t*.2+i.phase)*.15;for(const d of i.debris){const a=d.a+t*d.v;d.d.position.set(Math.cos(a)*d.r,d.y+Math.sin(t*1.1+d.a)*.05,Math.sin(a)*d.r);d.d.rotation.set(t*.5+d.a,t*.3,0)}}});

// ---------- 7. Étincelles et poussière électrique ----------
const softTex=canvasTex(64,64,(g,w,h)=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.35,'rgba(255,255,255,.4)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,w,h)});
const sparkCount=software?16:40,sparkGeo=new THREE.BufferGeometry(),sparkPos=new Float32Array(sparkCount*3),sparkSeeds=[];
for(let i=0;i<sparkCount;i++){let x,z;do{x=rnd()*14-7;z=rnd()*15-7.5}while(Math.abs(x)<BX-.2&&Math.abs(z)<BZ-.2&&rnd()<.85);sparkSeeds.push({x,z,y:.3+rnd()*1.8,sp:.3+rnd()*.6,phase:rnd()*6})}
sparkGeo.setAttribute('position',new THREE.BufferAttribute(sparkPos,3));
const sparks=new THREE.Points(sparkGeo,new THREE.PointsMaterial({map:softTex,color:0xdcc0ff,size:software?4:5,sizeAttenuation:false,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));sparks.frustumCulled=false;root.add(sparks);
function placeSparks(t){for(let i=0;i<sparkCount;i++){const s=sparkSeeds[i];sparkPos[i*3]=s.x+Math.sin(t*s.sp+s.phase)*.3;sparkPos[i*3+1]=s.y+((t*s.sp*.3+s.phase)%1.6)-.8;sparkPos[i*3+2]=s.z+Math.cos(t*s.sp+s.phase)*.3}sparkGeo.attributes.position.needsUpdate=true}
placeSparks(0);updates.push((t,light,moving)=>{if(moving)placeSparks(t);sparks.material.opacity=.55+(moving?.45*Math.abs(Math.sin(t*3.1)):0)});
return{root,update(t,light,moving){for(const u of updates)u(t,light,moving)}};
}
