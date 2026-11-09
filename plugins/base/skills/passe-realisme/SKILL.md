---
name: passe-realisme
description: Retirer l'aspect « IA » d'un clip vidéo généré (contraste, saturation, hautes lumières, léger tremblement). À utiliser quand un clip paraît trop propre, trop saturé ou « fait rendu 3D ».
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" *) PowerShell(node *)
---
!`node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" charger base/passe-realisme`
