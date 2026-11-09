// Deux joueurs en ligne : deux moteurs séparés, un faux serveur qui imite le SQL de Supabase.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const {createCore,applyTrade,raritiesMatch}=require('../assets/pvp-online.js');
const src=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/g).map(s=>s.replace(/<\/?script>/g,'')).sort((a,b)=>b.length-a.length)[0].replace(/init\(\);\s*$/,'');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const until=async(f,ms=15000)=>{const t=Date.now();while(!f()){if(Date.now()-t>ms)throw new Error('délai dépassé : '+f);await sleep(5)}};

/* ---- faux serveur ---- */
function server(){const games=[],players=[],events=[],trades=[],inv={};let n=0;const id=()=>'id'+(++n);
 const fn={
  create_game(u,a){const g={id:id(),code:('G'+n+'AAAAA').slice(0,6),status:'waiting',seed:Math.floor(Math.random()*2e9),terrain:a.p_terrain,turn_seat:0,last_seq:0,winner:null};games.push(g);players.push({game_id:g.id,seat:0,user_id:u,name:a.p_name,deck:a.p_deck});return[{game_id:g.id,game_code:g.code}]},
  join_game(u,a){const g=games.find(x=>x.code===a.p_code.toUpperCase());if(!g)throw Error('code inconnu');if(players.some(p=>p.game_id===g.id&&p.user_id===u))return g.id;if(g.status!=='waiting')throw Error('partie déjà commencée');players.push({game_id:g.id,seat:1,user_id:u,name:a.p_name,deck:a.p_deck});g.status='playing';return g.id},
  play_action(u,a){const p=players.find(x=>x.game_id===a.p_game&&x.user_id===u);if(!p)throw Error('tu ne fais pas partie de cette partie');const g=games.find(x=>x.id===a.p_game);if(g.status!=='playing')throw Error('partie non active');
   if(!['hello','roll','place','move','skip','resign','win'].includes(a.p_kind))throw Error('action inconnue');
   if(['roll','place','move','skip'].includes(a.p_kind)&&g.turn_seat!==p.seat)throw Error('ce n\'est pas ton tour');
   g.last_seq++;events.push({game_id:g.id,seq:g.last_seq,seat:p.seat,kind:a.p_kind,payload:a.p_payload||{}});
   if(['place','skip'].includes(a.p_kind))g.turn_seat=1-g.turn_seat;if(['resign','win'].includes(a.p_kind)){g.status='finished';g.winner=a.p_kind==='resign'?1-p.seat:p.seat}return g.last_seq},
  roll_dice(u,a){if(a.p_n<1||a.p_n>4)throw Error('nombre de dés invalide');const v=[...Array(a.p_n)].map(()=>1+Math.floor(Math.random()*6));fn.play_action(u,{p_game:a.p_game,p_kind:'roll',p_payload:{values:v}});return v},
  finish_draw(u,a){const p=players.find(x=>x.game_id===a.p_game&&x.user_id===u);if(!p)throw Error('non participant');const g=games.find(x=>x.id===a.p_game);if(g.status==='finished')return g.last_seq;g.last_seq++;events.push({game_id:g.id,seq:g.last_seq,seat:p.seat,kind:'hello',payload:{result:'draw',version:'182'}});g.status='finished';g.winner=null;return g.last_seq},
  /* échanges */
  create_trade(u,a){inv[u]=a.p_inventory;const t={id:id(),code:('T'+n+'AAAAA').slice(0,6),status:'open',host_id:u,guest_id:null,host_name:a.p_name,guest_name:null,host_offer:[],guest_offer:[],host_ok:false,guest_ok:false};trades.push(t);return[{trade_id:t.id,trade_code:t.code}]},
  join_trade(u,a){const t=trades.find(x=>x.code===a.p_code.toUpperCase());if(!t)throw Error('code inconnu');inv[u]=a.p_inventory;t.guest_id=u;t.guest_name=a.p_name;return t.id},
  set_offer(u,a){const t=trades.find(x=>x.id===a.p_trade),s=t.host_id===u?'host':'guest';if(a.p_offer.length>5)throw Error('maximum 5 dés par échange');const c={};a.p_offer.forEach(i=>c[i]=(c[i]||0)+1);for(const i in c)if((inv[u][i]||0)<c[i])throw Error('tu ne possèdes pas ces dés');t[s+'_offer']=a.p_offer;t.host_ok=t.guest_ok=false},
  confirm_trade(u,a){const t=trades.find(x=>x.id===a.p_trade),s=t.host_id===u?'host':'guest';t[s+'_ok']=a.p_confirm;if(t.host_ok&&t.guest_ok){const r=i=>1+i%3;if(!raritiesMatch(t.host_offer,t.guest_offer,r))throw Error('raretés différentes');t.status='done';return'done'}return'open'},
  cancel_trade(u,a){trades.find(x=>x.id===a.p_trade).status='cancelled'}};
 const tables={games,game_players:players,game_events:events,trades};
 const table=name=>({select(){const f=[];let ord=null;const b={eq(c,v){f.push(r=>r[c]===v);return b},gt(c,v){f.push(r=>r[c]>v);return b},order(c,o){ord=[c,o&&o.ascending===false?-1:1];return b},
   single(){return run().then(x=>x.data[0]?{data:x.data[0],error:null}:{data:null,error:{message:'introuvable'}})},then(a,r){return run().then(a,r)}};
   function run(){let o=tables[name].filter(r=>f.every(g=>g(r)));if(ord)o=o.sort((a,b)=>(a[ord[0]]>b[ord[0]]?1:-1)*ord[1]);return Promise.resolve({data:JSON.parse(JSON.stringify(o)),error:null})}return b}});
 return{games,events,client(uid){return{auth:{getSession:async()=>({data:{session:null}}),signInAnonymously:async()=>({data:{user:{id:uid}},error:null})},
  rpc:async(name,a)=>{try{return{data:fn[name](uid,a),error:null}}catch(e){return{data:null,error:{message:e.message}}}},from:table,channel(){const c={on(){return c},subscribe(){return c},unsubscribe(){}};return c}}}}}

