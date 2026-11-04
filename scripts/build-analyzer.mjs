import {mkdir,copyFile,rm,cp,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.join(root,'dist');
await rm(out,{recursive:true,force:true});
await mkdir(path.join(out,'hand-analyzer'),{recursive:true});
await copyFile(path.join(root,'index.html'),path.join(out,'index.html'));
// Explicit allowlist: no user histories, tests, archives or local config in deploy output.
for(const name of ['index.html','style.css','app.js','parser.js','zip.js','demo.js','advice.js','opponents.js','screen.js','screen-facts.js']){
 await copyFile(path.join(root,'hand-analyzer',name),path.join(out,'hand-analyzer',name));
}
const vendor=path.join(root,'hand-analyzer/vendor/ocr');
const manifest=JSON.parse(await readFile(path.join(vendor,'manifest.json'),'utf8'));
for(const [name,expected] of Object.entries(manifest.files)){
 if(path.basename(name)!==name)throw Error('Invalid OCR asset path');
 const actual=createHash('sha256').update(await readFile(path.join(vendor,name))).digest('hex');
 if(actual!==expected)throw Error(`OCR integrity mismatch: ${name}`);
}
await cp(vendor,path.join(out,'hand-analyzer/vendor/ocr'),{recursive:true});
console.log('Built River analyzer in dist/ (no personal histories included).');
