// Sauvegarde en ligne (v204) : faux Supabase qui reproduit online/sql/02-cloud-save.sql (RLS par joueur, codes hachés, 10 essais par heure).
const assert=require('assert'),path=require('path'),crypto=require('crypto');
const {createCloud,summaryOf}=require(path.join(__dirname,'../assets/cloud-v204.js'));

function server(){const saves=new Map(),codes=new Map(),attempts=[];let n=0,down=false,missing=false;
 const hash=c=>crypto.createHash('sha256').update(String(c).toUpperCase().replace(/^HACK/,'').replace(/[^A-Z0-9]/g,'')).digest('hex');
 const fail=()=>missing?{error:{code:'PGRST205',message:"Could not find the table 'public.player_saves'"}}:down?(()=>{throw new TypeError('Failed to fetch')})():null;
 function client(){let uid=null;
  const throttle=()=>{if(attempts.filter(a=>a.uid===uid).length>=10)return{error:{message:'Trop de tentatives : réessayez dans une heure'}};attempts.push({uid});return null};
  return{auth:{getSession:async()=>({data:{session:uid?{user:{id:uid}}:null}}),signInAnonymously:async()=>{uid='user-'+(++n);return{data:{user:{id:uid}}}}},
   from:()=>({select:()=>({eq:(k,v)=>({maybeSingle:async()=>fail()||{data:saves.has(v)?structuredClone(saves.get(v)):null}})}),
    upsert:row=>({select:()=>({single:async()=>{const f=fail();if(f)return f;assert.equal(row.user_id,uid,'RLS: only your own save');saves.set(uid,structuredClone(row));return{data:{rev:row.rev}}}})})}),
   rpc:async(name,args)=>{const f=fail();if(f)return f;
    if(name==='create_recovery_code'){if(!saves.has(uid))return{error:{message:'Aucune sauvegarde'}};for(const [h,o] of codes)if(o===uid)codes.delete(h);const raw=crypto.randomBytes(12).toString('hex').slice(0,12).toUpperCase();codes.set(hash(raw),uid);return{data:'HACK-'+raw.slice(0,4)+'-'+raw.slice(4,8)+'-'+raw.slice(8)}}
    const t=throttle();if(t)return t;const owner=codes.get(hash(args.p_code));if(!owner||!saves.has(owner))return{data:null};const s=saves.get(owner);
    if(name==='peek_recovery_code')return{data:{summary:s.summary,updated_at:s.updated_at,same:owner===uid}};
    if(name==='claim_recovery_code'){if(owner!==uid){const mine=saves.get(uid);saves.set(uid,{...structuredClone(s),user_id:uid,rev:(mine?.rev||s.rev)+1});for(const [h,o] of codes)if(o===uid)codes.delete(h);codes.set(hash(args.p_code),uid)}return{data:{data:structuredClone(s.data),summary:s.summary}}}}}}
 return{client,saves,codes,set down(v){down=v},set missing(v){missing=v}}}
function device(srv,profile){const store=new Map(),timers=[];let p=structuredClone(profile);const restored=[];const sb=srv.client();
 const cloud=createCloud({getClient:async()=>sb,portal:{profile:()=>p,restore:x=>{p=structuredClone(x);restored.push(x);return true}},store:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},schedule:(f,ms)=>{timers.push({f,ms});return timers.length},cancel(){},now:()=>1e12});
 return{cloud,store,timers,restored,get p(){return p},set p(v){p=v},flush:async()=>{let i;while((i=timers.findIndex(t=>t.ms<=4000))>=0){const [t]=timers.splice(i,1);await t.f();await new Promise(r=>setImmediate(r))}}}}
