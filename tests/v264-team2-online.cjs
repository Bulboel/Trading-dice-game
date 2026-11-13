// v264 — 2 contre 2 en ligne : 4 sièges, équipes (0+2 contre 1+3), IA pilotées par l'hôte, moteurs séparés + faux serveur qui imite le SQL 06.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const {createCore}=require('../assets/pvp-online.js');
const src=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/g).map(s=>s.replace(/<\/?script>/g,'')).sort((a,b)=>b.length-a.length)[0].replace(/init\(\);\s*$/,'');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(f,ms=20000,what='')=>{const t=Date.now();while(!f()){if(Date.now()-t>ms)throw new Error('délai dépassé '+what+' : '+f);await sleep(5)}};

function server(){const games=[],players=[],events=[];let n=0;const id=()=>'id'+(++n);
 const fn={
  create_team_game(u,a){const ai=[...new Set(a.p_ai_seats||[])].sort();if(ai.length>2)throw Error('au plus deux IA');for(const s of ai){if(![1,2,3].includes(s))throw Error('siège IA invalide');if(!Array.isArray((a.p_ai_decks||{})[s])||a.p_ai_decks[s].length!==10)throw Error('deck IA manquant')}
   const g={id:id(),code:('Q'+n+'AAAAA').slice(0,6),mode:'2v2',ai_seats:ai,ai_decks:a.p_ai_decks||{},status:'waiting',seed:Math.floor(Math.random()*2e9),terrain:a.p_terrain,turn_seat:0,last_seq:0,winner:null};games.push(g);players.push({game_id:g.id,seat:0,user_id:u,name:a.p_name,deck:a.p_deck});return[{game_id:g.id,game_code:g.code}]},
  join_game(u,a){const g=games.find(x=>x.code===a.p_code.toUpperCase());if(!g)throw Error('code inconnu');return fn.join_team_game(u,a)},
  join_team_game(u,a){const g=games.find(x=>x.code===a.p_code.toUpperCase());if(!g)throw Error('code inconnu');if(players.some(p=>p.game_id===g.id&&p.user_id===u))return g.id;if(g.status!=='waiting')throw Error('partie déjà commencée');
   const seat=[0,1,2,3].find(s=>!g.ai_seats.includes(s)&&!players.some(p=>p.game_id===g.id&&p.seat===s));if(seat===undefined)throw Error('table complète');players.push({game_id:g.id,seat,user_id:u,name:a.p_name,deck:a.p_deck});
   if(players.filter(p=>p.game_id===g.id).length+g.ai_seats.length>=4)g.status='playing';return g.id},
  play_action(u,a){const p=players.find(x=>x.game_id===a.p_game&&x.user_id===u);if(!p)throw Error('tu ne fais pas partie de cette partie');const g=games.find(x=>x.id===a.p_game);if(g.status!=='playing')throw Error('partie non active');
   if(!['hello','roll','place','move','skip','resign','win'].includes(a.p_kind))throw Error('action inconnue');
   let actor=p.seat;if(a.p_as_seat!=null&&a.p_as_seat!==p.seat){const minSeat=Math.min(...players.filter(x=>x.game_id===g.id).map(x=>x.seat));if(!g.ai_seats.includes(a.p_as_seat)||p.seat!==minSeat)throw Error('siège IA non autorisé');actor=a.p_as_seat}
   if(['roll','place','move','skip'].includes(a.p_kind)&&g.turn_seat!==actor)throw Error('ce n\'est pas ton tour');
   g.last_seq++;events.push({game_id:g.id,seq:g.last_seq,seat:actor,kind:a.p_kind,payload:a.p_payload||{}});
   if(['place','skip'].includes(a.p_kind))g.turn_seat=(g.turn_seat+1)%4;
   if(['resign','win'].includes(a.p_kind)){g.status='finished';g.winner=a.p_kind==='resign'?1-actor%2:actor%2}return g.last_seq},
  roll_dice(u,a){if(a.p_n<1||a.p_n>4)throw Error('nombre de dés invalide');const v=[...Array(a.p_n)].map(()=>1+Math.floor(Math.random()*6));fn.play_action(u,{p_game:a.p_game,p_kind:'roll',p_payload:{values:v},p_as_seat:a.p_as_seat});return v}};
 const tables={games,game_players:players,game_events:events};
 const table=name=>({select(){const f=[];let ord=null;const b={eq(c,v){f.push(r=>r[c]===v);return b},gt(c,v){f.push(r=>r[c]>v);return b},order(c,o){ord=[c,o&&o.ascending===false?-1:1];return b},
   single(){return run().then(x=>x.data[0]?{data:x.data[0],error:null}:{data:null,error:{message:'introuvable'}})},then(a,r){return run().then(a,r)}};
   function run(){let o=tables[name].filter(r=>f.every(g=>g(r)));if(ord)o=o.sort((a,b)=>(a[ord[0]]>b[ord[0]]?1:-1)*ord[1]);return Promise.resolve({data:JSON.parse(JSON.stringify(o)),error:null})}return b}});
 return{games,events,players,fn,client(uid){return{auth:{getSession:async()=>({data:{session:null}}),signInAnonymously:async()=>({data:{user:{id:uid}},error:null})},
  rpc:async(name,a)=>{try{return{data:fn[name](uid,a),error:null}}catch(e){return{data:null,error:{message:e.message}}}},from:table,channel(){const c={on(){return c},subscribe(){return c},unsubscribe(){}};return c}}}}}

