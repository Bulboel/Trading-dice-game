const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');const root=path.join(__dirname,'..');
const w={};vm.runInContext(fs.readFileSync(path.join(root,'assets/story-data-v193.js'),'utf8'),vm.createContext({window:w}));const P=w.HACKENIA_STORY;
assert.equal(P.length,18,'Chapters 1 (10 parts + 6 bis + bonus) and 2 (6 parts)');
assert.deepEqual(P.filter(p=>p.chapter===2).map(p=>p.title.split(' : ')[1]),['Le procès','Sameron, Soryan et Zackarie','Une nuit mouvementée','Visite de Dassom','Maebril et le quartier des brumes féeriques','Compagnons perdus']);
let beats=0;const files=new Set();
for(const p of P)for(const k of ['intro','victory','lose','silence'])for(const b of p[k]||[]){beats++;assert.ok(b.s&&b.t,'Every beat has a speaker and text');assert.ok(!/Triade|cartes|Addition|Identique/.test(b.t),'No card-game rule left: '+b.t.slice(0,60));
 for(const s of [b.bg,b.bgb,...(b.cast||[]).map(c=>c.img||c.art)].filter(Boolean))for(const m of String(s).matchAll(/assets\/story\/[^")]+/g))files.add(m[0])}
assert.ok(beats>=300,'All dialogues are imported ('+beats+')');
for(const f of files)assert.ok(fs.existsSync(path.join(root,f)),'Missing image '+f);
for(const p of P.filter(p=>p.duel)){assert.ok(p.victory.length,p.id+' has a victory scene');assert.ok(['terre','feu','glace','vent','eau','foudre','ville','grotte'].includes(p.duel.terrain));assert.ok(['facile','moyen','difficile'].includes(p.duel.level))}
const lake=P.find(p=>p.id==='c1p8');assert.deepEqual(lake.intro.at(-1).choices.map(c=>c.go),['duel','silence']);assert.ok(lake.silence.length>5,'The silent path has its own epilogue');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert.ok(html.includes("storyFoe?storyDeck()"),'Story opponents use their own dice');
console.log('PASS: 18 story parts, '+beats+' dialogue beats with all '+files.size+' images present, dice duels with named opponents, lake choice with both paths.');
