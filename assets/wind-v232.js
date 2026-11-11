/* v232 — Terrain vent « Les vents de Hacko » : un haut plateau d'herbe émeraude balayé par le vent.
   Entièrement procédural : plateau taillé dans la falaise, cases de prairie fauchée, herbes hautes qui ondulent,
   pierres levées aux runes du vent, moulins aux ailes de toile, guirlandes de fanions, traînées de vent,
   feuilles en spirale, collines et pics lointains. Les règles restent dans le moteur du jeu. */
import * as THREE from 'three';
export function createWindHighlands(world,software=false,rows=10){
const root=new THREE.Group();world.add(root);root.visible=false;
let seed=2718;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const HZ=rows/2,BX=4.25,BZ=HZ+.25;
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.92,...extra});
const add=(geo,material,parent=root,shadow=true)=>{const m=new THREE.Mesh(geo,material);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m};
const canvasTex=(w,h,draw)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t};
const updates=[],dmy=new THREE.Object3D();
// Le vent souffle surtout le long de l'axe X : une rafale passe régulièrement.
const gust=t=>.55+.45*Math.sin(t*.7)*Math.sin(t*.23+1.3);

// ---------- 1. Le plateau de jeu : prairie fauchée en damier ----------
const meadow=canvasTex(512,64*rows,(g,w,h)=>{const cw=w/8,ch=h/rows;
 for(let y=0;y<rows;y++)for(let x=0;x<8;x++){const light=(x+y)%2===0,base=light?[96,150,82]:[78,131,70],gr=g.createLinearGradient(x*cw,y*ch,x*cw+cw,y*ch);
  gr.addColorStop(0,`rgb(${base[0]+8},${base[1]+10},${base[2]+4})`);gr.addColorStop(1,`rgb(${base[0]-6},${base[1]-6},${base[2]-4})`);g.fillStyle=gr;g.fillRect(x*cw,y*ch,cw,ch);
  // stries de fauche dans le sens du vent
  g.strokeStyle=light?'rgba(190,230,150,.18)':'rgba(30,70,40,.2)';g.lineWidth=2;for(let k=0;k<7;k++){const yy=y*ch+6+k*(ch-12)/6+Math.sin(k)*2;g.beginPath();g.moveTo(x*cw+4,yy);g.bezierCurveTo(x*cw+cw*.35,yy-4,x*cw+cw*.65,yy+4,x*cw+cw-4,yy);g.stroke()}
  for(let k=0;k<26;k++){g.fillStyle=`rgba(${rnd()<.5?'210,240,170':'30,60,30'},${.08+rnd()*.1})`;g.fillRect(x*cw+rnd()*cw,y*ch+rnd()*ch,2,4)}
  if(rnd()<.12){g.fillStyle='rgba(255,255,240,.7)';for(let f=0;f<5;f++){g.beginPath();g.arc(x*cw+10+rnd()*(cw-20),y*ch+10+rnd()*(ch-20),2,0,7);g.fill()}}}
 // fines bordures de pierre entre les cases
 g.strokeStyle='rgba(215,222,190,.55)';g.lineWidth=3;for(let x=0;x<=8;x++){g.beginPath();g.moveTo(x*cw,0);g.lineTo(x*cw,h);g.stroke()}for(let y=0;y<=rows;y++){g.beginPath();g.moveTo(0,y*ch);g.lineTo(w,y*ch);g.stroke()}});
