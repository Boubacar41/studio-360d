// Tests du client c360 sur Windows, macOS et Linux (GitHub Actions, à chaque mise à jour du dépôt).
// Le serveur de Studio 360D est simulé dans le test lui-même : aucun appel réseau, aucune matière.
// Lancement : node --test (Node 22 ou plus ; Python 3.10 ou plus pour créer le venv d'essai des
// outils Python, sinon ces tests se sautent et le disent).
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
// Dans le dépôt public : plugins/base/client ; dans la fabrique : client/ à côté de tests/.
const SOURCE = [path.join(ICI, '..', 'plugins', 'base'), path.join(ICI, '..')]
  .find((d) => fs.existsSync(path.join(d, 'client', 'c360.mjs')));
const {
  trouverPython, creerContexte, versSlash, principal, nodeAssezRecent, NODE_MIN, executerOutil, VERSION_CLIENT, pythonEnvironnement,
} = await import(pathToFileURL(path.join(SOURCE, 'client', 'c360.mjs')).href);

const EMAIL = 'membre@exemple.fr';
const CODE = '123456';
const CLE = 'c360_cle_de_test_simulee_0123456789abcdefghijklmnop';
const EMPREINTE = 'e1'.repeat(32);
const etat = { actif: true, jetons: 0, jetonRefuse: false, activations: [] };

/** Une réponse de /api/outil, au format du serveur (contrat C3). */
function outil(nom, interpreteur, point_entree, fichiers, environnement = EMPREINTE) {
  return { ok: true, nom, version: '0', interpreteur, python_min: '3.10', point_entree, programmes: [], besoins: [], environnement, fichiers };
}

const SALUT_MJS = { chemin: 'commun/salut.mjs', contenu: 'export function salut(noms) {\n  return \'salut \' + noms.join(\' \');\n}\n' };

const OUTILS = {
  modules: outil('modules', 'python', 'principal.py', [
    { chemin: 'principal.py', contenu: '# 360D-test\nimport os, sys\nfrom aide.voisin import bonjour\nprint(bonjour(sys.argv[1:]))\nprint("cwd=" + os.getcwd())\nprint("prefix=" + sys.prefix)\n' },
    { chemin: 'aide/__init__.py', contenu: '' },
    { chemin: 'aide/voisin.py', contenu: 'def bonjour(a):\n    return "bonjour " + " ".join(a)\n' },
  ]),
  erreur: outil('erreur', 'python', 'erreur.py', [{ chemin: 'erreur.py', contenu: 'raise RuntimeError("erreur voulue")\n' }]),
  evasion: outil('evasion', 'node', 'x.mjs', [
    { chemin: '../hors-du-dossier.mjs', contenu: 'console.log("ne doit jamais être écrit");\n' },
    { chemin: 'x.mjs', contenu: 'console.log("ne doit jamais tourner");\n' },
  ]),
  horloge: outil('horloge', 'node', 'horloge.mjs', [
    { chemin: 'horloge.mjs', contenu: '// 360D-test\nimport { salut } from \'./commun/salut.mjs\';\nconsole.log(salut(process.argv.slice(2)));\nconsole.log(\'node=\' + process.execPath);\nconsole.log(\'cwd=\' + process.cwd());\n' },
    SALUT_MJS,
  ]),
  variables: outil('variables', 'node', 'variables.mjs', [{ chemin: 'variables.mjs', contenu: 'process.stdout.write(JSON.stringify(process.env));\n' }]),
  environnement: outil('environnement', 'node', 'environnement.mjs', [
    { chemin: 'environnement.mjs', contenu: 'console.log(\'environnement d\\\'essai \' + process.argv.slice(2).join(\' \'));\n' },
  ]),
  libre: outil('libre', 'node', 'libre.mjs', [{ chemin: 'libre.mjs', contenu: 'console.log(\'libre\');\n' }], null),
  ancien: outil('ancien', 'ruby', 'ancien.rb', [{ chemin: 'ancien.rb', contenu: 'puts 1\n' }], null),
  // Réponses mal formées : point d'entrée absent des fichiers, ou d'une autre extension que l'interpréteur.
  'sans-entree': outil('sans-entree', 'node', 'absent.mjs', [{ chemin: 'autre.mjs', contenu: 'console.log(\'autre\');\n' }]),
  'entree-python': outil('entree-python', 'python', 'principal.mjs', [{ chemin: 'principal.mjs', contenu: 'console.log(\'mjs\');\n' }]),
  'entree-node': outil('entree-node', 'node', 'principal.py', [{ chemin: 'principal.py', contenu: 'print("py")\n' }]),
};

/** Les variables que le client ajoute à l'environnement de l'outil, et elles seules (C4). */
const VARIABLES_DU_CONTRAT = ['C360_DONNEES', 'C360_COMMANDE', 'C360_POLICES', 'C360_ENVIRONNEMENT',
  'PLAYWRIGHT_BROWSERS_PATH', 'PYTHONDONTWRITEBYTECODE', 'PYTHONIOENCODING', 'PYTHONUTF8'];

function repondre(res, statut, corps) {
  res.writeHead(statut, { 'content-type': 'application/json' });
  res.end(JSON.stringify(corps));
}

