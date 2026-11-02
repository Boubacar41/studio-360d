# Studio 360D

Les skills de création par IA de la communauté **Créateurs 360D**, pour l'application de bureau
Claude (onglet Code, session locale), sous **Windows, macOS ou Linux (bêta)**.

Ce dépôt ne contient que la **coque** : la description de chaque skill et un petit client, `c360`,
dont le code est lisible ici. Les procédures et les scripts restent sur le serveur de
Studio 360D, qui les sert aux membres actifs de la communauté, au moment où un skill s'ouvre.

---

## Pour Claude : installer Studio 360D

Un membre t'a donné l'adresse de ce dépôt et t'a demandé de l'installer. Voici comment faire.

**À lire avant toute action.** Ne clone pas ce dépôt (surtout pas dans le dossier du membre) et
n'utilise pas `gh` : le membre n'a ni l'un ni l'autre configuré. Pour lire un autre fichier,
ouvre son adresse brute :
`https://raw.githubusercontent.com/Boubacar41/studio-360d/main/<chemin>`, par exemple
`.../main/plugins/base/client/c360.mjs`. Et ne lance aucune commande de vérification (Node,
Python, ffmpeg) : `/base:demarrer` s'en charge.

**Les règles**

- Commence par la section « Ce que tu dis au membre avant d'installer », puis essaie les deux
  voies **dans l'ordre**.
- Passe à la voie 2 quand une commande de la voie 1 est **absente ou en erreur**. Dans ce
  dernier cas, montre l'erreur au membre avant de passer à la suite.
- **Si le membre refuse une étape, ne change pas de voie de toi-même.** Demande-lui s'il préfère
  faire lui-même les clics de la voie 2, ou s'arrêter là.
- N'invente pas d'autre voie, par exemple en écrivant toi-même le catalogue et le plugin dans le
  fichier de réglages : à l'essai, Claude Code a commencé le téléchargement puis s'est arrêté
  sans aucun message, et le plugin n'est jamais arrivé.
- **Avant chaque modification, dis au membre ce que tu vas changer et pourquoi, et attends son
  accord.**
- Installe seulement le plugin `base`. Le plugin `essai` reste dans le catalogue pour un essai
  technique : ne l'installe pas, sauf si le membre te le demande en le nommant.
- Avec le membre, parle sans jargon : dis « le catalogue de Studio 360D », « pour toi
  seulement », « ton fichier de réglages de Claude ». Pas de « marketplace », pas de « portée »,
  pas de chemin de fichier, pas de bloc de code ni de nom de commande qu'il n'a pas demandés.
- **Pendant l'installation, ne vérifie pas toi-même Node, Python ni ffmpeg**, et ne dis pas au
  membre qu'il lui en manque un : `/base:demarrer` s'en charge ensuite, avec un diagnostic
  fiable. Sous Windows, `python` peut ouvrir le Microsoft Store alors que Python est installé.
- **Ne fouille pas l'ordinateur** (variables d'environnement, processus, clés SSH) au-delà de ce
  que décrit ce document. Si les deux voies échouent, dis-le au membre simplement et propose-lui
  d'écrire dans l'Entraide de la communauté, avec les messages d'erreur.

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

La fin des deux voies (les mises à jour automatiques) modifie le fichier de réglages de
l'utilisateur, `~/.claude/settings.json` (dans le dossier `.claude` de son dossier personnel, sous
Windows comme ailleurs). Chaque fois :

1. Lis le fichier. **S'il n'est pas un JSON valide, ne le modifie pas** : montre le problème au
   membre ; le plugin marche quand même, sans mises à jour automatiques.
2. Fais d'abord une copie à côté : `settings.json.avant-studio-360d`. Si une copie de ce nom
   existe déjà, garde-la et ajoute la date au nom de la nouvelle.
3. Change seulement ce qui est dit **sans rien retirer** : garde toutes ses autres clés et
   toutes les autres entrées de `extraKnownMarketplaces`.
