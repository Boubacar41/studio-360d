---
name: generer
description: Générer des images chez ton fournisseur (fal.ai par défaut), avec le prix lu en direct et les dépenses notées. À utiliser pour lancer une génération, connaître un prix ou ce que tu as dépensé.
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" *) PowerShell(node *)
---
!`node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" charger base/generer`
