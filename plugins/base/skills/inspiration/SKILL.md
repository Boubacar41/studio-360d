---
name: inspiration
description: Disséquer une pub, une image ou une vidéo qui marche (lien, capture ou fichier), en tirer un squelette neutre et des concepts pour ta marque. À utiliser quand on part d'un contenu qui performe.
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" *) PowerShell(node *)
---
!`node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" charger base/inspiration`
