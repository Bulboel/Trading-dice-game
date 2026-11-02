# Clairière des murmures

Premier terrain refondu des Dés d’Hackénia. Il est sélectionné à l’ouverture du jeu.

- `clearing.js` dessine une scène Three.js (version 0.170.0, chargée via jsDelivr) : sol sculpté, rivière, végétation, décors et pièces. Aucune image de décor ni modèle externe requis.
- Le jeu conserve ses calculs de placement, de bonus, de combat et de victoire dans `index.html`. `window.hackeniaGame` expose uniquement l’état et les actions nécessaires à la présentation.
- La rivière et les reliefs sont décoratifs : les 80 cases gardent leurs coordonnées et leurs règles.
- Le mode Auto réduit les effets sur les petits écrans et les appareils à faible nombre de cœurs. Les options Légère et Sans mouvement sont disponibles ; le réglage système de réduction des animations est respecté.
- En cas d’indisponibilité de WebGL, la même scène est projetée en Canvas 2D, sans ombres ni vent dans l’herbe. Si le module distant ne peut pas être chargé, le plateau HTML reste jouable.
- Les figurines sont des substituts 3D provisoires. Les GLB Meshy restent pris en charge dans les fiches ; leur intégration dans la scène est une étape ultérieure.
- Les cinq autres terrains conservent leur rendu précédent ; leurs grands décors en émojis ont été retirés.

Validation : syntaxe JavaScript, comparaison de 22 fonctions de jeu avec la version précédente ; essais des placements autorisés/interdits, bonus, déplacements de trois cases et zones de départ. Vérification dans le navigateur du rendu léger, du placement, du lancer, de l’IA, de la sélection et du déplacement de créatures, de la rotation et du format 390 × 844. L’accélération WebGL est désactivée dans le navigateur de vérification : le rendu GPU et les performances sur téléphone physique doivent encore être contrôlés sur des appareils compatibles.
