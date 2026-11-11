/* v239 — Terrain feu « Les Terres embrasées », entièrement repensé.
   Le damier est une arène de dalles de basalte bien nettes ; la lave ne passe plus dessous qu'en fins joints lumineux
   (c'est le quadrillage lui-même). Autour : douves de lave en mouvement, rive de roche cendrée, volcans fumants
   dans les coins arrière, aiguilles d'obsidienne, braseros de bronze, braises qui montent et cendres qui tombent.
   Les évents (cases bloquées) sont de vraies cheminées de magma : creuses, rougeoyantes, avec flammes et fumée.
   Coordonnées réelles des cases (root.scale.z = 1/ZS appliqué par clearing-v105.js). Règles : moteur du jeu. */
import * as THREE from 'three';
export function createEmberlands(world,vents=[],software=false,rows=10){
const root=new THREE.Group();world.add(root);root.visible=false;
let seed=9173;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const HZ=rows/2,BX=4.32,BZ=HZ+.32,TOP=.2,FX=7.2,FZ=HZ+2.45;// plateforme, haut des dalles, cadre
const mix=(a,b,t)=>a+(b-a)*t,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
const noise=(x,z)=>Math.sin(x*2.71+Math.sin(z*1.9))*Math.cos(z*2.31-x*.61)*.5+Math.sin(x*7.1+z*5.3)*.15;
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.9,...extra});
const add=(geo,material,parent=root,shadow=!software)=>{const m=new THREE.Mesh(geo,material);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m};
const canvasTex=(w,h,draw,srgb=true)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);if(srgb)t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t};
const lava=t=>{const s=[[.05,0,0],[.35,.02,.004],[.85,.12,.01],[1,.36,.03],[1,.66,.16],[1,.93,.6]],v=clamp(t,0,.999)*(s.length-1),i=Math.floor(v),a=s[i],b=s[i+1],k=v-i;return[mix(a[0],b[0],k),mix(a[1],b[1],k),mix(a[2],b[2],k)]};
const updates=[],isVent=(x,y)=>vents.some(([a,b])=>a===x&&b===y),cellX=x=>x-3.5,cellZ=y=>y-(rows-1)/2;

// ---------- 1. Lave des douves : croûte sombre en plaques, fissures incandescentes (Worley tuilable) ----------
const lavaTex=canvasTex(256,256,(g,w,h)=>{const pts=Array.from({length:70},()=>[rnd()*w,rnd()*h]),img=g.createImageData(w,h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){let f1=1e9,f2=1e9;for(const [px,py] of pts)for(let ox=-w;ox<=w;ox+=w)for(let oy=-h;oy<=h;oy+=h){const d=Math.hypot(x-px-ox,y-py-oy);if(d<f1){f2=f1;f1=d}else if(d<f2)f2=d}
  const edge=f2-f1,crack=1-smooth(.6,4.5,edge),halo=1-smooth(0,13,edge),grain=Math.sin(x*1.7+y*.9)*Math.sin(y*1.3-x*.4),heat=clamp(.12+halo*.3+crack*.55+grain*.03),c=lava(heat),i=(y*w+x)*4;
  img.data[i]=c[0]*255;img.data[i+1]=c[1]*255;img.data[i+2]=c[2]*255;img.data[i+3]=255}
 g.putImageData(img,0,0)});lavaTex.repeat.set(6,6*(rows+5)/15);
const lavaMat=new THREE.MeshBasicMaterial({map:lavaTex,color:0xffffff});
const lavaGeo=new THREE.PlaneGeometry(FX*2,FZ*2,software?1:60,software?1:60);lavaGeo.rotateX(-Math.PI/2);const lavaPlane=add(lavaGeo,lavaMat,root,false);lavaPlane.position.y=-.24;lavaPlane.renderOrder=-3;
const lavaPos=lavaGeo.attributes.position,lavaOrig=Float32Array.from(lavaPos.array);
updates.push((t,light,moving)=>{if(!moving)return;lavaTex.offset.set(t*.006,t*.011);lavaMat.color.setRGB(1,.9+Math.sin(t*.8)*.06,.85+Math.sin(t*.8)*.08);if(light||software)return;for(let i=0;i<lavaPos.count;i++){const x=lavaOrig[i*3],z=lavaOrig[i*3+2];lavaPos.setY(i,Math.sin(x*1.3+t*.6)*.012+Math.sin(z*1.7-t*.5)*.01)}lavaPos.needsUpdate=true});

