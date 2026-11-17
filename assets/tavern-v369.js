/* v369 — Terrain neutre « La taverne du Griffon Doré », refait d'après l'illustration de la Triade.
   La grande salle de la guilde des chasseurs de primes, chaude et bondée :
   - le griffon doré partout : bannières bleu nuit frangées d'or au griffon rampant (emblème tiré de l'illustration), blason au-dessus
     de la cheminée, enseigne pendue à l'entrée, griffons dorés sculptés sur colonnes de part et d'autre de la porte, tapis brodé ;
   - comptoir de Maebril sur son estrade, pompes à bière, rangées de chopes, étagères de bouteilles, tonneaux en perce ;
   - grande cheminée de pierre au feu ronflant, chat roux qui dort devant ;
   - estrade des ménestrels : Bulbalina et un compagnon jouent, des notes s'envolent ;
   - lustres de fer forgé aux bougies vacillantes, guirlandes de lierre et de houblon, appliques, tableau du menu à la craie ;
   - tables bondées : chopes mousseuses, poulet rôti, pain, meules de fromage, bougies ; deux tables de dés d'Hackénia où les dés roulent
     pour de vrai de temps en temps (et le gagnant lève les bras) ;
   - le panneau d'affichage magique de la guilde : avis en runes mouvantes, lisibles des seuls membres, sceaux colibri bronze/argent/or ;
   - les habitués (modèles du jeu) et une serveuse qui fait le tour de la salle, plateau de chopes en main.
   Murs bas en coupe : rien ne dépasse la pente de la caméra (≈40°), le plateau reste dégagé quel que soit le côté.
   Coordonnées réelles des cases (root.scale.z = 1/ZS appliqué par clearing-v105.js). Aucun élément n'est favorisé. */
import * as THREE from 'three';
export function createTavern(world,software=false,rows=10,helpers={}){
const root=new THREE.Group();world.add(root);root.visible=false;
let seed=2309;const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const HZ=rows/2,BX=4.3,BZ=HZ+.3,TOP=.2,FX=7.2,FZ=HZ+2.45,WZ=FZ-.1,WX=FX-.1;
const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.82,...extra});
let PARENT=null;const add=(geo,material,parent=PARENT||root,shadow=!software)=>{const m=new THREE.Mesh(geo,material);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m};
const canvasTex=(w,h,draw,rep=null)=>{const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h,c);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;if(rep)t.repeat.set(...rep);return t};
const updates=[],cellX=x=>x-3.5,cellZ=y=>y-(rows-1)/2,dummy=new THREE.Object3D();
const dotTex=canvasTex(32,32,g=>{const r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.45,'rgba(255,255,255,.5)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,32,32)});
const glow=(color,size,op=.8,parent=PARENT||root)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color,transparent:true,opacity:op,depthWrite:false,blending:THREE.AdditiveBlending}));s.scale.setScalar(size);parent.add(s);return s};
const flicker=[];const candle=(x,y,z,parent=PARENT||root,s=1)=>{const c=add(new THREE.CylinderGeometry(.022*s,.025*s,.12*s,8),mat(0xf2e6c8),parent,false);c.position.set(x,y+.06*s,z);const f=new THREE.Mesh(new THREE.ConeGeometry(.018*s,.05*s,6),new THREE.MeshBasicMaterial({color:0xffd27a}));f.position.set(x,y+.15*s,z);parent.add(f);const g=glow(0xffb85a,.26*s,.85,parent);g.position.set(x,y+.16*s,z);flicker.push({g,f,p:rnd()*6});return c};
updates.push((t,l,mv)=>{for(const F of flicker){const k=mv?Math.sin(t*12+F.p)*.5+Math.sin(t*7.7+F.p*3)*.5:0;F.g.material.opacity=.72+k*.14;F.f.scale.y=1+k*.25}});

// ---------- Matériaux communs ----------
const brass=mat(0xd1a54a,{metalness:.8,roughness:.3}),gold=mat(0xe2b24a,{metalness:.85,roughness:.28,emissive:0x3a2600,emissiveIntensity:.25}),dark=mat(0x2a180c,{roughness:.55}),iron=mat(0x2b2724,{metalness:.6,roughness:.45});
const wood=mat(0x6a3f1f,{roughness:.6}),woodTop=mat(0x3d2110,{roughness:.32,metalness:.05}),beam=mat(0x3a2414,{roughness:.7}),mugMat=mat(0x8a5a2c),foam=mat(0xfdf6e3,{roughness:1}),stoneMat=mat(0x8c8174,{roughness:.95,flatShading:true});

// ---------- L'emblème du griffon (tiré de l'illustration de la Triade) ----------
const emblemImg=new Image();emblemImg.src='assets/tavern/griffon-emblem.webp?v=369';const whenEmblem=[];emblemImg.onload=()=>whenEmblem.forEach(f=>f());
const emblemCanvas=(w,h,draw)=>{const t=canvasTex(w,h,(g,W,H)=>draw(g,W,H,false));const redo=()=>{const c=t.image;draw(c.getContext('2d'),c.width,c.height,true);t.needsUpdate=true};if(emblemImg.complete&&emblemImg.naturalWidth)redo();else whenEmblem.push(redo);return t};
const drawEmblem=(g,x,y,w)=>{if(!emblemImg.naturalWidth)return;const h=w*emblemImg.naturalHeight/emblemImg.naturalWidth;g.drawImage(emblemImg,x-w/2,y-h/2,w,h)};
const bannerTex=emblemCanvas(160,300,(g,W,H,full)=>{g.clearRect(0,0,W,H);const gr=g.createLinearGradient(0,0,W,0);gr.addColorStop(0,'#13234f');gr.addColorStop(.5,'#22397a');gr.addColorStop(1,'#13234f');g.fillStyle=gr;g.beginPath();g.moveTo(0,0);g.lineTo(W,0);g.lineTo(W,H-46);g.lineTo(W/2,H-4);g.lineTo(0,H-46);g.closePath();g.fill();
 g.strokeStyle='rgba(255,255,255,.05)';for(let y=0;y<H;y+=3){g.beginPath();g.moveTo(0,y);g.lineTo(W,y);g.stroke()}
 g.strokeStyle='#e8c35a';g.lineWidth=6;g.beginPath();g.moveTo(10,6);g.lineTo(W-10,6);g.lineTo(W-10,H-52);g.lineTo(W/2,H-16);g.lineTo(10,H-52);g.closePath();g.stroke();g.lineWidth=2;g.strokeStyle='#b88a2a';g.stroke();
 g.fillStyle='#e8c35a';g.fillRect(0,0,W,10);for(let x=6;x<W;x+=12){g.beginPath();g.arc(x,10,4,0,Math.PI);g.fill()}
 if(full)drawEmblem(g,W/2,H*.43,W*.66)});
