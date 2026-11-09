const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path'),root=path.join(__dirname,'..');
// Réglages : palette, valeur invalide, adversaire qui change si le joueur prend l'orange.
const store=new Map(),c=vm.createContext({window:{addEventListener(){},dispatchEvent(){}},document:{documentElement:{classList:{toggle(){}}},addEventListener(){},body:{classList:{contains:()=>true}}},localStorage:{getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},location:{hash:''},CustomEvent:class{constructor(t,o){this.type=t;this.detail=o.detail}}});
vm.runInContext(fs.readFileSync(path.join(root,'assets/settings-v171.js'),'utf8'),c);const S=c.window.HackeniaSettings;
assert.equal(S.get().playerColor,'vert');assert.deepEqual(Array.from(S.campColors(),x=>x.name),['Vert','Orange']);
S.set({playerColor:'violet'});assert.deepEqual(Array.from(S.campColors(),x=>x.name),['Violet','Orange']);
S.set({playerColor:'orange'});assert.deepEqual(Array.from(S.campColors(),x=>x.name),['Orange','Vert'],'Opponent switches to green when the player picks orange');
assert.deepEqual(Array.from(S.campColors(1),x=>x.name),['Vert','Orange'],'Online seat 1 gets the chosen color');
S.set({playerColor:'nope'});assert.equal(S.get().playerColor,'vert');assert.equal(Object.keys(S.camps).length,8);
// Jeu : noms de camp, couleur des dalles 2D et variables CSS du plateau 3D.
const vars={},html=fs.readFileSync(path.join(root,'index.html'),'utf8'),source=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');
const els=new Map(),element=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}});
S.set({playerColor:'bleu'});const g=vm.createContext({window:{HackeniaSettings:S},document:{documentElement:{style:{setProperty:(k,v)=>vars[k]=v}},getElementById(id){if(!els.has(id))els.set(id,element());return els.get(id)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});
vm.runInContext(source,g);vm.runInContext('applyCampColors()',g);
assert.equal(vm.runInContext('P.join("/")',g),'Bleu/Orange');assert.equal(vm.runInContext('CAMP_UI[0]',g),'#2f7fd0');assert.equal(vars['--camp0-ui'],'#2f7fd0');assert.equal(vars['--camp1-tile'],'#b97844');
assert.ok(!/c\.o\?'#e0661a':'#2f9a5f'/.test(html),'2D tiles no longer hard-code green/orange');
assert.ok(fs.readFileSync(path.join(root,'assets/clearing-v105.js'),'utf8').includes("addEventListener('hackenia:camps',applyCampMaterials)"),'3D tiles follow the camp color');
console.log('PASS: 8 player colors, invalid fallback, opponent avoids a clash, online seat, camp names, 2D tiles and 3D tile colors follow the setting.');
