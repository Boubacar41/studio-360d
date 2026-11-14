// Garde de Studio 360D, crochet PreToolUse de chaque pack.
//
// Pourquoi : la permission que donne un skill (`allowed-tools`) ne dure que le tour qui l'ouvre. Dès que le membre
// répond, chaque commande du studio passe devant le classifieur du mode Auto, qui refuse par principe « télécharger un
// programme et l'exécuter » : c'est ce que fait le client pour lancer un outil. Sans cette garde, n'importe quel outil
// pouvait être refusé au milieu d'une production (checklist du chunk 1, 9 nov. 2026).
//
// Ce qu'elle fait : elle autorise une seule forme de commande, celle qu'écrivent nos procédures,
//   node "<dossier de ce pack>/client/c360.mjs" <arguments>
// sans enchaînement, redirection, variable, substitution ni guillemet typographique. Elle n'interdit jamais rien : toute
// autre commande ne reçoit aucune réponse et suit les autorisations du membre.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTILS = new Set(['Bash', 'PowerShell']);
export const RAISON = 'Commande du client de Studio 360D.';

// Partout : fin de ligne, caractère nul, accent grave (échappement PowerShell, substitution Bash), dollar (variables).
const INTERDITS_PARTOUT = /[\r\n\0`$]/;
// PowerShell traite ces guillemets typographiques comme des guillemets droits ; Bash, comme des lettres. Une chaîne
// qui en contient ne se lit donc pas pareil dans les deux interpréteurs.
const DOUBLES_TYPO = /[“”„]/;
const SIMPLES_TYPO = /[‘’‚‛]/;
// Hors guillemets : lettres, chiffres et ponctuation sans effet dans Bash comme dans PowerShell. Pas de barre oblique
// inverse : hors guillemets, Bash s'en sert pour échapper le caractère suivant (\" n'ouvrirait plus de chaîne). Pas de
// tilde : Bash, zsh et Git Bash le remplacent par le dossier personnel (revue du 9 nov.).
const SUR_HORS_GUILLEMETS = /^[\p{L}\p{N}_\-.,/:=@+]$/u;

function argumentsSurs(s) {
  let i = 0;
  let debutDeMot = true;
  while (i < s.length) {
    const c = s[i];
    if (c === '"') {
      const fin = s.indexOf('"', i + 1);
      if (fin < 0) return false;
      // \" échappe le guillemet en Bash, mais termine la chaîne en PowerShell.
      if (s[fin - 1] === '\\') return false;
      if (DOUBLES_TYPO.test(s.slice(i + 1, fin))) return false;
      i = fin + 1;
      debutDeMot = false;
    } else if (c === "'") {
      const fin = s.indexOf("'", i + 1);
      if (fin < 0) return false;
      if (SIMPLES_TYPO.test(s.slice(i + 1, fin))) return false;
      i = fin + 1;
      debutDeMot = false;
    } else if (c === ' ' || c === '\t') {
      i += 1;
      debutDeMot = true;
    } else {
      // En début de mot, @ décompose une variable en PowerShell et =mot devient le chemin d'un programme en zsh ; au
      // milieu (une adresse e-mail, --option=valeur), ils sont sans effet.
      if ((c === '@' || c === '=') && debutDeMot) return false;
      if (!SUR_HORS_GUILLEMETS.test(c)) return false;
      i += 1;
      debutDeMot = false;
    }
  }
  return true;
}

/**
 * La commande est-elle celle du client de ce pack, écrite comme nos procédures l'écrivent ?
 * @param {string} commande la commande telle que Claude va la lancer
 * @param {string} racine le dossier du pack (par défaut, celui de ce fichier)
 * @param {string} plateforme `process.platform` ; sous Windows, les chemins se comparent sans la casse
 */
export function decider(commande, racine = RACINE, plateforme = process.platform) {
  if (typeof commande !== 'string' || commande.length > 8000) return false;
  const c = commande.trim();
  if (INTERDITS_PARTOUT.test(c) || !c.startsWith('node "')) return false;
  const fin = c.indexOf('"', 6);
  if (fin < 0) return false;
  const norm = (p) => {
    const s = p.replace(/\\/g, '/');
    return plateforme === 'win32' ? s.toLowerCase() : s;
  };
  if (norm(c.slice(6, fin)) !== norm(`${racine.replace(/[\\/]+$/, '')}/client/c360.mjs`)) return false;
  const reste = c.slice(fin + 1);
  if (reste && reste[0] !== ' ') return false;
  return argumentsSurs(reste);
}

async function principal() {
  let entree = '';
  for await (const morceau of process.stdin) entree += morceau;
  let j;
  try {
    j = JSON.parse(entree);
  } catch {
    return;
  }
  if (!j || !OUTILS.has(j.tool_name) || !j.tool_input || !decider(j.tool_input.command)) return;
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow', permissionDecisionReason: RAISON },
  }));
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  principal().catch(() => {});
}
