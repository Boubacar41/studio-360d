#!/usr/bin/env node
// Studio 360D : le client c360.
//
// Un seul fichier, aucune dépendance, Node 22 ou plus, pour Windows, macOS et Linux.
// Les chemins passent par le module path et os.homedir() ; la commande à lancer s'écrit
// pareil en Bash, zsh et PowerShell : node "<chemin>/c360.mjs" --data "<chemin>" <commande>.
//
// Commandes :
//   etat [--crochet] [--source X]   activé ou non, serveur joignable (--crochet : sortie pour SessionStart)
//   activer --email X               étape 1 : un code part par e-mail
//   activer --email X --code N --accepte-conditions [--nom "<nom>"]   étape 2 : l'ordinateur est activé
//                                   (--nom : le nom envoyé au serveur à la place du nom d'hôte,
//                                   1 à 60 caractères ; sert à simuler un autre ordinateur à l'essai)
//   conditions                      affiche les conditions d'utilisation et leur version
//   charger <plugin/skill>          affiche la procédure (sort TOUJOURS avec le code 0)
//   run <outil> [-- arguments]      reçoit le script, le lance avec Python, puis efface son dossier
//   nettoyer                        efface les dossiers d'exécution orphelins
//   diagnostic                      rapport de panne à coller dans l'Entraide (ni clé, ni jeton, ni e-mail)
//
// Fichiers, dans le dossier de données du plugin (--data, sinon CLAUDE_PLUGIN_DATA, sinon
// ~/.claude/plugins/data/base-studio-360d) : compte.json (clé d'appareil), jeton.json (jeton
// court), derniere-erreur.json, exec/ (dossiers d'exécution, effacés après chaque run).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const VERSION_CLIENT = '0.1.3';
export const ID_DONNEES_BASE = 'base-studio-360d';
/** Version majeure minimale de Node (décision du 1er nov. 2026 : Node 20 n'est plus maintenu). */
export const NODE_MIN = 22;
const ICI = path.dirname(fileURLToPath(import.meta.url));
const DELAI_MS = 20_000;
const MARGE_JETON_MS = 60_000;
const AGE_MAX_EXEC_MS = 24 * 3600 * 1000;
/** Longueur maximale du nom d'ordinateur donné par --nom. */
export const NOM_MAX = 60;

// ------------------------------------------------------------------ chemins et fichiers

export function dossierDonneesParDefaut() {
  return path.join(os.homedir(), '.claude', 'plugins', 'data', ID_DONNEES_BASE);
}

/** Sous Windows, des barres obliques : le chemin s'écrit pareil dans tous les shells. */
export function versSlash(p) {
  return process.platform === 'win32' ? p.split(path.sep).join('/') : p;
}

/** Vrai si cette version de Node (« 22.11.0 » ou « v22.11.0 ») est au moins NODE_MIN. */
export function nodeAssezRecent(version = process.versions.node) {
  return Number(String(version).replace(/^v/, '').split('.')[0]) >= NODE_MIN;
}

export function creerContexte({ dossierClient = ICI, dossierDonnees, fetch = globalThis.fetch, ecrire, ecrireErreur, horloge = Date.now, versionNode = process.versions.node } = {}) {
  return {
    versionNode,
    dossierClient,
    donnees: path.resolve(dossierDonnees || process.env.CLAUDE_PLUGIN_DATA || dossierDonneesParDefaut()),
    fetch,
    horloge,
    ecrire: ecrire || ((t) => process.stdout.write(t)),
    ecrireErreur: ecrireErreur || ((t) => process.stderr.write(t)),
  };
}

/** La commande complète, telle que Claude doit la lancer. */
export function commandeC360(ctx) {
  return `node "${versSlash(path.join(ctx.dossierClient, 'c360.mjs'))}" --data "${versSlash(ctx.donnees)}"`;
}

function fichier(ctx, nom) {
  return path.join(ctx.donnees, nom);
}