// ---------- 2. Rive cendrée : remonte de la lave jusqu'au cadre, chaude près du bord ----------
const outside=(x,z)=>Math.max(Math.abs(x)-BX,Math.abs(z)-BZ);
function groundH(x,z){const d=outside(x,z);if(d<.82)return -.62;const r=smooth(.82,1.3,d);return mix(-.62,.02,r)+r*(Math.max(0,d-1.3)*.1+noise(x*.8,z*.8)*.09)}
const ashTex=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#958a84';g.fillRect(0,0,w,h);for(let i=0;i<9000;i++){const v=rnd();g.fillStyle=v>.6?`rgba(150,138,128,${.08+rnd()*.14})`:`rgba(18,14,14,${.1+rnd()*.2})`;g.fillRect(rnd()*w,rnd()*h,1+rnd()*2.2,1+rnd()*2.2)}g.strokeStyle='rgba(15,10,10,.55)';for(let i=0;i<40;i++){g.lineWidth=.6+rnd();g.beginPath();let x=rnd()*w,y=rnd()*h;g.moveTo(x,y);for(let k=0;k<5;k++){x+=(rnd()-.5)*30;y+=(rnd()-.5)*30;g.lineTo(x,y)}g.stroke()}});ashTex.repeat.set(5,5*(rows+5)/15);
const groundGeo=new THREE.PlaneGeometry(FX*2,FZ*2,software?36:96,software?40:110);groundGeo.rotateX(-Math.PI/2);{const p=groundGeo.attributes.position,c=[];for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=groundH(x,z),d=outside(x,z);p.setY(i,y);const hot=1-smooth(.85,1.7,d),col=new THREE.Color(0xa49890).lerp(new THREE.Color(0x6a5f62),smooth(-.2,.3,noise(x*.6,z*.6))*.6).lerp(new THREE.Color(0xb0482a),hot*.55);c.push(col.r,col.g,col.b)}groundGeo.setAttribute('color',new THREE.Float32BufferAttribute(c,3));groundGeo.computeVertexNormals()}
add(groundGeo,mat(0xffffff,{vertexColors:true,map:ashTex,bumpMap:ashTex,bumpScale:.04,roughness:.97}),root,false).renderOrder=-2;

