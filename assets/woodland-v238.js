// v238 — Le Bois tendre, en plus vivant : sous-bois (fougères, champignons, buissons à baies, roseaux),
// rivière animée (rochers mouillés, écume, reflets, feuilles qui dérivent) et petite faune (papillons, libellules).
// Tout est ajouté au groupe « forest » de clearing-v105.js (coordonnées du décor, étirées en z par ZS),
// et reste hors des cases du damier pour ne jamais gêner la lecture des tuiles.
import * as THREE from 'three';

export function createWoodland({forest,river,height,waterHeight,rand,software,crownShapes,leafMats}){
 const root=new THREE.Group();root.name='woodland';forest.add(root);
 const onBoard=(x,z,m=.25)=>Math.abs(x)<4+m&&Math.abs(z)<5+m;
 const inRiver=(x,z,m=0)=>Math.abs(z-river(x))<.95+m;
 const time={value:0},amount={value:1};
 // Balancement léger des plantes : seul le haut bouge, comme l'herbe.
 const sway=(material,amp)=>{material.onBeforeCompile=shader=>{shader.uniforms.uT=time;shader.uniforms.uA=amount;shader.vertexShader='uniform float uT; uniform float uA;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloat sw=sin(uT*1.3+instanceMatrix[3].x*1.7+instanceMatrix[3].z*1.1);transformed.x+=sw*position.y*position.y*'+amp.toFixed(3)+'*uA;transformed.z+=cos(uT*1.1+instanceMatrix[3].z*1.3)*position.y*position.y*'+(amp*.5).toFixed(3)+'*uA;')};material.customProgramCacheKey=()=>'hk-sway-'+amp;return material};
 const dummy=new THREE.Object3D();
 const spots=[];const freeSpot=(x,z,r)=>{for(const s of spots)if(Math.hypot(s[0]-x,s[1]-z)<s[2]+r)return false;spots.push([x,z,r]);return true};
 const perimeter=(tries=40)=>{for(let i=0;i<tries;i++){const x=rand()*13.2-6.6,z=rand()*13.6-6.8;if(!onBoard(x,z,.35)&&!inRiver(x,z,.05))return[x,z]}return[6,6]};

 // ── Fougères : frondes recourbées, instanciées (un seul appel de rendu).
 const frond=new THREE.BufferGeometry(),fp=[],fc=[],seg=9,base=new THREE.Color(0x2f5a2c),tip=new THREE.Color(0x8fb35a);
 const stem=u=>new THREE.Vector3(0,Math.sin(u*Math.PI*.78)*.42,u*.95);
 for(let i=0;i<seg;i++){const u0=i/seg,u1=(i+1)/seg,a=stem(u0),b=stem(u1),w=.2*Math.sin(Math.PI*Math.min(1,u0*1.1+.08))*(1-.25*u0);
  for(const s of[-1,1]){const side=new THREE.Vector3(s*w,a.y-.04-u0*.05,(a.z+b.z)/2+.05);fp.push(a.x,a.y,a.z,side.x,side.y,side.z,b.x,b.y,b.z);const c0=base.clone().lerp(tip,u0),c1=base.clone().lerp(tip,Math.min(1,u0+.25)),c2=base.clone().lerp(tip,u1);fc.push(c0.r,c0.g,c0.b,c1.r,c1.g,c1.b,c2.r,c2.g,c2.b)}}
 frond.setAttribute('position',new THREE.Float32BufferAttribute(fp,3));frond.setAttribute('color',new THREE.Float32BufferAttribute(fc,3));frond.computeVertexNormals();
 const fernMat=sway(new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,side:THREE.DoubleSide,roughness:.85}),.18);
 const fernCount=software?14:30,frondsPer=7,ferns=new THREE.InstancedMesh(frond,fernMat,fernCount*frondsPer);let fi=0;
 const fernSpots=[[-5.2,-5.6],[5.3,-6.1],[-6.1,-.9],[6.2,-1.6],[-5.0,5.9],[5.9,5.6],[-6.4,2.4],[6.3,2.2],[-4.6,-3.2],[4.7,-2.4],[-1.4,-6.5],[1.3,6.6],[-3.6,6.4],[3.9,-6.6],[-6.5,-3.6],[6.5,-4.2]];
 for(let n=0;n<fernCount;n++){let [x,z]=n<fernSpots.length?fernSpots[n]:perimeter();x+=(rand()-.5)*.4;z+=(rand()-.5)*.4;if(onBoard(x,z,.35)||inRiver(x,z,.1)||!freeSpot(x,z,.32)){[x,z]=perimeter();spots.push([x,z,.3])}
  const s=.55+rand()*.45,y=height(x,z);for(let j=0;j<frondsPer;j++){dummy.position.set(x,y,z);dummy.rotation.set(0,j/frondsPer*Math.PI*2+rand()*.5,0);const k=s*(.75+rand()*.35);dummy.scale.set(k,k*(.85+rand()*.3),k);dummy.updateMatrix();ferns.setMatrixAt(fi++,dummy.matrix)}}
 ferns.count=fi;ferns.castShadow=!software;ferns.receiveShadow=true;root.add(ferns);

 // ── Champignons : chapeaux rouges à pois et petits bolets bruns au pied des arbres.
 const capGeo=new THREE.SphereGeometry(1,12,7,0,Math.PI*2,0,Math.PI/2),stemGeo=new THREE.CylinderGeometry(.75,1,1,8),dotGeo=new THREE.SphereGeometry(1,5,3);
 const shroomCount=software?12:26,caps=new THREE.InstancedMesh(capGeo,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.45}),shroomCount),stems=new THREE.InstancedMesh(stemGeo,new THREE.MeshStandardMaterial({color:0xefe6cf,roughness:.8}),shroomCount),dots=new THREE.InstancedMesh(dotGeo,new THREE.MeshStandardMaterial({color:0xfff8ea,roughness:.7}),shroomCount*4);
 const clusters=[[-5.5,-4.9],[5.7,-5.3],[-5.6,4.3],[5.8,3.9],[-5.9,-2.8],[2.9,-6.4],[-2.6,-6.1]];let si=0,di=0;
 for(const [cx,cz] of clusters){const n=si<shroomCount?3+Math.floor(rand()*2):0;for(let j=0;j<n&&si<shroomCount;j++){const a=rand()*Math.PI*2,r=.32+rand()*.3,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r;if(onBoard(x,z,.2)||inRiver(x,z))continue;const y=height(x,z),red=rand()>.45,s=(red?.075:.06)+rand()*.035,h=s*(1.3+rand()*.9);
  dummy.rotation.set((rand()-.5)*.25,0,(rand()-.5)*.25);dummy.position.set(x,y+h/2,z);dummy.scale.set(s*.35,h,s*.35);dummy.updateMatrix();stems.setMatrixAt(si,dummy.matrix);
  dummy.position.set(x,y+h*.95,z);dummy.scale.set(s,s*(red?.62:.72),s);dummy.updateMatrix();caps.setMatrixAt(si,dummy.matrix);caps.setColorAt(si,new THREE.Color(red?0xc23a2b:0x8a5a35).offsetHSL(0,0,(rand()-.5)*.06));
  if(red)for(let k=0;k<4&&di<dots.count;k++){const b=k/4*Math.PI*2+rand(),e=.35+rand()*.35;dummy.position.set(x+Math.cos(b)*s*e*.95,y+h*.95+s*.62*Math.sqrt(1-e*e)*.98,z+Math.sin(b)*s*e*.95);dummy.scale.setScalar(s*.14);dummy.updateMatrix();dots.setMatrixAt(di++,dummy.matrix)}
  si++}}
 caps.count=stems.count=si;dots.count=di;for(const m of[caps,stems,dots]){m.castShadow=!software;m.receiveShadow=true;root.add(m)}

 // ── Buissons à baies, en bordure.
 const berryMat=new THREE.MeshStandardMaterial({color:0xb02a46,roughness:.35,metalness:.05}),berryGeo=new THREE.SphereGeometry(.035,6,4);
 const bushSpots=software?[[-6.2,-5.6],[6.2,-.4],[-6.1,6.0],[4.6,6.4]]:[[-6.2,-5.6],[6.2,-.4],[-6.1,6.0],[4.6,6.4],[-4.9,-6.5],[6.4,-6.3],[-6.6,1.2],[1.8,-6.7],[-1.8,6.7]];
 for(const [bx,bz] of bushSpots){if(inRiver(bx,bz,.1))continue;const g=new THREE.Group();g.position.set(bx,height(bx,bz),bz);root.add(g);const s=.32+rand()*.16;
  for(let j=0;j<4;j++){const m=new THREE.Mesh(crownShapes[j%crownShapes.length],leafMats[Math.floor(rand()*leafMats.length)]);const a=j*1.9+rand();m.position.set(Math.cos(a)*s*.55,s*(.55+(j===3?.35:0)),Math.sin(a)*s*.5);m.scale.setScalar(s*(.75+rand()*.3));m.castShadow=!software;m.receiveShadow=true;g.add(m)}
  for(let k=0;k<(software?3:7);k++){const b=new THREE.Mesh(berryGeo,berryMat),a=rand()*Math.PI*2;b.position.set(Math.cos(a)*s*.95,s*(.45+rand()*.55),Math.sin(a)*s*.9);g.add(b)}}

 // ── Roseaux et massettes le long des berges, hors damier.
 const reedGeo=new THREE.CylinderGeometry(.011,.02,1,5);reedGeo.translate(0,.5,0);const headGeo=new THREE.CapsuleGeometry(.032,.13,3,7);
 const reedN=software?36:80,reeds=new THREE.InstancedMesh(reedGeo,sway(new THREE.MeshStandardMaterial({color:0x86a654,roughness:.75}),.12),reedN),heads=new THREE.InstancedMesh(headGeo,new THREE.MeshStandardMaterial({color:0x6b4528,roughness:.9}),reedN);let ri=0,hi=0;const headInfo=[];
 for(let i=0;i<reedN*3&&ri<reedN;i++){const x=(rand()>.5?1:-1)*(4.45+rand()*2.3),side=rand()>.5?1:-1,z=river(x)+side*(.8+rand()*.3);if(onBoard(x,z,.3))continue;const h=.45+rand()*.5,y=height(x,z);const ry=rand()*6;dummy.position.set(x,y-.02,z);dummy.rotation.set(0,ry,0);dummy.scale.set(1,h,1);dummy.updateMatrix();reeds.setMatrixAt(ri++,dummy.matrix);
  if(rand()>.5&&hi<reedN){dummy.position.set(x,y+h*.9,z);dummy.rotation.set(0,0,0);dummy.scale.setScalar(1);dummy.updateMatrix();heads.setMatrixAt(hi,dummy.matrix);headInfo.push({i:hi,x,y:y-.02+h*.9,z,ry});hi++}}
 reeds.count=ri;heads.count=hi;reeds.receiveShadow=heads.receiveShadow=true;root.add(reeds,heads);

 // ── Rochers mouillés dans le lit, avec écume animée et sillage en aval.
 const wet=new THREE.MeshPhysicalMaterial({color:0x8b928a,roughness:.32,clearcoat:.6,clearcoatRoughness:.3,flatShading:true});
 const foamTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,10,32,32,32);r.addColorStop(0,'rgba(255,255,255,0)');r.addColorStop(.5,'rgba(255,255,255,1)');r.addColorStop(.72,'rgba(255,255,255,.6)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t})();
 const wakeTex=(()=>{const c=document.createElement('canvas');c.width=128;c.height=32;const g=c.getContext('2d');for(let i=0;i<5;i++){g.strokeStyle='rgba(255,255,255,'+(.55-i*.09)+')';g.lineWidth=2.4-i*.3;g.beginPath();g.moveTo(4,16);g.quadraticCurveTo(64,16-(6+i*2),124,16-(9+i*2.5));g.moveTo(4,16);g.quadraticCurveTo(64,16+(6+i*2),124,16+(9+i*2.5));g.stroke()}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t})();
 const stoneSpots=[[-6.3,.15],[-5.6,-.3],[-4.7,.25],[5.0,.2],[5.8,-.25],[6.4,.3],[-2.1,.32],[2.6,-.3]],foams=[];
 for(const [x,lane] of stoneSpots){const z=river(x)+lane,s=.12+rand()*.1,geo=new THREE.IcosahedronGeometry(1,1);const p=geo.attributes.position;for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)*(1+(rand()-.5)*.25),p.getY(i)*(1+(rand()-.5)*.2),p.getZ(i)*(1+(rand()-.5)*.25));geo.computeVertexNormals();
  const m=new THREE.Mesh(geo,wet);const inside=onBoard(x,z,0);m.position.set(x,inside?-.07:-.06,z);m.scale.set(s*1.25,inside?s*.35:s*.75,s);m.rotation.y=rand()*6;m.castShadow=!software&&!inside;m.receiveShadow=true;root.add(m);
  const ring=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:foamTex,transparent:true,depthWrite:false,opacity:.7,color:0xf4fbf6}));ring.rotation.x=-Math.PI/2;ring.position.set(x,-.03,z);ring.renderOrder=2;root.add(ring);
  const dir=x<0?-1:1,wake=new THREE.Mesh(new THREE.PlaneGeometry(1,.3),new THREE.MeshBasicMaterial({map:wakeTex,transparent:true,depthWrite:false,opacity:.55,color:0xeaf7f1}));wake.rotation.set(-Math.PI/2,0,dir<0?Math.PI:0);wake.position.set(x+dir*(s+.42),-.032,z);wake.scale.set(.9,s*5,1);wake.renderOrder=2;root.add(wake);
  foams.push({ring,wake,x,z,s,p:rand()*6})}

 // ── Reflets de soleil qui scintillent sur l'eau.
 const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=32;const g=c.getContext('2d'),r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.3,'rgba(255,248,214,.7)');r.addColorStop(1,'rgba(255,240,200,0)');g.fillStyle=r;g.fillRect(0,0,32,32);return new THREE.CanvasTexture(c)})();
 const sparkles=[];for(let i=0;i<(software?0:28);i++){const x=rand()*13.6-6.8,z=river(x)+(rand()-.5)*1.1,sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xfff6dc,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));sp.position.set(x,0,z);sp.renderOrder=3;root.add(sp);sparkles.push({sp,x,z,p:rand()*7,v:1.2+rand()*1.6,s:.07+rand()*.07})}

 // ── Feuilles qui dérivent au fil de l'eau (vers les cascades, comme les rides).
 const leafShape=new THREE.Shape();leafShape.moveTo(0,-.07);leafShape.quadraticCurveTo(.05,0,0,.07);leafShape.quadraticCurveTo(-.05,0,0,-.07);const leafGeo=new THREE.ShapeGeometry(leafShape,4);leafGeo.rotateX(-Math.PI/2);
 const leafCols=[0xd99a3a,0xc2602f,0x9fb04a,0xe0b955],drift=[];for(let i=0;i<(software?3:8);i++){const m=new THREE.Mesh(leafGeo,new THREE.MeshStandardMaterial({color:leafCols[i%4],roughness:.7,side:THREE.DoubleSide}));m.renderOrder=2;root.add(m);drift.push({m,o:rand()*7,lane:(rand()-.5)*.8,spin:(rand()-.5)*1.4,dir:i%2?1:-1,v:.22+rand()*.12})}

 // ── Papillons : ailes peintes qui battent, trajectoires lentes autour des fleurs.
 const wingTex=(c1,c2)=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.translate(4,32);const gr=g.createLinearGradient(0,0,58,0);gr.addColorStop(0,c2);gr.addColorStop(.55,c1);gr.addColorStop(1,c1);g.fillStyle=gr;g.strokeStyle='#2a1d17';g.lineWidth=3;g.beginPath();g.moveTo(0,0);g.bezierCurveTo(14,-34,56,-34,56,-10);g.bezierCurveTo(56,0,40,4,30,2);g.bezierCurveTo(44,10,46,28,26,28);g.bezierCurveTo(12,28,4,12,0,0);g.fill();g.stroke();g.fillStyle='rgba(255,255,255,.85)';for(const [x,y,r] of[[48,-14,3],[41,-22,2.4],[34,18,2.2]]){g.beginPath();g.arc(x,y,r,0,7);g.fill()}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t};
 const wingGeo=new THREE.PlaneGeometry(.17,.17);wingGeo.translate(.085,0,0);wingGeo.rotateX(-Math.PI/2);
 const palettes=[['#f08a24','#5a2a0e'],['#5fa8e8','#1f3e7a'],['#f6e27a','#c9a43a'],['#e7a6d8','#7d3c80'],['#ffffff','#a9b6c6']],flutter=[];
 const bodyGeo=new THREE.CapsuleGeometry(.012,.07,2,5);bodyGeo.rotateX(Math.PI/2);const bodyMat=new THREE.MeshStandardMaterial({color:0x2b211c,roughness:.6});
 const haunts=[[-5.1,-3.5],[5.1,-2.7],[-5.1,3.4],[5.2,4.6],[.2,-6.2],[-.4,6.3]];
 for(let i=0;i<(software?2:5);i++){const pal=palettes[i%palettes.length],mat=new THREE.MeshStandardMaterial({map:wingTex(pal[0],pal[1]),transparent:true,alphaTest:.4,side:THREE.DoubleSide,roughness:.7}),g=new THREE.Group(),l=new THREE.Group(),r=new THREE.Group();
  const wl=new THREE.Mesh(wingGeo,mat),wr=new THREE.Mesh(wingGeo,mat);wr.scale.x=-1;l.add(wl);r.add(wr);g.add(l,r,new THREE.Mesh(bodyGeo,bodyMat));g.scale.setScalar(1.7);root.add(g);
  const h=haunts[i%haunts.length];flutter.push({g,l,r,cx:h[0],cz:h[1],ax:.7+rand()*.6,az:.6+rand()*.5,f:.18+rand()*.12,p:rand()*7,y:.7+rand()*.5})}

 // ── Libellules au-dessus de la rivière : vol stationnaire puis petits élans.
 const dragon=[],dWing=new THREE.PlaneGeometry(.2,.045);dWing.translate(.1,0,0);dWing.rotateX(-Math.PI/2);const dWingMat=new THREE.MeshPhysicalMaterial({color:0xdff3ff,transparent:true,opacity:.42,roughness:.1,metalness:.1,side:THREE.DoubleSide,depthWrite:false,iridescence:1,iridescenceIOR:1.4});
 const dBody=new THREE.CapsuleGeometry(.011,.2,2,5);dBody.rotateZ(Math.PI/2);
 for(let i=0;i<(software?1:2);i++){const g=new THREE.Group(),body=new THREE.Mesh(dBody,new THREE.MeshStandardMaterial({color:i?0x2aa38d:0x2f6fd0,metalness:.45,roughness:.3})),wings=[];g.add(body);for(const off of[.03,-.02])for(const s of[1,-1]){const w=new THREE.Mesh(dWing,dWingMat);w.position.set(off,.012,0);w.scale.z=1;w.rotation.y=s>0?0:Math.PI;g.add(w);wings.push(w)}root.add(g);dragon.push({g,wings,side:i?1:-1,p:rand()*9})}

 const smooth=k=>k*k*(3-2*k);
 function update(t,moving){time.value=t;amount.value=moving?1:0;
  for(const f of foams){const k=moving?Math.sin(t*2.4+f.p):0;f.ring.scale.setScalar(f.s*(3.1+k*.35));f.ring.material.opacity=.8+k*.15;f.ring.position.y=waterHeight(f.x,f.z,t)+.012;f.wake.material.opacity=.7+(moving?Math.sin(t*3.1+f.p)*.12:0);f.wake.position.y=f.ring.position.y-.002}
  for(const s of sparkles){const k=moving?Math.max(0,Math.sin(t*s.v+s.p)):.3,tw=Math.pow(k,6);s.sp.material.opacity=tw*.9;s.sp.scale.setScalar(s.s*(.6+tw));s.sp.position.y=waterHeight(s.x,s.z,t)+.03}
  for(const d of drift){const u=moving?((t*d.v+d.o)%7):d.o,x=d.dir*Math.min(7.02,u),z=river(x)+d.lane+Math.sin(u*1.7+d.o)*.06;d.m.position.set(x,waterHeight(x,z,t)+.006,z);d.m.rotation.y=d.o+u*d.spin;d.m.visible=u<6.95}
  for(const b of flutter){const tt=t*b.f*2*Math.PI+b.p,x=b.cx+Math.sin(tt)*b.ax+Math.sin(tt*2.3)*.18,z=b.cz+Math.sin(tt*.8+1.3)*b.az,y=b.y+Math.sin(tt*3.1)*.12+(moving?Math.abs(Math.sin(t*9+b.p))*.03:0);const nx=b.cx+Math.sin(tt+.05)*b.ax+Math.sin((tt+.05)*2.3)*.18,nz=b.cz+Math.sin((tt+.05)*.8+1.3)*b.az;b.g.position.set(x,y,z);b.g.rotation.y=Math.atan2(nx-x,nz-z)-Math.PI/2;const flap=moving?Math.sin(t*16+b.p)*1.05:.6;b.l.rotation.x=0;b.l.rotation.z=flap;b.r.rotation.z=-flap}
  for(const d of dragon){const cyc=moving?(t*.28+d.p)%1:0,seg=Math.floor(((moving?t*.28:0)+d.p))%4,hop=smooth(Math.min(1,Math.max(0,(cyc-.72)/.28))),spots=[5.2,6.1,4.7,5.8],a=spots[seg]*d.side,b=spots[(seg+1)%4]*d.side,x=THREE.MathUtils.lerp(a,b,hop),z=river(x)+Math.sin(seg*2.1+d.p)*.35,y=.42+Math.sin(t*2.1+d.p)*.03+Math.sin(hop*Math.PI)*.16;d.g.position.set(x,y,z);d.g.rotation.y=hop>0&&hop<1?(b>a?0:Math.PI):Math.sin(t*.7+d.p)*.6;const fl=moving?Math.sin(t*55+d.p)*.5:.15;d.wings.forEach((w,i)=>{w.rotation.x=(i%2?-1:1)*fl})}
  if(moving||!update.still){update.still=!moving;for(const hd of headInfo){const sw=moving?Math.sin(t*1.3+hd.x*1.7+hd.z*1.1)*.12*.81:0,cz=moving?Math.cos(t*1.1+hd.z*1.3)*.06*.81:0,c=Math.cos(hd.ry),s=Math.sin(hd.ry);dummy.position.set(hd.x+sw*c+cz*s,hd.y,hd.z-sw*s+cz*c);dummy.rotation.set(0,0,0);dummy.scale.setScalar(1);dummy.updateMatrix();heads.setMatrixAt(hd.i,dummy.matrix)}heads.instanceMatrix.needsUpdate=true}
 }
 update(0,false);
 return{root,update};
}