function lireJSONFichier(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function ecrireJSONFichier(p, objet, prive = false) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const contenu = `${JSON.stringify(objet, null, 2)}\n`;
  const tmp = `${p}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, contenu, { mode: prive ? 0o600 : 0o644 });
  try {
    fs.renameSync(tmp, p);
  } catch {
    fs.writeFileSync(p, contenu, { mode: prive ? 0o600 : 0o644 });
    fs.rmSync(tmp, { force: true });
  }
  if (prive && process.platform !== 'win32') {
    try { fs.chmodSync(p, 0o600); } catch { /* sans effet sur certains disques */ }
  }
}

function lireCompte(ctx) {
  const c = lireJSONFichier(fichier(ctx, 'compte.json'));
  return c && typeof c.cle === 'string' && c.cle ? c : null;
}

function racinePlugin(ctx) {
  return path.dirname(ctx.dossierClient);
}

function versionCoque(ctx) {
  const m = lireJSONFichier(path.join(racinePlugin(ctx), '.claude-plugin', 'plugin.json'));
  return m && m.version ? m.version : 'inconnue';
}

export function lireServeur(dossierClient) {
  const s = lireJSONFichier(path.join(dossierClient, 'serveur.json'));
  if (!s || typeof s.url !== 'string' || !/^https?:\/\//.test(s.url)) return null;
  return s.url.replace(/\/+$/, '');
}

function cheminConditions(ctx) {
  return path.join(racinePlugin(ctx), 'CONDITIONS.md');
}

export function lireVersionConditions(ctx) {
  try {
    const m = /^Version : (\S+)\s*$/m.exec(fs.readFileSync(cheminConditions(ctx), 'utf8'));
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------ masquage et erreurs

/** Retire d'un texte tout ce qui ressemble à une clé, un jeton, un e-mail, et le dossier personnel. */
export function masquer(texte, ctx) {
  let t = String(texte);
  const compte = ctx ? lireJSONFichier(fichier(ctx, 'compte.json')) : null;
  const jeton = ctx ? lireJSONFichier(fichier(ctx, 'jeton.json')) : null;
  for (const secret of [compte && compte.cle, compte && compte.email, jeton && jeton.jeton]) {
    if (typeof secret === 'string' && secret.length > 3) t = t.split(secret).join('[masqué]');
  }
  t = t.replace(/c360_[A-Za-z0-9_-]+/g, '[clé masquée]');
  t = t.replace(/v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[jeton masqué]');
  t = t.replace(/[^\s@<>()"'`,;:]+@[^\s@<>()"'`,;:]+\.[A-Za-z]{2,}/g, '[e-mail masqué]');
  const maison = os.homedir();
  if (maison && maison.length > 2) t = t.split(maison).join('~').split(versSlash(maison)).join('~');
  return t;
}

function noterErreur(ctx, commande, message) {
  try {
    ecrireJSONFichier(fichier(ctx, 'derniere-erreur.json'), {
      le: new Date(ctx.horloge()).toISOString(),
      commande,
      message: masquer(message, ctx).slice(0, 300),
    });
  } catch { /* le dossier de données peut être en lecture seule : rien de grave */ }
}

class ErreurReseau extends Error {}

// ------------------------------------------------------------------ messages

// Le skill /base:demarrer de la coque active lui-même l'ordinateur, puis charge sa suite : un
// message qui renvoie vers lui ne doit pas le faire relancer quand il est déjà ouvert (bug 01).
const CONSIGNE_ACTIVATION =
  'Consigne pour Claude : si tu suis déjà le skill /base:demarrer, ne le relance pas : passe à ' +
  'son étape « Les conditions d\'utilisation », qui mène à l\'activation. Sinon, propose au membre ' +
  'de lancer le skill /base:demarrer.';

function texteNonActive() {
  return [
    '# Studio 360D n\'est pas encore activé',
    '',
    'Studio 360D n\'est pas encore activé sur cet ordinateur, alors ce skill ne peut pas se charger.',
    'L\'activation prend deux minutes et ne coûte rien.',
    '',
    CONSIGNE_ACTIVATION,
    'Une fois l\'ordinateur activé, reviens à sa demande de départ.',
  ].join('\n');
}

function texteServeurInjoignable(ctx) {
  return [
    '# Studio 360D : le serveur ne répond pas',
    '',
    'Le serveur de Studio 360D ne répond pas pour l\'instant.',
    'Vérifie ta connexion à internet, puis réessaie dans une minute.',
    '',
    'Consigne pour Claude : dis-le au membre simplement. Si ça dure, lance',
    `${commandeC360(ctx)} diagnostic`,
    'et propose-lui de coller le résultat dans l\'Entraide de la communauté.',
  ].join('\n');
}

function texteRefus(ctx, donnees) {
  const message = (donnees && donnees.message) || 'Le serveur de Studio 360D a refusé la demande.';
  const raison = donnees && donnees.raison;
  const titres = {
    adhesion: 'ton adhésion n\'est plus active',
    'non-membre': 'adresse pas encore dans la liste des membres',
    appareil: 'cet ordinateur n\'est plus activé',
    inconnu: 'skill introuvable',
  };
  const consignes = {
    adhesion: 'Consigne pour Claude : transmets ce message au membre tel quel, avec le lien.',
    'non-membre': 'Consigne pour Claude : transmets ce message au membre tel quel.',
    appareil: `${CONSIGNE_ACTIVATION} La clé de cet ordinateur ne servait plus : le studio l'a effacée.`,
  };
  return [
    `# Studio 360D : ${titres[raison] || 'demande refusée'}`,
    '',
    message,
    '',
    consignes[raison] || `Consigne pour Claude : transmets ce message au membre. Si ça se répète, lance ${commandeC360(ctx)} diagnostic et propose-lui de coller le résultat dans l'Entraide de la communauté.`,
  ].join('\n');
}

function texteNodeAncien(ctx) {
  return [
    '# Studio 360D : Node est trop ancien',
    '',
    `Studio 360D demande Node ${NODE_MIN} ou plus, et cet ordinateur a Node ${ctx.versionNode}.`,
    'La mise à jour prend quelques minutes et ne coûte rien.',
    '',
    'Consigne pour Claude : propose au membre de lancer le skill /base:demarrer, qui met Node à jour.',
  ].join('\n');
}

