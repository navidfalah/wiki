'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { harness, zip, Blob } = require('./harness.cjs');
const word = {
 'word/document.xml':'<w:document xmlns:w="w"><w:body><w:p><w:r><w:t>Battery report</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Capacity 220 mAh</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>',
 'word/header1.xml':'<w:hdr xmlns:w="w"><w:p><w:r><w:t>Research notes</w:t></w:r></w:p></w:hdr>'
};
const sheet = {
 'xl/workbook.xml':'<workbook xmlns:r="r"><sheets><sheet name="Budget" r:id="rId1"/><sheet name="Notes" r:id="rId2"/></sheets></workbook>',
 'xl/_rels/workbook.xml.rels':'<Relationships><Relationship Id="rId1" Target="worksheets/sheet2.xml"/><Relationship Id="rId2" Target="worksheets/sheet1.xml"/></Relationships>',
 'xl/sharedStrings.xml':'<sst><si><t>Battery</t></si><si><r><t>Research </t></r><r><t>notes</t></r></si></sst>',
 'xl/worksheets/sheet2.xml':'<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1"><v>220</v></c><c r="D1"><f>100+120</f><v>220</v></c></row><row r="2"><c r="A2" t="b"><v>0</v></c><c r="B2"><v>0</v></c><c r="C2"><f>A1</f></c></row></sheetData></worksheet>',
 'xl/worksheets/sheet1.xml':'<worksheet><sheetData><row><c r="A1" t="s"><v>1</v></c><c r="B1" t="inlineStr"><is><t>A,B</t></is></c></row></sheetData></worksheet>'
};
const slides = {
 'ppt/presentation.xml':'<p:presentation xmlns:p="p" xmlns:r="r"><p:sldIdLst><p:sldId id="100" r:id="rId2"/><p:sldId id="101" r:id="rId1"/></p:sldIdLst></p:presentation>',
 'ppt/_rels/presentation.xml.rels':'<Relationships><Relationship Id="rId1" Target="slides/slide1.xml"/><Relationship Id="rId2" Target="slides/slide2.xml"/></Relationships>',
 'ppt/slides/slide1.xml':'<p:sld xmlns:p="p" xmlns:a="a"><a:p><a:r><a:t>Second in display order</a:t></a:r></a:p></p:sld>',
 'ppt/slides/slide2.xml':'<p:sld xmlns:p="p" xmlns:a="a"><a:p><a:r><a:t>Battery overview</a:t></a:r></a:p></p:sld>',
 'ppt/slides/_rels/slide2.xml.rels':'<Relationships><Relationship Id="notes" Target="../notesSlides/notesSlide2.xml"/></Relationships>',
 'ppt/notesSlides/notesSlide2.xml':'<p:notes xmlns:p="p" xmlns:a="a"><a:p><a:r><a:t>Speaker note on energy.</a:t></a:r></a:p></p:notes>'
};