const shieldTex=emblemCanvas(200,230,(g,W,H,full)=>{g.clearRect(0,0,W,H);g.beginPath();g.moveTo(8,8);g.lineTo(W-8,8);g.lineTo(W-8,H*.55);g.quadraticCurveTo(W-8,H*.85,W/2,H-6);g.quadraticCurveTo(8,H*.85,8,H*.55);g.closePath();const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#2a4a96');gr.addColorStop(1,'#14275a');g.fillStyle=gr;g.fill();g.lineWidth=10;g.strokeStyle='#e8c35a';g.stroke();if(full)drawEmblem(g,W/2,H*.47,W*.62)});

// ---------- 1. Plancher, tapis brodé du griffon ----------
const planks=canvasTex(512,512,(g,w,h)=>{const cols=['#6b4426','#5e3b20','#74492a','#64401f','#6f4625'];for(let y=0;y<h;y+=32){let x=-(y/32%3)*60;while(x<w){const len=120+rnd()*140;g.fillStyle=cols[Math.floor(rnd()*cols.length)];g.fillRect(x,y,len,32);g.strokeStyle='rgba(30,16,8,.55)';g.lineWidth=2;g.strokeRect(x,y,len,32);
  for(let k=0;k<5;k++){g.strokeStyle=`rgba(40,22,10,${.12+rnd()*.12})`;g.lineWidth=1;g.beginPath();const yy=y+4+rnd()*24;g.moveTo(x,yy);g.bezierCurveTo(x+len*.3,yy+rnd()*4-2,x+len*.6,yy+rnd()*4-2,x+len,yy);g.stroke()}g.fillStyle='rgba(20,12,6,.6)';g.fillRect(x+6,y+14,3,3);g.fillRect(x+len-9,y+14,3,3);x+=len}}},[5,5*FZ/FX]);
const floor=add(new THREE.PlaneGeometry(FX*2,FZ*2),mat(0xffffff,{map:planks,bumpMap:planks,bumpScale:.02,roughness:.7}),root,false);floor.rotation.x=-Math.PI/2;floor.position.y=.01;
const RW=BX*2+2.6,RD=BZ*2+2.3,ppu=40;/* tapis : champ rouge visible autour du plateau, liserés d'or fins, griffons dans les coins et au milieu des côtés */
const rugTex=emblemCanvas(Math.round(RW*ppu),Math.round(RD*ppu),(g,w,h,full)=>{g.fillStyle='#6e1a1c';g.fillRect(0,0,w,h);for(let i=0;i<4000;i++){g.fillStyle=`rgba(${rnd()<.5?255:0},${rnd()<.5?200:0},0,${rnd()*.05})`;g.fillRect(rnd()*w,rnd()*h,2,2)}
 g.strokeStyle='#1d3270';g.lineWidth=14;g.strokeRect(7,7,w-14,h-14);g.strokeStyle='#d9a441';g.lineWidth=3;g.strokeRect(16,16,w-32,h-32);g.lineWidth=2;g.strokeRect(24,24,w-48,h-48);
 g.fillStyle='#d9a441';for(let x=34;x<w-34;x+=26){for(const y of[36,h-36]){g.beginPath();g.moveTo(x,y-3);g.lineTo(x+3,y);g.lineTo(x,y+3);g.lineTo(x-3,y);g.fill()}}
 for(let y=34;y<h-34;y+=26){for(const x of[36,w-36]){g.beginPath();g.moveTo(x,y-3);g.lineTo(x+3,y);g.lineTo(x,y+3);g.lineTo(x-3,y);g.fill()}}
 const m=1.3*ppu/2;if(full)for(const [cx,cy] of[[m,m],[w-m,m],[m,h-m],[w-m,h-m],[w/2,m*.95],[w/2,h-m*.95],[m*.95,h/2],[w-m*.95,h/2]])drawEmblem(g,cx,cy,ppu*.85)});
const rug=add(new THREE.PlaneGeometry(RW,RD),mat(0xffffff,{map:rugTex,roughness:1}),root,false);rug.rotation.x=-Math.PI/2;rug.position.y=.02;

// ---------- 2. Le plateau : socle de noyer, cases marquetées, clous de laiton ----------
const inlay=canvasTex(128,128,(g,w,h)=>{g.fillStyle='#c79a5e';g.fillRect(0,0,w,h);for(let k=0;k<26;k++){g.strokeStyle=`rgba(${110+rnd()*40},${70+rnd()*30},${30+rnd()*20},${.2+rnd()*.25})`;g.lineWidth=1+rnd()*1.5;g.beginPath();const y=rnd()*h;g.moveTo(0,y);g.bezierCurveTo(w*.3,y+rnd()*10-5,w*.7,y+rnd()*10-5,w,y+rnd()*6-3);g.stroke()}g.strokeStyle='rgba(60,32,12,.75)';g.lineWidth=5;g.strokeRect(2.5,2.5,w-5,h-5);g.strokeStyle='rgba(240,200,120,.35)';g.lineWidth=1.5;g.strokeRect(9,9,w-18,h-18)});
const plinth=add(new THREE.BoxGeometry(BX*2,.5,BZ*2),mat(0x3b2414,{roughness:.6}));plinth.position.y=TOP-.31;
const slabs=new THREE.InstancedMesh(new THREE.BoxGeometry(.95,.1,.95).translate(0,-.05,0),mat(0xffffff,{map:inlay,roughness:.38,metalness:.04}),8*rows);let si=0;
for(let y=0;y<rows;y++)for(let x=0;x<8;x++){dummy.position.set(cellX(x),TOP,cellZ(y));dummy.rotation.set(0,(rnd()-.5)*.01,0);dummy.updateMatrix();slabs.setMatrixAt(si,dummy.matrix);const c=new THREE.Color((x+y)%2?0xf2e2c6:0xc29c70);c.offsetHSL(0,0,(rnd()-.5)*.03);slabs.setColorAt(si++,c)}
slabs.castShadow=false;slabs.receiveShadow=true;root.add(slabs);
for(const s of[-1,1]){const a=add(new THREE.BoxGeometry(BX*2+.26,.2,.24),dark);a.position.set(0,TOP-.02,s*(BZ+.02));const t=add(new THREE.BoxGeometry(BX*2+.26,.025,.05),brass,root,false);t.position.set(0,TOP+.085,s*(BZ+.1));
 const b=add(new THREE.BoxGeometry(.24,.2,BZ*2+.04),dark);b.position.set(s*(BX+.02),TOP-.02,0);const t2=add(new THREE.BoxGeometry(.05,.025,BZ*2+.2),brass,root,false);t2.position.set(s*(BX+.1),TOP+.085,0)}
{const studs=new THREE.InstancedMesh(new THREE.SphereGeometry(.035,8,6),brass,4*(rows+9));let n=0;for(let x=0;x<=8;x++)for(const s of[-1,1]){dummy.position.set(x-4,TOP+.09,s*(BZ+.02));dummy.updateMatrix();studs.setMatrixAt(n++,dummy.matrix)}for(let y=0;y<=rows;y++)for(const s of[-1,1]){dummy.position.set(s*(BX+.02),TOP+.09,y-HZ);dummy.updateMatrix();studs.setMatrixAt(n++,dummy.matrix)}studs.count=n;root.add(studs)}

// ---------- 3. Murs bas en coupe : soubassement de pierre, colombages, plâtre ----------
const plaster=canvasTex(256,128,(g,w,h)=>{g.fillStyle='#e8d9b8';g.fillRect(0,0,w,h);for(let i=0;i<900;i++){g.fillStyle=`rgba(${150+rnd()*60},${120+rnd()*50},${80+rnd()*40},${.08+rnd()*.1})`;g.fillRect(rnd()*w,rnd()*h,2+rnd()*4,2+rnd()*3)}
 g.fillStyle='#6d6358';g.fillRect(0,h*.68,w,h*.32);for(let y=h*.68;y<h;y+=10)for(let x=(y/10%2)*14;x<w;x+=28){g.fillStyle=`rgb(${110+rnd()*30},${100+rnd()*26},${88+rnd()*22})`;g.fillRect(x+1,y+1,26,8)}g.fillStyle='#3a2414';g.fillRect(0,h*.66,w,5)},[1,1]);
function wall(x,z,len,h,ry){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;root.add(g);const t=plaster.clone();t.needsUpdate=true;t.repeat.set(len/1.6,1);const w=add(new THREE.BoxGeometry(len,h,.22),mat(0xffffff,{map:t,roughness:.9}),g);w.position.y=h/2;
 const n=Math.round(len/1.6);for(let k=0;k<=n;k++){const p=add(new THREE.BoxGeometry(.14,h+.04,.28),beam,g);p.position.set(-len/2+k*len/n,h/2,0)}
 for(let k=0;k<n;k++){if(h<1)break;const cx=-len/2+(k+.5)*len/n,cw=len/n;for(const sd of[-1,1]){const xb=add(new THREE.BoxGeometry(Math.hypot(cw,h*.4)*.9,.07,.26),beam,g,false);xb.position.set(cx,h*.55,0);xb.rotation.z=sd*Math.atan2(h*.4,cw)}}
 const top=add(new THREE.BoxGeometry(len+.1,.12,.32),beam,g);top.position.y=h+.04;return g}
const HZW=1.2,HXW=1.45;
wall(0,-WZ,FX*2,HZW,0);wall(-WX,0,FZ*2,HXW,Math.PI/2);wall(WX,0,FZ*2,HXW,Math.PI/2);
// façade d'entrée basse, avec la porte au milieu
for(const s of[-1,1]){const seg=add(new THREE.BoxGeometry(FX-1,.7,.22),mat(0xffffff,{map:plaster,roughness:.9}));seg.position.set(s*(FX/2+.5),.35,WZ);const cap=add(new THREE.BoxGeometry(FX-1,.1,.3),beam);cap.position.set(s*(FX/2+.5),.74,WZ)}
// guirlandes de lierre et de houblon le long des murs
{const leafGeo=new THREE.PlaneGeometry(.12,.08),leafMat=new THREE.MeshStandardMaterial({color:0x4f7d2e,side:THREE.DoubleSide,roughness:.9}),N=software?120:420,leaves=new THREE.InstancedMesh(leafGeo,leafMat,N);let n=0;
 const runs=[[-FX+.4,-WZ+.15,FX-.4,-WZ+.15,HZW],[-WX+.15,-FZ+.4,-WX+.15,FZ-.4,HXW],[WX-.15,-FZ+.4,WX-.15,FZ-.4,HXW]];
 for(const [x0,z0,x1,z1,h] of runs){const L=Math.hypot(x1-x0,z1-z0),steps=Math.floor(L/.09);for(let i=0;i<steps&&n<N;i++){const k=i/steps,sag=Math.sin(k*L/1.6*Math.PI)**2*.22;dummy.position.set(x0+(x1-x0)*k,h-.04-sag+(rnd()-.5)*.06,z0+(z1-z0)*k);dummy.rotation.set(rnd()*6,rnd()*6,rnd()*6);dummy.scale.setScalar(.8+rnd()*.6);dummy.updateMatrix();leaves.setMatrixAt(n,dummy.matrix);leaves.setColorAt(n++,new THREE.Color(rnd()<.18?0xa8c25a:rnd()<.5?0x4f7d2e:0x3a6a24))}}
 leaves.count=n;root.add(leaves)}

// ---------- 4. Le comptoir de Maebril ----------
const glassMats=[0x2f7a4a,0x7a2430,0x2a4f8a,0xb07a20,0x5a2a7a].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.12,metalness:.1,transparent:true,opacity:.85}));
const CZ=-(BZ+1.12),CL=6.2,CX=-.4,SB=.72,bz=z=>-WZ+SB*(z+WZ);/* v372 — le comptoir et ses étagères à l'échelle des personnages (×0,72, ancrés au mur du fond) */
const barG=new THREE.Group();barG.position.set(0,0,-WZ*(1-SB));barG.scale.setScalar(SB);root.add(barG);PARENT=barG;
function mug(x,y,z,full=true,parent=PARENT||root){const m=add(new THREE.CylinderGeometry(.05,.045,.11,10),mugMat,parent,false);m.position.set(x,y+.055,z);const h=add(new THREE.TorusGeometry(.03,.009,5,10,Math.PI),mugMat,parent,false);h.position.set(x+.055,y+.06,z);h.rotation.z=-Math.PI/2;for(const yy of[.025,.085]){const r=add(new THREE.TorusGeometry(.05,.004,4,12),iron,parent,false);r.rotation.x=Math.PI/2;r.position.set(x,y+yy,z)}if(full){const f=add(new THREE.CylinderGeometry(.056,.05,.03,10),foam,parent,false);f.position.set(x,y+.12,z)}}
{const dais=add(new THREE.BoxGeometry(CL+.2,.28,.55),mat(0x4a2c16,{roughness:.7}));dais.position.set(CX,.14,CZ-.6);
 const c=add(new THREE.BoxGeometry(CL,.92,.6),wood);c.position.set(CX,.46,CZ);const top=add(new THREE.BoxGeometry(CL+.2,.08,.78),woodTop);top.position.set(CX,.95,CZ);
 for(let k=0;k<8;k++){const p=add(new THREE.BoxGeometry(.08,.8,.04),dark,root,false);p.position.set(CX-CL/2+.4+k*(CL-.8)/7,.46,CZ+.31)}
 const panel=new THREE.Mesh(new THREE.PlaneGeometry(.7,.62),new THREE.MeshStandardMaterial({map:shieldTex,transparent:true,roughness:.6}));panel.position.set(CX,.5,CZ+.315);root.add(panel);
 const rail=add(new THREE.CylinderGeometry(.025,.025,CL,8),brass,root,false);rail.rotation.z=Math.PI/2;rail.position.set(CX,.16,CZ+.42);
 for(const tx of[-1.9,-1.5,-1.1]){const tap=add(new THREE.CylinderGeometry(.04,.05,.32,10),brass,root,false);tap.position.set(tx,1.15,CZ-.1);const h=add(new THREE.BoxGeometry(.04,.16,.05),mat(0x7a1d1d),root,false);h.position.set(tx,1.36,CZ-.1)}
 for(let k=0;k<9;k++)mug(.1+k*.3,.99,CZ+(k%2?.14:-.06),k%3!==1);
 for(const x of[-3.1,-2.5])candle(x,.99,CZ+.1);
 for(const s of[0,1]){const sh=add(new THREE.BoxGeometry(CL-.4,.06,.32),wood);sh.position.set(CX,.55+s*.4,-WZ+.28);for(let k=0;k<12;k++){const bm=glassMats[Math.floor(rnd()*glassMats.length)],bt=add(new THREE.CylinderGeometry(.05,.06,.26+rnd()*.12,8),bm,root,false);bt.position.set(CX-CL/2+.5+k*(CL-1)/11+(rnd()-.5)*.08,.72+s*.4,-WZ+.28+(rnd()-.5)*.1);const nk=add(new THREE.CylinderGeometry(.018,.025,.08,6),bm,root,false);nk.position.set(bt.position.x,bt.position.y+.17,bt.position.z)}}}
