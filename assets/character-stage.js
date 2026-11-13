import * as THREE from 'three';
import {alignModelForward} from './model-facing.js?v=20261103-v71';
import { GLTFLoader } from './vendor/three/examples/jsm/loaders/GLTFLoader.js';
import { applyLook } from './variant-look.js?v=20261113-v215';
import { OrbitControls } from './vendor/three/examples/jsm/controls/OrbitControls.js';

export async function createCharacterStage(host,info,isCurrent){
 const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
 const canvas=renderer.domElement;canvas.setAttribute('aria-label',`Modèle 3D de ${info.nom||'la créature'}`);canvas.setAttribute('role','img');canvas.style.touchAction='none';host.append(canvas);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.01,100),controls=new OrbitControls(camera,canvas);
 scene.add(new THREE.HemisphereLight(0xe4efff,0x756351,3));
 const key=new THREE.DirectionalLight(0xffeddb,3.5);key.position.set(3,5,4);scene.add(key);const rim=new THREE.DirectionalLight(0x94caff,2.7);rim.position.set(-3,2,-3);scene.add(rim);
 controls.enableDamping=true;controls.dampingFactor=.08;controls.enablePan=true;controls.minPolarAngle=.12;controls.maxPolarAngle=Math.PI-.12;
 let root,mixer,action,frame=0,dead=false,observer;const meshes=[],rest=[];let distance=4;
 function dispose(){if(dead)return;dead=true;cancelAnimationFrame(frame);observer?.disconnect();controls.dispose();mixer?.stopAllAction();meshes.forEach(mesh=>{mesh.geometry?.dispose();const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];materials.forEach(m=>{if(!m)return;Object.values(m).forEach(t=>{if(t?.isTexture)t.dispose()});m.dispose()})});renderer.dispose();renderer.forceContextLoss();canvas.remove()}
 try{
 // v281 : dés double / triple élément = plusieurs modèles côte à côte (info.partsInfo), chacun avec sa propre animation d'attente.
 const list=info.partsInfo?.length>1?info.partsInfo:[info],n=list.length,H=n>2?1.7:n>1?1.9:2;
 const layout=n>2?[[-.78,0],[.78,0],[0,-.55]]:n>1?[[-.72,0],[.72,0]]:[[0,0]];
 const parts=[];const loader=new GLTFLoader();
 for(let i=0;i<n;i++){const gltf=await loader.loadAsync('assets/'+list[i].glb);const r=gltf.scene;if(info.variant)applyLook(r,info.variant);
  const mine=[];r.traverse(o=>{if(o.isMesh){meshes.push(o);mine.push(o)}rest.push({node:o,position:o.position.clone(),quaternion:o.quaternion.clone(),scale:o.scale.clone()})});
  if(!isCurrent()){dispose();throw Error('closed')}
  // La normalisation reste hors de la racine animée, dont la transformation peut être animée.
  const box=new THREE.Box3().setFromObject(r),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),factor=H/Math.max(size.y,.001),norm=new THREE.Group();norm.scale.setScalar(factor);norm.position.set(-center.x*factor,-box.min.y*factor,-center.z*factor);norm.add(r);
  const display=new THREE.Group();display.add(norm);display.position.set(layout[i][0],0,layout[i][1]);scene.add(display);
  const mx=new THREE.AnimationMixer(r),idle=gltf.animations.find(a=>/idle|stand|breath/i.test(a.name))||gltf.animations[0];
  parts.push({root:r,display,mixer:mx,action:idle?mx.clipAction(idle):null,meshes:mine})}
 root=parts[0].root;mixer=parts[0].mixer;action=parts[0].action;
 const fit=new THREE.Box3().setFromObject(scene);const radius=fit.getSize(new THREE.Vector3()).length()/2;distance=radius/Math.sin(THREE.MathUtils.degToRad(camera.fov/2))*1.1;
 const fitSize=fit.getSize(new THREE.Vector3()),tanV=Math.tan(THREE.MathUtils.degToRad(camera.fov/2));function fitDistance(){const asp=(host.clientWidth||1)/(host.clientHeight||1);return Math.max(distance,(fitSize.y/2)/tanV*1.2,(fitSize.x/2)/(tanV*asp)*1.2)}controls.minDistance=.45;controls.maxDistance=distance*3.5;function reset(){const d=fitDistance();controls.target.set(0,H/2,0);camera.position.set(0,H*.58,d);controls.update()}
 function resize(){const w=host.clientWidth||1,h=host.clientHeight||1;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)}observer=new ResizeObserver(resize);observer.observe(host);resize();reset();
 const hasAction=parts.some(q=>q.action),orient=()=>parts.forEach(q=>alignModelForward(q.root,q.display,THREE));
 const clock=new THREE.Clock();let pose='rest';function draw(){if(dead)return;frame=requestAnimationFrame(draw);const dt=Math.min(clock.getDelta(),.05);if(pose==='idle')parts.forEach(q=>q.mixer.update(dt));orient();controls.update();renderer.render(scene,camera)}draw();
 return{animated:hasAction,rigged:meshes.some(m=>m.isSkinnedMesh),setPose(next){parts.forEach(q=>q.mixer.stopAllAction());rest.forEach(s=>{s.node.position.copy(s.position);s.node.quaternion.copy(s.quaternion);s.node.scale.copy(s.scale)});if(next==='idle'&&hasAction){parts.forEach(q=>q.action?.reset().play());pose='idle'}else{meshes.forEach(m=>{if(m.isSkinnedMesh)m.skeleton.pose()});pose='rest'}parts.forEach(q=>q.root.updateMatrixWorld(true));orient();host.dataset.pose=pose},zoom(kind){if(kind==='reset'){reset();return}const offset=camera.position.clone().sub(controls.target),length=THREE.MathUtils.clamp(offset.length()*(kind==='in'?.8:1.25),controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(offset.setLength(length));controls.update()},dispose};
 }catch(error){dispose();throw error}
}
