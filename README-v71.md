# v71 — Bourses, première découverte, orientation et aperçu du deck

## Ouverture et nouvelle découverte

`assets/invocation.js` reprend la géométrie et la fonction de pose du prototype validé `eberien-invocation-test.html` : cinq dalles déployées avec leurs cercles dorés, sixième dalle horizontale levée de 0,55 unité, dissolution en 1 300 particules arc-en-ciel, puis apparition du personnage. La scène dure trois secondes. Les GLB disponibles conservent leur idle. Une version CSS équivalente présente l’illustration lorsque WebGL n’est pas disponible.

La découverte utilise une fenêtre dédiée et fermable, avec séquence des nouveaux dés, bouton Continuer et possibilité de passer les découvertes. Elle ne couvre plus les noms de dés dans la bourse. Les ornements en forme de feuilles sont retirés des six faces des dés.

La cordelette suit un tracé continu, ancré dans les passants. Les trois couches de tresse partagent la même interpolation ; le nœud se défait en deux brins pendants dont les embouts restent attachés. La corde appartient au même groupe SVG que le cuir, ce qui évite la séparation pendant les mouvements.

Le sac occupe la partie haute de la table, puis diminue légèrement après la révélation. Les trois dés, les raretés, les noms et le statut disposent chacun d’une zone distincte. La boutique reste bornée au viewport du téléphone.

## Achat de dix bourses

Une bourse coûte 10 Bubulles ; le lot de dix coûte 90 et contient trente dés. `assets/purchases.js` prépare l’achat sans modifier le profil vivant ; un seul enregistrement applique débit et inventaire. Les dix groupes de révélation sont conservés dans `profile.pouchQueue`. La bourse ouvre gratuitement le prochain groupe payé ; un rechargement conserve les bourses restantes et les trente dés. Les découvertes sont identifiées sur l’ensemble du lot, avec conservation des doublons.

## Figurines et deck

L’orientation d’un modèle est calibrée à partir de l’axe entre les hanches du squelette (épaules en repli). L’angle d’attaque reste calculé vers l’adversaire ; la calibration corrige l’axe natif du GLB et les rotations de racine des animations, sans imposer un demi-tour fixe à Eberien/Kala. La même calibration s’applique à l’inspection 3D.

Un bandeau fixe affiche les dix emplacements du deck pendant la consultation du catalogue. Il présente les noms, niveaux, accès aux fiches, retrait et sauvegarde ; ajout/retrait garde le défilement courant. Les filtres restent actifs.

Le logo est recentré dans sa bulle et associe le dé arc-en-ciel à un double hexagone doré biseauté, inspiré du sceau de la bourse.

## Vérification

Tests achats atomiques, tarifs, trente dés et file persistante ; orientation pour quatre axes de modèle et quatre directions adverses ; continuité de la corde et absence de feuilles ; comparaison du déploiement avec le prototype validé. Les tests existants de lancer magique, déplacement, combat, historique, score et évents passent.

QA à 393 × 640 : achat 100 → 10 Bubulles, neuf bourses après la première ouverture, neuf restantes après rechargement, puis huit avec solde inchangé ; découverte fermable ; retour aux trois dés et noms ; aperçu des dix cases du deck visible lors de recherche et d’ajout/retrait. Le navigateur cloud utilise le rendu sans WebGL : l’apparence finale des GLB et leur orientation animée restent à confirmer sur un appareil WebGL.
