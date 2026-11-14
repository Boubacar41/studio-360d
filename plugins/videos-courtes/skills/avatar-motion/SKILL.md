---
name: avatar-motion
description: Vidéo courte portée par un avatar, avec scènes animées, B-roll et vraies captures. À utiliser pour présenter un produit, un logiciel ou une liste de conseils.
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" *) PowerShell(node *)
---
!`node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" charger videos-courtes/avatar-motion`
