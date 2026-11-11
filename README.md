# Studio 360D

Les skills de création par IA de la communauté **Créateurs 360D**, pour l'application de bureau
Claude (onglet Code, session locale), sous **Windows, macOS ou Linux**.

Ce dépôt ne contient que la **coque** : la description de chaque skill, un petit client, `c360`,
dont le code est lisible ici, et la police DM Sans (licence libre SIL Open Font License). Les
procédures et les programmes restent sur le serveur de Studio 360D, qui les sert aux membres
actifs de la communauté, au moment où un skill s'ouvre.

## Ce que contient Studio 360D

### Base

Le socle de Studio 360D : démarrer, ta marque et ton marché, la stratégie, les prompts, la génération d'images, les personnages et la passe de réalisme.

- `/base:demarrer` : Installer, activer et préparer Studio 360D, puis ranger ton studio. À utiliser au premier lancement, sur un nouvel ordinateur, si le studio n'est pas activé ou si quelque chose ne marche pas.
- `/base:generer` : Générer des images chez ton fournisseur (fal.ai par défaut), avec le prix lu en direct et les dépenses notées. À utiliser pour lancer une génération, connaître un prix ou ce que tu as dépensé.
- `/base:inspiration` : Disséquer une pub ou une image qui marche (lien, capture ou fichier), en tirer un squelette neutre et des concepts pour ta marque. À utiliser quand on part d'un contenu qui performe.
- `/base:marche` : Étude de marché « voix du client » (express par défaut, ou complète) avec personas, mots, objections et affirmations à éviter. À utiliser pour connaître ses clients ou préparer une offre.
- `/base:marque` : Créer ou mettre à jour la fiche d'une marque ou d'un client (offre, public, ton, charte, produits) depuis un entretien, un site ou des documents. À utiliser avant de créer pour une nouvelle marque.
- `/base:passe-realisme` : Retirer l'aspect « IA » d'un clip vidéo généré (contraste, saturation, hautes lumières, léger tremblement). À utiliser quand un clip paraît trop propre, trop saturé ou « fait rendu 3D ».
- `/base:personnage` : Créer un personnage IA réaliste et constant (fictif, ou toi-même depuis tes photos) avec sa fiche en six angles. À utiliser pour un avatar, un mannequin ou un visage à garder d'une image à l'autre.
- `/base:prompt` : Écrire, améliorer, diagnostiquer un prompt d'image, retoucher une image et garder les prompts réussis. À utiliser quand une image paraît fausse ou générique, ou pour partir d'un exemple qui a marché.
- `/base:strategie` : Carte stratégique, structure éprouvée choisie selon le niveau de conscience, puis texte d'une pub ou d'un post. À utiliser pour écrire une pub ou un carrousel, de zéro ou depuis son propre script.

### Images

Le pack Images de Studio 360D : pubs image, posts et carrousels, et visuels de produits pour la boutique, la pub ou les réseaux.

- `/images:image` : Créer une pub image ou un post, en un passage ou en voie complète, carrousels compris, aux formats 1:1, 4:5 et 9:16. À utiliser pour toute image de pub ou de réseau social.
- `/images:visuels-produit` : Visuels e-commerce d'un produit (porté, en main, refait d'après une image, seul) qui gardent le produit exact, avec retouches ciblées. À utiliser pour la boutique, une pub ou les réseaux.

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
- Installe tous les packs du catalogue, `base` d'abord, et rien d'autre.
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

1. **Ce qui sera installé** : les packs Base et Images, 11 skills, téléchargés depuis ce dépôt GitHub. Chaque
   pack contient ses skills, la police DM Sans et un petit programme, le client du studio.
   L'installation ne télécharge que ce dépôt.
2. **À chaque ouverture de session** : le pack Base regarde, sur son ordinateur seulement et sans
   contacter le serveur, si Studio 360D est activé. Sinon, tu lui proposeras de l'activer.
3. **À chaque utilisation d'un skill** : le client télécharge depuis le serveur de Studio 360D
   la procédure à suivre et, si besoin, un programme. Il lance ce programme sur son
   ordinateur, dans son dossier de travail, puis l'efface. Studio 360D autorise lui-même ses
   propres commandes, celles du client et elles seules ; tout le reste suit son mode
   d'autorisations.
