import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
await mkdir('public/blueprint',{recursive:true});await rm('public/blueprint',{recursive:true,force:true});await cp('frontend','public/blueprint',{recursive:true});
await writeFile('public/blueprint/backend.js','window.BLUEPRINT_SHARED = !["terminal.local","localhost","127.0.0.1"].includes(location.hostname);\n');
