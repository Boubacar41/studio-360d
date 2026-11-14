# DM Sans : provenance

- **Police** : DM Sans, en version variable (axes `opsz` et `wght`), romain et italique ; plus deux statiques,
  SemiBold et Bold (plus bas), pour les sous-titres : le programme qui les dessine ne sait prendre d'une police
  variable que son instance par défaut, la Regular.
- **Source** : le dépôt public de Google Fonts, `google/fonts`, dossier `ofl/dmsans/`.
- **Commit** : `5b35b7208dd4100571326fdf37f030b32a524232`, du 21 mai 2026
  (https://github.com/google/fonts/commit/5b35b7208dd4100571326fdf37f030b32a524232). C'est la dernière
  modification de `ofl/dmsans/` avant le 25 octobre 2026, relevée par l'API publique de GitHub :
  `https://api.github.com/repos/google/fonts/commits?path=ofl/dmsans&until=2026-10-25T00:00:00Z`.
- **Téléchargé le** 8 novembre 2026, depuis les adresses ci-dessous.
- **Licence** : SIL Open Font License 1.1 (« Copyright 2014 The DM Sans Project Authors »), texte complet dans
  `OFL.txt`.

| Fichier ici | Fichier d'origine | Adresse exacte | SHA-256 |
|---|---|---|---|
| `DMSans-Variable.ttf` | `DMSans[opsz,wght].ttf` | https://raw.githubusercontent.com/google/fonts/5b35b7208dd4100571326fdf37f030b32a524232/ofl/dmsans/DMSans%5Bopsz%2Cwght%5D.ttf | `8cd08d97e89c24d0aa92edd2f0f4c8ee6195eee9b7c9f154865a58b02f0c1c0d` |
| `DMSans-Italique-Variable.ttf` | `DMSans-Italic[opsz,wght].ttf` | https://raw.githubusercontent.com/google/fonts/5b35b7208dd4100571326fdf37f030b32a524232/ofl/dmsans/DMSans-Italic%5Bopsz%2Cwght%5D.ttf | `22259c0cc8237221b80f44c76ba8d36e6bce3cda72779f5b2773643d499720ae` |
| `OFL.txt` | `OFL.txt` | https://raw.githubusercontent.com/google/fonts/5b35b7208dd4100571326fdf37f030b32a524232/ofl/dmsans/OFL.txt | `9af36190332437f5ecd09974de43c1f7c77a310a996cdd8ceb25628b458840e1` |

Les trois fichiers sont copiés tels quels, à l'octet près (`OFL.txt` garde ses fins de ligne CRLF d'origine : le
`.gitattributes` du dépôt le soustrait à la conversion). Contrôle fait au téléchargement : l'empreinte git de chaque
fichier égale celle que donne l'API de GitHub pour ce commit (`c672f98…` pour le romain, `bf6819b…` pour l'italique,
`4430b85…` pour la licence).

## Les deux statiques, SemiBold et Bold

`google/fonts` ne publie DM Sans qu'en variable. Les statiques viennent donc du dépôt d'origine de la police,
celui que `google/fonts` cite lui-même dans `ofl/dmsans/METADATA.pb` (`source { repository_url }`) :
`googlefonts/dm-fonts`, dossier `Sans/fonts/ttf/`, au commit que ce même fichier nomme pour la version 4.004.

- **Commit** : `d0520ba03bd780f5dccb3024854463d44f699b78`, du 14 juin 2023
  (https://github.com/googlefonts/dm-fonts/commit/d0520ba03bd780f5dccb3024854463d44f699b78). C'est le commit d'où
  vient la version variable ci-dessus (version 4.004), et la dernière modification des deux fichiers avant le
  29 octobre 2026, relevée par l'API publique de GitHub :
  `https://api.github.com/repos/googlefonts/dm-fonts/commits?path=Sans/fonts/ttf/DMSans24pt-SemiBold.ttf&until=2026-10-29T00:00:00Z`
  (et de même pour `DMSans24pt-Bold.ttf`).
- **Téléchargé le** 11 novembre 2026. **Licence** : la même, SIL Open Font License 1.1 ; le `OFL.txt` de ce dépôt
  (`Sans/OFL.txt`, même commit) est identique à l'octet près à celui d'ici.
- **Taille optique 24 pt** : celle des sous-titres en vidéo, à mi-chemin des tailles de la police (9 à 40 pt).

| Fichier ici | Fichier d'origine | Adresse exacte | SHA-256 |
|---|---|---|---|
| `DMSans-SemiBold.ttf` | `DMSans24pt-SemiBold.ttf` | https://raw.githubusercontent.com/googlefonts/dm-fonts/d0520ba03bd780f5dccb3024854463d44f699b78/Sans/fonts/ttf/DMSans24pt-SemiBold.ttf | `4c641bbafcfbce8d8660184a23192073b782ce946d02624aea76e4a24a4b5deb` |
| `DMSans-Bold.ttf` | `DMSans24pt-Bold.ttf` | https://raw.githubusercontent.com/googlefonts/dm-fonts/d0520ba03bd780f5dccb3024854463d44f699b78/Sans/fonts/ttf/DMSans24pt-Bold.ttf | `ffcda6673a69af41151a7c2e4a9ba92dd08f4b06f5cb8ab2b57496f400ec0585` |

Copiés tels quels, à l'octet près. Contrôle fait au téléchargement : l'empreinte git de chaque fichier égale celle que
donne l'API de GitHub pour ce commit (`4c378d8…` pour le SemiBold, `aec22bb…` pour le Bold). Leurs chasses sont celles
de la police variable instanciée au même poids et en 24 pt (`wght` 600 et 700, `opsz` 24) : aucune des 486 chasses ne
diffère.

**Les noms que lit le programme des sous-titres** (table `name` des fichiers, sans retouche) :

| Fichier | Famille (nom 1) | Style (nom 2) | Nom complet (nom 4) |
|---|---|---|---|
| `DMSans-SemiBold.ttf` | `DM Sans 24pt SemiBold` | `Regular` | `DM Sans 24pt SemiBold` |
| `DMSans-Bold.ttf` | `DM Sans 24pt DM Sans 24pt Regular` | `Bold` | `DM Sans 24pt Bold` |

Le nom de famille du Bold est mal formé dans le fichier d'origine : il se désigne par son nom complet,
`DM Sans 24pt Bold`, qui est juste. Le SemiBold se désigne par `DM Sans 24pt SemiBold` (famille et nom complet).

## Les noms des fichiers

`OFL.txt` ne déclare aucun nom réservé (« Reserved Font Name ») après la mention de copyright. Renommer les fichiers
est donc permis : seuls les noms des fichiers changent, pour retirer les crochets et la virgule qui gênent certains
programmes, et la taille optique des statiques. Le contenu des polices n'est pas modifié, et leur nom interne reste
DM Sans.