// ---------- 3. L'arène : socle de basalte strié, dalles nettes, joints de lave = quadrillage ----------
const strataTex=canvasTex(512,64,(g,w,h)=>{g.fillStyle='#2c2527';g.fillRect(0,0,w,h);for(let y=0;y<h;y+=3+rnd()*5){g.fillStyle=`rgba(${70+rnd()*30},${58+rnd()*20},${55+rnd()*20},${.35+rnd()*.3})`;g.fillRect(0,y,w,1+rnd()*2.5)}for(let i=0;i<500;i++){g.fillStyle=`rgba(0,0,0,${rnd()*.35})`;g.fillRect(rnd()*w,rnd()*h,2+rnd()*8,1)}});
const seamTex=canvasTex(512,64,(g,w,h)=>{g.fillStyle='#000';g.fillRect(0,0,w,h);for(let i=0;i<7;i++){const y=10+rnd()*44;g.strokeStyle=`rgba(255,${90+rnd()*80},20,${.6+rnd()*.4})`;g.lineWidth=.8+rnd()*1.4;g.beginPath();g.moveTo(0,y);for(let x=0;x<=w;x+=16)g.lineTo(x,y+Math.sin(x*.05+i)*3+(rnd()-.5)*2);g.stroke()}});
strataTex.repeat.set(3,1);seamTex.repeat.set(3,1);
const plinthMat=mat(0xffffff,{map:strataTex,emissive:0xff6a2a,emissiveMap:seamTex,emissiveIntensity:1.1,roughness:.92});
const plinth=add(new THREE.BoxGeometry(BX*2,.86,BZ*2),[plinthMat,plinthMat,mat(0x2a2224),mat(0x1c1718),plinthMat,plinthMat]);plinth.position.y=TOP-.5;
// Lueur sous les dalles : visible seulement dans les joints, elle dessine le damier.
const glowMat=new THREE.MeshBasicMaterial({color:0xff5a18});const under=add(new THREE.PlaneGeometry(8.04,rows+.04),glowMat,root,false);under.rotation.x=-Math.PI/2;under.position.y=TOP-.075;
updates.push((t,light,moving)=>{const k=moving?.5+.5*Math.sin(t*1.1):.6;glowMat.color.setRGB(1,.3+k*.12,.06+k*.03);plinthMat.emissiveIntensity=.9+k*.4});
// Dalles : pierre volcanique claire en damier très doux, biseau sombre, quelques fines fêlures.
const slabTex=canvasTex(128,128,(g,w,h)=>{const img=g.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const e=Math.min(x,y,w-1-x,h-1-y),bevel=smooth(0,9,e),n=noise(x*.06,y*.06)*.5+noise(x*.21+3,y*.19)*.25,v=clamp(.62+n*.16+(rnd()-.5)*.08)*(.55+.45*bevel),i=(y*w+x)*4;img.data[i]=v*255;img.data[i+1]=v*248;img.data[i+2]=v*240;img.data[i+3]=255}g.putImageData(img,0,0);g.strokeStyle='rgba(20,12,10,.45)';g.lineWidth=1;for(let k=0;k<2;k++){g.beginPath();let x=20+rnd()*88,y=20+rnd()*88;g.moveTo(x,y);for(let s=0;s<4;s++){x+=(rnd()-.5)*34;y+=(rnd()-.5)*34;g.lineTo(clamp(x,8,120),clamp(y,8,120))}g.stroke()}});
const slabGeo=new THREE.BoxGeometry(.93,.12,.93);slabGeo.translate(0,-.06,0);
const slabs=new THREE.InstancedMesh(slabGeo,mat(0xffffff,{map:slabTex,bumpMap:slabTex,bumpScale:.03,roughness:.86}),8*rows),dummy=new THREE.Object3D();let si=0;
for(let y=0;y<rows;y++)for(let x=0;x<8;x++){if(isVent(x,y))continue;dummy.position.set(cellX(x),TOP-.002+(rnd()-.5)*.006,cellZ(y));dummy.rotation.set(0,(rnd()-.5)*.03,0);dummy.updateMatrix();slabs.setMatrixAt(si,dummy.matrix);const base=new THREE.Color((x+y)%2?0x8c7b70:0x6f6058);base.offsetHSL(0,0,(rnd()-.5)*.035);slabs.setColorAt(si,base);si++}
slabs.count=si;slabs.castShadow=false;slabs.receiveShadow=true;root.add(slabs);
// Bordure de l'arène : margelle de basalte et filet de bronze.
const rimMat=mat(0x3a3033,{map:strataTex,roughness:.9}),bronze=mat(0xa8784a,{metalness:.6,roughness:.42});
for(const s of[-1,1]){const a=add(new THREE.BoxGeometry(BX*2+.06,.16,.3),rimMat);a.position.set(0,TOP-.03,s*(BZ-.15));const b=add(new THREE.BoxGeometry(.3,.16,BZ*2-.6),rimMat);b.position.set(s*(BX-.15),TOP-.03,0);
 const c=add(new THREE.BoxGeometry(BX*2+.1,.035,.04),bronze);c.position.set(0,TOP+.06,s*(BZ-.02));const d=add(new THREE.BoxGeometry(.04,.035,BZ*2),bronze);d.position.set(s*(BX-.02),TOP+.06,0)}