const shape=new THREE.Shape(),r=.55;shape.moveTo(-BX+r,-BZ);shape.lineTo(BX-r,-BZ);shape.quadraticCurveTo(BX,-BZ,BX,-BZ+r);shape.lineTo(BX,BZ-r);shape.quadraticCurveTo(BX,BZ,BX-r,BZ);shape.lineTo(-BX+r,BZ);shape.quadraticCurveTo(-BX,BZ,-BX,BZ-r);shape.lineTo(-BX,-BZ+r);shape.quadraticCurveTo(-BX,-BZ,-BX+r,-BZ);
const plateauGeo=new THREE.ExtrudeGeometry(shape,{depth:1.6,bevelEnabled:true,bevelThickness:.06,bevelSize:.12,bevelSegments:3,curveSegments:8});plateauGeo.rotateX(-Math.PI/2);plateauGeo.translate(0,-1.47,0);
{const p=plateauGeo.attributes.position,uv=plateauGeo.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)+4)/8,(p.getZ(i)+HZ)/rows)}
const cliffTex=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#6f7462';g.fillRect(0,0,w,h);for(let k=0;k<40;k++){const y=rnd()*h;g.fillStyle=`rgba(${rnd()<.5?'40,44,36':'150,152,128'},${.15+rnd()*.2})`;g.fillRect(0,y,w,2+rnd()*6)}for(let k=0;k<30;k++){g.fillStyle=`rgba(70,120,60,${.25+rnd()*.3})`;g.beginPath();g.ellipse(rnd()*w,rnd()*h*.4,8+rnd()*20,3+rnd()*6,0,0,7);g.fill()}});
cliffTex.wrapS=cliffTex.wrapT=THREE.RepeatWrapping;cliffTex.repeat.set(4,1);
add(plateauGeo,[mat(0xffffff,{map:meadow,roughness:.95}),mat(0xffffff,{map:cliffTex,roughness:.98})]);
// Bordure de pierres plates autour du plateau.
const curbMat=mat(0xb8bba0,{roughness:.9}),flatStone=new THREE.CylinderGeometry(1,1,1,7);
for(let i=0;i<(software?40:70);i++){const side=i%4,u=rnd()*2-1;let x,z;if(side<2){x=(side?1:-1)*(BX+.18);z=u*(BZ-.2)}else{z=(side===2?1:-1)*(BZ+.18);x=u*(BX-.2)}const m=add(flatStone,curbMat);m.position.set(x,.11,z);m.scale.set(.16+rnd()*.08,.06,.13+rnd()*.07);m.rotation.y=rnd()*6}

// ---------- 2. Les collines autour et les pics lointains ----------
const hillGeo=new THREE.PlaneGeometry(70,70,software?40:70,software?40:70);hillGeo.rotateX(-Math.PI/2);
const hp=hillGeo.attributes.position,hc=[];
for(let i=0;i<hp.count;i++){const x=hp.getX(i),z=hp.getZ(i),d=Math.max(0,Math.hypot(x/(BX+2),z/(BZ+2))-1);let y=-1.6+Math.sin(x*.35)*Math.cos(z*.31)*.9*Math.min(1,d)+Math.sin(x*.9+z*.6)*.25*Math.min(1,d);
 if(d>2.2)y+=(d-2.2)*1.6+Math.max(0,Math.sin(x*.55+1.4)*Math.cos(z*.4))*(d-2.2)*2.2;hp.setY(i,y);const k=Math.min(1,(y+1.6)/6),wave=.5+.5*Math.sin(x*.42+z*.18),c=new THREE.Color().setRGB(.07,.2,.1).lerp(new THREE.Color(.16,.34,.14),wave*.8+rnd()*.15).lerp(new THREE.Color(.3,.36,.3),k*.6).lerp(new THREE.Color(.85,.9,.88),Math.max(0,k-.8)*3);hc.push(c.r,c.g,c.b)}
hillGeo.setAttribute('color',new THREE.Float32BufferAttribute(hc,3));hillGeo.computeVertexNormals();
const hills=add(hillGeo,mat(0xffffff,{vertexColors:true,roughness:1,flatShading:true}),root,false);hills.receiveShadow=true;

