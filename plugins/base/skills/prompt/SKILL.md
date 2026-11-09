---
name: prompt
description: Écrire, améliorer, diagnostiquer un prompt d'image, retoucher une image et garder les prompts réussis. À utiliser quand une image paraît fausse ou générique, ou pour partir d'un exemple qui a marché.
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" *) PowerShell(node *)
---
!`node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" charger base/prompt`
