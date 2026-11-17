/* v368 — Terrain neutre « La taverne du Griffon Doré » : la grande salle de la guilde des chasseurs de primes.
   Plancher de chêne, grand tapis rouge et or sous le plateau (cases de bois marqueté, clous de laiton), comptoir de Maebril avec pompes
   à bière, chopes et étagères de bouteilles, cheminée de pierre qui crépite, fenêtres à croisillons, bannière du griffon,
   tables rondes avec tabourets, chopes, bougies… et deux tables où l'on joue aux dés d'Hackénia (mini plateau, dés élémentaires).
   Le panneau d'affichage magique de la guilde : ses avis sont écrits en runes qui ondulent, lisibles seulement par les membres du Griffon,
   chacun scellé d'un colibri selon le rang (bronze, argent, or) ; un halo de magie l'entoure.
   Quelques habitués (modèles du jeu, pose d'attente) : Maebril au comptoir, des joueurs autour des tables.
   Murs bas en coupe (maison de poupée) : la caméra plonge à ≈40°, rien de plus haut que la pente ne masque le plateau.
   Coordonnées réelles des cases (root.scale.z = 1/ZS appliqué par clearing-v105.js). Aucun élément n'est favorisé. */
import * as THREE from 'three';
export function createTavern(world,software=false,rows=10,helpers={}){
const root=new THREE.Group();world.add(root);root.visible=false;
let seed=2309;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const HZ=rows/2,BX=4.3,BZ=HZ+.3,TOP=.2,FX=7.2,FZ=HZ+2.45;
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.82,...extra});
const add=(geo,material,parent=root,shadow=!software)=>{const m=new THREE.Mesh(geo,material);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m};
const canvasTex=(w,h,draw,rep=null)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;if(rep)t.repeat.set(...rep);return t};
const updates=[],cellX=x=>x-3.5,cellZ=y=>y-(rows-1)/2,dummy=new THREE.Object3D();
const dotTex=canvasTex(32,32,g=>{const r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.45,'rgba(255,255,255,.5)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,32,32)});
const glow=(color,size,op=.8)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color,transparent:true,opacity:op,depthWrite:false,blending:THREE.AdditiveBlending}));s.scale.setScalar(size);return s};

// ---------- 1. Plancher de chêne et grand tapis ----------
const planks=canvasTex(512,512,(g,w,h)=>{const cols=['#6b4426','#5e3b20','#74492a','#64401f','#6f4625'];for(let y=0;y<h;y+=32){let x=-(y/32%3)*60;while(x<w){const len=120+rnd()*140;g.fillStyle=cols[Math.floor(rnd()*cols.length)];g.fillRect(x,y,len,32);g.strokeStyle='rgba(30,16,8,.55)';g.lineWidth=2;g.strokeRect(x,y,len,32);
  for(let k=0;k<5;k++){g.strokeStyle=`rgba(40,22,10,${.12+rnd()*.12})`;g.lineWidth=1;g.beginPath();const yy=y+4+rnd()*24;g.moveTo(x,yy);g.bezierCurveTo(x+len*.3,yy+rnd()*4-2,x+len*.6,yy+rnd()*4-2,x+len,yy);g.stroke()}g.fillStyle='rgba(20,12,6,.6)';g.fillRect(x+6,y+14,3,3);g.fillRect(x+len-9,y+14,3,3);x+=len}}},[5,5*FZ/FX]);
const floor=add(new THREE.PlaneGeometry(FX*2,FZ*2),mat(0xffffff,{map:planks,bumpMap:planks,bumpScale:.02,roughness:.7}),root,false);floor.rotation.x=-Math.PI/2;floor.position.y=.01;
const rugTex=canvasTex(256,320,(g,w,h)=>{g.fillStyle='#7e1d1d';g.fillRect(0,0,w,h);g.strokeStyle='#d9a441';g.lineWidth=10;g.strokeRect(10,10,w-20,h-20);g.lineWidth=3;g.strokeRect(26,26,w-52,h-52);
 for(let i=0;i<w;i+=16){g.fillStyle=i%32?'#d9a441':'#2c3f7a';g.fillRect(i,0,8,6);g.fillRect(i,h-6,8,6)}for(let i=0;i<h;i+=16){g.fillStyle=i%32?'#d9a441':'#2c3f7a';g.fillRect(0,i,6,8);g.fillRect(w-6,i,6,8)}
 g.fillStyle='rgba(217,164,65,.25)';for(let k=0;k<20;k++){g.beginPath();g.arc(30+rnd()*(w-60),30+rnd()*(h-60),2+rnd()*3,0,7);g.fill()}});
