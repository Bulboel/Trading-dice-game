// v212 — Invocation plus rapide (2,6 s) et mise en scène selon la rareté : liseré et médaillons bronze / argent / or /
// or ardent / arc-en-ciel, finition du dé, cercles au sol, poussière, faisceau et éclat d'apparition.
import * as THREE from 'three';
import {invocationPalette} from './invocation-colors.js?v=166';
import {invocationNormalization,invocationFrame} from './invocation-layout.js?v=20261103-v72';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js';
import {OrbitControls} from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js';
const TIERS={
 commun:{metal:0xb87d4b,rough:.6,metalness:.15,emissive:0,sigils:1,dust:500,beam:0,flash:0},
 peu:{metal:0xdfe6ee,rough:.42,metalness:.3,emissive:0,sigils:2,dust:800,beam:.06,flash:0},
 rare:{metal:0xe8c26a,rough:.3,metalness:.4,emissive:.04,sigils:3,dust:1100,beam:.12,flash:0},
 legend:{metal:0xffb347,rough:.24,metalness:.45,emissive:.1,sigils:3,dust:1400,beam:.2,flash:1},
 divin:{metal:0xffffff,rough:.2,metalness:.5,emissive:.16,sigils:4,dust:2000,beam:.28,flash:1.4,rainbow:true},
 energie:{metal:0x7ff0ff,rough:.22,metalness:.5,emissive:.14,sigils:3,dust:1300,beam:.22,flash:1}};
