# Journal, Bubulles, bourse et terrain de feu

## Règles vérifiées

Le niveau d’une créature la protège contre l’écrasement par un dé posé de niveau inférieur ou égal. L’attaque décide du résultat d’un combat, y compris un combat de proximité déclenché après une invocation. Un niveau III peut donc vaincre un niveau IV si son attaque est supérieure. L’attaque reste celle de la dalle occupée, avec les bonus existants. Un écrasement ne compte pas dans les trois victoires de combat.

La protection utilise maintenant le niveau de la définition de la créature si son instance ne contient pas de niveau ; une seconde vérification protège la résolution de l’écrasement. Le scénario précis signalé n’a pas été reproduit comme un écrasement illégal. Les tests couvrent les 36 combinaisons de niveaux et un combat légal III contre IV.

Le journal distingue lancers, invocations, écrasements, combats et passages. Il affiche immédiatement les noms, niveaux, attaques et bonus au moment des combats, ainsi que la progression vers trois victoires. Les coordonnées, changements de numéros et annonces de tour supplémentaires sont masqués. Les entrées de passage expliquent le retrait des créatures présentes sur le trajet effacé, sans les compter comme des combats. Victoire : deux passages OU trois combats gagnés.

## Options et monnaie

La monnaie affichée est Bubulles, avec « une bubulle » à l’unité. Le champ historique interne `gold` est conservé : aucun solde, deck ou inventaire existant n’est réinitialisé.

`assets/settings.js` conserve séparément les options locales : son, volume, ambiance, animations, couleur et texture de cuir, cordelette. La cordelette par défaut est dorée. Les effets sonores sont synthétisés localement et désactivés par défaut ; aucun fichier audio ni microphone n’est utilisé. L’apparence de la bourse est un SVG texturé réutilisé dans Options et Boutique. L’achat de test coûte toujours 100 Bubulles et donne trois dés. Les trois résultats s’étalent ensemble. Le GLB du personnage, lorsqu’il existe, reste consultable dans sa fiche.

## Les Lèvres du Brasier

Le terrain de feu existant est remplacé par un diorama de cratère procédural (`assets/crater.js`), partagé avec le renderer 3D de la clairière : cadrage, sélection, figurines et déplacements identiques. Le bonus reste +1 pour les dalles Feu.

Six évents fixes, symétriques par rotation, empêchent les invocations, le recouvrement et les déplacements. Une face secondaire qui tombe sur un évent n’est pas posée ; le reste du dé suit les règles habituelles de placement partiel. L’ancrage d’un dé sur un évent est refusé. Les invocations, la recherche de trajet, l’IA utilisent la même interdiction. Les deux couloirs centraux et les zones de départ restent ouverts. La fumée devient statique quand les animations sont désactivées ; les marquages d’interdiction restent visibles.

La clairière et le cratère partagent les mêmes unités et le cache GLB. Les autres terrains conservent leur rendu antérieur. Le renderer de secours respecte l’ordre de dessin du sol et des coulées pour éviter les grands triangles masquant le terrain dans les navigateurs sans WebGL.

## Validation

- `node tests/rules-fire.cjs`
- `node tests/attack-history.cjs`
- `node tests/scoring.cjs`
- Vérification de syntaxe des quatre modules JS modifiés/ajoutés.
- Navigateur : personnalisation et persistance des options, achat en Bubulles, journal simplifié, terrain sélectionnable, rendu lave/fissures/évents et préservation des nouvelles cartes en main.

## Refonte visuelle de la lave et de l’ouverture

Le cratère est construit à la première sélection du terrain Feu, pour éviter de générer sa texture pendant l’ouverture du menu. Le sol combine une texture procédurale de plaques de basalte et de fissures fines, des veines modelées en relief, des coulées à cœur lumineux et bords refroidis, une mare de convection, des fragments de croûte, des flammèches et des braises. Le renderer de secours utilise la même texture sur un fond projeté. Les six évents et toutes les règles restent identiques.

`assets/pouch-opening.js` remplace l’apparition des cartes de résultat par une scène continue. La cordelette se desserre, la bouche s’ouvre, les trois dés partent ensemble de cette bouche, passent derrière une copie masquée de l’avant du cuir, puis suivent des arcs et des rotations différents, avec impacts, rebonds et ombres au sol. Les noms et raretés apparaissent à l’arrêt. L’achat est bloqué pendant l’animation. Les résultats sont sauvegardés avant celle-ci ; quitter la boutique n’annule pas le gain et ne bloque pas la prochaine ouverture. Les fiches des trois dés restent accessibles au clic. Le mode sans animations affiche directement les résultats.

Vérifications navigateur : achat et solde, révélation différée, consultation d’un dé révélé, ouverture sans animations, départ puis retour à la boutique pendant l’ouverture, sélection et rendu du terrain Feu. Les tests de règles de feu, d’attaque et de score passent.
