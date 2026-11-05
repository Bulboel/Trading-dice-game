const fs=require('fs'),vm=require('vm'),assert=require('assert');const source=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');new vm.Script(source);
const els=new Map(),element=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){},clientWidth:400});const c=vm.createContext({window:{},document:{getElementById(id){if(!els.has(id))els.set(id,element());return els.get(id)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});vm.runInContext(source,c);
vm.runInContext(`
b=Array.from({length:H},()=>Array(W).fill(null));cr=[];cur=0;TER=0;pl=[{s:0},{s:0}];bonus=[0,0];kills=[0,0];over=0;mode='i';moved=0;const unit={o:0,x:3,y:4,id:1,mi:0,lv:1,em:'a'};cr=[unit];b[4][3]={o:1,id:99,v:6,el:'feu',lv:1};
if(pwc(unit,3,4)!==6)throw Error('Enemy tile must give 6');b[4][3].o=0;if(pwc(unit,3,4)!==6)throw Error('Another own die must give 6');b[4][3].o=1;
b[4][4]={o:1,id:100,v:4,el:'feu',lv:1};mv(unit,4,4);if(pwc(unit,4,4)!==4)throw Error('Moving onto enemy 4 must give 4');
const moveEvent=gameEvents.find(e=>e.type==='Déplacement');if(moveEvent.units[0].attack!==6||moveEvent.units[1].attack!==4)throw Error('Movement history must store both powers');
b[4][4]={o:1,id:100,v:6,el:'terre',lv:1};b[4][5]={o:1,id:101,v:3,el:'glace',lv:1};if(pwc(unit,4,4)!==7)throw Error('Terrain and neighbor bonuses must never stack');
const bonusSnapshot=unitSnapshot(unit);if(bonusSnapshot.number!==6||bonusSnapshot.terrainBonus!==1||bonusSnapshot.neighborBonus!==0||bonusSnapshot.attack!==7)throw Error('Incorrect bonus explanation');
b=Array.from({length:H},()=>Array(W).fill(null));const attacker={o:0,x:3,y:4,id:1,mi:0,lv:1,em:'a'},defender={o:1,x:4,y:4,id:2,mi:1,lv:1,em:'b'};cr=[attacker,defender];b[4][3]={o:1,id:50,v:6,el:'feu',lv:1};b[4][4]={o:0,id:60,v:4,el:'feu',lv:1};resolve(attacker);
if(cr.includes(defender)||!cr.includes(attacker))throw Error('6 on enemy tile must defeat 4');const battle=gameEvents.find(e=>e.type==='Combat');if(battle.units[0].attack!==6||battle.units[1].attack!==4)throw Error('Combat snapshot wrong');b[4][3].v=1;cr=[];if(battle.units[0].attack!==6||battle.units[1].attack!==4)throw Error('History changed after state mutation');
if(bhOf({v:1})!==bhOf({v:6}))throw Error('HTML numbered tiles have unequal heights');
`,c);
const view=fs.readFileSync(require('path').join(__dirname,'../assets/clearing.js'),'utf8');assert(!view.includes('.06*c.v'));assert(view.includes('const h=c.f?.035:.28;'));
console.log('PASS: own and opposing tile power, movement 6→4, non-stacking elemental bonuses, combat 6 vs 4, immutable combat history, uniform 2D/3D tile height.');
