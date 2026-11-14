---
name: voix-et-son
description: Voix off, voix d'un personnage, mot mal prononcé remplacé, musique et bruitages au bon niveau. À utiliser pour toute voix ou tout son d'une vidéo, ou quand un mot sonne faux.
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" *) PowerShell(node *)
---
!`node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" charger base/voix-et-son`
