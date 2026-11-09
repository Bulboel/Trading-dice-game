const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path'),root=path.join(__dirname,'..');
// Réglages : palette, valeur invalide, adversaire qui change si le joueur prend l'orange.
const store=new Map(),c=vm.createContext({window:{addEventListener(){},dispatchEvent(){}},document:{documentElement:{classList:{toggle(){}}},addEventListener(){},body:{classList:{contains:()=>true}}},localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},location:{hash:''},CustomEvent:class{constructor(t,o){this.type=t;this.detail=o.detail}}});
vm.runInContext(fs.readFileSync(path.join(root,'assets/settings-v171.js'),'utf8'),c);const S=c.window.HackeniaSettings;
assert.equal(S.get().playerColor,'vert');assert.equal(S.get().foeColor,'rouge');assert.deepEqual(Array.from(S.campColors(),x=>x.name),['Vert','Rouge'],'Opponent is red by default');
S.set({playerColor:'violet'});assert.deepEqual(Array.from(S.campColors(),x=>x.name),['Violet','Rouge']);S.set({foeColor:'bleu'});assert.deepEqual(Array.from(S.campColors(),x=>x.name),['Violet','Bleu'],'Opponent color can be chosen');
S.set({playerColor:'bleu'});assert.deepEqual(Array.from(S.campColors(),x=>x.name),['Bleu','Rouge'],'Same color as the opponent: opponent falls back to red');S.set({playerColor:'rouge',foeColor:'rouge'});assert.deepEqual(Array.from(S.campColors(),x=>x.name),['Rouge','Orange'],'…or orange when the player is red');S.set({foeColor:'rouge',playerColor:'orange'});
assert.deepEqual(Array.from(S.campColors(1),x=>x.name),['Rouge','Orange'],'Online seat 1 gets the chosen color');
S.set({playerName:'  <b>Jo</b> & "Mage" de Hackénia  '});assert.equal(S.get().playerName,'bJo/b Mage de Ha','Names are plain text, trimmed, 16 characters max');S.set({playerName:''});
S.set({playerColor:'nope'});assert.equal(S.get().playerColor,'vert');assert.equal(Object.keys(S.camps).length,8);
// Jeu : noms de camp, couleur des dalles 2D et variables CSS du plateau 3D.
const vars={},html=fs.readFileSync(path.join(root,'index.html'),'utf8'),source=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');
const els=new Map(),element=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}});
S.set({playerColor:'bleu',foeColor:'rouge',playerName:'Johann'});const g=vm.createContext({window:{HackeniaSettings:S},document:{documentElement:{style:{setProperty:(k,v)=>vars[k]=v}},getElementById(id){if(!els.has(id))els.set(id,element());return els.get(id)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});
vm.runInContext(source,g);vm.runInContext('applyCampColors()',g);
vm.runInContext('ai=true',g);vm.runInContext('applyCampColors()',g);assert.equal(vm.runInContext('P.join("/")',g),'Johann/IA','Camp names are the player name and IA');vm.runInContext('ai=false;applyCampColors()',g);assert.equal(vm.runInContext('P.join("/")',g),'Johann/Joueur 2');S.set({playerName:''});vm.runInContext('applyCampColors()',g);assert.equal(vm.runInContext('P[0]',g),'Joueur','Default name');assert.equal(vm.runInContext('CAMP_UI[0]',g),'#2f7fd0');assert.equal(vars['--camp0-ui'],'#2f7fd0');assert.equal(vars['--camp1-tile'],'#9a4340');
assert.ok(!/c\.o\?'#e0661a':'#2f9a5f'/.test(html),'2D tiles no longer hard-code green/orange');
assert.ok(fs.readFileSync(path.join(root,'assets/clearing-v105.js'),'utf8').includes("addEventListener('hackenia:camps',applyCampMaterials)"),'3D tiles follow the camp color');
console.log('PASS: 8 colors for the player and the opponent (red by default, never the same), safe player names, IA / Joueur 2 labels, online seat, 2D and 3D tile colors.');