/** Serveur simulé : le strict nécessaire du protocole de Studio 360D. */
const serveur = http.createServer((req, res) => {
  let corps = '';
  req.on('data', (d) => { corps += d; });
  req.on('end', () => {
    const url = new URL(req.url, 'http://local');
    const donnees = corps ? JSON.parse(corps) : {};
    const jeton = (req.headers.authorization || '').replace(/^Bearer /, '');
    const depart = { ok: false, raison: 'adhesion', message: 'Ton adhésion n\'est plus active. Pour revenir : https://communaute.exemple' };
    switch (url.pathname) {
      case '/api/sante': return repondre(res, 200, { ok: true, version: 'simulé' });
      case '/api/activer':
        etat.activations.push(donnees);
        if (!donnees.code) return repondre(res, 200, { ok: true, message: 'Un code à six chiffres vient de partir.' });
        if (donnees.code !== CODE) return repondre(res, 400, { ok: false, raison: 'code-faux', message: 'Ce code n\'est pas le bon.' });
        if (donnees.conditions !== '2026-11-01') return repondre(res, 400, { ok: false, raison: 'conditions', message: 'Conditions.' });
        return repondre(res, 200, { ok: true, cle: CLE, appareil: 'abcdef012345', message: 'Studio 360D est activé sur cet ordinateur.' });
      case '/api/jeton':
        if (donnees.cle !== CLE) return repondre(res, 401, { ok: false, raison: 'appareil', message: 'Cet ordinateur n\'est plus activé.' });
        if (!etat.actif) return repondre(res, 403, depart);
        etat.jetons++;
        return repondre(res, 200, { ok: true, jeton: `v1.simule${etat.jetons}.signature`, expire: Date.now() + 900_000 });
      case '/api/charger':
      case '/api/outil': {
        if (!jeton.startsWith('v1.simule') || etat.jetonRefuse) {
          etat.jetonRefuse = false;
          return repondre(res, 401, { ok: false, raison: 'jeton' });
        }
        if (!etat.actif) return repondre(res, 403, depart);
        const nom = url.searchParams.get('nom');
        if (url.pathname === '/api/charger') {
          return repondre(res, 200, { ok: true, nom, texte: `<!-- 360D-test -->\n# Procédure ${nom}\nLance {{C360}} run modules -- a b\n` });
        }
        return Object.hasOwn(OUTILS, nom) ? repondre(res, 200, OUTILS[nom]) : repondre(res, 404, { ok: false, raison: 'inconnu', message: 'Inconnu.' });
      }
      default: return repondre(res, 404, { ok: false });
    }
  });
});

let tmp;
let url;
let plugin;
let racineDonnees;
let data;
let travail;
let configuration;
let raisonSansVenv = null; // null : le venv d'essai de `data` existe

function installerPlugin(dossier, adresse, nom = 'base') {
  fs.mkdirSync(path.join(dossier, 'client'), { recursive: true });
  fs.copyFileSync(path.join(SOURCE, 'client', 'c360.mjs'), path.join(dossier, 'client', 'c360.mjs'));
  fs.writeFileSync(path.join(dossier, 'client', 'serveur.json'), JSON.stringify({ url: adresse }));
  fs.copyFileSync(path.join(SOURCE, 'CONDITIONS.md'), path.join(dossier, 'CONDITIONS.md'));
  if (nom) {
    fs.mkdirSync(path.join(dossier, '.claude-plugin'), { recursive: true });
    fs.writeFileSync(path.join(dossier, '.claude-plugin', 'plugin.json'), JSON.stringify({ name: nom, version: '0.0.0-test' }));
  }
}

/** Un dossier de données déjà activé (la clé que le serveur simulé connaît). */
function activerDossier(dossier) {
  fs.mkdirSync(dossier, { recursive: true });
  fs.writeFileSync(path.join(dossier, 'compte.json'), JSON.stringify({ version: 1, email: EMAIL, cle: CLE, active_le: '2026-11-01T10:00:00Z' }));
  return dossier;
}

/** DATA/environnement.json tel que l'écrit l'outil environnement (contrat C5). */
function poserEnvironnement(dossier, empreinte = EMPREINTE, pose_le = '2026-11-08T09:30:00.000Z') {
  fs.mkdirSync(dossier, { recursive: true });
  fs.writeFileSync(path.join(dossier, 'environnement.json'), JSON.stringify({
    empreinte, versions: { python: '3.12.15', uv: '0.13.5', playwright: '1.64.1', ffmpeg: 'essai' }, pose_le, navigateur_complet: false,
  }));
}

/** DATA/venv par le Python du système, sans pip ; renvoie null, ou la raison de sauter. */
function creerVenv(dossier) {
  const py = trouverPython(creerContexte({ dossierDonnees: path.join(tmp, 'aucun venv') }));
  if (!py.ok) return `pas de Python 3.10 ou plus ici (${py.essais.join(' ; ')})`;
  const r = spawnSync(py.commande, [...py.args, '-m', 'venv', '--without-pip', path.join(dossier, 'venv')], { encoding: 'utf8', timeout: 180_000, windowsHide: true });
  return r.status === 0 ? null : `venv d'essai impossible : ${String(r.stderr || r.error).slice(0, 300)}`;
}

function envClient() {
  const env = { ...process.env, CLAUDE_CONFIG_DIR: configuration };
  delete env.CLAUDE_PLUGIN_DATA;
  return env;
}

function client(args, { dossierPlugin = plugin, donnees = data, env = envClient() } = {}) {
  return new Promise((resoudre) => {
    const p = spawn(process.execPath, [path.join(dossierPlugin, 'client', 'c360.mjs'), '--data', donnees, ...args], { cwd: travail, env });
    let stdout = '';
    let stderr = '';
    p.stdout.on('data', (d) => { stdout += d; });
    p.stderr.on('data', (d) => { stderr += d; });
    p.on('close', (code) => resoudre({ code, stdout, stderr }));
  });
}

