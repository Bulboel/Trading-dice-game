// v446 — Diagnostic de performance : boucles qui recalculaient toute la page, décor 3D fusionné.
const fs=require('fs'),path=require('path'),assert=require('assert');const r=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const po=r('assets/portal-v159.js'),md=r('assets/menu-dice-facing-v413.js'),bk=r('assets/bake-static.js'),cl=r('assets/clearing-v105.js'),ci=r('assets/city-v246.js');
// 1. dés SVG des fiches : seuls les dés visibles tournent (IntersectionObserver), immobiles en mode fluide
assert.ok(po.includes('new IntersectionObserver(es=>')&&po.includes("const still=reduce.matches||document.documentElement.classList.contains('hk-fluid')")&&!po.includes("sv.getClientRects().length)return;const g=sv.querySelector('.cd-faces')"),'dés SVG : plus de réécriture de tous les dés toutes les 33 ms');
// 2. éclairage des dés du menu : uniquement sur l’accueil, sans offsetParent
assert.ok(md.includes("document.body.dataset.portalView!=='home'")&&!md.includes('!c.offsetParent'),'dés du menu : uniquement sur l’accueil');
// 3. décor immobile fusionné ; objets animés, transparents ou à shader exclus
assert.ok(bk.includes('export function bakeStatic')&&bk.includes('export function autoBake')&&bk.includes('m.transparent')&&bk.includes('m.vertexColors')&&bk.includes('userData.noBake'),'fusion prudente');
assert.ok((cl.match(/=tuned\(create/g)||[]).length>=12,'tous les terrains passent par la fusion automatique');
assert.ok(ci.includes('bakeStatic(houses)')&&ci.includes('b.userData.noBake=1')&&ci.includes('flag.userData.noBake=1'),'ville : maisons fusionnées, bannières et drapeau animés exclus');
console.log('PASS: v446 — boucles de mise en page supprimées, dés SVG visibles seulement, décor des terrains fusionné (objets animés exclus).');
