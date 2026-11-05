// Run a copy from a private build directory with a symlink to the bundled
// node_modules. Arguments: pack directory, build directory, runtime root.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { Workbook, SpreadsheetFile, Presentation, PresentationFile } from '@oai/artifact-tool';

const [packDir, buildDir, runtimeRoot, phase = 'all'] = process.argv.slice(2);
if (!packDir || !buildDir || !runtimeRoot) throw new Error('Supply packDir, buildDir, runtimeRoot');
const data = JSON.parse(await fs.readFile(path.join(packDir, 'reference/office-data.json'), 'utf8'));
const inputs = path.join(packDir, 'inputs');
await fs.mkdir(buildDir, { recursive: true });
const font = 'Arial';
process.env.RUNTIME_NODE_MODULES = path.join(runtimeRoot, 'dependencies/node/node_modules');

async function workbookFile(key, title, relativePath, headers, rows) {
  const target = path.join(inputs, relativePath);
  try { await fs.access(target); throw new Error(`Refusing to replace ${target}`); }
  catch (e) { if (e.code !== 'ENOENT') throw e; }
  const wb = Workbook.create();
  const sheet = wb.worksheets.add(key === 'qa' ? 'Quality' : key[0].toUpperCase() + key.slice(1));
  sheet.showGridLines = false;
  const lastCol = String.fromCharCode(64 + headers.length);
  const lastRow = rows.length + 5;
  const used = sheet.getRange(`A1:${lastCol}${lastRow + 3}`);
  used.format.font = { name: font, size: 11, color: '#202832' };
  used.format.rowHeight = 23;
  used.format.verticalAlignment = 'center';
  used.format.columnWidth = 19;
  sheet.getRange('A2').values = [[title]];
  sheet.getRange('A2').format.font = { name: font, size: 15, bold: true };
  sheet.getRange('A3').values = [['[SAMPLE] Aurora Labs fictional records / September 2026']];
  sheet.getRange(`A5:${lastCol}5`).values = [headers];
  sheet.getRange(`A5:${lastCol}5`).format = { fill: '#2b4255', font: { name: font, size: 11, bold: true, color: '#ffffff' }, rowHeight: 28 };
  sheet.getRange(`A6:${lastCol}${lastRow}`).values = rows;
  sheet.getRange(`B1:B${lastRow+3}`).format.columnWidth = key === 'bom' ? 24 : 25;
  if (key === 'inventory') {
    sheet.getRange(`C6:E${lastRow}`).setNumberFormat('0');
    sheet.getRange('E6').formulas = [['=C6-D6']];
    sheet.getRange(`E6:E${lastRow}`).fillDown();
    sheet.getRange(`B${lastRow+2}`).values = [['Total devices']];
    sheet.getRange(`C${lastRow+2}:E${lastRow+2}`).formulas = [[`=SUM(C6:C${lastRow})`, `=SUM(D6:D${lastRow})`, `=SUM(E6:E${lastRow})`]];
  } else if (key === 'bom') {
    sheet.getRange(`C6:C${lastRow}`).setNumberFormat('0');
    sheet.getRange(`D6:E${lastRow}`).setNumberFormat('#,##0.00');
    sheet.getRange('E6').formulas = [['=ROUND(C6*D6,2)']];
    sheet.getRange(`E6:E${lastRow}`).fillDown();
    sheet.getRange(`B${lastRow+2}`).values = [['Unit materials EUR']];
    sheet.getRange(`E${lastRow+2}`).formulas = [[`=SUM(E6:E${lastRow})`]];
    sheet.getRange(`E${lastRow+2}`).setNumberFormat('#,##0.00');
    sheet.getRange(`F1:F${lastRow+3}`).format.columnWidth = 25;
  } else if (key === 'qa') {
    sheet.getRange(`B6:B${lastRow}`).setNumberFormat('0');
    sheet.getRange(`E6:E${lastRow}`).conditionalFormats.add('containsText', { text: 'blocked', format: { fill: '#fff0d2', font: { color: '#7b4800' } } });
  } else {
    sheet.getRange(`D1:D${lastRow+3}`).format.columnWidth = 24;
    sheet.getRange(`E1:E${lastRow+3}`).format.columnWidth = 24;
    sheet.getRange(`F6:F${lastRow}`).setNumberFormat('yyyy-mm-dd');
    sheet.getRange(`D6:D${lastRow}`).conditionalFormats.add('containsText', { text: 'inspection_pending', format: { fill: '#fff0d2' } });
  }
  sheet.freezePanes.freezeRows(5);
  wb.recalculate();
  const inspect = await wb.inspect({ kind: 'region', sheetId: sheet.name, range: `A5:${lastCol}${lastRow+2}`, maxChars: 2500, tableMaxRows: 5 });
  await fs.writeFile(path.join(buildDir, `${key}-inspection.json`), inspect.ndjson);
  const preview = await wb.render({ sheetName: sheet.name, autoCrop: 'all', scale: 1.3, format: 'png' });
  await fs.writeFile(path.join(buildDir, `${key}.png`), new Uint8Array(await preview.arrayBuffer()));
  await fs.mkdir(path.dirname(target), { recursive: true });
  await (await SpreadsheetFile.exportXlsx(wb)).save(target);
  await fs.rename(target+'.inspect.ndjson', path.join(buildDir, `${key}-export-inspection.ndjson`)).catch(e => { if (e.code !== 'ENOENT') throw e; });
  console.log(JSON.stringify({ workbook: target, rows: rows.length }));
}

