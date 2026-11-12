/* v252 — Roue des éléments, à droite du plateau, dans la scène 3D.
   Les six dés v2 (modèles 3D) tournent doucement sur un anneau d'or ; des flèches lumineuses vont du plus fort vers sa proie
   (Eau › Foudre › Vent › Terre › Glace › Feu › Eau) et des étincelles y circulent dans le sens de la domination.
   Elle est rendue dans une seconde passe (scène à part, tampon de profondeur vidé) : le décor ne la masque jamais ; ses modèles ne sont chargés qu'à son approche,
   et elle fait toujours face à la caméra. On la découvre en déplaçant la vue vers la droite ; rien ne s'ajoute à l'interface.
   Si un dé élémentaire est sélectionné dans la main, son élément, sa proie et son prédateur s'illuminent. */
import * as THREE from 'three';
export const WHEEL_ORDER=['eau','foudre','vent','terre','glace','feu'];
export const WHEEL_NAMES={eau:'Eau',foudre:'Foudre',vent:'Vent',terre:'Terre',glace:'Glace',feu:'Feu'};
const COLORS={eau:'#4fb0ff',foudre:'#c78dff',vent:'#5dff86',terre:'#f0a548',glace:'#86f2ff',feu:'#ff5b3a'};
const FILES={eau:'Dé eau v.2.glb',foudre:'Dé foudre v.2.glb',vent:'Dé vent v.2.glb',terre:'Dé terre v.2.glb',glace:'Dé glace V.2.glb',feu:'Dé Feu v.2.glb'};
const R=2.35;// rayon de l'anneau (unités de la scène)
function textTexture(lines,{w=512,h=128,font='600 54px Georgia,serif',color='#f6ecd2',stroke='rgba(10,8,20,.85)',glow=null}={}){
 const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.textAlign='center';g.textBaseline='middle';
 const L=[].concat(lines),lh=h/L.length;L.forEach((t,i)=>{const [txt,f,col]=Array.isArray(t)?t:[t,font,color];g.font=f;const y=lh*(i+.5);
  if(glow){g.shadowColor=glow;g.shadowBlur=18}g.lineWidth=10;g.strokeStyle=stroke;g.lineJoin='round';g.strokeText(txt,w/2,y);g.shadowBlur=0;g.fillStyle=col;g.fillText(txt,w/2,y)});
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;return t}
function glowTexture(){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(.25,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)}
function haloTexture(){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d'),r=g.createRadialGradient(128,128,40,128,128,128);r.addColorStop(0,'rgba(28,22,46,.92)');r.addColorStop(.62,'rgba(24,20,38,.78)');r.addColorStop(.8,'rgba(214,178,106,.18)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,256,256);
 // fines runes gravées sur le pourtour du médaillon
 g.strokeStyle='rgba(214,178,106,.28)';g.lineWidth=1.2;for(let i=0;i<48;i++){const a=i/48*Math.PI*2,r1=96,r2=i%4?100:106;g.beginPath();g.moveTo(128+Math.cos(a)*r1,128+Math.sin(a)*r1);g.lineTo(128+Math.cos(a)*r2,128+Math.sin(a)*r2);g.stroke()}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
