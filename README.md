# Count

Suivi nutritionnel et sportif personnel. Application web statique (HTML/CSS/JS), sans compte, sans serveur distant, sans analytics. **Ce n'est pas une application iOS native (pas d'IPA).**

## Lancer en local
Depuis ce dossier :

    python3 -m http.server 8080

- Sur l'ordinateur : ouvrir http://localhost:8080
- Sur l'iPhone (même Wi-Fi) : trouver l'IP de l'ordinateur (ex. 192.168.1.20) et ouvrir `http://192.168.1.20:8080` dans Safari.

Note : le service worker (mode hors ligne) et l'installation exigent HTTPS ou localhost ; en HTTP sur le réseau local, l'app fonctionne mais sans mode hors ligne garanti.

## Installer sur l'écran d'accueil
Safari → bouton Partager → « Sur l'écran d'accueil ».

## Utilisation
- **Accueil** : calories restantes, énergie, macros, poids, sport du jour.
- **Repas** : favoris en un toucher, ajout manuel (option « favori »), suppression.
- **Sport** : activité, durée, intensité ; estimation MET : (MET − 1) × 3,5 × poids ÷ 200 × minutes.
- **Poids** : une mesure par date (remplace la précédente), courbe, variations.
- **Profil** : données, objectif et rythme, export/import JSON.

Calories restantes = objectif quotidien + sport du jour − calories consommées (le sport est ajouté séparément, sans double comptage).

## Données
Stockées dans `localStorage` sous la clé `cq-data` (compatible avec le prototype précédent). Elles peuvent être perdues si les données Safari sont effacées ou l'app réinstallée : **exportez régulièrement**.
Les valeurs (MET, 7 700 kcal/kg, macros) sont des estimations, pas des conseils médicaux.

## Fichiers
index.html, style.css, app.js, manifest.webmanifest, sw.js, icons/, make_icons.py (régénère les icônes).
