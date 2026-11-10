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
 {id:'chapter1',title:'Les jumeaux de Dassom',goal:'Finissez le chapitre 1 de l’histoire (toutes les parties principales).',kind:'story',chapter:1,target:11,reward:'Bague chanceuse (objet porté) : un dé de jet bonus au début de chaque duel',item:'bague-chanceuse'}
];
// Parties principales d'un chapitre (les parties bonus ne comptent pas). Le nombre suit les données de l'histoire quand elles sont chargées.
function chapterParts(n){const parts=(root.HACKENIA_STORY||[]).filter(p=>p.chapter===n&&!p.optional).map(p=>p.id);return parts.length?parts:null}
for(const d of definitions)if(d.kind==='story')Object.defineProperty(d,'target',{enumerable:true,get(){return chapterParts(d.chapter)?.length||11}});
const count=n=>Number.isSafeInteger(n)&&n>=0?n:0;
function stats(profile){const s=profile.challengeStats||{};return{wins:count(s.wins),balai:count(s.balai),terrain:Object.fromEntries(['terre','feu','glace','vent','eau','foudre'].map(el=>[el,count(s.terrain?.[el])]))}}
function progress(profile,d){if(d.kind==='story'){const done=profile?.story?.done||{},ids=chapterParts(d.chapter);return Math.min(d.target,ids?ids.filter(id=>done[id]).length:Object.keys(done).filter(id=>new RegExp('^c'+d.chapter+'p\\d+(bis)?$').test(id)&&done[id]).length)}const s=stats(profile);return Math.min(d.target,d.kind==='terrain'?s.terrain[d.terrain]:s[d.kind])}
function unlocked(profile){return definitions.filter(d=>progress(profile,d)>=d.target)}
function advance(profile,{won=false,terrain=null,balai=false,mode='quick'}={}){if(!['quick','play','story','online'].includes(mode)||(!won&&!balai))return profile;const next=structuredClone(profile),s=stats(profile);if(won){s.wins++;if(Object.hasOwn(s.terrain,terrain))s.terrain[terrain]++}if(balai)s.balai++;next.challengeStats=s;return next}
const api={definitions,stats,progress,unlocked,advance};root.HackeniaChallenges=api;if(typeof module!=='undefined')module.exports=api;
const dice=root.HackeniaRoll;if(dice){for(const [name,face,light,shade]of[['emerald','#296947','#68ad6c','#153d2d'],['ruby','#9c2c37','#e56b61','#4b1726'],['sky','#75c6e9','#d1f4ff','#367fba']])dice.registerSkin(name,{face,light,shade,edge:'#e2c987',ink:'#fff8dc'});dice.setSkin(root.HackeniaSettings.get().rollSkin)}
})(typeof window==='undefined'?globalThis:window);