/** La commande que le client écrit pour lui-même (Node lui donne son chemin réel). */
function commande(donnees, dossierPlugin = plugin) {
  return `node "${versSlash(path.join(fs.realpathSync(dossierPlugin), 'client', 'c360.mjs'))}" --data "${versSlash(donnees)}"`;
}

/** La consigne du code 6, mot pour mot (spec §5.1, point 2). */
function consigneEnvironnement(c) {
  return 'L\'environnement du studio doit être installé ou mis à jour. Consigne pour Claude : annonce au membre ce qui ' +
    `sera installé (liste, place, licences : \`${c} run environnement -- annoncer\`), attends son accord, puis lance ` +
    `\`${c} run environnement -- installer\`.`;
}

function memeChemin(a, b) {
  const x = fs.realpathSync(a);
  const y = fs.realpathSync(b);
  return process.platform === 'win32' ? x.toLowerCase() === y.toLowerCase() : x === y;
}

const execVide = (d = data) => !fs.existsSync(path.join(d, 'exec')) || fs.readdirSync(path.join(d, 'exec')).length === 0;

before(async () => {
  await new Promise((r) => serveur.listen(0, '127.0.0.1', r));
  url = `http://127.0.0.1:${serveur.address().port}`;
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'c360 test '));
  plugin = path.join(tmp, 'plugins', 'base');
  racineDonnees = path.join(tmp, 'données d\'essai'); // une espace, un accent et une apostrophe, exprès
  data = path.join(racineDonnees, 'base-studio-360d');
  travail = path.join(tmp, 'mon studio');
  configuration = path.join(tmp, 'configuration');
  for (const d of [travail, configuration, data]) fs.mkdirSync(d, { recursive: true });
  installerPlugin(plugin, url);
  poserEnvironnement(data);
  raisonSansVenv = creerVenv(data);
});

after(() => {
  serveur.close();
  fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 5 });
});

test('Python 3.10 ou plus est trouvé (obligatoire en intégration continue)', (t) => {
  const py = trouverPython(creerContexte({ dossierDonnees: path.join(tmp, 'aucun venv') }));
  if (!py.ok && !process.env.CI) return t.skip(`pas de Python ici : ${py.essais.join(' ; ')}`);
  assert.equal(py.ok, true, JSON.stringify(py));
});

test('charger avant activation : message clair et code 0', async () => {
  const r = await client(['charger', 'base/essai']);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /pas encore activé/);
  assert.match(r.stdout, /L'activation prend deux minutes\.\n/);
});

test('activation : conditions exigées, puis compte.json écrit', async () => {
  assert.equal((await client(['activer', '--email', EMAIL])).code, 0);
  assert.equal((await client(['activer', '--email', EMAIL, '--code', CODE])).code, 1);
  const r = await client(['activer', '--email', EMAIL, '--code', CODE, '--accepte-conditions']);
  assert.equal(r.code, 0, r.stdout);
  assert.equal(JSON.parse(fs.readFileSync(path.join(data, 'compte.json'), 'utf8')).cle, CLE);
});

test('activer --nom : le nom donné part au serveur à la place du nom d\'hôte ; vide ou trop long, code 2 sans requête', async () => {
  const etape2 = ['activer', '--email', EMAIL, '--code', CODE, '--accepte-conditions'];
  etat.activations.length = 0;
  const r = await client([...etape2, '--nom', '  PC-essai-2 '], { donnees: path.join(tmp, 'pc 2') });
  assert.equal(r.code, 0, r.stdout);
  assert.equal(etat.activations.at(-1).nom, 'PC-essai-2', 'espaces retirés aux bouts');
  assert.equal((await client(etape2, { donnees: path.join(tmp, 'pc 3') })).code, 0);
  assert.equal(etat.activations.at(-1).nom, os.hostname(), 'sans --nom : le nom d\'hôte');
  const etape1 = await client(['activer', '--email', EMAIL, '--nom', 'PC-essai-4'], { donnees: path.join(tmp, 'pc 4') });
  assert.match(etape1.stdout, /--accepte-conditions --nom "PC-essai-4"/, 'la commande suivante garde le nom');

  etat.activations.length = 0;
  for (const nom of [['--nom', ''], ['--nom', '   '], ['--nom'], ['--nom', 'x'.repeat(61)]]) {
    const refus = await client([...etape2, ...nom], { donnees: path.join(tmp, 'pc 5') });
    assert.equal(refus.code, 2, `${nom.join(' ')} : ${refus.stdout}`);
    assert.match(refus.stdout, /--nom (est vide|fait 61 caractères, 60 au plus)/);
  }
  assert.equal(etat.activations.length, 0, 'aucune requête au serveur');
  assert.equal(fs.existsSync(path.join(tmp, 'pc 5', 'compte.json')), false);
  assert.equal((await client([...etape2, '--nom', 'x'.repeat(60)], { donnees: path.join(tmp, 'pc 5') })).code, 0, '60 caractères passent');
});

test('aide : l\'option --nom d\'activer y est décrite, et run lance un programme Python ou Node', async () => {
  const r = await client(['aide']);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /activer --email <adresse> --code <code> --accepte-conditions \[--nom "<nom>"\]/);
  assert.match(r.stdout, /--nom : le nom de l'ordinateur envoyé au serveur, de 1 à 60 caractères/);
  assert.match(r.stdout, /run <outil> -- <arguments>\n.*programme du studio, en Python ou en Node/);
  assert.match(r.stdout, / charger <plugin\/skill>\[\/etape\]\n/);
  assert.doesNotMatch(r.stdout, /depenses/);
});

