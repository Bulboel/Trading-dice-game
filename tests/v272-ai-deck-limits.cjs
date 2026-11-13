// v272 — L'IA suit les mêmes limites de deck que le joueur (1 divin, 2 légendaires, 2 Énergie, 4 rares), à toutes les difficultés,
// contre les rivaux de famille comme contre les adversaires de l'Histoire, et ne joue jamais de dé Crépitant.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const el=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}}),els=new Map();
const c=vm.createContext({window:{dispatchEvent(){}},Event,document:{getElementById(i){if(!els.has(i))els.set(i,el());return els.get(i)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,''),c);const run=s=>vm.runInContext(s,c);
const CAP={6:1,5:2,7:2,3:4};let checked=0;
function check(deck,label){assert.equal(deck.length,10,label+' : 10 dés');assert.equal(new Set(deck).size,10,label+' : sans doublon');
 const n={};for(const m of deck){assert.ok(!run(`M[${m}].shiny`),label+' : pas de Crépitant');const r=run(`rarityOf(M[${m}].shiny?M[M[${m}].shinyOf]:M[${m}])`);n[r]=(n[r]||0)+1}
 for(const [r,max] of Object.entries(CAP))assert.ok((n[r]||0)<=max,`${label} : ${n[r]} dés de rareté ${r} (maximum ${max})`);checked++}
for(const level of['facile','moyen','difficile','divin'])for(let i=0;i<120;i++){check(run(`mkDeck('${level}')`),'mkDeck '+level);check(run(`rivalDeck('${level}')`),'rival '+level)}
// adversaire de l'Histoire : deck imposé trop chargé en divins, ramené aux limites
run("storyFoe={name:'Test',dice:[30,31,32,33,34,35,24,25,26,27]};aiLevel='difficile'");for(let i=0;i<40;i++)check(run('storyDeck()'),'histoire');run('storyFoe=null');
// les familles de rivaux ne contiennent jamais de dé Crépitant
assert.ok(run('rivalFamilies()').every(([,ids])=>ids.every(i=>!run(`M[${i}].shiny`))),'familles de rivaux sans Crépitant');
console.log('PASS: '+checked+' decks d’IA (4 difficultés, rivaux, Histoire) : 1 divin, 2 légendaires, 2 Énergie, 4 rares au plus, sans doublon ni Crépitant.');
