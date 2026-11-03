# v70 — Logo, main, combinaisons magiques et inspection des figurines

- Logo vectoriel original `assets/hackenia-logo.svg` : dé arc-en-ciel, bulle transparente irisée, intégré au menu et comme favicon.
- La main affiche à nouveau la géométrie réelle du dé et les valeurs de ses faces, dans l’orientation du joueur. Sur téléphone, forme et portrait partagent la première ligne des cartes de 104 px.
- Une invocation est réussie si au moins un résultat atteint le seuil OU si les 2 ou 3 dés utilisés sont tous identiques. Aucun succès automatique avec un seul dé ; une paire dans un lancer de trois dés ne suffit pas. Le dé bonus fait partie de la combinaison et est consommé normalement.
- « Paire magique ! » / « Trio magique ! » sont affichés dans le résultat et l’historique. La probabilité de réussite utilisée par l’IA inclut les combinaisons sous le seuil.
- Bouton d’agrandissement sur les fiches collection, boutique, main et terrain. Vue dédiée : zoom +/−, molette/pincement, rotation, recentrage, T-pose par restauration du squelette de référence et animation idle du GLB. L’idle est choisi par défaut si les animations sont activées.
- Un modèle sans squelette/animation conserve uniquement ses commandes pertinentes. En cas de modèle absent ou de WebGL indisponible, l’illustration reste agrandissable ; aucune fausse animation n’est annoncée.
- Fermeture : libération du renderer, des contrôles, des textures et des géométries ; un chargement terminé après fermeture est annulé.

Validation : `tests/magic-rolls.cjs` explore exhaustivement les lancers à 1/2/3 dés et vérifie de vraies invocations et leur journal. `tests/character-stage.cjs` vérifie la restauration de pose et le cycle de vie avec une scène déterministe. Les tests de déplacement, combat, historique, score et terrain feu restent applicables.

QA navigateur : menu et jeu à 393 × 640 sans débordement ; géométrie visible dans les cinq cartes ; ouverture/fermeture et zoom de la vue rapprochée. Le navigateur cloud utilise le rendu léger, la représentation des GLB réels en WebGL reste à vérifier sur un appareil compatible.