// ---------- 4. Évents : cheminées de magma creusées dans l'arène (cases impraticables) ----------
const magmaTex=canvasTex(128,128,(g,w,h)=>{const img=g.createImageData(w,h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const X=(x-64)/64,Y=(y-64)/64,r=Math.hypot(X,Y),a=Math.atan2(Y,X),sw=Math.sin(a*4+r*11)*.5+.5,heat=clamp(1-r*.75+sw*.18-.1),c=lava(.3+heat*.7),i=(y*w+x)*4;img.data[i]=c[0]*255;img.data[i+1]=c[1]*255;img.data[i+2]=c[2]*255;img.data[i+3]=r<1?255:0}g.putImageData(img,0,0)});
const glowTex=canvasTex(64,64,(g,w,h)=>{const r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,220,140,1)');r.addColorStop(.35,'rgba(255,120,30,.55)');r.addColorStop(1,'rgba(255,60,10,0)');g.fillStyle=r;g.fillRect(0,0,w,h)});
const flameTex=canvasTex(128,128,(g)=>{const fg=g.createRadialGradient(64,99,2,64,75,59);fg.addColorStop(0,'rgba(255,251,193,1)');fg.addColorStop(.18,'rgba(255,213,80,.95)');fg.addColorStop(.43,'rgba(255,112,20,.72)');fg.addColorStop(.72,'rgba(205,31,10,.17)');fg.addColorStop(1,'rgba(170,15,5,0)');g.fillStyle=fg;g.beginPath();g.moveTo(30,123);g.bezierCurveTo(12,93,52,72,57,12);g.bezierCurveTo(89,48,75,60,98,84);g.bezierCurveTo(113,113,85,129,30,123);g.fill()});
const smokeTex=canvasTex(128,128,(g)=>{const r=g.createRadialGradient(64,64,5,64,64,62);r.addColorStop(0,'rgba(120,108,110,.55)');r.addColorStop(.5,'rgba(90,82,88,.22)');r.addColorStop(1,'rgba(70,64,72,0)');g.fillStyle=r;g.fillRect(0,0,128,128)});
const flameGeo=new THREE.PlaneGeometry(1,1);flameGeo.translate(0,.5,0);
const flames=[],smokes=[];
function flame(x,y,z,s,parent=root){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);const m=new THREE.MeshBasicMaterial({map:flameTex,transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});for(let k=0;k<2;k++){const o=new THREE.Mesh(flameGeo,m);o.rotation.y=k*Math.PI/2+.6;g.add(o)}g.scale.setScalar(s);flames.push({g,m,s,p:rnd()*6});return g}
function smoke(x,y,z,size,n=4,parent=root){for(let i=0;i<n;i++){const m=new THREE.SpriteMaterial({map:smokeTex,transparent:true,depthWrite:false,opacity:0});const s=new THREE.Sprite(m);parent.add(s);smokes.push({s,x,y,z,size,p:i/n+rnd()*.1})}}
const lipGeo=new THREE.TorusGeometry(.37,.06,7,22);lipGeo.rotateX(Math.PI/2);{const p=lipGeo.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,p.getY(i)*(.9+noise(p.getX(i)*6,p.getZ(i)*6)*.5))}lipGeo.computeVertexNormals();
const ventMats=[];for(const [vx,vy] of vents){const x=cellX(vx),z=cellZ(vy);
 const well=add(new THREE.CylinderGeometry(.42,.36,.3,20,1,true),mat(0x1d1617,{side:THREE.DoubleSide}),root,false);well.position.set(x,TOP-.16,z);
 const floor=add(new THREE.BoxGeometry(.93,.04,.93),mat(0x231b1c,{roughness:1}),root,false);floor.position.set(x,TOP-.09,z);
 const pool=new THREE.Mesh(new THREE.CircleGeometry(.36,28),new THREE.MeshBasicMaterial({map:magmaTex}));pool.rotation.x=-Math.PI/2;pool.position.set(x,TOP-.035,z);root.add(pool);ventMats.push(pool);
 const lip=add(lipGeo,mat(0x3b2f30,{roughness:.95}));lip.position.set(x,TOP+.01,z);
 const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.7}));halo.position.set(x,TOP+.12,z);halo.scale.setScalar(1.3);root.add(halo);ventMats.push(halo);
 // Liseré d'avertissement autour de la case.
 const warn=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(.88,.88).rotateX(-Math.PI/2)),new THREE.LineBasicMaterial({color:0xff7a3a,transparent:true,opacity:.9}));warn.position.set(x,TOP+.012,z);root.add(warn);
 for(let k=0;k<3;k++){const a=k/3*Math.PI*2+vx;flame(x+Math.cos(a)*.13,TOP-.04,z+Math.sin(a)*.13,.17+rnd()*.06)}flame(x,TOP-.04,z,.24);smoke(x,TOP+.2,z,.9,4)}
updates.push((t,light,moving)=>{for(const m of ventMats){if(m.isLava)continue;if(m.isSprite){m.material.opacity=.55+(moving?Math.sin(t*2.3+m.position.x)*.18:0);m.scale.setScalar(1+(moving?Math.sin(t*1.7+m.position.z)*.08:0))}else m.rotation.z=moving?t*.25:0}});

