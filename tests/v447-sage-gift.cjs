// v448 — Pas de Pack Sage automatique : seul l'administrateur l'attribue (attribution confirmée par le serveur) ou l'achat en Bubulles.
// Les packs distribués automatiquement par la v447 (source « cadeau ») sont désactivés ; les Bubulles déjà reçues restent et ne sont pas redonnées.
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');const r=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const P=require(path.join(__dirname,'../assets/premium-v315.js'));
assert.equal(P.active({premium:{sage:true,source:'cadeau'}}),false,'un pack « cadeau » local ne suffit plus');
assert.equal(P.active({premium:{sage:true,source:'bubulles'}}),true,'le pack acheté en Bubulles reste valable');
const po=r('assets/portal-v159.js'),news=r('assets/news-v200.js');
assert.ok(!po.includes('giftSage'),'plus d’attribution automatique');
const fn=po.match(/function revokeAutoSage\(p\)\{[^\n]*\}/)[0],c=vm.createContext({});vm.runInContext(fn,c);
const out=c.revokeAutoSage({gold:1200,premium:{sage:true,noAds:true,goldPaid:true,source:'cadeau'},equipped:'bague-de-sage',sageGift:'x'});
assert.equal(P.active(out),false);assert.equal(out.gold,1200,'Bubulles déjà reçues gardées');assert.equal(out.equipped,'');assert.equal(out.premium.goldPaid,true,'pas de second versement si l’admin attribue le pack ensuite');
assert.equal(P.activate(out,'admin').gold,1200,'attribution admin ultérieure : pas de 1 000 Bubulles en double');
assert.ok(news.includes('Merci à nos testeurs')&&news.includes('ajouté à votre compte par l’équipe'),'annonce : pack ajouté par l’équipe');
console.log('PASS: v448 — Pack Sage attribué par l’admin seulement ; packs automatiques de la v447 désactivés (Bubulles gardées, pas de double versement).');
