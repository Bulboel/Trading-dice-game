// v430 — Figurine « en papier » : une image découpée, avec une vraie épaisseur de carton.
// Plusieurs feuilles empilées : le recto en couleurs, une tranche couleur carton, le verso papier.
// Utilisée sur le plateau (clearing-v105.js) et à l'écran de découverte (invocation-v212.js).
import * as THREE from 'three';

const cache = new Map(), loader = new THREE.TextureLoader();
export function paperTexture(path) {
  const url = path.startsWith('assets/') ? path : 'assets/' + path;
  if (!cache.has(url)) cache.set(url, new Promise(ok => loader.load(url, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; ok(t); }, undefined, () => ok(null))));
  return cache.get(url);
}

export async function loadPaperTextures(sprite) {
  const out = {};
  // v457 — une pose peut être une suite d'images (attaque : élan, coup, suite) : la texture est alors un tableau
  await Promise.all(Object.entries(sprite || {}).map(async ([k, p]) => { out[k] = Array.isArray(p) ? (await Promise.all(p.map(paperTexture))).filter(Boolean) : await paperTexture(p); if (Array.isArray(out[k]) && !out[k].length) delete out[k]; }));
  return out;
}

const LAYERS = 7, ALPHA = .45;
// tint : couleur de variante (teinte élémentaire), mélangée au recto.
export function buildPaperFigure(tex, height, { tint = null, thickness = .055 } = {}) {
  const group = new THREE.Group(), layers = [];
  const aspect = t => t.image.width / t.image.height;
  const depth = height * thickness;
  for (let i = 0; i < LAYERS; i++) {
    const front = i === LAYERS - 1, back = i === 0;
    // Tranche et verso : couleur unie (map × noir = 0, la couleur vient de l'émissif), découpe donnée par la transparence de l'image.
    const mat = front
      ? new THREE.MeshStandardMaterial({ map: tex, alphaTest: ALPHA, side: THREE.DoubleSide, roughness: 1, metalness: 0, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: .35 })
      : new THREE.MeshStandardMaterial({ color: 0x000000, map: tex, alphaTest: ALPHA, side: THREE.DoubleSide, roughness: 1, metalness: 0, emissive: back ? 0xe9e0cc : 0xa98d64, emissiveIntensity: back ? .8 : .75 });
    if (front && tint) mat.color.lerp(new THREE.Color(tint), .35);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    mesh.position.z = -depth / 2 + depth * i / (LAYERS - 1);
    if (front) { mesh.castShadow = true; mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: ALPHA }); }
    mesh.userData.imported = true;
    group.add(mesh); layers.push(mesh);
  }
  const sheet = new THREE.Group(); sheet.add(group); sheet.userData.imported = true; group.userData.imported = true;
  function setPose(t) {
    if (Array.isArray(t)) t = t[0];
    if (!t) return;
    for (const m of layers) {
      m.material.map = t; if (m.material.emissiveMap) m.material.emissiveMap = t; m.material.needsUpdate = true;
      if (m.customDepthMaterial) { m.customDepthMaterial.map = t; m.customDepthMaterial.needsUpdate = true; }
    }
    const w = height * aspect(t);
    group.scale.set(w, height, 1); group.position.y = height / 2;
    // l'épaisseur ne doit pas suivre l'échelle horizontale : on la règle feuille par feuille
    layers.forEach((m, i) => { m.position.z = (-depth / 2 + depth * i / (LAYERS - 1)); });
  }
  setPose(Array.isArray(tex) ? tex[0] : tex);
  return { object: sheet, setPose, layers };
}