// ---------- 5. Volcans dans les coins arrière, coulées et panaches ----------
const streakTex=canvasTex(256,128,(g,w,h)=>{g.clearRect(0,0,w,h);for(const u0 of[.08,.37,.62,.86]){let u=u0*w;const width=5+rnd()*5;for(let y=0;y<h;y++){u+=(rnd()-.5)*2.2+Math.sin(y*.12+u0*9)*.6;const k=y/h,fade=y<h*.12?0:Math.min(1,(k-.12)*4)*(y>h*.86?Math.max(0,1-(k-.86)*7):1),wd=width*(.6+k*.7);const gr=g.createLinearGradient(u-wd,0,u+wd,0);gr.addColorStop(0,'rgba(255,60,10,0)');gr.addColorStop(.35,`rgba(255,110,25,${.85*fade})`);gr.addColorStop(.5,`rgba(255,170,60,${fade})`);gr.addColorStop(.65,`rgba(255,110,25,${.85*fade})`);gr.addColorStop(1,'rgba(255,60,10,0)');g.fillStyle=gr;g.fillRect(u-wd,y,wd*2,1.2)}}});streakTex.wrapT=THREE.ClampToEdgeWrapping;streakTex.flipY=false;
function volcano(x,z,r,h){const prof=[];for(let i=0;i<=14;i++){const k=i/14,rad=mix(r,r*.24,Math.pow(k,.85)),y=mix(-.6,h,k);prof.push(new THREE.Vector2(rad*(1+(i%3?.03:-.03)),y))}prof.push(new THREE.Vector2(r*.16,h-.18));
 const geo=new THREE.LatheGeometry(prof,software?14:30);const p=geo.attributes.position,c=[];for(let i=0;i<p.count;i++){const X=p.getX(i),Y=p.getY(i),Z=p.getZ(i),n=noise(X*2.2+x,Z*2.2+Y);p.setX(i,X*(1+n*.07));p.setZ(i,Z*(1+n*.07));const col=new THREE.Color(0x857a7c).lerp(new THREE.Color(0xa89a92),smooth(-.4,.6,n)*.6).lerp(new THREE.Color(0x4a3e40),smooth(h*.55,h,Y)*.5);c.push(col.r,col.g,col.b)}geo.setAttribute('color',new THREE.Float32BufferAttribute(c,3));geo.computeVertexNormals();
 const cone=add(geo,mat(0xffffff,{vertexColors:true,map:ashTex,bumpMap:ashTex,bumpScale:.06}));cone.position.set(x,0,z);
 const crater=new THREE.Mesh(new THREE.CircleGeometry(r*.22,20),new THREE.MeshBasicMaterial({map:magmaTex}));crater.rotation.x=-Math.PI/2;crater.position.set(x,h-.12,z);root.add(crater);ventMats.push(crater);
 const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:.8}));halo.position.set(x,h+.1,z);halo.scale.setScalar(r*1.3);root.add(halo);ventMats.push(halo);
 // Coulées : peintes sur un second habillage du cône (UV de révolution), elles épousent exactement la pente.
 const flow=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({map:streakTex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));flow.position.copy(cone.position);flow.scale.setScalar(1.006);flow.rotation.y=Math.atan2(-x,-z)*0+rnd()*6;root.add(flow);ventMats.push({isLava:true,m:flow.material});
 flame(x,h-.2,z,.55+r*.2);smoke(x,h+.2,z,2.4+r,6)}
const VZ=-FZ+1.25;volcano(-FX+1.4,VZ,1.3,2.3);volcano(FX-1.3,VZ+.1,1,1.6);
updates.push((t,light,moving)=>{for(const v of ventMats)if(v.isLava){const k=moving?Math.sin(t*1.6)*.12:0;v.m.color.setRGB(1,.92+k*.5,.85+k)}});

