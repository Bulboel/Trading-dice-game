/* v357 / v359 — Lancer d'initiative : avant chaque partie, chaque camp lance un D20 ; le plus haut lancer commence
   (égalité : on relance), un 20 naturel rapporte un dé bonus. Le moteur (index.html) tire les résultats et attend
   game.initiativeDone(id) (sauf en ligne, où le résultat est déjà appliqué) ; ce module ne fait que les mettre en scène.
   v359 — vrai D20 en 3D (three.js du jeu) : icosaèdre à 20 faces numérotées (faces opposées = 21, numéro centré sur sa face),
   lancé de côté, qui roule, rebondit et s'immobilise sur la face tirée, tournée vers le joueur. Couleurs du dé de jet choisi
   (HackeniaRoll.palette()). Espace, Entrée ou un toucher : résultat immédiat ; second appui : fermer. Sans WebGL : D20 dessiné. */
(()=>{'use strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const reduced=()=>window.HackeniaSettings?.get?.().motion===false||matchMedia('(prefers-reduced-motion: reduce)').matches;
const sfx=k=>{try{window.HackeniaSettings?.play?.(k)}catch{}};
const palette=()=>window.HackeniaRoll?.palette?.()||{face:'#e6dfca',light:'#faf5e6',shade:'#b4ac96',edge:'#b89a5d',ink:'#243c35'};
let threeP=null;const getThree=()=>threeP||=import('three').catch(()=>null);
const ROLL_MS=2050;/* v428 — un poil plus lent (1,7 s → 2,05 s) */
/* v428 — on attend que le plateau soit vraiment à l'écran (menu fermé, plongée terminée, onglet visible) avant de lancer */
async function whenBoardShown(){const t0=Date.now();while(Date.now()-t0<6000){const b=document.body;if(!b.classList.contains('portal-open')&&!document.querySelector('.dive')&&document.visibilityState==='visible'&&!b.classList.contains('story-open'))break;await wait(100)}await wait(450)}

/* ---------- D20 en 3D ---------- */
// Atlas : 20 cases (5 × 4) de 256 px ; chaque case porte une face triangulaire avec son numéro centré sur le barycentre.
const CELL=256,COLS=5,TRI={top:[128,14],bl:[8,222],br:[248,222]},CEN=[128,(14+222+222)/3];
function atlas(P,nums){const c=document.createElement('canvas');c.width=CELL*COLS;c.height=CELL*4;const g=c.getContext('2d');
 nums.forEach((n,i)=>{const x0=(i%COLS)*CELL,y0=Math.floor(i/COLS)*CELL,t=TRI,p=q=>[x0+q[0],y0+q[1]];
  const grad=g.createLinearGradient(x0,y0+14,x0,y0+222);grad.addColorStop(0,P.light);grad.addColorStop(.55,P.face);grad.addColorStop(1,P.shade);
  g.beginPath();g.moveTo(...p(t.top));g.lineTo(...p(t.bl));g.lineTo(...p(t.br));g.closePath();g.fillStyle=grad;g.fill();
  g.save();g.clip();g.globalAlpha=.05;for(let k=0;k<260;k++){g.fillStyle=k%2?'#fff':'#000';g.fillRect(x0+Math.random()*CELL,y0+Math.random()*CELL,1.4,1.4)}g.restore();/* grain léger */
  g.lineJoin='round';g.strokeStyle=P.edge;g.lineWidth=13;g.stroke();/* arête dorée */
  const ins=(q,k=.93)=>[x0+CEN[0]+(q[0]-CEN[0])*k,y0+CEN[1]+(q[1]-CEN[1])*k];g.strokeStyle='rgba(255,255,255,.35)';g.lineWidth=2.5;g.beginPath();g.moveTo(...ins(t.top));g.lineTo(...ins(t.bl));g.lineTo(...ins(t.br));g.closePath();g.stroke();
  const cx=x0+CEN[0],cy=y0+CEN[1]+6,size=n>=10?74:86;g.font=`700 ${size}px Georgia,"Times New Roman",serif`;g.textAlign='center';g.textBaseline='middle';
  g.fillStyle='rgba(255,255,255,.45)';g.fillText(String(n),cx+1.5,cy+2);g.fillStyle=P.ink;g.fillText(String(n),cx,cy);/* numéro gravé, centré */
  if(n===6||n===9)g.fillRect(cx-16,cy+size*.42,32,6)});return c}
async function make3D(host,P){const THREE=await getThree();if(!THREE)return null;
 let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'})}catch{return null}
 const size=host.clientWidth||130;renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setSize(size,size,false);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0,0);
 renderer.domElement.className='ini-gl';host.prepend(renderer.domElement);
 const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(30,1,.1,50);cam.position.set(0,0,6.2);
 scene.add(new THREE.HemisphereLight(0xfff4dc,0x1b2a22,1.25));const key=new THREE.DirectionalLight(0xffffff,1.9);key.position.set(-2.5,3.2,4);scene.add(key);
 const rim=new THREE.DirectionalLight(0xffd88a,1.1);rim.position.set(3,1.5,-3);scene.add(rim);const glow=new THREE.PointLight(0xffc14a,0,8);glow.position.set(0,0,2.6);scene.add(glow);
 // icosaèdre non indexé : chaque face reçoit sa case de l'atlas
 const geo=new THREE.IcosahedronGeometry(1.18,0),pos=geo.attributes.position,F=pos.count/3,uv=new Float32Array(pos.count*2),faces=[];
 for(let f=0;f<F;f++){const A=new THREE.Vector3().fromBufferAttribute(pos,f*3),B=new THREE.Vector3().fromBufferAttribute(pos,f*3+1),C=new THREE.Vector3().fromBufferAttribute(pos,f*3+2);
  const cen=A.clone().add(B).add(C).multiplyScalar(1/3);faces.push({n:cen.clone().normalize(),up:A.clone().sub(cen).normalize()})}
 const nums=new Array(F).fill(0);let next=1;for(let f=0;f<F;f++){if(nums[f])continue;const o=faces.findIndex((q,j)=>j!==f&&!nums[j]&&q.n.dot(faces[f].n)<-.99);nums[f]=next;if(o>=0)nums[o]=21-next;next++}/* faces opposées = 21 */
 for(let f=0;f<F;f++){const x0=(f%COLS)*CELL,y0=Math.floor(f/COLS)*CELL,W=CELL*COLS,H=CELL*4,set=(k,q)=>{uv[(f*3+k)*2]=(x0+q[0])/W;uv[(f*3+k)*2+1]=1-(y0+q[1])/H};set(0,TRI.top);set(1,TRI.bl);set(2,TRI.br)}
 geo.setAttribute('uv',new THREE.BufferAttribute(uv,2));geo.computeVertexNormals();
 const tex=new THREE.CanvasTexture(atlas(P,nums));tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
 const mat=new THREE.MeshStandardMaterial({map:tex,roughness:.38,metalness:.08,emissive:new THREE.Color(0xffc14a),emissiveIntensity:0});
 const die=new THREE.Mesh(geo,mat);scene.add(die);
 const sh=document.createElement('canvas');sh.width=sh.height=64;{const g=sh.getContext('2d'),r=g.createRadialGradient(32,32,2,32,32,30);r.addColorStop(0,'rgba(0,0,0,.55)');r.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=r;g.fillRect(0,0,64,64)}
 const shadow=new THREE.Mesh(new THREE.PlaneGeometry(2.4,1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(sh),transparent:true,depthWrite:false}));shadow.position.set(0,-1.42,0);scene.add(shadow);/* ombre douce */
 // orientation finale : la face tirée vers la caméra, numéro droit, légère inclinaison pour montrer le volume
 const target=v=>{const f=nums.indexOf(v),{n,up}=faces[f],r=new THREE.Vector3().crossVectors(up,n),m=new THREE.Matrix4().makeBasis(r,up,n).transpose();
  return new THREE.Quaternion().setFromEuler(new THREE.Euler(-.13,.15,0)).multiply(new THREE.Quaternion().setFromRotationMatrix(m))};
 let anim=null,state='',alive=true,last=0;
 const frame=now=>{if(!alive)return;requestAnimationFrame(frame);if(now-last<15)return;last=now;
  if(anim){const k=Math.min(1,(now-anim.t0)/anim.ms),e=1-Math.pow(1-k,3.2);
   die.quaternion.copy(anim.q).multiply(new THREE.Quaternion().setFromAxisAngle(anim.axis,anim.turns*(1-e)));
   const b=k<.42?(1-k/.42)*1.5:k<.66?Math.sin((k-.42)/.24*Math.PI)*.42:k<.84?Math.sin((k-.66)/.18*Math.PI)*.12:0;die.position.y=b;/* chute puis deux rebonds */
   shadow.scale.setScalar(1-b*.25);shadow.material.opacity=1-b*.35;
   if(!anim.hit1&&k>=.42){anim.hit1=1;sfx('Impact')}if(k>=1){const d=anim.done;anim=null;die.position.y=0;d?.()}}
  else if(state){const t=now/1000;die.position.y=Math.sin(t*2.1)*.04}
  glow.intensity+=((state==='win'?2.6:0)-glow.intensity)*.08;mat.emissiveIntensity+=((state==='win'?.14:0)-mat.emissiveIntensity)*.08;
  renderer.render(scene,cam)};requestAnimationFrame(frame);
 die.quaternion.setFromEuler(new THREE.Euler(Math.random()*6,Math.random()*6,Math.random()*6));
 return{roll(value,fast){const q=target(value);return new Promise(res=>{if(fast){anim=null;die.quaternion.copy(q);die.position.y=0;res();return}
   const axis=new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).normalize();anim={q,axis,turns:Math.PI*2*(3+Math.random()*1.5),t0:performance.now(),ms:ROLL_MS,done:res}})},
  land(value){if(anim){const d=anim.done;anim=null;die.quaternion.copy(target(value));die.position.y=0;d?.()}},
  setState(s){state=s;if(s==='lose')mat.color.setRGB(.6,.6,.6)},
  dispose(){alive=false;try{geo.dispose();mat.dispose();tex.dispose();renderer.dispose();renderer.forceContextLoss?.()}catch{}}}}