/* ---- moteur (chronomètres accélérés) ---- */
function engine(){const els=new Map(),P=()=>new Proxy(function(){},{get:(t,p)=>p==='children'?[]:p==='length'?0:p===Symbol.toPrimitive?()=>0:P(),set:()=>true,apply:()=>P()});
 const c=vm.createContext({window:{dispatchEvent(){}},Event,document:{getElementById(i){if(!els.has(i))els.set(i,P());return els.get(i)}},fetch:()=>Promise.resolve({ok:false}),
  setTimeout:(f,ms)=>setTimeout(f,Math.min(ms,3)),clearTimeout,setInterval:f=>setInterval(f,1),clearInterval,console,Date,Math});
 vm.runInContext(src,c);vm.runInContext("render=()=>{};landCube=()=>{};showRollDice=()=>{};",c);
 const run=x=>vm.runInContext(x,c);
 return{run,api:run('window.hackeniaGame'),snap:()=>run("JSON.stringify({b,cr:cr.map(c=>({o:c.o,x:c.x,y:c.y,id:c.id,lv:c.lv})),h:pl.map(p=>p.h),q:pl.map(p=>p.q.length),s:pl.map(p=>p.s),cur,kills,bonus,over})")}}

(async()=>{
 const S=server(),A=engine(),B=engine();
 const deckA=[0,1,2,3,4,5,6,7,8,9],deckB=[10,11,12,13,14,15,16,17,18,19];
 const cfg={version:'t'},mk=(sv,uid,E)=>createCore({sb:sv.client(uid),game:E.api,cfg,pollMs:15,idleStep:4,idleTimeout:12000});
 const cA=mk(S,'ua',A),cB=mk(S,'ub',B);
 const r=await cA.createGame({name:'Alice',deck:deckA,terrain:'feu'});assert.equal(r.game_code.length,6);
 await cB.joinGame({code:r.game_code,name:'Bob',deck:deckB});
 await until(()=>cA.S.started&&cB.S.started);
 assert.equal(cA.S.seat,0);assert.equal(cB.S.seat,1);assert.equal(cB.S.opponent,'Alice');
 assert.equal(A.snap(),B.snap(),'états initiaux identiques');
 await until(()=>cA.S.applied>=2&&cB.S.applied>=2);assert.ok(cA.S.versionOK&&cB.S.versionOK,'versions compatibles');
 /* 10 tours alternés : déplacement (si possible) puis pose d'un dé */
 let moves=0;
 for(let t=0;t<10;t++){
  const E=t%2?B:A,seat=t%2;
  await until(()=>E.run('cur')===seat&&E.run('mode')==='i'&&!E.api.onlineState().pending);
  const mv=E.run("(()=>{for(const c of cr.filter(c=>c.o===cur)){const R=bfs(c),k=Object.keys(R).find(k=>!at(+k.split(',')[0],+k.split(',')[1]));if(!k)continue;const ox=c.x,oy=c.y;movePlan={unit:c,x:+k.split(',')[0],y:+k.split(',')[1]};confirmMove();if(c.x!==ox||c.y!==oy||!cr.includes(c))return 1}return 0})()");moves+=mv;
  if(mv)await until(()=>E.run('mode')==='i');
  const placed=E.run("(()=>{const m=pl[cur].h[0],p=firstValid(m,cur?0:2);if(!p)return 0;die=m;hi=0;rot=cur?0:2;pc=p;mode='p';lancer();return 1})()");
  assert.ok(placed,'pose possible au tour '+t);
  await until(()=>A.run('cur')===1-seat&&B.run('cur')===1-seat&&A.run('mode')==='i'&&B.run('mode')==='i'&&cA.S.queue.length===0&&cB.S.queue.length===0&&cA.S.applied===cB.S.applied);
  assert.equal(A.snap(),B.snap(),'divergence au tour '+t);
 }
 console.log('PASS: 10 tours en ligne identiques sur les deux moteurs ('+moves+' déplacements) ; scores',A.run('pl.map(p=>p.s)'),'créatures',A.run('cr.length'));
 assert.ok(!cA.S.error&&!cB.S.error,'aucune erreur : '+cA.S.error+cB.S.error);
 /* Match nul : deux clients, aucun faux gagnant et un résultat persistant côté serveur. */
 const drawServer=server(),DA=engine(),DB=engine(),dA=createCore({sb:drawServer.client('da'),game:DA.api,cfg,pollMs:15}),dB=createCore({sb:drawServer.client('db'),game:DB.api,cfg,pollMs:15});
 const drawRoom=await dA.createGame({name:'DA',deck:deckA,terrain:'terre'});await dB.joinGame({code:drawRoom.game_code,name:'DB',deck:deckB});await until(()=>dA.S.started&&dB.S.started);await until(()=>dA.S.applied>=2&&dB.S.applied>=2);
 DA.run('kills=[3,3];chkKills()');DB.run('kills=[3,3];chkKills()');await until(()=>drawServer.games[0].status==='finished');await until(()=>dA.S.status==='draw'&&dB.S.status==='draw');assert.equal(drawServer.games[0].winner,null);assert.equal(drawServer.events.filter(e=>e.payload.result==='draw').length,1);assert.equal(drawServer.events.filter(e=>e.kind==='win').length,0);assert.equal(DA.api.onlineState().result.outcome,'draw');assert.equal(DB.api.onlineState().result.outcome,'draw');dA.stop();dB.stop();
 console.log('PASS: PVP draw persists without selecting a winner or sending win.');
 /* un joueur qui joue hors de son tour est refusé par le serveur */
 B.run("cur=1");const bad=await cB.rpc('play_action',{p_game:cB.S.gameId,p_kind:'move',p_payload:{}}).then(()=>'accepté',e=>e.message);console.log('hors tour →',bad);
 /* abandon */
 await cA.resign();await until(()=>B.api.onlineState().over);
 console.log('PASS: abandon de A détecté par B');
 /* échanges */
 const sv2=server(),H=createCore({sb:sv2.client('h'),game:{monsters:[]},cfg,pollMs:15}),G=createCore({sb:sv2.client('g'),game:{monsters:[]},cfg,pollMs:15});
 const prof={inventory:{0:2,3:1,5:1},decks:[{id:'d',name:'D',dice:[0,0,3]}]},prof2={inventory:{1:1,4:1,6:2},decks:[]};
 const t=await H.tradeCreate({name:'Hôte',inventory:prof.inventory});await G.tradeJoin({code:t.trade_code,name:'Invité',inventory:prof2.inventory});
 await H.setOffer([0]);await G.setOffer([1]);   // ids 0 et 1 : raretés 1 et 2 → différentes
 assert.ok(!raritiesMatch([0],[1],i=>1+i%3));
 await G.setOffer([6]);                          // 0 et 6 : même rareté
 assert.ok(raritiesMatch([0],[6],i=>1+i%3));
 await H.confirm(true);const st=await G.confirm(true);assert.equal(st,'done');await H.tradeRefresh?.();
 const next=applyTrade(prof,[0],[6]);assert.deepEqual(next.inventory,{0:1,3:1,5:1,6:1});
 const next2=applyTrade(prof,[0,0],[1,1]);assert.deepEqual(next2.decks[0].dice,[3],'le deck perd les dés échangés');
 assert.throws(()=>applyTrade(prof,[9],[1]));
 console.log('PASS: échange créé, rejoint, offres, confirmation à deux, mise à jour de collection et des decks');
 [cA,cB,H,G].forEach(c=>{c.stop();c.tradeStop()});process.exit(0)
})().catch(e=>{console.error('ÉCHEC :',e.message||e);process.exit(1)});
