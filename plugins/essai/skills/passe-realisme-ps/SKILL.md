---
name: passe-realisme-ps
description: Prototype, passe B. La passe de réalisme chargée par PowerShell. Seulement à la main, pendant l'essai.
disable-model-invocation: true
shell: powershell
allowed-tools: PowerShell(node *) Bash(node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" *)
---
!`node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}/../base-studio-360d" charger base/passe-realisme`