function engine(){const els=new Map(),P=()=>new Proxy(function(){},{get:(t,p)=>p==='children'?[]:p==='length'?0:p===Symbol.toPrimitive?()=>0:P(),set:()=>true,apply:()=>P()});
 const c=vm.createContext({window:{dispatchEvent(){}},Event,document:{getElementById(i){if(!els.has(i))els.set(i,P());return els.get(i)}},fetch:()=>Promise.resolve({ok:false}),
  setTimeout:(f,ms)=>setTimeout(f,Math.min(ms,3)),clearTimeout,setInterval:f=>setInterval(f,1),clearInterval,console,Date,Math});
 vm.runInContext(src,c);vm.runInContext("render=()=>{};landCube=()=>{};showRollDice=()=>{};",c);
 const run=x=>vm.runInContext(x,c);
 return{run,api:run('window.hackeniaGame'),snap:()=>run("JSON.stringify({b,cr:cr.map(c=>({o:c.o,x:c.x,y:c.y,id:c.id,lv:c.lv})),sq:squad?squad.map(g=>g.map(p=>[p.h,p.q.length])):null,h:pl.map(p=>p.h),s:pl.map(p=>p.s),cur,turnSeat,kills,over})")}}

const DECKS=[[0,1,2,3,4,5,6,7,8,9],[10,11,12,13,14,15,16,17,18,19],[20,21,22,23,24,25,26,27,28,29],[30,31,32,33,34,35,36,37,38,39]];
/* un tour humain : déplacement possible, puis pose d'un dé */
async function humanTurn(E,seat){
 await until(()=>E.run('turnSeat')===seat&&E.run('mode')==='i'&&!E.api.onlineState().pending&&!E.api.onlineState().busy,20000,'tour du siège '+seat);
 const mv=E.run("(()=>{for(const c of cr.filter(c=>c.o===cur)){const R=bfs(c),k=Object.keys(R).find(k=>!at(+k.split(',')[0],+k.split(',')[1]));if(!k)continue;const ox=c.x,oy=c.y;movePlan={unit:c,x:+k.split(',')[0],y:+k.split(',')[1]};confirmMove();if(c.x!==ox||c.y!==oy||!cr.includes(c))return 1}return 0})()");
 if(mv)await until(()=>E.run('mode')==='i'&&!E.api.onlineState().busy,20000,'fin du déplacement');
 const placed=E.run("(()=>{for(let i=0;i<pl[cur].h.length;i++){const m=pl[cur].h[i],p=firstValid(m,cur?0:2);if(p){die=m;hi=i;rot=cur?0:2;pc=p;mode='p';lancer();return 1}}return 0})()");
 return placed}

