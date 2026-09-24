import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { firebaseConfig } from '../src/config.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (firebaseConfig.projectId !== 'omycare-portal') throw Error('Review the deployment project before publishing.');
const run = (cmd, args) => {
  const result = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
};
run('npm', ['run', 'build']);
run('npm', ['test']);
run('npm', ['run', 'test:rules']);
// This script never provisions billing, Functions, App Hosting, or Cloud Storage.
run(process.execPath, [path.join(root, 'node_modules/firebase-tools/lib/bin/firebase.js'), 'deploy',
  '--project', firebaseConfig.projectId, '--only', 'firestore:rules,firestore:indexes,hosting']);
