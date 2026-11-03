'use strict';
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require('../../frontend/node_modules/@playwright/test');
const {harness}=require('../test/harness.cjs');
const root=path.resolve(__dirname,'../src');
const h=harness();
let html=fs.readFileSync(path.join(root,'Index.html'),'utf8').replace(/<\?!= include_\('([^']+)'\); \?>/g,(_,name)=>fs.readFileSync(path.join(root,name+'.html'),'utf8'));
const bridge=`<script>function runner(ok,bad){return new Proxy({},{get:function(_,key){if(key==='withSuccessHandler')return function(fn){return runner(fn,bad);};if(key==='withFailureHandler')return function(fn){return runner(ok,fn);};return function(){window.__wbRpc(key,Array.from(arguments)).then(ok,bad);};}});}var google={script:{run:runner(function(){},function(){})}};</script>`;
html=html.replace('</head>',bridge+'</head>');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.exposeFunction('__wbRpc',(name,args)=>JSON.parse(JSON.stringify(h.ctx[name](...args))));
  await page.route('http://preview.local/**',route=>route.fulfill({contentType:'text/html',body:html}));
  await page.goto('http://preview.local/');
  await page.evaluate(()=>{localStorage.setItem('wb-language','en');});await page.reload();
  await page.locator('#setup-create').click();await page.locator('#overview-build').waitFor();
  await page.locator('#navigation a[href="#sources"]').click();
  await page.locator('#upload-files').setInputFiles({name:'Battery.txt',mimeType:'text/plain',buffer:Buffer.from('Frequent transmissions drain the battery.\n\n<img src=x onerror="window.xss=1">')});
  await page.locator('#upload-button').click();await page.getByRole('link',{name:'Battery.txt',exact:true}).waitFor();
  await page.locator('#source-build').click();
  await page.waitForFunction(()=>document.getElementById('build-banner').hidden);
  await page.locator('#navigation a[href="#pages"]').click();await page.locator('[data-page="battery"]').click();
  await page.locator('.prose').waitFor();assert((await page.locator('.prose').innerText()).includes('Frequent transmissions'));
  assert.equal(await page.locator('.prose img').count(),0);assert.equal(await page.evaluate(()=>window.xss),undefined);
  await page.locator('#navigation a[href="#search"]').click();await page.locator('#search-query').fill('battery');await page.locator('#search-form button').click();await page.locator('.result .quote').waitFor();
  await page.locator('#navigation a[href="#chat"]').click();await page.locator('#chat-question').fill('battery transmissions');await page.locator('#ask-button').click();await page.locator('.message-content').last().getByText('Frequent transmissions',{exact:false}).waitFor();
  assert.equal(h.calls.length,0);
  await page.locator('#navigation a[href="#settings"]').click();await page.locator('#api-key').fill('private-ui-test-key');await page.locator('#save-settings').click();await page.getByText('A key is saved. Leave blank to keep it.').waitFor();assert.equal(await page.locator('#api-key').inputValue(),'');assert(!(await page.content()).includes('private-ui-test-key'));
  await page.getByRole('button',{name:'DE',exact:true}).click();await page.getByRole('heading',{name:'Bestimmen Sie, wo KI hilft.'}).waitFor();
  assert.deepEqual(errors,[]);assert.equal(h.api('apiPages').pages.length,1);assert.equal(h.calls.length,0);
  console.log('Browser smoke passed: setup → upload → compile → safe wiki → source search → extractive chat → private settings → German UI.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