(async()=>{
 /* ===== A. toi (siège 0) + un ami (siège 2) contre deux IA (sièges 1 et 3), IA pilotées par l'hôte ===== */
 {const S=server(),E=[engine(),null,engine()];
  const cfg={version:'t'},mk=(uid,e)=>createCore({sb:S.client(uid),game:e.api,cfg,pollMs:15,idleStep:4,idleTimeout:15000});
  const host=mk('u0',E[0]),friend=mk('u2',E[2]);
  const r=await host.createGame({name:'Hôte',deck:DECKS[0],terrain:'terre',team2:true,aiSeats:[1,3],aiDecks:{1:DECKS[1],3:DECKS[3]}});
  assert.equal(S.games[0].status,'waiting');
  await friend.joinGame({code:r.game_code,name:'Ami',deck:DECKS[2]});
  await until(()=>host.S.started&&friend.S.started,20000,'démarrage');
  assert.equal(host.S.seat,0);assert.equal(friend.S.seat,2);assert.equal(friend.S.camp,0);assert.ok(host.S.team2&&friend.S.team2);
  assert.equal(E[0].api.onlineState().driver,true);assert.equal(E[2].api.onlineState().driver,false);
  assert.equal(E[0].snap(),E[2].snap(),'états initiaux identiques');
  const st=E[0].api.onlineState();assert.equal(st.win,3,'2v2 : 3 passages');assert.equal(st.kw,6,'2v2 : 6 combats');
  /* 12 tours : 0 (hôte) → 1 (IA) → 2 (ami) → 3 (IA) × 3 */
  const order=[];
  for(let t=0;t<12;t++){const seat=t%4;order.push(seat);
   if(seat===0||seat===2){const ok=await humanTurn(E[seat],seat);assert.ok(ok,'pose possible au tour '+t)}
   else{await until(()=>E[0].run('turnSeat')===seat&&E[0].run('mode')==='i'&&!E[0].api.onlineState().busy&&!E[0].api.onlineState().pending,20000,'IA siège '+seat);E[0].run('ia()')}
   await until(()=>E[0].run('turnSeat')===(seat+1)%4&&E[2].run('turnSeat')===(seat+1)%4&&!E[0].api.onlineState().busy&&!E[2].api.onlineState().busy,25000,'passage de relais après le siège '+seat);
   await until(()=>host.S.applied===S.games[0].last_seq&&friend.S.applied===S.games[0].last_seq,10000,'synchro');
   assert.equal(E[0].snap(),E[2].snap(),'divergence entre hôte et ami au tour '+t+' (siège '+seat+')');
  }
  assert.deepEqual(S.events.filter(e=>e.kind==='place'||e.kind==='skip').map(e=>e.seat).slice(0,8),[0,1,2,3,0,1,2,3],'les poses suivent l’ordre 0→1→2→3');
  assert.ok(S.events.some(e=>e.seat===1&&e.kind==='roll')&&S.events.some(e=>e.seat===3&&e.kind==='roll'),'les IA ont lancé leurs dés via l’hôte');
  assert.equal(E[0].api.onlineState().team2,true);
  /* l'ami ne peut pas piloter une IA */
  await assert.rejects(()=>friend.rpc('play_action',{p_game:S.games[0].id,p_kind:'skip',p_payload:{},p_as_seat:1}),/siège IA non autorisé/);
  /* victoire d'équipe : un siège de l'équipe 0 réclame la victoire → winner 0 */
  await friend.rpc('play_action',{p_game:S.games[0].id,p_kind:'win',p_payload:{}});assert.equal(S.games[0].winner,0);
  host.stop();friend.stop();
  console.log('  A. 2 humains + 2 IA : 12 tours, états identiques, ordre 0→1→2→3, IA pilotées par l’hôte');}
 /* ===== B. quatre humains ===== */
 {const S=server(),E=[engine(),engine(),engine(),engine()];
  const cfg={version:'t'},C=E.map((e,i)=>createCore({sb:S.client('u'+i),game:e.api,cfg,pollMs:15,idleStep:4,idleTimeout:15000}));
  const r=await C[0].createGame({name:'J0',deck:DECKS[0],terrain:'glace',team2:true,aiSeats:[]});
  await C[1].joinGame({code:r.game_code,name:'J1',deck:DECKS[1]});
  assert.equal(S.games[0].status,'waiting','la table attend ses 4 joueurs');
  await C[2].joinGame({code:r.game_code,name:'J2',deck:DECKS[2]});assert.equal(S.games[0].status,'waiting');
  await C[3].joinGame({code:r.game_code,name:'J3',deck:DECKS[3]});
  await until(()=>C.every(c=>c.S.started),20000,'démarrage à 4');
  assert.deepEqual(C.map(c=>c.S.seat),[0,1,2,3]);assert.deepEqual(C.map(c=>c.S.camp),[0,1,0,1]);assert.ok(E.every(e=>!e.api.onlineState().driver||e===E[0]));
  assert.equal(C[1].S.opponent,'J0 & J2');
  await until(()=>E.every(e=>e.snap()===E[0].snap()),5000,'états initiaux');
  for(let t=0;t<8;t++){const seat=t%4;assert.ok(await humanTurn(E[seat],seat),'pose au tour '+t);
   await until(()=>E.every(e=>e.run('turnSeat')===(seat+1)%4&&!e.api.onlineState().busy),25000,'relais siège '+seat);
   await until(()=>C.every(c=>c.S.applied===S.games[0].last_seq),10000,'synchro 4 clients');
   const ref=E[0].snap();E.forEach((e,i)=>assert.equal(e.snap(),ref,'divergence siège '+i+' au tour '+t))}
  /* abandon d'un adversaire = victoire de l'équipe adverse du joueur qui abandonne */
  await C[1].resign();await until(()=>E[0].api.onlineState().over&&E[2].api.onlineState().over,10000,'fin de partie');
  assert.equal(S.games[0].winner,0,'l’équipe 0 gagne quand le siège 1 abandonne');
  C.forEach(c=>c.stop());
  console.log('  B. 4 humains : 8 tours, 4 moteurs identiques, abandon → victoire d’équipe');}
 console.log('PASS: 2 contre 2 en ligne (sièges 0-3, équipes, IA pilotées par l’hôte, abandon, rejets serveur).');process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
