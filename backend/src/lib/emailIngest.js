'use strict';
// Structured .eml parsing kept separate from generic text and Office readers.
const { simpleParser } = require('mailparser');
const EMAIL_EXTENSIONS = new Set(['.eml']);

async function parseEmail(bytes) {
  const parsed = await simpleParser(bytes);
  return {
    subject: parsed.subject || '',
    from: parsed.from?.text || '',
    to: parsed.to?.text || '',
    cc: parsed.cc?.text || '',
    date: parsed.headers.get('date') || '',
    body: parsed.text?.trim() || '',
    attachments: parsed.attachments.map((attachment) => ({
      filename: attachment.filename || 'attachment',
      content: attachment.content,
    })),
  };
}

function renderEmail(parsed, attachmentLinks = []) {
  return [
    `Subject: ${parsed.subject || '(no subject)'}`,
    `From: ${parsed.from || '(unknown sender)'}`,
    `To: ${parsed.to || '(unknown recipient)'}`,
    ...(parsed.cc ? [`Cc: ${parsed.cc}`] : []),
    `Date: ${parsed.date || '(unknown date)'}`,
    '', parsed.body || '(empty body)',
    ...(attachmentLinks.length ? ['', '**Attachments:**', ...attachmentLinks] : []),
  ].join('\n');
}

module.exports = { EMAIL_EXTENSIONS, parseEmail, renderEmail };