PARENT=null;
function barrel(x,z,y=.3,lay=false,s=.72){const g=new THREE.Group();g.position.set(x,y*s,z);g.scale.setScalar(s);if(lay)g.rotation.z=Math.PI/2;root.add(g);const b=add(new THREE.CylinderGeometry(.27,.27,.6,14),mat(0x7a4a24),g);for(const yy of[-.2,.2]){const h=add(new THREE.TorusGeometry(.275,.015,4,18),iron,g,false);h.rotation.x=Math.PI/2;h.position.y=yy}const tap=add(new THREE.CylinderGeometry(.02,.02,.08,6),brass,g,false);tap.rotation.x=Math.PI/2;tap.position.set(0,-.12,.29);return g}
barrel(3.4,-WZ+.45);barrel(3.95,-WZ+.45);barrel(3.67,-WZ+.45,.9);barrel(6.45,-WZ+.6);barrel(6.45,-WZ+1.2);barrel(6.45,-WZ+.9,.9);barrel(-WX+.5,4.6,.3,true);

// ---------- 5. La grande cheminée, le blason du griffon, le chat ----------
{const g=new THREE.Group();g.position.set(-WX+.3,0,-1.8);g.rotation.y=Math.PI/2;g.scale.setScalar(.9);root.add(g);
 for(let i=0;i<20;i++){const col=i%5,row=Math.floor(i/5);if(col>=1&&col<=3&&row<2)continue;const s=add(new THREE.BoxGeometry(.3+rnd()*.08,.24,.38),stoneMat,g);s.position.set(-.62+col*.31,.12+row*.25,0)}
 const mantel=add(new THREE.BoxGeometry(1.8,.12,.52),beam,g);mantel.position.set(0,1.04,.06);
 const back=new THREE.Mesh(new THREE.PlaneGeometry(.9,.5),new THREE.MeshBasicMaterial({color:0x120604}));back.position.set(0,.26,-.16);g.add(back);
 for(let k=0;k<4;k++){const log=add(new THREE.CylinderGeometry(.055,.055,.6,8),mat(0x3a2414),g,false);log.rotation.z=Math.PI/2;log.rotation.y=(k-1.5)*.25;log.position.set(0,.07+(k%2?.08:0),-.02)}
 const flames=[];for(let k=0;k<8;k++){const f=new THREE.Mesh(new THREE.ConeGeometry(.07+rnd()*.05,.3+rnd()*.22,8),new THREE.MeshBasicMaterial({color:[0xffd27a,0xffa13a,0xff6a22][k%3],transparent:true,opacity:.88}));f.position.set((k-3.5)*.09,.27,(rnd()-.5)*.08);g.add(f);flames.push({f,p:rnd()*6})}
 const gl=glow(0xff8a3a,2.2,.6,g);gl.position.set(0,.4,.3);const gl2=glow(0xffc46b,.9,.7,g);gl2.position.set(0,.3,.05);
 const sparks=[];for(let k=0;k<(software?3:10);k++){const s=glow(0xffb347,.06,.9,g);sparks.push({s,p:rnd(),x:(rnd()-.5)*.5})}
 const shield=new THREE.Mesh(new THREE.PlaneGeometry(.62,.72),new THREE.MeshStandardMaterial({map:shieldTex,transparent:true,roughness:.5,metalness:.2}));shield.position.set(0,1.42,.12);g.add(shield);
 for(const sx of[-.55,.55])candle(sx,1.1,.12,g,1.1);
 for(const sx of[-.75,.75]){const pot=add(new THREE.CylinderGeometry(.06,.05,.1,10),mat(0x9a4a2a),g,false);pot.position.set(sx,1.15,.12)}
 updates.push((t,l,moving)=>{for(const F of flames){const k=moving?Math.sin(t*11+F.p)*.5+Math.sin(t*7.3+F.p*2)*.5:0;F.f.scale.set(1+k*.12,1+k*.3,1+k*.12)}gl.material.opacity=.55+(moving?Math.sin(t*9)*.1:0);
  for(const S of sparks){const k=moving?(t*.5+S.p)%1:S.p;S.s.position.set(S.x+Math.sin(k*9)*.05,.3+k*.9,.05);S.s.material.opacity=(1-k)*.9}})
 // le chat roux endormi devant l'âtre
 const cat=new THREE.Group();cat.position.set(.15,0,.75);cat.rotation.y=.6;g.add(cat);const fur=mat(0xd2782e,{roughness:.95});const body=add(new THREE.SphereGeometry(.13,12,9),fur,cat);body.scale.set(1.4,.55,1);body.position.y=.07;const head=add(new THREE.SphereGeometry(.075,10,8),fur,cat);head.position.set(.17,.07,.04);
 for(const ez of[-.035,.035]){const ear=add(new THREE.ConeGeometry(.025,.05,4),fur,cat,false);ear.position.set(.19,.14,.04+ez)}const tail=add(new THREE.TorusGeometry(.12,.025,6,16,Math.PI*1.2),fur,cat,false);tail.rotation.x=Math.PI/2;tail.position.set(-.05,.03,.02);
 const rugc=add(new THREE.CylinderGeometry(.32,.32,.015,20),mat(0x8e2a1f),cat,false);rugc.position.y=.008;updates.push((t,l,mv)=>{body.scale.y=.55+(mv?Math.sin(t*1.6)*.03:0)})}

