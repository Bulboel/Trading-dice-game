const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8');
const source=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');
const element=()=>({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},firstElementChild:{style:{}},setPointerCapture(){},clientWidth:400});const elements=new Map();
const context=vm.createContext({window:{},document:{getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id)}},fetch:()=>Promise.resolve({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},Date,Math,console});vm.runInContext(source,context);
vm.runInContext(`
cr=[];cur=0;mode='p';TER=4;die=41;rot=2;pc={x:5,y:6};b=Array.from({length:H},()=>Array(W).fill(null));
const footprint=cells();if(footprint.length!==5)throw Error('Gardienne must deploy five faces');
// An opposing-element neighbor changes attack, and a covered neighbor must use its new element.
b[6][4]={o:1,el:BT[M[die].el],v:1};b[6][6]={o:1,el:BT[M[die].el],v:1};
const bonuses=footprint.map(([x,y])=>previewBonus(x,y));
for(const [x,y,v]of footprint)b[y][x]={o:0,el:M[die].el,v};
for(let i=0;i<footprint.length;i++){const [x,y,v]=footprint[i];if(pw(x,y)!==v+bonuses[i])throw Error('Preview power differs from deployed power')}
if(!handNet(41,2).includes('>+1</tspan>'))throw Error('Hand must show the water terrain bonus');
const stable=window.hackeniaGame.fireVents;if(stable.length!==6)throw Error('Fire vents are available before entering fire terrain');
TER=0;if(window.hackeniaGame.snapshot().blocked.length!==0||window.hackeniaGame.fireVents!==stable)throw Error('Scenery preview must not depend on current blocked cells');
`,context);
console.log('PASS: Gardienne footprint preview, terrain and prospective-neighbor attack values, and permanent fire vent map.');
