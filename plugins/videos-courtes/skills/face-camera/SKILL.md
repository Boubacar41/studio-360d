---
name: face-camera
description: Faire de ta prise face caméra ou de ton replay une vidéo prête, pour une pub ou pour chaque réseau. À utiliser quand tu t'es filmé, ou pour écrire le script à filmer.
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" *) PowerShell(node *)
---
!`node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" charger videos-courtes/face-camera`
