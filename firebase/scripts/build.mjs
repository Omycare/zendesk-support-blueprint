import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { build } from 'esbuild';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.resolve(root, '../frontend'), output = path.join(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
// Explicit allowlist: never copy exports, backend source, credentials or project data.
for (const file of ['app.js','content.js','tracking-data.js','workspace-data.js','extensions.js','xlsx.js','style.css','favicon.svg','assets']) {
  await cp(path.join(source, file), path.join(output, file), { recursive: true });
}
const keep = `function keepRowId(row){return /^[a-zA-Z0-9_-]{1,80}$/.test(row?._rowId||'')?{_rowId:row._rowId}:{}}\n`;
let app = await readFile(path.join(output, 'app.js'), 'utf8');
function replace(before, after) {
  if (!app.includes(before)) throw Error('Frontend integration anchor changed: ' + before.slice(0, 80));
  app = app.replace(before, after);
}
replace("let state=fresh();try{const saved=localStorage.getItem(KEY);if(saved)state=validate(JSON.parse(saved))}catch{storageOK=false}", "let state=fresh();state.lang=window.BLUEPRINT_LANG||'fr';");
replace("b.rows=a.rows.map(r=>Object.fromEntries((s.cols||[]).map(c=>[c.key,String(r[c.key]??'').slice(0,65536)])));", "b.rows=a.rows.map(r=>({...keepRowId(r),...Object.fromEntries((s.cols||[]).map(c=>[c.key,String(r[c.key]??'').slice(0,65536)]))}));");
replace('function render(){', 'function renderBody(){');
const api = app.match(/^async function api\(path,options=\{\}\)\{[^\n]+$/m)?.[0];
if (!api) throw Error('API integration anchor changed');
replace(api, 'async function api(path,options={}){return window.BLUEPRINT_API(path,options)}');
const poll = app.match(/^if\(shared&&typeof window!=='undefined'\)setInterval[^\n]+$/m)?.[0];
if (!poll) throw Error('Refresh integration anchor changed');
replace(poll, '// Firebase snapshots replace periodic network polling.');
replace('function accessView(){', `function accessView(){if(window.BLUEPRINT_FIREBASE)return \`<div class="accessbox"><h3>\${tr('Accès pour votre consultante','Access for your consultant')}</h3><p>\${tr('Créez un compte nominatif pour','Create a named account for')} <strong>stephanie@omycare.fr</strong>. \${tr('Indiquez ensuite « Invitation envoyée » ci-dessus.','Then select “Invitation sent” above.')}</p><p class="muted">\${tr('Ne saisissez pas de mot de passe dans ce portail.','Do not enter a Zendesk password in this portal.')}</p></div>\`;`);
replace('Ajoutez son email pour autoriser ce projet. Il faudra aussi lui ouvrir l’accès au site via Partager. Aucun email n’est envoyé ici.', 'Ajoutez son email pour autoriser ce projet. Cette personne doit se connecter avec cette adresse vérifiée. Aucun email n’est envoyé ici.');
replace('Add their email to authorize this project. You must also grant access to the site through Share. No email is sent here.', 'Add their email to authorize this project. They must sign in with this verified address. No email is sent here.');
replace('Les deux formations OmyCare demandent leur code dans ce portail.', 'L’accès est autorisé selon le compte et les formations incluses.');
replace('The two OmyCare courses require their code in this portal.', 'Access is authorized by account and purchased training.');
replace(':shared?`<form data-unlock=', ':window.BLUEPRINT_FIREBASE?`<p>${tr("Votre consultante ajoutera le lien de cette formation.","Your consultant will add this training link.")}</p>`:shared?`<form data-unlock=');
replace('cloud.error=e.status===409?', `cloud.error=e.status===413?tr('Ce dossier est trop volumineux. Exportez vos réponses et placez les grandes tables dans Drive avant de réessayer.','This brief is too large. Export your answers and move large tables to Drive before retrying.'):e.status===409?`);
replace("if(action==='member-add'){const email=", "if(action==='member-add'){if(!await flushCloud())return;const email=");
replace("await loadMembers();render();toast(tr('Accès au projet autorisé.", "await loadProject(cloud.id);toast(tr('Accès au projet autorisé.");
replace("b.onclick=async()=>{try{await api(`projects/${cloud.id}/members`", "b.onclick=async()=>{try{if(!await flushCloud())return;await api(`projects/${cloud.id}/members`");
replace("await loadMembers();render()}catch{toast(tr('Impossible de modifier les accès.'", "await loadProject(cloud.id)}catch{toast(tr('Impossible de modifier les accès.'");
replace("const p=await api('projects/'+id);const language=state.lang;", "const p=await api('projects/'+id);const language=state.lang;");
replace("'Le projet partagé est indisponible. Réessayez sans effacer votre sauvegarde locale.'", "'Cet espace n’est pas encore disponible. Contactez Stephanie ou réessayez.'");
replace("'The shared project is unavailable. Retry without deleting your local backup.'", "'This workspace is not yet available. Contact Stephanie or try again.'");
app += '\n' + keep + `
function firebaseContext(){return {
 projectId:cloud.id,projectName:d('company').values.name||'Projet',lang:state.lang,page:pageView,
 canManage:canManage(),section:section(),extensions:extensionDefinitions,worktab:activeWorktab,
 flush:flushCloud,snapshot:()=>structuredClone(state),openProject:async id=>{if(await flushCloud())await loadProject(id)},
 rowId:(kind,key,index)=>{
  const row=kind==='section'?state.sections[key].rows[index]:kind==='extension'?state.extensions[key][index]:state.workspace.tabs.find(t=>t.id===key).rows[index];
  if(!keepRowId(row)._rowId){row._rowId=crypto.randomUUID();persist()}
  return row._rowId;
 }
}}
function render(){renderBody();window.BLUEPRINT_ON_RENDER?.(firebaseContext())}
window.BLUEPRINT_CONTROLLER={flush:flushCloud};
let firebaseRefreshTimer=null;
window.addEventListener('blueprint:remote-change',event=>{
 clearTimeout(firebaseRefreshTimer);
 const refresh=async()=>{
  if(cloud.id!==event.detail.id||cloud.revision===event.detail.revision||cloud.dirty||cloud.error)return;
  if(cloud.busy||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)){firebaseRefreshTimer=setTimeout(refresh,1000);return}
  await loadProject(cloud.id);
 };
 firebaseRefreshTimer=setTimeout(refresh,350);
});
window.addEventListener('blueprint:access-lost',()=>{
 clearTimeout(saveTimer);clearTimeout(firebaseRefreshTimer);unlockedCourses.clear();
 state=fresh();cloud.id=null;cloud.projects=[];cloud.events=[];cloud.resources=[];cloud.members=[];cloud.role='client';cloud.dirty=false;cloud.ready=false;cloud.error='';
 bootstrap();
});
`;
await writeFile(path.join(output, 'app.js'), app);
let workspace = await readFile(path.join(output, 'workspace-data.js'), 'utf8');
workspace = keep + workspace.replace('item: text(row?.item, 300)', '...keepRowId(row), item: text(row?.item, 300)');
await writeFile(path.join(output, 'workspace-data.js'), workspace);
let extensions = await readFile(path.join(output, 'extensions.js'), 'utf8');
const old = "map(r=>Object.fromEntries(e.cols.map(c=>[c.key,String(r?.[c.key]??'').slice(0,16000)])))";
if (!extensions.includes(old)) throw Error('Extension row normalization changed');
extensions = keep + extensions.replace(old, "map(r=>({...keepRowId(r),...Object.fromEntries(e.cols.map(c=>[c.key,String(r?.[c.key]??'').slice(0,16000)]))}))");
await writeFile(path.join(output, 'extensions.js'), extensions);
await writeFile(path.join(output, 'course-catalog.js'), 'export const defaultCourses = [];\n');
await cp(path.join(root, 'src/firebase.css'), path.join(output, 'firebase.css'));
await writeFile(path.join(output, 'index.html'), `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#0e0452"><meta name="robots" content="noindex,nofollow"><title>OmyCare · Support Blueprint</title><link rel="icon" href="favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="style.css"><link rel="stylesheet" href="firebase.css"></head><body><div id="account-bar"></div><div id="app"><main class="auth-shell"><p>Chargement / Loading…</p></main></div><script type="module" src="firebase-entry.js"></script></body></html>`);
await build({ entryPoints: [path.join(root, 'src/entry.js')], outfile: path.join(output, 'firebase-entry.js'),
  bundle: true, format: 'esm', platform: 'browser', target: ['es2022'], minify: true, sourcemap: false,
  external: ['./app.js'], legalComments: 'none' });
console.log('Firebase static build ready; no server secrets or customer exports are included.');
