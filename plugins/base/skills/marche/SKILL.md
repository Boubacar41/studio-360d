---
name: marche
description: Étude de marché « voix du client » (express par défaut, ou complète) avec personas, mots, objections et affirmations à éviter. À utiliser pour connaître ses clients ou préparer une offre.
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" *) PowerShell(node *)
---
!`node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" charger base/marche`
