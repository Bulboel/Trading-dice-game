# Bruitages personnalisés

Déposez ici vos bruitages : s'ils existent, ils remplacent automatiquement les sons du jeu (sinon le jeu garde ses sons actuels).

**Format : MP3** (le plus sûr sur navigateur, téléphone et application Android).
- Mono, 44,1 kHz, 96 à 128 kbit/s. Courts : de 0,2 à 3 secondes (la roulade de dés et l'invocation peuvent aller jusqu'à 4 s).
- Pas de silence au début (le son démarre tout de suite), volume normalisé vers −3 dB (crête) ; le curseur de volume du jeu s'applique ensuite.
- Un fichier par son, nom en minuscules, sans accent, extension `.mp3`.

| Fichier | Quand il joue |
|---|---|
| `lancer.mp3` | lancer du dé |
| `roulement.mp3` | roulement des dés |
| `impact.mp3` | un dé touche la table |
| `invocation.mp3` | une créature s'éveille |
| `apparition.mp3` | la créature apparaît |
| `deploiement.mp3` | le dé se déplie en dalles |
| `combat.mp3` | combat entre créatures |
| `point.mp3` | passage dans le camp adverse |
| `victoire.mp3` | victoire |
| `ouverture.mp3` | ouverture de la bourse |
| `rarete.mp3` | dé rare, légendaire ou énergie à l'ouverture |
| `divin.mp3` | dé divin ou crépitant (cérémonie) |

Musiques : remplacez `assets/audio/musique-en-duel.mp3` (duels) et `assets/Musique menu jeu.mp3` (menus), en MP3 stéréo 128 kbit/s, bouclables (début et fin raccordés).
