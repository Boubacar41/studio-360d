# Studio 360D

Les skills de création par IA de la communauté **Créateurs 360D**, pour l'application de bureau
Claude (onglet Code, session locale), sous **Windows, macOS ou Linux (bêta)**.

Ce dépôt ne contient que la **coque** : la description de chaque skill et un petit client, `c360`,
dont le code est lisible ici. Les procédures et les scripts restent sur le serveur de
Studio 360D, qui les sert aux membres actifs de la communauté, au moment où un skill s'ouvre.

---

## Pour Claude : installer Studio 360D

Un membre t'a donné l'adresse de ce dépôt et t'a demandé de l'installer. Voici comment faire.

**Les règles**

- Commence par la section « Ce que tu dis au membre avant d'installer », puis essaie les trois
  voies **dans l'ordre**.
- Passe à la voie suivante quand une commande est **absente, trop ancienne ou en erreur**. Dans
  ce dernier cas, montre l'erreur au membre avant de passer à la suite.
- **Si le membre refuse une étape, ne change pas de voie de toi-même.** Demande-lui s'il préfère
  faire lui-même les clics de la voie 3, ou s'arrêter là.
- **Avant chaque modification, dis au membre ce que tu vas changer et pourquoi, et attends son
  accord.**
- Installe seulement le plugin `base`. Le plugin `essai` reste dans le catalogue pour un essai
  technique : ne l'installe pas, sauf si le membre te le demande en le nommant.
- Avec le membre, parle sans jargon : dis « le catalogue de Studio 360D », « pour toi
  seulement », « ton fichier de réglages de Claude ». Pas de « marketplace », pas de « portée »,
  pas de chemin de fichier qu'il n'a pas demandé.

### Ce que tu dis au membre avant d'installer

Résume-lui ces points avec tes mots, simplement, puis demande-lui s'il veut continuer :

1. **Ce qui sera installé** : le plugin « base » de Studio 360D, téléchargé depuis ce dépôt
   GitHub. Il contient deux skills (démarrer, et la passe de réalisme pour les vidéos) et un
   petit programme, le client du studio. L'installation ne télécharge que ce dépôt.
2. **À chaque ouverture de session** : le plugin regarde, sur son ordinateur seulement et sans
   contacter le serveur, si Studio 360D est activé. Sinon, tu lui proposeras de l'activer.
3. **À chaque utilisation d'un skill** : le client télécharge depuis le serveur de Studio 360D
   la procédure à suivre et, si besoin, un script Python. Il lance ce script sur son
   ordinateur, dans son dossier de travail, puis l'efface.
4. **Ce que le serveur connaît** : son adresse e-mail de membre, ses ordinateurs activés (nom,
   type, version et architecture du système), la liste des skills qu'il ouvre (quand, depuis
   quel ordinateur) et la version des conditions qu'il a acceptée. Jamais ses créations ni ses
   fichiers.
5. **Ensuite** : le skill « démarrer » lui demandera séparément son accord pour chaque
   installation de Node, de Python ou de ffmpeg, s'il en manque un.
6. **Les mises à jour arrivent seules** : le contenu du plugin pourra changer sans nouvelle
   demande de sa part.

### Avant de toucher au fichier de réglages

Les voies 2 et 3, et la fin de la voie 1, modifient le fichier de réglages de l'utilisateur,
`~/.claude/settings.json` (dans le dossier `.claude` de son dossier personnel, sous Windows comme
ailleurs). Chaque fois :

1. Lis le fichier. **S'il n'est pas un JSON valide, ne le modifie pas** : montre le problème au
   membre et propose-lui la voie 3.
2. Fais d'abord une copie à côté : `settings.json.avant-studio-360d`. Si une copie de ce nom
   existe déjà, garde-la et ajoute la date au nom de la nouvelle.
3. Ajoute les clés **sans rien retirer** : garde toutes ses autres clés, et ajoute nos entrées à
   côté de celles qui existent déjà dans `extraKnownMarketplaces` et `enabledPlugins`. Si le
   fichier n'existe pas, crée-le avec ce seul contenu.
4. Claude Code affichera une demande de confirmation, parce que ce fichier règle l'application.
   Explique au membre qu'il l'accepte s'il est d'accord avec le changement que tu lui as montré.

Ne touche jamais aux réglages du projet (le dossier `.claude` du dossier de travail).