const rug=add(new THREE.PlaneGeometry(BX*2+2.5,BZ*2+2.2),mat(0xffffff,{map:rugTex,roughness:1}),root,false);rug.rotation.x=-Math.PI/2;rug.position.y=.02;

// ---------- 2. Le plateau : socle de noyer, cases marquetées, clous de laiton ----------
const inlay=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#c79a5e';g.fillRect(0,0,w,h);for(let k=0;k<26;k++){g.strokeStyle=`rgba(${110+rnd()*40},${70+rnd()*30},${30+rnd()*20},${.2+rnd()*.25})`;g.lineWidth=1+rnd()*1.5;g.beginPath();const y=rnd()*h;g.moveTo(0,y);g.bezierCurveTo(w*.3,y+rnd()*10-5,w*.7,y+rnd()*10-5,w,y+rnd()*6-3);g.stroke()}g.strokeStyle='rgba(60,32,12,.75)';g.lineWidth=5;g.strokeRect(2.5,2.5,w-5,h-5);g.strokeStyle='rgba(240,200,120,.35)';g.lineWidth=1.5;g.strokeRect(9,9,w-18,h-18)});
const plinth=add(new THREE.BoxGeometry(BX*2,.5,BZ*2),mat(0x3b2414,{roughness:.6}));plinth.position.y=TOP-.31;
const slabs=new THREE.InstancedMesh(new THREE.BoxGeometry(.95,.1,.95).translate(0,-.05,0),mat(0xffffff,{map:inlay,roughness:.38,metalness:.04}),8*rows);let si=0;
for(let y=0;y<rows;y++)for(let x=0;x<8;x++){dummy.position.set(cellX(x),TOP,cellZ(y));dummy.rotation.set(0,(rnd()-.5)*.01,0);dummy.updateMatrix();slabs.setMatrixAt(si,dummy.matrix);const c=new THREE.Color((x+y)%2?0xf2e2c6:0xc29c70);c.offsetHSL(0,0,(rnd()-.5)*.03);slabs.setColorAt(si++,c)}
slabs.castShadow=false;slabs.receiveShadow=true;root.add(slabs);
const brass=mat(0xd1a54a,{metalness:.8,roughness:.3}),dark=mat(0x2a180c,{roughness:.55}),mugMat=mat(0x8a5a2c),foam=mat(0xfdf6e3,{roughness:1});
for(const s of[-1,1]){const a=add(new THREE.BoxGeometry(BX*2+.26,.2,.24),dark);a.position.set(0,TOP-.02,s*(BZ+.02));const t=add(new THREE.BoxGeometry(BX*2+.26,.025,.05),brass,root,false);t.position.set(0,TOP+.085,s*(BZ+.1));
 const b=add(new THREE.BoxGeometry(.24,.2,BZ*2+.04),dark);b.position.set(s*(BX+.02),TOP-.02,0);const t2=add(new THREE.BoxGeometry(.05,.025,BZ*2+.2),brass,root,false);t2.position.set(s*(BX+.1),TOP+.085,0)}
{const studs=new THREE.InstancedMesh(new THREE.SphereGeometry(.035,8,6),brass,4*(rows+9));let n=0;for(let x=0;x<=8;x++)for(const s of[-1,1]){dummy.position.set(x-4,TOP+.09,s*(BZ+.02));dummy.updateMatrix();studs.setMatrixAt(n++,dummy.matrix)}for(let y=0;y<=rows;y++)for(const s of[-1,1]){dummy.position.set(s*(BX+.02),TOP+.09,y-HZ);dummy.updateMatrix();studs.setMatrixAt(n++,dummy.matrix)}studs.count=n;root.add(studs)}