// ---------- 6. Bannières, fenêtres, menu, appliques ----------
const banner=(x,y,z,ry,s=1)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(.5*s,.94*s,1,6),new THREE.MeshStandardMaterial({map:bannerTex,transparent:true,side:THREE.DoubleSide,roughness:.85}));m.position.set(x,y,z);m.rotation.y=ry;root.add(m);const rod=add(new THREE.CylinderGeometry(.014,.014,.6*s,6),brass,root,false);rod.rotation.z=Math.PI/2;rod.rotation.y=ry;rod.position.set(x,y+.47*s,z);for(const e of[-1,1]){const k=add(new THREE.SphereGeometry(.025,8,6),brass,root,false);k.position.set(x+Math.cos(ry)*e*.3*s,y+.47*s,z-Math.sin(ry)*e*.3*s)}return m};
banner(-4.6,.66,-WZ+.14,0,.95);banner(2.4,.66,-WZ+.14,0,.95);banner(-WX+.14,.78,2.6,Math.PI/2);banner(-WX+.14,.78,-4.8,Math.PI/2);banner(WX-.14,.78,-3.2,-Math.PI/2);banner(WX-.14,.78,2.2,-Math.PI/2);
const winTex=canvasTex(64,96,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#fff6d6');gr.addColorStop(1,'#ffd9a0');g.fillStyle=gr;g.fillRect(0,0,w,h);g.strokeStyle='#3a2414';g.lineWidth=4;g.strokeRect(2,2,w-4,h-4);g.lineWidth=2;for(let x=16;x<w;x+=16){g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke()}for(let y=16;y<h;y+=16){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke()}});
for(const z of[.35,4.6]){const wm=new THREE.Mesh(new THREE.PlaneGeometry(.5,.62),new THREE.MeshBasicMaterial({map:winTex}));wm.position.set(WX-.12,.95,z);wm.rotation.y=-Math.PI/2;root.add(wm);glow(0xffe9b8,1,.22).position.set(WX-.5,.9,z)}
{const menu=new THREE.TextureLoader().load('assets/tavern/menu-board.webp?v=369');menu.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(.62,.7),new THREE.MeshStandardMaterial({map:menu,roughness:.9}));m.position.set(-WX+.14,.75,.4);m.rotation.y=Math.PI/2;root.add(m);const fr=add(new THREE.BoxGeometry(.04,.76,.68),beam,root,false);fr.position.set(-WX+.12,.75,.4)}
for(const [x,z,ry] of[[-WX+.14,4.2,Math.PI/2],[WX-.14,.9,-Math.PI/2],[WX-.14,-5.2,-Math.PI/2],[-5.9,-WZ+.14,0],[4.9,-WZ+.14,0]]){const y=ry===0?.95:1.18,s=add(new THREE.BoxGeometry(.08,.16,.08),brass,root,false);s.position.set(x,y,z);candle(x+Math.sin(ry)*.08,y+.05,z+Math.cos(ry)*.08)}