// ------------------------------------------------------------------ appels au serveur

async function appeler(ctx, methode, chemin, { corps, jeton } = {}) {
  const base = lireServeur(ctx.dossierClient);
  if (!base) throw new ErreurReseau('adresse du serveur absente (client/serveur.json)');
  const entetes = {
    accept: 'application/json',
    'user-agent': `c360/${VERSION_CLIENT} (${process.platform}; node ${process.versions.node})`,
  };
  if (corps !== undefined) entetes['content-type'] = 'application/json';
  if (jeton) entetes.authorization = `Bearer ${jeton}`;
  let r;
  try {
    r = await ctx.fetch(base + chemin, {
      method: methode,
      headers: entetes,
      body: corps === undefined ? undefined : JSON.stringify(corps),
      signal: AbortSignal.timeout(DELAI_MS),
    });
  } catch (e) {
    const cause = e && e.cause && (e.cause.code || e.cause.message);
    throw new ErreurReseau(e && e.name === 'TimeoutError' ? 'délai dépassé' : cause || (e && e.message) || 'erreur réseau');
  }
  let donnees = null;
  try {
    donnees = await r.json();
  } catch { /* réponse qui n'est pas du JSON */ }
  if (!donnees || typeof donnees !== 'object') throw new ErreurReseau(`réponse inattendue du serveur (HTTP ${r.status})`);
  return { statut: r.status, donnees };
}

async function obtenirJeton(ctx, compte, forcer = false) {
  const j = lireJSONFichier(fichier(ctx, 'jeton.json'));
  if (!forcer && j && typeof j.jeton === 'string' && j.expire - ctx.horloge() > MARGE_JETON_MS) return { jeton: j.jeton };
  const r = await appeler(ctx, 'POST', '/api/jeton', { corps: { cle: compte.cle } });
  if (r.statut === 200 && r.donnees.ok && r.donnees.jeton) {
    ecrireJSONFichier(fichier(ctx, 'jeton.json'), { jeton: r.donnees.jeton, expire: r.donnees.expire }, true);
    return { jeton: r.donnees.jeton };
  }
  return { refus: r };
}

/** GET avec le jeton court, renouvelé une fois sans bruit s'il a expiré. */
async function demanderAvecJeton(ctx, compte, chemin) {
  const r = await demanderAvecJetonBrut(ctx, compte, chemin);
  // Ordinateur retiré par l'administration (ou clé inconnue du serveur) : la clé ne servira plus.
  // On l'efface, pour que le crochet, le diagnostic et /base:demarrer voient un ordinateur non
  // activé et passent par l'activation, au lieu de redemander la même chose en boucle.
  if (r.statut === 401 && r.donnees.raison === 'appareil') {
    for (const f of ['compte.json', 'jeton.json']) fs.rmSync(fichier(ctx, f), { force: true });
  }
  return r;
}

async function demanderAvecJetonBrut(ctx, compte, chemin) {
  let t = await obtenirJeton(ctx, compte);
  if (t.refus) return t.refus;
  let r = await appeler(ctx, 'GET', chemin, { jeton: t.jeton });
  if (r.statut === 401 && r.donnees.raison === 'jeton') {
    t = await obtenirJeton(ctx, compte, true);
    if (t.refus) return t.refus;
    r = await appeler(ctx, 'GET', chemin, { jeton: t.jeton });
  }
  return r;
}

// ------------------------------------------------------------------ nettoyage des exécutions

function estVivant(dossier, maintenant) {
  let pid = null;
  let debut = null;
  try {
    [pid, debut] = fs.readFileSync(path.join(dossier, '.pid'), 'utf8').trim().split(/\s+/).map(Number);
  } catch {
    // Pas encore de .pid : un dossier qui vient d'être créé reste une minute à l'abri.
    try {
      return maintenant - fs.statSync(dossier).mtimeMs < 60_000;
    } catch {
      return false;
    }
  }
  if (!pid || !debut || maintenant - debut > AGE_MAX_EXEC_MS) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === 'EPERM';
  }
}

/** Efface les dossiers d'exécution dont le processus n'existe plus. Renvoie leur nombre. */
export function nettoyer(ctx) {
  const d = fichier(ctx, 'exec');
  let entrees;
  try {
    entrees = fs.readdirSync(d, { withFileTypes: true });
  } catch {
    return 0;
  }
  let n = 0;
  for (const e of entrees) {
    if (!e.isDirectory()) continue;
    const p = path.join(d, e.name);
    if (estVivant(p, Date.now())) continue;
    try {
      fs.rmSync(p, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
      n++;
    } catch { /* fichier encore verrouillé : au prochain lancement */ }
  }
  return n;
}

function cheminSur(base, chemin) {
  const morceaux = String(chemin || '').split('/');
  if (!chemin || path.isAbsolute(chemin) || morceaux.some((m) => m === '' || m === '.' || m === '..')) {
    throw new Error(`chemin refusé : ${chemin}`);
  }
  const cible = path.resolve(base, ...morceaux);
  if (!cible.startsWith(base + path.sep)) throw new Error(`chemin refusé : ${chemin}`);
  return cible;
}

// ------------------------------------------------------------------ Python

function lireVersion(texte) {
  const m = /^(\d+)\.(\d+)(?:\.(\d+))?/.exec(String(texte || '').trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3] || 0)] : null;
}