export function createElementWheel({loadModel,software=false}){
 const scene=new THREE.Scene(),root=new THREE.Group();scene.add(root);
 scene.add(new THREE.HemisphereLight(0xfff4dc,0x3a2f55,1.9));const key=new THREE.DirectionalLight(0xffffff,2.4);key.position.set(2,4,6);scene.add(key);const rim=new THREE.DirectionalLight(0xb8d4ff,1.1);rim.position.set(-4,-1,-3);scene.add(rim);
 const glowTex=glowTexture(),angleOf=i=>Math.PI/2-i*Math.PI/3;// Eau en haut, puis sens des aiguilles d'une montre
 const pos=i=>new THREE.Vector3(Math.cos(angleOf(i))*R,Math.sin(angleOf(i))*R,0);
 // Médaillon sombre + anneaux d'or
 const disc=new THREE.Mesh(new THREE.PlaneGeometry(R*2.9,R*2.9),new THREE.MeshBasicMaterial({map:haloTexture(),transparent:true,depthWrite:false}));disc.position.z=-.6;root.add(disc);
 const gold=new THREE.MeshStandardMaterial({color:0xd6b26a,metalness:.85,roughness:.32,emissive:0x3a2a08,emissiveIntensity:.5});
 const ring=new THREE.Mesh(new THREE.TorusGeometry(R,.045,10,160),gold);ring.position.z=-.25;root.add(ring);
 const ring2=new THREE.Mesh(new THREE.TorusGeometry(R*1.2,.022,8,160),gold);ring2.position.z=-.3;root.add(ring2);
 const ring3=new THREE.Mesh(new THREE.TorusGeometry(R*.42,.02,8,96),gold);ring3.position.z=-.3;root.add(ring3);
 // petites gemmes sur l'anneau extérieur, entre les éléments
 for(let i=0;i<6;i++){const a=angleOf(i)-Math.PI/6,gem=new THREE.Mesh(new THREE.OctahedronGeometry(.07,0),gold);gem.position.set(Math.cos(a)*R*1.2,Math.sin(a)*R*1.2,-.3);root.add(gem)}
 // Titre et légende
 const title=new THREE.Mesh(new THREE.PlaneGeometry(3.6,.56),new THREE.MeshBasicMaterial({map:textTexture(['ROUE DES ÉLÉMENTS'],{w:768,h:120,font:'700 62px Georgia,serif',color:'#f3d896',glow:'rgba(214,178,106,.9)'}),transparent:true,depthWrite:false}));title.position.set(0,R*1.2+.95,0);root.add(title);
 const legend=new THREE.Mesh(new THREE.PlaneGeometry(1.75,.84),new THREE.MeshBasicMaterial({map:textTexture([['domine','italic 600 46px Georgia,serif','#f3d896'],['➜','700 58px system-ui,sans-serif','#f3d896'],['+1 à côté','600 34px system-ui,sans-serif','#e8e0cc']],{w:340,h:164}),transparent:true,depthWrite:false}));legend.position.z=.05;root.add(legend);
 const hint=new THREE.Mesh(new THREE.PlaneGeometry(5.2,.9),new THREE.MeshBasicMaterial({map:textTexture([['La flèche part du plus fort :','600 40px system-ui,sans-serif','#f1e9d4'],['posé à côté de sa proie, il gagne +1.','500 36px system-ui,sans-serif','#e8e0cc']],{w:1040,h:180}),transparent:true,depthWrite:false}));hint.position.set(0,-R*1.2-1.2,0);root.add(hint);
 // Emplacements des six dés : halo coloré, nom, modèle 3D
 const s_load=[];let loaded=false;// les modèles ne se chargent qu'à l'approche de la roue (économie de données sur mobile)
 const slots=WHEEL_ORDER.map((el,i)=>{const g=new THREE.Group();g.position.copy(pos(i));root.add(g);const col=new THREE.Color(COLORS[el]);
  const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:col,transparent:true,opacity:.55,depthWrite:false,blending:THREE.AdditiveBlending}));halo.scale.setScalar(1.7);halo.position.z=-.4;g.add(halo);
  const label=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.38),new THREE.MeshBasicMaterial({map:textTexture([WHEEL_NAMES[el].toUpperCase()],{w:320,h:80,font:'700 50px Georgia,serif',color:COLORS[el]}),transparent:true,depthWrite:false}));
  const out=pos(i).normalize();label.position.set(out.x*1.02,out.y*.98-(Math.abs(out.y)<.6?.1:0),.1);g.add(label);
  const holder=new THREE.Group();g.add(holder);
  // repli tant que le modèle n'est pas chargé : une gemme de la couleur de l'élément
  const ph=new THREE.Mesh(new THREE.IcosahedronGeometry(.32,0),new THREE.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:.35,roughness:.3,metalness:.2,flatShading:true}));holder.add(ph);
  s_load.push(()=>loadModel?.('assets/models-web/'+FILES[el]).then(model=>{if(!model)return;const b=new THREE.Box3().setFromObject(model),s=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3());model.position.sub(c);const w=new THREE.Group();w.add(model);w.scale.setScalar(1.12/Math.max(s.x,s.y,s.z,.01));holder.remove(ph);holder.add(w)}).catch(()=>{}));
  return{el,g,halo,holder,label,col,phase:i*1.1,hl:0}});
 // Flèches courbes du plus fort vers sa proie, avec étincelles qui circulent
 const arrows=WHEEL_ORDER.map((el,i)=>{const a0=angleOf(i)-.27,a1=angleOf(i+1)+.36,rr=R;
  const curve=new THREE.Curve();curve.getPoint=(t,o=new THREE.Vector3())=>{const a=a0+(a1-a0)*t;return o.set(Math.cos(a)*rr,Math.sin(a)*rr,.02)};
  const geo=new THREE.TubeGeometry(curve,40,.07,10,false),n=geo.attributes.position.count,colors=new Float32Array(n*3),c0=new THREE.Color(COLORS[el]),c1=new THREE.Color(COLORS[WHEEL_ORDER[(i+1)%6]]),tmp=new THREE.Color();
  for(let k=0;k<n;k++){const seg=Math.floor(k/11)/40;tmp.copy(c0).lerp(c1,seg*.85);colors.set([tmp.r,tmp.g,tmp.b],k*3)}geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const tube=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.95,depthWrite:false,toneMapped:false}));root.add(tube);
  const end=curve.getPoint(1),before=curve.getPoint(.94),dir=end.clone().sub(before).normalize();
  const head=new THREE.Mesh(new THREE.ConeGeometry(.17,.36,16),new THREE.MeshBasicMaterial({color:c0.clone().lerp(c1,.85),toneMapped:false}));head.position.copy(end).addScaledVector(dir,.12);head.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);root.add(head);
  const sparks=[];for(let k=0;k<(software?1:3);k++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xffffff,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));s.scale.setScalar(.34);root.add(s);sparks.push({s,off:k/3})}
  return{el,curve,tube,head,sparks,c0,c1,hl:0}});
 const backHalo=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xd6b26a,transparent:true,opacity:.16,depthWrite:false,blending:THREE.AdditiveBlending}));backHalo.scale.setScalar(R*3.4);backHalo.position.z=-.8;root.add(backHalo);
 const tmpV=new THREE.Vector3(),tmpC=new THREE.Color();let focus='';
 function ensureModels(){if(loaded)return;loaded=true;s_load.forEach(f=>f())}
 function setFocus(el){focus=WHEEL_ORDER.includes(el)?el:''}
 /* Place la roue à droite du plateau (dans le repère de la caméra), face à elle. scale = taille relative. */
 function place(camera,anchor,scale=1){root.quaternion.copy(camera.quaternion);root.position.copy(anchor);root.scale.setScalar(scale)}
 function update(t,moving){const prey=focus?WHEEL_ORDER[(WHEEL_ORDER.indexOf(focus)+1)%6]:'',hunter=focus?WHEEL_ORDER[(WHEEL_ORDER.indexOf(focus)+5)%6]:'';
  slots.forEach((s,i)=>{const target=!focus?0:s.el===focus?1:s.el===prey?.75:s.el===hunter?.5:-.6;s.hl+=(target-s.hl)*.12;
   const tt=moving?t:0;s.holder.rotation.y=Math.sin(tt*.6+s.phase)*.55;s.holder.rotation.x=Math.sin(tt*.45+s.phase)*.08;s.holder.position.y=Math.sin(tt*1.1+s.phase)*.06;
   const big=1+Math.max(0,s.hl)*.22;s.holder.scale.setScalar(big);s.halo.material.opacity=Math.max(.12,.5+s.hl*.4+(moving?Math.sin(tt*2+s.phase)*.07:0));s.halo.scale.setScalar(1.6+Math.max(0,s.hl)*.7);
   s.label.material.opacity=s.hl<0?.45:1});
  arrows.forEach((a,i)=>{const on=focus&&(a.el===focus||WHEEL_ORDER[(i+1)%6]===focus),target=!focus?0:on?1:-.6;a.hl+=(target-a.hl)*.12;a.tube.material.opacity=a.hl<0?.3:.95;a.head.scale.setScalar(1+Math.max(0,a.hl)*.35);
   a.sparks.forEach(sp=>{const k=moving?((t*.32+sp.off+i*.13)%1):sp.off+.15;a.curve.getPoint(k,tmpV);sp.s.position.copy(tmpV);sp.s.position.z=.08;tmpC.copy(a.c0).lerp(a.c1,k).lerp(new THREE.Color(0xffffff),.35);sp.s.material.color.copy(tmpC);sp.s.material.opacity=(a.hl<0?.3:1)*Math.sin(k*Math.PI);sp.s.scale.setScalar(.3+Math.max(0,a.hl)*.18)})});
  legend.rotation.z=0;ring3.rotation.z=moving?t*.15:0;backHalo.material.opacity=.14+(moving?Math.sin(t*.8)*.03:0)}
 return{scene,root,place,update,setFocus,ensureModels,slots,arrows}
}
