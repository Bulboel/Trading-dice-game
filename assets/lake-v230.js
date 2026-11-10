/* v230 — Terrain eau « Le lac rose » : un ancien sanctuaire de pierre posé sur un lac rose au crépuscule.
   Entièrement procédural (aucun modèle externe) : eau animée, terrasse dallée, îlots et sapins, nénuphars et lotus,
   roseaux, ponton, reflet de lune, brume et lucioles. Les règles restent dans le moteur du jeu. */
import * as THREE from 'three';
export function createLake(world,software=false,rows=10){
const root=new THREE.Group();world.add(root);root.visible=false;
let seed=4417;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const HZ=rows/2,BX=4.25,BZ=HZ+.25;// demi-taille de la terrasse de jeu (8 colonnes × rows lignes)
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.9,...extra});
const add=(geo,material,parent=root,shadow=true)=>{const m=new THREE.Mesh(geo,material);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m};
const canvasTex=(w,h,draw,repeat=1)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeat,repeat);t.anisotropy=4;return t};
const updates=[];

// ---------- 1. L'eau rose ----------
const normalTex=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),img=g.createImageData(128,128);
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){const a=Math.sin((x/128)*Math.PI*6+Math.sin(y/128*Math.PI*4)*1.3),b=Math.cos((y/128)*Math.PI*8+Math.cos(x/128*Math.PI*2)*1.1),i=(y*128+x)*4;img.data[i]=128+a*38;img.data[i+1]=128+b*38;img.data[i+2]=255;img.data[i+3]=255}
 g.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(5,5);return t})();
const waterGeo=new THREE.PlaneGeometry(14.5,rows*1.43,software?40:90,software?42:96);waterGeo.rotateX(-Math.PI/2);
const wc=[],wp=waterGeo.attributes.position;
for(let i=0;i<wp.count;i++){const x=wp.getX(i),z=wp.getZ(i),edge=Math.min(1,Math.max(0,(Math.max(Math.abs(x)-BX,Math.abs(z)-BZ))/2.6)),moon=Math.exp(-Math.pow((x*.55+z*.25+1.2),2)*.9)*Math.max(0,1-Math.abs(z+3)/9);
 const ripple=.5+.5*Math.sin(x*2.3+z*1.7)*Math.cos(z*1.1-x*.7),c=new THREE.Color().setRGB(.4,.1,.27).lerp(new THREE.Color(.13,.035,.12),edge*.85).lerp(new THREE.Color(.62,.24,.45),ripple*.2).lerp(new THREE.Color(.95,.62,.8),moon*.5);wc.push(c.r,c.g,c.b)}
waterGeo.setAttribute('color',new THREE.Float32BufferAttribute(wc,3));
const waterMat=new THREE.MeshPhysicalMaterial({color:0xffffff,vertexColors:true,roughness:.06,metalness:.1,clearcoat:1,clearcoatRoughness:.08,normalMap:normalTex,normalScale:new THREE.Vector2(.45,.45),emissive:0x1e0618,emissiveIntensity:.22});
const water=add(waterGeo,waterMat,root,false);water.position.y=.02;const waterOrig=Float32Array.from(wp.array);
updates.push((t,light,moving)=>{if(!moving)return;normalTex.offset.set(t*.012,t*.007);if(light)return;for(let i=0;i<wp.count;i++){const x=waterOrig[i*3],z=waterOrig[i*3+2];wp.setY(i,Math.sin(x*1.4+t*.9)*.018+Math.sin(z*1.9-t*.7)*.014)}wp.needsUpdate=true});
// Reflet de la lune : traînée lumineuse qui scintille.
const glowTex=canvasTex(64,256,(g,w,h)=>{const r=g.createLinearGradient(0,0,w,0);r.addColorStop(0,'rgba(255,255,255,0)');r.addColorStop(.5,'rgba(255,240,248,1)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,w,h);const v=g.createLinearGradient(0,0,0,h);v.addColorStop(0,'rgba(0,0,0,1)');v.addColorStop(.25,'rgba(0,0,0,0)');v.addColorStop(.8,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,1)');g.globalCompositeOperation='destination-out';g.fillStyle=v;g.fillRect(0,0,w,h)});
const moonPath=[];for(let i=0;i<5;i++){const m=add(new THREE.PlaneGeometry(.5+rnd()*.4,4.2+rnd()*1.8),new THREE.MeshBasicMaterial({map:glowTex,color:0xffe3f0,transparent:true,opacity:.0,depthWrite:false,blending:THREE.AdditiveBlending}),root,false);m.rotation.x=-Math.PI/2;m.rotation.z=.08;m.position.set(-5.55+i*.16+rnd()*.15,.06,-1.6+i*.45+rnd()*.4);moonPath.push({m,phase:rnd()*6})}
updates.push((t,light,moving)=>{for(const p of moonPath)p.m.material.opacity=.16+(moving?.08*Math.sin(t*1.6+p.phase):0)});

