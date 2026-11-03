# Présentation et déplacements — v68

## Bourse

Le cuir transparent provient d'un visuel original généré par imagegen, intégré à `assets/pouch-leather-v68.webp` (768 px, environ 145 ko). Prompt de production : bourse en cuir cognac souple, grain fin, plis sculptés, coutures sellier, ouverture sombre, éclairage de studio, fond transparent, sans corde ni métal. Le SVG de `HackeniaSettings.pouchMarkup()` ajoute séparément la cordelette tressée, les embouts et le sceau en forme de dé. Les cinq couleurs, les trois textures et les trois métaux restent pilotés par les préférences existantes.

Le mouvement d'attente, les gestes d'ouverture et le lancement des trois dés utilisent la même scène. Le point de sortie des dés correspond à la nouvelle ouverture. La réduction des animations est respectée.

## Fiches

`assets/character-sheet.css` contient l'intégralité du style de la fiche commune à la collection et à la boutique. Les anciennes règles mobiles contradictoires de `portal.css` ont été retirées. Chaque SVG d'élément et de fermeture possède aussi une largeur et une hauteur intrinsèques. La fiche utilise une galerie bornée, des blocs de statistiques et la disposition réelle des dalles. Les aperçus des personnages officiels et leurs GLB restent intégrés.

## Sélection et déplacement

Le routeur de pointeurs du plateau distingue un toucher de sélection, un glissement de figurine, un glissement du décor et un pincement à deux doigts. Un toucher simple n'est plus absorbé par la caméra. Un clic sur une destination inaccessible conserve la sélection.

Une destination valide est préparée et mise en évidence. « Confirmer le déplacement » ou « Confirmer l'attaque » déclenche l'action réelle. « Annuler » ou choisir une autre case permet de corriger un mauvais clic avant de consommer l'action. Les règles restent : distance illimitée sur les dalles déployées reliées, un déplacement confirmé par tour ; évents et cases inaccessibles bloqués. L'IA utilise le même moteur de résolution, sans confirmation manuelle.

Le mouvement suit les cases du chemin. Une animation de marche Meshy peut être ajoutée dans `assets/manifest.json`, sous `creatures.<personnage>.animations.walk`, par exemple :

```json
"walk": "Models/Characters/Eberien marche.glb"
```

L'export doit reprendre le même squelette et les mêmes noms d'os que les autres animations du personnage. Le clip est chargé en avance, joué en boucle pendant le trajet, puis fondu vers l'attente. Aucun GLB de marche n'est inventé ou requis pour jouer.

Validation : `node tests/movement-input.cjs`, plus les tests existants de combat, d'attaque, de score et de terrain feu. Vérifications en navigateur : fiche Fourmi Caillou niveau 2 complète sur 393 × 640, ouverture de la bourse et consultation d'un dé obtenu, teintes de cuir et cordelette argentée, préparation/annulation/confirmation du déplacement d'Eberien.