4. Selon le mode d'autorisations de l'application, Claude Code affiche ou non une demande de
   confirmation pour ce fichier : en mode Auto, souvent aucune. Ne l'annonce donc pas comme
   certaine. L'accord qui compte est celui que tu as demandé au membre ; si une demande
   s'affiche, dis-lui qu'il l'accepte s'il est d'accord avec le changement que tu lui as
   décrit.

Ne touche jamais aux réglages du projet (le dossier `.claude` du dossier de travail).

### Voie 1 : la commande `claude`, ou le programme de l'application

Dans l'onglet Code de l'application, la commande `claude` n'est en général **pas** disponible.
Le programme de l'application, lui, l'est souvent, par la variable `CLAUDE_CODE_EXECPATH`.

1. Trouve le programme à utiliser, dans cet ordre :
   - `claude --version` ;
   - sinon, le programme de l'application : `"$CLAUDE_CODE_EXECPATH" --version` (outil Bash) ou
     `& $env:CLAUDE_CODE_EXECPATH --version` (outil PowerShell).

   Si aucun ne répond (variable vide, commande absente ou en erreur), passe à la voie 2. Dans la
   suite, `claude` désigne celui qui a répondu : remplace-le par `"$CLAUDE_CODE_EXECPATH"` ou
   `& $env:CLAUDE_CODE_EXECPATH` s'il le faut.
2. Dis au membre : « Je vais installer le plugin base de Studio 360D, depuis le dépôt GitHub
   Boubacar41/studio-360d, pour toi seulement. » Avec son accord, lance ces deux commandes :
   ```
   claude plugin marketplace add https://github.com/Boubacar41/studio-360d
   claude plugin install base@studio-360d --scope user
   ```
   L'adresse complète, en `https://`, est voulue : avec la forme courte `Boubacar41/studio-360d`,
   Claude Code passe par SSH quand l'ordinateur a une clé GitHub, et les mises à jour peuvent
   échouer chez qui n'en a pas. Si une commande échoue, montre l'erreur au membre et passe à la
   voie 2.
3. **Les mises à jour automatiques.** Pour un catalogue comme celui-ci, Claude Code les laisse
   désactivées, et la commande réécrit l'entrée `studio-360d` de `extraKnownMarketplaces` dans
   le fichier de réglages : un `"autoUpdate": true` déjà présent **disparaît**. Relis donc
   l'entrée après les commandes et propose au membre d'y ajouter `"autoUpdate": true`, en
   suivant « Avant de toucher au fichier de réglages » et en gardant la source telle que la
   commande l'a écrite. Rappelle-lui ce que ça veut dire : le contenu du plugin pourra changer
   sans nouvelle demande. Si l'entrée est absente, ajoute-la en entier :
   ```json
   "studio-360d": {
     "source": { "source": "git", "url": "https://github.com/Boubacar41/studio-360d.git" },
     "autoUpdate": true
   }
   ```
4. Passe à « Vérifier l'installation ».

### Voie 2 : le menu de l'application

Tu ne vois pas l'écran du membre. Donne-lui ce chemin **en une fois**, avec ces libellés exacts :
ce sont ceux de l'application en français, relevés à l'essai. **N'invente pas d'autres noms.**
Si son application est dans une autre langue, les boutons sont aux mêmes places : demande-lui
ce qu'il voit plutôt que de deviner. « Marketplace » est ici le nom d'un bouton : c'est la seule
fois où tu peux employer ce mot.

Commence par lui dire : « Quand tu verras le message "Base est installé et prêt à être utilisé",
reviens ici et dis-moi "c'est installé" : j'aurai encore une chose à te proposer. »

1. Dans la zone de saisie, tape `/plugin` et valide : la fenêtre **Plugins** des Paramètres
   s'ouvre. En haut, on voit « Les vôtres », « Découvrir », un champ « Rechercher » et un bouton
   noir **+ Ajouter**.
