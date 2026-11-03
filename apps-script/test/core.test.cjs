'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../src/Core.gs');

test('chunking respects the size limit and keeps multilingual content', () => {
  const text = 'Battery data\n\n' + 'مصرف انرژی '.repeat(500) + '\n\n' + 'x'.repeat(6000);
  const parts = core.chunks(text, 500);
  assert(parts.length > 10); assert(parts.every(p => p.length <= 500)); assert(parts.join(' ').includes('مصرف انرژی'));
});
test('links exact titles without nesting shorter names or changing code', () => {
  const result = core.linkExact('# Nova\n\nNova Widget uses Battery. Nova Widget. `Battery`\n\n```\nBattery\n```', { Nova: 'nova', 'Nova Widget': 'nova-widget', Battery: 'battery' }, 'other');
  assert(result.includes('[Nova Widget](./nova-widget.md)'));
  assert(!result.includes('[Nova [Widget'));
  assert(!result.includes('[[Nova]'));
  assert(result.includes('`Battery`')); assert(result.includes('```\nBattery\n```'));
  assert.equal(core.linkExact(result, { Nova: 'nova', 'Nova Widget': 'nova-widget', Battery: 'battery' }, 'other'), result);
});
test('existing links, self references and headings stay unchanged', () => {
  const input = '# Battery\n\n[Battery](./battery.md) and Battery.';
  assert.equal(core.linkExact(input, { Battery: 'battery' }, 'other'), input);
  assert.equal(core.linkExact('Battery', { Battery: 'battery' }, 'battery'), 'Battery');
});
test('BM25 finds relevant excerpts without inventing matches', () => {
  const docs = [{ text: 'Frequent transmissions drain the battery.' }, { text: 'Sensor case color is blue.' }];
  assert.equal(core.bm25('battery transmissions', docs, 5)[0].passage.text, docs[0].text);
  assert.deepEqual(core.bm25('elephant', docs), []);
  assert(core.bm25('باتری', [{ text: 'مصرف باتری حسگر' }]).length);
});
test('entity identity uses exact normalized names and preserves Unicode', () => {
  const sources = [{ id:'a', chunks:[{ entities:[{name:'Mira'},{name:'Mira Chen'},{name:'مینا'},{name:'سارا'}] }] }];
  assert.equal(core.exactEntities(sources).length, 4);
});
test('XML parser rejects DTDs and mismatched tags and decodes entities', () => {
  assert.throws(() => core.parseXml('<!DOCTYPE a><a/>'), /XML_DTD/);
  assert.throws(() => core.parseXml('<a><b></a>'), /XML_INVALID/);
  assert.equal(core.text(core.parseXml('<a>R&amp;D &#x1F600;</a>')), 'R&D 😀');
});
test('topic slug collisions produce separate stable output names', () => {
  const groups = core.groupSources([{ id:'1', title:'one', chunks:[{text:'a', topics:['A+B','A B']}] }]);
  assert.equal(new Set(groups.map(g=>g.slug)).size, 2);
});
test('extraction validates structured model output', () => {
  assert.deepEqual(core.extraction('```json\n{"topics":["Battery","Battery"],"entities":[]}\n```').topics, ['Battery']);
  assert.throws(() => core.extraction('{"topics":"wrong"}'), /MODEL_TOPICS/);
});
test('Excel dates account for both date systems and the historical leap-day quirk', () => {
  assert.equal(core.excelDate(1,false),'1900-01-01');
  assert.equal(core.excelDate(60,false),'1900-02-29 (Excel)');
  assert.equal(core.excelDate(0,true),'1904-01-01');
});
