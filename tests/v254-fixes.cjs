// v254 — cycle des éléments (Eau › Feu › Glace › Terre › Vent › Foudre), mini-roue sur smartphone, gestes à deux doigts, étiquettes de bourse.
const fs=require('fs'),path=require('path'),assert=require('assert');const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('index.html'),cl=read('assets/clearing-v105.js'),wheel=read('assets/element-wheel-v252.js'),tuto=read('assets/tutorial-v178.js'),pouch=read('assets/pouch-opening-v122.js');
const BT=eval('('+html.match(/const BT=(\{[^}]+\})/)[1]+')');
assert.strictEqual(BT.feu,'glace','le feu domine la glace');assert.strictEqual(BT.eau,'feu','l’eau domine le feu');assert.strictEqual(BT.foudre,'eau','la foudre domine l’eau');
assert.strictEqual(Object.values(BT).filter(v=>v==='feu').length,1);
assert.ok(tuto.includes("const cycle='Eau › Feu › Glace › Terre › Vent › Foudre › Eau'"));
assert.ok(wheel.includes("WHEEL_ORDER=['eau','feu','glace','terre','vent','foudre']"));
assert.ok(cl.includes('hud=cr.width<700')&&cl.includes('if(!placementLens.hidden||!cr.width)return;'),'mini-roue en haut à gauche, masquée pendant la loupe');
assert.ok(wheel.includes('function setCompact(v)')&&wheel.includes('sl.label.visible=!v'),'v255 : sans noms sur smartphone');assert.ok(cl.includes('const D=Math.min(100,cr.width*.25),cx=6+D/2,cy=6+D/2'),'v255 : petite roue calée en haut à gauche');
assert.ok(cl.includes('function touchTwist()')&&cl.includes('orbitYaw+=d'),'rotation à deux doigts');
assert.ok(pouch.includes('const gap=Math.max(h*.24,label+8,s+6)'),'écart des dés selon la hauteur des étiquettes');
console.log('v254 fixes OK');