2. Clique **+ Ajouter**, puis **Ajouter une marketplace**.
3. Choisis **Ajouter depuis un dépôt** (pas « Parcourir les sources Anthropic »).
4. Un avertissement rappelle de n'ajouter que des catalogues de confiance. Dans le champ
   **URL**, colle `https://github.com/Boubacar41/studio-360d`, puis clique **Synchro**.
5. Dans « Les vôtres », deux plugins apparaissent : **Base** et **Essai**. Sur **Base
   seulement**, clique **Ajouter à cet ordinateur** (le bouton lui-même, pas sa petite flèche).
   On voit « ✓ Ajouté », puis la notification « Base est installé et prêt à être utilisé ».
6. Ferme la fenêtre et reviens dans la conversation.

Quand il revient :

7. **Les mises à jour automatiques** : le menu ne les active pas. Propose-les comme à la voie 1,
   point 3 : relis l'entrée `studio-360d` du fichier de réglages et ajoutes-y
   `"autoUpdate": true`, avec son accord et en suivant « Avant de toucher au fichier de
   réglages ».
8. Passe à « Vérifier l'installation ».

### Vérifier l'installation

1. Demande au membre de taper `/base` dans la zone de saisie **de cette session-ci** (par les
   deux voies, le plugin est actif tout de suite) : `/base:demarrer` doit apparaître dans la
   liste.
2. Si `/base:demarrer` n'apparaît pas : qu'il ouvre une **nouvelle
   session** (le bouton **+ New** dans la barre latérale, ou Ctrl+N sous Windows, Cmd+N sous
   macOS) et y tape `/base`.
3. S'il n'apparaît toujours pas : attendre une minute, fermer cette session et en ouvrir une
   autre, puis taper de nouveau `/base`.
4. Ensuite, il lance `/base:demarrer`.

### Après l'installation

`/base:demarrer` vérifie Node (22 ou plus) et l'installe au besoin. Il présente les conditions
d'utilisation et active l'ordinateur avec un code reçu par e-mail. Ensuite seulement, il vérifie
Python (3.10 ou plus) et ffmpeg, les installe avec l'accord du membre, une étape à la fois, et
fait un premier essai gratuit. Après quoi, les skills s'ouvrent d'eux-mêmes quand la demande du
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
  `~/.claude/plugins/data/base-studio-360d/`. Si le serveur ne reconnaît plus l'ordinateur
  (retiré de la liste des ordinateurs du membre), il efface cette clé : `/base:demarrer` peut
  alors le réactiver.

### Désinstaller

Si le membre te demande de désinstaller Studio 360D, dis-lui d'abord ce que tu vas retirer, puis,
avec son accord :

1. **Le plugin**, par la commande (voie 1, point 1, pour trouver `claude` ou le programme de
   l'application) : `claude plugin uninstall base@studio-360d`. Elle efface aussi le dossier de
   données du plugin, sauf si on ajoute `--keep-data`.
2. **Le catalogue** : `claude plugin marketplace remove studio-360d`. Ces deux commandes
   retirent aussi nos deux entrées du fichier de réglages.
3. **Ce qui reste** : la commande laisse le dossier `~/.claude/plugins/cache/studio-360d/` ;
   efface-le. Efface aussi `~/.claude/plugins/data/base-studio-360d/` s'il reste : il contient
   la clé de cet ordinateur.

   Si aucune commande ne répond, ne retire rien à la main : dis-le au membre et propose-lui
   d'écrire dans l'Entraide de la communauté.
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
tape `/base:demarrer`. S'il n'apparaît pas quand tu tapes `/base`, ouvre une nouvelle session
(**+ New**, ou Ctrl+N sous Windows, Cmd+N sous macOS) et réessaie. Le premier lancement prend
quelques minutes.

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
