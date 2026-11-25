// v449 — Bubulles offertes par l'administrateur : bouton « +100 Bubulles » dans la liste des joueurs (autant de fois que voulu),
// versées au joueur une seule fois grâce au serveur (claim_gold_gifts marque chaque cadeau comme reçu).
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');const r=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const sql=r('online/sql/15-bubulles.sql');
for(const k of['create table if not exists public.gold_gifts','admin_give_gold','claim_gold_gifts','is_hackenia_admin()','claimed_at = now()','claimed_at is null','revoke all on function public.admin_give_gold'])assert.ok(sql.includes(k),'SQL : '+k);
assert.ok(!/create policy[^;]*gold_gifts/i.test(sql),'aucune policy : table accessible seulement via les fonctions');
const pr=r('assets/premium-v315.js');
assert.ok(pr.includes('data-a="gold"')&&pr.includes("rpc('admin_give_gold',{p_user:id,p_amount:100})"),'bouton admin +100 Bubulles');
assert.ok(!/data-a=gold[^\n]*armed/.test(pr),'pas de double confirmation : un appui = 100 Bubulles');
const po=r('assets/portal-v159.js');const src=po.match(/let giftBusy=false[\s\S]*?finally\{giftBusy=false\}\}/)[0];
assert.ok(/async function syncPremium\(\)\{[^\n]*claimGoldGifts\(\)/.test(po),'réclamation au démarrage et au retour en ligne');
(async()=>{
 let server=[100,100,100],toasts=[],profile={gold:50};
 const c=vm.createContext({storageOK:true,recovery:false,navigator:{onLine:true},Number,structuredClone,
  get profile(){return profile},commit:n=>{profile=n;return true},questToast:t=>toasts.push(t),
  window:{HackeniaOnline:{session:async()=>({sb:{rpc:async name=>{assert.equal(name,'claim_gold_gifts');const n=server.reduce((a,b)=>a+b,0);server=[];return{data:n,error:null}}}})}}});
 vm.runInContext(src.replace('let giftBusy','var giftBusy')+';this.claim=claimGoldGifts',c);
 await c.claim();assert.equal(profile.gold,350,'300 Bubulles versées');assert.equal(toasts.length,1);assert.ok(toasts[0].includes('+300'));
 await c.claim();assert.equal(profile.gold,350,'déjà reçues : rien de plus');assert.equal(toasts.length,1);
 c.recovery=true;server=[100];await c.claim();assert.equal(profile.gold,350,'pas de réclamation en mode récupération (le cadeau reste en attente)');assert.equal(server.length,1);
 console.log('PASS: v449 — +100 Bubulles par l’admin, autant de fois que voulu, versées une seule fois au joueur.');
})().catch(e=>{console.error(e);process.exit(1)});