/**
 * Trouve un Python assez récent : celui de DATA/venv, puis python3, python et (sous Windows) py -3.
 * Chaque candidat est lancé pour lire sa version : un raccourci qui ne fait qu'ouvrir une
 * boutique d'applications (Windows) est écarté.
 * @returns {{ ok: true, commande: string, args: string[], version: string, source: string } | { ok: false, essais: string[] }}
 */
export function trouverPython(ctx, { minimum = [3, 10], executer = spawnSync, plateforme = process.platform, existe = fs.existsSync } = {}) {
  const candidats = [];
  const venv = plateforme === 'win32'
    ? [path.join(ctx.donnees, 'venv', 'Scripts', 'python.exe')]
    : [path.join(ctx.donnees, 'venv', 'bin', 'python3'), path.join(ctx.donnees, 'venv', 'bin', 'python')];
  const v = venv.find((p) => existe(p));
  if (v) candidats.push({ commande: v, args: [], source: 'environnement du studio' });
  candidats.push({ commande: 'python3', args: [], source: 'python3' });
  candidats.push({ commande: 'python', args: [], source: 'python' });
  if (plateforme === 'win32') candidats.push({ commande: 'py', args: ['-3'], source: 'py -3' });

  const essais = [];
  for (const c of candidats) {
    let r;
    try {
      r = executer(c.commande, [...c.args, '-c', 'import sys; print("%d.%d.%d" % sys.version_info[:3])'], {
        encoding: 'utf8', timeout: 20_000, windowsHide: true,
      });
    } catch {
      r = null;
    }
    const version = r && r.status === 0 ? lireVersion(r.stdout) : null;
    if (!version) {
      essais.push(`${c.source} : absent`);
      continue;
    }
    const ok = version[0] > minimum[0] || (version[0] === minimum[0] && version[1] >= minimum[1]);
    if (ok) return { ok: true, commande: c.commande, args: c.args, version: version.join('.'), source: c.source };
    essais.push(`${c.source} : ${version.join('.')}, trop ancien`);
  }
  return { ok: false, essais };
}

// ------------------------------------------------------------------ commandes

/** Le texte de la procédure (ou un message clair). Ne lève jamais d'erreur. */
export async function chargerTexte(ctx, nom) {
  try {
    if (typeof globalThis.fetch !== 'function' || !nodeAssezRecent(ctx.versionNode)) return texteNodeAncien(ctx);
    if (!nom) return `Il manque le nom du skill à charger. Exemple : ${commandeC360(ctx)} charger base/passe-realisme`;
    const compte = lireCompte(ctx);
    if (!compte) return texteNonActive();
    const r = await demanderAvecJeton(ctx, compte, `/api/charger?nom=${encodeURIComponent(nom)}`);
    if (r.statut === 200 && r.donnees.ok && typeof r.donnees.texte === 'string') {
      return r.donnees.texte.split('{{C360}}').join(commandeC360(ctx));
    }
    noterErreur(ctx, `charger ${nom}`, `${r.donnees.raison || 'refus'} (HTTP ${r.statut})`);
    return texteRefus(ctx, r.donnees);
  } catch (e) {
    noterErreur(ctx, `charger ${nom}`, e instanceof ErreurReseau ? `serveur injoignable : ${e.message}` : `erreur du client : ${e && e.message}`);
    if (e instanceof ErreurReseau) return texteServeurInjoignable(ctx);
    return [
      '# Studio 360D : erreur inattendue',
      '',
      'Le studio a rencontré une erreur en chargeant ce skill.',
      '',
      `Consigne pour Claude : lance ${commandeC360(ctx)} diagnostic et propose au membre de coller le résultat dans l'Entraide de la communauté.`,
    ].join('\n');
  }
}

