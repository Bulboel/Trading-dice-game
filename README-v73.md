# v73 — Contacts sur le trajet, orientation de combat et croûte volcanique

## Combat au premier contact

La recherche de trajet s’arrête dès qu’une case touche orthogonalement un ennemi. Les cases libres situées au-delà de ce contact ne sont plus des destinations de transit. La case ennemie demeure une cible d’attaque explicite ; les alliés ne peuvent pas servir de passage à travers un contact déjà engagé. Un détour reste possible s’il évite réellement les quatre cases voisines de l’adversaire.

Le même `bfs` alimente les cases accessibles, la confirmation et l’IA. La préparation d’un mouvement vers une case libre adjacente à un ennemi annonce désormais le combat et propose « Confirmer l’attaque ». La résolution de proximité intervient avant le score d’arrivée, aussi bien après un mouvement qu’après une invocation. Une entrée dans la zone adverse ne peut donc pas supprimer le trajet et escamoter un combat.

Tests : passage latéral pour chaque camp, victoire/défaite/égalité, arrêt obligatoire après égalité, contrôle de la zone d’arrivée, détours évitant tout contact, trajet libre de sept cases, cases impraticables et conservation des règles d’attaque et des statistiques.

## Eberien

L’orientation d’arrivée/idle des modèles Eberien et Kala est rétablie à la présentation antérieure (demi-tour local dans le support importé). La calibration vers l’axe natif du squelette n’est appliquée que pendant un duel, en complément de l’angle calculé vers l’adversaire. À la fin, l’orientation idle est restaurée. Les tests distinguent explicitement ces états. La vérification visuelle des GLB animés nécessite toujours un appareil WebGL.

## Terrain feu

`assets/basalt-field.js` produit un réseau continu de limites de plaques, déformé par plusieurs échelles de bruit. Les jonctions larges, fissures étroites, variations de chaleur, micro-fractures, bords refroidis et cœurs jaune orangé proviennent du même champ. Les anciens traits indépendants traversant le plateau sont supprimés.

Le terrain possède des atlas distincts pour l’albédo, l’émission et le relief, plus des plaques de croûte polygonales légèrement extrudées et biseautées. Le relief de la zone jouable reste inférieur aux dés déployés ; les six évents sont visuellement dégagés et leurs règles sont inchangées. Les petites flammes sont placées sur le réseau de fissures. Les deux écoulements périphériques ont été affinés et rendus asymétriques. Aucun élément des images de référence ni leurs filigranes n’est intégré au jeu.

QA navigateur : trajet latéral refusé au-delà du contact, confirmation d’attaque et bandeau de combat Eberien 4 contre Moineau 2 ; terrain observé en vue générale et rapprochée. Les tests de déplacement, score, événements, terrain feu, combat, orientation et lancers passent. Les dés du menu ne sont pas modifiés dans cette version.
