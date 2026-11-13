// v252 — Roue des éléments 3D à droite du plateau, icônes d'élément tirées des dés v2, sélecteur visuel des terrains, rival nommé, légendaires 4+.
const fs=require('fs'),path=require('path'),assert=require('assert');const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('index.html'),clearing=read('assets/clearing-v105.js'),wheel=read('assets/element-wheel-v252.js'),portal=read('assets/portal-v159.js'),me=read('assets/match-end-v198.js'),sw=read('sw.js');
// L'ordre de la roue suit exactement le cycle de domination du moteur (chaque élément bat le suivant).
const BT=eval('('+html.match(/const BT=(\{[^}]+\})/)[1]+')');
const order=eval(wheel.match(/WHEEL_ORDER=(\[[^\]]+\])/)[1]);
assert.strictEqual(order.length,6);order.forEach((e,i)=>assert.strictEqual(BT[e],order[(i+1)%6],`${e} doit dominer ${order[(i+1)%6]}`));
// Les six modèles v2 existent.
for(const f of wheel.match(/FILES=\{([^}]+)\}/)[1].match(/'[^']+\.glb'/g).map(s=>s.slice(1,-1)))assert.ok(fs.existsSync(path.join(root,'assets/models-web',f)),f+' manquant');
// Intégrée à la scène : importée, rendue en seconde passe juste après le plateau, absente des aperçus du menu.
assert.ok(/import \{ createElementWheel \} from '\.\/element-wheel-v252\.js/.test(clearing));
assert.ok(clearing.includes('renderer.render(scene,camera);renderElementWheel(t);'));
assert.ok(/function renderElementWheel\(t\)\{if\(previewMode/.test(clearing));
assert.ok(clearing.includes('renderer.clearDepth()'),'la roue ne doit jamais être masquée par le décor');
// Placée à droite, dans les limites du déplacement de la vue (±18).
const dist=clearing.match(/multiplyScalar\(([\d.]+)\*Math\.max\(1,ZS\)\+([\d.]+)\)\.setY/);assert.ok(dist&&+dist[1]+ +dist[2]<=18-3,'roue atteignable en déplaçant la vue');
// Icônes : miniatures des dés v2, plus d'émojis d'élément.
for(const e of ['eau','feu','glace','terre','vent','foudre','neutre'])for(const n of [64,128])assert.ok(fs.existsSync(path.join(root,`assets/elements/v2-${e}-${n}.webp`)),e+n);
assert.ok(!/ELEMENT_ICONS=\{terre:'/.test(html),'ELEMENT_ICONS ne doit plus contenir d’émojis');
assert.ok(html.includes("window.HackeniaElementIcon=elIcon"));
assert.ok(sw.includes('assets/elements/v2-feu-64.webp'),'icônes disponibles hors ligne');
// Sélecteur visuel des terrains, synchronisé avec le <select>.
assert.ok(portal.includes('class="terrain-picker" role="radiogroup"'));
assert.ok(!/terrainList\.map\(\(\[id,em,name\]\)=>'<option value="'\+id\+'">'\+em/.test(portal),'plus d’émoji dans les options');
// Rival, légendaires, défis.
assert.ok(/ai\?\(rival\?\.name\|\|'IA'\)/.test(html));
assert.ok(html.includes("M.forEach(d=>{if(!d.pure&&(d.rarity??d.lv)===5)d.need=4});"));
assert.ok(/DECK_LIMITS=\{6:1,5:2,7:2,3:4,8:1\}/.test(portal));
assert.ok(me.includes('Défi validé'));
console.log('v252 wheel + icons OK');
