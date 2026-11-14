---
name: avatar-parlant
description: Faire parler un personnage ou ton avatar, un clip par réplique, lèvres et voix calées, coût annoncé. À utiliser pour tout plan où quelqu'un parle face caméra.
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" *) PowerShell(node *)
---
!`node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" charger base/avatar-parlant`