async function cmdActiver(ctx, o) {
  if (!nodeAssezRecent(ctx.versionNode)) {
    ctx.ecrire(`${texteNodeAncien(ctx)}\n`);
    return 5;
  }
  const email = typeof o.email === 'string' ? o.email.trim() : '';
  if (!email) {
    ctx.ecrire(`Il manque l'adresse e-mail. Exemple : ${commandeC360(ctx)} activer --email ton@adresse.fr\n`);
    return 2;
  }
  // Le nom sous lequel le serveur connaît cet ordinateur : son nom d'hôte, sauf --nom. Le serveur
  // remplace la clé d'un ordinateur réactivé avec le même nom et le même système : un autre nom
  // compte comme un autre ordinateur.
  let nom = os.hostname();
  if (o.nom !== undefined) {
    const n = typeof o.nom === 'string' ? o.nom.trim() : '';
    const longueur = Array.from(n).length;
    if (longueur === 0) {
      ctx.ecrire(
        'Le nom d\'ordinateur donné avec --nom est vide. ' +
        `Donne un nom de 1 à ${NOM_MAX} caractères, par exemple --nom "PC-essai-2", ou retire --nom pour garder le nom de cet ordinateur.\n`,
      );
      return 2;
    }
    if (longueur > NOM_MAX) {
      ctx.ecrire(`Le nom d'ordinateur donné avec --nom fait ${longueur} caractères, ${NOM_MAX} au plus. Choisis un nom plus court.\n`);
      return 2;
    }
    nom = n;
  }
  try {
    if (!o.code || o.code === true) {
      // Le nom et le système dès la demande : le serveur refuse un troisième ordinateur avant
      // d'envoyer un code qui ne servirait pas.
      const r = await appeler(ctx, 'POST', '/api/activer', { corps: { email, nom, systeme: process.platform } });
      ctx.ecrire(`${r.donnees.message || `Réponse du serveur : HTTP ${r.statut}`}\n`);
      if (r.statut === 200) {
        const suite = o.nom !== undefined ? ` --nom "${nom}"` : '';
        ctx.ecrire(`Ensuite : ${commandeC360(ctx)} activer --email ${email} --code <code reçu> --accepte-conditions${suite}\n`);
        return 0;
      }
      noterErreur(ctx, 'activer', `${r.donnees.raison || 'refus'} (HTTP ${r.statut})`);
      return 1;
    }
    if (!o['accepte-conditions']) {
      ctx.ecrire(
        'Il faut d\'abord lire et accepter les conditions d\'utilisation.\n' +
        `Affiche-les avec : ${commandeC360(ctx)} conditions\n` +
        'Puis relance la même commande en ajoutant --accepte-conditions.\n',
      );
      return 1;
    }
    const conditions = lireVersionConditions(ctx);
    if (!conditions) {
      ctx.ecrire('Le fichier des conditions est introuvable dans ce studio. Ouvre une nouvelle session pour mettre le studio à jour, puis réessaie.\n');
      return 1;
    }
    const r = await appeler(ctx, 'POST', '/api/activer', {
      corps: {
        email,
        code: String(o.code).trim(),
        nom,
        systeme: process.platform,
        detail: `${os.type()} ${os.release()} ${os.arch()}`,
        conditions,
      },
    });
    if (r.statut === 200 && r.donnees.cle) {
      ecrireJSONFichier(fichier(ctx, 'compte.json'), {
        version: 1,
        email: email.toLowerCase(),
        appareil: r.donnees.appareil,
        cle: r.donnees.cle,
        active_le: new Date(ctx.horloge()).toISOString(),
        conditions,
      }, true);
      fs.rmSync(fichier(ctx, 'jeton.json'), { force: true });
      ctx.ecrire(`${r.donnees.message}\n`);
      return 0;
    }
    ctx.ecrire(`${r.donnees.message || `Réponse du serveur : HTTP ${r.statut}`}\n`);
    noterErreur(ctx, 'activer', `${r.donnees.raison || 'refus'} (HTTP ${r.statut})`);
    return 1;
  } catch (e) {
    noterErreur(ctx, 'activer', e instanceof ErreurReseau ? `serveur injoignable : ${e.message}` : String(e && e.message));
    ctx.ecrire('Le serveur de Studio 360D ne répond pas. Vérifie ta connexion à internet, puis réessaie dans une minute.\n');
    return 1;
  }
}

async function sante(ctx) {
  const debut = Date.now();
  try {
    const r = await appeler(ctx, 'GET', '/api/sante');
    return { ok: r.statut === 200, ms: Date.now() - debut, version: r.donnees.version, statut: r.statut };
  } catch (e) {
    return { ok: false, raison: e.message };
  }
}

async function cmdEtat(ctx, o) {
  const compte = lireCompte(ctx);
  if (o.crochet) {
    // Crochet SessionStart : rapide, local, jamais en erreur. Rien à dire si tout est prêt.
    const source = typeof o.source === 'string' ? ` (crochet ${o.source})` : '';
    let contexte = null;
    if (!nodeAssezRecent(ctx.versionNode)) {
      contexte =
        `Studio 360D demande Node ${NODE_MIN} ou plus, et cet ordinateur a Node ${ctx.versionNode}${source}. ` +
        'Au début de l\'échange, propose au membre de lancer /base:demarrer, qui met Node à jour. ' +
        'S\'il demande autre chose, réponds d\'abord à sa demande. Tutoie le membre.';
    } else if (!compte) {
      contexte =
        `Studio 360D est installé mais pas encore activé sur cet ordinateur${source}. ` +
        'Au début de l\'échange, propose au membre de lancer /base:demarrer : deux minutes, gratuit. ' +
        'S\'il demande autre chose, réponds d\'abord à sa demande. Tutoie le membre.';
    }
    if (contexte) {
      ctx.ecrire(`${JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: contexte } })}\n`);
    }
    return 0;
  }
  const s = await sante(ctx);
  ctx.ecrire([
    'Studio 360D',
    `- Activé sur cet ordinateur : ${compte ? `oui, depuis le ${String(compte.active_le || '').slice(0, 10)}` : 'non (lance /base:demarrer)'}`,
    `- Serveur : ${s.ok ? `joignable (${s.ms} ms)` : `injoignable${s.raison ? ` (${s.raison})` : ''}`}`,
    `- Node : ${ctx.versionNode}${nodeAssezRecent(ctx.versionNode) ? '' : ` (trop ancien : il faut ${NODE_MIN} ou plus, lance /base:demarrer)`}`,
    `- Studio : version ${versionCoque(ctx)}, client ${VERSION_CLIENT}`,
    '',
  ].join('\n'));
  return 0;
}

