/* File readers use Google services only; Office XML parsing is shared pure JS. */
function wbNativeText_(file) {
  var mime = file.getMimeType(), out = [];
  if (mime === 'application/vnd.google-apps.document') {
    var doc = DocumentApp.openById(file.getId());
    if (typeof doc.getTabs === 'function') {
      function visit(tab) { out.push('## ' + tab.getTitle() + '\n\n' + tab.asDocumentTab().getBody().getText()); tab.getChildTabs().forEach(visit); }
      doc.getTabs().forEach(visit);
    } else out.push(doc.getBody().getText());
  } else if (mime === 'application/vnd.google-apps.spreadsheet') {
    var count = 0;
    SpreadsheetApp.openById(file.getId()).getSheets().forEach(function (sheet) {
      var rows = sheet.getLastRow(), columns = sheet.getLastColumn(); count += rows * columns;
      if (count > 200000) throw new Error('SHEET_CELL_LIMIT');
      out.push('## Sheet: ' + sheet.getName());
      if (rows && columns) out.push(sheet.getRange(1, 1, rows, columns).getDisplayValues().map(function (row) { return row.map(function (cell) { return '"' + String(cell).replace(/"/g, '""') + '"'; }).join(','); }).join('\n'));
    });
  } else if (mime === 'application/vnd.google-apps.presentation') {
    function elementText(element) {
      var type = String(element.getPageElementType());
      if (type === 'SHAPE') return element.asShape().getText().asString();
      if (type === 'TABLE') {
        var table = element.asTable(), rows = [];
        for (var r = 0; r < table.getNumRows(); r++) { var cells = []; for (var c = 0; c < table.getNumColumns(); c++) cells.push(table.getCell(r, c).getText().asString()); rows.push(cells.join(' | ')); }
        return rows.join('\n');
      }
      if (type === 'GROUP') return element.asGroup().getChildren().map(elementText).join('\n');
      return '';
    }
    SlidesApp.openById(file.getId()).getSlides().forEach(function (slide, i) {
      out.push('## Slide ' + (i + 1) + '\n\n' + slide.getPageElements().map(elementText).filter(Boolean).join('\n\n'));
      var notes = slide.getNotesPage().getSpeakerNotesShape();
      if (notes && notes.getText().asString().trim()) out.push('### Notes\n\n' + notes.getText().asString());
    });
  } else throw new Error('FORMAT_UNSUPPORTED');
  return out.join('\n\n');
}
function wbZipEntries_(blob) {
  var bytes = blob.getBytes().map(function (n) { return (n + 256) % 256; });
  function u16(pos) { return bytes[pos] + bytes[pos + 1] * 256; }
  function u32(pos) { return u16(pos) + u16(pos + 2) * 65536; }
  var end = -1;
  for (var i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (u32(i) === 0x06054b50 && i + 22 + u16(i + 20) === bytes.length) { end = i; break; }
  }
  if (end < 0 || u16(end + 4) || u16(end + 6)) throw new Error('ARCHIVE_INVALID');
  var entries = u16(end + 10), cursor = u32(end + 16), total = 0;
  if (!entries || entries > WB_LIMITS.zipEntries || entries === 65535) throw new Error('ARCHIVE_LIMIT');
  for (var n = 0; n < entries; n++) {
    if (u32(cursor) !== 0x02014b50 || cursor + 46 > end) throw new Error('ARCHIVE_INVALID');
    if (u16(cursor + 8) & 1) throw new Error('ENCRYPTED_FILE');
    total += u32(cursor + 24);
    if (total > WB_LIMITS.zipBytes) throw new Error('ARCHIVE_LIMIT');
    cursor += 46 + u16(cursor + 28) + u16(cursor + 30) + u16(cursor + 32);
  }
  var map = Object.create(null), blobs = Utilities.unzip(blob.copyBlob().setContentType('application/zip')), actual = 0;
  blobs.forEach(function (item) {
    actual += item.getBytes().length;
    if (actual > WB_LIMITS.zipBytes) throw new Error('ARCHIVE_LIMIT');
    var name = item.getName().replace(/^\//, '');
    if (/(^|\/)\.\.(\/|$)/.test(name) || name.indexOf('\\') >= 0) throw new Error('ARCHIVE_INVALID');
    if (/\.(xml|rels)$/.test(name)) map[name] = item.getDataAsString('UTF-8');
    else map[name] = null; // manifest only: never execute or recursively unpack attachments.
  });
  return map;
}
function wbConvertText_(file, workspace, targetMime) {
  var converted = null;
  var ext = file.getName().split('.').pop().toLowerCase();
  var sourceMime = /^(doc|dot)$/.test(ext) ? 'application/msword' : /^(xls|xlt)$/.test(ext) ? 'application/vnd.ms-excel' : ext === 'xlsb' ? 'application/vnd.ms-excel.sheet.binary.macroEnabled.12' : /^(ppt|pps|pot)$/.test(ext) ? 'application/vnd.ms-powerpoint' : ext === 'rtf' ? 'application/rtf' : 'application/pdf';
  try {
    converted = Drive.Files.create({ name: 'temporary-' + file.getName(), mimeType: targetMime, parents: [workspace.scratch.getId()] }, file.getBlob().setContentType(sourceMime), { fields: 'id' });
    return wbNativeText_(DriveApp.getFileById(converted.id));
  } catch (error) {
    if (/^[A-Z][A-Z0-9_]+$/.test(String(error.message))) throw error;
    throw new Error('CONVERSION_FAILED');
  } finally {
    if (converted) DriveApp.getFileById(converted.id).setTrashed(true);
  }
}
function wbEmailText_(content) {
  function parse(part, depth) {
    if (depth > 12) throw new Error('EMAIL_INVALID');
    var sections = part.split(/\r?\n\r?\n/), headerText = sections.shift() || '', body = sections.join('\n\n');
    var headers = Object.create(null);
    headerText.replace(/\r?\n[ \t]+/g, ' ').split(/\r?\n/).forEach(function (line) { var colon = line.indexOf(':'); if (colon > 0) headers[line.slice(0, colon).toLowerCase()] = line.slice(colon + 1).trim(); });
    function decodeHeader(value) {
      return String(value || '').replace(/=\?([^?]+)\?([bq])\?([^?]*)\?=/gi, function (_, charset, encoding, data) {
        try {
          var bytes = encoding.toLowerCase() === 'b' ? Utilities.base64Decode(data) : (data.replace(/_/g, ' ').match(/=[0-9a-f]{2}|./gi) || []).map(function (s) { return s[0] === '=' ? parseInt(s.slice(1), 16) : s.charCodeAt(0); });
          return Utilities.newBlob(bytes).getDataAsString(charset);
        } catch (error) { return value; }
      });
    }
    var prefix = depth === 0 ? ['From', 'To', 'Cc', 'Date', 'Subject'].map(function (name) { return name + ': ' + decodeHeader(headers[name.toLowerCase()]); }).join('\n') + '\n\n' : '';
    var type = headers['content-type'] || 'text/plain';
    if (/attachment/i.test(headers['content-disposition'] || '')) return '';
    if (/multipart\//i.test(type)) {
      var match = type.match(/boundary\s*=\s*(?:"([^"]+)"|([^;\s]+))/i);
      if (!match) throw new Error('EMAIL_INVALID');
      var boundary = '--' + (match[1] || match[2]);
      var parts = body.split(boundary).slice(1).filter(function (p) { return !/^--/.test(p); });
      if (/multipart\/alternative/i.test(type)) {
        var plain = parts.filter(function (p) { return /content-type:\s*text\/plain/i.test(p.split(/\r?\n\r?\n/)[0]); });
        if (plain.length) parts = plain;
      }
      return prefix + parts.map(function (p) { return parse(p.replace(/^\r?\n/, ''), depth + 1); }).filter(Boolean).join('\n\n');
    }
    if (!/^text\/(plain|html)/i.test(type)) return '';
    var charset = (type.match(/charset\s*=\s*"?([^;"\s]+)/i) || [])[1] || 'UTF-8';
    if (/base64/i.test(headers['content-transfer-encoding'] || '')) body = Utilities.newBlob(Utilities.base64Decode(body.replace(/\s/g, ''))).getDataAsString(charset);
    else if (/quoted-printable/i.test(headers['content-transfer-encoding'] || '')) {
      var raw = body.replace(/=\r?\n/g, ''), bytes = [];
      for (var i = 0; i < raw.length; i++) { if (raw[i] === '=' && /^[0-9a-f]{2}$/i.test(raw.slice(i + 1, i + 3))) { bytes.push(parseInt(raw.slice(i + 1, i + 3), 16)); i += 2; } else bytes.push(raw.charCodeAt(i) & 255); }
      body = Utilities.newBlob(bytes).getDataAsString(charset);
    }
    if (/text\/html/i.test(type)) body = body.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<\/(p|div|tr)>|<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
    return prefix + body;
  }
  return parse(content, 0);
}
function wbReadSource_(source, workspace, settings) {
  var file = DriveApp.getFileById(source.id), mime = file.getMimeType(), extension = file.getName().split('.').pop().toLowerCase(), body, warnings = [];
  if (/^application\/vnd\.google-apps\.(document|spreadsheet|presentation)$/.test(mime)) body = wbNativeText_(file);
  else {
    if (file.getSize() > WB_LIMITS.uploadBytes) throw new Error('SOURCE_SIZE_LIMIT');
    var officeType = /^(docx|docm|dotx|dotm)$/.test(extension) ? 'docx' : /^(xlsx|xlsm|xltx|xltm)$/.test(extension) ? 'xlsx' : /^(pptx|pptm|ppsx|ppsm|potx|potm)$/.test(extension) ? 'pptx' : /^(odt|ods|odp)$/.test(extension) ? extension : '';
    if (officeType) body = WikiCore.office(wbZipEntries_(file.getBlob()), officeType);
    else if (/^(doc|dot|xls|xlt|xlsb|ppt|pps|pot|rtf|pdf)$/.test(extension)) {
      if (!settings.convertLegacy) throw new Error('CONVERSION_DISABLED');
      body = wbConvertText_(file, workspace, /^(xls|xlt|xlsb)$/.test(extension) ? 'application/vnd.google-apps.spreadsheet' : /^(ppt|pps|pot)$/.test(extension) ? 'application/vnd.google-apps.presentation' : 'application/vnd.google-apps.document');
      warnings.push(extension === 'pdf' ? 'PDF_CONVERTED' : 'LEGACY_CONVERTED');
    } else if (/^(gdoc|gsheet|gslides)$/.test(extension)) {
      var reference = JSON.parse(file.getBlob().getDataAsString('UTF-8'));
      var linked = DriveApp.getFileById(wbId_(reference.doc_id || reference.url));
      source.referenceId = linked.getId(); source.referenceModified = linked.getLastUpdated().toISOString(); source.url = linked.getUrl();
      body = wbNativeText_(linked); warnings.push('LIVE_GOOGLE_REFERENCE');
    } else if (extension === 'eml') body = wbEmailText_(file.getBlob().getDataAsString('UTF-8'));
    else if (extension === 'zip') { var zip = wbZipEntries_(file.getBlob()); body = Object.keys(zip).sort().join('\n'); warnings.push('ZIP_MANIFEST_ONLY'); }
    else if (/^(txt|md|csv|tsv|json|xml|html|htm|yaml|yml|log)$/.test(extension) || /^text\//.test(mime)) {
      body = file.getBlob().getDataAsString('UTF-8');
      if (/^(html|htm)$/.test(extension)) body = body.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '').replace(/<[^>]*>/g, ' ');
    } else if (/^(image|audio|video)\//.test(mime) || /^(png|jpe?g|gif|webp|bmp|mp3|wav|m4a|ogg|flac|mp4|mov|avi|mkv)$/.test(extension)) {
      body = 'Attachment: ' + file.getName(); warnings.push('ATTACHMENT_METADATA_ONLY');
    } else throw new Error('FORMAT_UNSUPPORTED');
  }
  if (body.length > WB_LIMITS.sourceChars) throw new Error('SOURCE_TEXT_LIMIT');
  if (!body.trim()) warnings.push('EMPTY_SOURCE');
  return { text: body, warnings: warnings };
}