// ---------- 3. Murs bas en coupe : colombages, plâtre, lambris ----------
const plaster=canvasTex(256,128,(g,w,h)=>{g.fillStyle='#e8d9b8';g.fillRect(0,0,w,h);for(let i=0;i<900;i++){g.fillStyle=`rgba(${150+rnd()*60},${120+rnd()*50},${80+rnd()*40},${.08+rnd()*.1})`;g.fillRect(rnd()*w,rnd()*h,2+rnd()*4,2+rnd()*3)}g.fillStyle='#5a3a20';g.fillRect(0,h*.62,w,h*.38);for(let x=0;x<w;x+=32){g.fillStyle='rgba(30,16,8,.5)';g.fillRect(x,h*.62,2,h*.38)}g.fillStyle='#3a2414';g.fillRect(0,h*.6,w,5)},[1,1]);
const beam=mat(0x3a2414,{roughness:.7});
function wall(x,z,len,h,ry){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;root.add(g);const t=plaster.clone();t.needsUpdate=true;t.repeat.set(len/1.6,1);const w=add(new THREE.BoxGeometry(len,h,.22),mat(0xffffff,{map:t,roughness:.9}),g);w.position.y=h/2;
 for(let k=0;k<=Math.round(len/1.6);k++){const p=add(new THREE.BoxGeometry(.14,h+.04,.28),beam,g);p.position.set(-len/2+k*len/Math.round(len/1.6),h/2,0)}const top=add(new THREE.BoxGeometry(len+.1,.12,.32),beam,g);top.position.y=h+.04;return g}
const WZ=FZ-.1,WX=FX-.1,HZW=1.2,HXW=1.45;
wall(0,-WZ,FX*2,HZW,0);wall(0,WZ,FX*2,.7,0);wall(-WX,0,FZ*2,HXW,Math.PI/2);wall(WX,0,FZ*2,HXW,Math.PI/2);

// ---------- 4. Le comptoir de Maebril, étagères, tonneaux ----------
const wood=mat(0x6a3f1f,{roughness:.6}),woodTop=mat(0x3d2110,{roughness:.32,metalness:.05}),glassMats=[0x2f7a4a,0x7a2430,0x2a4f8a,0xb07a20,0x5a2a7a].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.12,metalness:.1,transparent:true,opacity:.85}));
const CZ=-(BZ+1.12),CL=6.2;
{const dais=add(new THREE.BoxGeometry(6.4,.28,.55),mat(0x4a2c16,{roughness:.7}));dais.position.set(-.4,.14,-(BZ+1.12)-.6)}/* estrade derrière le comptoir */
{const c=add(new THREE.BoxGeometry(CL,.92,.6),wood);c.position.set(-.4,.46,CZ);const top=add(new THREE.BoxGeometry(CL+.2,.08,.78),woodTop);top.position.set(-.4,.95,CZ);
 for(let k=0;k<8;k++){const p=add(new THREE.BoxGeometry(.08,.8,.04),dark,root,false);p.position.set(-.4-CL/2+.4+k*(CL-.8)/7,.46,CZ+.31)}
 const rail=add(new THREE.CylinderGeometry(.025,.025,CL,8),brass,root,false);rail.rotation.z=Math.PI/2;rail.position.set(-.4,.16,CZ+.42);
 for(const tx of[-1.6,-1.2,-.8]){const tap=add(new THREE.CylinderGeometry(.04,.05,.32,10),brass,root,false);tap.position.set(tx,1.15,CZ-.1);const h=add(new THREE.BoxGeometry(.04,.16,.05),mat(0x1e1e1e),root,false);h.position.set(tx,1.36,CZ-.1)}
 for(let k=0;k<7;k++){const x=.2+k*.38;mug(x,.99,CZ+(k%2?.12:-.08),k%3===0)}
 for(const s of[0,1]){const sh=add(new THREE.BoxGeometry(CL-.4,.06,.32),wood);sh.position.set(-.4,.55+s*.4,-WZ+.28);for(let k=0;k<12;k++){const bm=glassMats[Math.floor(rnd()*glassMats.length)],bt=add(new THREE.CylinderGeometry(.05,.06,.26+rnd()*.12,8),bm,root,false);bt.position.set(-.4-CL/2+.5+k*(CL-1)/11+(rnd()-.5)*.08,.72+s*.4,-WZ+.28+(rnd()-.5)*.1);const nk=add(new THREE.CylinderGeometry(.018,.025,.08,6),bm,root,false);nk.position.set(bt.position.x,bt.position.y+.17,bt.position.z)}}}