4. **Ce que le serveur connaît** : son adresse e-mail de membre, ses ordinateurs activés (nom,
   type, version et architecture du système), la liste des skills, références et outils qu'il
   ouvre (quand, depuis quel ordinateur) et la version des conditions qu'il a acceptée. Jamais
   ses créations ni ses fichiers. Quand il génère une image, son prompt et les images qu'il
   joint partent chez le fournisseur qu'il a choisi, avec sa clé.
5. **Ensuite** : si Node manque, `/base:demarrer` l'installe, avec son accord. Puis, une étape
   et un accord à la fois, il pose l'environnement du studio (environ 1 Go, quelques minutes,
   sans terminal ; sous Linux, un mot de passe peut être demandé pour une bibliothèque du
   système, si elle manque), son studio, son profil et une première image, dont il annonce
   le prix avant. Générer des images demande un compte payant chez un fournisseur d'images
   (fal.ai par défaut), que le membre crée quand `/base:demarrer` le lui propose. Enfin, il lui
   propose que les packs se mettent à jour seuls : leur contenu pourra alors changer sans
   nouvelle demande de sa part.

### Voie 1 : la commande `claude`, ou le programme qui fait tourner ta session

Dans l'onglet Code de l'application, la commande `claude` n'est en général **pas** disponible,
et la variable `CLAUDE_CODE_EXECPATH` est souvent vide. Le programme de Claude Code qui fait
tourner cette session, lui, est toujours là : on le retrouve en remontant de ta propre commande
au programme qui l'a lancée. Ce n'est pas une fouille : c'est le seul endroit où tu regardes.

1. Trouve le programme à utiliser, dans cet ordre. Arrête-toi au premier dont `--version`
   répond par un numéro suivi de `(Claude Code)` :
   - `claude --version` ;
   - si la variable n'est pas vide : `"$CLAUDE_CODE_EXECPATH" --version` (outil Bash) ou
     `& $env:CLAUDE_CODE_EXECPATH --version` (outil PowerShell) ;
   - le programme qui fait tourner cette session. Sous Windows, avec l'outil PowerShell :
     ```powershell
     $p = $PID; for ($i = 0; $i -lt 12 -and $p; $i++) { $x = Get-CimInstance Win32_Process -Filter "ProcessId=$p"; if (-not $x) { break }; if ($x.Name -eq 'claude.exe' -and $x.ExecutablePath -and $x.ExecutablePath -notlike '*\WindowsApps\*') { $x.ExecutablePath; break }; $p = $x.ParentProcessId }
     ```
     Sous macOS et Linux, avec l'outil Bash :
     ```bash
     p=$$; for i in 1 2 3 4 5 6 7 8 9 10 11 12; do e=$(readlink "/proc/$p/exe" 2>/dev/null || ps -o comm= -p "$p" 2>/dev/null); case "$e" in */claude|*/claude/versions/*) echo "$e"; break;; esac; p=$(ps -o ppid= -p "$p" 2>/dev/null | tr -d ' '); [ -n "$p" ] && [ "$p" -gt 1 ] || break; done
     ```
     Il affiche un chemin : vérifie-le avec `& "<chemin>" --version` (PowerShell) ou
     `"<chemin>" --version` (Bash). Ne lance jamais `--version` sur un autre programme que
     celui-là : celui de l'application ouvrirait une fenêtre.

   Si aucun ne répond par `(Claude Code)`, passe à la voie 2. Dans la suite, `claude` désigne
   celui qui a répondu : remplace-le par son chemin entre guillemets (`& "<chemin>"` sous
   PowerShell, `"<chemin>"` sous Bash).
2. Dis au membre : « Je vais installer Studio 360D, depuis le dépôt GitHub
   Boubacar41/studio-360d, pour toi seulement : les packs Base et Images, 11 skills. » Avec son accord, lance
   ces commandes, dans l'ordre :
   ```
   claude plugin marketplace add https://github.com/Boubacar41/studio-360d
   claude plugin install base@studio-360d --scope user
   claude plugin install images@studio-360d --scope user
   ```
   L'adresse complète, en `https://`, est voulue : avec la forme courte `Boubacar41/studio-360d`,
   Claude Code passe par SSH quand l'ordinateur a une clé GitHub, et les mises à jour peuvent
   échouer chez qui n'en a pas. Si une commande échoue, montre l'erreur au membre et passe à la
   voie 2.
