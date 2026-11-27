// v445 — Mode fluide (par défaut sur écran tactile) : plus de flou d'arrière-plan, plus d'animations décoratives en boucle
// (sauf celles qui guident le joueur), plateau 3D allégé ; réglable dans Options › Affichage.
const fs=require('fs'),path=require('path'),assert=require('assert');const r=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const st=r('assets/settings-v171.js'),css=r('assets/refinements.css'),cl=r('assets/clearing-v105.js'),po=r('assets/portal-v159.js');
assert.ok(st.includes("fluid:(()=>{try{return matchMedia('(pointer:coarse)').matches}"),'activé par défaut sur écran tactile');
assert.ok(st.includes("classList.toggle('hk-fluid',!!settings.fluid)")&&st.includes('function calmNow()')&&st.includes('KEEP_LOOP'),'classe hk-fluid et arrêt des boucles décoratives');
assert.ok(/KEEP_LOOP=\/\^\(tuto-\|placement-preview/.test(st),'les animations du tutoriel et de l’aperçu de pose sont gardées');
assert.ok(css.includes('html.hk-fluid *,html.hk-fluid *::before,html.hk-fluid *::after,html.hk-fluid ::backdrop{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}'),'plus de flou d’arrière-plan');
assert.ok(cl.includes('light=renderer.isSoftware||fluid')&&cl.includes('renderer.setPixelRatio(Math.min(devicePixelRatio||1,renderer.isSoftware?1.5:dprCap))')&&cl.includes('renderer.shadowMap.enabled=!renderer.isSoftware&&!(dprCap<=1&&perf.noShadow);')&&/return weakGpu\?1\.5:2/.test(cl)&&cl.includes('function adaptQuality('),'plateau allégé (moins d’herbe, ~30 images/s) mais net et ombré (v446) ; v453 : résolution adaptative (GPU modestes à 1,5, baisse par paliers si le plateau rame)');
assert.ok(po.includes('name="fluid"'),'option dans Affichage');
console.log('PASS: v445 — mode fluide (flous, boucles décoratives, plateau allégé, option).');
