const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');

// Gmail starts on the first email visit, using the existing account and worker.
const saved={},triggers=[];let workers=0,created=0,failSave=false,failTrigger=false;
const ctx={console,wbWorkspace_:()=>({root:{},inbox:{}}),wbLock_:fn=>fn(),
  wbReply_:fn=>{try{return {ok:true,data:fn()};}catch(e){return {ok:false,error:e.message};}},
  wbRead_:(_,name,fallback)=>saved[name]?JSON.parse(JSON.stringify(saved[name])):fallback,
  wbWrite_:(_,name,value)=>{if(failSave)throw Error('SAVE_FAILED');saved[name]=JSON.parse(value);},
  wbListSources_:()=>[{id:'existing-mail'}],
  ScriptApp:{getProjectTriggers:()=>triggers.slice(),deleteTrigger:t=>triggers.splice(triggers.indexOf(t),1),newTrigger:handler=>({timeBased(){return this;},everyMinutes(n){assert.equal(n,5);return this;},create(){if(failTrigger)throw Error('TRIGGER_FAILED');created++;const t={getHandlerFunction:()=>handler};triggers.push(t);return t;}})}
};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('Sync.gs','utf8'),ctx);
ctx.wbSyncRun_=()=>{workers++;return ctx.wbSyncState_(ctx.wbWorkspace_());};
saved['sync.json']={allDrive:true,gmailQuery:'label:research',driveCursor:7};
let result=ctx.apiEmailSync();assert.equal(result.ok,true);assert.equal(workers,1);
assert.equal(result.data.enabled,true);assert.equal(result.data.allGmail,true);
assert.equal(result.data.phase,'gmail');assert.equal(result.data.gmailToken,'');
assert.equal(result.data.gmailDone,false);assert.equal(result.data.discoveryDone,false);
assert.equal(result.data.allDrive,true);assert.equal(result.data.driveCursor,7);
assert.equal(result.data.gmailQuery,'label:research');assert.equal(result.data.dirty,true);
assert.equal(triggers.length,1);assert.equal(created,1);
saved['sync.json'].gmailToken='next-mail-page';
ctx.apiEmailSync();assert.equal(created,1,'repeated visits must reuse the scheduler');
assert.equal(saved['sync.json'].gmailToken,'next-mail-page','polling must preserve pagination');
saved['sync.json'].enabled=false;saved['sync.json'].allGmail=false;
triggers.length=0;result=ctx.apiEmailSync();assert.equal(result.data.enabled,false);
assert.equal(result.data.allGmail,false);assert.equal(triggers.length,0,'explicitly disabled sync stays disabled');
saved['sync.json'].enabled=true;ctx.apiEmailSync();assert.equal(triggers.length,1,'repair a missing scheduler');
triggers.length=0;delete saved['sync.json'];failSave=true;
result=ctx.apiEmailSync();assert.equal(result.error,'SAVE_FAILED');assert.equal(triggers.length,0,'rollback a scheduler when saving fails');
failSave=false;failTrigger=true;result=ctx.apiEmailSync();assert.equal(result.error,'TRIGGER_FAILED');
assert.equal(saved['sync.json'],undefined,'failed scheduling must leave setup retryable');
failTrigger=false;assert.equal(ctx.apiEmailSync().ok,true);

// Exercise the real email view, including updates, filters, errors and navigation.
const nodes={},timers=[];function node(id){return nodes[id]||=( {innerHTML:'',textContent:'',value:'',hidden:false,addEventListener(){},querySelectorAll(){return [];} } );}
const browser={console,URL,Intl,Date,Promise,navigator:{language:'en'},localStorage:{getItem:()=>null},
  document:{documentElement:{dataset:{}},getElementById:node},
  setTimeout(fn,ms){const timer={fn,ms};timers.push(timer);return timer;},clearTimeout(timer){if(timer)timer.cleared=true;}};
vm.createContext(browser);
vm.runInContext(fs.readFileSync('Translations.html','utf8').replace(/^<script>\s*/,'').replace(/\s*<\/script>\s*$/,''),browser);
const client=fs.readFileSync('Client.html','utf8').replace(/^<script>\s*/,'').replace(/\s*<\/script>\s*$/,'');
const cutoff=client.lastIndexOf("document.querySelectorAll('[data-language]').forEach");
vm.runInContext(client.slice(0,cutoff)+`globalThis.ui={state,emailsPage,rpc(fn){rpc=fn;}};}());`,browser);
const ui=browser.ui;ui.state.route='emails';let calls=[],error=null;
ui.rpc(async(name)=>{calls.push(name);if(name==='apiEmailSync'){if(error)throw Error(error);return {enabled:true,allGmail:true,lastStatus:'running',issues:[]};}
  return {emails:[{subject:'Project update',from:'sender@example.com',date:'2026-11-06',bodyPreview:'New report',indexed:false,source:{id:'mail',title:'gmail-abcdef12.eml',url:'https://drive.google.com/file/d/mail'}}],ready:1,total:1,pending:0};});
(async()=>{
  await ui.emailsPage();
  assert.deepEqual(calls,['apiEmailSync','apiEmails']);
  assert.ok(!nodes.content.innerHTML.includes('email-create'));assert.ok(!nodes.content.innerHTML.includes('emails-build'));
  assert.ok(nodes['email-table'].innerHTML.includes('Project update'));
  assert.ok(!nodes['email-table'].innerHTML.includes('data-email-history'));
  assert.ok(nodes['email-table'].innerHTML.includes('Queued for automatic indexing'));
  assert.ok(nodes['email-progress'].textContent.includes('Syncing Gmail'));
  assert.equal(timers.at(-1).ms,5000);
  nodes['email-filter'].value='no-match';await timers.at(-1).fn();
  assert.equal(nodes['email-filter'].value,'no-match','background updates retain the filter');
  assert.ok(nodes['email-table'].innerHTML.includes('No matching passages'));
  error='GMAIL_AUTH_REQUIRED';await timers.at(-1).fn();
  assert.ok(nodes['email-progress'].textContent.includes('authorize read-only Gmail'));
  assert.equal(timers.at(-1).ms,60000,'failed connections retry without a rapid loop');
  const count=calls.length;ui.state.epoch++;await timers.at(-1).fn();assert.equal(calls.length,count,'leaving the page stops email polling');
  const en=browser.WB_TRANSLATIONS.en,de=browser.WB_TRANSLATIONS.de;
  for(const key of ['emailConnecting','emailAutoIndexing','emailSyncAutomatic','emailSyncWorking','emailSyncBusy','emailSyncPaused','emailAutoAttachments']){assert.ok(en[key]);assert.ok(de[key]);}
  console.log('automatic email connection passed: scheduler lifecycle, pagination, saved settings, automatic UI, errors and navigation');
})().catch(error=>{console.error(error);process.exitCode=1;});
