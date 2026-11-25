// v446 — « Cuisson » d'un décor immobile : les petits objets d'un groupe (poutres, fenêtres, murs…) sont fusionnés en un seul objet par
// matière. Le rendu est identique, mais le plateau fait beaucoup moins d'appels de dessin par image (un téléphone est à l'aise sous
// ~200–300 ; une seule maison de la ville en faisait ~35). À n'utiliser que sur des groupes dont les objets ne bougent jamais.
import * as THREE from 'three';
import { mergeGeometries } from './vendor/three/examples/jsm/utils/BufferGeometryUtils.js';

const KEEP = ['position', 'normal', 'uv'];
function prepare(geo, matrix) {
  let g = geo.index ? geo.toNonIndexed() : geo.clone();
  for (const name of Object.keys(g.attributes)) if (!KEEP.includes(name)) g.deleteAttribute(name);
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
  g.morphAttributes = {};
  g.clearGroups();
  g.applyMatrix4(matrix);
  return g;
}

// Un objet n'est fusionné que s'il est « simple » : matière standard opaque, sans couleurs par sommet ni shader personnalisé,
// géométrie sans attributs spéciaux (sinon la fusion changerait son apparence).
function simple(o) {
  const m = o.material, g = o.geometry;
  if (!m || m.isShaderMaterial || m.isRawShaderMaterial || m.vertexColors || m.transparent || m.onBeforeCompile?.toString() !== THREE.Material.prototype.onBeforeCompile.toString()) return false;
  for (const name of Object.keys(g.attributes)) if (!KEEP.includes(name)) return false;
  return !Object.keys(g.morphAttributes || {}).length;
}

export function bakeStatic(group, { minimum = 2, only = null } = {}) {
  if (!group) return 0;
  group.updateMatrixWorld(true);
  const inverse = new THREE.Matrix4().copy(group.matrixWorld).invert();
  const buckets = new Map();
  group.traverse(o => {
    if (o === group || !o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || Array.isArray(o.material) || !o.visible) return;
    if (!o.geometry?.attributes?.position || (only && !only.has(o)) || !simple(o)) return;
    for (let p = o; p && p !== group; p = p.parent) if (p.userData.noBake) return;
    const key = o.material.uuid + '|' + (o.castShadow ? 1 : 0) + (o.receiveShadow ? 1 : 0) + '|' + o.renderOrder;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(o);
  });
  let removed = 0;
  for (const list of buckets.values()) {
    if (list.length < minimum) continue;
    let merged = null;
    try { merged = mergeGeometries(list.map(m => prepare(m.geometry, new THREE.Matrix4().multiplyMatrices(inverse, m.matrixWorld))), false); } catch { merged = null; }
    if (!merged) continue;
    const first = list[0], mesh = new THREE.Mesh(merged, first.material);
    mesh.castShadow = first.castShadow; mesh.receiveShadow = first.receiveShadow; mesh.renderOrder = first.renderOrder;
    mesh.userData.baked = true; mesh.userData.imported = first.userData.imported;
    for (const m of list) { m.parent?.remove(m); removed++; }
    group.add(mesh);
    removed--;
  }
  return removed;
}

// Fusion automatique d'un terrain : on fait tourner son animation quelques instants pour repérer tout ce qui bouge
// (position, rotation, échelle, visibilité) ; ces objets et leurs enfants ne sont jamais fusionnés. Les objets créés pendant
// ces essais (particules…) sont ignorés. Le reste — le décor immobile — est fusionné par matière.
const matKey = m => [m.type, m.color?.getHex(), m.emissive?.getHex(), m.emissiveIntensity, m.roughness, m.metalness, m.opacity, m.transparent, m.side,
  m.flatShading, m.map?.uuid, m.normalMap?.uuid, m.bumpMap?.uuid, m.bumpScale, m.emissiveMap?.uuid, m.roughnessMap?.uuid, m.alphaTest, m.depthWrite, m.depthTest,
  m.fog, m.wireframe, m.toneMapped, m.envMapIntensity, m.polygonOffset].join('|');
const matSnap = m => [m.color?.getHex(), m.emissive?.getHex(), m.emissiveIntensity, m.opacity, m.visible, m.map?.offset?.x, m.map?.offset?.y].join('|');

export function autoBake(scene, update) {
  const root = scene?.root;
  if (!root || typeof update !== 'function') return 0;
  const objects = [];
  root.traverse(o => { if (o !== root) objects.push(o); });
  const snap = o => [o.position.x, o.position.y, o.position.z, o.quaternion.x, o.quaternion.y, o.quaternion.z, o.quaternion.w, o.scale.x, o.scale.y, o.scale.z, o.visible ? 1 : 0].map(v => +(+v).toFixed(5)).join(',');
  const base = new Map(objects.map(o => [o, snap(o)]));
  const mats = new Map();
  for (const o of objects) if (o.isMesh && o.material && !Array.isArray(o.material) && !mats.has(o.material)) mats.set(o.material, matSnap(o.material));
  const livelyMats = new Set();
  for (const t of [0.41, 1.33, 2.27, 3.71, 5.93, 8.31, 13.7]) {
    try { update(t); } catch {}
    for (const o of objects) if (!o.userData.noBake && snap(o) !== base.get(o)) o.userData.noBake = 1;
    for (const [m, v] of mats) if (matSnap(m) !== v) livelyMats.add(m);
  }
  // Matières identiques mises en commun (sauf celles qui changent pendant l’animation), pour que la fusion puisse regrouper.
  const canon = new Map();
  for (const o of objects) {
    if (!o.isMesh || o.isSkinnedMesh || o.isInstancedMesh || Array.isArray(o.material) || livelyMats.has(o.material) || !simple(o)) continue;
    let frozen = false; for (let p = o; p && p !== root; p = p.parent) if (p.userData.noBake) { frozen = true; break; }
    if (frozen) continue;
    const k = matKey(o.material);
    if (!canon.has(k)) canon.set(k, o.material); else o.material = canon.get(k);
  }
  return bakeStatic(root, { only: new Set(objects) });
}