// ---------- 7. Lustres de fer forgé ----------
function chandelier(x,z,y=1.3){const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(.8);root.add(g);const ring=add(new THREE.TorusGeometry(.42,.022,6,28),iron,g,false);ring.rotation.x=Math.PI/2;const inner=add(new THREE.TorusGeometry(.2,.016,6,20),iron,g,false);inner.rotation.x=Math.PI/2;inner.position.y=.12;
 for(let k=0;k<3;k++){const a=k/3*Math.PI*2,ch=add(new THREE.CylinderGeometry(.006,.006,1.1,4),iron,g,false);ch.position.set(Math.cos(a)*.2,.55,Math.sin(a)*.2);ch.rotation.set(Math.sin(a)*.18,0,-Math.cos(a)*.18)}
 for(let k=0;k<6;k++){const a=k/6*Math.PI*2;candle(Math.cos(a)*.42,.01,Math.sin(a)*.42,g,1.2)}const gl=glow(0xffc46b,1.6,.32,g);gl.position.y=.1;updates.push((t,l,mv)=>{g.rotation.y=mv?Math.sin(t*.4+x)*.05:0})}
const SX=BX+1.5;
chandelier(-SX,2.3);chandelier(SX,1.2);chandelier(-SX,-2.1,1.25);chandelier(SX,-3.3,1.25);

// ---------- 8. L'entrée : enseigne du griffon et griffons dorés sculptés ----------
{const post=add(new THREE.BoxGeometry(.12,1.25,.12),beam);post.position.set(-1.05,.62,WZ);const post2=post.clone();post2.position.x=1.05;root.add(post2);const lint=add(new THREE.BoxGeometry(2.3,.14,.16),beam);lint.position.set(0,1.24,WZ);
 const arm=add(new THREE.BoxGeometry(.06,.06,.6),iron,root,false);arm.position.set(0,1.12,WZ-.3);const sign=new THREE.Group();sign.position.set(0,.84,WZ-.55);root.add(sign);
 const board=add(new THREE.BoxGeometry(.62,.46,.04),beam,sign);const face=new THREE.Mesh(new THREE.PlaneGeometry(.56,.4),new THREE.MeshStandardMaterial({map:emblemCanvas(220,160,(g,W,H,full)=>{g.fillStyle='#1d3270';g.fillRect(0,0,W,H);g.strokeStyle='#e8c35a';g.lineWidth=8;g.strokeRect(4,4,W-8,H-8);if(full)drawEmblem(g,W*.3,H*.5,W*.34);g.fillStyle='#e8c35a';g.font='bold 22px Georgia';g.textAlign='center';g.fillText('AU',W*.72,H*.36);g.fillText('GRIFFON',W*.72,H*.56);g.fillText('DORÉ',W*.72,H*.76)}),roughness:.6}));
 face.position.z=.022;sign.add(face);const back=face.clone();back.rotation.y=Math.PI;back.position.z=-.022;sign.add(back);for(const sx of[-.22,.22]){const ch=add(new THREE.CylinderGeometry(.006,.006,.16,4),iron,sign,false);ch.position.set(sx,.3,0)}
 updates.push((t,l,mv)=>{sign.rotation.x=mv?Math.sin(t*1.1)*.06:0})}
