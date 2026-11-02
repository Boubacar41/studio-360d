---
name: demarrer
description: Installer et activer Studio 360D sur cet ordinateur (Node, conditions d'utilisation, activation par un code reçu par e-mail, puis Python, ffmpeg et un premier essai gratuit). À utiliser au premier lancement, quand Studio 360D dit qu'il n'est pas activé ou plus activé, sur un nouvel ordinateur, ou quand un programme du studio manque.
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" *) PowerShell(node *)
---
# Démarrer Studio 360D

Tu accompagnes un membre de la communauté Créateurs 360D. Parle-lui en français simple,
tutoie-le, une étape à la fois. Avant chaque action qui modifie son ordinateur, dis ce que tu
vas faire et attends son accord. Rien ici ne coûte d'argent.

Ce skill fait d'abord ce qui ouvre l'accès au studio : Node, les conditions d'utilisation et
l'activation. Ensuite, il charge la suite depuis le serveur : Python, ffmpeg, le profil et le
premier essai. Lance chaque commande du studio telle qu'elle est écrite ici, guillemets compris.

## 1. Vérifier Node

Lance `node --version`.

- Version 22 ou plus : passe à l'étape 2.
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

## 2. Faire le point

Lance :

```
node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" diagnostic
```

Regarde les lignes « Serveur » et « Activé sur cet ordinateur ».

- Le serveur est injoignable : dis-le au membre, propose-lui de vérifier sa connexion à
  internet et de réessayer dans une minute.
- « Activé sur cet ordinateur : oui » : passe à l'étape 5.
- « Activé sur cet ordinateur : non » : passe à l'étape 3.

Le rapport parle aussi de Python et de ffmpeg : la suite s'en occupe, n'en parle pas encore.

## 3. Les conditions d'utilisation

1. Lance cette commande : le texte s'affiche, avec sa version.

   ```
   node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" conditions
   ```

2. Résume-le fidèlement au membre, en quelques points, sans rien ajouter ni promettre.
   Donne-lui le chemin du fichier, affiché en tête, s'il veut tout lire.
3. Demande-lui s'il les accepte. **Sans un oui clair, arrête-toi là** : l'activation n'est pas
   possible.

## 4. Activer l'ordinateur

1. Demande l'adresse e-mail de son compte Skool, celle qu'il utilise pour la communauté
   Créateurs 360D.
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
   - « activé » : passe à l'étape 5 ;
   - l'adresse n'est pas encore dans la liste des membres : son accès s'ouvre à la prochaine
     mise à jour de la liste ; propose de réessayer plus tard ;
   - trop de codes demandés : il faut attendre une heure ;
   - deux ordinateurs déjà activés : transmets la marche à suivre affichée ;
   - code faux ou expiré : redemande un code (point 2).

Ne recopie jamais le contenu des fichiers du studio (`compte.json`, `jeton.json`) dans la
conversation : ils contiennent la clé personnelle du membre.

## 5. Charger la suite

Lance cette commande, telle quelle, et suis exactement ce qu'elle affiche :

```
node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" charger base/demarrer
```

Elle affiche la suite à jour : Python, ffmpeg, le profil et le premier essai gratuit.

- Elle dit que l'ordinateur n'est pas activé, ou plus activé : reprends à l'étape 3. Ne relance
  pas `/base:demarrer`.
- Elle dit que le serveur ne répond pas : dis-le au membre et propose de réessayer dans une
  minute.
- Elle dit que l'adhésion n'est plus active : transmets le message tel quel, avec le lien.