test('real zipped DOCX/XLSX/PPTX read paragraphs, cells, notes and relationship ordering', () => {
 const h=harness(), ws=h.setup();
 const doc=h.add(ws,'report.docx',zip(word),'application/octet-stream');
 const excel=h.add(ws,'budget.xlsx',zip(sheet),'application/octet-stream');
 const deck=h.add(ws,'deck.pptx',zip(slides),'application/octet-stream');
 const read=file=>h.ctx.wbReadSource_({id:file.id},ws,h.ctx.wbDefaults_()).text;
 assert.match(read(doc),/Battery report/);assert.match(read(doc),/Capacity 220 mAh/);assert.match(read(doc),/Research notes/);
 const cells=read(excel);assert(cells.indexOf('Sheet: Budget')<cells.indexOf('Sheet: Notes'));assert.match(cells,/Battery,,220,220/);assert.match(cells,/FALSE,0,\[Formula without cached value: A1\]/);assert.match(cells,/Research notes,"A,B"/);
 const text=read(deck);assert(text.indexOf('Battery overview')<text.indexOf('Second in display order'));assert.match(text,/Speaker note on energy/);
 assert.equal(h.calls.length,0);
});
test('macro-enabled Office containers are read as data and never execute embedded macros', () => {
 const h=harness(),ws=h.setup();const file=h.add(ws,'report.docm',zip({...word,'word/vbaProject.bin':'do not execute'}),'application/octet-stream');
 assert.match(h.ctx.wbReadSource_({id:file.id},ws,h.ctx.wbDefaults_()).text,/Battery report/);assert.equal(h.calls.length,0);
});
test('all native Google file types use native readers without AI', () => {
 const h=harness(),ws=h.setup();
 const doc=h.native(ws,'Research','document','Google document battery text');
 const sheet=h.native(ws,'Budget','spreadsheet',[{name:'Costs',rows:[['Battery','220'],['Other','0']]}]);
 const deck=h.native(ws,'Talk','presentation',[{text:'Energy slide',notes:'Speaker notes'}]);
 for(const [file,expected] of [[doc,'Google document'],[sheet,'Costs'],[deck,'Speaker notes']])assert(h.ctx.wbReadSource_({id:file.id},ws,h.ctx.wbDefaults_()).text.includes(expected));
 assert.equal(h.calls.length,0);
});
test('legacy/PDF conversion trashes only the temporary copy and preserves the source', () => {
 const h=harness(),ws=h.setup(),file=h.add(ws,'old.doc','Converted legacy text','application/msword');
 const read=h.ctx.wbReadSource_({id:file.id},ws,h.ctx.wbDefaults_());assert.equal(read.text,'Converted legacy text');assert.equal(file.trash,false);assert.equal(h.conversionCount,1);
 assert([...h.files.values()].some(f=>f.name==='temporary-old.doc'&&f.trash));
 assert.throws(()=>h.ctx.wbReadSource_({id:file.id},ws,{convertLegacy:false}),/CONVERSION_DISABLED/);
});
test('unsafe and oversized ZIPs fail before extraction', () => {
 const h=harness();
 const malicious=zip({'../outside.xml':'bad'});assert.throws(()=>h.ctx.wbZipEntries_(new Blob(malicious)),/ARCHIVE_INVALID/);
 const bomb=zip({'word/document.xml':'tiny'});const central=bomb.indexOf(Buffer.from([0x50,0x4b,0x01,0x02]));bomb.writeUInt32LE(100*1024*1024,central+24);
 assert.throws(()=>h.ctx.wbZipEntries_(new Blob(bomb)),/ARCHIVE_LIMIT/);
});
test('local compiler publishes a complete version, searches originals and makes zero model calls', () => {
 const h=harness(),ws=h.setup();
 const file=h.add(ws,'Battery.txt','Frequent transmissions drain the battery.');
 h.add(ws,'Specifications.docx',zip(word),'application/octet-stream');
 h.add(ws,'Budget.xlsx',zip(sheet),'application/octet-stream');
 h.add(ws,'Slides.pptx',zip(slides),'application/octet-stream');
 h.native(ws,'Team notes','document','Battery capacity is 220 mAh.');
 const before=Buffer.from(file.blob.data);
 h.api('apiStartBuild',false);const job=h.finish();assert.equal(job.status,'success');assert.equal(job.calls,0);assert.equal(h.calls.length,0);
 assert.equal(h.api('apiPages').pages.length,5);assert.deepEqual(file.blob.data,before);
 const search=h.api('apiSearch',{query:'transmissions battery'});assert(search.hits.length);assert.equal(search.hits[0].id,file.id);
 const chat=h.api('apiAsk',{message:'transmissions battery'});assert.equal(chat.messages[1].mode,'extractive');assert(chat.messages[1].content.includes('Frequent transmissions drain the battery.'));assert.equal(h.calls.length,0);
 const exported=h.api('apiExport');assert.match(exported.name,/\.zip$/);assert.match(exported.url,/drive.google.com/);
});
test('failed files do not replace the last published version', () => {
 const h=harness(),ws=h.setup();h.add(ws,'one.txt','Battery facts.');h.api('apiStartBuild',false);assert.equal(h.finish().status,'success');const version=h.api('apiPages').version;
 h.add(ws,'unknown.binary','bad','application/octet-stream');h.api('apiStartBuild',false);const failed=h.finish();assert.equal(failed.status,'error');assert.equal(failed.failures[0].code,'FORMAT_UNSUPPORTED');assert.equal(h.api('apiPages').version,version);
});
test('checkpointed builds can resume and canceled builds keep the published version', () => {
 const h=harness(),ws=h.setup();for(let i=0;i<25;i++)h.add(ws,`source-${i}.txt`,`Battery report ${i}.`);
 h.api('apiStartBuild',false);const midway=h.api('apiContinueBuild');assert.equal(midway.status,'running');assert(midway.cursor>0);
 h.api('apiCancelBuild');assert.equal(h.api('apiBuildStatus').status,'stopped');assert.equal(h.api('apiPages').version,null);
 h.api('apiStartBuild',false);assert.equal(h.finish().status,'success');assert.equal(h.api('apiPages').pages.length,25);
});
test('source edits during a build prevent publication of a stale snapshot', () => {
 const h=harness(),ws=h.setup();const file=h.add(ws,'one.txt','Battery initial text.');h.api('apiStartBuild',false);
 const job=h.ctx.wbJob_(ws);h.ctx.wbCompileUnit_(job,ws);file.setContent('Changed source');h.ctx.wbSaveJob_(job);
 assert.equal(h.finish().status,'error');assert.equal(h.api('apiPages').version,null);
});
test('AI is explicit, uses a cached API and never returns the saved key', () => {
 const h=harness(),ws=h.setup();h.add(ws,'notes.txt','Battery capacity is 220 mAh.');
 h.api('apiSaveSettings',{aiCompile:true,aiChat:false,apiKey:'private-test-secret',apiBase:'https://example.com/v1',model:'test',convertLegacy:true});
 h.model=(_url,options)=>{const request=JSON.parse(options.payload);return {body:{choices:[{message:{content:request.messages[0].content.startsWith('Extract')?JSON.stringify({topics:['Battery'],entities:[{name:'Nova'}]}):'# Battery\n\nBattery capacity is 220 mAh.'}}]}};};
 h.api('apiStartBuild',false);assert.equal(h.finish().status,'success');assert.equal(h.calls.length,2);assert(h.api('apiPage','battery').generated);
 assert(!JSON.stringify(h.api('apiBootstrap')).includes('private-test-secret'));
 h.api('apiStartBuild',false);assert.equal(h.finish().status,'success');assert.equal(h.calls.length,2);
 h.api('apiAsk',{message:'battery'});assert.equal(h.calls.length,2);
});
test('Drive import creates a copy and never overwrites the original', () => {
 const h=harness(),ws=h.setup();const original=h.native(ws,'Original','document','Source text');const imported=h.api('apiImportDrive',original.getUrl());assert.notEqual(imported.id,original.id);assert.equal(original.native,'Source text');
});

