// v447 — Merci aux testeurs : Pack Sage offert une fois à chaque joueur (valable sans serveur), sans recyclage automatique imposé ; annonces condensées.
const fs=require('fs'),path=require('path'),assert=require('assert');const r=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const P=require(path.join(__dirname,'../assets/premium-v315.js'));
const base={version:1,gold:200,inventory:{},decks:[]};const g=P.activate(base,'cadeau');
assert.ok(P.active(g),'Pack Sage offert actif sans confirmation du serveur');assert.equal(g.gold,1200,'+1 000 Bubulles une seule fois');
assert.equal(P.activate(g,'cadeau').gold,1200,'pas de double versement');
const po=r('assets/portal-v159.js'),news=r('assets/news-v200.js');
assert.ok(po.includes("function giftSage(p)")&&po.includes("if(!p||p.sageGift||!P)return p")&&po.includes("n.recycleCfg={...(n.recycleCfg||{}),auto:false}"),'attribution unique, recyclage automatique laissé au choix du joueur');
assert.ok(po.includes('const next=giftSage(starter())')&&po.includes('reset(localStorage,giftSage(starter()))'),'aussi pour une nouvelle partie');
assert.ok(news.includes("Merci à nos testeurs")&&news.includes('le Pack Sage vous est offert')&&news.includes('désolés pour les problèmes de fluidité'),'annonce de remerciement');
assert.ok((news.match(/\{id:'v/g)||[]).length<=8,'annonces condensées');
console.log('PASS: v447 — Pack Sage offert une fois (valable hors ligne, sans recyclage imposé), annonces condensées avec remerciements.');