export function invocationTier(definition,rarity){if(definition?.pure===3)return'energie';return({1:'commun',2:'peu',3:'rare',4:'rare',5:'legend',6:'divin',7:'energie'})[rarity]||'commun'}
export async function createInvocation(stage,{info,definition,reduced,isCurrent,onComplete,onReady,onReveal,rarity}){
const theme=invocationPalette(definition?.el),tierName=invocationTier(definition,rarity),T=TIERS[tierName];stage.dataset.tier=tierName;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.05,100),renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;stage.appendChild(renderer.domElement);
camera.position.set(4.3,3.5,7.5);const orbit=new OrbitControls(camera,renderer.domElement);orbit.target.set(0,1.1,0);orbit.enableDamping=true;orbit.minDistance=3;orbit.maxDistance=13;orbit.update();
scene.add(new THREE.HemisphereLight(0xdce9ff,0x242139,2.3));
const sun=new THREE.DirectionalLight(0xffe3ae,3);sun.position.set(3,6,5);scene.add(sun);
const rim=new THREE.DirectionalLight(0x83a9ff,2);rim.position.set(-3,3,-4);scene.add(rim);
const floor=new THREE.Mesh(new THREE.CircleGeometry(3.3,64),new THREE.MeshStandardMaterial({color:0x293e45,roughness:.95}));floor.rotation.x=-Math.PI/2;floor.position.y=-.025;scene.add(floor);
const ring=new THREE.Mesh(new THREE.RingGeometry(1.2,1.24,80),new THREE.MeshBasicMaterial({color:theme.glow,transparent:true,opacity:.48,side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.015;scene.add(ring);
const cube=new THREE.Group();scene.add(cube);cube.position.y=.7;
const blue=new THREE.MeshStandardMaterial({color:theme.body,metalness:T.metalness,roughness:T.rough,side:THREE.DoubleSide,emissive:theme.glow,emissiveIntensity:T.emissive});
const gold=new THREE.MeshStandardMaterial({color:T.metal,metalness:.85,roughness:.22,emissive:T.metal,emissiveIntensity:tierName==='commun'?0:.12});
const frameMat=new THREE.MeshStandardMaterial({color:T.metal,metalness:.9,roughness:.25,emissive:T.metal,emissiveIntensity:tierName==='legend'||tierName==='divin'||tierName==='energie'?.35:.08});
const panels=[];const half=.68;
function panel(axis,side){const hinge=new THREE.Group();cube.add(hinge);const body=new THREE.Group();hinge.add(body);
const plate=new THREE.Mesh(new THREE.BoxGeometry(1.3,.045,1.3),blue);body.add(plate);
for(const [w,d,x,z] of [[1.34,.05,0,.645],[1.34,.05,0,-.645],[.05,1.34,.645,0],[.05,1.34,-.645,0]]){const bar=new THREE.Mesh(new THREE.BoxGeometry(w,.07,d),frameMat);bar.position.set(x,0,z);body.add(bar)}// liseré de la dalle, couleur de la rareté
const medallion=new THREE.Mesh(new THREE.TorusGeometry(.32,.045,8,40),gold);medallion.rotation.x=Math.PI/2;medallion.position.y=.085;body.add(medallion);const reverseMedallion=new THREE.Mesh(new THREE.TorusGeometry(.32,.045,8,40),gold);reverseMedallion.rotation.x=Math.PI/2;reverseMedallion.position.y=-.085;body.add(reverseMedallion);
if(axis==='top'){hinge.position.set(0,half,0);body.position.set(0,0,0);panels.push({hinge,axis,side});}
else if(axis==='bottom'){hinge.position.set(0,-half,0);body.position.set(0,0,0);panels.push({hinge,axis,side});}
else if(axis==='x'){hinge.position.set(side*half,-half,0);body.position.set(0,half,0);body.rotation.z=Math.PI/2;panels.push({hinge,axis,side});}
else{hinge.position.set(0,-half,side*half);body.position.set(0,half,0);body.rotation.x=Math.PI/2;panels.push({hinge,axis,side});}
}
panel('top',1);panel('bottom',1);panel('x',1);panel('x',-1);panel('z',1);panel('z',-1);
const magicLid=panels[0];
const dustCount=reduced?300:T.dust,dustPositions=new Float32Array(dustCount*3),dustColors=new Float32Array(dustCount*3),dustOrigins=new Float32Array(dustCount*3),dustDrifts=new Float32Array(dustCount*3);
const palette=T.rainbow?[0xff6b8b,0xffd36b,0x7af0b5,0x6fc8ff,0xc79bff,0xffffff]:[theme.glow,theme.edge,T.metal,0xffffff];
for(let i=0;i<dustCount;i++){const j=i*3;dustOrigins[j]=(Math.random()-.5)*1.28;dustOrigins[j+1]=half+.55;dustOrigins[j+2]=(Math.random()-.5)*1.28;dustDrifts[j]=(Math.random()-.5)*1.9;dustDrifts[j+1]=.8+Math.random()*2.2;dustDrifts[j+2]=(Math.random()-.5)*1.9;const c=new THREE.Color(palette[i%palette.length]);dustColors[j]=c.r;dustColors[j+1]=c.g;dustColors[j+2]=c.b;}
const dustGeometry=new THREE.BufferGeometry();dustGeometry.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));dustGeometry.setAttribute('color',new THREE.BufferAttribute(dustColors,3));
const dustMaterial=new THREE.PointsMaterial({size:.065,vertexColors:true,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true});
const dust=new THREE.Points(dustGeometry,dustMaterial);cube.add(dust);dust.visible=false;
const light=new THREE.PointLight(theme.glow,0,5);light.position.set(0,.9,0);scene.add(light);
const glow=new THREE.Mesh(new THREE.SphereGeometry(.65,24,16),new THREE.MeshBasicMaterial({color:theme.glow,transparent:true,opacity:0,depthWrite:false}));glow.position.set(0,.8,0);scene.add(glow);
const character=new THREE.Group();scene.add(character);
let revealed=false;let model=null,mixer=null,progress=reduced?1:0,playing=!reduced,dead=false,frame=0,finished=false,prepared=false;
const fallback=stage.querySelector('.invocation-fallback'),portrait=fallback?.querySelector('.fallback-character');
function dispose(){if(dead)return;dead=true;cancelAnimationFrame(frame);observer?.disconnect();orbit.dispose();mixer?.stopAllAction();scene.traverse(o=>{o.geometry?.dispose();const materials=Array.isArray(o.material)?o.material:o.material?[o.material]:[];materials.forEach(m=>{Object.values(m).forEach(v=>{if(v?.isTexture)v.dispose()});m.dispose()})});renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()}
let observer;
try{if(info?.glb){try{const data=await new GLTFLoader().loadAsync('assets/'+info.glb);model=data.scene;mixer=new THREE.AnimationMixer(model);const idle=data.animations.find(a=>/idle|stand|breath/i.test(a.name))||data.animations[0];if(idle)mixer.clipAction(idle).play();mixer.update(0);model.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(model,true),fit=invocationNormalization(box.min,box.max),normalized=new THREE.Group();normalized.scale.setScalar(fit.scale);normalized.position.set(fit.x,fit.y,fit.z);normalized.add(model);character.add(normalized)}catch{model=null;mixer?.stopAllAction();mixer=null;/* Keep the illustration if a model cannot be loaded or framed. */}}
if(!isCurrent()){dispose();throw Error('closed')}
if(fallback){if(model)fallback.hidden=true;else fallback.classList.add('fallback-portrait-only')}const accent=stage.parentElement?.style.getPropertyValue('--invocation-accent');if(accent){ring.material.color.set(accent);light.color.set(accent);glow.material.color.set(accent)}
const sigils=new THREE.Group();scene.add(sigils);for(let i=0;i<T.sigils;i++){const sigil=new THREE.Mesh(new THREE.RingGeometry(1.45+i*.35,1.48+i*.35,96),new THREE.MeshBasicMaterial({color:i%2?T.metal:theme.glow,transparent:true,opacity:.6,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));sigil.rotation.x=-Math.PI/2;sigil.position.y=.025+i*.012;sigils.add(sigil)}
const flash=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),new THREE.MeshBasicMaterial({color:T.rainbow?0xffffff:T.metal,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));flash.position.y=1;scene.add(flash);
const beam=new THREE.Mesh(new THREE.CylinderGeometry(.35,1.1,4.5,40,1,true),new THREE.MeshBasicMaterial({color:theme.glow,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));beam.position.y=2;scene.add(beam);
function ease(t){return t*t*(3-2*t)}
function epicPose(t){sigils.rotation.y=reduced?0:t*2;const charge=Math.sin(Math.PI*Math.max(0,Math.min(1,(t-.25)/.7)));beam.material.opacity=reduced?0:charge*T.beam;
 if(T.flash&&!reduced){const f=Math.max(0,1-Math.abs(t-.8)/.08);flash.material.opacity=f*.55*T.flash;flash.scale.setScalar(.6+2.4*Math.min(1,Math.max(0,(t-.72)/.16)))}
 if(T.rainbow){const hue=(performance.now()/2600)%1;frameMat.color.setHSL(hue,.85,.62);frameMat.emissive.setHSL(hue,.9,.45);gold.color.setHSL((hue+.33)%1,.8,.62);gold.emissive.setHSL((hue+.33)%1,.9,.4);sigils.children.forEach((g,i)=>g.material.color.setHSL((hue+i*.17)%1,.9,.65));beam.material.color.setHSL((hue+.5)%1,.8,.6)}ring.scale.setScalar(1+charge*.3);if(t>=.77&&!revealed){revealed=true;onReveal?.()}}
function pose(t){const unfold=ease(Math.max(0,Math.min(1,(t-.08)/.62)));for(const p of panels){if(p===magicLid){p.hinge.rotation.x=0;continue;}if(p.axis==='bottom')p.hinge.rotation.x=0;else if(p.axis==='x')p.hinge.rotation.z=-p.side*unfold*Math.PI*.5;else p.hinge.rotation.x=p.side*unfold*Math.PI*.5;}
const lift=ease(Math.max(0,Math.min(1,(t-.08)/.35)));
const dissolve=Math.max(0,Math.min(1,(t-.40)/.36));
magicLid.hinge.position.set(0,half+lift*.55,0);
magicLid.hinge.rotation.set(0,0,0);
magicLid.hinge.visible=dissolve<.01;
magicLid.hinge.scale.setScalar(1);
dust.visible=dissolve>0&&dissolve<1;
dustMaterial.opacity=dissolve<.8?Math.min(1,dissolve*8):Math.max(0,(1-dissolve)/.2);
if(dust.visible){for(let i=0;i<dustCount;i++){const j=i*3;dustPositions[j]=dustOrigins[j]+dustDrifts[j]*dissolve;dustPositions[j+1]=dustOrigins[j+1]+dustDrifts[j+1]*dissolve;dustPositions[j+2]=dustOrigins[j+2]+dustDrifts[j+2]*dissolve;}dustGeometry.attributes.position.needsUpdate=true;}
const appear=ease(Math.max(0,Math.min(1,(t-.77)/.20)));character.visible=appear>.005;character.position.y=-1.8+appear*1.8;character.scale.setScalar(.45+.55*appear);cube.visible=true;light.intensity=6*Math.sin(Math.PI*Math.max(0,Math.min(1,(t-.22)/.68)));glow.material.opacity=.26*Math.sin(Math.PI*Math.max(0,Math.min(1,(t-.2)/.7)));glow.scale.setScalar(1+appear*1.5);if(!model&&portrait){portrait.style.opacity=String(appear);portrait.style.transform='translateY('+((1-appear)*35)+'px) scale('+(.45+.55*appear)+')'}}
function resize(){const w=stage.clientWidth||1,h=stage.clientHeight||1,fit=invocationFrame(w/h);camera.aspect=w/h;camera.updateProjectionMatrix();camera.position.set(fit.x,fit.y,fit.z);orbit.target.set(0,fit.targetY,0);orbit.maxDistance=fit.distance*2;orbit.update();renderer.setSize(w,h,false)}observer=new ResizeObserver(resize);observer.observe(stage);resize();
const clock=new THREE.Clock();function render(){if(dead)return;frame=requestAnimationFrame(render);if(document.hidden)return;const dt=Math.min(clock.getDelta(),.1);if(playing){progress=Math.min(1,progress+dt/2.6);if(progress>=1)playing=false}pose(progress);epicPose(progress);if(!reduced)mixer?.update(dt);orbit.update();renderer.render(scene,camera);if(!prepared){prepared=true;onReady?.()}if(progress>=1&&!finished){finished=true;onComplete?.()}}
render();return{dispose};}catch(error){dispose();throw error}
}
