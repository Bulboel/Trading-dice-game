// v253 — Forêt d'automne (Terre + Vent), nuit des Lumières (événement de Noël : Foudre, Glace, Feu, cadeaux), nouveaux défis,
// Bubulles versées par les défis, Grelot des neiges (relance automatique), bulle unique.
const fs=require('fs'),path=require('path'),assert=require('assert');const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('index.html'),clearing=read('assets/clearing-v105.js'),portal=read('assets/portal-v159.js'),sw=read('sw.js');
// Moteur : terrains et éléments favorisés
assert.ok(html.includes("TL=['terre','feu','glace','vent','eau','foudre','ville','grotte','automne','noel']"));
const boost=eval('('+html.match(/const TERRAIN_BOOST=(\{[^}]+\})/)[1]+')');
assert.deepStrictEqual(boost,{automne:['terre','vent'],noel:['foudre','glace','feu']});
assert.ok(html.includes('const terrainBonus=els.some(boosted)?(c.t2?2:1):0')&&!/el===TL\[TER\]/.test(html),'le bonus de terrain passe partout par boosted()');
assert.ok(html.includes("if(t==='noel'){")&&html.includes("lotus.push({x,y,until:turnNumber+4,gift:1})"),'un cadeau (+1, 2 tours) par tour sur la nuit des Lumières');
assert.ok(html.includes("const open=TL.filter(t=>window.HackeniaEvents?.terrainOpen?.(t)??t!=='noel')"),'Noël hors tirage aléatoire en dehors de l’événement');
// Grelot des neiges : une relance par duel, joueur local, hors ligne
assert.ok(html.includes("if(!outcome.success&&k===0&&rerollLeft>0&&!ONLINE){rerollLeft--;"));
assert.ok(html.includes('gearItem=startItem;rerollLeft=startItem?.reroll||0;'));
// Scènes 3D
for(const [f,fn] of [['assets/autumn-v253.js','createAutumn'],['assets/noel-v253.js','createNoel']]){const src=read(f);assert.ok(src.includes('export function '+fn+'(world,software=false,rows=10,helpers={})')&&src.includes('return{root,update(t,light,moving)'),f);assert.ok(clearing.includes("import { "+fn+" } from './"+f.slice(7)),fn+' importé')}
assert.ok(clearing.includes("automne:'Terre +1 · Vent +1")&&clearing.includes('function updateGifts()')&&clearing.includes('animateGifts();'));
// Événement
const E=require(path.join(root,'assets/events-v253.js'));
assert.ok(E.inWindow(E.EVENTS.noel,new Date(2026,11,1))&&E.inWindow(E.EVENTS.noel,new Date(2027,0,6))&&E.inWindow(E.EVENTS.noel,new Date(2026,11,25)));
assert.ok(!E.inWindow(E.EVENTS.noel,new Date(2026,10,12))&&!E.inWindow(E.EVENTS.noel,new Date(2027,0,7)));
assert.ok(E.terrainOpen('automne')&&E.terrainOpen('terre'));
// Défis : terrains suivis, IA divine, Bubulles versées une seule fois
global.window=undefined;const C=require(path.join(root,'assets/challenges-v180.js'));
for(const id of ['wind','lake','sky','autumn','dassom','deep','divine','hundred','noel1','noel5','noel12'])assert.ok(C.definitions.some(d=>d.id===id),id);
let p={version:1,gold:0,inventory:{},decks:[]};
p=C.advance(p,{won:true,terrain:'noel',mode:'play',difficulty:'divin'});
assert.strictEqual(C.stats(p).terrain.noel,1);assert.strictEqual(C.stats(p).divine,1);
assert.strictEqual(p.gold,100+300,'Premier flocon (100) + Défier les dieux (300)');
p=C.advance(p,{won:true,terrain:'ville',mode:'quick'});assert.strictEqual(p.gold,400,'pas de double versement');
assert.strictEqual(C.payGold(p),p);
const Q=require(path.join(root,'assets/equipment-v198.js'));const grelot=Q.items.find(i=>i.id==='grelot-des-neiges');
assert.ok(grelot&&grelot.reroll===1&&grelot.challenge==='noel5'&&fs.existsSync(path.join(root,grelot.art)));
// Interface
assert.ok(portal.includes("['automne','🍁','La forêt d’automne")&&portal.includes("['noel','🎄','La nuit des Lumières"));
assert.ok(portal.includes("(locked?' disabled aria-disabled=\"true\"':'')"),'tuile de Noël verrouillée hors événement');
assert.ok(!portal.includes('wb-back'),'une seule bulle');
assert.ok(fs.existsSync(path.join(root,'assets/wallet-v253.css'))&&html.includes('assets/wallet-v253.css'));
assert.ok(sw.includes('assets/autumn-v253.js')&&sw.includes('assets/noel-v253.js')&&sw.includes('assets/elements/v2-noel-64.webp'),'disponible hors ligne');
console.log('v253 seasons OK');
