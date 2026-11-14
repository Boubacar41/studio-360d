---
name: prompt
description: Écrire, corriger, diagnostiquer un prompt d'image ou de vidéo, retoucher une image, garder les prompts réussis. À utiliser quand une image ou un clip paraît faux, ou pour un prompt Kling ou Seedance.
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" *) PowerShell(node *)
---
!`node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" charger base/prompt`
