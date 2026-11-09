---
name: marque
description: Créer ou mettre à jour la fiche d'une marque ou d'un client (offre, public, ton, charte, produits) depuis un entretien, un site ou des documents. À utiliser avant de créer pour une nouvelle marque.
allowed-tools: Bash(node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" *) PowerShell(node *)
---
!`node "${CLAUDE_PLUGIN_ROOT}/client/c360.mjs" --data "${CLAUDE_PLUGIN_DATA}" charger base/marque`