// ---------- 2. La terrasse de pierre (zone de jeu) ----------
const paving=canvasTex(512,64*rows,(g,w,h)=>{g.fillStyle='#4f4650';g.fillRect(0,0,w,h);const cw=w/8,ch=h/rows;
 for(let y=0;y<rows;y++)for(let x=0;x<8;x++){const tone=118+Math.floor(rnd()*30),pink=Math.floor(rnd()*12);const gr=g.createLinearGradient(x*cw,y*ch,x*cw+cw,y*ch+ch);gr.addColorStop(0,`rgb(${tone+pink+14},${tone+4},${tone+16})`);gr.addColorStop(1,`rgb(${tone+pink-8},${tone-18},${tone-4})`);g.fillStyle=gr;g.fillRect(x*cw+3,y*ch+3,cw-6,ch-6);
  for(let k=0;k<60;k++){g.fillStyle=`rgba(${rnd()<.5?'255,255,255':'60,30,40'},${.04+rnd()*.06})`;g.fillRect(x*cw+3+rnd()*(cw-8),y*ch+3+rnd()*(ch-8),2+rnd()*3,2+rnd()*3)}
  if(rnd()<.35){g.strokeStyle='rgba(70,40,50,.35)';g.lineWidth=1.2;g.beginPath();let px=x*cw+8+rnd()*(cw-16),py=y*ch+8;g.moveTo(px,py);for(let s=0;s<4;s++){px+=(rnd()-.5)*14;py+=ch/5;g.lineTo(px,py)}g.stroke()}}
 g.strokeStyle='rgba(44,74,52,.85)';g.lineWidth=6;for(let x=0;x<=8;x++){g.beginPath();g.moveTo(x*cw,0);g.lineTo(x*cw,h);g.stroke()}for(let y=0;y<=rows;y++){g.beginPath();g.moveTo(0,y*ch);g.lineTo(w,y*ch);g.stroke()}// mousse dans les joints
 for(let k=0;k<70;k++){g.fillStyle=`rgba(64,96,62,${.18+rnd()*.25})`;const mx=rnd()*w,my=rnd()*h;g.beginPath();g.ellipse(mx,my,3+rnd()*9,2+rnd()*5,rnd()*3,0,7);g.fill()}// taches de mousse
 g.fillStyle='rgba(255,170,210,.05)';g.fillRect(0,0,w,h)});paving.wrapS=paving.wrapT=THREE.ClampToEdgeWrapping;paving.repeat.set(1,1);
