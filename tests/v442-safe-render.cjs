// v442 — Plateau : si la 3D plante au démarrage (ex. Pixel 10), on réessaie avec le rendu de compatibilité, on retient ce choix
// jusqu'à la prochaine version et on affiche l'erreur ; si le module 3D ne démarre pas du tout, le détail s'affiche dans le plateau.
const fs=require('fs'),path=require('path'),assert=require('assert');const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets/clearing-v105.js'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert.ok(src.includes("function initClearing({software=false}={})"),'initClearing accepte le mode compatibilité');
assert.ok(src.includes("if(software)renderer=new LandscapeCanvasRenderer(canvas)"),'mode compatibilité = rendu logiciel');
assert.ok(/cleanupClearing\(\);initClearing\(\{software:true\}\)/.test(src),'nouvel essai en mode compatibilité après un plantage');
assert.ok(src.includes("localStorage.setItem(SAFE_KEY,BUILD+'|'+first)")&&src.includes("safeSaved.split('|')[0]===BUILD"),'choix retenu jusqu’à la prochaine version');
assert.ok(src.includes('clearingNotice(')&&src.includes('Détail : '),'erreur affichée au joueur');
assert.ok(src.includes('window.__clearingStarted=true')&&html.includes('if(window.__clearingStarted)return')&&html.includes("n.id='clearing-missing'"),'module 3D non démarré : détail affiché');
assert.ok(html.indexOf('<script id="old-browser-check">')<html.indexOf('<script>'),'le script du jeu reste le premier <script> sans attribut (tests)');
console.log('PASS: v442 — démarrage robuste du plateau (mode compatibilité, choix retenu, erreur affichée, module manquant signalé).');