// ---------- 3. Herbes hautes qui ondulent ----------
const bladeGeo=(()=>{const g=new THREE.BufferGeometry(),v=[];for(let k=0;k<5;k++){const a=k/5*Math.PI*2,dx=Math.cos(a)*.07,dz=Math.sin(a)*.07,tx=dx*2.2,tz=dz*2.2;v.push(dx-.03,0,dz,dx+.03,0,dz,tx,1,tz)}g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.computeVertexNormals();return g})();// touffe de 5 brins
const grassCount=software?200:420,grass=new THREE.InstancedMesh(bladeGeo,mat(0xffffff,{roughness:.8,side:THREE.DoubleSide}),grassCount),gSeeds=[];root.add(grass);
const tint=new THREE.Color();
for(let i=0;i<grassCount;i++){let x,z;do{x=rnd()*16-8;z=rnd()*17-8.5}while(Math.abs(x)<BX+.35&&Math.abs(z)<BZ+.35);const ground=-1.6+0;const onPlateau=false;
 gSeeds.push({x,z,y:yAt(x,z),h:.35+rnd()*.5,phase:x*.6+rnd()*.6,lean:rnd()*.2});tint.setHSL(.22+rnd()*.07,.5+rnd()*.15,.38+rnd()*.14);grass.setColorAt(i,tint)}
function yAt(x,z){// hauteur approximative des collines (même formule que ci-dessus)
 const d=Math.max(0,Math.hypot(x/(BX+2),z/(BZ+2))-1);return -1.6+Math.sin(x*.35)*Math.cos(z*.31)*.9*Math.min(1,d)+Math.sin(x*.9+z*.6)*.25*Math.min(1,d)}
// Touffes au bord du plateau (au niveau du jeu), sans jamais couvrir les cases.
const tuftCount=software?60:140,tufts=new THREE.InstancedMesh(bladeGeo,mat(0xffffff,{roughness:.8,side:THREE.DoubleSide}),tuftCount),tSeeds=[];root.add(tufts);
for(let i=0;i<tuftCount;i++){const side=i%4,u=rnd()*2-1;let x,z;if(side<2){x=(side?1:-1)*(BX+.05+rnd()*.12);z=u*BZ}else{z=(side===2?1:-1)*(BZ+.05+rnd()*.12);x=u*BX}tSeeds.push({x,z,y:.1,h:.18+rnd()*.22,phase:x*.6+rnd()*.6,lean:rnd()*.2});tint.setHSL(.25+rnd()*.05,.5,.4+rnd()*.12);tufts.setColorAt(i,tint)}
function sway(inst,seeds,t,moving){const g=moving?gust(t):.4;for(let i=0;i<seeds.length;i++){const s=seeds[i],b=(moving?Math.sin(t*2.4-s.phase):0)*.18*g+g*.35+s.lean;dmy.position.set(s.x,s.y,s.z);dmy.rotation.set(0,0,-b);dmy.scale.set(1,s.h,1);dmy.updateMatrix();inst.setMatrixAt(i,dmy.matrix)}inst.instanceMatrix.needsUpdate=true}
sway(grass,gSeeds,0,false);sway(tufts,tSeeds,0,false);updates.push((t,light,moving)=>{if(!moving||light&&Math.floor(t*10)%2)return;sway(grass,gSeeds,t,true);sway(tufts,tSeeds,t,true)});

// ---------- 4. Pierres levées aux runes du vent ----------
const runeTex=canvasTex(128,256,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);g.strokeStyle='#d9ffe6';g.lineWidth=6;g.lineCap='round';g.shadowColor='#7dffb0';g.shadowBlur=12;
 // spirale du vent
 g.beginPath();for(let a=0;a<Math.PI*4.2;a+=.15){const rr=4+a*5.2;g.lineTo(64+Math.cos(a)*rr,92+Math.sin(a)*rr)}g.stroke();
 for(let k=0;k<3;k++){g.beginPath();g.moveTo(26,170+k*24);g.bezierCurveTo(52,158+k*24,76,182+k*24,102,170+k*24);g.stroke()}});
