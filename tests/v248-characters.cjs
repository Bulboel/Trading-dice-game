// v248 — Hydrelithe majeure de terre (divine), Mineurs (peu communs) et Araignées (communes), décor de la grotte, deck optimal, dés bonus cochés d'office.
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('index.html'),portal=read('assets/portal-v159.js'),cave=read('assets/cave-v246.js'),settings=read('assets/settings-v171.js'),me=read('assets/match-end-v198.js'),man=JSON.parse(read('assets/manifest.json'));
const el=()=>new Proxy({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){},contains(){return false}},dataset:{}},{get(t,k){return k in t?t[k]:()=>null},set(t,k,v){t[k]=v;return true}});
const c=vm.createContext({window:{dispatchEvent(){},addEventListener(){}},document:{getElementById:()=>el(),querySelector:()=>null,querySelectorAll:()=>[],createElement:()=>el(),addEventListener(){}},localStorage:{getItem:()=>null,setItem(){}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},console,Date,Math,Event:class{},CustomEvent:class{}});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,''),c);const M=vm.runInContext('M',c);
const by=n=>M.filter(d=>d.cn===n||d.cn.startsWith(n+' '));
const hm=M[90];assert.equal(hm.cn,'Hydrelithe majeure de terre');assert.equal(hm.rarity,6);assert.equal(hm.el,'terre');assert.equal(hm.modelKey,'hydrelithe-majeure');
const mi=M.slice(91,97),ar=M.slice(97,104);assert.ok(mi.every(d=>d.modelKey==='mineur'&&d.rarity===2),'Six peu communs Mineurs');assert.ok(ar.every(d=>d.modelKey==='araignee'&&d.rarity===1),'Seven common Araignées');
assert.ok(!M.some(d=>['mineur','araignee'].includes(d.modelKey)&&(d.rarity>2||['metal','stone'].includes(d.variant?.kind))),'Never statue/silver/gold nor above peu commun');
assert.equal(new Set(mi.map(d=>d.el)).size,6);assert.equal(new Set(ar.map(d=>d.el)).size,7);
for(const k of['hydrelithe-majeure','mineur','araignee']){assert.ok(fs.existsSync(path.join(root,'assets',man.creatures[k].glb)),k+' web model');assert.ok(fs.statSync(path.join(root,'assets',man.creatures[k].glb)).size<4e6,k+' model stays light')}
for(const d of[hm,...mi,...ar])for(const s of[128,512])assert.ok(fs.existsSync(path.join(root,'assets/characters',d.portrait+'-'+s+'.webp')),d.cn+' portrait '+s);
assert.ok(cave.includes("helpers.spawnWalker('mineur',.9,'walk')")&&cave.includes("helpers.spawnWalker('mineur',.9,'spell')")&&cave.includes("helpers.spawnWalker('araignee'"),'Real miners and spiders in the cave');
assert.ok(portal.includes('function optimalDeck(')&&portal.includes('data-action="optimal-deck"')&&portal.includes('data-action="play-optimal"'),'Optimal deck in Mes decks and Jouer');
assert.ok(/terrainList=\[\['ville'/.test(portal),'Neutral terrain listed first for beginners');
assert.ok(settings.includes('autoBonus:true')&&html.includes("autoBonus===false?0:bonus[cur]")&&portal.includes('name="autoBonus"'),'Bonus dice auto-selected, can be disabled');
assert.ok(me.includes('mb-tears')&&!me.includes('mb-cloud'),'Sad Messire Balai cries, no more grey cloud');
// Deck optimal : simulation de l'algorithme sur un petit inventaire.
const src=portal.slice(portal.indexOf('function optimalDeck('),portal.indexOf('function saveOptimalDeck('));const ctx={defs:M,profile:{inventory:{90:1,91:2,97:3,0:1,1:1,36:1,37:1,38:1,39:1,40:1,41:1,56:1}},validId:n=>n>=0&&n<M.length,canAddRarity:(d,i)=>{const lim={6:1,5:1,7:2,3:4},r=M[i].rarity??M[i].lv;return lim[r]===undefined||d.filter(x=>(M[x].rarity??M[x].lv)===r).length<lim[r]}};
vm.runInNewContext(src+';result=optimalDeck("terre")',ctx);const deck=ctx.result;assert.equal(deck.length,10);assert.ok(deck.includes(90),'The divine makes the cut');assert.ok(deck.filter(i=>M[i].rarity===6).length<=1);
console.log('PASS: Hydrelithe majeure (divine), 6 Mineurs and 7 Araignées (never above peu commun), web models and portraits, cave uses real models, optimal deck, neutral terrains first, bonus dice auto-checked, crying Messire Balai.');
