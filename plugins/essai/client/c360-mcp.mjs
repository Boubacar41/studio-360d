#!/usr/bin/env node
// Studio 360D : serveur MCP minimal (voie de repli du chargement), sans dépendance, Node 22 ou plus.
//
// Transport stdio : un message JSON-RPC 2.0 par ligne sur l'entrée standard, une réponse par
// ligne sur la sortie standard. Rien d'autre n'est écrit sur la sortie standard.
// Un seul outil : `charger`, qui renvoie la procédure d'un skill, comme la commande `!`.
//
// Le compte est celui du plugin base (dossier voisin dans ~/.claude/plugins/data/), pour ne pas
// imposer une seconde activation : --data <dossier>, sinon le voisin de CLAUDE_PLUGIN_DATA,
// sinon ~/.claude/plugins/data/base-studio-360d.
import path from 'node:path';
import readline from 'node:readline';
import { ID_DONNEES_BASE, VERSION_CLIENT, analyser, chargerTexte, creerContexte } from './c360.mjs';

const VERSIONS_PROTOCOLE = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];

const OUTILS = [
  {
    name: 'charger',
    title: 'Charger une procédure de Studio 360D',
    description:
      'Renvoie la procédure à jour d\'un skill de Studio 360D (par exemple base/passe-realisme), ' +
      'ou un message clair si le studio n\'est pas activé ou si le serveur ne répond pas. ' +
      'Suis ensuite la procédure renvoyée.',
    inputSchema: {
      type: 'object',
      properties: {
        nom: { type: 'string', description: 'Nom du skill, sous la forme plugin/skill, par exemple base/passe-realisme' },
      },
      required: ['nom'],
    },
  },
];

export function dossierDonnees(argv = process.argv.slice(2), env = process.env) {
  const { globales } = analyser(argv);
  if (globales.data) return path.resolve(globales.data);
  if (env.CLAUDE_PLUGIN_DATA) return path.join(path.dirname(path.resolve(env.CLAUDE_PLUGIN_DATA)), ID_DONNEES_BASE);
  return undefined; // le défaut du client
}

/** Traite un message ; renvoie la réponse, ou null pour une notification. */
export async function traiterMessage(message, ctx) {
  const { id, method, params } = message || {};
  const estRequete = id !== undefined && id !== null;
  const reponse = (result) => ({ jsonrpc: '2.0', id, result });
  const erreur = (code, texte) => ({ jsonrpc: '2.0', id: estRequete ? id : null, error: { code, message: texte } });

  if (!message || message.jsonrpc !== '2.0' || typeof method !== 'string') {
    return estRequete ? erreur(-32600, 'Requête invalide') : null;
  }
  if (!estRequete) return null; // notifications (notifications/initialized, annulations) : rien à répondre

  switch (method) {
    case 'initialize': {
      const demandee = params && params.protocolVersion;
      return reponse({
        protocolVersion: VERSIONS_PROTOCOLE.includes(demandee) ? demandee : VERSIONS_PROTOCOLE[1],
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: 'studio-360d', version: VERSION_CLIENT },
        instructions: 'Studio 360D : l\'outil charger renvoie la procédure d\'un skill. Suis la procédure renvoyée.',
      });
    }
    case 'ping':
      return reponse({});
    case 'tools/list':
      return reponse({ tools: OUTILS });
    case 'tools/call': {
      const nom = params && params.name;
      if (nom !== 'charger') return erreur(-32602, `Outil inconnu : ${nom}`);
      const arg = params.arguments && params.arguments.nom;
      if (typeof arg !== 'string' || !arg) {
        return reponse({ content: [{ type: 'text', text: 'Il manque le nom du skill (par exemple base/passe-realisme).' }], isError: true });
      }
      const texte = await chargerTexte(ctx, arg);
      return reponse({ content: [{ type: 'text', text: texte }], isError: false });
    }
    default:
      return erreur(-32601, `Méthode inconnue : ${method}`);
  }
}

export function demarrer({ entree = process.stdin, sortie = process.stdout, ctx } = {}) {
  const contexte = ctx || creerContexte({ dossierDonnees: dossierDonnees() });
  const lignes = readline.createInterface({ input: entree, crlfDelay: Infinity });
  let enCours = Promise.resolve();
  lignes.on('line', (ligne) => {
    if (!ligne.trim()) return;
    // Les réponses partent dans l'ordre des demandes.
    enCours = enCours.then(async () => {
      let message;
      try {
        message = JSON.parse(ligne);
      } catch {
        sortie.write(`${JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'JSON illisible' } })}\n`);
        return;
      }
      try {
        const r = await traiterMessage(message, contexte);
        if (r) sortie.write(`${JSON.stringify(r)}\n`);
      } catch (e) {
        if (message && message.id !== undefined) {
          sortie.write(`${JSON.stringify({ jsonrpc: '2.0', id: message.id, error: { code: -32603, message: String(e && e.message) } })}\n`);
        }
      }
    });
  });
  return lignes;
}

const lance = process.argv[1] && path.basename(process.argv[1]) === 'c360-mcp.mjs';
if (lance) demarrer();
