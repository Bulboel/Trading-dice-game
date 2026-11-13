// v269 — Liste (JSON) des miniatures de base dont il faut une version « Crépitante » (galaxie) : une par dé shiny.
const fs=require('fs'),vm=require('vm'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1].replace(/init\(\);\s*$/,'');
const el=()=>new Proxy({style:{setProperty(){}},classList:{add(){},remove(){},toggle(){}},dataset:{},children:[]},{get:(t,k)=>k in t?t[k]:()=>el()});
const c=vm.createContext({window:{dispatchEvent(){}},Event,DOMMatrix:class{},CustomEvent:Event,document:{body:el(),getElementById:()=>el(),createElement:el,querySelector(){return null},querySelectorAll(){return[]}},fetch:()=>Promise.resolve({ok:false}),setTimeout(){},setInterval(){},clearInterval(){},Date,Math,console,matchMedia:()=>({matches:false}),location:{hash:''}});
vm.runInContext(src,c);const M=c.window.hackeniaGame.monsters;
console.log(JSON.stringify([...new Set(M.filter(d=>d.shiny).map(d=>d.portrait.replace(/-crep$/,'')))]));
