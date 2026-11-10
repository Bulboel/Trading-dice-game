/* v198 — Cinématique de fin de partie : victoire (rayons dorés, confettis, couronne de lauriers), défaite (voile froid, cendres, titre qui se fend), égalité.
   Écoute « hackenia-match-end » envoyé par le moteur. En Histoire, la carte s'efface seule avant la suite du récit. */
(()=>{'use strict';
const game=()=>window.hackeniaGame,portal=()=>window.HackeniaPortal;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const motionOn=()=>window.HackeniaSettings?.get?.().motion!==false&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
let root=null,raf=0,closeTimer=0;

const CREST={
 win:`<svg viewBox="0 0 160 120" aria-hidden="true"><defs><linearGradient id="me-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3c0"/><stop offset=".5" stop-color="#e6b552"/><stop offset="1" stop-color="#9a6a22"/></linearGradient></defs>
  <g fill="url(#me-gold)" stroke="#6b4a16" stroke-width="1.2">${[...Array(7)].map((_,i)=>{const a=(200+i*17)*Math.PI/180,x=80+52*Math.cos(a),y=72+46*Math.sin(a);return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="11" ry="5" transform="rotate(${(i*17+110).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`}).join('')}${[...Array(7)].map((_,i)=>{const a=(340-i*17)*Math.PI/180,x=80+52*Math.cos(a),y=72+46*Math.sin(a);return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="11" ry="5" transform="rotate(${(70-i*17).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`}).join('')}</g>
  <path d="M52 62 60 34l14 16 6-22 6 22 14-16 8 28Z" fill="url(#me-gold)" stroke="#6b4a16" stroke-width="2" stroke-linejoin="round"/><rect x="52" y="60" width="56" height="10" rx="3" fill="url(#me-gold)" stroke="#6b4a16" stroke-width="2"/>
  <circle cx="60" cy="33" r="3.5" fill="#fff6d0"/><circle cx="80" cy="26" r="4" fill="#ff6f8c"/><circle cx="100" cy="33" r="3.5" fill="#fff6d0"/>
  <g transform="translate(80 92) rotate(45)"><rect x="-11" y="-11" width="22" height="22" rx="4" fill="#fbf4e2" stroke="#b58a3c" stroke-width="2"/><circle r="2.6" fill="#7a5420"/><circle cx="-5.5" cy="-5.5" r="2.4" fill="#7a5420"/><circle cx="5.5" cy="5.5" r="2.4" fill="#7a5420"/></g></svg>`,
 loss:`<svg viewBox="0 0 160 120" aria-hidden="true"><defs><linearGradient id="me-steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c9d4e2"/><stop offset=".6" stop-color="#6d7a8e"/><stop offset="1" stop-color="#3a4352"/></linearGradient></defs>
  <g class="me-shard me-shard-l"><path d="M80 14 44 28v30c0 26 18 44 36 52V14Z" fill="url(#me-steel)" stroke="#232a35" stroke-width="2"/><path d="M80 14v22l-8 10 10 12-6 14 4 38" fill="none"/></g>
  <g class="me-shard me-shard-r"><path d="M80 14l36 14v30c0 26-18 44-36 52V14Z" fill="url(#me-steel)" stroke="#232a35" stroke-width="2"/></g>
  <path d="M80 14v22l-8 10 10 12-6 14 4 38" fill="none" stroke="#10151d" stroke-width="2.4" stroke-linejoin="round" class="me-crack"/></svg>`,
 draw:`<svg viewBox="0 0 160 120" aria-hidden="true"><g fill="#cdd6e4" stroke="#3a4352" stroke-width="2"><path d="M80 18v80M52 98h56"/><path d="M40 40h80"/><path d="M40 40 26 70h28L40 40Zm80 0-14 30h28l-14-30Z"/></g><circle cx="80" cy="18" r="6" fill="#e9c46a" stroke="#6b4a16" stroke-width="2"/></svg>`};

function ensure(){if(root)return root;root=document.createElement('section');root.id='match-end';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-modal','false');root.setAttribute('aria-labelledby','me-title');
 root.innerHTML='<div class="me-veil"></div><div class="me-rays"></div><canvas class="me-fx" aria-hidden="true"></canvas><div class="me-card"><div class="me-crest"></div><h2 id="me-title" class="me-title"></h2><p class="me-sub"></p><div class="me-stats"></div><div class="me-reward"></div><div class="me-actions"></div></div>';
 document.body.append(root);
 root.addEventListener('click',e=>{const a=e.target.closest('[data-me]')?.dataset.me;if(!a)return;if(a==='board')close();else if(a==='menu'){close();portal()?.open('home')}else if(a==='again'){const view=root.dataset.again;close();portal()?.open(view)}});
 document.addEventListener('keydown',e=>{if(!root.hidden&&e.key==='Escape')close()});return root}

function letters(text){return [...text].map((c,i)=>`<span style="--i:${i}">${c===' '?'&nbsp;':esc(c)}</span>`).join('')}

function show(d){if(document.body.classList.contains('tutorial-mode'))return;const el=ensure(),motion=motionOn();clearTimeout(closeTimer);cancelAnimationFrame(raf);
 const kind=d.outcome==='draw'?'draw':d.outcome==='loss'?'loss':'win',local=d.outcome==='local',me=d.me??0,foe=1-me,story=d.mode==='story';
 const title=kind==='draw'?'Égalité':kind==='loss'?'Défaite':local?'Victoire':'Victoire',sub=kind==='draw'?'Les deux camps se séparent sans vainqueur.':local?`${esc(d.winnerName)} remporte le duel !`:kind==='win'?`Bravo ${esc(d.names?.[me]||'')} ! Le duel est à vous.`:`${esc(d.names?.[foe]||'L’adversaire')} l’emporte cette fois… Retentez votre chance !`;
 const s=d.scores||[0,0],k=d.kills||[0,0],who=local?d.winner??0:me;
 const stats=kind==='draw'?'':`<span><b>${s[who]??0}</b> / ${d.win} passages</span><span><b>${k[who]??0}</b> / ${d.kw} ennemis vaincus</span><span><b>${d.turn||1}</b> tour${(d.turn||1)>1?'s':''}</span>`;
 const R=window.HackeniaMatchRewards,gold=['quick','play'].includes(d.mode)&&R?R.amount(kind==='win',d.mode,d.difficulty):0;
 el.className='me-'+kind+(motion?'':' me-still');el.dataset.again=d.mode==='online'?'pvp':d.mode==='quick'?'quick':d.mode==='story'?'story':'play';
 el.querySelector('.me-crest').innerHTML=CREST[kind];el.querySelector('.me-title').innerHTML=letters(title);el.querySelector('.me-sub').innerHTML=sub;el.querySelector('.me-stats').innerHTML=stats;
 el.querySelector('.me-reward').innerHTML=gold?`<span class="me-bubble" aria-hidden="true"></span><b data-gold="${gold}">+0</b> Bubulles`:'';
 el.querySelector('.me-actions').innerHTML=story?'':`<button type="button" data-me="board">Voir le plateau</button><button type="button" data-me="menu">Menu</button><button type="button" class="portal-primary" data-me="again">${kind==='loss'?'Revanche':'Rejouer'}</button>`;
 el.hidden=false;requestAnimationFrame(()=>el.classList.add('me-in'));
 if(gold){const b=el.querySelector('[data-gold]'),t0=performance.now()+(motion?1400:0);const tick=t=>{const p=Math.min(1,Math.max(0,(t-t0)/700));b.textContent='+'+Math.round(gold*p);if(p<1&&!el.hidden)requestAnimationFrame(tick)};requestAnimationFrame(tick)}
 if(motion)particles(el.querySelector('.me-fx'),kind);
 if(story)closeTimer=setTimeout(close,1850)}

function close(){if(!root||root.hidden)return;clearTimeout(closeTimer);root.classList.remove('me-in');root.classList.add('me-out');setTimeout(()=>{root.hidden=true;root.classList.remove('me-out');cancelAnimationFrame(raf)},320)}

function particles(canvas,kind){const dpr=Math.min(2,devicePixelRatio||1),W=canvas.clientWidth||innerWidth,H=canvas.clientHeight||innerHeight;canvas.width=W*dpr;canvas.height=H*dpr;const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);
 const P=[],rnd=(a,b)=>a+Math.random()*(b-a),cols=kind==='win'?['#ffd76a','#fff1b8','#e8a93a','#7ad39b','#7eaeed','#e48cff','#ff8f8f','#9be7ff']:kind==='loss'?['#8a94a3','#5d6573','#b4bcc8','#ff7a3d']:['#cdd6e4','#e9c46a'];
 const count=kind==='win'?150:kind==='loss'?90:40,start=performance.now();
 for(let i=0;i<count;i++){if(kind==='win'){const a=rnd(-Math.PI*.95,-Math.PI*.05),v=rnd(5,13);P.push({x:W/2+rnd(-30,30),y:H*.42,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:.22,w:rnd(5,10),h:rnd(3,6),r:rnd(0,6),vr:rnd(-.25,.25),c:cols[i%cols.length],star:i%9===0,delay:i<90?0:rnd(300,1400)})}
  else P.push({x:rnd(0,W),y:rnd(-H*.6,0),vx:rnd(-.3,.3),vy:rnd(.5,1.6),g:0,w:rnd(2,4.5),h:rnd(2,4.5),r:rnd(0,6),vr:rnd(-.05,.05),c:i%13===0&&kind==='loss'?cols[3]:cols[i%3],ember:kind==='loss'&&i%13===0,delay:rnd(0,1600),sway:rnd(0,6)})}
 const frame=t=>{const el=t-start;c.clearRect(0,0,W,H);let alive=0;
  for(const p of P){if(el<p.delay)continue;alive++;if(kind==='win'){p.vy+=p.g;p.vx*=.99;p.vy=Math.min(p.vy,4.2)}else p.vx=Math.sin((el/900)+p.sway)*.35;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;
   if(p.y>H+20){if(kind!=='win'&&el<9000){p.y=-10;p.x=rnd(0,W)}else continue}
   c.save();c.translate(p.x,p.y);c.rotate(p.r);c.globalAlpha=kind==='win'?1:p.ember?.9:.55;c.fillStyle=p.c;
   if(p.star){c.beginPath();for(let k=0;k<8;k++){const rr=k%2?2.5:7,a=k*Math.PI/4;c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr)}c.closePath();c.fill()}
   else if(p.ember){c.shadowColor='#ff7a3d';c.shadowBlur=8;c.beginPath();c.arc(0,0,p.w*.6,0,7);c.fill()}
   else if(kind==='win')c.fillRect(-p.w/2,-p.h/2,p.w,p.h*(.4+.6*Math.abs(Math.cos(p.r*2))));else{c.beginPath();c.ellipse(0,0,p.w,p.h*.6,0,0,7);c.fill()}
   c.restore()}
  if(!root.hidden&&(alive||el<2000)&&el<14000)raf=requestAnimationFrame(frame)};raf=requestAnimationFrame(frame)}

window.addEventListener('hackenia-match-end',e=>{const d=e.detail;if(!d)return;setTimeout(()=>show(d),motionOn()?650:0)});
window.HackeniaMatchEnd={show,close};
})();
