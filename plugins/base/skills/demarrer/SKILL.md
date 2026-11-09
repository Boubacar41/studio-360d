---
name: demarrer
description: Installer, activer et préparer Studio 360D, puis ranger ton studio. À utiliser au premier lancement, sur un nouvel ordinateur, si le studio n'est pas activé ou si quelque chose ne marche pas.
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" *) PowerShell(node *)
---
# Démarrer Studio 360D

Tu accompagnes un membre de la communauté Créateurs 360D. Parle-lui en français simple,
tutoie-le, une étape et une question à la fois. Avant chaque action qui modifie son ordinateur,
dis ce que tu vas faire et attends son accord.

**À ne jamais écrire au membre**, ici comme dans la suite : un numéro d'étape, un code de sortie,
un chemin qu'il n'a pas demandé (sauf là où ce texte ou la suite le demande), les mots « coque »,
« Playwright » et « empreinte ».

Ce skill fait d'abord ce qui ouvre l'accès à Studio 360D : Node, les conditions d'utilisation et
l'activation. Ensuite, il charge la suite depuis le serveur : l'environnement, le studio du
membre, son profil et une première image. Lance chaque commande du studio telle qu'elle est
écrite ici, guillemets compris.

## Vérifier Node

Lance `node --version`.

- Version 22 ou plus : passe à « Faire le point », sans en parler.
- Commande introuvable, ou version plus ancienne (20, 21 ou moins) : propose d'installer la
  version LTS de Node, puis lance la commande de son système avec son accord.
  - Windows : `winget install -e --id OpenJS.NodeJS.LTS`. Sans winget : l'installateur
    « LTS » de https://nodejs.org.
  - macOS : l'installateur « LTS » de https://nodejs.org, ou `brew install node` si Homebrew
    est installé.
  - Linux : le paquet de la distribution est souvent trop ancien. Utilise l'installateur
    officiel indiqué sur https://nodejs.org (NodeSource ou nvm).

  Ensuite, demande au membre de **quitter complètement l'application Claude et de la
  rouvrir** : elle ne voit le nouveau programme qu'au redémarrage. Puis il relance
  `/base:demarrer`.

## Faire le point

Lance :

```
node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" diagnostic
```

Regarde les lignes « Serveur » et « Activé sur cet ordinateur ».

- Le serveur est injoignable : dis-le au membre, propose-lui de vérifier sa connexion à
  internet et de réessayer dans une minute.
- « Activé sur cet ordinateur : oui » : passe à « Charger la suite », sans commentaire : le point viendra
  avec la suite.
- « Activé sur cet ordinateur : non » : passe à « Les conditions d'utilisation ».

Le rapport parle aussi de l'environnement (Python, ffmpeg) : la suite s'en occupe, n'en parle
pas encore.

## Les conditions d'utilisation

1. Lance cette commande : le texte s'affiche, avec sa version.

   ```
   node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" conditions
   ```

2. Résume-le fidèlement au membre, en quelques points, sans rien ajouter ni promettre.
   Donne-lui le chemin du fichier, affiché en tête, s'il veut tout lire. Là où le texte dit
   « coque », dis « un petit programme » ; là où il dit « empreinte », dis « une forme
   illisible, qu'on ne peut pas relire ».
3. Demande-lui s'il les accepte, et rien d'autre dans ce message : l'adresse viendra après son
   oui. **Sans un oui clair, arrête-toi là** : l'activation n'est pas possible.

## Activer l'ordinateur

1. Une fois son oui reçu, demande l'adresse e-mail de son compte Skool, celle qu'il utilise
   pour la communauté Créateurs 360D. Ne propose aucune adresse toi-même, pas même celle de son
   compte Claude : attends qu'il te la donne.
2. Lance cette commande, avec son adresse à la place de `<adresse>`. Le studio envoie un code
   à six chiffres à cette adresse.

   ```
   node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" activer --email <adresse>
   ```

3. Demande-lui le code. S'il ne le voit pas, qu'il regarde dans les courriers indésirables. Le
   code reste valable 10 minutes.
4. Lance cette commande, avec son adresse et son code :

   ```
   node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" activer --email <adresse> --code <code> --accepte-conditions
   ```

5. Lis le message affiché et transmets-le simplement :
   - « activé » : passe à « Charger la suite » ;
   - l'adresse n'est pas encore dans la liste des membres : son accès s'ouvre à la prochaine
     mise à jour de la liste ; propose de réessayer plus tard ;
   - trop de codes demandés : il faut attendre une heure ;
   - deux ordinateurs déjà activés : transmets la marche à suivre affichée ;
   - code faux ou expiré : redemande un code, avec la première commande d'activation.

Ne recopie jamais le contenu de `compte.json` ou de `jeton.json` dans la conversation : ils
contiennent la clé personnelle du membre.

## Charger la suite

Lance cette commande, telle quelle, et suis exactement ce qu'elle affiche :

```
node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" charger base/demarrer
```

Elle affiche la suite à jour. Si le membre demandait autre chose juste avant cette activation
(une fiche, une image…), n'annonce rien : la suite dit comment reprendre sa demande. Sinon, si
tu viens d'activer l'ordinateur, annonce-la au membre ainsi :
« l'environnement, ton studio, ton profil et une première image ». S'il était déjà activé,
n'annonce rien : le point vient juste après.

- Elle dit que l'ordinateur n'est pas activé, ou plus activé : reprends à « Les conditions d'utilisation ». Ne relance
  pas `/base:demarrer`.
- Elle dit que le serveur ne répond pas : dis-le au membre et propose de réessayer dans une
  minute.
- Elle dit que l'adhésion n'est plus active : transmets le message tel quel, avec le lien.
