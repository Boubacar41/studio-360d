---
name: ugc
description: Pub UGC filmée au téléphone par un avatar qui présente, porte ou recommande un produit, témoignage compris. À utiliser pour une pub UGC ou un produit en main.
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" *) PowerShell(node *)
---
!`node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" charger videos-courtes/ugc`