// ---------- 6. Aiguilles d'obsidienne, rochers, braseros ----------
const obsidian=new THREE.MeshPhysicalMaterial({color:0x17121a,roughness:.18,metalness:.25,clearcoat:.8,clearcoatRoughness:.15,flatShading:true});
const shard=new THREE.ConeGeometry(1,1,5,1);shard.translate(0,.5,0);
function spire(x,z,s){const g=new THREE.Group();g.position.set(x,groundH(x,z)-.02,z);root.add(g);const n=3+Math.floor(rnd()*3);for(let i=0;i<n;i++){const m=add(shard,obsidian,g);const h=s*(.5+rnd()*.9)*(i?1:1.5),w=s*(.1+rnd()*.07);m.scale.set(w,h,w);m.position.set((rnd()-.5)*s*.5,0,(rnd()-.5)*s*.5);m.rotation.set((rnd()-.5)*.5,rnd()*6,(rnd()-.5)*.5)}}
const sideSpots=[];for(let i=0;i<(software?10:20);i++){const side=i%2?1:-1,x=side*(5.95+rnd()*.85),z=-FZ+2.6+rnd()*(FZ*2-3.4);sideSpots.push([x,z])}
for(const [x,z] of sideSpots)spire(x,z,.5+rnd()*.45);
for(const [x,z] of[[-2.4,-FZ+1.2],[2.2,-FZ+1.3],[-.2,-FZ+.95],[-5.8,FZ-1.1],[5.9,FZ-1.2],[1.6,FZ-.9],[-2.9,FZ-1]])spire(x,z,.38+rnd()*.25);
const boulder=new THREE.IcosahedronGeometry(1,1);{const p=boulder.attributes.position;for(let i=0;i<p.count;i++){const n=noise(p.getX(i)*3,p.getZ(i)*3+p.getY(i));p.setXYZ(i,p.getX(i)*(1+n*.18),p.getY(i)*(1+n*.14),p.getZ(i)*(1+n*.18))}boulder.computeVertexNormals()}
const rockMat=mat(0x8a7f80,{map:ashTex,flatShading:true});for(let i=0;i<(software?16:34);i++){const side=rnd()>.5?1:-1,alongX=rnd()>.45;const x=alongX?side*(5.2+rnd()*1.7):(rnd()*2-1)*6.3,z=alongX?(rnd()*2-1)*(FZ-.8):side*(BZ+1.65+rnd()*.5);if(outside(x,z)<1.3)continue;const s=.12+Math.pow(rnd(),1.6)*.3,m=add(boulder,rockMat);m.position.set(x,groundH(x,z)+s*.25,z);m.scale.set(s,s*.65,s*(.7+rnd()*.4));m.rotation.y=rnd()*6}
// Braseros aux quatre coins de l'arène, posés sur la rive.
for(const sx of[-1,1])for(const sz of[-1,1]){const x=sx*(BX+1.75),z=sz*(BZ+.15);const y=groundH(x,z);const leg=add(new THREE.CylinderGeometry(.05,.08,.5,8),bronze);leg.position.set(x,y+.25,z);const bowl=add(new THREE.CylinderGeometry(.2,.08,.16,12),bronze);bowl.position.set(x,y+.56,z);const coals=new THREE.Mesh(new THREE.CircleGeometry(.17,12),new THREE.MeshBasicMaterial({color:0xff8a2a}));coals.rotation.x=-Math.PI/2;coals.position.set(x,y+.63,z);root.add(coals);flame(x,y+.6,z,.42)}

// ---------- 7. Cadre de basalte forgé ----------
const frameDark=mat(0x211b1e,{map:strataTex,roughness:.85}),edge=new THREE.MeshBasicMaterial({color:0xc2441c});
for(const s of[-1,1]){const zb=add(new THREE.BoxGeometry(FX*2+.6,1.5,.5),frameDark);zb.position.set(0,-.38,s*(FZ+.25));const zt=add(new THREE.BoxGeometry(FX*2+.7,.12,.6),bronze);zt.position.set(0,.42,s*(FZ+.25));const ze=add(new THREE.BoxGeometry(FX*2,.02,.03),edge,root,false);ze.position.set(0,.49,s*(FZ+.25));
 const xb=add(new THREE.BoxGeometry(.5,1.5,FZ*2+1),frameDark);xb.position.set(s*(FX+.25),-.38,0);const xt=add(new THREE.BoxGeometry(.6,.12,FZ*2+1.1),bronze);xt.position.set(s*(FX+.25),.42,0);const xe=add(new THREE.BoxGeometry(.03,.02,FZ*2),edge,root,false);xe.position.set(s*(FX+.25),.49,0)}
for(const sx of[-1,1])for(const sz of[-1,1]){const c=add(new THREE.BoxGeometry(.72,.2,.72),bronze);c.position.set(sx*(FX+.25),.46,sz*(FZ+.25));const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.13,0),new THREE.MeshBasicMaterial({color:0xffb45a}));gem.position.set(sx*(FX+.25),.66,sz*(FZ+.25));root.add(gem)}