if (phase !== 'presentations') {
await workbookFile('inventory', 'GH 03 sensor inventory', 'operations/[SAMPLE]-inventory.xlsx',
  ['Serial', 'Item', 'Received', 'Issued', 'On hand', 'Project', 'Synthetic'],
  data.inventory.slice(1).map(r => [r[0], r[1], r[2], r[3], null, r[5], true]));
await workbookFile('bom', 'Nova Widget v2 materials', 'engineering/[SAMPLE]-nova-widget-bom.xlsx',
  ['Part', 'Description', 'Qty per unit', 'Unit cost EUR', 'Line cost EUR', 'Supplier', 'Synthetic'],
  data.bom.slice(1).map(r => [r[0], r[1], r[2], r[3], null, r[4], true]));
await workbookFile('qa', 'MeshSync candidate quality cases', 'quality/[SAMPLE]-quality-matrix.xlsx',
  ['Case', 'Nodes', 'Firmware', 'Check', 'Outcome', 'Owner', 'Synthetic'],
  data.qa.slice(1).map(r => [...r.slice(0,6), true]));
await workbookFile('support', 'GH 03 support register', 'support/[SAMPLE]-support-register.xlsx',
  ['Ticket', 'Device', 'Category', 'Status', 'Owner', 'Date', 'Synthetic'],
  data.support.slice(1).map(r => [...r.slice(0,5), new Date(r[5]+'T00:00:00Z'), true]));
}

const runtimeRequire = createRequire(path.join(process.env.RUNTIME_NODE_MODULES, '__runtime_resolver__.cjs'));
const { unzipSync } = runtimeRequire('fflate');
function textBox(slide, text, x, y, w, h, size, color = '#192c3d', bold = false) {
  const shape = slide.shapes.add({ geometry: 'textbox', position: { left:x, top:y, width:w, height:h }, fill:'none', line:{ fill:'none', width:0 } });
  shape.text = text;
  shape.text.style = { typeface:font, fontSize:size, color, bold };
  return shape;
}