function barrel(x,z,y=.3,lay=false){const g=new THREE.Group();g.position.set(x,y,z);if(lay)g.rotation.z=Math.PI/2;root.add(g);const b=add(new THREE.CylinderGeometry(.27,.27,.6,14),mat(0x7a4a24),g);b.scale.set(1,1,1);for(const yy of[-.2,.2]){const h=add(new THREE.TorusGeometry(.275,.015,4,18),mat(0x2e2e2e,{metalness:.6}),g,false);h.rotation.x=Math.PI/2;h.position.y=yy}const tap=add(new THREE.CylinderGeometry(.02,.02,.08,6),brass,g,false);tap.rotation.x=Math.PI/2;tap.position.set(0,-.12,.29);return g}
barrel(3.4,-WZ+.45);barrel(3.95,-WZ+.45);barrel(3.67,-WZ+.45,.82);barrel(6.45,-WZ+.6);barrel(6.45,-WZ+1.2);barrel(6.45,-WZ+.9,.82);

// ---------- 5. La cheminée ----------
const stoneMat=mat(0x8c8174,{roughness:.95,flatShading:true});
{const g=new THREE.Group();g.position.set(-WX+.35,0,-2.8);g.rotation.y=Math.PI/2;g.scale.setScalar(1.15);root.add(g);
 for(let i=0;i<16;i++){const s=add(new THREE.BoxGeometry(.34+rnd()*.1,.24,.36),stoneMat,g);const col=i%4,row=Math.floor(i/4);if(col===1||col===2){if(row<2)continue}s.position.set(-.55+col*.37,.12+row*.25,0)}
 const mantel=add(new THREE.BoxGeometry(1.7,.12,.5),beam,g);mantel.position.set(0,1.05,.05);const hood=add(new THREE.BoxGeometry(1.2,.6,.4),stoneMat,g);hood.position.set(0,1.42,-.02);
 const back=new THREE.Mesh(new THREE.PlaneGeometry(.72,.5),new THREE.MeshBasicMaterial({color:0x140806}));back.position.set(0,.26,-.15);g.add(back);
 for(let k=0;k<3;k++){const log=add(new THREE.CylinderGeometry(.05,.05,.55,8),mat(0x3a2414),g,false);log.rotation.z=Math.PI/2;log.rotation.y=(k-1)*.3;log.position.set(0,.07+(k===1?.07:0),-.02)}
 const flames=[];for(let k=0;k<5;k++){const f=new THREE.Mesh(new THREE.ConeGeometry(.07+rnd()*.04,.25+rnd()*.15,8),new THREE.MeshBasicMaterial({color:k%2?0xffb347:0xff6a22,transparent:true,opacity:.85}));f.position.set((k-2)*.1,.25,0);g.add(f);flames.push({f,p:rnd()*6})}
 const gl=glow(0xff8a3a,1.6,.55);gl.position.set(0,.35,.25);g.add(gl);
 for(const sx of[-.3,.3]){const c=add(new THREE.CylinderGeometry(.03,.03,.16,8),mat(0xf2e6c8),g,false);c.position.set(sx,1.19,.1);const fl=glow(0xffc46b,.22,.9);fl.position.set(sx,1.3,.1);g.add(fl)}
 updates.push((t,l,moving)=>{for(const F of flames){const k=moving?Math.sin(t*11+F.p)*.5+Math.sin(t*7.3+F.p*2)*.5:0;F.f.scale.set(1+k*.1,1+k*.25,1+k*.1)}gl.material.opacity=.5+(moving?Math.sin(t*9)*.08:0)})}

