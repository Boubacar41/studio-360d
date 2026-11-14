---
name: generer
description: Générer images, vidéos, voix, musique et bruitages chez ton fournisseur, prix lu en direct et dépenses notées. À utiliser pour lancer une génération, connaître un prix ou ce que tu as dépensé.
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" *) PowerShell(node *)
---
!`node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" charger base/generer`
