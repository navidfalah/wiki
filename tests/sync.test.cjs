const vm=require('vm'),fs=require('fs'),assert=require('assert');
const db={},files={},folders={}; let next=0,builds=0,job=null,failMove=false;
function iterator(a){let i=0;return {hasNext:()=>i<a.length,next:()=>a[i++]};}
function folder(id){return folders[id]||(folders[id]={id,getId(){return id},createFile(blob){return makeFile('new'+(++next),blob.name,id,'2026-01-01T00:00:00.000Z')}})}
function makeFile(id,name,parent,modified){const f=files[id]={id,name,parent,modified,getId(){return this.id},getName(){return this.name},getLastUpdated(){return new Date(this.modified)},getParents(){return iterator([folder(this.parent)])},isTrashed(){return false},moveTo(p){if(failMove&&this.id.startsWith('copy')&&p.id==='inbox'){failMove=false;throw Error('move failed')}this.parent=p.id},getUrl(){return 'https://example.com/'+this.id},makeCopy(n,p){return makeFile('copy'+(++next),n,p.id,'2026-01-01T00:00:00.000Z')}};return f}
const ws={root:folder('root'),inbox:folder('inbox')}; const ctx={console,Date,JSON,Object,Array,Set,Number,String,Math,Error,Boolean,WB_LIMITS:{files:500,uploadBytes:1000},
 wbWorkspace_:()=>ws,wbRead_:(_,name,fallback)=>name in db?JSON.parse(JSON.stringify(db[name])):fallback,wbWrite_:(_,name,value)=>{db[name]=JSON.parse(value)},wbLock_:fn=>fn(),wbReply_:fn=>{try{return {ok:true,data:fn()}}catch(e){return {ok:false,error:e.message}}},wbJob_:()=>job,
 wbListSources_:()=>Object.values(files).filter(f=>f.parent==='inbox').map(f=>({id:f.id,title:f.name,modified:f.modified})),wbInboxFolders_:()=>[{id:'inbox'}],wbFolder_:(_,name)=>folder(name),wbFolderRelated_:(a,b)=>a.id===b.id||a.id==='inbox'&&b.id==='root',
 DriveApp:{getFileById(id){if(!files[id])throw Error('missing');return files[id]},getFolderById:folder},
 Utilities:{base64DecodeWebSafe:()=>[1,2],newBlob:(bytes,mime,name)=>({name})},
 ScriptApp:{getProjectTriggers:()=>[]},
 wbGmail_:path=>{if(path.startsWith('messages?'))return {messages:[{id:'abcdef12'}]};return {raw:'aGk='}},
 apiStartBuild:()=>{builds++;return {ok:true,data:{id:'build'+builds}}}
};vm.createContext(ctx);vm.runInContext(fs.readFileSync('Sync.gs','utf8'),ctx);
makeFile('original','doc.txt','external','2026-01-02T00:00:00.000Z');makeFile('old','doc.txt','inbox','2026-01-01T00:00:00.000Z');
db['sync.json']={enabled:true,gmailQuery:'',phase:'drive',driveCursor:0,dirty:false,issues:[]};db['drive-imports.json']={original:{copyId:'old',modified:'2026-01-01T00:00:00.000Z',copyModified:'2026-01-01T00:00:00.000Z',name:'doc.txt'}};
ctx.wbSyncRun_();assert.equal(files.old.parent,'sync-revisions');assert.equal(files[db['drive-imports.json'].original.copyId].parent,'inbox');assert.equal(builds,1);assert.equal(db['sync.json'].dirty,false);
ctx.wbSyncRun_();assert.equal(builds,1,'unchanged files must not rebuild');
let active=files[db['drive-imports.json'].original.copyId];active.modified='2026-01-03T00:00:00.000Z';files.original.modified='2026-01-04T00:00:00.000Z';ctx.wbSyncRun_();assert.equal(files[active.id].parent,'inbox');assert.equal(db['sync.json'].issues[0].code,'SYNC_COPY_CHANGED');assert.equal(builds,1);
db['sync.json'].gmailQuery='in:inbox';ctx.wbSyncRun_();ctx.wbSyncRun_();assert.equal(Object.values(files).filter(f=>f.name==='gmail-abcdef12.eml').length,1);assert.equal(builds,2);ctx.wbSyncRun_();ctx.wbSyncRun_();assert.equal(builds,2,'Gmail deduplication');
job={status:'running'};files.original.modified='2026-01-05T00:00:00.000Z';ctx.wbSyncRun_();assert.equal(db['sync.json'].lastStatus,'busy');assert.equal(builds,2);
job=null;active.modified='2026-01-01T00:00:00.000Z';db['sync.json'].gmailQuery='';db['sync.json'].phase='drive';failMove=true;ctx.wbSyncRun_();assert.ok(db['drive-imports.json'].original.pending);assert.equal(builds,2,'incomplete replacement must never be published');ctx.wbSyncRun_();assert.ok(!db['drive-imports.json'].original.pending);assert.equal(builds,3,'recovered replacement must be built');
for(let i=0;i<11;i++){let id='z'+i,copy='local'+i;makeFile(id,id+'.txt','external','2026-01-02T00:00:00.000Z');makeFile(copy,id+'.txt','inbox','2026-01-01T00:00:00.000Z');db['drive-imports.json'][id]={copyId:copy,modified:'2026-01-01T00:00:00.000Z',copyModified:'2026-01-01T00:00:00.000Z',name:id+'.txt'}}
ctx.wbSyncRun_();assert.equal(db['sync.json'].lastStatus,'running');assert.equal(builds,3,'partial Drive scan must not build');ctx.wbSyncRun_();assert.equal(builds,4,'completed Drive scan must build');
const localId=db['drive-imports.json'].original.copyId;assert.equal(ctx.apiSyncForgetDrive('original').ok,true);assert.ok(!db['drive-imports.json'].original);assert.equal(db['sync-exclusions.json'].original,true);assert.equal(files[localId].parent,'inbox','stop tracking must keep the inbox copy');
console.log('sync tests passed: Drive updates, recovery, conflict preservation, Gmail deduplication, build scheduling and busy guard');
