import {mkdir,copyFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.join(root,'dist');
await rm(out,{recursive:true,force:true});
await mkdir(path.join(out,'hand-analyzer'),{recursive:true});
await copyFile(path.join(root,'index.html'),path.join(out,'index.html'));
// Explicit allowlist: no user histories, tests, archives or local config in deploy output.
for(const name of ['index.html','style.css','app.js','parser.js','zip.js','demo.js','advice.js','opponents.js']){
 await copyFile(path.join(root,'hand-analyzer',name),path.join(out,'hand-analyzer',name));
}
console.log('Built River analyzer in dist/ (no personal histories included).');
