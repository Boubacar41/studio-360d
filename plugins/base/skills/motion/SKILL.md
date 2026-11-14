---
name: motion
description: Scènes animées aux couleurs et à la police de ta marque, calées sur la voix, et carton de fin. À utiliser pour expliquer à l'écran, animer un chiffre ou finir une vidéo.
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" *) PowerShell(node *)
---
!`node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" charger base/motion`