test('charger : {{C360}} remplacé par la commande complète, avec des chemins à espaces', async () => {
  const r = await client(['charger', 'base/essai']);
  assert.equal(r.code, 0);
  const c = commande(data);
  assert.ok(r.stdout.includes(`Lance ${c} run modules -- a b`), r.stdout);
  if (process.platform === 'win32') assert.ok(!c.includes(path.sep));
});

test('jeton refusé par le serveur : renouvelé sans bruit', async () => {
  const avant = etat.jetons;
  etat.jetonRefuse = true;
  const r = await client(['charger', 'base/essai']);
  assert.match(r.stdout, /# Procédure base\/essai/);
  assert.equal(etat.jetons, avant + 1);
});

test('un outil Node se lance avec le Node du client, depuis le dossier de travail, dossier effacé', async () => {
  const r = await client(['run', 'horloge', '--', 'x', 'y z']);
  assert.equal(r.code, 0, r.stderr);
  assert.match(r.stdout, /^salut x y z$/m, 'le module voisin commun/ est importé');
  assert.ok(memeChemin(/node=(.*)/.exec(r.stdout)[1].trim(), process.execPath), r.stdout);
  assert.ok(memeChemin(/cwd=(.*)/.exec(r.stdout)[1].trim(), travail));
  assert.ok(execVide());
});

test('un DATA dont le chemin contient une espace, un accent et une apostrophe : run marche', async () => {
  assert.ok(data.includes('données d\'essai') && data.includes(' '), data);
  const r = await client(['run', 'horloge', '--', 'é à']);
  assert.equal(r.code, 0, r.stderr);
  assert.match(r.stdout, /^salut é à$/m);
  assert.ok(execVide());
});

test('un outil Python ne se lance qu\'avec le Python de DATA/venv : sans venv, code 4 et la consigne', async () => {
  // Un Python du système existe peut-être ici : le client ne doit pas s'en servir.
  const sansVenv = activerDossier(path.join(racineDonnees, 'sans venv'));
  poserEnvironnement(sansVenv);
  const r = await client(['run', 'modules', '--', 'a'], { donnees: sansVenv });
  assert.equal(r.code, 4, r.stderr);
  assert.equal(r.stdout, '', 'rien ne s\'est lancé');
  assert.equal(r.stderr, `Le Python de l'environnement du studio est introuvable. ${consigneEnvironnement(commande(sansVenv))}\n`);
  assert.ok(execVide(sansVenv));
});

test('un outil Python ne se lance qu\'avec le Python de DATA/venv : avec le venv d\'essai, le script tourne', async (t) => {
  if (raisonSansVenv) return t.skip(raisonSansVenv);
  const r = await client(['run', 'modules', '--', 'x', 'y z']);
  assert.equal(r.code, 0, r.stderr);
  assert.match(r.stdout, /bonjour x y z/);
  assert.ok(memeChemin(/prefix=(.*)/.exec(r.stdout)[1].trim(), path.join(data, 'venv')), r.stdout);
  assert.ok(memeChemin(/cwd=(.*)/.exec(r.stdout)[1].trim(), travail));
  assert.ok(execVide());
});

test('run : script Python qui lève une erreur, code de sortie transmis, dossier effacé', async (t) => {
  if (raisonSansVenv) return t.skip(raisonSansVenv);
  const r = await client(['run', 'erreur']);
  assert.notEqual(r.code, 0);
  assert.match(r.stderr, /RuntimeError: erreur voulue/);
  assert.ok(execVide());
});

test('run : un chemin de fichier qui sort du dossier d\'exécution est refusé', async () => {
  const r = await client(['run', 'evasion']);
  assert.equal(r.code, 3);
  assert.match(r.stderr, /chemin refusé/);
  assert.equal(fs.existsSync(path.join(data, 'exec', 'hors-du-dossier.mjs')), false);
  assert.ok(execVide());
});

test('run : un point d\'entrée absent des fichiers ou d\'une autre extension est refusé (code 3), sans trace ni chemin', async () => {
  for (const nom of ['sans-entree', 'entree-python', 'entree-node']) {
    const r = await client(['run', nom]);
    assert.equal(r.code, 3, `${nom} : ${r.stderr}`);
    assert.equal(r.stdout, '', `${nom} : rien ne s'est lancé`);
    assert.equal(r.stderr, `L'outil « ${nom} » est arrivé incomplet : son programme principal manque ou ne correspond pas à ` +
      'son interpréteur. Consigne pour Claude : dis-le au membre, puis lance la commande diagnostic du studio et ' +
      'propose-lui de coller le résultat dans l\'Entraide de la communauté.\n');
    assert.ok(!r.stderr.includes(data) && !r.stderr.includes(versSlash(data)), `${nom} : aucun chemin de DATA`);
    assert.ok(execVide(), nom);
  }
});

test('run et le diagnostic prennent le même Python, celui du venv, sous Windows, macOS et Linux', () => {
  const ctx = creerContexte({ dossierDonnees: path.join(tmp, 'python simulé') });
  const venv = (...morceaux) => path.join(ctx.donnees, 'venv', ...morceaux);
  const cas = [
    ['win32', [venv('Scripts', 'python.exe')], venv('Scripts', 'python.exe')],
    ['win32', [venv('bin', 'python3'), venv('bin', 'python')], null],
    ['darwin', [venv('bin', 'python3'), venv('bin', 'python')], venv('bin', 'python3')],
    ['darwin', [venv('bin', 'python')], venv('bin', 'python')],
    ['linux', [venv('bin', 'python')], venv('bin', 'python')],
    ['linux', [venv('bin', 'python3')], venv('bin', 'python3')],
    ['linux', [], null],
    ['darwin', [], null],
  ];
  for (const [plateforme, presents, attendu] of cas) {
    const existe = (p) => presents.includes(p);
    const etiquette = `${plateforme}, ${presents.map((p) => path.relative(ctx.donnees, p)).join(' + ') || 'aucun venv'}`;
    assert.equal(pythonEnvironnement(ctx, { plateforme, existe }), attendu, `run : ${etiquette}`);
    // Le diagnostic : même Python s'il y en a un ; sinon un Python du système, jamais dit « environnement du studio ».
    const py = trouverPython(ctx, { plateforme, existe, executer: () => ({ status: 0, stdout: '3.12.15\n' }) });
    if (attendu) {
      assert.equal(py.source, 'environnement du studio', `diagnostic : ${etiquette}`);
      assert.equal(py.commande, attendu, `diagnostic : ${etiquette}`);
    } else {
      assert.notEqual(py.source, 'environnement du studio', `diagnostic : ${etiquette}`);
    }
  }
});

test('run : un interpréteur inconnu est refusé (code 3), sans rien lancer', async () => {
  const r = await client(['run', 'ancien']);
  assert.equal(r.code, 3);
  assert.equal(r.stderr, 'Cet outil demande un interpréteur que Studio 360D ne connaît pas. Mets Studio 360D à jour.\n');
  assert.ok(execVide());
});

test('sans environnement.json, rien ne se lance : code 6 et la consigne', async () => {
  const d = activerDossier(path.join(racineDonnees, 'sans environnement'));
  const attendu = `${consigneEnvironnement(commande(d))}\n`;
  const verifier = async (cas) => {
    const r = await client(['run', 'horloge', '--', 'a'], { donnees: d });
    assert.equal(r.code, 6, `${cas} : ${r.stderr}`);
    assert.equal(r.stderr, attendu, cas);
    assert.equal(r.stdout, '', `${cas} : rien ne s'est lancé`);
    assert.ok(execVide(d), cas);
  };
  await verifier('absent');
  poserEnvironnement(d, 'f0'.repeat(32));
  await verifier('autre empreinte');
  fs.writeFileSync(path.join(d, 'environnement.json'), '{ illisible');
  await verifier('illisible');
  // L'outil environnement lui-même se lance sans contrôle : c'est lui qui pose l'environnement.
  const env = await client(['run', 'environnement', '--', 'annoncer'], { donnees: d });
  assert.equal(env.code, 0, env.stderr);
  assert.match(env.stdout, /environnement d'essai annoncer/);
  // Une empreinte servie nulle : pas de contrôle.
  const libre = await client(['run', 'libre'], { donnees: d });
  assert.equal(libre.code, 0, libre.stderr);
  assert.match(libre.stdout, /^libre$/m);
});

test('executerOutil : ctx.commande remplace la commande du client dans la consigne', async () => {
  const sortie = [];
  const ctx = creerContexte({
    dossierClient: path.join(plugin, 'client'),
    dossierDonnees: path.join(racineDonnees, 'sans environnement en mémoire'),
    commande: 'node "/fabrique/outils/lanceur.mjs" --donnees "/d"',
    ecrire: (t) => sortie.push(t),
    ecrireErreur: (t) => sortie.push(t),
  });
  assert.equal(await executerOutil(ctx, OUTILS.horloge, []), 6);
  assert.equal(sortie.join(''), `${consigneEnvironnement('node "/fabrique/outils/lanceur.mjs" --donnees "/d"')}\n`);
});

test('l\'outil reçoit C360_DONNEES, C360_COMMANDE, C360_POLICES, C360_ENVIRONNEMENT et PATH avec DATA/ffmpeg/bin, et aucune variable de clé ajoutée', async () => {
  const env = { ...envClient(), C360_ESSAI_DU_TEST: 'transmise' };
  const r = await client(['run', 'variables'], { env });
  assert.equal(r.code, 0, r.stderr);
  const recu = JSON.parse(r.stdout);
  assert.equal(recu.C360_DONNEES, data);
  assert.equal(recu.C360_COMMANDE, commande(data));
  assert.equal(recu.C360_POLICES, path.join(fs.realpathSync(plugin), 'polices'));
  assert.equal(recu.C360_ENVIRONNEMENT, EMPREINTE);
  assert.equal(recu.PLAYWRIGHT_BROWSERS_PATH, path.join(data, 'ms-playwright'));
  assert.equal(recu.PYTHONDONTWRITEBYTECODE, '1');
  assert.equal(recu.PYTHONIOENCODING, 'utf-8');
  assert.equal(recu.PYTHONUTF8, '1');
  const nomPath = (o) => Object.keys(o).find((k) => (process.platform === 'win32' ? k.toUpperCase() === 'PATH' : k === 'PATH'));
  assert.equal(nomPath(recu), nomPath(env), 'le nom exact de la variable PATH est gardé');
  assert.equal(recu[nomPath(recu)], [path.join(data, 'ffmpeg', 'bin'), env[nomPath(env)]].join(path.delimiter));
  const ajoutees = Object.keys(recu).filter((k) => !Object.hasOwn(env, k));
  assert.deepEqual(ajoutees.filter((k) => !VARIABLES_DU_CONTRAT.includes(k)), [], 'aucune autre variable ajoutée');
  for (const [k, v] of Object.entries(env)) {
    if (k === nomPath(env) || VARIABLES_DU_CONTRAT.includes(k)) continue;
    assert.equal(recu[k], v, `${k} transmise telle quelle`);
  }
  assert.equal(recu.C360_ESSAI_DU_TEST, 'transmise');
  assert.ok(!r.stdout.includes(CLE), 'la clé d\'appareil ne part pas à l\'outil');
  const jeton = JSON.parse(fs.readFileSync(path.join(data, 'jeton.json'), 'utf8')).jeton;
  assert.ok(!r.stdout.includes(jeton), 'le jeton ne part pas à l\'outil');
});

test('un pack prend le dossier de données de base', async () => {
  const images = path.join(tmp, 'plugins', 'images');
  installerPlugin(images, url, 'images');
  const sansManifeste = path.join(tmp, 'plugins', 'sans-manifeste');
  installerPlugin(sansManifeste, url, null);
  const baseInline = activerDossier(path.join(racineDonnees, 'base-inline'));
  const imagesInline = path.join(racineDonnees, 'images-inline');

  // images-inline → base-inline ; images-studio-360d → base-studio-360d.
  let r = await client(['charger', 'base/essai'], { dossierPlugin: images, donnees: imagesInline });
  assert.match(r.stdout, /# Procédure base\/essai/, r.stdout);
  assert.ok(r.stdout.includes(`${commande(baseInline, images)} run modules`), r.stdout);
  r = await client(['charger', 'base/essai'], { dossierPlugin: images, donnees: path.join(racineDonnees, 'images-studio-360d') });
  assert.ok(r.stdout.includes(`${commande(data, images)} run modules`), r.stdout);
  // Le plugin base garde son dossier ; sans plugin.json, rien ne change ; base-<suffixe> absent : non activé.
  for (const [dossierPlugin, donnees] of [[plugin, imagesInline], [sansManifeste, imagesInline], [images, path.join(racineDonnees, 'images-ailleurs')]]) {
    r = await client(['charger', 'base/essai'], { dossierPlugin, donnees });
    assert.match(r.stdout, /pas encore activé/, `${dossierPlugin} ${donnees}`);
  }
  assert.equal(fs.existsSync(imagesInline), false, 'le dossier du pack n\'est pas créé');

  // --data normalisé : barres obliques (skill) ou inverses (crochet), barre finale, lettre de lecteur.
  const contexte = (d) => creerContexte({ dossierClient: path.join(images, 'client'), dossierDonnees: d }).donnees;
  assert.equal(contexte(`${versSlash(imagesInline)}/`), baseInline);
  assert.equal(contexte(imagesInline), baseInline);
  if (process.platform === 'win32') {
    assert.equal(contexte(imagesInline.replace(/^[A-Z]:/, (x) => x.toLowerCase())), baseInline);
    assert.equal(contexte(versSlash(imagesInline).replace(/^[A-Z]:/, (x) => x.toLowerCase())), baseInline);
  }
  assert.equal(creerContexte({ dossierClient: path.join(plugin, 'client'), dossierDonnees: imagesInline }).donnees, imagesInline);
});

test('le diagnostic dit l\'environnement, la longueur du dossier de données et les mises à jour automatiques', async () => {
  const reglages = path.join(configuration, 'settings.json');
  const connus = path.join(configuration, 'plugins', 'known_marketplaces.json');
  fs.mkdirSync(path.dirname(connus), { recursive: true });
  const ecrire = (f, objet) => fs.writeFileSync(f, typeof objet === 'string' ? objet : JSON.stringify(objet));
  const ligne = async (d = data) => /Mises à jour automatiques : (\S+)/.exec((await client(['diagnostic'], { donnees: d })).stdout)[1];
  try {
    ecrire(reglages, {
      env: { FAL_KEY: 'valeur-secrete-des-reglages' },
      extraKnownMarketplaces: { 'studio-360d': { source: { source: 'github', repo: 'exemple/studio' }, autoUpdate: true }, autre: { autoUpdate: false } },
    });
    const r = await client(['diagnostic']);
    assert.equal(r.code, 0);
    assert.match(r.stdout, /- Environnement : posé le 2026-11-08, empreinte e1e1e1e1e1e1\n/);
    assert.match(r.stdout, /- Dossier de données des outils : /);
    assert.ok(!r.stdout.includes('Dossier du studio'), r.stdout);
    assert.ok(r.stdout.includes(`- Longueur du dossier de données des outils : ${data.length} caractères (115 au plus sous Windows)\n`), r.stdout);
    assert.match(r.stdout, /- Mises à jour automatiques : oui \(/);
    assert.match(r.stdout, /ni les réglages du projet/, 'la limite de la lecture est dite');
    assert.ok(!r.stdout.includes('valeur-secrete-des-reglages') && !r.stdout.includes('exemple/studio'), 'rien d\'autre n\'est imprimé');
    if (raisonSansVenv) assert.match(r.stdout, /- Python : absent \(l'environnement du studio le pose\)/);
    else assert.match(r.stdout, /- Python : \d+\.\d+\.\d+ \(environnement du studio\)\n/);

    ecrire(reglages, { extraKnownMarketplaces: { 'studio-360d': { autoUpdate: false } } });
    assert.equal(await ligne(), 'non');
    ecrire(reglages, { extraKnownMarketplaces: { autre: { autoUpdate: true } } });
    ecrire(connus, { 'studio-360d': { autoUpdate: true } });
    assert.equal(await ligne(), 'oui', 'known_marketplaces.json quand les réglages n\'en disent rien');
    ecrire(connus, { 'studio-360d': { installLocation: 'x' } });
    assert.equal(await ligne(), 'non', 'entrée présente sans la clé');
    fs.rmSync(connus);
    assert.equal(await ligne(), 'inconnu', 'aucune entrée');
    ecrire(reglages, '{ illisible');
    assert.equal(await ligne(), 'inconnu', 'réglages illisibles');
    fs.rmSync(reglages);
    assert.equal(await ligne(), 'inconnu', 'aucun fichier');
    // La configuration qui contient DATA (<config>/plugins/data/<id>) passe en premier.
    const autre = path.join(tmp, 'autre configuration');
    const dedans = path.join(autre, 'plugins', 'data', 'base-essai');
    fs.mkdirSync(dedans, { recursive: true });
    ecrire(path.join(autre, 'settings.json'), { extraKnownMarketplaces: { 'studio-360d': { autoUpdate: true } } });
    assert.equal(await ligne(dedans), 'oui');
  } finally {
    fs.rmSync(reglages, { force: true });
    fs.rmSync(connus, { force: true });
  }
  const vide = path.join(racineDonnees, 'diagnostic vide');
  const r = await client(['diagnostic'], { donnees: vide });
  assert.match(r.stdout, /- Environnement : absent\n/);
  assert.match(r.stdout, /- Python : absent \(l'environnement du studio le pose\)/);
});

/** Le premier fichier de ce nom dans le PATH du test, ou null. */
function dansLePath(nom) {
  return (process.env.PATH || '').split(path.delimiter).filter(Boolean).map((d) => path.join(d, nom)).find((p) => fs.existsSync(p)) || null;
}

test('diagnostic : ffmpeg et ffprobe pris d\'abord dans DATA/ffmpeg/bin', async (t) => {
  const bin = path.join(data, 'ffmpeg', 'bin');
  fs.mkdirSync(bin, { recursive: true });
  try {
    let version = '9.9-essai';
    if (process.platform === 'win32') {
      // Sous Windows, un faux ffmpeg devrait être un .exe : le test pose dans DATA un lien physique vers le
      // ffmpeg et le ffprobe du système (même disque), sans rien copier ; sauté s'il n'y en a pas.
      const sources = ['ffmpeg.exe', 'ffprobe.exe'].map(dansLePath);
      if (sources.includes(null)) return t.skip('ffmpeg ou ffprobe absent du PATH : rien à poser dans DATA/ffmpeg/bin');
      try {
        for (const s of sources) fs.linkSync(s, path.join(bin, path.basename(s)));
      } catch (e) {
        return t.skip(`lien physique impossible vers le ffmpeg du système (${e.code})`);
      }
      const ligne = spawnSync(path.join(bin, 'ffmpeg.exe'), ['-hide_banner', '-version'], { encoding: 'utf8', windowsHide: true }).stdout;
      version = /version (\S+)/.exec(String(ligne))[1];
    } else {
      for (const programme of ['ffmpeg', 'ffprobe']) {
        fs.writeFileSync(path.join(bin, programme), `#!/bin/sh\necho "${programme} version 9.9-essai Copyright"\n`, { mode: 0o755 });
      }
    }
    const r = await client(['diagnostic']);
    assert.ok(r.stdout.includes(`- ffmpeg : ${version} (environnement du studio)\n`), r.stdout);
    assert.match(r.stdout, /- ffprobe : présent \(environnement du studio\)\n/);
  } finally {
    fs.rmSync(path.join(data, 'ffmpeg'), { recursive: true, force: true });
  }
});

test('aucun « gratuit » dans le client ; depenses est une commande inconnue ; VERSION_CLIENT vaut 0.2.0', async () => {
  const source = fs.readFileSync(path.join(SOURCE, 'client', 'c360.mjs'), 'utf8');
  assert.doesNotMatch(source, /gratuit/i);
  assert.doesNotMatch(source, /co[uû]te rien/i, 'ni la forme voisine');
  assert.equal(VERSION_CLIENT, '0.2.0');
  const r = await client(['depenses']);
  assert.equal(r.code, 2);
  assert.match(r.stdout, /Commande inconnue : depenses/);
  const crochet = await client(['etat', '--crochet'], { donnees: path.join(tmp, 'vierge gratuit') });
  assert.match(JSON.parse(crochet.stdout).hookSpecificOutput.additionalContext, /deux minutes\./);
  const sortie = [];
  const opts = { dossierClient: path.join(plugin, 'client'), versionNode: '20.20.2', ecrire: (t) => sortie.push(t), ecrireErreur: (t) => sortie.push(t) };
  await principal(['--data', data, 'charger', 'base/essai'], opts);
  assert.match(sortie.join(''), /La mise à jour prend quelques minutes\.\n/);
});

test('dossier d\'exécution orphelin effacé au lancement suivant', async () => {
  const mort = spawnSync(process.execPath, ['-e', 'process.stdout.write(String(process.pid))'], { encoding: 'utf8' }).stdout;
  const orphelin = path.join(data, 'exec', 'orphelin');
  fs.mkdirSync(orphelin, { recursive: true });
  fs.writeFileSync(path.join(orphelin, '.pid'), `${mort} ${Date.now()}`);
  await client(['etat']);
  assert.equal(fs.existsSync(orphelin), false);
});

test('diagnostic : ni clé, ni jeton, ni e-mail, ni dossier personnel', async () => {
  const r = await client(['diagnostic']);
  assert.equal(r.code, 0);
  const jeton = JSON.parse(fs.readFileSync(path.join(data, 'jeton.json'), 'utf8')).jeton;
  for (const secret of [CLE, jeton, EMAIL, os.homedir(), versSlash(os.homedir())]) assert.ok(!r.stdout.includes(secret), secret);
  assert.doesNotMatch(r.stdout, /@/);
  assert.match(r.stdout, /Activé sur cet ordinateur : oui/);
});

test('état et diagnostic : la date d\'activation est celle de l\'heure de l\'ordinateur, pas le temps universel', async () => {
  // activerDossier écrit 2026-11-01T10:00:00Z : déjà le 2 à Kiritimati (UTC+14), encore le 31 à Pago Pago (UTC-11).
  const dossier = activerDossier(path.join(racineDonnees, 'date locale'));
  for (const [TZ, attendu] of [['Pacific/Kiritimati', '2026-11-02'], ['Pacific/Pago_Pago', '2026-10-31']]) {
    for (const sous of ['etat', 'diagnostic']) {
      const r = await client([sous], { donnees: dossier, env: { ...envClient(), TZ } });
      assert.equal(r.code, 0, r.stderr);
      assert.ok(r.stdout.includes(`Activé sur cet ordinateur : oui, depuis le ${attendu}`), `${TZ}, ${sous} : ${r.stdout}`);
    }
  }
});

test('adhésion inactive : charger donne le message de départ (code 0), run refuse (code 3)', async () => {
  etat.actif = false;
  fs.rmSync(path.join(data, 'jeton.json'), { force: true });
  const r = await client(['charger', 'base/essai']);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /n'est plus active/);
  const run = await client(['run', 'horloge']);
  assert.equal(run.code, 3);
  assert.equal(run.stdout, '');
  etat.actif = true;
});

test('ordinateur retiré : la clé périmée est effacée, et le message ne fait pas relancer /base:demarrer', async () => {
  const retire = path.join(tmp, 'ordinateur retiré');
  fs.mkdirSync(retire, { recursive: true });
  fs.writeFileSync(path.join(retire, 'compte.json'), JSON.stringify({ version: 1, email: EMAIL, cle: 'c360_cle_retiree', active_le: '2026-11-01T10:00:00Z' }));
  const r = await client(['charger', 'base/essai'], { donnees: retire });
  assert.equal(r.code, 0);
  assert.match(r.stdout, /n'est plus activé/);
  assert.match(r.stdout, /ne le relance pas/);
  assert.ok(!fs.existsSync(path.join(retire, 'compte.json')), 'clé périmée effacée');
  assert.match((await client(['diagnostic'], { donnees: retire })).stdout, /Activé sur cet ordinateur : non/);
});

test('skill demarrer : Node, état, conditions et activation dans la coque, puis la suite chargée du serveur', { skip: !fs.existsSync(path.join(SOURCE, 'skills', 'demarrer', 'SKILL.md')) }, () => {
  const t = fs.readFileSync(path.join(SOURCE, 'skills', 'demarrer', 'SKILL.md'), 'utf8');
  const etapes = ['node --version', '" diagnostic', '" conditions', '" activer --email <adresse>','--accepte-conditions', '" charger base/demarrer'];
  const i = etapes.map((e) => t.indexOf(e));
  assert.ok(i.every((x) => x >= 0), JSON.stringify(i));
  assert.deepEqual([...i].sort((a, b) => a - b), i, 'dans cet ordre');
  assert.doesNotMatch(t, /^!`/m, 'pas de ligne ! : Node peut manquer');
});

test('serveur injoignable : charger répond clairement, code 0', async () => {
  const coupe = path.join(tmp, 'plugins', 'coupe');
  installerPlugin(coupe, 'http://127.0.0.1:9');
  const r = await client(['charger', 'base/essai'], { dossierPlugin: coupe });
  assert.equal(r.code, 0);
  assert.match(r.stdout, /ne répond pas/);
});

test('crochet de démarrage : JSON SessionStart si l\'ordinateur n\'est pas activé, rien sinon', async () => {
  assert.equal((await client(['etat', '--crochet'])).stdout, '');
  const r = await client(['etat', '--crochet'], { donnees: path.join(tmp, 'vierge') });
  assert.equal(r.code, 0);
  assert.equal(JSON.parse(r.stdout).hookSpecificOutput.hookEventName, 'SessionStart');
  assert.match(JSON.parse(r.stdout).hookSpecificOutput.additionalContext, /Tutoie le membre/);
});

test('Node 22 au minimum : avec Node 20, charger le dit (code 0), run refuse (code 5)', async () => {
  assert.equal(NODE_MIN, 22);
  assert.deepEqual(['22.0.0', 'v24.11.1', '21.7.3', '20.20.2'].map((v) => nodeAssezRecent(v)), [true, true, false, false]);
  const vieux = path.join(tmp, 'plugins', 'node-ancien');
  installerPlugin(vieux, 'http://127.0.0.1:9');
  const sortie = [];
  const opts = { dossierClient: path.join(vieux, 'client'), versionNode: '20.20.2', ecrire: (t) => sortie.push(t), ecrireErreur: (t) => sortie.push(t) };
  assert.equal(await principal(['--data', data, 'charger', 'base/essai'], opts), 0);
  assert.match(sortie.join(''), /Node 22 ou plus, et cet ordinateur a Node 20\.20\.2/);
  assert.equal(await principal(['--data', data, 'run', 'modules'], opts), 5);
});
