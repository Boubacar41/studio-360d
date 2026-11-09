---
name: image
description: Créer une pub image ou un post, en un passage ou en voie complète, carrousels compris, aux formats 1:1, 4:5 et 9:16. À utiliser pour toute image de pub ou de réseau social.
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" *) PowerShell(node *)
---
!`node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" charger images/image`
