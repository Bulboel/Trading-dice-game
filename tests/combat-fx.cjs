// v244 — Effets d'attaque par style (sort, flèche, corps à corps) et élément, visibles par-dessus les combattants.
const fs=require('fs'),path=require('path'),os=require('os'),assert=require('assert'),{pathToFileURL}=require('url');
const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),src=read('assets/combat-fx-v244.js'),cl=read('assets/clearing-v105.js');
assert.ok(cl.includes("import { createCombatFx, attackStyle } from './combat-fx-v244.js")&&cl.includes('attackFx.update(combat,{style:attackStyle(am)'),'Wired into the combat effects');
assert.ok(cl.includes("window.addEventListener('hackenia:tornado'")&&cl.includes("f.kind==='tornado'")&&cl.includes('envol dans la tornade'),'3D tornado: funnel, debris and creature flight');
const three=pathToFileURL(path.join(root,'assets/vendor/three/build/three.module.min.js')).href,tmp=fs.mkdtempSync(path.join(os.tmpdir(),'hk-fx-')),file=path.join(tmp,'fx.mjs');fs.writeFileSync(file,src.replace("from 'three'","from '"+three+"'"));
(async()=>{const THREE=await import(three),{createCombatFx,attackStyle}=await import(pathToFileURL(file).href);
 assert.equal(attackStyle({cn:'Soryan',lo:'Mage au tempérament brûlant'}),'caster');assert.equal(attackStyle({cn:'La fée Pachié',lo:'Fée divine des sources'}),'caster');
 assert.equal(attackStyle({cn:'Bosco',lo:'Arc légendaire du Brasier : ses flèches embrasent le damier.'}),'archer');assert.equal(attackStyle({cn:'Zackarie',lo:'ses aiguilles frôlent leur cible'}),'archer');
 assert.equal(attackStyle({cn:'Grimgors',lo:'Guerrier demi-orc de Hackénia'}),'melee');assert.equal(attackStyle({cn:'Orven',lo:'Combattant à tête de loup'}),'melee');
 const world=new THREE.Group(),fx=createCombatFx(world,new THREE.Texture()),combat=p=>({kind:'duel',progress:p,reduced:false,fighters:[{x:3,y:6},{x:3,y:5}]});
 for(const el of['feu','glace','foudre','eau','vent','terre','']){fx.update(combat(.33),{style:'caster',element:el,color:'#ff5533',hz:5.5});const proj=fx.root.children[0];assert.ok(fx.root.visible&&proj.visible,'Spell projectile flies for '+(el||'arcane'));}
 fx.update(combat(.33),{style:'archer',element:'feu',color:'#ff5533',hz:5.5});assert.ok(fx.root.children.some(o=>o.isGroup&&o.visible&&o!==fx.root.children[0]),'Arrow flies');
 fx.update(combat(.45),{style:'melee',element:'eau',color:'#3f8cff',hz:5.5});assert.ok(fx.root.children.some(o=>o.isMesh&&o.geometry.type==='RingGeometry'&&o.visible&&o.material.opacity>0),'Melee slash');
 fx.update(combat(.5),{style:'caster',element:'feu',color:'#ff5533',hz:5.5});assert.ok(fx.root.children.filter(o=>o.isSprite&&o.visible).length>10,'Impact burst');
 fx.update({...combat(.5),reduced:true},{});assert.equal(fx.root.visible,false,'Nothing with reduced motion');fx.update(null,{});assert.equal(fx.root.visible,false);
 fs.rmSync(tmp,{recursive:true,force:true});console.log('PASS: combat FX — casters throw an elemental orb (7 variants), archers an arrow, melee a glowing slash; impact flash and sparks; hidden with reduced motion; 3D tornado wired.');
})().catch(e=>{console.error(e);process.exit(1)});