const stoneMat=mat(0x8b917c,{roughness:.95,emissiveMap:runeTex,emissive:0x6dffa8,emissiveIntensity:.9});
const runeStones=[];
for(const [x,z,h,ry] of[[-BX-.85,-2.6,1.5,.3],[BX+.85,2.4,1.7,-.4],[-BX-.8,3.6,1.1,.1],[BX+.9,-3.9,1.25,.2]]){const g=new THREE.BoxGeometry(.55,h,.3,1,4,1),p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);p.setX(i,p.getX(i)*(1-(y/h+.5)*.25));}g.computeVertexNormals();const m=add(g,stoneMat);m.position.set(x,yAt(x,z)+h/2+.2,z);m.rotation.set((rnd()-.5)*.08,ry,(rnd()-.5)*.08);runeStones.push(m)}
updates.push((t,light,moving)=>{stoneMat.emissiveIntensity=.7+(moving?.35*Math.sin(t*1.3):0)});

// ---------- 5. Moulins à vent aux ailes de toile ----------
const wood=mat(0x6b4c33,{roughness:.85}),plaster=mat(0xe7e2cf,{roughness:.9}),roof=mat(0x3f6b45,{roughness:.8}),cloth=mat(0xf3efe0,{roughness:.9,side:THREE.DoubleSide});
const mills=[];
for(const [x,z,s,ry] of[[-7.2,-5.4,1.15,.6],[7.4,5.2,1,-2.4],[8.6,-6.6,.75,-.8]]){const g=new THREE.Group();g.position.set(x,yAt(x,z),z);g.scale.setScalar(s);g.rotation.y=ry;root.add(g);
 const tower=add(new THREE.CylinderGeometry(.42,.62,2.2,10),plaster,g);tower.position.y=1.1;const cap=add(new THREE.ConeGeometry(.6,.7,10),roof,g);cap.position.y=2.55;
 const door=add(new THREE.BoxGeometry(.3,.5,.05),wood,g);door.position.set(0,.25,.6);
 const hub=new THREE.Group();hub.position.set(0,2.1,.62);g.add(hub);add(new THREE.CylinderGeometry(.08,.08,.25,8),wood,hub).rotation.x=Math.PI/2;
 for(let k=0;k<4;k++){const arm=new THREE.Group();arm.rotation.z=k*Math.PI/2;hub.add(arm);const spar=add(new THREE.BoxGeometry(.06,1.5,.05),wood,arm);spar.position.y=.75;const sail=add(new THREE.PlaneGeometry(.38,1.1),cloth,arm);sail.position.set(.22,.85,.02)}
 mills.push({hub,speed:.16+rnd()*.06})}
updates.push((t,light,moving)=>{if(!moving)return;for(const m of mills)m.hub.rotation.z=-t*m.speed*(.8+gust(t)*.3)});

// ---------- 6. Guirlandes de fanions qui claquent au vent ----------
const flagColors=[0x3fae6b,0xe9e3c8,0x2f7d5a,0xb7d97a,0x5fc4a4],flagGeo=new THREE.PlaneGeometry(.22,.26,3,1);flagGeo.translate(.11,-.13,0);
const poleMat=mat(0x4e3a2a);const lines=[];
for(const [a,b] of[[[-BX-.6,-BZ+.3],[-BX-.6,-.6]],[[BX+.6,.8],[BX+.6,BZ-.4]],[[-2.3,BZ+.65],[2.3,BZ+.65]],[[-1.8,-BZ-.65],[2.6,-BZ-.65]]]){
 const A=new THREE.Vector3(a[0],0,a[1]),B=new THREE.Vector3(b[0],0,b[1]);for(const P of[A,B]){const p=add(new THREE.CylinderGeometry(.03,.04,1.3,6),poleMat);p.position.set(P.x,.6,P.z)}
 const n=Math.round(A.distanceTo(B)/.34),flags=[];for(let k=1;k<n;k++){const u=k/n,pos=A.clone().lerp(B,u);pos.y=1.2-Math.sin(u*Math.PI)*.28;const f=add(flagGeo,mat(flagColors[k%flagColors.length],{side:THREE.DoubleSide,roughness:.85}),root,false);f.position.copy(pos);f.rotation.y=Math.atan2(-(B.z-A.z),B.x-A.x);flags.push({f,phase:k*.7,base:f.rotation.y})}
 const curve=new THREE.CatmullRomCurve3([A.clone().setY(1.25),A.clone().lerp(B,.5).setY(.95),B.clone().setY(1.25)]);root.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(20)),new THREE.LineBasicMaterial({color:0x3b2c22})));lines.push(flags)}
