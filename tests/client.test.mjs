// Tests du client c360 sur Windows, macOS et Linux (GitHub Actions, à chaque mise à jour du dépôt).
// Le serveur de Studio 360D est simulé dans le test lui-même : aucun appel réseau, aucune matière.
// Lancement : node --test (Node 22 ou plus ; Python 3.10 ou plus pour les tests de run).
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
const { trouverPython, creerContexte, versSlash, principal, nodeAssezRecent, NODE_MIN } = await import(pathToFileURL(path.join(SOURCE, 'client', 'c360.mjs')).href);

const EMAIL = 'membre@exemple.fr';
const CODE = '123456';
const CLE = 'c360_cle_de_test_simulee_0123456789abcdefghijklmnop';
const etat = { actif: true, jetons: 0, jetonRefuse: false, activations: [] };

const OUTILS = {
  modules: {
    ok: true, nom: 'modules', interpreteur: 'python', python_min: '3.10', point_entree: 'principal.py', programmes: [],
    fichiers: [
      { chemin: 'principal.py', contenu: '# 360D-test\nimport os, sys\nfrom aide.voisin import bonjour\nprint(bonjour(sys.argv[1:]))\nprint("cwd=" + os.getcwd())\n' },
      { chemin: 'aide/__init__.py', contenu: '' },
      { chemin: 'aide/voisin.py', contenu: 'def bonjour(a):\n    return "bonjour " + " ".join(a)\n' },
    ],
  },
  erreur: {
    ok: true, nom: 'erreur', interpreteur: 'python', python_min: '3.10', point_entree: 'erreur.py', programmes: [],
    fichiers: [{ chemin: 'erreur.py', contenu: 'raise RuntimeError("erreur voulue")\n' }],
  },
  evasion: {
    ok: true, nom: 'evasion', interpreteur: 'python', python_min: '3.10', point_entree: 'x.py', programmes: [],
    fichiers: [{ chemin: '../hors-du-dossier.py', contenu: 'print("ne doit jamais être écrit")\n' }],
  },
};

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
        return OUTILS[nom] ? repondre(res, 200, OUTILS[nom]) : repondre(res, 404, { ok: false, raison: 'inconnu', message: 'Inconnu.' });
      }
      default: return repondre(res, 404, { ok: false });
    }
  });
});

let tmp;
let plugin;
let data;
let travail;
let pythonOk = false;

function installerPlugin(dossier, url) {
  fs.mkdirSync(path.join(dossier, 'client'), { recursive: true });
  fs.mkdirSync(path.join(dossier, '.claude-plugin'), { recursive: true });
  fs.copyFileSync(path.join(SOURCE, 'client', 'c360.mjs'), path.join(dossier, 'client', 'c360.mjs'));
  fs.writeFileSync(path.join(dossier, 'client', 'serveur.json'), JSON.stringify({ url }));
  fs.copyFileSync(path.join(SOURCE, 'CONDITIONS.md'), path.join(dossier, 'CONDITIONS.md'));
  fs.writeFileSync(path.join(dossier, '.claude-plugin', 'plugin.json'), JSON.stringify({ name: 'base', version: '0.0.0-test' }));
}

function client(args, { dossierPlugin = plugin, donnees = data } = {}) {
  return new Promise((resoudre) => {
    const env = { ...process.env };
    delete env.CLAUDE_PLUGIN_DATA;
    const p = spawn(process.execPath, [path.join(dossierPlugin, 'client', 'c360.mjs'), '--data', donnees, ...args], { cwd: travail, env });
    let stdout = '';
    let stderr = '';
    p.stdout.on('data', (d) => { stdout += d; });
    p.stderr.on('data', (d) => { stderr += d; });
    p.on('close', (code) => resoudre({ code, stdout, stderr }));
  });
}

const execVide = () => !fs.existsSync(path.join(data, 'exec')) || fs.readdirSync(path.join(data, 'exec')).length === 0;