function cmdConditions(ctx) {
  let t;
  try {
    t = fs.readFileSync(cheminConditions(ctx), 'utf8');
  } catch {
    ctx.ecrire('Le fichier des conditions est introuvable dans ce studio. Ouvre une nouvelle session pour mettre le studio à jour, puis réessaie.\n');
    return 1;
  }
  ctx.ecrire(`Fichier : ${versSlash(cheminConditions(ctx))}\n\n${t.trimEnd()}\n\n`);
  ctx.ecrire('Pour les accepter, ajoute --accepte-conditions à la commande activer, à l\'étape du code.\n');
  return 0;
}

async function cmdRun(ctx, outil, args) {
  if (!outil) {
    ctx.ecrireErreur(`Il manque le nom de l'outil. Exemple : ${commandeC360(ctx)} run passe-realisme -- clip.mp4 --preset studio\n`);
    return 2;
  }
  if (!nodeAssezRecent(ctx.versionNode)) {
    ctx.ecrireErreur(`${texteNodeAncien(ctx)}\n`);
    return 5;
  }
  const compte = lireCompte(ctx);
  if (!compte) {
    ctx.ecrireErreur(`${texteNonActive()}\n`);
    return 3;
  }
  let r;
  try {
    r = await demanderAvecJeton(ctx, compte, `/api/outil?nom=${encodeURIComponent(outil)}`);
  } catch (e) {
    noterErreur(ctx, `run ${outil}`, e instanceof ErreurReseau ? `serveur injoignable : ${e.message}` : String(e && e.message));
    ctx.ecrireErreur(`${texteServeurInjoignable(ctx)}\n`);
    return 3;
  }
  if (!(r.statut === 200 && r.donnees.ok && Array.isArray(r.donnees.fichiers))) {
    noterErreur(ctx, `run ${outil}`, `${r.donnees.raison || 'refus'} (HTTP ${r.statut})`);
    ctx.ecrireErreur(`${texteRefus(ctx, r.donnees)}\n`);
    return 3;
  }
  const o = r.donnees;
  if (o.interpreteur !== 'python') {
    ctx.ecrireErreur(`Cet outil demande l'interpréteur « ${o.interpreteur} », que ce studio ne sait pas encore lancer. Mets le studio à jour.\n`);
    return 3;
  }
  const py = trouverPython(ctx, { minimum: lireVersion(o.python_min) || [3, 10] });
  if (!py.ok) {
    noterErreur(ctx, `run ${outil}`, `Python introuvable (${py.essais.join(' ; ')})`);
    ctx.ecrireErreur(
      `Il faut Python ${o.python_min || '3.10'} ou plus pour cet outil, et je ne le trouve pas (${py.essais.join(' ; ')}).\n` +
      'Consigne pour Claude : propose au membre de lancer /base:demarrer, qui installe Python. ' +
      'Après l\'installation, il faut quitter et rouvrir l\'application.\n',
    );
    return 4;
  }

  const dossier = path.join(fichier(ctx, 'exec'), crypto.randomBytes(8).toString('hex'));
  fs.mkdirSync(dossier, { recursive: true });
  fs.writeFileSync(path.join(dossier, '.pid'), `${process.pid} ${Date.now()}`);
  let enfant = null;
  let efface = false;
  const effacer = () => {
    if (efface) return;
    efface = true;
    try {
      fs.rmSync(dossier, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    } catch { /* nettoyé au prochain lancement */ }
  };
  const surSignal = (signal) => {
    try { if (enfant) enfant.kill(signal); } catch { /* déjà terminé */ }
    effacer();
    process.exit(128 + ((os.constants.signals && os.constants.signals[signal]) || 1));
  };
  const signaux = ['SIGINT', 'SIGTERM', 'SIGHUP'];
  for (const s of signaux) process.on(s, surSignal);
  process.on('exit', effacer);
  try {
    for (const f of o.fichiers) {
      const cible = cheminSur(dossier, f.chemin);
      fs.mkdirSync(path.dirname(cible), { recursive: true });
      fs.writeFileSync(cible, f.contenu);
    }
    const script = cheminSur(dossier, o.point_entree);
    return await new Promise((resoudre) => {
      enfant = spawn(py.commande, [...py.args, script, ...args], {
        stdio: 'inherit',
        cwd: process.cwd(),
        windowsHide: true,
        env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1', PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' },
      });
      enfant.on('error', (e) => {
        ctx.ecrireErreur(`Python n'a pas pu démarrer : ${e.message}\n`);
        resoudre(4);
      });
      enfant.on('exit', (code, signal) => {
        resoudre(code !== null ? code : 128 + ((os.constants.signals && os.constants.signals[signal]) || 1));
      });
    });
  } catch (e) {
    noterErreur(ctx, `run ${outil}`, String(e && e.message));
    ctx.ecrireErreur(`Le studio n'a pas pu préparer l'outil : ${e.message}\n`);
    return 3;
  } finally {
    effacer();
    for (const s of signaux) process.removeListener(s, surSignal);
    process.removeListener('exit', effacer);
  }
}