function griffonStatue(x,z,ry){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;root.add(g);const ped=add(new THREE.CylinderGeometry(.22,.26,.55,12),stoneMat,g);ped.position.y=.27;const cap=add(new THREE.CylinderGeometry(.27,.25,.06,12),stoneMat,g);cap.position.y=.57;
 const s=new THREE.Group();s.position.y=.6;g.add(s);const torso=add(new THREE.SphereGeometry(.16,14,10),gold,s);torso.scale.set(1.5,.85,.9);torso.position.set(-.04,.2,0);
 for(const [lx,lz] of[[.12,.07],[.12,-.07],[-.18,.08],[-.18,-.08]]){const leg=add(new THREE.CylinderGeometry(.035,.03,.18,8),gold,s,false);leg.position.set(lx,.09,lz)}
 const chest=add(new THREE.SphereGeometry(.12,12,9),gold,s);chest.position.set(.15,.3,0);const head=add(new THREE.SphereGeometry(.085,12,9),gold,s);head.position.set(.24,.46,0);const beak=add(new THREE.ConeGeometry(.035,.12,8),gold,s,false);beak.rotation.z=-Math.PI/2+.5;beak.position.set(.33,.43,0);
 for(const ez of[-.04,.04]){const tuft=add(new THREE.ConeGeometry(.02,.08,5),gold,s,false);tuft.position.set(.2,.55,ez);tuft.rotation.z=.4}
 for(const sd of[-1,1]){const wing=new THREE.Group();wing.position.set(.02,.32,sd*.1);wing.rotation.set(sd*-.35,0,.55);s.add(wing);for(let k=0;k<6;k++){const f=add(new THREE.BoxGeometry(.05,.34-k*.035,.012),gold,wing,false);f.position.set(-k*.05,.17-k*.015,sd*k*.012);f.rotation.z=k*.12}}
 const tail=add(new THREE.TorusGeometry(.13,.018,6,14,Math.PI),gold,s,false);tail.position.set(-.3,.22,0);tail.rotation.z=Math.PI*.6;const tip=add(new THREE.SphereGeometry(.04,8,6),gold,s,false);tip.position.set(-.38,.36,0)}
griffonStatue(-1.75,WZ-.15,-Math.PI/2+.4);griffonStatue(1.75,WZ-.15,-Math.PI/2-.4+Math.PI);

// ---------- 9. L'estrade des ménestrels ----------
const notes=[];
{const sx=-5.9,sz=-WZ+1.05;const st=add(new THREE.BoxGeometry(1.8,.36,1.3),mat(0x5a3519,{roughness:.7}));st.position.set(sx,.18,sz);const edge=add(new THREE.BoxGeometry(1.84,.06,1.34),beam);edge.position.set(sx,.37,sz);
 for(let k=0;k<5;k++){const p=add(new THREE.CylinderGeometry(.02,.02,.3,6),wood,root,false);p.position.set(sx-.8+k*.4,.52,sz+.66)}const rail=add(new THREE.BoxGeometry(1.7,.04,.04),beam,root,false);rail.position.set(sx,.68,sz+.66);
 const drum=add(new THREE.CylinderGeometry(.13,.13,.18,14),mat(0xc29a6a),root,false);drum.position.set(sx+.6,.47,sz-.35);const lute=new THREE.Group();lute.position.set(sx-.65,.62,sz-.4);lute.rotation.z=.6;root.add(lute);const lb=add(new THREE.SphereGeometry(.09,10,8),mat(0xa0682c),lute,false);lb.scale.set(1,.5,1.3);const ln=add(new THREE.BoxGeometry(.03,.02,.3),dark,lute,false);ln.position.z=-.2;
 const noteTex=canvasTex(64,64,(g,w,h)=>{g.fillStyle='#ffe28a';g.font='bold 48px serif';g.textAlign='center';g.textBaseline='middle';g.fillText('♪',w/2,h/2)});const noteTex2=canvasTex(64,64,(g,w,h)=>{g.fillStyle='#ffe28a';g.font='bold 48px serif';g.textAlign='center';g.textBaseline='middle';g.fillText('♫',w/2,h/2)});
 for(let k=0;k<(software?3:7);k++){const n=new THREE.Sprite(new THREE.SpriteMaterial({map:k%2?noteTex:noteTex2,transparent:true,depthWrite:false,opacity:0}));n.scale.setScalar(.18);root.add(n);notes.push({n,p:k/7,x:sx+(rnd()-.5)*1.2,z:sz+(rnd()-.5)*.6})}
 updates.push((t,l,mv)=>{for(const N of notes){const k=mv?(t*.18+N.p)%1:N.p;N.n.position.set(N.x+Math.sin(k*8+N.p*9)*.15,.9+k*.9,N.z);N.n.material.opacity=Math.sin(k*Math.PI)*.95;N.n.material.rotation=Math.sin(k*6)*.3}})}

// ---------- 10. Le panneau d'affichage magique de la guilde ----------
const runeCanvas=document.createElement('canvas');runeCanvas.width=256;runeCanvas.height=256;const rc=runeCanvas.getContext('2d'),runeTex=new THREE.CanvasTexture(runeCanvas);runeTex.colorSpace=THREE.SRGBColorSpace;
const GLYPHS='ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ✶◈⟡';
function drawRunes(t){rc.fillStyle='#e9d6a8';rc.fillRect(0,0,256,256);rc.fillStyle='rgba(120,80,30,.18)';for(let i=0;i<60;i++)rc.fillRect((i*53)%256,(i*97)%256,3,2);
 rc.font='18px serif';rc.textBaseline='top';for(let row=0;row<9;row++)for(let col=0;col<11;col++){const k=(row*11+col),a=.35+.55*Math.max(0,Math.sin(t*1.7+k*.9));rc.fillStyle=`rgba(${70+row*8},${30+row*4},${110+row*6},${a})`;rc.fillText(GLYPHS[(k*7+Math.floor(t*1.3+k))%GLYPHS.length],10+col*22,20+row*24)}runeTex.needsUpdate=true}
