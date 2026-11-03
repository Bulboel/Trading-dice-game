# Présentation des combats

Le moteur conserve ses règles et ses résultats synchrones. `logCombat` transmet à `assets/combat.js` une copie du plateau, des deux créatures et de leurs statistiques avant de retirer le perdant. La présentation lit cette copie jusqu’à la fin du duel, puis affiche l’état définitif du moteur. Les combats successifs sont joués dans l’ordre.

La séquence de 2,5 secondes montre la préparation, une attaque, l’impact, le recul et la disparition du vaincu. Le bandeau affiche les noms, les puissances et leur calcul (dalle et bonus). Une égalité conserve les deux créatures. Les résultats et compteurs restent masqués jusqu’à la fin de la présentation. L’IA attend la fin des animations avant de continuer son tour.

Dans la vue Three.js, le cadrage se rapproche temporairement du duel, puis retrouve le zoom et le déplacement choisis par le joueur. Les animations `spell` et `victory` du manifeste sont mises en cache et jouées sur les personnages qui en possèdent ; les figurines provisoires gardent les mouvements universels. Le rendu de secours conserve le bandeau et anime les figurines HTML. Aucun matériau partagé n’est rendu transparent pour simuler une défaite.

Les préférences de réduction du mouvement et l’option d’animation désactivent les mouvements de caméra, les attaques rapides et la réduction des figurines. Le résultat reste affiché. Revenir au menu suspend la séquence ; recommencer la partie la vide.

Validation :

```sh
node tests/combat-presentation.cjs
node tests/attack-history.cjs
node tests/scoring.cjs
node tests/rules-fire.cjs
```
