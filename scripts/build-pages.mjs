import {cp,mkdir,rm,writeFile} from 'node:fs/promises';
await rm('pages-dist',{recursive:true,force:true});
await mkdir('pages-dist',{recursive:true});
await cp('frontend','pages-dist',{recursive:true,filter:source=>!source.endsWith('.zip')});
await writeFile('pages-dist/.nojekyll','');
console.log('GitHub Pages: complete local questionnaire and simulators, with a secure shared-project link.');
