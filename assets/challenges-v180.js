/* Achievement progress belongs to the exported profile, never to a separate save. */
(function(root){'use strict';
const definitions=[
 {id:'wood',title:'Le Bois tendre',goal:'Gagnez un match dans le Bois tendre.',kind:'terrain',terrain:'terre',target:1,reward:'Dés à lancer verts',roll:'emerald'},
 {id:'fire',title:'Les Terres embrasées',goal:'Gagnez un match dans les Terres embrasées.',kind:'terrain',terrain:'feu',target:1,reward:'Dés à lancer rouges',roll:'ruby'},
 {id:'ice',title:'La Route vers Forfalla',goal:'Gagnez un match sur la Route vers Forfalla.',kind:'terrain',terrain:'glace',target:1,reward:'Dés à lancer bleu ciel',roll:'sky'},
 {id:'five',title:'Premières conquêtes',goal:'Gagnez cinq matchs.',kind:'wins',target:5,reward:'Nouveau skin de bourse',pouch:'bronze'},
 {id:'ten',title:'Aventurier confirmé',goal:'Gagnez dix matchs.',kind:'wins',target:10,reward:'Nouveau skin de bourse',pouch:'argent'},
 {id:'fifty',title:'Légende d’Hackénia',goal:'Gagnez cinquante matchs.',kind:'wins',target:50,reward:'Nouveau skin de bourse',pouch:'dore'},
 {id:'balai',title:'Un grand coup de balai',goal:'Battez cinq monstres avec Messire Balai.',kind:'balai',target:5,reward:'Bourse Messire Balai et tissu en soie',pouch:'balai'},
 {id:'chapter1',title:'Les jumeaux de Dassom',goal:'Finissez le chapitre 1 de l’histoire (toutes les parties principales).',kind:'story',chapter:1,target:11,reward:'Bubulles et l’histoire continue au chapitre 2',gold:50},
 {id:'chapter3',title:'Le secret de la grotte',goal:'Finissez le chapitre 3 de l’histoire (toutes les parties principales).',kind:'story',chapter:3,target:11,reward:'Bague chanceuse (objet porté) : un dé de jet bonus au début de chaque duel',item:'bague-chanceuse'},
 // v253 — nouveaux défis : terrains manquants, saisons, IA divine, grands paliers (certains rapportent des Bubulles)
 {id:'wind',title:'Les vents de Hacko',goal:'Gagnez un match dans les vents de Hacko.',kind:'terrain',terrain:'vent',target:1,reward:'Dés à lancer jade',roll:'jade'},
 {id:'lake',title:'Le lac rose',goal:'Gagnez un match au lac rose.',kind:'terrain',terrain:'eau',target:1,reward:'Dés à lancer rose',roll:'rose'},
 {id:'sky',title:'L’île céleste',goal:'Gagnez un match sur l’île céleste.',kind:'terrain',terrain:'foudre',target:1,reward:'Dés à lancer améthyste',roll:'amethyst'},
 {id:'autumn',title:'Feuilles d’or',goal:'Gagnez trois matchs dans la forêt d’automne.',kind:'terrain',terrain:'automne',target:3,reward:'Dés à lancer ambre et 100 Bubulles',roll:'amber',gold:100},
 {id:'dassom',title:'Citoyen de Dassom',goal:'Gagnez trois matchs dans la ville de Dassom.',kind:'terrain',terrain:'ville',target:3,reward:'150 Bubulles',gold:150},
 {id:'deep',title:'Mineur de fond',goal:'Gagnez trois matchs dans la grotte souterraine.',kind:'terrain',terrain:'grotte',target:3,reward:'150 Bubulles',gold:150},
 {id:'divine',title:'Défier les dieux',goal:'Battez l’IA Divine dans « Jouer ».',kind:'divine',target:1,reward:'300 Bubulles',gold:300},
 {id:'collector',title:'Collectionneur',goal:'Possédez 50 dés différents.',kind:'collect',target:50,reward:'Le sac sans fond (objet porté) : un dé rare supplémentaire au début de chaque duel',item:'sac-sans-fond'},
 {id:'hundred',title:'Héros d’Hackénia',goal:'Gagnez cent matchs.',kind:'wins',target:100,reward:'1 000 Bubulles',gold:1000},
 // Événement de Noël : la nuit des Lumières (du 1er décembre au 6 janvier)
 {id:'noel1',title:'Premier flocon',goal:'Gagnez un match sur la nuit des Lumières.',kind:'terrain',terrain:'noel',target:1,reward:'Dés à lancer sucre d’orge et 100 Bubulles',roll:'candy',gold:100,event:'noel'},
 {id:'noel5',title:'L’esprit des Lumières',goal:'Gagnez cinq matchs sur la nuit des Lumières.',kind:'terrain',terrain:'noel',target:5,reward:'Grelot des neiges (objet porté) : une relance automatique par duel',item:'grelot-des-neiges',event:'noel'},
 {id:'noel12',title:'Gardien de l’hiver',goal:'Gagnez douze matchs sur la nuit des Lumières.',kind:'terrain',terrain:'noel',target:12,reward:'500 Bubulles',gold:500,event:'noel'}
];
// Parties principales d'un chapitre (les parties bonus ne comptent pas). Le nombre suit les données de l'histoire quand elles sont chargées.
function chapterParts(n){const parts=(root.HACKENIA_STORY||[]).filter(p=>p.chapter===n&&!p.optional).map(p=>p.id);return parts.length?parts:null}
for(const d of definitions)if(d.kind==='story')Object.defineProperty(d,'target',{enumerable:true,get(){return chapterParts(d.chapter)?.length||11}});
const count=n=>Number.isSafeInteger(n)&&n>=0?n:0;
const TERRAINS=['terre','feu','glace','vent','eau','foudre','ville','grotte','automne','noel'];
function stats(profile){const s=profile.challengeStats||{};return{wins:count(s.wins),balai:count(s.balai),divine:count(s.divine),terrain:Object.fromEntries(TERRAINS.map(el=>[el,count(s.terrain?.[el])]))}}
function progress(profile,d){if(d.kind==='collect'){const n=Object.values(profile?.inventory||{}).filter(q=>q>0).length;return Math.min(d.target,n)}if(d.kind==='story'){const done=profile?.story?.done||{},ids=chapterParts(d.chapter);return Math.min(d.target,ids?ids.filter(id=>done[id]).length:Object.keys(done).filter(id=>new RegExp('^c'+d.chapter+'p\\d+(bis)?$').test(id)&&done[id]).length)}const s=stats(profile);return Math.min(d.target,d.kind==='terrain'?s.terrain[d.terrain]||0:s[d.kind]||0)}
function unlocked(profile){return definitions.filter(d=>progress(profile,d)>=d.target)}
function advance(profile,{won=false,terrain=null,balai=false,mode='quick',difficulty=null}={}){if(!['quick','play','story','online'].includes(mode)||(!won&&!balai))return profile;const next=structuredClone(profile),s=stats(profile);if(won){s.wins++;if(Object.hasOwn(s.terrain,terrain))s.terrain[terrain]++;if(mode==='play'&&difficulty==='divin')s.divine++}if(balai)s.balai++;next.challengeStats=s;return payGold(next)}
// v253 — Bubulles des défis : versées une seule fois par défi accompli (liste profile.challengeGold).
function payGold(profile){const paid=new Set(Array.isArray(profile.challengeGold)?profile.challengeGold:[]),due=unlocked(profile).filter(d=>d.gold&&!paid.has(d.id));if(!due.length)return profile;const next=structuredClone(profile);for(const d of due){next.gold=(next.gold||0)+d.gold;paid.add(d.id)}next.challengeGold=[...paid];return next}
const api={definitions,stats,progress,unlocked,advance,payGold,TERRAINS};root.HackeniaChallenges=api;if(typeof module!=='undefined')module.exports=api;
const dice=root.HackeniaRoll;if(dice){for(const [name,face,light,shade,ink='#fff8dc',edge='#e2c987']of[['emerald','#296947','#68ad6c','#153d2d'],['ruby','#9c2c37','#e56b61','#4b1726'],['sky','#75c6e9','#d1f4ff','#367fba'],['jade','#3f9a78','#8fe0b8','#1d5a44'],['rose','#e58aa8','#ffd0de','#a84a6a'],['amethyst','#7a52c8','#c8a8ff','#3e2478'],['amber','#d9822b','#ffc46e','#8a4510'],['candy','#f4f1ec','#ffffff','#d7cfc4','#c21f2c','#c21f2c']])dice.registerSkin(name,{face,light,shade,edge,ink});dice.setSkin(root.HackeniaSettings.get().rollSkin)}
})(typeof window==='undefined'?globalThis:window);