// ---------- 8. Braises qui montent, cendres qui tombent, bulles des douves ----------
const dotTex=canvasTex(32,32,(g)=>{const r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.4,'rgba(255,255,255,.6)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,32,32)});
function particles(n,color,size,blend){const geo=new THREE.BufferGeometry(),pos=new Float32Array(n*3);geo.setAttribute('position',new THREE.BufferAttribute(pos,3));const pts=new THREE.Points(geo,new THREE.PointsMaterial({map:dotTex,color,size,sizeAttenuation:false,transparent:true,depthWrite:false,blending:blend,opacity:.95}));pts.frustumCulled=false;root.add(pts);return{pts,pos,seed:Array.from({length:n},()=>({x:0,z:0,p:rnd(),v:.5+rnd()*.7,w:rnd()*6}))}}
const moatSpot=()=>{for(;;){const x=(rnd()*2-1)*(BX+1),z=(rnd()*2-1)*(BZ+1);const d=outside(x,z);if(d>.12&&d<.72)return[x,z]}};
const embers=particles(software?40:150,0xffa040,software?3:4.5,THREE.AdditiveBlending);embers.seed.forEach((s,i)=>{const v=i%5===0&&vents.length?vents[i%vents.length]:null;if(v){s.x=cellX(v[0]);s.z=cellZ(v[1]);s.vent=true}else[s.x,s.z]=moatSpot()});
const ash=particles(software?0:110,0xb9aea6,3,THREE.NormalBlending);ash.pts.material.opacity=.55;ash.seed.forEach(s=>{s.x=(rnd()*2-1)*FX;s.z=(rnd()*2-1)*FZ});
const bubbleGeo=new THREE.SphereGeometry(1,8,6),bubbles=[];for(let i=0;i<(software?4:14);i++){const m=new THREE.Mesh(bubbleGeo,new THREE.MeshBasicMaterial({color:0xffc060,transparent:true}));const [x,z]=moatSpot();m.position.set(x,-.22,z);m.scale.setScalar(.01);root.add(m);bubbles.push({m,p:rnd(),x,z})}
updates.push((t,light,moving)=>{const T=moving?t:0;
 embers.seed.forEach((s,i)=>{const a=(T*.13*s.v+s.p)%1;embers.pos[i*3]=s.x+Math.sin(a*6+s.w)*.25*a;embers.pos[i*3+1]=(s.vent?TOP:-.2)+a*(s.vent?2:2.6);embers.pos[i*3+2]=s.z+Math.cos(a*5+s.w)*.2*a});embers.pts.geometry.attributes.position.needsUpdate=true;embers.pts.material.opacity=moving?.95:.6;
 ash.seed.forEach((s,i)=>{const a=(T*.035*s.v+s.p)%1;ash.pos[i*3]=s.x+Math.sin(T*.4+s.w)*.3;ash.pos[i*3+1]=3.6-a*3.9;ash.pos[i*3+2]=s.z+Math.cos(T*.3+s.w)*.3});ash.pts.geometry.attributes.position.needsUpdate=true;
 for(const b of bubbles){const a=(T*.3+b.p)%1,k=a<.8?a/.8:1-(a-.8)/.2;b.m.scale.set(.02+k*.07,.01+k*.05,.02+k*.07);b.m.material.opacity=a<.8?.9:1-(a-.8)*4;b.m.visible=moving}
 for(const f of flames){const k=moving?1+Math.sin(t*5.1+f.p)*.16+Math.sin(t*8.3+f.p)*.07:1;f.g.scale.set(f.s*(2-k),f.s*1.7*k,f.s);f.g.rotation.y=moving?Math.sin(t*1.8+f.p)*.2:0;f.m.opacity=.8+(moving?Math.sin(t*4+f.p)*.12:0)}
 for(const s of smokes){const a=moving?(t*.12+s.p)%1:s.p;s.s.position.set(s.x+Math.sin(a*4+s.p*9)*a*.25,s.y+a*1.5*Math.min(1.6,s.size*.6),s.z+Math.cos(a*3)*a*.2);s.s.scale.setScalar((.25+a*.75)*s.size*.55);s.s.material.opacity=Math.sin(a*Math.PI)*.42}});
// Une seule lumière chaude, près du grand volcan (aucune en mode léger).
if(!software){const heat=new THREE.PointLight(0xff6a25,3.2,9,1.6);heat.position.set(-FX+1.5,2.2,VZ+.6);root.add(heat);updates.push((t,l,moving)=>{heat.intensity=3.2+(moving?Math.sin(t*1.7)*.5:0)})}
return{root,update(t,light,moving){for(const u of updates)u(t,light,moving)}};
}