3. **Les mises à jour automatiques** se proposent ensuite dans `/base:demarrer` : ne modifie pas
   le fichier de réglages pendant l'installation.
4. Passe à « Vérifier l'installation ».

### Voie 2 : le menu de l'application

Tu ne vois pas l'écran du membre. Donne-lui ce chemin **en une fois**, avec ces libellés exacts :
ce sont ceux de l'application en français, relevés à l'essai. **N'invente pas d'autres noms.**
Si son application est dans une autre langue, les boutons sont aux mêmes places : demande-lui
ce qu'il voit plutôt que de deviner. « Marketplace » est ici le nom d'un bouton : c'est la seule
fois où tu peux employer ce mot.

Le catalogue contient les packs Base et Images, 11 skills. Commence par lui dire : « Installe chaque pack,
Base d'abord. Quand tu verras le message "… est installé et prêt à être utilisé" pour le
dernier, reviens ici et dis-moi "c'est installé" : on vérifiera ensemble que tout est là. »

1. Dans la zone de saisie, tape `/plugin` et valide : la fenêtre **Plugins** des Paramètres
   s'ouvre. En haut, on voit « Les vôtres », « Découvrir », un champ « Rechercher » et un bouton
   noir **+ Ajouter**.
2. Clique **+ Ajouter**, puis **Ajouter une marketplace**.
3. Choisis **Ajouter depuis un dépôt** (pas « Parcourir les sources Anthropic »).
4. Un avertissement rappelle de n'ajouter que des catalogues de confiance. Dans le champ
   **URL**, colle `https://github.com/Boubacar41/studio-360d`, puis clique **Synchro**.
5. L'onglet **Découvrir** s'affiche, limité au catalogue studio-360d : le plugin **Base**
   apparaît, avec les autres packs. Sur **Base**, clique
   **Ajouter à cet ordinateur** (le bouton lui-même, pas sa petite flèche). On voit
   « ✓ Ajouté », puis la notification « Base est installé et prêt à être utilisé ».
6. Fais ensuite de même sur chaque autre pack, un par un : **Ajouter à cet ordinateur**, puis
   la notification à son nom (un pack amène Base de toute façon).
7. Ferme la fenêtre et reviens dans la conversation.

Si la fenêtre a été fermée avant la fin : `/plugin`, onglet **Découvrir**, icône de filtre, sous
« Source » choisis **studio-360d**, puis reprends au point 5 avec les packs qui manquent. Un pack
n'apparaît dans « Les vôtres » qu'une fois installé.

Quand il revient :

8. **Les mises à jour automatiques** se proposent ensuite dans `/base:demarrer` : ne modifie pas
   le fichier de réglages pendant l'installation.
9. Passe à « Vérifier l'installation ».

### Vérifier l'installation

1. Demande au membre de taper `/base` dans la zone de saisie **de cette session-ci** (par les
   deux voies, les packs sont actifs tout de suite) : `/base:demarrer` doit apparaître dans la
   liste. Puis, pour chaque autre pack, le nom du pack précédé de `/` : ses skills apparaissent.
2. Si `/base:demarrer` n'apparaît pas : qu'il ouvre une **nouvelle
   session** (le bouton **+ New** dans la barre latérale, ou Ctrl+N sous Windows, Cmd+N sous
   macOS) et y tape `/base`.
3. S'il n'apparaît toujours pas : attendre une minute, fermer cette session et en ouvrir une
   autre, puis taper de nouveau `/base`.
4. Ensuite, il lance `/base:demarrer`.

### Après l'installation

Si Node manque, `/base:demarrer` l'installe. Il présente les conditions d'utilisation et active
l'ordinateur avec un code reçu par e-mail. Ensuite, avec l'accord du membre et une étape à la
fois, il pose l'environnement du studio (environ 1 Go, quelques minutes, sans terminal ; sous
Linux, un mot de passe peut être demandé pour une bibliothèque du système, si elle manque),
puis son studio, son profil et une première image, dont il annonce le prix avant.
Après quoi, les skills s'ouvrent d'eux-mêmes quand la demande du membre s'y prête, par exemple
« enlève l'aspect IA de ce clip ».

### Ce que fait le client `c360`