updates.push((t,light,moving)=>{if(!moving)return;const g=gust(t);for(const flags of lines)for(const {f,phase,base} of flags){f.rotation.y=base+Math.sin(t*6+phase)*.35*g;f.rotation.x=Math.sin(t*4.3+phase)*.25*g}});

// ---------- 7. Traînées de vent et feuilles en spirale ----------
const streakTex=canvasTex(256,32,(g,w,h)=>{const gr=g.createLinearGradient(0,0,w,0);gr.addColorStop(0,'rgba(255,255,255,0)');gr.addColorStop(.5,'rgba(255,255,255,.9)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.beginPath();g.ellipse(w/2,h/2,w/2,h/5,0,0,7);g.fill()});
const streaks=[];for(let i=0;i<(software?5:11);i++){const m=add(new THREE.PlaneGeometry(3.2+rnd()*2.4,.16),new THREE.MeshBasicMaterial({map:streakTex,color:0xeaffef,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}),root,false);
 const z=rnd()*16-8,y=.5+rnd()*1.8;m.rotation.x=-Math.PI/2+.3;streaks.push({m,z,y,speed:2.4+rnd()*1.8,off:rnd()*30,curve:(rnd()-.5)*.6})}
updates.push((t,light,moving)=>{for(const s of streaks){if(!moving){s.m.material.opacity=0;continue}const u=((t*s.speed+s.off)%30)/30,x=12-u*24;/* v242 — le vent souffle vers la gauche, comme les rafales du jeu */s.m.position.set(x,s.y+Math.sin(u*Math.PI*2)*.25,s.z+Math.sin(u*Math.PI)*s.curve);
 const near=Math.abs(x)<BX+.5&&Math.abs(s.z)<BZ+.5;s.m.material.opacity=Math.sin(u*Math.PI)*(near?.12:.4)*(.6+gust(t)*.6)}});
const leafGeo=new THREE.PlaneGeometry(.12,.07);const leafCount=software?18:46,leaves=new THREE.InstancedMesh(leafGeo,mat(0x9ccf5b,{side:THREE.DoubleSide,roughness:.7}),leafCount),lSeeds=[];root.add(leaves);
for(let i=0;i<leafCount;i++){lSeeds.push({off:rnd()*40,r:.4+rnd()*.9,y:.3+rnd()*2,z:rnd()*16-8,sp:.9+rnd()*.8,spin:rnd()*6});tint.setHSL(.2+rnd()*.12,.55,.4+rnd()*.15);leaves.setColorAt(i,tint)}
function placeLeaves(t){for(let i=0;i<leafCount;i++){const s=lSeeds[i],u=((t*s.sp+s.off)%40)/40,x=13-u*26,a=t*3+s.spin;dmy.position.set(x+Math.cos(a)*s.r,s.y+Math.sin(a)*s.r*.6,s.z+Math.sin(a*.7)*s.r);dmy.rotation.set(a,a*1.3,a*.7);dmy.scale.setScalar(1);dmy.updateMatrix();leaves.setMatrixAt(i,dmy.matrix)}leaves.instanceMatrix.needsUpdate=true}
placeLeaves(5);updates.push((t,light,moving)=>{if(moving)placeLeaves(t)});

// ---------- 8. v242 — Vie du haut plateau (hors damier) : moutons, cerfs-volants, nuages et leurs ombres, murets, bergerie, arche, oiseaux, aigrettes ----------
const offBoard=(x,z,m=.6)=>Math.abs(x)>BX+m||Math.abs(z)>BZ+m;
// Moutons qui broutent sur les collines.
const wool=mat(0xf4f1e8,{roughness:1,flatShading:true}),sheepFace=mat(0x2c2622,{roughness:.8}),sheep=[];
const woolGeo=new THREE.IcosahedronGeometry(1,1),legGeo=new THREE.CylinderGeometry(.025,.025,.16,5);
for(const [x,z,ry] of[[-6.2,2.4,.4],[-6.9,3.1,2.1],[-5.6,3.6,-1],[6.3,-1.8,2.6],[6.9,-.9,1.2],[5.9,-2.9,-.6],[-2.8,BZ+2.4,1.6],[2.2,BZ+2.8,-2.2],[3.4,-BZ-2.6,.9]].slice(0,software?5:9)){if(!offBoard(x,z))continue;
 const g=new THREE.Group();g.position.set(x,yAt(x,z),z);g.rotation.y=ry;root.add(g);const body=add(woolGeo,wool,g);body.scale.set(.26,.19,.18);body.position.y=.27;for(const [lx,lz] of[[-.13,-.08],[-.13,.08],[.13,-.08],[.13,.08]]){const l=add(legGeo,sheepFace,g);l.position.set(lx,.08,lz)}
 const head=new THREE.Group();head.position.set(.24,.3,0);g.add(head);const face=add(new THREE.SphereGeometry(.075,8,6),sheepFace,head);face.scale.set(1.25,.9,.85);face.position.x=.05;const tuft=add(woolGeo,wool,head);tuft.scale.setScalar(.06);tuft.position.set(.02,.06,0);
 for(const e of[-1,1]){const ear=add(new THREE.SphereGeometry(.03,5,4),sheepFace,head);ear.scale.set(.6,.4,1.4);ear.position.set(.0,.03,e*.07)}
 sheep.push({g,head,p:rnd()*9,x,z,ry})}
updates.push((t,l,moving)=>{for(const s of sheep){const k=moving?(Math.sin(t*.5+s.p)*.5+.5):.6;s.head.rotation.z=-.65*k;s.head.position.y=.3-.12*k;s.g.position.y=yAt(s.x,s.z)+(moving?Math.abs(Math.sin(t*3+s.p))*.004:0)}});
// Cerfs-volants : losanges de toile retenus par une ficelle, qui dansent avec les rafales.
const kites=[];const kiteGeo=new THREE.BufferGeometry();kiteGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,.42,0,-.24,0,0,0,-.5,0,0,.42,0,0,-.5,0,.24,0,0],3));kiteGeo.computeVertexNormals();
for(const [ax,az,h,c1] of[[-7.6,-3.2,1.9,0xe2574c],[1.8,-BZ-3.6,1.7,0xf2c14e],[7.8,-BZ-1.8,2,0x4fa3d9]].slice(0,software?1:3)){const anchor=new THREE.Vector3(ax,yAt(ax,az),az),k=new THREE.Group();root.add(k);
 const sail=new THREE.Mesh(kiteGeo,new THREE.MeshStandardMaterial({color:c1,side:THREE.DoubleSide,roughness:.7}));k.add(sail);const spar=new THREE.Mesh(new THREE.BoxGeometry(.48,.012,.012),mat(0x5a4632));k.add(spar);
 const tail=[];for(let i=0;i<5;i++){const bow=new THREE.Mesh(new THREE.PlaneGeometry(.12,.06),new THREE.MeshStandardMaterial({color:i%2?0xffffff:c1,side:THREE.DoubleSide}));root.add(bow);tail.push(bow)}
 const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([anchor,anchor.clone()]),new THREE.LineBasicMaterial({color:0xf5f1e6,transparent:true,opacity:.7}));root.add(line);const peg=add(new THREE.CylinderGeometry(.03,.03,.2,5),mat(0x5a4632));peg.position.copy(anchor).add(new THREE.Vector3(0,.1,0));
 kites.push({k,tail,line,anchor,h,p:rnd()*6})}
