// Version anglaise : détection de langue, traduction exacte, jokers {n}, remplacement de morceaux sans casser les mots.
const assert=require('assert'),vm=require('vm'),fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..'),src=fs.readFileSync(path.join(root,'assets/i18n-v316.js'),'utf8'),dict=fs.readFileSync(path.join(root,'assets/i18n-en-v316.js'),'utf8');
function load(nav,store={}){const win={};win.window=win;win.navigator={language:nav};win.localStorage={getItem:k=>store[k]??null,setItem:(k,v)=>{store[k]=v}};win.location={search:'',reload(){}};
 const doc={documentElement:{lang:''},written:[],write(h){this.written.push(h)},querySelector:()=>null,title:''};win.document=doc;win.MutationObserver=class{observe(){}};win.alert=()=>{};win.confirm=()=>true;win.prompt=()=>'';win.URLSearchParams=URLSearchParams;
 vm.createContext(win);vm.runInContext(src,win);return {win,doc}}
let r=load('fr-FR');assert.equal(r.win.HackeniaI18n.lang,'fr');assert.equal(r.doc.written.length,0,'Aucun dictionnaire chargé en français');assert.equal(r.win.HackeniaI18n.t('Jouer'),'Jouer');
r=load('de-DE');assert.equal(r.win.HackeniaI18n.lang,'en');assert.ok(r.doc.written.join('').includes('i18n-en-v316.js'),'Le dictionnaire se charge en anglais');
vm.runInContext(dict,r.win);r.win.HackeniaI18n.start();const t=r.win.HackeniaI18n.t;
assert.equal(t('Jouer'),'Play');assert.equal(t('Boutique'),'Shop');assert.equal(t('  Nouvelle partie  '),'  New game  ','Les espaces autour sont conservés');
assert.equal(t('Niveau 12, 300 sur 320 XP. Voir les quêtes'),'Level 12, 300 of 320 XP. View quests','Jokers {n}');
assert.equal(t('Plateau 3D le bois tendre, huit colonnes et 12 lignes'),'3D board of the Tender Wood, eight columns and 12 rows');
assert.equal(t('Tourner la caméra'),'Rotate the camera','« Tour » ne doit pas être remplacé au milieu d’un mot');
assert.equal(t('Créé par Bulboel'),'Made by Bulboel');
assert.equal(t('Phrase inconnue sans traduction'),'Phrase inconnue sans traduction');
const miss=[];for(const k of['Commun','Peu commun','Rare','Légendaire','Divin','Énergie','Crépitant','Collection','Mes decks','Options','Histoire','Défis'])if(t(k)===k&&!['Collection','Rare','Options'].includes(k))miss.push(k);assert.deepEqual(miss,[],'Raretés et menus traduits');
console.log('PASS: version anglaise ('+Object.keys(r.win.HACKENIA_EN).length+' entrées).');
