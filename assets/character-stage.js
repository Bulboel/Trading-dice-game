import * as THREE from 'three';
import {alignModelForward} from './model-facing.js?v=20261103-v71';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js';

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
 const gltf=await new GLTFLoader().loadAsync('assets/'+info.glb);root=gltf.scene;root.traverse(o=>{if(o.isMesh)meshes.push(o);rest.push({node:o,position:o.position.clone(),quaternion:o.quaternion.clone(),scale:o.scale.clone()})});
 if(!isCurrent()){dispose();throw Error('closed')}
 // Keep normalization outside the animated root, whose transform may be keyed.
 const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),factor=2/Math.max(size.y,.001),normalized=new THREE.Group();normalized.scale.setScalar(factor);normalized.position.set(-center.x*factor,-box.min.y*factor,-center.z*factor);normalized.add(root);const display=new THREE.Group();display.add(normalized);scene.add(display);
 mixer=new THREE.AnimationMixer(root);const idle=gltf.animations.find(a=>/idle|stand|breath/i.test(a.name))||gltf.animations[0];if(idle)action=mixer.clipAction(idle);
 const fit=new THREE.Box3().setFromObject(display),radius=fit.getSize(new THREE.Vector3()).length()/2;distance=radius/Math.sin(THREE.MathUtils.degToRad(camera.fov/2))*1.1;
 controls.minDistance=.45;controls.maxDistance=distance*3;function reset(){controls.target.set(0,1,0);camera.position.set(0,1.15,distance);controls.update()}
 function resize(){const w=host.clientWidth||1,h=host.clientHeight||1;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false)}observer=new ResizeObserver(resize);observer.observe(host);resize();reset();
 const clock=new THREE.Clock();let pose='rest';function draw(){if(dead)return;frame=requestAnimationFrame(draw);const dt=Math.min(clock.getDelta(),.05);if(pose==='idle')mixer.update(dt);alignModelForward(root,display,THREE);controls.update();renderer.render(scene,camera)}draw();
 return{animated:!!action,rigged:meshes.some(m=>m.isSkinnedMesh),setPose(next){mixer.stopAllAction();rest.forEach(s=>{s.node.position.copy(s.position);s.node.quaternion.copy(s.quaternion);s.node.scale.copy(s.scale)});if(next==='idle'&&action){action.reset().play();pose='idle'}else{meshes.forEach(m=>{if(m.isSkinnedMesh)m.skeleton.pose()});pose='rest'}root.updateMatrixWorld(true);alignModelForward(root,display,THREE);host.dataset.pose=pose},zoom(kind){if(kind==='reset'){reset();return}const offset=camera.position.clone().sub(controls.target),length=THREE.MathUtils.clamp(offset.length()*(kind==='in'?.8:1.25),controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(offset.setLength(length));controls.update()},dispose};
 }catch(error){dispose();throw error}
}