const terraceShape=new THREE.Shape(),r=.35;terraceShape.moveTo(-BX+r,-BZ);terraceShape.lineTo(BX-r,-BZ);terraceShape.quadraticCurveTo(BX,-BZ,BX,-BZ+r);terraceShape.lineTo(BX,BZ-r);terraceShape.quadraticCurveTo(BX,BZ,BX-r,BZ);terraceShape.lineTo(-BX+r,BZ);terraceShape.quadraticCurveTo(-BX,BZ,-BX,BZ-r);terraceShape.lineTo(-BX,-BZ+r);terraceShape.quadraticCurveTo(-BX,-BZ,-BX+r,-BZ);
const terraceGeo=new THREE.ExtrudeGeometry(terraceShape,{depth:.42,bevelEnabled:true,bevelThickness:.06,bevelSize:.08,bevelSegments:3,curveSegments:6});terraceGeo.rotateX(-Math.PI/2);terraceGeo.translate(0,-.29,0);
// UV du dessus : la texture dallée suit exactement les cases du plateau.
{const p=terraceGeo.attributes.position,uv=terraceGeo.attributes.uv;for(let i=0;i<p.count;i++)uv.setXY(i,(p.getX(i)+4)/8,(p.getZ(i)+HZ)/rows)}
const stoneSide=mat(0x4e424b,{roughness:.95});const terrace=add(terraceGeo,[mat(0xffffff,{map:paving,roughness:.85}),stoneSide]);
// Marches qui descendent vers l'eau aux deux extrémités.
const stepMat=mat(0x6a5c66,{roughness:.92});for(const s of[-1,1])for(let k=0;k<3;k++){const st=add(new THREE.BoxGeometry(2.4-k*.3,.08,.32),stepMat);st.position.set(0,.06-k*.07,s*(BZ+.2+k*.3))}

// ---------- 3. Rochers au pied de la terrasse ----------
const rockGeo=(()=>{const g=new THREE.IcosahedronGeometry(1,2),p=g.attributes.position;for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i),n=1+Math.sin(v.x*3.1+v.y*2.3)*.14+Math.cos(v.z*4.2)*.1;v.multiplyScalar(n);v.y*=.62;p.setXYZ(i,v.x,v.y,v.z)}g.computeVertexNormals();return g})();
const rockMat=mat(0x5b545e,{roughness:.96}),mossMat=mat(0x34503e,{roughness:1});
const rockCount=software?36:70,rocks=new THREE.InstancedMesh(rockGeo,rockMat,rockCount);rocks.castShadow=rocks.receiveShadow=true;root.add(rocks);
const dmy=new THREE.Object3D();
for(let i=0;i<rockCount;i++){const side=i%4,u=rnd()*2-1;let x,z;if(side<2){x=(side?1:-1)*(BX+.25+rnd()*.45);z=u*BZ}else{z=(side===2?1:-1)*(BZ+.2+rnd()*.4);x=u*BX;if(Math.abs(x)<1.5)x+=Math.sign(x||1)*1.6}
 const s=.16+rnd()*.28;dmy.position.set(x,.02,z);dmy.rotation.set(rnd()*.3,rnd()*6.3,rnd()*.3);dmy.scale.set(s*(1+rnd()*.4),s,s*(1+rnd()*.3));dmy.updateMatrix();rocks.setMatrixAt(i,dmy.matrix)}
// ---------- 4. Îlots et sapins sombres ----------
const pineMat=mat(0x1d3a3d,{roughness:.88}),pineDark=mat(0x152a2e,{roughness:.9}),trunkMat=mat(0x3b2a2a);
const coneA=new THREE.ConeGeometry(1,1.6,7),coneB=new THREE.ConeGeometry(.78,1.3,7),trunkGeo=new THREE.CylinderGeometry(.08,.11,.5,6);
function pine(parent,x,z,s){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);parent.add(g);const tr=add(trunkGeo,trunkMat,g);tr.position.y=.25;
 [[.7,1],[1.25,.78],[1.75,.56]].forEach(([y,k],i)=>{const c=add(i%2?coneB:coneA,i===2?pineDark:pineMat,g);c.position.y=y;c.scale.set(k*.55,k*.62,k*.55);c.rotation.y=rnd()*6})}
const islandGeo=new THREE.CylinderGeometry(1,1.25,.35,12,1);
const islands=[[-6.2,-6.4,1.05],[6.1,-5.6,.85],[-6.3,2.6,.7],[6.25,1.4,.95],[-5.9,6.7,.9],[5.7,6.6,.75],[0,-7.35,.55],[-2.6,7.35,.45]];
for(const [x,z,s] of islands){const g=new THREE.Group();g.position.set(x,0,z);root.add(g);const isl=add(islandGeo,rockMat,g);isl.scale.set(s,1,s*.85);isl.position.y=.02;const top=add(new THREE.CylinderGeometry(.92,1,.08,12),mossMat,g);top.scale.set(s,1,s*.85);top.position.y=.2;
 const n=Math.max(1,Math.round(s*3));for(let k=0;k<n;k++){const a=rnd()*6.3,d=rnd()*s*.55;pine(g,Math.cos(a)*d,Math.sin(a)*d*.85,(.38+rnd()*.3)*Math.min(1,s+.2))}}
