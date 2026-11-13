// v268 — dés double et triple élément : plusieurs bébémentaires sur la même case. Bonus de terrain si le terrain favorise l'un des éléments,
// bonus de voisin si l'un des éléments domine une dalle voisine ; 2 points de force en moins ; modèles et médaillons livrés.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const el=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}}),els=new Map();
const c=vm.createContext({window:{dispatchEvent(){}},Event,document:{getElementById(i){if(!els.has(i))els.set(i,el());return els.get(i)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,''),c);const run=s=>vm.runInContext(s,c);
const g=c.window.hackeniaGame,M=g.monsters,manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/manifest.json'),'utf8'));
const multi=M.map((d,i)=>[i,d]).filter(([,d])=>d.els&&!d.shiny);
assert.equal(multi.length,8,'3 duos rares + 3 duos légendaires + 2 trios divins');
const sum=d=>d.c.reduce((a,t)=>a+t[2],0);
for(const [i,d] of multi){const r=g.rarity(d),n=d.els.length;
 assert.ok(n===2?(r===3||r===5):(n===3&&r===6),d.cn+' : '+n+' éléments pour la rareté '+r);
 assert.equal(new Set(d.els).size,n,d.cn+' : éléments différents');assert.equal(d.el,d.els[0]);
 assert.equal(sum(d),r===3?18:r===5?26:30,d.cn+' : 2 points de force en moins (rare 18, légendaire 26, divin 30)');
 assert.equal(d.c.length,{3:5,5:6,6:6}[r],d.cn+' : nombre de dalles de sa rareté');
 const info=manifest.creatures[d.modelKey];assert.ok(info?.parts?.length===n&&info.parts.every(k=>manifest.creatures[k]?.glb),d.cn+' : un modèle par bébémentaire');
 assert.deepEqual(info.parts,d.els.map(e=>'bebementaire-'+e),d.cn+' : modèles dans l’ordre des éléments');
 for(const s of[128,512])assert.ok(fs.existsSync(path.join(root,`assets/characters/${d.portrait}-${s}.webp`)),d.cn+' médaillon '+s)}
// Règles de bonus sur le plateau : duo eau + feu
const setup=ter=>run(`TER=TL.indexOf('${ter}');b=Array.from({length:H},()=>Array(W).fill(null));cr=[];lotus=[]`);
const mk=(x,y,o,v,m)=>run(`b[${y}][${x}]={o:${o},el:M[${m}].el,v:${v},lv:M[${m}].lv,id:${100+x*10+y}${M[m].els?`,ex:${JSON.stringify(M[m].els.slice(1))}`:''}}`);
const bonus=(x,y)=>JSON.parse(run(`JSON.stringify(tileBonuses(${x},${y}))`));
const idx=n=>M.findIndex(d=>d.cn===n);
const duo=idx('Duo de la Vapeur'),trio=idx('Trio du Brasier'),plain=idx('Bébémentaire de glace');
setup('eau');mk(3,5,0,4,duo);assert.deepEqual(bonus(3,5),{terrainBonus:1,neighborBonus:0},'terrain eau favorise l’un des deux éléments');
setup('glace');mk(3,5,0,4,duo);assert.equal(bonus(3,5).terrainBonus,0,'terrain glace : ni eau ni feu');
setup('feu');mk(3,5,0,4,duo);assert.equal(bonus(3,5).terrainBonus,1,'terrain feu favorise l’autre élément');
// voisin : eau domine feu, feu domine glace ; le duo eau+feu gagne +1 à côté d'une dalle de feu (par l'eau) ou de glace (par le feu)
setup('terre');mk(3,5,0,4,duo);mk(4,5,1,3,idx('Bébémentaire de feu'));assert.equal(bonus(3,5).neighborBonus,1,'l’eau domine le feu voisin');
setup('terre');mk(3,5,0,4,duo);mk(4,5,1,3,plain);assert.equal(bonus(3,5).neighborBonus,1,'le feu domine la glace voisine');
setup('terre');mk(3,5,0,4,duo);mk(4,5,1,3,idx('Bébémentaire de vent'));assert.equal(bonus(3,5).neighborBonus,0,'le vent ne rapporte rien à eau + feu');
// trio feu + terre + foudre : terrain de foudre favorisé, voisin glace (dominée par le feu)
setup('foudre');mk(3,5,0,4,trio);assert.equal(bonus(3,5).terrainBonus,1,'terrain foudre favorise le trio');
setup('terre');mk(3,5,0,4,trio);mk(4,5,1,3,plain);assert.deepEqual(bonus(3,5),{terrainBonus:1,neighborBonus:1},'terre favorisée par la terre ; feu domine la glace voisine');
// aperçu et schéma de la main avec le terrain
setup('feu');run(`die=${duo}`);assert.ok(run('handNet(die,2,false)')&&!/NaN/.test(String(run('handNet(die,2,false)'))));
// libellés
assert.ok(html.includes("D.els?(D.els.length>2?'Triple élément':'Double élément')"),'libellés Double / Triple élément');
// collection : les huit dés sont rangés dans la famille des bébémentaires
const order=require(path.join(root,'assets/collection-order-v223.js'));assert.equal(order.family(M[duo]),'bebementaire');assert.equal(order.family(M[idx('Bébémentaire de feu')]),'bebementaire');
console.log('PASS: 8 dés double et triple élément (3 duos rares, 3 duos légendaires, 2 trios divins) : bonus de terrain et de voisin sur plusieurs éléments, un modèle par bébémentaire, médaillons et famille de collection.');
