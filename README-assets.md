# Où ranger les assets du jeu

Le jeu est un site statique : tout se met dans le dépôt GitHub, à côté de `index.html`.

```
ton-depot/
├── index.html                 ← le jeu
└── assets/
    ├── manifest.json          ← la liste des assets (déjà remplie, rien à modifier)
    ├── models/                ← les créatures en .glb  (25 fichiers)
    ├── terrains/              ← les images de plateau (une par terrain)
    └── ui/                    ← icônes, bannières, plaques « Zone Orange / Zone Vert »
```

## Créatures (dossier `assets/models/`)
Un fichier par créature, nommé exactement comme ci-dessous (minuscules, sans accents).
Si un fichier manque, le jeu garde sa figurine provisoire : tu peux donc les ajouter un par un.

| Fichier | Créature | Élément | Palier |
|---|---|---|---|
| `foudre-petit.glb` | 🐝 Abeille Étincelle | foudre | Petit (niv. 1-2) |
| `vent-petit.glb` | 🐦 Moineau Brise | vent | Petit (niv. 1-2) |
| `terre-petit.glb` | 🐜 Fourmi Caillou | terre | Petit (niv. 1-2) |
| `glace-petit.glb` | 🐇 Lapin Givre | glace | Petit (niv. 1-2) |
| `eau-petit.glb` | 🐟 Poisson Goutte | eau | Petit (niv. 1-2) |
| `feu-petit.glb` | 🐥 Poussin Braise | feu | Petit (niv. 1-2) |
| `foudre-moyen.glb` | 🦎 Salamandre Voltaïque | foudre | Moyen (niv. 3-4) |
| `vent-moyen.glb` | 🦆 Canard des Cimes | vent | Moyen (niv. 3-4) |
| `terre-moyen.glb` | 🐢 Tortue des Racines | terre | Moyen (niv. 3-4) |
| `glace-moyen.glb` | 🐧 Pingouin du Givre | glace | Moyen (niv. 3-4) |
| `eau-moyen.glb` | 🐙 Poulpe des Marées | eau | Moyen (niv. 3-4) |
| `feu-moyen.glb` | 🦊 Renard Braise | feu | Moyen (niv. 3-4) |
| `foudre-legendaire.glb` | 🦖 Rex Foudroyant | foudre | Légendaire (niv. 5) |
| `vent-legendaire.glb` | 🦢 Cygne Tempête | vent | Légendaire (niv. 5) |
| `terre-legendaire.glb` | 🦏 Rhinocéros de Granit | terre | Légendaire (niv. 5) |
| `glace-legendaire.glb` | 🐘 Éléphant des Glaciers | glace | Légendaire (niv. 5) |
| `eau-legendaire.glb` | 🦈 Requin Abyssal | eau | Légendaire (niv. 5) |
| `feu-legendaire.glb` | 🦁 Lion Solaire | feu | Légendaire (niv. 5) |
| `foudre-divin.glb` | 🐲 Dragon de la Foudre | foudre | Divin (niv. 6) |
| `vent-divin.glb` | 🐲 Dragon des Vents | vent | Divin (niv. 6) |
| `terre-divin.glb` | 🐲 Dragon des Montagnes | terre | Divin (niv. 6) |
| `glace-divin.glb` | 🐲 Dragon des Glaces | glace | Divin (niv. 6) |
| `eau-divin.glb` | 🐲 Dragon des Abysses | eau | Divin (niv. 6) |
| `feu-divin.glb` | 🐲 Dragon du Feu | feu | Divin (niv. 6) |
| `fusion.glb` | 🐉 Dragon de Fusion | — | issu de la fusion de deux alliés |

## Export depuis Meshy
- Format : **GLB** (un seul fichier avec les textures et, si tu en as, les animations).
- Taille visée : 1 à 2 Mo, 3 000 à 10 000 triangles (règle le nombre de polygones dans Meshy).
- Orientation : pieds posés sur l'origine, face tournée vers +Z, créature debout.
- Animations (facultatif pour l'instant) : nomme-les `idle`, `walk`, `attack`.
- Une seule texture embarquée par modèle, de 1024 px ou 2048 px.

## Terrains (dossier `assets/terrains/`)
Une image par terrain : `foudre.webp`, `vent.webp`, `terre.webp`, `glace.webp`, `eau.webp`, `feu.webp`.
Pour qu'elle serve de sol : **vue strictement du dessus** (pas de perspective), **8 colonnes × 10 lignes** de cases
carrées (1024×1280 ou 2048×2560), première et dernière lignes = zones de départ. Les arbres, rochers et bannières
sont mieux en modèles 3D séparés que peints sur le sol.

## Tester
- En ligne : pousse le dossier sur GitHub (GitHub Pages), ouvre la page : les modèles apparaissent dans la fiche de créature.
- En local : ouvre un terminal dans le dossier et lance `python3 -m http.server`, puis va sur http://localhost:8000
  (un double-clic sur index.html ne charge pas les fichiers).
- La version publiée dans l'aperçu de Claude ne peut pas charger tes fichiers : utilise GitHub Pages.