drawRunes(0);
const sealTex=c=>canvasTex(64,64,(g,w,h)=>{const gr=g.createRadialGradient(32,30,4,32,32,30);gr.addColorStop(0,'#fff');gr.addColorStop(.4,c);gr.addColorStop(1,'#3a2a1a');g.fillStyle=gr;g.beginPath();g.arc(32,32,28,0,7);g.fill();g.fillStyle='rgba(30,20,10,.75)';g.beginPath();g.ellipse(30,34,9,6,-.4,0,7);g.fill();g.beginPath();g.moveTo(37,30);g.lineTo(52,22);g.lineTo(39,34);g.fill();g.beginPath();g.moveTo(26,32);g.lineTo(16,22);g.lineTo(24,36);g.fill()});
{const g=new THREE.Group();g.position.set(WX-.16,0,-1.4);g.rotation.y=-Math.PI/2;root.add(g);
 const frame=add(new THREE.BoxGeometry(1.5,.95,.08),beam,g);frame.position.y=.9;const cork=add(new THREE.BoxGeometry(1.36,.8,.04),mat(0x9a6a3c,{roughness:1}),g,false);cork.position.set(0,.9,.04);
 const notesP=[[-.42,1.05,-.08,'#c7843e'],[.05,1.08,.06,'#c0c4cc'],[.46,1.03,-.05,'#e8c35a'],[-.25,.72,.07,'#c7843e'],[.3,.72,-.03,'#c0c4cc']];
 for(const [x,y,r,seal] of notesP){const n=new THREE.Mesh(new THREE.PlaneGeometry(.34,.32),new THREE.MeshBasicMaterial({map:runeTex,transparent:true,opacity:.96}));n.position.set(x,y,.07);n.rotation.z=r;g.add(n);const s=new THREE.Mesh(new THREE.CircleGeometry(.05,16),new THREE.MeshBasicMaterial({map:sealTex(seal),transparent:true}));s.position.set(x+.1,y-.11,.075);g.add(s)}
 const halo=glow(0x9b6bff,2.1,.35,g);halo.position.set(0,.9,.25);const crest=new THREE.Mesh(new THREE.CircleGeometry(.1,24),new THREE.MeshBasicMaterial({map:sealTex('#e8c35a'),transparent:true}));crest.position.set(0,1.38,.06);g.add(crest);
 const motes=[];for(let i=0;i<(software?4:12);i++){const m=glow(i%2?0xc9a8ff:0xffe38a,.09,.9,g);motes.push({m,p:rnd()*6,r:.5+rnd()*.35})}
 let acc=0;updates.push((t,l,moving,dt)=>{if(!moving)return;acc+=dt;if(acc>.12){acc=0;drawRunes(t)}halo.material.opacity=.28+Math.sin(t*1.6)*.1;for(const M of motes){const a=t*.6+M.p;M.m.position.set(Math.cos(a)*M.r*1.1,.9+Math.sin(a*1.3)*.42,.12+Math.sin(a*.7)*.08)}})}

// ---------- 11. Tables bondées, festin, parties de dés ----------
const pipTex={};const dieMat=face=>{if(pipTex[face])return pipTex[face];const t=canvasTex(64,64,(g,w,h)=>{g.fillStyle=face;g.fillRect(0,0,w,h);g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=4;g.strokeRect(2,2,w-4,h-4);g.fillStyle='#fff8e1';for(const [px,py] of[[16,16],[48,48],[32,32],[48,16],[16,48]]){g.beginPath();g.arc(px,py,5,0,7);g.fill()}});return pipTex[face]=new THREE.MeshStandardMaterial({map:t,roughness:.4})};
const ELEM=['#d8452f','#3a8fd8','#5aa84a','#8fd0ea','#9b6bff','#d7b64a'];
const miniBoard=canvasTex(128,160,(g,w,h)=>{for(let y=0;y<10;y++)for(let x=0;x<8;x++){g.fillStyle=(x+y)%2?'#efe1c2':'#b88a56';g.fillRect(x*16,y*16,16,16)}g.fillStyle='rgba(60,170,90,.55)';g.fillRect(16,128,48,16);g.fillStyle='rgba(230,120,40,.55)';g.fillRect(64,16,48,16);g.strokeStyle='#3a2414';g.lineWidth=4;g.strokeRect(0,0,w,h)});
const roast=mat(0xa0531c,{roughness:.55}),bread=mat(0xc9893f),cheese=mat(0xf0c43a,{roughness:.6}),plate=mat(0xd9d2c4,{roughness:.4});
function feast(g){const p=add(new THREE.CylinderGeometry(.16,.14,.02,16),plate,g,false);p.position.set(-.12,.78,.1);const ch=add(new THREE.SphereGeometry(.08,10,8),roast,g,false);ch.scale.set(1.3,.75,1);ch.position.set(-.12,.83,.1);for(const s of[-1,1]){const leg=add(new THREE.SphereGeometry(.035,8,6),roast,g,false);leg.scale.set(1.4,.8,.8);leg.position.set(-.05,.81,.1+s*.07);const bone=add(new THREE.CylinderGeometry(.008,.008,.06,5),mat(0xf2ead8),g,false);bone.rotation.z=Math.PI/2;bone.position.set(.01,.81,.1+s*.08)}
 const br=add(new THREE.CapsuleGeometry(.04,.12,4,8),bread,g,false);br.rotation.z=Math.PI/2;br.position.set(.15,.81,-.12);const wheel=add(new THREE.CylinderGeometry(.08,.08,.06,16,1,false,0,Math.PI*1.6),cheese,g,false);wheel.position.set(.05,.8,.22)}
const diceTables=[];
function table(x,z,opts={}){const g=new THREE.Group();g.position.set(x,0,z);root.add(g);const top=add(new THREE.CylinderGeometry(.5,.5,.06,24),woodTop,g);top.position.y=.74;const rim=add(new THREE.TorusGeometry(.5,.02,5,28),wood,g,false);rim.rotation.x=Math.PI/2;rim.position.y=.74;
 const leg=add(new THREE.CylinderGeometry(.06,.08,.7,10),wood,g);leg.position.y=.37;const foot=add(new THREE.CylinderGeometry(.26,.3,.05,14),wood,g);foot.position.y=.03;
 const seats=opts.seats??3;for(let k=0;k<seats;k++){const a=k/seats*Math.PI*2+(opts.rot||0),sx=Math.cos(a)*.78,sz=Math.sin(a)*.78;const st=add(new THREE.CylinderGeometry(.17,.15,.05,12),wood,g);st.position.set(sx,.46,sz);for(let l=0;l<3;l++){const la=l/3*Math.PI*2,lg=add(new THREE.CylinderGeometry(.02,.025,.45,5),dark,g,false);lg.position.set(sx+Math.cos(la)*.1,.22,sz+Math.sin(la)*.1)}}
 if(opts.dice){const mb=new THREE.Mesh(new THREE.BoxGeometry(.4,.02,.5),new THREE.MeshStandardMaterial({map:miniBoard,roughness:.6}));mb.position.y=.785;mb.rotation.y=opts.rot||0;g.add(mb);const dice=[];
  for(let k=0;k<3;k++){const d=add(new THREE.BoxGeometry(.06,.06,.06),dieMat(ELEM[(k+(opts.seed||0))%ELEM.length]),g,false);const hx=-.32+k*.06,hz=k%2?.22:-.22;d.position.set(hx,.805,hz);d.rotation.set(rnd(),rnd()*6,rnd());dice.push({d,hx,hz,t0:-9})}
  const cup=add(new THREE.CylinderGeometry(.06,.05,.12,12,1,true),mat(0x5a2a14,{side:THREE.DoubleSide}),g,false);cup.position.set(.32,.83,.05);diceTables.push({g,dice,x,z})}
 else if(opts.feast)feast(g);
 for(let k=0;k<(opts.mugs??2);k++){const a=(k+.5)/(opts.mugs??2)*Math.PI*2+.4;mug(Math.cos(a)*.34,.77,Math.sin(a)*.34,k%3!==2,g)}
 if(opts.candle!==false)candle(opts.dice?-.05:0,.77,opts.dice?.3:0,g);
 g.scale.setScalar(.82);return g}