function premiereLigne(commande, args) {
  try {
    const r = spawnSync(commande, args, { encoding: 'utf8', timeout: 20_000, windowsHide: true });
    return r.status === 0 ? String(r.stdout || '').split(/\r?\n/)[0] : null;
  } catch {
    return null;
  }
}

function gitBash() {
  const candidats = [
    process.env.CLAUDE_CODE_GIT_BASH_PATH,
    process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'Git', 'bin', 'bash.exe'),
    process.env['ProgramFiles(x86)'] && path.join(process.env['ProgramFiles(x86)'], 'Git', 'bin', 'bash.exe'),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Programs', 'Git', 'bin', 'bash.exe'),
  ].filter(Boolean);
  return candidats.some((p) => fs.existsSync(p));
}

/** Nom lisible du système : Windows 10 ou 11, version de macOS, distribution Linux. */
function nomSysteme() {
  try {
    if (process.platform === 'win32') {
      const build = Number(os.release().split('.')[2]);
      return `Windows ${build >= 22000 ? '11' : '10'}`;
    }
    if (process.platform === 'darwin') {
      const v = premiereLigne('sw_vers', ['-productVersion']);
      return v ? `macOS ${v}` : 'macOS';
    }
    if (process.platform === 'linux') {
      const m = /^PRETTY_NAME="?([^"\n]+)"?/m.exec(fs.readFileSync('/etc/os-release', 'utf8'));
      return m ? m[1] : 'Linux';
    }
  } catch { /* nom générique ci-dessous */ }
  return process.platform;
}

export async function rapportDiagnostic(ctx) {
  const compte = lireCompte(ctx);
  const jeton = lireJSONFichier(fichier(ctx, 'jeton.json'));
  const py = trouverPython(ctx);
  const ffmpeg = premiereLigne('ffmpeg', ['-hide_banner', '-version']);
  const ffprobe = premiereLigne('ffprobe', ['-hide_banner', '-version']);
  const s = await sante(ctx);
  const erreur = lireJSONFichier(fichier(ctx, 'derniere-erreur.json'));
  let execs = 0;
  try { execs = fs.readdirSync(fichier(ctx, 'exec')).length; } catch { execs = 0; }
  const lignes = [
    `Rapport de diagnostic Studio 360D (${new Date(ctx.horloge()).toISOString().slice(0, 16).replace('T', ' ')} UTC)`,
    `- Système : ${nomSysteme()}, noyau ${os.release()} (${process.platform}, ${os.arch()})`,
    `- Node : ${ctx.versionNode}${nodeAssezRecent(ctx.versionNode) ? '' : ` (trop ancien : il faut ${NODE_MIN} ou plus)`}`,
    `- Python : ${py.ok ? `${py.version} (${py.source})` : `introuvable ou trop ancien, il faut 3.10 ou plus (${py.essais.join(' ; ')})`}`,
    `- ffmpeg : ${ffmpeg ? (/version (\S+)/.exec(ffmpeg) || [null, 'présent'])[1] : 'introuvable'}`,
    `- ffprobe : ${ffprobe ? 'présent' : 'introuvable'}`,
  ];
  if (process.platform === 'win32') lignes.push(`- Git Bash : ${gitBash() ? 'présent' : 'absent (Claude passe alors par PowerShell)'}`);
  lignes.push(
    `- Studio : version ${versionCoque(ctx)}, client ${VERSION_CLIENT}`,
    `- Dossier du studio : ${versSlash(ctx.donnees)}`,
    `- Activé sur cet ordinateur : ${compte ? `oui, depuis le ${String(compte.active_le || '').slice(0, 10)}` : 'non'}`,
    `- Jeton de session : ${jeton && jeton.expire > ctx.horloge() ? 'valide' : jeton ? 'à renouveler' : 'aucun'}`,
    `- Serveur : ${s.ok ? `joignable (${s.ms} ms, version ${s.version})` : `injoignable (${s.raison || `HTTP ${s.statut}`})`}`,
    `- Dossiers d'exécution restants : ${execs}`,
    `- Dernière erreur du client : ${erreur ? `${erreur.le}, ${erreur.commande} : ${erreur.message}` : 'aucune'}`,
  );
  return masquer(lignes.join('\n'), ctx);
}

