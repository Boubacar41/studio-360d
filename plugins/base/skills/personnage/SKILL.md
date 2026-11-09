---
name: personnage
description: Créer un personnage IA réaliste et constant (fictif, ou toi-même depuis tes photos) avec sa fiche en six angles. À utiliser pour un avatar, un mannequin ou un visage à garder d'une image à l'autre.
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" *) PowerShell(node *)
---
!`node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" charger base/personnage`
