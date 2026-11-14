---
name: film
description: Court métrage ou pub mise en scène par IA, personnages, lieux et objets tenus d'un plan à l'autre. À utiliser pour une histoire en plusieurs plans ou une pub cinéma.
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" *) PowerShell(node *)
---
!`node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" charger videos-courtes/film`