- **Au démarrage de chaque session**, il regarde, sans contacter le serveur, si Studio 360D est
  activé sur l'ordinateur. Si Node manque, un message d'erreur peut s'afficher à l'ouverture
  d'une session : `/base:demarrer` le règle.
- **À chaque utilisation d'un skill**, il télécharge depuis le serveur de Studio 360D la
  procédure à suivre et, si besoin, un programme. Le programme tourne dans le dossier de
  travail du membre, puis le client l'efface.
- **Avec l'accord du membre**, quand `/base:demarrer` le lui propose, il active les mises à jour
  automatiques de Studio 360D dans le fichier de réglages de l'utilisateur de Claude Code : il y
  change ce seul réglage, garde tout le reste et n'en affiche rien. Il ne touche jamais aux
  réglages d'un projet.
- **Il envoie au serveur** : l'adresse e-mail de membre et la version des conditions acceptée
  (à l'activation), le nom de l'ordinateur, le type, la version et l'architecture de son
  système, la clé d'appareil, et le nom de chaque skill, référence ou outil demandé. Le serveur tient le
  journal de ces chargements. Jamais les fichiers ni les créations du membre.
- **Il garde** la clé d'appareil et l'environnement du studio dans le dossier de données des
  outils, `~/.claude/plugins/data/base-studio-360d/`, commun à tous les packs. Si le serveur ne
  reconnaît plus l'ordinateur (retiré de la liste des ordinateurs du membre), il efface cette
  clé : `/base:demarrer` peut alors le réactiver.

### Désinstaller

Si le membre te demande de désinstaller Studio 360D, dis-lui d'abord ce que tu vas retirer, puis,
avec son accord :

1. **Les packs**, par la commande (voie 1, point 1, pour trouver `claude` ou le programme de
   l'application) : `claude plugin uninstall <pack>@studio-360d` pour chaque pack autre que
   Base, puis `claude plugin uninstall base@studio-360d`. Chaque commande efface aussi le dossier
   de données du pack, sauf si on ajoute `--keep-data`.
2. **Le catalogue** : `claude plugin marketplace remove studio-360d`. Ces commandes retirent
   aussi nos entrées du fichier de réglages.
3. **Ce qui reste** : les commandes laissent le dossier `~/.claude/plugins/cache/studio-360d/` ;
   efface-le. Efface aussi `~/.claude/plugins/data/base-studio-360d/` s'il reste : il contient
   la clé de cet ordinateur et l'environnement du studio.

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
- Un ordinateur sous **Windows, macOS ou Linux**. Pour Linux : Ubuntu 22.04 ou plus, ou
  Debian 12 ou plus.
- Un compte payant chez un fournisseur d'images (fal.ai par défaut), réglé à l'usage : sans lui,
  aucune image ne sort. Tu le crées quand Claude te le propose.
- Rien d'autre à préparer. Si Node manque, `/base:demarrer` l'installe ; il faudra peut-être
  fermer et rouvrir l'application. Il pose ensuite, avec ton accord, l'environnement du studio
  (environ 1 Go, quelques minutes, sans terminal ; sous Linux, un mot de passe peut être demandé
  pour une bibliothèque du système, si elle manque), puis ton studio, ton profil et une première
  image, dont il t'annonce le prix avant.

**Installer Studio 360D**

Dans l'onglet Code, écris à Claude :

> Installe Studio 360D : https://github.com/Boubacar41/studio-360d

Claude te dit ce qui sera installé et ce qu'il va changer, et te demande ton accord. Ensuite,
tape `/base:demarrer`. S'il n'apparaît pas quand tu tapes `/base`, ouvre une nouvelle session
(**+ New**, ou Ctrl+N sous Windows, Cmd+N sous macOS) et réessaie. Le premier lancement prend
quelques minutes.

**Ce qui reste chez toi, et ce qui en sort**

Aucune création ni aucun fichier ne part sur le serveur de Studio 360D, ni les tiens ni ceux de
tes clients. Quand tu génères une image, ton prompt et les images que tu joins partent chez le
fournisseur que tu as choisi, avec ta clé, comme si tu l'utilisais toi-même. Ne joins donc rien
que tu ne veux pas lui confier. Le serveur ne connaît que ton e-mail, tes ordinateurs activés et
la liste des skills, références et outils que tu ouvres. Le détail est dans
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