for (const [slug, date, title, slides] of [
  ['kickoff-history', '2026-09-01', 'GH 03 pilot kickoff', [
    ['Pilot scope', 'Lindenhof Pilot / GH-03\nNova Widget v2 soil sensors\nMeshSync local gateway', 'Planning snapshot dated 1 September 2026.'],
    ['Initial assumptions', 'Hourly sensor readings\nTwo-year battery target\n12 sensors and 2 gateways planned', 'These are historical planning assumptions. No battery lifetime was measured.'],
    ['Work to schedule', 'Mira Chen: define firmware requirements\nJonah Park: prepare pilot equipment\nPriya Nair: define quality checks', 'No release approval is recorded in this kickoff.'],
  ]],
  ['engineering-review', '2026-09-24', 'GH 03 engineering review', [
    ['Current requirements', '15-minute sampling interval\nLocal MeshSync gateway\nNo mandatory cloud connection', 'PRD-NW2-04 dated 10 September supersedes the hourly kickoff assumption.'],
    ['Rejoin issue remains open', 'INC-2026-017 / NW2-008\nEight-node retest blocked by missing trace\nFirmware candidate: 0.9.4-rc2', 'Priya Nair owns retest. Receipt of firmware is not a passing result. Six-node baseline is a separate case.'],
    ['Inspection and disposition', 'Jonah Park: inspect NW2-009 gasket\nPriya Nair: keep GW1-003 on hold\nMira Chen: review rejoin diagnostics', 'SUP-2026-026 and QC-2026-033 remain pending. Ethernet PASS is not overall release approval.'],
  ]],
]) {
  const p = Presentation.create({ slideSize:{ width:1280, height:720 } });
  for (const [i, [heading, body, note]] of slides.entries()) {
    const slide = p.slides.add();
    slide.background.fill = '#f8f9f8';
    textBox(slide, 'AURORA LABS / FICTIONAL COMPANY RECORD', 72, 42, 1136, 30, 18, '#566574');
    textBox(slide, i===0 ? title : heading, 72, 108, 1136, 90, 48, '#192c3d', true);
    if (i===0) textBox(slide, heading, 72, 202, 1050, 50, 29, '#435464');
    textBox(slide, body, 72, i===0 ? 282 : 250, 1136, 230, 31);
    textBox(slide, note, 72, 548, 1136, 70, 22, '#435464');
    textBox(slide, `${date} / GH-03 / ${i+1} of ${slides.length} / [SAMPLE]`, 72, 658, 1136, 28, 17, '#566574');
    slide.speakerNotes.text = `Fictional Aurora Labs source. ${note}`;
    const png = await p.export({ slide, format:'png', scale:1 });
    await fs.writeFile(path.join(buildDir, `${slug}-${i+1}.png`), new Uint8Array(await png.arrayBuffer()));
  }
  const candidate = path.join(buildDir, `${slug}-candidate.pptx`);
  await (await PresentationFile.exportPptx(p)).save(candidate);
  const target = path.join(inputs, 'presentations', `[SAMPLE]-${slug}.pptx`);
  try { await fs.access(target); throw new Error(`Refusing to replace ${target}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  await fs.mkdir(path.dirname(target), { recursive:true });
  const packageFiles = unzipSync(new Uint8Array(await fs.readFile(candidate)));
  const fileNames = Object.keys(packageFiles);
  const xml = (name) => {
    const contents = packageFiles[name];
    if (!contents) throw new Error(`Presentation package is missing ${name}`);
    return new TextDecoder().decode(contents);
  };
  if (!fileNames.includes('[Content_Types].xml') || !fileNames.includes('_rels/.rels')) {
    throw new Error('Presentation package is missing required OOXML parts');
  }
  const presentationXml = xml('ppt/presentation.xml');
  const dimensions = presentationXml.match(/<p:sldSz\b[^>]*\bcx="(\d+)"[^>]*\bcy="(\d+)"/);
  if (!dimensions || dimensions[1] !== '12192000' || dimensions[2] !== '6858000') {
    throw new Error('Presentation slide size does not match the 16:9 layout');
  }
  const slideNames = fileNames.filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name));
  if (slideNames.length !== slides.length) throw new Error(`Expected ${slides.length} slides, found ${slideNames.length}`);
  for (const slideName of slideNames) {
    const slideXml = xml(slideName);
    if (!slideXml.includes(`typeface="${font}"`)) throw new Error(`${slideName} does not use the expected ${font} font`);
    for (const shape of slideXml.matchAll(/<p:sp\b[\s\S]*?<\/p:sp>/g)) {
      const transform = shape[0].match(/<a:xfrm\b[\s\S]*?<\/a:xfrm>/);
      if (!transform) continue;
      const offset = transform[0].match(/<a:off\b[^>]*\bx="(-?\d+)"[^>]*\by="(-?\d+)"/);
      const extent = transform[0].match(/<a:ext\b[^>]*\bcx="(\d+)"[^>]*\bcy="(\d+)"/);
      if (!offset || !extent) continue;
      const [x, y, width, height] = [offset[1], offset[2], extent[1], extent[2]].map(Number);
      if (x < 0 || y < 0 || x + width > 12192000 || y + height > 6858000) {
        throw new Error(`${slideName} contains a shape outside the slide bounds`);
      }
    }
    if (!fileNames.includes(slideName.replace('ppt/slides/slide', 'ppt/notesSlides/notesSlide').replace('.xml', '.xml'))) {
      throw new Error(`${slideName} is missing speaker notes`);
    }
  }
  await fs.copyFile(candidate, target, fs.constants.COPYFILE_EXCL);
  const result = { valid: true, slide_count: slideNames.length, slide_size_emu: [12192000, 6858000], font, checked_shape_bounds: true, checked_speaker_notes: true };
  await fs.writeFile(path.join(buildDir, `${slug}-validation.json`), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({ presentation:target, validation:result }));
}
