// v254 — PVP : 2 minutes sans jouer pendant son tour = défaite ; l'adversaire réclame la victoire si l'appli inactive est fermée.
// Le bandeau en ligne se cache vraiment et ne reste jamais sur le menu.
const fs=require('fs'),path=require('path'),assert=require('assert');const root=path.join(__dirname,'..');
const {createCore}=require(path.join(root,'assets/pvp-online.js'));
function make(cur){const calls=[],ends=[];const st={over:false,busy:false,mode:'i',cur};
 const sb={rpc:async(n,a)=>{calls.push([n,a]);return{data:null}},auth:{getSession:async()=>({data:{session:{user:{id:'me'}}}})}};
 const game={monsters:Array(104),onlineState:()=>st,endOnline:(w,t)=>{ends.push([w,t]);st.over=true}};
 const core=createCore({sb,game,cfg:{}});Object.assign(core.S,{started:true,seat:0,gameId:'g',lastAct:0,lastCur:cur});return{core,st,calls,ends}}
(async()=>{
 // Mon tour, inactif 2 min → défaite + abandon envoyé
 let m=make(0);m.core.idleCheck(60000);assert.strictEqual(m.core.S.idleLeft,60);assert.strictEqual(m.ends.length,0);
 m.core.idleCheck(120000);await new Promise(r=>setTimeout(r,10));
 assert.deepStrictEqual(m.ends[0][0],1);assert.ok(/Temps écoulé/.test(m.ends[0][1]));assert.ok(m.calls.some(([n,a])=>n==='play_action'&&a.p_kind==='resign'&&a.p_payload.reason==='idle'));
 // Tour adverse : pas avant 2 min 15, puis victoire réclamée
 m=make(1);m.core.idleCheck(125000);assert.strictEqual(m.ends.length,0);m.core.idleCheck(135000);await new Promise(r=>setTimeout(r,10));
 assert.strictEqual(m.ends[0][0],0);assert.ok(m.calls.some(([n,a])=>a.p_kind==='win'&&a.p_payload.reason==='idle'));
 // Une animation en cours ou un changement de tour remet le compteur à zéro
 m=make(0);m.st.busy=true;m.core.idleCheck(119000);m.st.busy=false;m.core.idleCheck(200000);assert.strictEqual(m.ends.length,0);assert.strictEqual(m.core.S.idleLeft,39);
 m.st.cur=1;m.core.idleCheck(201000);assert.strictEqual(m.core.S.idleLeft,null);
 // Bandeau
 const css=fs.readFileSync(path.join(root,'assets/pvp-online.css'),'utf8'),js=fs.readFileSync(path.join(root,'assets/pvp-online.js'),'utf8');
 assert.ok(css.includes('#pvp-hud[hidden],body.portal-open #pvp-hud{display:none!important}'));
 assert.ok(js.includes('if(inMenu&&S.started&&S.ended)core.leave();'));
 console.log('v254 online idle OK');process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
