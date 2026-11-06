const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
let now = Date.parse('2026-11-06T10:00:00Z');
class Clock extends Date { constructor(...args){super(...(args.length ? args : [now]));} static now(){return now;} }
const server = {Date:Clock, DriveApp:{getFolderById:id=>id}};
vm.createContext(server);
vm.runInContext(fs.readFileSync('Code.gs','utf8'),server);
let saved;
server.wbWrite_=(_,name,value)=>{saved=JSON.parse(value);};
const job={id:'build',folderId:'folder',phase:'reading',status:'running',cursor:0,total:2,sources:[],pages:[],settings:{},startedAt:new Clock().toISOString()};
server.wbSaveJob_(job);
now+=10000;job.cursor=1;server.wbSaveJob_(job);
assert.equal(job.steps.reading.startedAt,job.startedAt);
assert.equal(saved.steps.reading.cursor,1);
now+=10000;job.phase='extracting';job.cursor=0;job.total=4;server.wbSaveJob_(job);
assert.equal(Date.parse(job.steps.reading.finishedAt)-Date.parse(job.steps.reading.startedAt),20000);
assert.equal(job.steps.extracting.startedAt,job.steps.reading.finishedAt);
assert.equal(server.wbJobSummary_(job).steps.extracting.total,4);

const client = fs.readFileSync('Client.html','utf8');
const browser={Date:Clock,Intl,navigator:{language:'en'},localStorage:{getItem(){}},document:{documentElement:{dataset:{}}}};
vm.createContext(browser);
vm.runInContext(fs.readFileSync('Translations.html','utf8').replace(/^<script>\s*/,'').replace(/\s*<\/script>\s*$/,''),browser);
const cutoff=client.lastIndexOf("document.querySelectorAll('[data-language]').forEach");
vm.runInContext(client.slice('<script>'.length,cutoff)+'globalThis.ui={state,pipelineTiming,startBuild,setRpc(fn){rpc=fn;},setRender(fn){render=fn;},setWorker(fn){advanceBuild=fn;},setBanner(fn){buildBanner=fn;}}; }());',browser);
const ui=browser.ui;
now+=10000;job.cursor=2;server.wbSaveJob_(job);
assert.match(ui.pipelineTiming(job,'extracting'),/Elapsed: 0m 10s.*About 0m 10s remaining/);
assert.match(ui.pipelineTiming(job,'reading'),/Time taken: 0m 20s/);
assert.match(ui.pipelineTiming(job,'writing'),/when this step starts/);
for(const status of ['success','error','stopped']){
  job.status=status;job.finishedAt=new Clock().toISOString();server.wbSaveJob_(job);
  const frozen=ui.pipelineTiming(job,'extracting');now+=5000;
  assert.equal(ui.pipelineTiming(job,'extracting'),frozen,`${status} timer freezes`);
}
assert.match(ui.pipelineTiming({phase:'reading',status:'success'},'reading'),/older build/);
ui.state.language='de';assert.match(ui.pipelineTiming(job,'reading'),/Benötigte Zeit/);

// Each worker response exposes a transition before processing the next phase.
job.status='running';job.phase='reading';job.steps={};delete job.timingPhase;
server.wbLock_=fn=>fn();server.wbWorkspace_=()=>({});server.wbJob_=()=>job;
server.wbProps_=()=>({getProperty:()=>null});server.wbSchedule_=()=>{};
let units=0;server.wbCompileUnit_=j=>{units++;j.phase='extracting';};
assert.equal(server.wbAdvanceBuild_().phase,'extracting');assert.equal(units,1);

(async()=>{
  browser.location={hash:'#sources'};ui.state.boot={job:null};let renders=0,workers=0;
  ui.setRpc(async(name)=>{assert.equal(name,'apiStartBuild');return job;});
  ui.setBanner(()=>{});ui.setRender(async()=>{renders++;});ui.setWorker(()=>{workers++;});
  await ui.startBuild(false);
  assert.equal(browser.location.hash,'#pipeline');assert.equal(ui.state.route,'pipeline');
  assert.equal(renders,1);assert.equal(workers,1);
  console.log('Build progress passed: checkpoint timing, estimates, terminal timers, translations, phase transitions and build navigation');
})().catch(error=>{console.error(error);process.exitCode=1;});
