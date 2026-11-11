/* v244 — Effets d'attaque selon le style de la créature et son élément.
   • Lanceurs de sorts (mages, fées, démon, bulles, spores, cristal…) : une boule d'énergie de leur élément vole vers la cible
     (feu : flammes et braises ; glace : éclat de cristal qui tournoie ; foudre : arcs qui crépitent ; eau : gouttelettes ;
     vent : anneaux de vent ; terre : roche ; sans élément : arcane violet), avec une traînée lumineuse.
   • Archers (arc, flèches, aiguilles) : une flèche élémentaire file en ligne tendue.
   • Combattants au corps à corps : une entaille lumineuse en arc de cercle sur la cible.
   Puis, pour tous : éclair d'impact, gerbe de particules et onde au sol. Calé sur la chronologie de combat.js
   (élan 0,13 → 0,5 ; projectile 0,25 → 0,45 ; impact 0,44 → 0,65). Rien n'est affiché en mode « animations réduites ». */
import * as THREE from 'three';
export function attackStyle(m){const t=((m?.lo||'')+' '+(m?.cn||m?.n||'')).toLowerCase();
 if(/\barc\b|archer|archère|flèche|aiguille/.test(t))return 'archer';
 if(/mage|magicien|\bsorts?\b|fée|arcane|démon|magique|bulle|spore|soigneur|cristal|idole|divine des orages/.test(t))return 'caster';
 return 'melee'}
