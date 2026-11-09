---
name: visuels-produit
description: Visuels e-commerce d'un produit (porté, en main, refait d'après une image, seul) qui gardent le produit exact, avec retouches ciblées. À utiliser pour la boutique, une pub ou les réseaux.
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" *) PowerShell(node *)
---
!`node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" charger images/visuels-produit`
