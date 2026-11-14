---
name: rush
description: Nettoyer un vrai enregistrement (silences, euh, reprises) sans couper les mots, et recadrer l'écran filmé. À utiliser pour une prise filmée, un replay de live ou une capture.
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" *) PowerShell(node *)
---
!`node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" charger base/rush`