test('Office templates and slideshow formats use the same data-only readers', () => {
 const h=harness(),ws=h.setup();
 for(const [name,entries,expected] of [['template.dotx',word,'Battery report'],['template.xltm',sheet,'Sheet: Budget'],['show.ppsx',slides,'Speaker note']]) {
   const file=h.add(ws,name,zip(entries),'application/octet-stream');assert(h.ctx.wbReadSource_({id:file.id},ws,h.ctx.wbDefaults_()).text.includes(expected));
 }
});
test('removing a source publishes a fresh index while preserving historical versions', () => {
 const h=harness(),ws=h.setup(),file=h.add(ws,'one.txt','Battery report');h.api('apiStartBuild',false);h.finish();const first=h.api('apiPages').version;
 file.setTrashed(true);h.api('apiStartBuild',false);assert.equal(h.finish().status,'success');assert.equal(h.api('apiPages').pages.length,0);assert.notEqual(h.api('apiPages').version,first);assert.equal(h.api('apiHistory').length,2);
});
test('invalid settings cannot erase the saved API key', () => {
 const h=harness();h.setup();h.api('apiSaveSettings',{apiKey:'keep-me',aiCompile:false});
 assert.throws(()=>h.api('apiSaveSettings',{clearApiKey:true,aiCompile:true}),/API_KEY_REQUIRED/);assert.equal(h.properties.get('WB_API_KEY'),'keep-me');
});
test('provider errors never expose provider response bodies or credentials to the browser', () => {
 const h=harness(),ws=h.setup();h.add(ws,'one.txt','Battery text');h.api('apiSaveSettings',{aiCompile:true,apiKey:'secret-key'});
 h.model=()=>({status:401,body:'secret-key provider debug information'});h.api('apiStartBuild',false);const job=h.finish();assert.equal(job.status,'error');assert.equal(job.failures[0].code,'API_AUTH_FAILED');assert(!JSON.stringify(job).includes('secret-key'));assert.equal(h.api('apiPages').version,null);
});

test('a renamed source invalidates filename-based local topics', () => {
 const h=harness(),ws=h.setup(),file=h.add(ws,'old.txt','Battery facts');h.api('apiStartBuild',false);h.finish();file.name='new.txt';h.api('apiStartBuild',false);h.finish();assert.equal(h.api('apiPages').pages[0].title,'new');
});
test('multipart email retains decoded headers and prefers the plain-text alternative', () => {
 const h=harness();const input='From: Mira <mira@example.com>\r\nSubject: =?UTF-8?B?QmF0dGVyeQ==?=\r\nContent-Type: multipart/alternative; boundary="b"\r\n\r\n--b\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\nBattery facts.\r\n--b\r\nContent-Type: text/html\r\n\r\n<p>Duplicate HTML.</p>\r\n--b--';
 const text=h.ctx.wbEmailText_(input);assert.match(text,/From: Mira/);assert.match(text,/Subject: Battery/);assert.match(text,/Battery facts/);assert(!text.includes('Duplicate HTML'));
});
test('a key changed between work batches cannot be sent to the previous provider', () => {
 const h=harness(),ws=h.setup();h.add(ws,'one.txt','Battery facts');h.api('apiSaveSettings',{aiCompile:true,apiKey:'first-key'});h.api('apiStartBuild',false);
 h.properties.set('WB_API_KEY','different-key');const result=h.finish();assert.equal(result.status,'error');assert.equal(result.failures[0].code,'API_SETTINGS_CHANGED');assert.equal(h.calls.length,0);
});

test('desktop Google references read the target and retain its version for publication checks', () => {
 const h=harness(),ws=h.setup(),native=h.native(ws,'Live document','document','Battery reference text');
 const link=h.add(ws,'reference.gdoc',JSON.stringify({doc_id:native.id}),'application/json');
 const source={id:link.id};const read=h.ctx.wbReadSource_(source,ws,h.ctx.wbDefaults_());assert.equal(read.text,'Battery reference text');assert.equal(source.referenceId,native.id);assert.equal(source.url,native.getUrl());
});
