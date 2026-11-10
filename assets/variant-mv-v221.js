/* v221 — Variantes (pierre, métal, teinte) dans les visionneuses 3D des fiches (<model-viewer>).
   Applique le même rendu que sur le plateau (assets/variant-look.js) directement sur la scène Three.js de
   model-viewer : la texture est désaturée puis colorée. Garder le code du shader identique à variant-look.js. */
(function(){'use strict';
const lin=c=>Math.pow(c/255,2.2);
function sceneOf(mv){const s=Object.getOwnPropertySymbols(mv).find(x=>x.description==='scene');return s?mv[s]:null}
function apply(mv,look){if(!mv||!look)return;const kind=look.kind==='stone'?1:look.kind==='metal'?2:0,hex=(look.color||(kind===1?'#b9b1a2':'#ffffff')).replace('#',''),tint={r:lin(parseInt(hex.slice(0,2),16)),g:lin(parseInt(hex.slice(2,4),16)),b:lin(parseInt(hex.slice(4,6),16))},amount=look.amount??(kind===0?.92:1);
 const run=()=>{const scene=sceneOf(mv);if(!scene?.traverse)return;scene.traverse(o=>{if(!o.isMesh)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){if(!m||m.userData?.hkLook)continue;
   if(kind===1){m.metalness=0;m.roughness=1}else if(kind===2){m.metalness=.95;m.roughness=.3}
   m.onBeforeCompile=sh=>{sh.uniforms.hkTint={value:tint};sh.uniforms.hkMix={value:amount};sh.uniforms.hkKind={value:kind};
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 hkTint;uniform float hkMix;uniform int hkKind;')
     .replace('#include <map_fragment>','#include <map_fragment>\n{float l=dot(diffuseColor.rgb,vec3(.299,.587,.114));vec3 g=hkKind==2?vec3(pow(l,.8))*1.35:hkKind==1?vec3(.3+.7*smoothstep(.05,.85,l)):vec3(pow(l,.85))*1.9;diffuseColor.rgb=mix(diffuseColor.rgb,g*hkTint,hkMix);}')};
   m.customProgramCacheKey=()=>'hk-look-mv-'+kind+'-'+amount+'-'+hex;m.userData=m.userData||{};m.userData.hkLook=true;m.needsUpdate=true}});
  scene.queueRender?.();mv.dataset.variantApplied=look.kind};
 if(mv.loaded)run();mv.addEventListener('load',run)}
window.HackeniaVariantMV={apply,sceneOf};
})();
