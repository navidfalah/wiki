const vm=require('vm'),fs=require('fs'),assert=require('assert');
const data={},files={},requests=[];let builds=0,incomplete=false,imports=0,attachmentImports=0;
function iter(items){let i=0;return {hasNext:()=>i<items.length,next:()=>items[i++]};}
function folder(id){return {id,getId:()=>id,createFile(blob){const id='mail-copy-'+Object.keys(files).length;return driveFile(id,blob.name,'inbox','message/rfc822')}};}
function driveFile(id,name,parent,mime){return files[id]={id,name,parent,mime,getId:()=>id,getName:()=>name,getParents:()=>iter([folder(parent)]),getBlob:()=>({getBytes:()=>[1]})};}
const ws={root:folder('workspace'),inbox:folder('inbox')};
const pages={first:{files:[{id:'internal',name:'secret.json',mimeType:'application/json'},{id:'backup',name:'backup.txt',mimeType:'text/plain'},{id:'doc',name:'doc.txt',mimeType:'text/plain'},{id:'unsupported',name:'form',mimeType:'application/vnd.google-apps.form'},{id:'large',name:'big.pdf',mimeType:'application/pdf',size:9999}],nextPageToken:'next'},next:{files:[{id:'shared',name:'shared.txt',mimeType:'text/plain'}]}};
driveFile('internal','secret.json','inbox','application/json');driveFile('backup','backup.txt','backup-root','text/plain');driveFile('doc','doc.txt','outside','text/plain');driveFile('unsupported','form','outside','application/vnd.google-apps.form');driveFile('large','big.pdf','outside','application/pdf');driveFile('shared','shared.txt','outside','text/plain');
const ctx={console,JSON,Object,Array,Set,Number,String,Boolean,Date,Error,Math,WB_LIMITS:{files:20,uploadBytes:1000},
 wbWorkspace_:()=>ws,wbRead_:(_,name,def)=>name in data?JSON.parse(JSON.stringify(data[name])):def,wbWrite_:(_,name,v)=>{data[name]=JSON.parse(v)},wbLock_:f=>f(),wbReply_:f=>{try{return {ok:true,data:f()}}catch(e){return {ok:false,error:e.message}}},wbJob_:()=>null,
 wbListSources_:()=>Object.values(files).filter(f=>f.parent==='inbox'&&f.id!=='internal').map(f=>({id:f.id,title:f.name,mime:f.mime,modified:'2026-01-01T00:00:00.000Z'})),
 wbProps_:()=>({getProperty:key=>key==='WB_BACKUPS'?'backup-root':null}),wbFolderRelated_:(a,b)=>a.id===b.id||a.id==='inbox'&&b.id==='workspace',wbInboxFolders_:()=>[{id:'inbox'}],
 DriveApp:{getFolderById:folder,getFileById:id=>{if(!files[id])throw Error('missing');return files[id]}},Drive:{Files:{list:options=>{requests.push(options);return incomplete?{files:[],incompleteSearch:true}:pages[options.pageToken||'first']}}},
 wbImportDriveFile_:(workspace,id)=>{imports++;const f=files[id],copyId='drive-copy-'+id;driveFile(copyId,f.name,'inbox',f.mime);const ledger=data['drive-imports.json']||{};ledger[id]={copyId,modified:'2026-01-01T00:00:00.000Z',copyModified:'2026-01-01T00:00:00.000Z',name:f.name};data['drive-imports.json']=ledger;return {id:copyId}},
 wbGmail_:path=>{requests.push(path);return path.startsWith('messages?')?{messages:[{id:'abcdef12'}]}:{raw:'aGk='}},Utilities:{base64DecodeWebSafe:()=>[1],newBlob:(bytes,mime,name)=>({name})},
 wbEmailSource_:(workspace,id)=>({id,title:files[id].name,modified:'2026-01-01T00:00:00.000Z'}),wbSourceRevision_:()=> 'rev',
 wbParseEmail_:()=>({attachments:[{id:'1.1',name:'attachment.txt',mime:'text/plain'},{id:'1.2',name:'unsupported.bin',mime:'application/octet-stream'}]}),
 wbImportEmailAttachments_:()=>{attachmentImports++;return [{part:'1.1',imported:true,existing:false}]},
 ScriptApp:{getProjectTriggers:()=>[]},apiStartBuild:()=>({ok:true,data:{id:'build-'+(++builds)}})
};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('Sync.gs','utf8'),ctx);
data['sync.json']={enabled:true,allDrive:true,allGmail:true,gmailQuery:'',phase:'drive',driveCursor:0,dirty:false,issues:[]};
ctx.wbSyncRun_();assert.equal(data['sync.json'].phase,'discover');
ctx.wbSyncRun_();assert.equal(imports,1);assert.ok(data['drive-imports.json'].doc);assert.ok(!data['drive-imports.json'].internal);assert.ok(!data['drive-imports.json'].backup);assert.equal(data['sync.json'].phase,'gmail');assert.equal(builds,1);
ctx.wbSyncRun_();assert.ok(requests.some(r=>typeof r==='string'&&r.includes('includeSpamTrash=true')));assert.equal(attachmentImports,1);assert.equal(data['sync.json'].phase,'discover');assert.equal(builds,2);
ctx.wbSyncRun_();assert.ok(data['drive-imports.json'].shared);assert.equal(builds,3);assert.ok(data['sync.json'].issues.some(x=>x.id==='unsupported'&&x.code==='SYNC_FORMAT_SKIPPED'));assert.ok(data['sync.json'].issues.some(x=>x.id==='large'&&x.code==='SOURCE_SIZE_LIMIT'));
let state=ctx.wbSyncState_(ws);state.allGmail=true;state.gmailToken='';ctx.wbSyncGmail_(ws,state);assert.equal(attachmentImports,1,'already imported attachments must not be copied again');
const mail=Object.values(files).find(f=>f.name==='gmail-abcdef12.eml');ctx.wbSourceRevision_=()=> 'rev2';ctx.wbParseEmail_=()=>({attachments:Array.from({length:12},(_,i)=>({id:'1.'+(i+1),name:'a'+i+'.txt',mime:'text/plain'}))});ctx.wbImportEmailAttachments_=(workspace,input)=>input.parts.map(part=>({part,imported:true}));
assert.equal(ctx.wbSyncEmailAttachments_(ws,state,'abcdef12',mail.id).done,false);assert.equal(data['sync-gmail-attachments.json'].abcdef12.cursor,10);assert.equal(ctx.wbSyncEmailAttachments_(ws,state,'abcdef12',mail.id).done,true);assert.equal(data['sync-gmail-attachments.json'].abcdef12.cursor,12);
ctx.wbSourceRevision_=()=> 'rev3';ctx.wbImportEmailAttachments_=(workspace,input)=>[{part:input.parts[0],imported:false,error:'SOURCE_COUNT_LIMIT'}];const limited=ctx.wbSyncEmailAttachments_(ws,state,'abcdef12',mail.id);assert.equal(limited.limit,true);assert.notEqual(data['sync-gmail-attachments.json'].abcdef12.revision,'rev3','a failed attachment batch must remain retryable');
driveFile('more','more.txt','outside','text/plain');ctx.WB_LIMITS.files=2;ctx.Drive.Files.list=()=>({files:[{id:'more',name:'more.txt',mimeType:'text/plain'}]});const before=imports;assert.equal(ctx.wbSyncDiscoverDrive_(ws,state),true);assert.equal(imports,before);assert.ok(state.issues.some(x=>x.id==='__drive_limit__'&&x.code==='SOURCE_COUNT_LIMIT'));
ctx.Drive.Files.list=()=>({files:[],incompleteSearch:true});assert.throws(()=>ctx.wbSyncDiscoverDrive_(ws,state),/SYNC_DRIVE_INCOMPLETE/);
console.log('automatic import tests passed: Drive and Gmail alternation, exclusions, limits, attachments and incomplete listings');