### Voie 1 : la commande `claude`

1. Lance `claude --version`. Si la commande est absente ou en erreur, passe à la voie 2.
2. Lance `claude plugin install --help` et regarde si l'option `--marketplace` existe (elle
   arrive avec Claude Code 2.1.292).
   - **Si elle existe**, dis au membre : « Je vais installer le plugin base de Studio 360D,
     depuis le dépôt GitHub Boubacar41/studio-360d, pour toi seulement. » Avec son accord :
     ```
     claude plugin install base --marketplace Boubacar41/studio-360d
     ```
   - **Sinon**, la même installation en deux temps, avec son accord :
     ```
     claude plugin marketplace add Boubacar41/studio-360d
     claude plugin install base@studio-360d --scope user
     ```
   Si une commande échoue, montre l'erreur au membre et passe à la voie 2.
3. **Les mises à jour automatiques.** Pour un catalogue comme celui-ci, Claude Code les laisse
   désactivées. La commande a ajouté l'entrée `studio-360d` dans `extraKnownMarketplaces` du
   fichier de réglages : propose au membre d'y ajouter `"autoUpdate": true`, en suivant
   « Avant de toucher au fichier de réglages ». Rappelle-lui ce que ça veut dire : le contenu
   du plugin pourra changer sans nouvelle demande. Si l'entrée est absente, ajoute-la en entier,
   comme à la voie 2.
4. Passe à « Vérifier l'installation ».

### Voie 2 : les réglages de l'utilisateur

1. Montre au membre ce que tu vas ajouter à son fichier de réglages de Claude :
   ```json
   {
     "extraKnownMarketplaces": {
       "studio-360d": {
         "source": { "source": "github", "repo": "Boubacar41/studio-360d" },
         "autoUpdate": true
       }
     },
     "enabledPlugins": { "base@studio-360d": true }
   }
   ```
   Explique-lui en deux phrases : la première partie fait connaître à Claude le catalogue de
   Studio 360D et active ses mises à jour automatiques (le contenu du plugin pourra changer sans
   nouvelle demande) ; la seconde active le plugin « base ».
2. Avec son accord, ajoute ces clés en suivant « Avant de toucher au fichier de réglages ».
3. Passe à « Vérifier l'installation ». Avec cette voie, Claude Code télécharge le catalogue et
   le plugin en arrière-plan, au début de la session suivante.

### Voie 3 : le menu de l'application

Explique au membre les clics, un à la fois :

1. Le bouton **+** à côté de la zone de saisie, puis **Add plugins** (Ajouter des plugins). Si le
   menu affiche **Plugins** à la place : **Plugins**, puis **Browse plugins**.
2. Dans le catalogue **studio-360d**, le plugin **base (pas essai)**, installé pour **ton compte
   utilisateur** (ni « ce projet », ni « local »).
3. Si le catalogue **studio-360d** n'apparaît pas : taper dans la zone de saisie
   `/plugin marketplace add Boubacar41/studio-360d`, valider, puis reprendre au point 1.
4. **Les mises à jour automatiques** : comme à la voie 1, point 3, propose d'ajouter
   `"autoUpdate": true` à l'entrée `studio-360d` du fichier de réglages, avec son accord.
5. Passe à « Vérifier l'installation ».

### Vérifier l'installation

1. Demande au membre d'ouvrir une **nouvelle session** : le bouton **+ New** dans la barre
   latérale, ou Ctrl+N sous Windows, Cmd+N sous macOS.
2. Dans la nouvelle session, qu'il tape `/base` dans la zone de saisie : `/base:demarrer` doit
   apparaître dans la liste.
3. S'il n'apparaît pas : attendre une minute, fermer cette session et en ouvrir une autre, puis
   taper de nouveau `/base`.
4. Ensuite, il lance `/base:demarrer`.

### Après l'installation

`/base:demarrer` vérifie Node (22 ou plus), Python (3.10 ou plus) et ffmpeg, et les installe avec
l'accord du membre, une étape à la fois. Il active l'ordinateur avec un code reçu par e-mail, puis
fait un premier essai gratuit. Ensuite, les skills s'ouvrent d'eux-mêmes quand la demande du
membre s'y prête, par exemple « enlève l'aspect IA de ce clip ».

### Ce que fait le client `c360`

