// v212 — L'invocation garde les charnières et la chronologie validées (Eberien), avec une mise en scène par rareté et une durée raccourcie.
const fs=require('fs'),path=require('path'),assert=require('assert');const root=path.join(__dirname,'..'),reference=fs.readFileSync(path.join(root,'eberien-invocation-test.html'),'utf8'),production=fs.readFileSync(path.join(root,'assets/invocation-v212.js'),'utf8'),opening=fs.readFileSync(path.join(root,'assets/pouch-opening-v122.js'),'utf8');
const hinges=s=>{const p=s.slice(s.indexOf('function panel(axis,side)'),s.indexOf('const light=new THREE.PointLight'));return p.slice(p.indexOf("if(axis==='top')"),p.indexOf('panel(\'top\',1)'))};
assert.equal(hinges(production),hinges(reference),'Same six hinged panels as the validated reference');
const posePrefix=s=>s.slice(s.indexOf('function pose(t)'),s.indexOf('glow.scale.setScalar(1+appear*1.5);'));
assert.equal(posePrefix(production),posePrefix(reference),'Lid lift, dissolution and delayed character appearance keep the validated timeline');
assert.ok(production.includes('progress+dt/2.6'),'Faster discovery (2.6 s)');
for(const tier of ['commun','peu','rare','legend','divin','energie'])assert.ok(new RegExp(tier+':\\{metal:').test(production),'Tier '+tier+' has its own staging');
assert.ok(opening.includes('invocation-v212.js')&&opening.includes('rarity:window.hackeniaGame.rarity(d)'),'Pouch opening uses the rarity-aware invocation');
assert.ok(!opening.includes('${runicBackground()}'),'The runic background is no longer used');
console.log('PASS: validated hinges and timeline kept, 2.6 s discovery, six rarity stagings, rarity passed by the pouch opening, runic backdrop replaced.');
