---
name: demarrer
description: Installer et activer Studio 360D sur cet ordinateur (Node, Python, ffmpeg, activation par un code reçu par e-mail, premier essai gratuit). À utiliser au premier lancement, quand Studio 360D dit qu'il n'est pas activé, sur un nouvel ordinateur, ou quand un programme du studio manque.
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" *) PowerShell(node *)
---
# Démarrer Studio 360D

Tu accompagnes un membre de la communauté Créateurs 360D. Parle-lui en français simple,
tutoie-le, une étape à la fois. Avant chaque action qui modifie son ordinateur, dis ce que tu
vas faire et attends son accord.

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

## 2. Charger la suite

Lance cette commande, telle quelle, et suis exactement ce qu'elle affiche :

```
node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" charger base/demarrer
```

Elle affiche la procédure d'installation à jour : Python, ffmpeg, conditions d'utilisation,
activation par code, profil, premier essai gratuit. Si elle dit que le serveur ne répond pas,
dis-le au membre et propose de réessayer dans une minute.