- **Au démarrage de chaque session**, il regarde, sans contacter le serveur, si Studio 360D est
  activé sur l'ordinateur. Si Node manque, un message d'erreur peut s'afficher à l'ouverture
  d'une session : `/base:demarrer` le règle.
- **À chaque utilisation d'un skill**, il télécharge depuis le serveur de Studio 360D la
  procédure à suivre et, si besoin, un script Python. Le script tourne dans le dossier de
  travail du membre, puis le client l'efface.
- **Il envoie au serveur** : l'adresse e-mail de membre et la version des conditions acceptée
  (à l'activation), le nom de l'ordinateur, le type, la version et l'architecture de son
  système, la clé d'appareil, et le nom de chaque skill ou outil demandé. Le serveur tient le
  journal de ces chargements. Jamais les fichiers ni les créations du membre.
- **Il garde** la clé d'appareil dans le dossier de données du plugin,
  `~/.claude/plugins/data/base-studio-360d/`.

### Désinstaller

Si le membre te demande de désinstaller Studio 360D, dis-lui d'abord ce que tu vas retirer, puis,
avec son accord :

1. **Le plugin** :
   - par la commande, si `claude` répond : `claude plugin uninstall base@studio-360d`. Elle
     efface aussi le dossier de données du plugin, sauf si on ajoute `--keep-data` ;
   - sinon, par le menu : **+** à côté de la zone de saisie, **Plugins**, **Manage plugins**,
     puis le plugin **base** et **Uninstall**.
2. **Le catalogue** : `claude plugin marketplace remove studio-360d`. Sans la commande `claude`,
   retire du fichier de réglages l'entrée `studio-360d` de `extraKnownMarketplaces` et l'entrée
   `base@studio-360d` de `enabledPlugins`, en suivant « Avant de toucher au fichier de
   réglages ».
3. **Le dossier de données**, s'il reste : `~/.claude/plugins/data/base-studio-360d/`. Il
   contient la clé de cet ordinateur ; efface-le.
4. Dis au membre que cet ordinateur compte encore parmi ses deux ordinateurs activés : pour
   libérer la place, il écrit dans l'Entraide de la communauté.
5. Demande-lui d'ouvrir une nouvelle session.

---

## Pour toi, membre de Créateurs 360D

**Ce qu'il te faut**

- L'application de bureau Claude, avec un abonnement Pro au minimum. Tu travailles dans
  l'onglet **Code**, en session **locale**, dans le dossier où tu ranges tes créations.
- Un ordinateur sous **Windows, macOS ou Linux (bêta)**. Pour Linux : Ubuntu 22.04 ou plus,
  ou Debian 12 ou plus.
- Node, Python et ffmpeg : `/base:demarrer` les vérifie et les installe avec ton accord, une
  étape à la fois. Il faudra peut-être fermer et rouvrir l'application.

**Installer Studio 360D**

Dans l'onglet Code, écris à Claude :

> Installe Studio 360D : https://github.com/Boubacar41/studio-360d

Claude te dit ce qui sera installé et ce qu'il va changer, et te demande ton accord. Ensuite,
ouvre une nouvelle session (**+ New**, ou Ctrl+N sous Windows, Cmd+N sous macOS) et tape
`/base:demarrer`. Le premier lancement prend quelques minutes.

**Ce qui reste chez toi**

Aucune création ni aucun fichier ne part sur le serveur : tes créations, tes fichiers et ceux de
tes clients restent sur ton ordinateur. Le serveur ne connaît que ton e-mail, tes ordinateurs
activés et la liste des skills que tu ouvres. Le détail est dans
[CONDITIONS.md](CONDITIONS.md) (brouillon).

**Les règles**

Studio 360D est réservé aux membres actifs de la communauté, sur deux ordinateurs au plus. Les
conditions d'utilisation sont dans [CONDITIONS.md](CONDITIONS.md) (brouillon).

**Si quelque chose ne marche pas**

Tape `/base:demarrer` : il commence par un diagnostic de ton ordinateur et répare ce qui
manque. Si le problème reste, colle le rapport de diagnostic dans l'Entraide de la communauté.
Le rapport ne contient ni ton e-mail ni ta clé.

**Désinstaller**

Écris à Claude :

> Désinstalle Studio 360D : https://github.com/Boubacar41/studio-360d
