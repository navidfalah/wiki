const fs=require('fs'),vm=require('vm'),assert=require('assert'),crypto=require('crypto');
const cache={},requests=[],workspace={cache:{}},props={WB_API_KEY:'test-key'};let httpStatus=200,thumbnail=true;
const blob=(name='file')=>({getBytes:()=>[1,2,3],setName(n){this.name=n;return this},getContentType:()=> 'image/jpeg',name});
const ctx={JSON,Object,Array,String,Boolean,Date,Error,RegExp,Set,Math,
  wbProps_:()=>({getProperty:key=>props[key],setProperty:(key,value)=>{props[key]=value},deleteProperty:key=>{delete props[key]}}),wbHash_:s=>crypto.createHash('sha256').update(String(s)).digest('hex'),
  wbRead_:(_,key,fallback)=>key in cache?cache[key]:fallback,wbWrite_:(_,key,value)=>{cache[key]=JSON.parse(value)},
  Utilities:{base64Encode:bytes=>Buffer.from(bytes).toString('base64')},
  ScriptApp:{getOAuthToken:()=> 'google-token'},Drive:{Files:{get:()=>thumbnail?{thumbnailLink:'https://lh3.googleusercontent.com/preview'}:{}}},
  UrlFetchApp:{fetch:(url,opts)=>{requests.push({url,opts});if(url.includes('googleusercontent.com'))return {getResponseCode:()=>200,getBlob:()=>blob()};return {getResponseCode:()=>httpStatus,getContentText:()=>JSON.stringify(url.endsWith('/audio/transcriptions')?{text:'A spoken sentence'}:{choices:[{message:{content:'A visible diagram'}}]})}}}
};
vm.createContext(ctx);const code=fs.readFileSync('Code.gs','utf8');vm.runInContext(code.slice(code.indexOf('function wbApiKeys_()'),code.indexOf('function wbLock_(fn)')),ctx);vm.runInContext(fs.readFileSync('Media.gs','utf8'),ctx);
const settings={apiBase:'https://api.openai.com/v1',mediaVisionModel:'vision',mediaAudioModel:'gpt-transcribe'},job={keyFingerprint:ctx.wbHash_('test-key'),calls:0,cacheHits:0};
function file(name,mime){return {getName:()=>name,getMimeType:()=>mime,getId:()=>name,getBlob:()=>blob(name)}}
function source(name,mime){return {id:name,title:name,mime,modified:'2026-01-01T00:00:00.000Z'}}
let image=file('image.png','image/png'),imageSource=source('image.png','image/png');
let result=ctx.wbReadMedia_(image,imageSource,workspace,settings,job);assert.match(result.text,/visible diagram/);assert.equal(job.calls,1);
let request=requests[0];assert.equal(request.url,settings.apiBase+'/chat/completions');let payload=JSON.parse(request.opts.payload);assert.equal(payload.model,'vision');assert.equal(payload.messages[1].content[1].image_url.url,'data:image/png;base64,AQID');
ctx.wbReadMedia_(image,imageSource,workspace,settings,job);assert.equal(requests.length,1);assert.equal(job.cacheHits,1);
let audio=file('audio.mp3','audio/mpeg');result=ctx.wbReadMedia_(audio,source('audio.mp3','audio/mpeg'),workspace,settings,job);assert.match(result.text,/spoken sentence/);request=requests[1];assert.equal(request.url,settings.apiBase+'/audio/transcriptions');assert.equal(request.opts.payload.model,'gpt-transcribe');assert.equal(request.opts.payload.file.name,'audio.mp3');
let video=file('clip.mp4','video/mp4');result=ctx.wbReadMedia_(video,source('clip.mp4','video/mp4'),workspace,settings,job);assert.match(result.text,/Single video preview frame/);assert.match(result.text,/spoken sentence/);assert.ok(result.warnings.includes('MEDIA_VIDEO_PARTIAL'));assert.equal(requests[2].opts.headers.Authorization,'Bearer google-token');
thumbnail=false;result=ctx.wbReadMedia_(file('silent.mov','video/quicktime'),source('silent.mov','video/quicktime'),workspace,settings,job);assert.ok(result.warnings.includes('MEDIA_VIDEO_NO_PREVIEW'));assert.ok(result.warnings.includes('MEDIA_VIDEO_NO_AUDIO'));
result=ctx.wbReadMedia_(file('image.bmp','image/bmp'),source('image.bmp','image/bmp'),workspace,settings,job);assert.ok(result.warnings.includes('MEDIA_UNSUPPORTED'));
httpStatus=400;assert.throws(()=>ctx.wbReadMedia_(file('bad.mp3','audio/mpeg'),source('bad.mp3','audio/mpeg'),workspace,settings,job),/MEDIA_INPUT_REJECTED/);
result=ctx.wbReadMedia_(file('no-audio.mp4','video/mp4'),source('no-audio.mp4','video/mp4'),workspace,settings,job);assert.ok(result.warnings.includes('MEDIA_VIDEO_NO_AUDIO'));
httpStatus=403;assert.throws(()=>ctx.wbReadMedia_(file('private.png','image/png'),source('private.png','image/png'),workspace,settings,job),/API_AUTH_FAILED/);
httpStatus=429;assert.throws(()=>ctx.wbReadMedia_(file('limited.png','image/png'),source('limited.png','image/png'),workspace,settings,job),/API_RATE_LIMIT/);
props.WB_API_KEY='other-key';assert.throws(()=>ctx.wbReadMedia_(image,imageSource,workspace,settings,job),/API_SETTINGS_CHANGED/);
assert.ok(!JSON.stringify(cache).includes('test-key'));console.log('media tests passed: image and audio requests, video limits, caching, rejected input and key changes');

const integration={console};vm.createContext(integration);vm.runInContext(fs.readFileSync('Code.gs','utf8'),integration);
let reads=0;const input=file('image.png','image/png');input.getSize=()=>3;integration.DriveApp={getFileById:()=>input};integration.wbReadMedia_=()=>{reads++;return {text:'Recognized image',warnings:['MEDIA_DERIVED']}};
const ref={id:'image.png'};
assert.equal(integration.wbReadSource_(ref,{}, {aiMedia:false},{}).text,'Attachment: image.png');assert.equal(reads,0);
assert.equal(integration.wbReadSource_(ref,{}, {aiMedia:true}).text,'Attachment: image.png');assert.equal(reads,0,'source preview must not make an API call');
assert.equal(integration.wbReadSource_(ref,{}, {aiMedia:true},{}).text,'Recognized image');assert.equal(reads,1,'build must process enabled media');
input.getSize=()=>11*1024*1024;assert.throws(()=>integration.wbReadSource_(ref,{}, {aiMedia:true},{}),/SOURCE_SIZE_LIMIT/);assert.equal(reads,1);
console.log('media build integration passed: opt-in, previews, build processing and file-size limit');
