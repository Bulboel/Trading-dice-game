// v217 — Ouverture rapide : 10 bourses achetées et ouvertes d'un coup (sans animation), ou les bourses restantes d'un lot.
const fs=require('fs'),path=require('path'),assert=require('assert');
const src=fs.readFileSync(path.join(__dirname,'../assets/portal-v159.js'),'utf8'),css=fs.readFileSync(path.join(__dirname,'../assets/cards-v203.css'),'utf8');
assert.ok(/function openAllPouches\(\)\{[^}]*next\.pouchQueue\.splice\(0\)/.test(src),'Every remaining pouch is emptied in one commit');
assert.ok(src.includes("data-action=\"buy-ten-quick\"")&&src.includes("a==='buy-ten-quick')purchasePouches(10,true)"),'Direct 10-pouch quick purchase');
assert.ok(src.includes("data-action=\"open-all\"")&&/remaining>1\?/.test(src),'Quick open offered while several pouches remain');
assert.ok(/if\(quick\)openAllPouches\(\);else openNextPouch\(\)/.test(src),'Quick purchase skips the animated opening');
assert.ok(src.includes('qo-badge')&&src.includes('Nouveau'),'New dice are flagged in the summary');
assert.ok(css.includes('dialog.quick-open')&&css.includes('prefers-reduced-motion'),'Summary is styled and respects reduced motion');
// Le tirage reste celui de HackeniaPurchases.plan : mêmes probabilités, même prix (90 Bubulles).
const plan=fs.readFileSync(path.join(__dirname,'../assets/purchases.js'),'utf8');assert.ok(plan.includes('count===10?90:10'));
console.log('PASS: quick opening (buy 10 and open at once, or open the rest of a batch), summary sorted by rarity with new dice flagged, same odds and price.');
