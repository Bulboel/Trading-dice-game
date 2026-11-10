// v228 — Propositions de dés : règles de l'éditeur (identiques aux dés du jeu), sécurité Supabase, intégration.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const R=require(path.join(root,'assets/dice-rules-v228.js'));
const html=read('index.html'),el=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}}),els=new Map();
const c=vm.createContext({window:{dispatchEvent(){}},Event,document:{getElementById(i){if(!els.has(i))els.set(i,el());return els.get(i)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,''),c);const g=c.window.hackeniaGame,defs=g.monsters;
// Tous les dés du jeu respectent les règles de l'éditeur.
defs.forEach((d,i)=>{if(d.pure)return;const r=R.check({rarity:g.rarity(d),element:d.multi?'multi':d.el,tiles:d.c},defs.filter((x,j)=>j!==i));assert.ok(r.ok,d.cn+' : '+r.checks.filter(x=>!x.ok).map(x=>x.text).join(' | '))});
// Dés proposés : refus des dés trop forts, non reliés, trop longs, et des formes légendaires déjà prises.
assert.ok(R.check({rarity:1,element:'feu',tiles:[[0,0,1],[1,0,2],[1,1,3]]}).ok);
assert.ok(!R.check({rarity:1,element:'feu',tiles:[[0,0,3],[1,0,3],[1,1,3]]}).ok,'Too strong');
assert.ok(!R.check({rarity:1,element:'feu',tiles:[[0,0,1],[2,0,2],[1,1,3]]}).ok,'Not connected');
assert.ok(!R.check({rarity:2,element:'eau',tiles:[[0,0,1],[0,1,2],[0,2,3],[0,3,4]]}).ok,'Too long');
assert.ok(R.check({rarity:1,element:'multi',tiles:[[0,0,1],[0,1,1],[1,1,2]]}).ok,'Multi-element costs 2 points');
const gliska=defs.find(d=>d.cn==='Gliska');assert.ok(!R.check({rarity:5,element:'foudre',tiles:gliska.c},defs).ok,'Existing legendary shape refused');
// Sécurité côté serveur.
const sql=read('online/sql/03-dice-submissions.sql');
for(const k of['enable row level security','is_hackenia_admin','Une seule proposition par jour','rights_ok   boolean not null check (rights_ok)',"bucket_id = 'dice-submissions' and (storage.foldername(name))[1] = (select auth.uid())::text",'public, file_size_limit','status = \'pending\''])assert.ok(sql.includes(k),'SQL: '+k);
assert.ok(!/service_role/.test(read('assets/submit-v228.js')),'No secret key in the client');
const sub=read('assets/submit-v228.js');assert.ok(sub.includes('MIN_LEVEL=5')&&sub.includes('REWARD_GOLD=200')&&sub.includes("storageKey:'hackenia-admin'"),'Level 5, reward, separate admin session');
const portal=read('assets/portal-v159.js');assert.ok(portal.includes("['propose','admin'")&&portal.includes('data-action="propose"')&&portal.includes('creator-badge'));
console.log('PASS: editor rules match every game die and refuse unbalanced ones; RLS, daily limit, rights, private storage; level 5, creator reward, separate admin session.');
