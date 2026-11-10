// v221 — Dessus des dalles : couleur du camp, cadre et symbole d'élément, chiffre en médaillon, bonus, dalles multi-élément.
const fs=require('fs'),path=require('path'),assert=require('assert');const src=fs.readFileSync(path.join(__dirname,'../assets/clearing-v105.js'),'utf8');
assert.ok(/function label\(value,element,bonus=0,camp=-1\)/.test(src),'Tile tops know their camp');
assert.ok(src.includes("label(c.v,c.mu?'multi':c.el,Math.max(0,game.power(x,y)-c.v),c.o?1:0)"),'Placed tiles show camp, element (or multi) and bonus');
for(const el of['foudre','vent','terre','glace','eau','feu'])assert.ok(src.includes(`el==='${el}'`),'Glyph for '+el);
assert.ok(src.includes("ctx.fillText('+'+bonus"),'Bonus pill');assert.ok(src.includes('ExtrudeGeometry(sh'),'Rounded tile body');
assert.ok(/textures\.delete\(k\)/.test(src),'Tile tops are redrawn when camp colours change');
const mv=fs.readFileSync(path.join(__dirname,'../assets/variant-mv-v221.js'),'utf8'),portal=fs.readFileSync(path.join(__dirname,'../assets/portal-v159.js'),'utf8'),html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
assert.ok(mv.includes("description==='scene'")&&mv.includes('#include <map_fragment>'),'Variant shader applied inside model-viewer');
assert.ok(portal.includes('HackeniaVariantMV?.apply(mv,defs[i].variant)')&&html.includes('if(D.variant)window.HackeniaVariantMV?.apply(mv,D.variant)'),'Collection and in-game sheets use the real variant look');
console.log('PASS: tile tops with camp colour, element frame and glyph, value medallion and bonus pill; variants rendered in 3D sheets.');