before(async () => {
  await new Promise((r) => serveur.listen(0, '127.0.0.1', r));
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'c360 test '));
  plugin = path.join(tmp, 'plugins', 'base');
  data = path.join(tmp, 'données', 'base-studio-360d');
  travail = path.join(tmp, 'mon studio');
  fs.mkdirSync(travail, { recursive: true });
  installerPlugin(plugin, `http://127.0.0.1:${serveur.address().port}`);
  pythonOk = trouverPython(creerContexte({ dossierDonnees: data })).ok;
});

after(() => {
  serveur.close();
  fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 5 });
});

test('Python 3.10 ou plus est trouvé (obligatoire en intégration continue)', (t) => {
  const py = trouverPython(creerContexte({ dossierDonnees: data }));
  if (!py.ok && !process.env.CI) return t.skip(`pas de Python ici : ${py.essais.join(' ; ')}`);
  assert.equal(py.ok, true, JSON.stringify(py));
});

test('charger avant activation : message clair et code 0', async () => {
  const r = await client(['charger', 'base/essai']);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /pas encore activé/);
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

test('aide : l\'option --nom d\'activer y est décrite', async () => {
  const r = await client(['aide']);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /activer --email <adresse> --code <code> --accepte-conditions \[--nom "<nom>"\]/);
  assert.match(r.stdout, /--nom : le nom de l'ordinateur envoyé au serveur, de 1 à 60 caractères/);
});

test('charger : {{C360}} remplacé par la commande complète, avec des chemins à espaces', async () => {
  const r = await client(['charger', 'base/essai']);
  assert.equal(r.code, 0);
  // Node donne au client son chemin réel : sous macOS, /var est un lien vers /private/var.
  const commande = `node "${versSlash(path.join(fs.realpathSync(plugin), 'client', 'c360.mjs'))}" --data "${versSlash(data)}"`;
  assert.ok(r.stdout.includes(`Lance ${commande} run modules -- a b`), r.stdout);
  if (process.platform === 'win32') assert.ok(!commande.includes(path.sep));
});

test('jeton refusé par le serveur : renouvelé sans bruit', async () => {
  const avant = etat.jetons;
  etat.jetonRefuse = true;
  const r = await client(['charger', 'base/essai']);
  assert.match(r.stdout, /# Procédure base\/essai/);
  assert.equal(etat.jetons, avant + 1);
});

test('run : script et module voisin lancés depuis le dossier de travail, dossier effacé', async (t) => {
  if (!pythonOk) return t.skip('pas de Python');
  const r = await client(['run', 'modules', '--', 'x', 'y z']);
  assert.equal(r.code, 0, r.stderr);
  assert.match(r.stdout, /bonjour x y z/);
  assert.equal(fs.realpathSync(/cwd=(.*)/.exec(r.stdout)[1].trim()), fs.realpathSync(travail));
  assert.ok(execVide());
});

test('run : script qui lève une erreur, code de sortie transmis, dossier effacé', async (t) => {
  if (!pythonOk) return t.skip('pas de Python');
  const r = await client(['run', 'erreur']);
  assert.notEqual(r.code, 0);
  assert.match(r.stderr, /RuntimeError: erreur voulue/);
  assert.ok(execVide());
});

test('run : un chemin de fichier qui sort du dossier d\'exécution est refusé', async (t) => {
  if (!pythonOk) return t.skip('pas de Python');
  const r = await client(['run', 'evasion']);
  assert.equal(r.code, 3);
  assert.match(r.stderr, /chemin refusé/);
  assert.equal(fs.existsSync(path.join(data, 'exec', 'hors-du-dossier.py')), false);
  assert.ok(execVide());
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

test('adhésion inactive : charger donne le message de départ (code 0), run refuse (code 3)', async () => {
  etat.actif = false;
  fs.rmSync(path.join(data, 'jeton.json'), { force: true });
  const r = await client(['charger', 'base/essai']);
  assert.equal(r.code, 0);
  assert.match(r.stdout, /n'est plus active/);
  const run = await client(['run', 'modules']);
  assert.equal(run.code, 3);
  etat.actif = true;
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