// ---------- 5. Nénuphars et fleurs de lotus ----------
const padGeo=new THREE.CircleGeometry(.22,14,.35,Math.PI*2-.7);padGeo.rotateX(-Math.PI/2);
const padCount=software?28:56,pads=new THREE.InstancedMesh(padGeo,mat(0x3f7a55,{roughness:.6,side:THREE.DoubleSide}),padCount);pads.receiveShadow=true;root.add(pads);
const padSeeds=[];const free=(x,z)=>(Math.abs(x)>BX+.75||Math.abs(z)>BZ+.75)&&Math.abs(x)<6.9&&Math.abs(z)<7.5&&!islands.some(([ix,iz,s])=>Math.hypot(x-ix,z-iz)<s*1.4);
for(let i=0;i<padCount;i++){let x,z,k=0;do{x=rnd()*13.6-6.8;z=rnd()*14.8-7.4;k++}while(!free(x,z)&&k<50);const s=.7+rnd()*.7;padSeeds.push({x,z,s,rot:rnd()*6.3,phase:rnd()*6})}
const petalGeo=new THREE.SphereGeometry(1,8,6);petalGeo.scale(.045,.03,.11);petalGeo.translate(0,.03,.07);
const flowerCount=software?10:20,petalPer=8,petals=new THREE.InstancedMesh(petalGeo,mat(0xffd2e6,{roughness:.55,emissive:0x5a1838,emissiveIntensity:.25}),flowerCount*petalPer*2),hearts=new THREE.InstancedMesh(new THREE.SphereGeometry(.035,8,6),mat(0xffd76a,{emissive:0x8a5a10,emissiveIntensity:.6}),flowerCount);root.add(petals,hearts);
const flowerSeeds=padSeeds.slice(0,flowerCount);
function placeLilies(t,moving){for(let i=0;i<padCount;i++){const p=padSeeds[i],bob=moving?Math.sin(t*1.1+p.phase)*.01:0;dmy.position.set(p.x,.06+bob,p.z);dmy.rotation.set(0,p.rot+(moving?Math.sin(t*.3+p.phase)*.08:0),0);dmy.scale.setScalar(p.s);dmy.updateMatrix();pads.setMatrixAt(i,dmy.matrix)}pads.instanceMatrix.needsUpdate=true;
 let n=0;for(let i=0;i<flowerCount;i++){const p=flowerSeeds[i],bob=moving?Math.sin(t*1.1+p.phase)*.01:0;for(let ring=0;ring<2;ring++)for(let k=0;k<petalPer;k++){const a=k/petalPer*Math.PI*2+ring*.4;dmy.position.set(p.x,.08+bob+ring*.015,p.z);dmy.rotation.set(-(ring?.75:.42),a,0,'YXZ');dmy.scale.setScalar(p.s*(ring?.75:1));dmy.updateMatrix();petals.setMatrixAt(n++,dmy.matrix)}
  dmy.position.set(p.x,.12+bob,p.z);dmy.rotation.set(0,0,0);dmy.scale.setScalar(p.s);dmy.updateMatrix();hearts.setMatrixAt(i,dmy.matrix)}petals.instanceMatrix.needsUpdate=hearts.instanceMatrix.needsUpdate=true}
