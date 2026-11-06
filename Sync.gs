/* Scheduled, one-way synchronization of Drive and Gmail sources. */
function wbSyncState_(ws) {
  return Object.assign({enabled:false,allDrive:false,allGmail:false,gmailQuery:'',driveCursor:0,discoveryToken:'',gmailToken:'',discoveryDone:true,gmailDone:false,phase:'drive',dirty:false,issues:[],lastRun:null,lastStatus:'idle',buildId:null}, wbRead_(ws.root,'sync.json',{}));
}
function wbSyncSave_(ws, state) { wbWrite_(ws.root,'sync.json',JSON.stringify(state)); }
function wbSyncMarkDirty_(ws) { var state=wbSyncState_(ws);if(state.enabled){state.dirty=true;wbSyncSave_(ws,state);} }
function wbSyncTriggers_() { return ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==='runSourceSync';}); }
function wbSyncContinuations_() { return ScriptApp.getProjectTriggers().filter(function(t){return t.getHandlerFunction()==='continueSourceSync';}); }
function wbSyncPublic_(ws) {
  var state=wbSyncState_(ws), ledger=wbRead_(ws.root,'drive-imports.json',{});
  state.trackedDrive=Object.keys(ledger).length; state.installed=wbSyncTriggers_().length>0;
  state.issues=state.issues.map(function(issue){return Object.assign({},issue,{tracked:Object.prototype.hasOwnProperty.call(ledger,issue.id)});});
  return state;
}
function apiSyncStatus() { return wbReply_(function(){return wbSyncPublic_(wbWorkspace_());}); }
function apiSyncForgetDrive(id) { return wbReply_(function(){return wbLock_(function(){
  var ws=wbWorkspace_(),ledger=wbRead_(ws.root,'drive-imports.json',{}),state=wbSyncState_(ws),record=ledger[String(id||'')];
  if(!record)throw new Error('SYNC_SOURCE_MISSING');if(record.pending)throw new Error('SYNC_PENDING');
  var excluded=wbRead_(ws.root,'sync-exclusions.json',{});excluded[id]=true;wbWrite_(ws.root,'sync-exclusions.json',JSON.stringify(excluded));
  delete ledger[id];wbWrite_(ws.root,'drive-imports.json',JSON.stringify(ledger));wbSyncIssue_(state,id,null);state.driveCursor=0;state.phase='drive';state.gmailToken='';state.discoveryToken='';wbSyncSave_(ws,state);return wbSyncPublic_(ws);
});}); }
function apiSaveSync(input) { return wbReply_(function(){return wbLock_(function(){
  input=input||{}; if(typeof input.enabled!=='boolean'||typeof input.gmailQuery!=='string'||input.gmailQuery.length>1000||typeof input.allDrive!=='boolean'||typeof input.allGmail!=='boolean')throw new Error('SYNC_CONFIG_INVALID');
  var ws=wbWorkspace_(),state=wbSyncState_(ws),old=wbSyncTriggers_().concat(wbSyncContinuations_()),created=null,query=input.gmailQuery.trim();
  if(state.gmailQuery!==query||state.allDrive!==input.allDrive||state.allGmail!==input.allGmail){state.gmailToken='';state.discoveryToken='';state.phase='drive';state.driveCursor=0;}
  if(input.enabled&&!state.enabled&&wbListSources_(ws.inbox).length)state.dirty=true;
  state.enabled=input.enabled;state.gmailQuery=query;state.allDrive=input.allDrive;state.allGmail=input.allGmail;
  try { if(state.enabled)created=ScriptApp.newTrigger('runSourceSync').timeBased().everyMinutes(5).create(); wbSyncSave_(ws,state); }
  catch(error){if(created)ScriptApp.deleteTrigger(created);throw error;}
  old.forEach(function(t){ScriptApp.deleteTrigger(t);});return wbSyncPublic_(ws);
});}); }
function wbSyncIssue_(state,id,code) {
  state.issues=state.issues.filter(function(row){return row.id!==id;});
  if(code)state.issues.push({id:id,code:code});
  state.issues=state.issues.slice(-100);
}
function wbSyncHasParent_(file,id) { var parents=file.getParents();while(parents.hasNext())if(parents.next().getId()===id)return true;return false; }
function wbSyncDrive_(ws,ledger,id,state) {
  var record=ledger[id],sources=wbListSources_(ws.inbox),old=sources.filter(function(s){return s.id===record.copyId;})[0],pending=record.pending;
  if(!pending){
    if(!old){wbSyncIssue_(state,id,'SYNC_COPY_MISSING');return;}
    var original;
    try { original=DriveApp.getFileById(id); if(original.isTrashed())throw new Error('missing'); }
    catch(_){wbSyncIssue_(state,id,'SYNC_SOURCE_MISSING');return;}
    var originalParents=original.getParents();while(originalParents.hasNext()){if(wbFolderRelated_(originalParents.next(),ws.root)){wbSyncIssue_(state,id,'SYNC_SOURCE_WORKSPACE');return;}}
    var modified=original.getLastUpdated().toISOString(),name=original.getName();
    if(record.modified===modified && record.name===name){wbSyncIssue_(state,id,null);return;}
    if(old.modified!==record.copyModified || old.title!==record.name){wbSyncIssue_(state,id,'SYNC_COPY_CHANGED');return;}
    var oldFile=DriveApp.getFileById(old.id),parents=oldFile.getParents();if(!parents.hasNext())throw new Error('SYNC_COPY_MISSING');
    var parent=parents.next(),archive=wbFolder_(ws.root,'sync-revisions'),copy=original.makeCopy(name,archive);
    record.pending={newId:copy.getId(),oldId:old.id,parentId:parent.getId(),modified:modified,name:name};
    state.dirty=true;wbSyncSave_(ws,state);wbWrite_(ws.root,'drive-imports.json',JSON.stringify(ledger));pending=record.pending;
  }
  var folders=wbInboxFolders_(ws.inbox);if(!folders.some(function(f){return f.id===pending.parentId;}))throw new Error('SYNC_COPY_MISSING');
  var archiveFolder=wbFolder_(ws.root,'sync-revisions'),oldCopy=DriveApp.getFileById(pending.oldId),newCopy=DriveApp.getFileById(pending.newId),destination=DriveApp.getFolderById(pending.parentId);
  if(wbSyncHasParent_(oldCopy,pending.parentId)){
    if(oldCopy.getLastUpdated().toISOString()!==record.copyModified||oldCopy.getName()!==record.name)throw new Error('SYNC_COPY_CHANGED');
    oldCopy.moveTo(archiveFolder);
  } else if(!wbSyncHasParent_(oldCopy,archiveFolder.getId()))throw new Error('SYNC_COPY_MISSING');
  if(!wbSyncHasParent_(newCopy,pending.parentId))newCopy.moveTo(destination);
  record.copyId=newCopy.getId();record.copyModified=newCopy.getLastUpdated().toISOString();record.modified=pending.modified;record.name=pending.name;delete record.pending;
  wbWrite_(ws.root,'drive-imports.json',JSON.stringify(ledger));wbSyncIssue_(state,id,null);
}
function wbSyncReadableDrive_(file) {
  var mime=String(file.mimeType||''),name=String(file.name||''),ext=name.split('.').pop().toLowerCase();
  if(/^application\/vnd\.google-apps\./.test(mime))return /^application\/vnd\.google-apps\.(document|spreadsheet|presentation)$/.test(mime);
  return /^(text|image|audio|video)\//.test(mime)||/^(docx|docm|dotx|dotm|xlsx|xlsm|xltx|xltm|pptx|pptm|ppsx|ppsm|potx|potm|odt|ods|odp|doc|dot|xls|xlt|xlsb|ppt|pps|pot|rtf|pdf|gdoc|gsheet|gslides|sqlite|sqlite3|db|eml|zip|txt|md|csv|tsv|json|xml|html|htm|yaml|yml|log|png|jpe?g|gif|webp|bmp|mp3|mpga|mpeg|wav|m4a|ogg|flac|mp4|webm|mov|avi|mkv)$/.test(ext);
}
function wbSyncOutsideWorkspace_(file,ws) {
  var parents=file.getParents(),backupId=wbProps_().getProperty('WB_BACKUPS'),backup=backupId?DriveApp.getFolderById(backupId):null,hasParent=false;
  while(parents.hasNext()){hasParent=true;var parent=parents.next();if(wbFolderRelated_(parent,ws.root)||backup&&wbFolderRelated_(parent,backup))return false;}
  if(!hasParent)throw new Error('SYNC_DRIVE_FAILED');return true;
}
function wbSyncDiscoverDrive_(ws,state) {
  var options={q:"trashed = false and mimeType != 'application/vnd.google-apps.folder' and mimeType != 'application/vnd.google-apps.shortcut'",corpora:'allDrives',pageSize:10,fields:'nextPageToken,incompleteSearch,files(id,name,mimeType,size)',orderBy:'createdTime',supportsAllDrives:true,includeItemsFromAllDrives:true};
  if(state.discoveryToken)options.pageToken=state.discoveryToken;
  var page;try{page=Drive.Files.list(options);}catch(_){throw new Error('DRIVE_SEARCH_FAILED');}
  if(page.incompleteSearch)throw new Error('SYNC_DRIVE_INCOMPLETE');
  var ledger=wbRead_(ws.root,'drive-imports.json',{}),excluded=wbRead_(ws.root,'sync-exclusions.json',{}),sources=wbListSources_(ws.inbox),limit=false;
  (page.files||[]).forEach(function(item){
    var id=String(item.id||'');if(!id||ledger[id]||excluded[id])return;
    try {
      var file=DriveApp.getFileById(id);if(!wbSyncOutsideWorkspace_(file,ws))return;
      if(!wbSyncReadableDrive_(item)){wbSyncIssue_(state,id,'SYNC_FORMAT_SKIPPED');return;}
      if(Number(item.size)>WB_LIMITS.uploadBytes){wbSyncIssue_(state,id,'SOURCE_SIZE_LIMIT');return;}
      if(sources.length>=WB_LIMITS.files){limit=true;return;}
      state.dirty=true;wbSyncSave_(ws,state);
      var copy=wbImportDriveFile_(ws,id);ledger[id]=true;sources.push({id:copy.id});wbSyncIssue_(state,id,null);
    }catch(error){var known=['SOURCE_COUNT_LIMIT','SYNC_DRIVE_FAILED'];wbSyncIssue_(state,id,known.includes(error.message)?error.message:'SYNC_DRIVE_FAILED');}
  });
  if(limit){wbSyncIssue_(state,'__drive_limit__','SOURCE_COUNT_LIMIT');state.discoveryToken='';return true;}
  wbSyncIssue_(state,'__drive_limit__',null);state.discoveryToken=page.nextPageToken||'';return !state.discoveryToken;
}
function wbSyncEmailAttachments_(ws,state,messageId,sourceId) {
  var source=wbEmailSource_(ws,sourceId),revision=wbSourceRevision_(source),ledger=wbRead_(ws.root,'sync-gmail-attachments.json',{}),entry=ledger[messageId];
  if(entry&&entry.revision===revision&&entry.done)return {done:true};
  if(!entry||entry.revision!==revision)entry={revision:revision,cursor:0};
  var parts=wbParseEmail_(DriveApp.getFileById(sourceId).getBlob().getBytes()).attachments;
  if(entry.cursor>=parts.length){entry.done=true;ledger[messageId]=entry;wbWrite_(ws.root,'sync-gmail-attachments.json',JSON.stringify(ledger));return {done:true};}
  var end=Math.min(entry.cursor+10,parts.length),batch=parts.slice(entry.cursor,end),selected=[];
  batch.forEach(function(part){if(wbSyncReadableDrive_({name:part.name,mimeType:part.mime}))selected.push(part.id);else wbSyncIssue_(state,messageId+':'+part.id,'SYNC_FORMAT_SKIPPED');});
  if(selected.length){
    if(wbListSources_(ws.inbox).length<WB_LIMITS.files){state.dirty=true;wbSyncSave_(ws,state);}
    var results=wbImportEmailAttachments_(ws,{id:sourceId,revision:revision,parts:selected}),failed=results.filter(function(result){return !result.imported;})[0];
    if(failed){wbSyncIssue_(state,messageId+':attachments',failed.error==='SOURCE_COUNT_LIMIT'?'SOURCE_COUNT_LIMIT':'SYNC_ATTACHMENT_FAILED');return {done:false,limit:failed.error==='SOURCE_COUNT_LIMIT'};}
  }
  wbSyncIssue_(state,messageId+':attachments',null);entry.cursor=end;entry.done=end>=parts.length;ledger[messageId]=entry;wbWrite_(ws.root,'sync-gmail-attachments.json',JSON.stringify(ledger));return {done:entry.done};
}
function wbSyncGmail_(ws,state) {
  var result=wbGmail_('messages?maxResults=10'+(state.allGmail?'&includeSpamTrash=true':'&q='+encodeURIComponent(state.gmailQuery))+(state.gmailToken?'&pageToken='+encodeURIComponent(state.gmailToken):''));
  var seen=wbRead_(ws.root,'sync-gmail.json',{}),sources=wbListSources_(ws.inbox);
  var limit=false,waiting=false;(result.messages||[]).forEach(function(message){
    var id=String(message.id||'');if(!/^[a-f0-9]{8,64}$/i.test(id))throw new Error('GMAIL_REQUEST_FAILED');
    var name='gmail-'+id+'.eml',existing=sources.filter(function(s){return s.title===name;})[0];
    try {
      if(!seen[id]&&!existing){
        if(sources.length>=WB_LIMITS.files){limit=true;return;}
        var raw=wbGmail_('messages/'+id+'?format=raw');if(typeof raw.raw!=='string'||raw.raw.length>Math.ceil(WB_LIMITS.uploadBytes*4/3)+8)throw new Error('UPLOAD_LIMIT');
        var bytes=Utilities.base64DecodeWebSafe(raw.raw);if(bytes.length>WB_LIMITS.uploadBytes)throw new Error('UPLOAD_LIMIT');
        state.dirty=true;wbSyncSave_(ws,state);
        var file=ws.inbox.createFile(Utilities.newBlob(bytes,'message/rfc822',name));existing={id:file.getId(),title:name};sources.push(existing);
      }
      if(!seen[id]){seen[id]=true;wbWrite_(ws.root,'sync-gmail.json',JSON.stringify(seen));}
      wbSyncIssue_(state,id,null);
      if(state.allGmail&&existing){try{var attachments=wbSyncEmailAttachments_(ws,state,id,existing.id);if(!attachments.done)waiting=true;if(attachments.limit)limit=true;sources=wbListSources_(ws.inbox);}catch(_){wbSyncIssue_(state,id+':attachments','SYNC_ATTACHMENT_FAILED');}}
    } catch(error){var known=['GMAIL_AUTH_REQUIRED','GMAIL_REQUEST_FAILED','API_RATE_LIMIT','UPLOAD_LIMIT','SOURCE_COUNT_LIMIT'];wbSyncIssue_(state,id,known.includes(error.message)?error.message:'GMAIL_REQUEST_FAILED');}
  });
  if(limit){wbSyncIssue_(state,'__gmail_limit__','SOURCE_COUNT_LIMIT');state.gmailToken='';return true;}
  if(waiting)return false;
  wbSyncIssue_(state,'__gmail_limit__',null);state.gmailToken=result.nextPageToken||'';return !state.gmailToken;
}
function wbSyncStep_() { return wbLock_(function(){
  var ws=wbWorkspace_(),state=wbSyncState_(ws);if(!state.enabled)return state;
  var job=wbJob_(ws),importing=wbRead_(ws.root,'folder-import.json',null);
  if(job&&job.status==='running'||importing&&importing.status==='running'){state.lastStatus='busy';wbSyncSave_(ws,state);return state;}
  state.lastRun=new Date().toISOString();state.lastStatus='running';state.lastError=null;state.batchReady=false;
  try {
    if(state.phase==='drive'){
      var ledger=wbRead_(ws.root,'drive-imports.json',{}),ids=Object.keys(ledger).sort(),start=Date.now(),processed=0;
      while(state.driveCursor<ids.length && processed++<10 && Date.now()-start<20000){
        var id=ids[state.driveCursor];
        try{wbSyncDrive_(ws,ledger,id,state);}catch(error){var known=['SYNC_COPY_CHANGED','SYNC_COPY_MISSING','SYNC_SOURCE_MISSING'];wbSyncIssue_(state,id,known.includes(error.message)?error.message:'SYNC_DRIVE_FAILED');}
        state.driveCursor++;wbSyncSave_(ws,state);
      }
      if(state.driveCursor>=ids.length){state.driveCursor=0;state.discoveryDone=!state.allDrive;state.gmailDone=!(state.allGmail||state.gmailQuery);state.phase=!state.discoveryDone?'discover':!state.gmailDone?'gmail':'complete';}
    } else if(state.phase==='discover'){
      state.discoveryDone=wbSyncDiscoverDrive_(ws,state);state.phase=!state.gmailDone?'gmail':!state.discoveryDone?'discover':'complete';
      state.batchReady=true;
    } else if(state.phase==='gmail'){
      state.gmailDone=wbSyncGmail_(ws,state);state.phase=!state.discoveryDone?'discover':!state.gmailDone?'gmail':'complete';
      state.batchReady=true;
    }
    if(state.phase==='complete'){state.phase='drive';state.lastStatus=state.issues.length?'issues':'success';}
    wbSyncSave_(ws,state);return state;
  }catch(error){if(state.phase==='gmail')state.gmailToken='';if(state.phase==='discover')state.discoveryToken='';state.lastStatus='error';state.lastError=/^[A-Z][A-Z0-9_]+$/.test(String(error.message))?error.message:'SYNC_FAILED';wbSyncSave_(ws,state);return state;}
}); }
function wbSyncRun_() {
  var state=wbSyncStep_();
  if(state.enabled && state.dirty && (state.lastStatus==='success'||state.lastStatus==='issues'||state.batchReady && state.lastStatus==='running')){
    var tracked=wbRead_(wbWorkspace_().root,'drive-imports.json',{});
    if(Object.keys(tracked).some(function(id){return Boolean(tracked[id].pending);}))return wbSyncPublic_(wbWorkspace_());
    var reply=apiStartBuild(false,true);
    if(reply.ok){wbLock_(function(){var ws=wbWorkspace_(),current=wbSyncState_(ws);current.dirty=false;current.batchReady=false;current.buildId=reply.data.id;current.lastError=null;wbSyncSave_(ws,current);});}
    else wbLock_(function(){var ws=wbWorkspace_(),current=wbSyncState_(ws);current.lastStatus='error';current.lastError=reply.error;wbSyncSave_(ws,current);});
  }
  return wbSyncPublic_(wbWorkspace_());
}
function apiRunSync() { return wbReply_(wbSyncRun_); }
function runSourceSync() { try {
  var state=wbSyncRun_(),job=wbJob_(wbWorkspace_());
  if(state.enabled&&state.lastStatus==='running'&&(!job||job.status!=='running')&&!wbSyncContinuations_().length)ScriptApp.newTrigger('continueSourceSync').timeBased().after(60000).create();
} catch(error) { console.error('Source sync failed: '+String(error.message)); } }
function continueSourceSync() { wbSyncContinuations_().forEach(function(t){ScriptApp.deleteTrigger(t);});runSourceSync(); }
