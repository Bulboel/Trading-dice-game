// v445 — Mode fluide (par défaut sur écran tactile) : plus de flou d'arrière-plan, plus d'animations décoratives en boucle
// (sauf celles qui guident le joueur), plateau 3D allégé ; réglable dans Options › Affichage.
const fs=require('fs'),path=require('path'),assert=require('assert');const r=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const st=r('assets/settings-v171.js'),css=r('assets/refinements.css'),cl=r('assets/clearing-v105.js'),po=r('assets/portal-v159.js');
assert.ok(st.includes("fluid:(()=>{try{return matchMedia('(pointer:coarse)').matches}"),'activé par défaut sur écran tactile');
assert.ok(st.includes("classList.toggle('hk-fluid',!!settings.fluid)")&&st.includes('function calmNow()')&&st.includes('KEEP_LOOP'),'classe hk-fluid et arrêt des boucles décoratives');
assert.ok(/KEEP_LOOP=\/\^\(tuto-\|placement-preview/.test(st),'les animations du tutoriel et de l’aperçu de pose sont gardées');
assert.ok(css.includes('html.hk-fluid *,html.hk-fluid *::before,html.hk-fluid *::after,html.hk-fluid ::backdrop{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}'),'plus de flou d’arrière-plan');
assert.ok(cl.includes('renderer.shadowMap.enabled=!renderer.isSoftware&&!fluid')&&cl.includes('fluid?1.25:2'),'plateau allégé');
assert.ok(po.includes('name="fluid"'),'option dans Affichage');
console.log('PASS: v445 — mode fluide (flous, boucles décoratives, plateau allégé, option).');