const base={version:1,gold:120,inventory:{3:2,5:1},decks:[{id:'a',name:'Deck',dice:[3,3,5]}],story:{done:{c1p1:true}}};
(async()=>{
 // 1. Premier lancement : la progression est envoyée, aucun compte à créer.
 const srv=server(),A=device(srv,base);await A.cloud.start();assert.equal(A.cloud.state.status,'synced');assert.equal(srv.saves.size,1);
 const row=[...srv.saves.values()][0];assert.deepEqual(row.summary,{gold:120,dice:3,kinds:2,decks:1,story:1});assert.equal(row.rev,1);
 // 2. Un changement local est envoyé après quelques secondes (rev qui augmente).
 A.p={...A.p,gold:150};A.cloud.changed();assert.equal(A.cloud.state.status,'pending');await A.flush();assert.equal(srv.saves.get(A.cloud.state.uid).data.gold,150);assert.equal(srv.saves.get(A.cloud.state.uid).rev,2);
 // 3. Hors ligne : rien n'est perdu, nouvel essai programmé, puis envoi au retour du réseau.
 srv.down=true;A.p={...A.p,gold:160};A.cloud.changed();await A.flush();assert.equal(A.cloud.state.status,'offline');assert.ok(A.timers.some(t=>t.ms===60000),'Retry is scheduled');
 srv.down=false;await A.cloud.sync();assert.equal(A.cloud.state.status,'synced');assert.equal(srv.saves.get(A.cloud.state.uid).data.gold,160);
 // 4. Code de récupération : créé sur A, aperçu et récupération sur un nouveau téléphone B.
 const code=await A.cloud.createCode();assert.match(code,/^HACK-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);assert.ok(![...srv.codes.keys()].includes(code),'Only the hash is stored');
 const B=device(srv,{version:1,gold:50,inventory:{},decks:[]});await B.cloud.start();assert.equal(B.cloud.state.status,'synced');
 const info=await B.cloud.peek(code.toLowerCase().replace(/-/g,' '));assert.equal(info.summary.gold,160,'Codes are case and dash insensitive');assert.equal(info.same,false);
 assert.equal(await B.cloud.claim(code),true);assert.equal(B.p.gold,160);assert.equal(B.restored.length,1);assert.equal(B.cloud.state.status,'synced');
 assert.equal(srv.saves.get(B.cloud.state.uid).data.gold,160);assert.equal((await B.cloud.peek(code)).same,true,'The code now follows the recovered progress');
 // B continue à jouer : ses envois ne touchent pas la copie de A.
 B.p={...B.p,gold:170};B.cloud.changed();await B.flush();assert.equal(srv.saves.get(B.cloud.state.uid).data.gold,170);assert.equal(srv.saves.get(A.cloud.state.uid).data.gold,160);
 // 5. Code faux et limite d'essais.
 assert.equal(await B.cloud.peek('HACK-AAAA-BBBB-CCCC'),null);let blocked=false;for(let i=0;i<12;i++){try{await B.cloud.peek('HACK-ZZZZ-ZZZZ-ZZZZ')}catch(e){blocked=/Trop de tentatives/.test(e.message)}}assert.ok(blocked,'Guessing is throttled');
 // 6. Conflit : sauvegarde en ligne inconnue de cet appareil → on demande, on n'écrase rien.
 const C=device(srv,base);await C.cloud.start();const uidC=C.cloud.state.uid;srv.saves.set(uidC,{...srv.saves.get(uidC),data:{...base,gold:999},summary:summaryOf({...base,gold:999}),rev:9});
 C.store.clear();const C2=device(srv,base);C2.cloud.state.uid=null;// même compte, métadonnées perdues
 const sb2=srv.client();await sb2.auth.signInAnonymously();const conflictDevice=createCloud({getClient:async()=>({...sb2,auth:{getSession:async()=>({data:{session:{user:{id:uidC}}}})},from:sb2.from,rpc:sb2.rpc}),portal:{profile:()=>base,restore:x=>(conflictDevice._r=x,true)},store:{getItem:()=>null,setItem(){}},schedule:()=>0,cancel(){},now:()=>1e12});
 await conflictDevice.start();assert.equal(conflictDevice.state.status,'conflict');assert.equal(conflictDevice.state.conflict.remote.summary.gold,999);assert.equal(srv.saves.get(uidC).data.gold,999,'Nothing overwritten while undecided');
 conflictDevice.changed();assert.equal(srv.saves.get(uidC).data.gold,999,'No push during a conflict');
 await conflictDevice.resolve('remote');assert.equal(conflictDevice._r.gold,999);assert.equal(conflictDevice.state.status,'synced');
 // 7. Serveur pas encore configuré (SQL non exécuté) : le jeu continue normalement, sans erreur ni nouvel essai.
 const srv2=server();srv2.missing=true;const D=device(srv2,base);await D.cloud.start();assert.equal(D.cloud.state.status,'unavailable');D.cloud.changed();assert.equal(D.timers.filter(t=>t.ms===4000).length,0);
 console.log('PASS: silent anonymous cloud save, debounced pushes, offline retry, hashed recovery codes (peek, claim, code follows progress), throttled guessing, conflict asks before replacing, graceful when the server is not configured.');
})().catch(e=>{console.error(e);process.exit(1)});
