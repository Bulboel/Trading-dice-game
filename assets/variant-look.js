/* v212 — Variantes de personnages sans nouveau modèle : le même modèle 3D, rendu en pierre (statue), en métal ou dans une
   autre teinte. Le shader désature la texture puis la colore ; les détails (visage, vêtements) restent visibles.
   look = {kind:'stone'|'metal'|'tint', color:'#rrggbb', amount?:0..1} */
import * as THREE from 'three';
export function applyLook(root,look){if(!root||!look)return;const kind=look.kind==='stone'?1:look.kind==='metal'?2:0,tint=new THREE.Color(look.color||(kind===1?'#b9b1a2':'#ffffff')),amount=look.amount??(kind===0?.92:1);
 root.traverse(o=>{if(!o.isMesh)return;const list=(Array.isArray(o.material)?o.material:[o.material]).map(m=>{const n=m.clone();
  if(kind===1){n.metalness=0;n.roughness=1}else if(kind===2){n.metalness=.95;n.roughness=.3;n.envMapIntensity=1.4}
  n.onBeforeCompile=sh=>{sh.uniforms.hkTint={value:tint};sh.uniforms.hkMix={value:amount};sh.uniforms.hkKind={value:kind};
   sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 hkTint;uniform float hkMix;uniform int hkKind;')
    .replace('#include <map_fragment>','#include <map_fragment>\n{float l=dot(diffuseColor.rgb,vec3(.299,.587,.114));vec3 g=hkKind==2?vec3(pow(l,.8))*1.35:hkKind==1?vec3(.3+.7*smoothstep(.05,.85,l)):vec3(pow(l,.85))*1.9;diffuseColor.rgb=mix(diffuseColor.rgb,g*hkTint,hkMix);}')};
  n.customProgramCacheKey=()=>'hk-look-'+kind+'-'+amount+'-'+tint.getHexString();n.userData.hkLook=true;n.needsUpdate=true;return n});
  o.material=Array.isArray(o.material)?list:list[0]})}
// Approximation pour <model-viewer> (pas de shader personnalisé) : couleur de base, métal et rugosité.
export function applyLookToModelViewer(mv,look){if(!mv?.model||!look)return;const c=new THREE.Color(look.color||(look.kind==='stone'?'#b9b1a2':'#ffffff'));for(const m of mv.model.materials){const p=m.pbrMetallicRoughness;p.setBaseColorFactor([c.r,c.g,c.b,1]);if(look.kind==='stone'){p.setMetallicFactor(0);p.setRoughnessFactor(1)}else if(look.kind==='metal'){p.setMetallicFactor(.95);p.setRoughnessFactor(.3)}}}
