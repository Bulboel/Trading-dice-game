# Interface téléphone — v67

`assets/mobile.css` est chargé après les styles partagés. Il définit les dimensions mobiles pour les écrans jusqu’à 700 pixels de large. Le menu principal et la boutique utilisent la hauteur dynamique disponible (`100dvh`), sans largeur minimale de bureau. Le compteur de Bubulles occupe une colonne de 88 pixels et ne pousse pas l’en-tête hors de l’écran.

La bourse est le contrôle d’achat principal sur téléphone. Elle répond au toucher, au clavier et à un glissement de plus de 24 pixels. Le coût reste celui du jeu (10 Bubulles). Le contrôle est désactivé pendant l’ouverture et les premières découvertes, puis réactivé si le solde le permet. Les éléments décoratifs n’interceptent pas les pointeurs. Le plateau de révélation utilise `overflow: clip` pour éviter que le focus sur un bouton « Continuer » ne le fasse défiler en interne.

La main de cinq dés mesure 104 pixels de haut. Le nom occupe deux lignes au maximum, l’élément et le niveau ne sont plus répétés, et le lancer est indiqué sous la forme « 2 dés · 5+ ». Le panneau d’action remplace la main pendant le placement, au lieu de s’empiler sur elle.

Vérifications en navigateur : menu, boutique et partie dans 393 × 640 pixels ; largeur et hauteur du document égales à celles de l’écran ; trois ouvertures successives sans défilement de page ; ouverture au toucher et par glissement ; réactivation après les découvertes ; cinq cartes entièrement visibles.

Les tests de combat, de calcul d’attaque, de victoire et du terrain feu restent valides. Le numéro v67 est visible sous le titre du menu ; les nouveaux fichiers portent une version d’URL dédiée.