placeLilies(0,false);updates.push((t,light,moving)=>{if(moving&&!light)placeLilies(t,true)});
// ---------- 6. Roseaux ----------
const reedGeo=new THREE.CylinderGeometry(.008,.014,1,4);reedGeo.translate(0,.5,0);const reedCount=software?60:140,reeds=new THREE.InstancedMesh(reedGeo,mat(0x6f8a52,{roughness:.8}),reedCount),reedTips=new THREE.InstancedMesh(new THREE.CylinderGeometry(.03,.03,.14,6),mat(0x5a3a2a),reedCount);root.add(reeds,reedTips);
const reedSeeds=[],clumps=[[-BX-.7,-3.4],[BX+.6,3.9],[-BX-.6,4.6],[BX+.75,-2.2],[2.6,-BZ-.7],[-3.2,BZ+.65]];
for(let i=0;i<reedCount;i++){const [cx,cz]=clumps[i%clumps.length],a=rnd()*6.3,d=rnd()*.42;reedSeeds.push({x:cx+Math.cos(a)*d,z:cz+Math.sin(a)*d,h:.45+rnd()*.5,lean:(rnd()-.5)*.25,phase:rnd()*6})}
function placeReeds(t,moving){for(let i=0;i<reedCount;i++){const s=reedSeeds[i],sway=moving?Math.sin(t*1.3+s.phase)*.06:0;dmy.position.set(s.x,0,s.z);dmy.rotation.set(s.lean+sway,0,s.lean*.6);dmy.scale.set(1,s.h,1);dmy.updateMatrix();reeds.setMatrixAt(i,dmy.matrix);
 const tip=new THREE.Vector3(0,s.h*.86,0).applyEuler(dmy.rotation);dmy.position.set(s.x+tip.x,tip.y,s.z+tip.z);dmy.scale.setScalar(1);dmy.updateMatrix();reedTips.setMatrixAt(i,dmy.matrix)}reeds.instanceMatrix.needsUpdate=reedTips.instanceMatrix.needsUpdate=true}
placeReeds(0,false);updates.push((t,light,moving)=>{if(moving&&!light)placeReeds(t,true)});
// ---------- 7. Ponton de bois ----------
const plank=mat(0x6b4a3a,{roughness:.85}),post=mat(0x3e2b24);
const pier=new THREE.Group();pier.position.set(BX+.15,0,-.6);root.add(pier);
for(let k=0;k<7;k++){const p=add(new THREE.BoxGeometry(.24,.05,.95),plank,pier);p.position.set(.2+k*.27,.2,0);p.rotation.y=(rnd()-.5)*.05}
for(const [x,z] of[[.3,-.42],[.3,.42],[1.95,-.42],[1.95,.42]]){const p=add(new THREE.CylinderGeometry(.045,.05,.5,6),post,pier);p.position.set(x,.05,z)}
const lantern=add(new THREE.SphereGeometry(.07,10,8),new THREE.MeshBasicMaterial({color:0xffe1b0}),pier,false);lantern.position.set(1.95,.42,.42);
const lanternPost=add(new THREE.CylinderGeometry(.018,.018,.25,6),post,pier);lanternPost.position.set(1.95,.27,.42);
const lanternLight=new THREE.PointLight(0xffb98a,software?0:2.2,3.2,2);lanternLight.position.copy(lantern.position);pier.add(lanternLight);
// ---------- 7b. Ruines du sanctuaire : piliers brisés et cristaux roses ----------
const pillarMat=mat(0x6a5d68,{roughness:.9}),crystalMat=new THREE.MeshStandardMaterial({color:0xff9fcd,emissive:0xff4fa6,emissiveIntensity:1.4,roughness:.25,metalness:.1,transparent:true,opacity:.92});
const crystalGeo=new THREE.OctahedronGeometry(.16,0);crystalGeo.scale(1,1.9,1);const crystals=[];
for(const [x,z,h,glow] of[[-BX-.5,-BZ+.7,1.3,1],[BX+.5,BZ-.7,1.1,1],[-BX-.55,BZ-1.4,.55,0],[BX+.55,-BZ+1.5,.7,0]]){const g=new THREE.Group();g.position.set(x,0,z);root.add(g);
 const base=add(new THREE.CylinderGeometry(.3,.34,.18,10),pillarMat,g);base.position.y=.1;const col=add(new THREE.CylinderGeometry(.19,.22,h,10),pillarMat,g);col.position.y=.2+h/2;
 const cap=add(new THREE.CylinderGeometry(.27,.21,.12,10),pillarMat,g);cap.position.y=.2+h+.06;cap.rotation.z=glow?0:.35;
 if(glow){const c=add(crystalGeo,crystalMat,g,false);c.position.y=.2+h+.45;crystals.push({c,y:c.position.y,phase:rnd()*6});if(!software){const l=new THREE.PointLight(0xff6fb8,3,4.5,2);l.position.y=c.position.y;g.add(l)}}}
