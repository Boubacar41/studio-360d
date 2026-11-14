---
name: montage
description: Monter une vidéo depuis ses éléments, karaoké, son au bon niveau, formats 9:16 et 4:5 et contrôle avant livraison. À utiliser pour assembler, sous-titrer ou décliner une vidéo.
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" *) PowerShell(node *)
---
!`node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" charger base/montage`
