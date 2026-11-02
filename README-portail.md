# Portail des dés d’Hackénia

## Navigation et règles

- Partie rapide : moteur existant, IA activée, terrain aléatoire parmi les six terrains, deux decks aléatoires de dix dés (composition aléatoire historique conservée).
- Ma collection : catalogue des 36 variantes de dés existantes (six éléments × six niveaux), exemplaires possédés et doublons, fiches, recherche sans accents et filtres élément/niveau/possession, tris nom/niveau/élément/quantité.
- Mes decks : dix dés possédés, pas plus d’exemplaires dans un deck que dans l’inventaire. Un exemplaire peut servir dans plusieurs decks. Les decks incomplets restent en brouillon ; seules les équipes complètes sont sauvegardables et jouables. Duel personnel contre l’IA depuis l’éditeur, indépendamment de la partie rapide.
- Boutique : monnaie virtuelle de démonstration uniquement, aucun paiement ni service extérieur. Dix dés de départ, 1 000 pièces de test, booster de trois dés à 100 pièces. Économie provisoire à revoir avant une vraie progression. Niveaux I à VI : 35/25/18/12/8/2 %, éléments équiprobables. Le résultat est enregistré avant affichage. Les trois cartes de résultat s’étalent simultanément ; ceci ne remplace pas la future animation détaillée du sachet et des dés 3D.
- Histoire : entrée réservée, aucun chapitre inventé ni lancé.

Le plateau et les règles de combat restent dans index.html. assets/portal.js et portal.css portent les nouveaux écrans. Le menu bloque la programmation des prochains tours IA et la boucle de rendu 3D. Une action de jeu déjà engagée peut terminer sa résolution avant la reprise.

## Sauvegarde

Données locales au navigateur et à l’origine du site : `hackenia-dice-profile-v1`. Brouillon indépendant : `hackenia-dice-draft-v1`. Export et import JSON disponibles. L’import demande confirmation de remplacement. Un fichier invalide ou un échec d’écriture ne remplace pas les données existantes. Les données d’un aperçu et de GitHub Pages sont distinctes. Aucune synchronisation de compte ou entre appareils.

Raretés de présentation provisoires : I Commun, II Peu commun, III Rare, IV Épique, V Légendaire, VI Divin. Les valeurs du moteur, chances d’invocation et dalles ne changent pas.

## Modèles 3D à fournir

Le manifeste existant `assets/manifest.json` référence les fichiers `.glb` dans `assets/models/`. Aucun modèle n’est inclus dans cette mise à jour.

Exemple pour une première intégration : fournir le fichier GLB exporté avec textures intégrées, sans socle, et indiquer la créature à remplacer. Ne pas renommer arbitrairement un personnage pour l’associer à un animal : le nom, le lore et l’affectation seront adaptés ensemble lors de sa réception.

- Fiche de créature et collection : visualisation via model-viewer lorsqu’un fichier existe.
- Plateau Three.js de la clairière : chargement GLTF à la demande, cache par URL, copie des squelettes, centrage et normalisation de hauteur/encombrement ; animation idle si disponible.
- Figurine provisoire conservée si le fichier est absent ou illisible.
- Les cinq autres terrains utilisent encore le rendu historique de secours : leur passage aux modèles GLB sur le plateau reste à réaliser.
- La taille réelle, les matériaux et les animations devront être vérifiés avec le premier modèle fourni. Le code de chargement est prêt, pas encore validé sur un asset Meshy réel.

## Vérification

`node --check assets/portal.js`
`node --check assets/clearing.js`
`node tests/attack-history.cjs`
`node tests/scoring.cjs`

Vérifications navigateur : menu, recherche collection, achat de trois dés et solde, deck complet et renommage, persistance après rechargement, lancement contre l’IA et retour menu.