table(-SX,2.3,{dice:true,seats:3,seed:0,rot:.3,mugs:2});table(SX,1.2,{dice:true,seats:3,seed:2,rot:-.2,mugs:2});table(-SX,.15,{seats:3,mugs:3,feast:true});table(SX,-1.9,{seats:2,feast:true,mugs:2});table(SX,3.9,{seats:3,mugs:3,feast:true});table(-SX,4.6,{seats:2,mugs:2});table(SX,-4.6,{seats:3,mugs:3,feast:true});table(-2.5,BZ+1.4,{seats:2,mugs:2,feast:true});table(2.6,BZ+1.4,{seats:3,mugs:3});
for(let k=0;k<4;k++){const st=add(new THREE.CylinderGeometry(.13,.11,.04,12),wood);st.position.set(-1.9+k*.65,.44,bz(CZ+.3)+.3);const lg=add(new THREE.CylinderGeometry(.025,.04,.42,6),dark);lg.position.set(-1.9+k*.65,.21,bz(CZ+.3)+.3)}
// les dés roulent pour de vrai, de temps en temps
let nextRoll=3;updates.push((t,l,mv)=>{if(mv&&t>nextRoll&&diceTables.length){nextRoll=t+4+rnd()*5;const T=diceTables[Math.floor(rnd()*diceTables.length)];for(const D of T.dice)D.t0=t+rnd()*.15;T.cheerAt=t+1.1}
 for(const T of diceTables){for(const D of T.dice){const k=(t-D.t0)/1.1;if(k<0||k>1)continue;const arc=Math.sin(k*Math.PI)*.12*(1-k*.5);D.d.position.set(D.hx+k*.18,.805+arc,D.hz*(1-k*.4));D.d.rotation.x+=.35*(1-k);D.d.rotation.z+=.28*(1-k)}
  if(T.cheerAt&&t>T.cheerAt){T.cheerAt=0;const near=regulars.filter(R=>Math.hypot(R.x-T.x,R.z-T.z)<1.6);near[Math.floor(rnd()*near.length)]?.w.attack?.()}}});

// ---------- 12. Les habitués, les ménestrels, la serveuse ----------
const regulars=[];
if(!software&&helpers.spawnFighter){const cast=[['maebril',CX*SB,bz(CZ-.55),0,null,null,.2],['bulbalina',-6.2,-WZ+1.0,null,0,0,.36],['ven',-5.55,-WZ+1.15,null,0,0,.36],['pennedra',-SX+.55,2.3-.85,null,-SX,2.3],['frolgor',-SX-.65,2.3+.7,null,-SX,2.3],['sameron',SX-.75,1.2+.7,null,SX,1.2],['velmarys',SX+.7,1.2-.65,null,SX,1.2],['max',-SX+.3,.15+1,null,-SX,.15],['bosco',2.6+.95,BZ+1.4-.25,null,2.6,BZ+1.4],['orven',SX-.6,-4.6+.85,null,SX,-4.6],['hilam',SX+.75,3.9-.6,null,SX,3.9],['zackarie',-2.5-.85,BZ+1.4+.2,null,-2.5,BZ+1.4],['mineur',2.6-.9,BZ+1.4+.3,null,2.6,BZ+1.4],['myconide',SX+.8,-1.9+.5,null,SX,-1.9],['soryan',-SX+.75,4.6+.55,null,-SX,4.6],['hydrelithe',SX-.85,-4.6-.35,null,SX,-4.6],['mineur',-SX-.75,.15-.55,null,-SX,.15]];
 cast.forEach(([key,x,z,yaw,tx,tz,y=.03],n)=>setTimeout(()=>helpers.spawnFighter(key,1.06).then(w=>{if(!w)return;w.group.position.set(x,y,z);w.group.rotation.y=yaw??Math.atan2(tx-x,tz-z);root.add(w.group);regulars.push({w,x,z})}),400+n*450))}
updates.push((t,l,moving,dt)=>{if(moving)for(const R of regulars)R.w.update(dt)});
// la serveuse fait le tour de la salle, son plateau de chopes en main
const LX=BX+.62,LZ0=-(BZ+.45),LZ1=BZ+.6,loop=[[-LX,LZ0],[LX,LZ0],[LX,LZ1],[-LX,LZ1]],segLen=loop.map((p,i)=>{const q=loop[(i+1)%4];return Math.hypot(q[0]-p[0],q[1]-p[1])}),total=segLen.reduce((a,b)=>a+b,0);
function onLoop(d){d=((d%total)+total)%total;let i=0;while(d>segLen[i]){d-=segLen[i];i++}const p=loop[i],q=loop[(i+1)%4],k=d/segLen[i];return{x:p[0]+(q[0]-p[0])*k,z:p[1]+(q[1]-p[1])*k,yaw:Math.atan2(q[0]-p[0],q[1]-p[1])}}
let waiter=null,wd=0,wyaw=0;
if(!software&&helpers.spawnWalker)setTimeout(()=>helpers.spawnWalker('gliska',1.0).then(w=>{if(!w)return;root.add(w.group);const tray=new THREE.Group();tray.position.set(0,.56,.2);w.group.add(tray);const tp=add(new THREE.CylinderGeometry(.16,.16,.015,16),brass,tray,false);for(let k=0;k<4;k++){const a=k/4*Math.PI*2;mug(Math.cos(a)*.08,.008,Math.sin(a)*.08,true,tray)}waiter=w}),2600);
updates.push((t,l,moving,dt)=>{if(!waiter)return;if(moving){wd+=.42*dt;waiter.update(dt)}const p=onLoop(wd);let dy=p.yaw-wyaw;dy=Math.atan2(Math.sin(dy),Math.cos(dy));wyaw+=dy*Math.min(1,dt*6+(moving?0:1));waiter.group.position.set(p.x,.03,p.z);waiter.group.rotation.y=wyaw});

// ---------- 13. Poussière dorée dans la lumière ----------
const dust=[];for(let i=0;i<(software?6:24);i++){const m=glow(0xfff1c8,.05,.5);dust.push({m,x:(rnd()-.5)*FX*1.6,z:(rnd()-.5)*FZ*1.6,p:rnd()*6})}
updates.push((t,l,moving)=>{for(const D of dust){const k=moving?(t*.05+D.p)%1:D.p%1;D.m.position.set(D.x+Math.sin(t*.3+D.p)*.2,.3+k*1.6,D.z);D.m.material.opacity=Math.sin(k*Math.PI)*.45}});

let last=0;
return{root,update(t,light,moving){const dt=Math.min(.1,Math.max(0,t-last));last=t;for(const u of updates)u(t,light,moving,dt)}};
}
