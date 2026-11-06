const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Exercise the real route click handler under the Apps Script _top base target.
const client = fs.readFileSync('Client.html', 'utf8').replace(/^<script>\s*/, '').replace(/\s*<\/script>\s*$/, '');
const listeners = {}, nodes = {};
function node(id) {
  return nodes[id] ||= {innerHTML:'', value:'', hidden:false, isConnected:true,
    addEventListener(type, fn){this[type]=fn;}, querySelectorAll(){return [];}};
}
const browser = {
  console, URL, Intl, Date, Promise, setTimeout, clearTimeout,
  navigator:{language:'en'}, localStorage:{getItem(){return null;}},
  location:{hash:'#dashboard'}, window:{addEventListener(){}},
  document:{documentElement:{dataset:{}},getElementById:node,addEventListener(type,fn){listeners[type]=fn;}},
};
vm.createContext(browser);
const cutoff = client.lastIndexOf("document.querySelectorAll('[data-language]').forEach");
const navigation = client.slice(client.indexOf('// Internal routes must stay in this frame'), client.indexOf("window.addEventListener('hashchange',render);"));
vm.runInContext(client.slice(0,cutoff)+navigation+`
  shell=function(){};buildBanner=function(){};setSidebarOpen=function(){};
  globalThis.test={state,sourcePage,dashboard,runFolderImport,
    rpc(fn){rpc=fn;},render(fn){render=fn;}};
}());`,browser);
const ui = browser.test;
let prevented = false;
listeners.click({button:0,target:{closest(){return {getAttribute(){return '#sources';}};}},preventDefault(){prevented=true;}});
assert.equal(prevented,true,'internal navigation must not follow the _top base target');
assert.equal(browser.location.hash,'#sources');
prevented=false;
listeners.click({button:0,ctrlKey:true,target:{closest(){return {getAttribute(){return '#sources';}};}},preventDefault(){prevented=true;}});
assert.equal(prevented,false,'modified clicks keep their browser behavior');

// Every menu route and nested wiki link must remain inside the frame.
for (const route of ['dashboard','pipeline','sources','emails','connectors','pages','pages/example','search','chat','graph','health','analytics','research','history','backups','settings']) {
  let intercepted=false;
  listeners.click({button:0,target:{closest(){return {getAttribute(){return '#'+route;}};}},preventDefault(){intercepted=true;}});
  assert.equal(intercepted,true,route+' navigation is intercepted');
  assert.equal(browser.location.hash,'#'+route);
}
const index=fs.readFileSync('Index.html','utf8');
assert.ok(!index.includes('target="_top"'),'the document must not default to top-level navigation');
for (const anchor of (index+client).matchAll(/<a\b[^>]*href="#(?:dashboard|pipeline|sources|history|pages|chat)[^>]*>/g)) {
  assert.ok(anchor[0].includes('target="_self"'),'internal anchors need a frame-local fallback: '+anchor[0]);
}

function iterator(values){let i=0;return {hasNext:()=>i<values.length,next:()=>values[i++]};}
const server = {console};vm.createContext(server);vm.runInContext(fs.readFileSync('Code.gs','utf8'),server);
const folders={}, files={}, storage={};let sequence=0;
function folder(id,parent){return folders[id]={getId:()=>id,getName:()=>id,getUrl:()=>`https://drive.google.com/drive/folders/${id}`,
  getParents:()=>iterator(parent?[folders[parent]]:[]),getFiles:()=>iterator(Object.values(files).filter(f=>f.parent===id)),
  getFolders:()=>iterator(Object.values(folders).filter(f=>f.parent===id)),parent,
  createFolder(name){return folder('new-'+(++sequence),id);}};}
function file(id,parent){return files[id]={parent,getId:()=>id,getName:()=>id+'.txt',isTrashed:()=>false,
  getMimeType:()=> 'text/plain',getLastUpdated:()=>new Date('2026-11-06T00:00:00Z'),getSize:()=>10,
  getUrl:()=>`https://drive.google.com/file/d/${id}/view`,makeCopy(name,destination){return file('copy-'+(++sequence),destination.getId());}};}
folder('external-parent');folder('workspace','external-parent');folder('inbox','workspace');folder('nested','external-parent');
file('one','external-parent');file('two','nested');file('private-settings','workspace');
server.DriveApp={getFolderById:id=>folders[id],getFileById:id=>files[id]};
server.Utilities={getUuid:()=> 'job-id'};
const ws={root:folders.workspace,inbox:folders.inbox};
server.wbWorkspace_=()=>ws;server.wbJob_=()=>null;server.wbLock_=fn=>fn();server.wbSyncMarkDirty_=()=>{};
server.wbRead_=(_,name,fallback)=>storage[name]?JSON.parse(JSON.stringify(storage[name])):fallback;
server.wbWrite_=(_,name,value)=>{storage[name]=JSON.parse(value);};
server.wbProps_=()=>({getProperty:()=> 'workspace'});server.wbSnapshot_=()=>({pages:[],entities:[],version:null});server.wbPublicSettings_=()=>({});
server.wbSourceRevision_=()=> 'revision';
(async()=>{
  let reply=server.apiStartFolderImport('external-parent');
  assert.equal(reply.ok,true,'the folder selected as setup parent must be importable');
  assert.ok(!storage['folder-import.json'].tasks.some(task=>task.id==='workspace'||task.id==='private-settings'),'workspace contents must be excluded');
  while(reply.data.status==='running')reply=server.apiContinueFolderImport(reply.data.id);
  assert.equal(reply.data.status,'success');
  assert.equal(server.apiBootstrap().data.counts.sources,2,'count copied files across nested folders');
  assert.equal(server.apiSources().data.sources.length,2);
  assert.equal(server.apiStartFolderImport('https://drive.google.com/drive/folders/workspace').error,'IMPORT_FOLDER_RECURSIVE');
  assert.equal(server.apiStartFolderImport('https://drive.google.com/drive/folders/inbox').error,'IMPORT_FOLDER_RECURSIVE');

  vm.runInContext(fs.readFileSync('Translations.html','utf8').replace(/^<script>\s*/,'').replace(/\s*<\/script>\s*$/,''),browser);
  ui.state.boot={ready:true,workspace:{},counts:{sources:0},settings:{}};
  ui.rpc(async name=>name==='apiSources'?server.apiSources().data:server.apiBootstrap().data);
  await ui.sourcePage();
  assert.equal(ui.state.boot.counts.sources,2);
  assert.ok(nodes['source-table'].innerHTML.includes('copy-'),'Sources renders the imported files');
  await ui.dashboard();
  assert.ok(nodes.content.innerHTML.includes('<strong>2</strong>'),'Overview refreshes the source count');
  assert.ok(nodes.content.innerHTML.includes('overview-folder'),'an existing workspace can import a folder from Overview');
  let rendered=0;ui.render(async()=>{rendered++;});
  await ui.runFolderImport({status:'success'},'overview-import-status');
  assert.equal(rendered,1,'completed imports refresh the current view');
  assert.equal(ui.state.boot.counts.sources,2);
  console.log('overview and sources tests passed: frame navigation, setup-parent import, workspace exclusion, nested counts, source rendering and refresh');
})().catch(error=>{console.error(error);process.exitCode=1;});
