'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const base = path.resolve(__dirname,'..'), source = path.join(base,'src'), dist = path.join(base,'dist'), install = path.join(dist,'install');
fs.mkdirSync(install,{recursive:true});
const serverFiles = ['Core.gs','Store.gs','Readers.gs','Compiler.gs','Search.gs','Code.gs'];
const combined = '// Wissensbau — Apps Script server bundle. Generated from src/*.gs.\n\n' + serverFiles.map(name=>'// ===== '+name+' =====\n'+fs.readFileSync(path.join(source,name),'utf8')).join('\n\n');
new vm.Script(combined,{filename:'Code.gs'});fs.writeFileSync(path.join(install,'Code.gs'),combined);
for(const name of ['Index.html','Styles.html','Fonts.html','Translations.html','Client.html','appsscript.json'])fs.copyFileSync(path.join(source,name),path.join(install,name));
for(const name of ['INSTALL-en.md','INSTALL-fa.md'])fs.copyFileSync(path.join(base,name),path.join(install,name));
fs.writeFileSync(path.join(install,'.clasp.json.example'),JSON.stringify({scriptId:'PASTE_YOUR_SCRIPT_ID_HERE',rootDir:'.'},null,2)+'\n');
fs.writeFileSync(path.join(install,'.claspignore'),'**/**\n!*.gs\n!*.html\n!appsscript.json\n');
fs.mkdirSync(path.join(install,'licenses'),{recursive:true});for(const name of fs.readdirSync(path.join(base,'licenses')))fs.copyFileSync(path.join(base,'licenses',name),path.join(install,'licenses',name));
// Remove the old cross-runtime JavaScript copy: Apps Script receives the
// `.gs` sources (or the combined `Code.gs`), never a standalone `.js` file.
fs.rmSync(path.join(dist,'WikiCore.js'),{force:true});
const apiFiles = ['Code.gs','Index.html','Styles.html','Fonts.html','Translations.html','Client.html','appsscript.json'].map(filename=>({name:filename.replace(/\.(gs|html|json)$/,''),type:filename.endsWith('.gs')?'SERVER_JS':filename.endsWith('.html')?'HTML':'JSON',source:fs.readFileSync(path.join(install,filename),'utf8')}));
fs.writeFileSync(path.join(dist,'apps-script-project.json'),JSON.stringify({files:apiFiles},null,2));
function crc32(bytes){let crc=-1;for(const b of bytes){crc^=b;for(let n=0;n<8;n++)crc=(crc>>>1)^(0xedb88320&-(crc&1));}return(crc^-1)>>>0;}
function walk(folder,prefix=''){return fs.readdirSync(folder).flatMap(name=>{const file=path.join(folder,name),relative=prefix+name;return fs.statSync(file).isDirectory()?walk(file,relative+'/'):[{name:relative,data:fs.readFileSync(file)}];});}
const files=walk(install),locals=[],central=[];let offset=0;
for(const f of files){const name=Buffer.from('Wissensbau-AppsScript/'+f.name),compressed=zlib.deflateRawSync(f.data),crc=crc32(f.data),h=Buffer.alloc(30),c=Buffer.alloc(46);h.writeUInt32LE(0x04034b50);h.writeUInt16LE(20,4);h.writeUInt16LE(8,8);h.writeUInt32LE(crc,14);h.writeUInt32LE(compressed.length,18);h.writeUInt32LE(f.data.length,22);h.writeUInt16LE(name.length,26);locals.push(h,name,compressed);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(8,10);c.writeUInt32LE(crc,16);c.writeUInt32LE(compressed.length,20);c.writeUInt32LE(f.data.length,24);c.writeUInt16LE(name.length,28);c.writeUInt32LE(offset,42);central.push(c,name);offset+=h.length+name.length+compressed.length;}
const directory=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(files.length,8);end.writeUInt16LE(files.length,10);end.writeUInt32LE(directory.length,12);end.writeUInt32LE(offset,16);const archive=Buffer.concat([...locals,directory,end]);
fs.writeFileSync(path.join(dist,'Wissensbau-AppsScript.zip'),archive);fs.writeFileSync(path.join(dist,'SHA256SUMS'),crypto.createHash('sha256').update(archive).digest('hex')+'  Wissensbau-AppsScript.zip\n');
console.log(`Packaged ${files.length} installation files (${archive.length} bytes).`);