function aide(ctx) {
  const c = commandeC360(ctx);
  return [
    `Studio 360D, client ${VERSION_CLIENT}`,
    '',
    `${c} etat`,
    `${c} activer --email <adresse>`,
    `${c} activer --email <adresse> --code <code> --accepte-conditions [--nom "<nom>"]`,
    `    --nom : le nom de l'ordinateur envoyé au serveur, de 1 à ${NOM_MAX} caractères (par défaut, son nom d'hôte).`,
    '    Un autre nom compte comme un autre ordinateur : sert à l\'essai, avec un autre dossier --data.',
    `${c} conditions`,
    `${c} charger <plugin/skill>`,
    `${c} run <outil> -- <arguments>`,
    `${c} nettoyer`,
    `${c} diagnostic`,
    '',
  ].join('\n');
}

// ------------------------------------------------------------------ lecture de la ligne de commande

/** Sépare les options globales (--data), la commande et le reste. */
export function analyser(argv) {
  const globales = {};
  let i = 0;
  while (i < argv.length) {
    const a = argv[i];
    if (a === '--data' && i + 1 < argv.length) {
      globales.data = argv[i + 1];
      i += 2;
    } else if (a.startsWith('--data=')) {
      globales.data = a.slice('--data='.length);
      i += 1;
    } else break;
  }
  return { globales, commande: argv[i], reste: argv.slice(i + 1) };
}

const OPTIONS_A_VALEUR = new Set(['email', 'code', 'source', 'nom']);

function lireOptions(reste) {
  const o = { positionnels: [] };
  for (let i = 0; i < reste.length; i++) {
    const a = reste[i];
    if (a.startsWith('--') && a.length > 2) {
      const egal = a.indexOf('=');
      const cle = egal > 0 ? a.slice(2, egal) : a.slice(2);
      if (egal > 0) o[cle] = a.slice(egal + 1);
      else if (OPTIONS_A_VALEUR.has(cle) && i + 1 < reste.length) o[cle] = reste[++i];
      else o[cle] = true;
    } else o.positionnels.push(a);
  }
  return o;
}

/**
 * Lance une commande et renvoie son code de sortie.
 * @param {string[]} argv
 * @param {object} [options] pour les tests : dossierClient, fetch, ecrire, ecrireErreur, horloge, versionNode
 */
export async function principal(argv, options = {}) {
  const { globales, commande, reste } = analyser(argv);
  const ctx = creerContexte({ ...options, dossierDonnees: globales.data || options.dossierDonnees });
  const o = lireOptions(reste);
  if (!(commande === 'etat' && o.crochet)) nettoyer(ctx);
  switch (commande) {
    case 'charger':
      ctx.ecrire(`${await chargerTexte(ctx, reste[0])}\n`);
      return 0;
    case 'run': {
      const args = reste.slice(1);
      if (args[0] === '--') args.shift();
      return cmdRun(ctx, reste[0], args);
    }
    case 'activer':
      return cmdActiver(ctx, o);
    case 'etat':
      return cmdEtat(ctx, o);
    case 'conditions':
      return cmdConditions(ctx);
    case 'nettoyer': {
      ctx.ecrire(`Dossiers d'exécution vérifiés : ${nettoyer(ctx)} effacé(s) de plus.\n`);
      return 0;
    }
    case 'diagnostic':
      ctx.ecrire(`${await rapportDiagnostic(ctx)}\n`);
      return 0;
    case 'depenses':
      ctx.ecrire('Le journal des dépenses arrivera avec la brique « générer ».\n');
      return 0;
    case 'aide':
    case '--help':
    case '-h':
    case undefined:
      ctx.ecrire(aide(ctx));
      return 0;
    default:
      ctx.ecrire(`Commande inconnue : ${commande}\n\n${aide(ctx)}`);
      return 2;
  }
}

function estPrincipal() {
  if (!process.argv[1]) return false;
  try {
    const a = fs.realpathSync(path.resolve(process.argv[1]));
    const b = fs.realpathSync(fileURLToPath(import.meta.url));
    return process.platform === 'win32' ? a.toLowerCase() === b.toLowerCase() : a === b;
  } catch {
    return false;
  }
}

if (estPrincipal()) {
  const argv = process.argv.slice(2);
  const { commande } = analyser(argv);
  // charger et etat ne sortent jamais en erreur : une commande `!` en échec annulerait le skill,
  // et un crochet en échec s'afficherait à chaque démarrage.
  const toujoursZero = commande === 'charger' || commande === 'etat';
  if (toujoursZero) {
    const secours = (e) => {
      process.stdout.write(`Studio 360D : erreur inattendue du client (${e && e.message}). Lance la commande diagnostic du studio.\n`);
      process.exit(0);
    };
    process.on('uncaughtException', secours);
    process.on('unhandledRejection', secours);
  }
  principal(argv).then(
    (code) => { process.exitCode = toujoursZero ? 0 : code; },
    (e) => {
      process.stderr.write(`Studio 360D : erreur inattendue du client : ${e && e.message}\n`);
      process.exitCode = toujoursZero ? 0 : 1;
    },
  );
}