updates.push((t,l,moving)=>{const T=moving?t:2,gu=moving?gust(t):.5;for(const K of kites){const x=K.anchor.x-1.1-gu*.9+Math.sin(T*.8+K.p)*.35,y=K.anchor.y+K.h+Math.sin(T*1.1+K.p)*.3,z=K.anchor.z+Math.sin(T*.6+K.p)*.5;K.k.position.set(x,y,z);K.k.rotation.set(Math.sin(T*1.7+K.p)*.25,Math.PI/2+.4,Math.sin(T*1.3+K.p)*.35-.3);
 const pos=K.line.geometry.attributes.position;pos.setXYZ(1,x,y-.45,z);pos.needsUpdate=true;K.tail.forEach((b,i)=>{const d=(i+1)*.17;b.position.set(x+d*.9,y-.5-d*.9+Math.sin(T*4+i+K.p)*.05,z+Math.sin(T*3+i)*.08);b.rotation.set(0,Math.PI/2,T*3+i)})}});
// Nuages bas qui filent vers la gauche, avec leur ombre qui glisse sur les collines.
const cloudMat=mat(0xffffff,{roughness:1,flatShading:true,transparent:true,opacity:.92}),clouds=[];const shadowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,4,32,32,32);r.addColorStop(0,'rgba(0,30,10,.5)');r.addColorStop(1,'rgba(0,30,10,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
for(let i=0;i<(software?3:6);i++){const g=new THREE.Group();for(let k=0;k<5;k++){const m=new THREE.Mesh(woolGeo,cloudMat);m.scale.set(.7+rnd()*.6,.35+rnd()*.25,.5+rnd()*.4);m.position.set((k-2)*.55+rnd()*.2,rnd()*.2,(rnd()-.5)*.5);g.add(m)}root.add(g);
 const sh=new THREE.Mesh(new THREE.PlaneGeometry(4,2.6),new THREE.MeshBasicMaterial({map:shadowTex,transparent:true,depthWrite:false}));sh.rotation.x=-Math.PI/2;root.add(sh);clouds.push({g,sh,z:-BZ-4.5-rnd()*5,y:3.6+rnd()*1.2,off:rnd()*40,sp:.35+rnd()*.25})/* toujours au fond : ne passe jamais devant le damier */}
updates.push((t,l,moving)=>{for(const c of clouds){const u=((moving?t*c.sp:0)+c.off)%40,x=20-u;c.g.position.set(x,c.y,c.z);const gx=x-1.2,gz=c.z;c.sh.position.set(gx,offBoard(gx,gz,0)?yAt(gx,gz)+.06:.13,gz);c.sh.visible=Math.abs(gx)<16}});
// Murets de pierre sèche qui suivent les collines.
const wallStone=mat(0x9a9c8f,{flatShading:true,roughness:1}),stoneGeo=new THREE.DodecahedronGeometry(1,0);
for(const [x0,z0,x1,z1] of[[-9,-1.5,-6.4,-4.2],[6.2,2,9.4,-.6],[-5,BZ+1.4,-1,BZ+3.2],[1.5,-BZ-1.6,6,-BZ-1.1]]){const n=Math.ceil(Math.hypot(x1-x0,z1-z0)/.2);for(let i=0;i<=n;i++){const x=x0+(x1-x0)*i/n,z=z0+(z1-z0)*i/n;if(!offBoard(x,z,1))continue;for(let k=0;k<2;k++){const m=add(stoneGeo,wallStone,root,!software);m.scale.set(.12+rnd()*.05,.08+rnd()*.03,.1+rnd()*.04);m.position.set(x+(rnd()-.5)*.06,yAt(x,z)+.06+k*.13,z+(rnd()-.5)*.06);m.rotation.set(rnd()*3,rnd()*3,rnd()*3)}}}
// Bergerie de pierre au toit vert, avec sa fumée qui part avec le vent.
{const x=-8.4,z=4.8,y=yAt(x,z),g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=.5;root.add(g);const walls=add(new THREE.BoxGeometry(1.1,.6,.8),mat(0xb8b3a2,{flatShading:true}),g);walls.position.y=.3;const r=add(new THREE.ConeGeometry(.82,.5,4),roof,g);r.rotation.y=Math.PI/4;r.scale.set(1,1,.75);r.position.y=.85;const door=add(new THREE.BoxGeometry(.02,.32,.2),wood,g);door.position.set(.56,.16,0);const chim=add(new THREE.BoxGeometry(.12,.3,.12),mat(0x8d8778),g);chim.position.set(-.3,1.02,.15);
 const puffs=[];for(let i=0;i<5;i++){const m=new THREE.Mesh(woolGeo,new THREE.MeshStandardMaterial({color:0xe8ece6,transparent:true,opacity:.6,flatShading:true}));root.add(m);puffs.push({m,p:i/5})}const ch=new THREE.Vector3();chim.getWorldPosition(ch);root.updateMatrixWorld(true);
 updates.push((t,l,moving)=>{const wp=chim.getWorldPosition(new THREE.Vector3());root.worldToLocal(wp);for(const f of puffs){const k=((moving?t*.25:0)+f.p)%1;f.m.position.set(wp.x-k*1.6*(moving?gust(t)+.3:.6),wp.y+.2+k*.9,wp.z);f.m.scale.setScalar(.07+k*.18);f.m.material.opacity=.6*(1-k)}})}
// Arche de roche sculptée par le vent.
{const x=6.6,z=BZ+2.2,y=yAt(x,z),arch=add(new THREE.TorusGeometry(.75,.24,6,14,Math.PI),mat(0x8f9184,{flatShading:true}));arch.position.set(x,y,z);arch.rotation.y=.9;arch.scale.set(1,1.15,1);const cap=add(woolGeo,mat(0x6f9a4f,{flatShading:true}));cap.position.set(x,y+.95,z);cap.scale.set(.42,.1,.3)}
// Volée d'oiseaux qui tourne au-dessus des collines.
const birds=[];const birdGeo=new THREE.BufferGeometry();birdGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,-.08,.02,-.14,0,0,.04,0,0,0,0,0,.04,.08,.02,-.14],3));birdGeo.computeVertexNormals();
for(let i=0;i<(software?3:7);i++){const m=new THREE.Mesh(birdGeo,new THREE.MeshBasicMaterial({color:0x26322b,side:THREE.DoubleSide}));m.scale.setScalar(1.6);root.add(m);birds.push({m,i})}
updates.push((t,l,moving)=>{const T=moving?t:0;for(const b of birds){const a=T*.22+b.i*.32,r=3.2+(b.i%3)*.4;b.m.position.set(Math.cos(a)*r*1.6,4+Math.sin(T*.7+b.i)*.25+(b.i%2)*.3,Math.sin(a)*r-BZ-6.5);b.m.rotation.set(0,-a,0);b.m.scale.y=1.6*(moving?.6+.4*Math.abs(Math.sin(t*7+b.i)):1)}});
// Aigrettes de pissenlit qui traversent le plateau vers la gauche (toutes petites, elles ne gênent pas la lecture).
if(!software){const n=60,geo=new THREE.BufferGeometry(),pos=new Float32Array(n*3),seeds=[];for(let i=0;i<n;i++)seeds.push({z:rnd()*18-9,y:.4+rnd()*2.2,off:rnd()*30,sp:.8+rnd()*.7,w:rnd()*6});geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
 const dot=(()=>{const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d'),r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.5,'rgba(255,255,255,.4)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,32,32);return new THREE.CanvasTexture(c)})();
 const fluff=new THREE.Points(geo,new THREE.PointsMaterial({map:dot,color:0xffffff,size:4,sizeAttenuation:false,transparent:true,depthWrite:false,opacity:.85}));fluff.frustumCulled=false;root.add(fluff);
 updates.push((t,l,moving)=>{const T=moving?t:0;seeds.forEach((s,i)=>{const u=((T*s.sp*(.6+gust(T)*.6)+s.off)%30)/30;pos[i*3]=14-u*28;pos[i*3+1]=s.y+Math.sin(T*1.3+s.w)*.25;pos[i*3+2]=s.z+Math.sin(T*.9+s.w)*.3});geo.attributes.position.needsUpdate=true})}
return{root,update(t,light,moving){for(const u of updates)u(t,light,moving)}};
}