updates.push((t,light,moving)=>{for(const k of crystals){k.c.rotation.y=moving?t*.6+k.phase:k.phase;k.c.position.y=k.y+(moving?Math.sin(t*1.2+k.phase)*.06:0)}crystalMat.emissiveIntensity=1.2+(moving?.35*Math.sin(t*1.8):0)});
// Cerisiers en fleurs sur deux îlots.
const blossomMat=mat(0xf6a6cb,{roughness:.8,emissive:0x5a1a3a,emissiveIntensity:.18}),blossomGeo=new THREE.IcosahedronGeometry(1,1);
for(const [x,z,s] of[[6.1,-5.6,.7],[-5.9,6.7,.75]]){const g=new THREE.Group();g.position.set(x+.25,0,z-.2);root.add(g);const tr=add(new THREE.CylinderGeometry(.06,.1,.9,6),trunkMat,g);tr.position.y=.62;tr.rotation.z=.15;
 for(let k=0;k<5;k++){const b=add(blossomGeo,blossomMat,g);b.position.set((rnd()-.5)*.6,1.05+rnd()*.35,(rnd()-.5)*.5);b.scale.setScalar((.28+rnd()*.16)*s/.7)}}
// ---------- 8. Brume et lucioles ----------
const softTex=canvasTex(128,128,(g,w,h)=>{const r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.4,'rgba(255,255,255,.35)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,w,h)});
const mists=[];for(let i=0;i<(software?4:9);i++){const m=new THREE.Sprite(new THREE.SpriteMaterial({map:softTex,color:0xffd9ea,transparent:true,opacity:.22,depthWrite:false}));const side=i%2?1:-1;m.position.set(side*(5.4+rnd()*1.2),.35+rnd()*.3,rnd()*13-6.5);m.scale.set(3.2+rnd()*2,1.1,1);root.add(m);mists.push({m,x:m.position.x,phase:rnd()*6})}
const flyCount=software?14:34,flyGeo=new THREE.BufferGeometry(),flyPos=new Float32Array(flyCount*3),flySeeds=[];
for(let i=0;i<flyCount;i++){let x,z;do{x=rnd()*13-6.5;z=rnd()*14-7}while(Math.abs(x)<BX&&Math.abs(z)<BZ&&rnd()<.8);flySeeds.push({x,z,y:.35+rnd()*1.4,phase:rnd()*6,sp:.4+rnd()*.5})}
flyGeo.setAttribute('position',new THREE.BufferAttribute(flyPos,3));
const flies=new THREE.Points(flyGeo,new THREE.PointsMaterial({map:softTex,color:0xffd9ee,size:.34,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true}));flies.frustumCulled=false;root.add(flies);
function placeFlies(t){for(let i=0;i<flyCount;i++){const s=flySeeds[i];flyPos[i*3]=s.x+Math.sin(t*s.sp+s.phase)*.35;flyPos[i*3+1]=s.y+Math.sin(t*s.sp*1.7+s.phase)*.18;flyPos[i*3+2]=s.z+Math.cos(t*s.sp*.8+s.phase)*.35}flyGeo.attributes.position.needsUpdate=true}
placeFlies(0);updates.push((t,light,moving)=>{if(moving)placeFlies(t);flies.material.opacity=.65+(moving?.35*Math.sin(t*2.3):0);for(const s of mists)s.m.position.x=s.x+(moving?Math.sin(t*.12+s.phase)*.5:0)});
return{root,update(t,light,moving){for(const u of updates)u(t,light,moving)}};
}