export function createCombatFx(parent,glowTexture){
 const root=new THREE.Group();parent.add(root);root.visible=false;
 const glow=(color,size,op=1)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,color,transparent:true,opacity:op,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,fog:false}));s.scale.setScalar(size);s.renderOrder=20;return s};// visibles par-dessus les modèles : les combattants sont toujours voisins
 // Projectile : cœur + halo + traînée, et un « accessoire » par élément.
 const proj=new THREE.Group();proj.scale.setScalar(2.2);root.add(proj);const core=new THREE.Mesh(new THREE.SphereGeometry(.09,14,10),new THREE.MeshBasicMaterial({color:0xffffff,fog:false,depthTest:false}));proj.add(core);core.renderOrder=21;const halo=glow(0xffffff,.6);proj.add(halo);
 const trail=[];for(let i=0;i<9;i++){const g=glow(0xffffff,.6-i*.05,.75-i*.07);root.add(g);trail.push(g)}
 const shard=new THREE.Mesh(new THREE.OctahedronGeometry(.13,0),new THREE.MeshBasicMaterial({color:0xe8fbff,fog:false}));shard.scale.set(.7,1.8,.7);proj.add(shard);shard.renderOrder=21;shard.material.depthTest=false;
 const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(.13,0),new THREE.MeshStandardMaterial({color:0x7a5a3f,roughness:.9,flatShading:true}));proj.add(rock);rock.renderOrder=21;rock.material.depthTest=false;
 const rings=[0,1,2].map(i=>{const r=new THREE.Mesh(new THREE.TorusGeometry(.14+i*.05,.012,6,24),new THREE.MeshBasicMaterial({color:0xdfffe9,transparent:true,opacity:.8,fog:false}));proj.add(r);return r});
 const arcs=new THREE.LineSegments(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0xeaffff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));arcs.frustumCulled=false;proj.add(arcs);
 const flames=[];for(let i=0;i<6;i++){const f=glow(i%2?0xffb347:0xff5a1f,.22,.9);proj.add(f);flames.push(f)}
 const drops=[];for(let i=0;i<5;i++){const d=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),new THREE.MeshBasicMaterial({color:0x9fd8ff,transparent:true,opacity:.9,fog:false}));proj.add(d);drops.push(d)}
 const arrow=new THREE.Group();const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.5,6),new THREE.MeshBasicMaterial({color:0xfff3d6,fog:false}));shaft.rotation.x=Math.PI/2;arrow.add(shaft);const head=new THREE.Mesh(new THREE.ConeGeometry(.04,.12,6),new THREE.MeshBasicMaterial({color:0xffffff,fog:false}));head.rotation.x=Math.PI/2;head.position.z=.3;arrow.add(head);const ahalo=glow(0xffffff,.35);ahalo.position.z=.28;arrow.add(ahalo);root.add(arrow);
 // Entaille de corps à corps : croissant lumineux.
 const slash=new THREE.Mesh(new THREE.RingGeometry(.32,.42,32,1,-.2,Math.PI*.9),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,fog:false}));slash.renderOrder=20;root.add(slash);
 const slash2=slash.clone();slash2.material=slash.material.clone();root.add(slash2);
 // Impact : flash, gerbe de particules, onde au sol.
 const flash=glow(0xffffff,1.8);root.add(flash);const sparks=[];for(let i=0;i<22;i++){const g=glow(0xffffff,.2);root.add(g);const a=i/22*Math.PI*2;sparks.push({g,v:new THREE.Vector3(Math.cos(a)*(.6+Math.random()*.6),.4+Math.random()*1.1,Math.sin(a)*(.6+Math.random()*.6))})}
 const wave=new THREE.Mesh(new THREE.RingGeometry(.3,.38,40),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));wave.rotation.x=-Math.PI/2;root.add(wave);
 const col=new THREE.Color(),tmp=new THREE.Vector3();let arcT=0;
 function jag(a,b,n=6,j=.08){const pts=[];let prev=a.clone();for(let i=1;i<=n;i++){const p=a.clone().lerp(b,i/n);if(i<n)p.add(new THREE.Vector3((Math.random()-.5)*j,(Math.random()-.5)*j,(Math.random()-.5)*j));pts.push(prev,p);prev=p}return pts}
 function update(combat,state){const on=!!combat&&combat.kind!=='passage'&&!combat.reduced;root.visible=on;if(!on)return;
  const p=combat.progress,[A,D]=combat.fighters,style=state.style,el=state.element||'';col.set(state.color||'#ffe2a0');
  const from=new THREE.Vector3(A.x-3.5,.95,A.y-state.hz),to=new THREE.Vector3(D.x-3.5,.85,D.y-state.hz),dir=to.clone().sub(from);
  // Projectile (sorts) ou flèche (archers)
  const k=Math.min(1,Math.max(0,(p-.2)/.26)),flying=p>.2&&p<.47;
  proj.visible=style==='caster'&&flying;arrow.visible=style==='archer'&&flying;trail.forEach(g=>g.visible=false);
  if(proj.visible){const pos=from.clone().lerp(to,k);pos.y+=Math.sin(k*Math.PI)*.75+.15;proj.position.copy(pos);core.material.color.copy(col).lerp(new THREE.Color(0xffffff),.55);halo.material.color.copy(col);halo.scale.setScalar(.55+Math.sin(p*90)*.06);
   shard.visible=el==='glace';rock.visible=el==='terre';rings.forEach(r=>r.visible=el==='vent');arcs.visible=el==='foudre'||el==='';flames.forEach(f=>f.visible=el==='feu');drops.forEach(d=>d.visible=el==='eau');core.visible=el!=='terre';
   if(shard.visible){shard.rotation.set(p*30,p*44,0)}if(rock.visible){rock.rotation.set(p*25,p*33,0)}
   rings.forEach((r,i)=>{r.rotation.set(p*40+i,p*30*(i%2?-1:1),0)});
   flames.forEach((f,i)=>{const a=p*60+i*1.05;f.position.set(Math.cos(a)*.1,Math.sin(a*1.3)*.08+.04,Math.sin(a)*.1);f.scale.setScalar(.18+Math.random()*.08)});
   drops.forEach((d,i)=>{const a=p*35+i*1.25;d.position.set(Math.cos(a)*.17,Math.sin(a)*.17,Math.sin(a*.7)*.08)});
   if(arcs.visible&&(p-arcT>.012||p<arcT)){arcT=p;const pts=[];for(let i=0;i<4;i++){const a=new THREE.Vector3(),b=new THREE.Vector3((Math.random()-.5)*.5,(Math.random()-.5)*.5,(Math.random()-.5)*.5);pts.push(...jag(a,b,5,.08))}arcs.geometry.dispose();arcs.geometry=new THREE.BufferGeometry().setFromPoints(pts);arcs.material.color.copy(col).lerp(new THREE.Color(0xffffff),.5)}
   trail.forEach((g,i)=>{const kk=k-(i+1)*.045;g.visible=kk>0;if(!g.visible)return;const q=from.clone().lerp(to,kk);q.y+=Math.sin(kk*Math.PI)*.75+.15;g.position.copy(q);g.material.color.copy(col)})}
  if(arrow.visible){const pos=from.clone().lerp(to,k);pos.y+=Math.sin(k*Math.PI)*.12;arrow.position.copy(pos);arrow.lookAt(to.x,to.y,to.z);arrow.scale.setScalar(1.8);ahalo.material.color.copy(col);head.material.color.copy(col).lerp(new THREE.Color(0xffffff),.4);
   trail.forEach((g,i)=>{if(i>4)return;const kk=k-(i+1)*.03;g.visible=kk>0;if(!g.visible)return;g.position.copy(from.clone().lerp(to,kk));g.position.y+=Math.sin(kk*Math.PI)*.12;g.material.color.copy(col);g.scale.setScalar(.2-i*.03)})}
  // Entaille (corps à corps), au moment où l'attaquant arrive au contact
  const sk=Math.min(1,Math.max(0,(p-.36)/.16));slash.visible=slash2.visible=style==='melee'&&p>.36&&p<.56;
  if(slash.visible){const yaw=Math.atan2(dir.x,dir.z);for(const [s,off,sign] of[[slash,0,1],[slash2,.12,-1]]){const kk=Math.min(1,Math.max(0,sk-off));s.position.set(to.x-dir.x*.12,.9+off*.6,to.z-dir.z*.12);s.rotation.set(0,yaw+Math.PI/2,sign*(-.9+kk*1.8));s.scale.setScalar(.9+kk*.5);s.material.color.copy(col).lerp(new THREE.Color(0xffffff),.35);s.material.opacity=Math.sin(kk*Math.PI)*.95}}
  // Impact
  const hk=Math.max(0,(p-.44)/.24),hit=p>.44&&p<.68;flash.visible=wave.visible=hit;sparks.forEach(s=>s.g.visible=hit);
  if(hit){flash.position.copy(to);flash.material.color.copy(col).lerp(new THREE.Color(0xffffff),.4);flash.material.opacity=Math.max(0,1-hk*1.25);flash.scale.setScalar(1.2+hk*3.2);
   wave.position.set(to.x,.55,to.z);wave.material.color.copy(col);wave.material.opacity=Math.max(0,.9-hk);wave.scale.setScalar(1.2+hk*4);
   sparks.forEach((s,i)=>{s.g.position.copy(to).addScaledVector(s.v,hk*.85);s.g.position.y-=hk*hk*.45;s.g.material.color.copy(col).lerp(new THREE.Color(0xffffff),i%3?0:.6);s.g.material.opacity=Math.max(0,1-hk);s.g.scale.setScalar(.28*(1-hk*.5))})}
 }
 return{root,update};
}
