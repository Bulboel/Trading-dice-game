// v447 — Fiche et infos du plateau : plus de « dalle de Toi » / « Case de Toi » ; « ta dalle », « dalle adverse »… contre l'IA ou en ligne,
// le nom du joueur seulement à deux sur le même appareil.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'),el=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){}}),els=new Map();
const c=vm.createContext({window:{dispatchEvent(){}},Event,document:{getElementById(i){if(!els.has(i))els.set(i,el());return els.get(i)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,''),c);const run=s=>vm.runInContext(s,c);
run("ai=true;ONLINE=null");assert.equal(run('tileOwner(0)'),'ta dalle');assert.equal(run('tileOwner(1)'),'dalle adverse');assert.equal(run("owned(0,'case',true)"),'Ta case');assert.equal(run('turnOf(1)'),'du tour adverse');
run("ai=false;P[0]='Léa';P[1]='Tom'");assert.equal(run('tileOwner(1)'),'dalle de Tom');assert.equal(run("owned(0,'case',true)"),'Case de Léa');
assert.ok(!html.includes("' (dalle de '+P[cl.o]+')'")&&!html.includes("'<b>Case de '+P[c.o]")&&!html.includes("'Main de '+P[hp]"),'anciennes tournures retirées');
console.log('PASS: v447 — « ta dalle », « dalle adverse », « Ta case », « Début de ton tour »… ; nom du joueur à deux sur le même appareil.');