/* ---------- secours sans WebGL : D20 dessiné ---------- */
function flat(host,P){host.insertAdjacentHTML('afterbegin',`<svg class="ini-flat" viewBox="-50 -50 100 100" aria-hidden="true"><polygon points="0,-46 39.8,-23 39.8,23 0,46 -39.8,23 -39.8,-23" fill="${P.face}" stroke="${P.edge}" stroke-width="3"/><polygon points="0,-25 21.6,12.5 -21.6,12.5" fill="${P.light}" stroke="${P.edge}" stroke-width="1.6"/><text x="0" y="1" fill="${P.ink}" text-anchor="middle" dominant-baseline="central" font-family="Georgia,serif" font-weight="700" font-size="17">?</text></svg>`);
 const t=host.querySelector('.ini-flat text');let stop=false;return{roll(v,fast){return new Promise(async r=>{stop=false;if(!fast){for(let g=40;g<260&&!stop;g*=1.25){t.textContent=1+Math.floor(Math.random()*20);await wait(g)}}t.textContent=v;r()})},land(v){stop=true;t.textContent=v},setState(){},dispose(){}}}

/* ---------- mise en scène ---------- */
let box=null;
async function show({rolls,winner,crit,names,id,me=0,online=false}){box?.remove();const fast=reduced(),P=palette();
 const camps=window.HackeniaSettings?.campColors?.(me)||[{ui:'#3fae74'},{ui:'#d0453f'}];
 rolls=rolls.map(r=>[r[me],r[1-me]]);winner=winner===me?0:1;crit=[crit[me],crit[1-me]];const foe=names[1-me]||'Adversaire',O=[me,1-me];/* le joueur toujours à gauche */
 box=document.createElement('div');box.id='initiative';box.className='ini'+(fast?' ini-still':'');box.setAttribute('role','dialog');box.setAttribute('aria-label','Lancer d’initiative');
 box.innerHTML=`<div class="ini-panel"><small class="ini-kicker">Qui commence ?</small><h2>Lancer d’initiative</h2>
 <div class="ini-duel">${[0,1].map(o=>`<div class="ini-player p${o}" style="--camp:${camps[O[o]]?.ui||'#ccc'}"><b>${esc(o===0?'Vous':foe)}</b><div class="ini-stage"><i class="ini-halo"></i><div class="ini-die"></div></div><span class="ini-score" aria-hidden="true">·</span><span class="ini-crit" hidden>20 naturel ! +1 dé bonus</span></div>${o===0?'<span class="ini-vs" aria-hidden="true">⚔</span>':''}`).join('')}</div>
 <p class="ini-result" role="status">Les dés roulent…</p><span class="ini-hint">${matchMedia('(hover:hover)').matches?'Espace ou clic : résultat immédiat':'Toucher pour passer'}</span></div>`;
 document.body.append(box);const players=[...box.querySelectorAll('.ini-player')],hosts=players.map(p=>p.querySelector('.ini-die')),scores=players.map(p=>p.querySelector('.ini-score')),result=box.querySelector('.ini-result');
 requestAnimationFrame(()=>box.classList.add('in'));
 const dice=await Promise.all(hosts.map(h=>make3D(h,P).catch(()=>null).then(d=>d||flat(h,P))));
 let done=false,skip=false;const cur=[0,0];
 const finish=()=>{if(done)return;done=true;removeEventListener('keydown',onKey,true);dice.forEach(d=>d.dispose());box.classList.add('out');setTimeout(()=>{box?.remove();box=null},380);if(!online)window.hackeniaGame?.initiativeDone?.(id)};
 const skipNow=()=>{if(skip){finish();return}skip=true;box.getAnimations({subtree:true}).forEach(a=>{try{a.finish()}catch{}});dice.forEach((d,i)=>d.land(cur[i]))};
 const onKey=e=>{if(e.code==='Space'||e.key===' '||e.key==='Enter'||e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();skipNow()}};addEventListener('keydown',onKey,true);box.addEventListener('click',skipNow);
 await wait(fast?60:320);
 const throwIn=i=>{const side=i?1:-1;hosts[i].parentElement.animate([{transform:`translate(${side*150}px,-110px) scale(.5)`,opacity:0},{opacity:1,offset:.16},{transform:'translate(0,0) scale(1)',offset:.44},{transform:'translate(0,0) scale(1)'}],{duration:ROLL_MS,easing:'cubic-bezier(.25,.7,.3,1)',fill:'both'})};
 for(let k=0;k<rolls.length&&!done;k++){cur[0]=rolls[k][0];cur[1]=rolls[k][1];players.forEach(p=>p.classList.remove('win','lose','landed'));scores.forEach(s=>{s.textContent='·';s.classList.remove('show')});
  result.textContent=k?'Égalité ! On relance…':'Les dés roulent…';if(!fast&&!skip)sfx('Roulement');
  await Promise.all([0,1].map(i=>wait(fast||skip||!i?0:110).then(()=>{const quick=fast||skip;if(!quick)throwIn(i);return dice[i].roll(cur[i],quick)}).then(()=>{players[i].classList.add('landed');scores[i].textContent=cur[i];scores[i].classList.add('show')})));
  if(k<rolls.length-1){result.textContent=`Égalité : ${cur[0]} partout ! On relance…`;await wait(skip||fast?300:1100)}}
 if(done)return;const last=rolls[rolls.length-1];players[winner].classList.add('win');players[1-winner].classList.add('lose');dice[winner].setState('win');dice[1-winner].setState('lose');
 crit.forEach((c,o)=>{if(c){players[o].classList.add('crit');players[o].querySelector('.ini-crit').hidden=false}});if(crit.some(Boolean))sfx('Rareté');sfx(winner===0?'Victoire':'Point');
 result.innerHTML=winner===0?`<strong>Vous commencez !</strong> ${last[0]} contre ${last[1]}`:`<strong>${esc(foe)} commence.</strong> ${last[1]} contre ${last[0]}`;
 await wait(window.__iniHold||(skip?700:fast?1500:2000));finish()}
window.addEventListener('hackenia:initiative',e=>{whenBoardShown().then(()=>show(e.detail)).catch(()=>{document.getElementById('initiative')?.remove();if(!e.detail.online)window.hackeniaGame?.initiativeDone?.(e.detail.id)})});
getThree();/* préchargement de three.js */
window.HackeniaInitiative={show};
})();