const existing={console};vm.createContext(existing);vm.runInContext(fs.readFileSync('Code.gs','utf8'),existing);
const saved={},revisionDate='2026-01-01T00:00:00.000Z',emailSource={id:'email',title:'message.eml',mime:'message/rfc822',modified:revisionDate};let copied=0,attachmentFile=null;
existing.wbReply_=fn=>{try{return {ok:true,data:fn()}}catch(e){return {ok:false,error:e.message}}};existing.wbLock_=fn=>fn();existing.wbWorkspace_=()=>({root:{},inbox:{}});existing.wbInboxMutationGuard_=()=>{};
existing.wbEmailSource_=()=>emailSource;existing.wbSourceRevision_=()=> 'revision';existing.wbParseEmail_=()=>({attachments:[{id:'1.1',name:'notes.txt',mime:'text/plain',bytes:[65]}]});
existing.wbRead_=(_,name,fallback)=>saved[name]||fallback;existing.wbWrite_=(_,name,value)=>{saved[name]=JSON.parse(value)};existing.wbHash_=v=>String(v);existing.wbListSources_=()=>attachmentFile?[{id:'attachment',modified:revisionDate}]:[];
existing.DriveApp={getFileById:()=>({getSize:()=>1,getBlob:()=>({getBytes:()=>[1]}),getLastUpdated:()=>new Date(revisionDate)})};
existing.wbFolder_=()=>({createFile:()=>{copied++;attachmentFile={getId:()=> 'attachment',getLastUpdated:()=>new Date(revisionDate),getUrl:()=> 'https://example.com'};return attachmentFile}});existing.Utilities={newBlob:()=>({})};
let first=existing.apiImportEmailAttachments({id:'email',revision:'revision',parts:['1.1']});assert.equal(first.ok,true);assert.equal(first.data[0].imported,true);let second=existing.apiImportEmailAttachments({id:'email',revision:'revision',parts:['1.1']});assert.equal(second.data[0].existing,true);assert.equal(copied,1,'manual attachment import must remain idempotent');
console.log('existing attachment import API passed after refactoring');