// ---------- 6. Fenêtres à croisillons (lumière du jour) et bannière du griffon ----------
const winTex=canvasTex(64,96,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#fff6d6');gr.addColorStop(1,'#cfe6ff');g.fillStyle=gr;g.fillRect(0,0,w,h);g.strokeStyle='#3a2414';g.lineWidth=4;g.strokeRect(2,2,w-4,h-4);g.lineWidth=2;for(let x=16;x<w;x+=16){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke()}for(let y=16;y<h;y+=16){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke()}});
for(const z of[-2.6,.9,3.4]){const wm=new THREE.Mesh(new THREE.PlaneGeometry(.62,.9),new THREE.MeshBasicMaterial({map:winTex}));wm.position.set(WX-.12,1.2,z);wm.rotation.y=-Math.PI/2;root.add(wm);const shaft=glow(0xfff1c8,1.3,.18);shaft.position.set(WX-.6,1.05,z);root.add(shaft)}
const griffonTex=canvasTex(128,192,(g,w,h)=>{g.fillStyle='#1f3b78';g.fillRect(0,0,w,h-28);g.beginPath();g.moveTo(0,h-28);g.lineTo(w/2,h);g.lineTo(w,h-28);g.fill();g.strokeStyle='#e8c35a';g.lineWidth=5;g.strokeRect(7,7,w-14,h-44);
 g.fillStyle='#e8c35a';g.beginPath();g.ellipse(64,92,24,30,0,0,7);g.fill();g.beginPath();g.moveTo(40,80);g.quadraticCurveTo(8,50,18,30);g.quadraticCurveTo(38,52,46,70);g.fill();g.beginPath();g.moveTo(88,80);g.quadraticCurveTo(120,50,110,30);g.quadraticCurveTo(90,52,82,70);g.fill();
 g.beginPath();g.arc(64,56,14,0,7);g.fill();g.beginPath();g.moveTo(76,54);g.lineTo(92,60);g.lineTo(76,62);g.fill();g.fillStyle='#1f3b78';g.beginPath();g.arc(68,52,2.5,0,7);g.fill();
 g.fillStyle='#e8c35a';g.font='bold 15px Georgia';g.textAlign='center';g.fillText('GRIFFON',64,142);g.fillText('DORÉ',64,158)});
for(const x of[-2.7,1.9]){const b=new THREE.Mesh(new THREE.PlaneGeometry(.55,.82),new THREE.MeshStandardMaterial({map:griffonTex,side:THREE.DoubleSide,roughness:.85}));b.position.set(x,.82,-WZ+.13);b.scale.setScalar(.75);root.add(b)}

// ---------- 7. Le panneau d'affichage magique de la guilde ----------
// Avis écrits en runes mouvantes : seuls les membres du Griffon les lisent (et selon leur rang). Sceaux au colibri bronze, argent, or.
const runeCanvas=document.createElement('canvas');runeCanvas.width=256;runeCanvas.height=256;const rc=runeCanvas.getContext('2d'),runeTex=new THREE.CanvasTexture(runeCanvas);runeTex.colorSpace=THREE.SRGBColorSpace;
const GLYPHS='ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ✶◈⟡';
function drawRunes(t){rc.fillStyle='#e9d6a8';rc.fillRect(0,0,256,256);rc.fillStyle='rgba(120,80,30,.18)';for(let i=0;i<60;i++)rc.fillRect((i*53)%256,(i*97)%256,3,2);
 rc.font='18px serif';rc.textBaseline='top';for(let row=0;row<9;row++)for(let col=0;col<11;col++){const k=(row*11+col),a=.35+.55*Math.max(0,Math.sin(t*1.7+k*.9));rc.fillStyle=`rgba(${70+row*8},${30+row*4},${110+row*6},${a})`;rc.fillText(GLYPHS[(k*7+Math.floor(t*1.3+k))%GLYPHS.length],10+col*22,20+row*24)}
 runeTex.needsUpdate=true}
drawRunes(0);
const sealTex=c=>canvasTex(64,64,(g,w,h)=>{const gr=g.createRadialGradient(32,30,4,32,32,30);gr.addColorStop(0,'#fff');gr.addColorStop(.4,c);gr.addColorStop(1,'#3a2a1a');g.fillStyle=gr;g.beginPath();g.arc(32,32,28,0,7);g.fill();g.fillStyle='rgba(30,20,10,.75)';g.beginPath();g.ellipse(30,34,9,6,-.4,0,7);g.fill();g.beginPath();g.moveTo(37,30);g.lineTo(52,22);g.lineTo(39,34);g.fill();g.beginPath();g.moveTo(26,32);g.lineTo(16,22);g.lineTo(24,36);g.fill()});
{const g=new THREE.Group();g.position.set(-5.4,0,-WZ+.16);g.rotation.y=0;root.add(g);
 const frame=add(new THREE.BoxGeometry(1.5,1,.08),beam,g);frame.position.y=1.15;const cork=add(new THREE.BoxGeometry(1.36,.86,.04),mat(0x9a6a3c,{roughness:1}),g,false);cork.position.set(0,1.15,.04);for(const sx of[-.7,.7]){const leg=add(new THREE.BoxGeometry(.08,1.2,.08),beam,g);leg.position.set(sx,.6,-.02)}
 const notes=[[-.42,1.32,-.08,'#c7843e'],[.05,1.36,.06,'#c0c4cc'],[.46,1.3,-.05,'#e8c35a'],[-.25,.95,.07,'#c7843e'],[.3,.94,-.03,'#c0c4cc']];
 const noteMats=[];for(const [x,y,r,seal] of notes){const nm=new THREE.MeshBasicMaterial({map:runeTex,transparent:true,opacity:.96});noteMats.push(nm);const n=new THREE.Mesh(new THREE.PlaneGeometry(.36,.34),nm);n.position.set(x,y,.07);n.rotation.z=r;g.add(n);
  const s=new THREE.Mesh(new THREE.CircleGeometry(.05,16),new THREE.MeshBasicMaterial({map:sealTex(seal),transparent:true}));s.position.set(x+.1,y-.11,.075);g.add(s)}
 const halo=glow(0x9b6bff,2.2,.35);halo.position.set(0,1.15,.25);g.add(halo);const crest=new THREE.Mesh(new THREE.CircleGeometry(.12,24),new THREE.MeshBasicMaterial({map:sealTex('#e8c35a'),transparent:true}));crest.position.set(0,1.72,.06);g.add(crest);
 const motes=[];for(let i=0;i<(software?4:12);i++){const m=glow(i%2?0xc9a8ff:0xffe38a,.09,.9);g.add(m);motes.push({m,p:rnd()*6,r:.5+rnd()*.35})}
 let acc=0;updates.push((t,l,moving,dt)=>{if(!moving)return;acc+=dt;if(acc>.12){acc=0;drawRunes(t)}halo.material.opacity=.28+Math.sin(t*1.6)*.1;for(const M of motes){const a=t*.6+M.p;M.m.position.set(Math.cos(a)*M.r*1.1,1.15+Math.sin(a*1.3)*.45,.12+Math.sin(a*.7)*.08)}})}

// ---------- 8. Tables rondes, tabourets, chopes, bougies, parties de dés ----------
function mug(x,y,z,full=true,parent=root){const m=add(new THREE.CylinderGeometry(.05,.045,.11,10),mugMat,parent,false);m.position.set(x,y+.055,z);const h=add(new THREE.TorusGeometry(.03,.009,5,10,Math.PI),mugMat,parent,false);h.position.set(x+.055,y+.06,z);h.rotation.z=-Math.PI/2;if(full){const f=add(new THREE.CylinderGeometry(.052,.05,.02,10),foam,parent,false);f.position.set(x,y+.115,z)}}
const pipTex={};const dieMat=(face)=>{if(pipTex[face])return pipTex[face];const t=canvasTex(64,64,(g,w,h)=>{g.fillStyle=face;g.fillRect(0,0,w,h);g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=4;g.strokeRect(2,2,w-4,h-4);g.fillStyle='#fff8e1';for(const [px,py] of[[16,16],[48,48],[32,32],[48,16],[16,48]]){g.beginPath();g.arc(px,py,5,0,7);g.fill()}});return pipTex[face]=new THREE.MeshStandardMaterial({map:t,roughness:.4})};
const ELEM=['#d8452f','#3a8fd8','#5aa84a','#8fd0ea','#9b6bff','#d7b64a'];
const miniBoard=canvasTex(128,160,(g,w,h)=>{for(let y=0;y<10;y++)for(let x=0;x<8;x++){g.fillStyle=(x+y)%2?'#efe1c2':'#b88a56';g.fillRect(x*16,y*16,16,16)}g.fillStyle='rgba(60,170,90,.55)';g.fillRect(16,128,48,16);g.fillStyle='rgba(230,120,40,.55)';g.fillRect(64,16,48,16);g.strokeStyle='#3a2414';g.lineWidth=4;g.strokeRect(0,0,w,h)});
const tableSpots=[];
function table(x,z,opts={}){const g=new THREE.Group();g.position.set(x,0,z);root.add(g);const top=add(new THREE.CylinderGeometry(.5,.5,.06,24),woodTop,g);top.position.y=.74;const rim=add(new THREE.TorusGeometry(.5,.02,5,28),wood,g,false);rim.rotation.x=Math.PI/2;rim.position.y=.74;
 const leg=add(new THREE.CylinderGeometry(.06,.08,.7,10),wood,g);leg.position.y=.37;const foot=add(new THREE.CylinderGeometry(.26,.3,.05,14),wood,g);foot.position.y=.03;
 const seats=opts.seats??3;for(let k=0;k<seats;k++){const a=k/seats*Math.PI*2+(opts.rot||0),sx=Math.cos(a)*.78,sz=Math.sin(a)*.78;const st=add(new THREE.CylinderGeometry(.17,.15,.05,12),wood,g);st.position.set(sx,.46,sz);for(let l=0;l<3;l++){const la=l/3*Math.PI*2,lg=add(new THREE.CylinderGeometry(.02,.025,.45,5),dark,g,false);lg.position.set(sx+Math.cos(la)*.1,.22,sz+Math.sin(la)*.1)}}
 if(opts.dice){const mb=new THREE.Mesh(new THREE.BoxGeometry(.4,.02,.5),new THREE.MeshStandardMaterial({map:miniBoard,roughness:.6}));mb.position.y=.785;mb.rotation.y=opts.rot||0;g.add(mb);
  for(let k=0;k<4;k++){const d=add(new THREE.BoxGeometry(.055,.055,.055),dieMat(ELEM[(k+(opts.seed||0))%ELEM.length]),g,false);d.position.set(-.3+k*.07+(k>1?.38:0),.805,(k%2?.18:-.22));d.rotation.set(rnd(),rnd()*6,rnd())}
  const cup=add(new THREE.CylinderGeometry(.06,.05,.12,12,1,true),mat(0x5a2a14,{side:THREE.DoubleSide}),g,false);cup.position.set(.32,.83,.05)}
 for(let k=0;k<(opts.mugs??2);k++){const a=(k+.5)/(opts.mugs??2)*Math.PI*2+.4;mug(Math.cos(a)*.32,.77,Math.sin(a)*.32,k%2===0,g)}
 if(opts.candle!==false){const c=add(new THREE.CylinderGeometry(.025,.025,.12,8),mat(0xf2e6c8),g,false);c.position.set(opts.dice?-.05:0,.83,opts.dice?.28:0);const fl=glow(0xffc46b,.2,.9);fl.position.set(c.position.x,.92,c.position.z);g.add(fl);updates.push((t,l,mv)=>{fl.material.opacity=.8+(mv?Math.sin(t*13+x*7)*.12:0)})}
 g.scale.setScalar(1.25);tableSpots.push({x,z});return g}
const SX=BX+1.5;
table(-SX,2.3,{dice:true,seats:3,seed:0,rot:.3});table(SX,1.2,{dice:true,seats:3,seed:2,rot:-.2});table(-SX,-.4,{seats:3,mugs:3});table(SX,-1.9,{seats:2});table(SX,3.9,{seats:3,mugs:2});table(-SX,4.6,{seats:2,mugs:1});table(SX,-4.5,{seats:3,mugs:3});table(-2.4,BZ+1.4,{seats:2,mugs:1});table(2.6,BZ+1.4,{seats:3,mugs:2});
// petits tabourets au comptoir
for(let k=0;k<4;k++){const st=add(new THREE.CylinderGeometry(.15,.13,.05,12),wood);st.position.set(-2.6+k*.9,.62,CZ+.62);const lg=add(new THREE.CylinderGeometry(.03,.05,.6,6),dark);lg.position.set(-2.6+k*.9,.3,CZ+.62)}
// appliques murales
for(const [x,z,ry] of[[-WX+.14,2.2,Math.PI/2],[-WX+.14,-4.2,Math.PI/2],[WX-.14,-1,-Math.PI/2],[-4.9,-WZ+.14,0],[4.9,-WZ+.14,0]]){const yy=ry===0?.9:1.15,s=add(new THREE.BoxGeometry(.08,.2,.08),brass,root,false);s.position.set(x,yy,z);const fl=glow(0xffc46b,.5,.6);fl.position.set(x+Math.sin(ry)*.08,yy+.15,z+Math.cos(ry)*.08);root.add(fl)}

// ---------- 9. Les habitués (modèles du jeu, pose d'attente) ----------
const regulars=[];
if(!software&&helpers.spawnFighter){const cast=[['maebril',-.4,CZ-.5,0],['pennedra',-SX+.55,2.3-.85,null,-SX,2.3],['frolgor',-SX-.65,2.3+.7,null,-SX,2.3],['sameron',SX-.75,1.2+.7,null,SX,1.2],['velmarys',SX+.7,1.2-.65,null,SX,1.2],['max',-SX+.3,-.4+1,null,-SX,-.4],['bosco',2.6+.95,BZ+1.4-.25,null,2.6,BZ+1.4],['orven',SX-.6,-4.5+.85,null,SX,-4.5],['bulbalina',-SX-.4,4.6-.9,null,-SX,4.6]];
 cast.forEach(([key,x,z,yaw,tx,tz],n)=>setTimeout(()=>helpers.spawnFighter(key,.98).then(w=>{if(!w)return;w.group.position.set(x,key==='maebril'?.3:.03,z);w.group.rotation.y=yaw??Math.atan2(tx-x,tz-z);root.add(w.group);regulars.push({w,p:n*1.7})}),500+n*700))}
updates.push((t,l,moving,dt)=>{for(const R of regulars){if(moving)R.w.update(dt)}});
// de temps en temps, un joueur lève les bras (lancer gagnant à sa table)
let nextCheer=6;updates.push((t,l,moving)=>{if(!moving||!regulars.length||t<nextCheer)return;nextCheer=t+7+rnd()*8;const R=regulars[1+Math.floor(rnd()*(regulars.length-1))]||regulars[0];R.w.attack?.()});

// ---------- 10. Poussière dans la lumière ----------
const dust=[];for(let i=0;i<(software?6:22);i++){const m=glow(0xfff1c8,.05,.5);root.add(m);dust.push({m,x:(rnd()-.5)*FX*1.6,z:(rnd()-.5)*FZ*1.6,p:rnd()*6})}
updates.push((t,l,moving)=>{for(const D of dust){const k=moving?(t*.05+D.p)%1:D.p%1;D.m.position.set(D.x+Math.sin(t*.3+D.p)*.2,.3+k*1.8,D.z);D.m.material.opacity=Math.sin(k*Math.PI)*.45}});

let last=0;
return{root,update(t,light,moving){const dt=Math.min(.1,Math.max(0,t-last));last=t;for(const u of updates)u(t,light,moving,dt)}};
}
