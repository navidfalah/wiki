/* eslint no-console: "off" -- this evaluation script prints its CLI report. */
'use strict';

const { redactText, STRICT_POLICY, NER_AUGMENTED_POLICY } = require('./piiRedaction');

const fixture = (name, text, expected = []) => ({ name, text, expected: new Set(expected.map(([category, value]) => `${category}\0${value}`)) });
const FIXTURES = [
  fixture('contact_line', 'Contact Mira Chen at mira.chen@auroralabs.example or call 555-123-4567.', [['email', 'mira.chen@auroralabs.example'], ['phone_number', '555-123-4567']]),
  fixture('ssn_in_hr_note', 'New hire paperwork: SSN on file is 123-45-6789, start date next Monday.', [['ssn', '123-45-6789']]),
  fixture('server_ip_in_incident_notes', 'MQTT broker unreachable at 192.168.1.100 since the rejoin storm began.', [['ipv4_address', '192.168.1.100']]),
  fixture('api_key_in_config_snippet', 'Set OPENAI_API_KEY=sk-abcdef1234567890abcdef1234567890 in .env before compiling.', [['api_key', 'sk-abcdef1234567890abcdef1234567890']]),
  fixture('test_card_in_billing_note', 'Billing team used test card 4111 1111 1111 1111 to verify the checkout flow.', [['credit_card', '4111 1111 1111 1111']]),
  fixture('plain_technical_note_no_pii', 'Rejoin storm mitigation triggers when the mesh exceeds 6 nodes; MeshSync logs RSSI and hop count.'),
  fixture('order_number_false_positive', 'Order number ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEF was shipped yesterday, not a secret.', [['api_key', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEF']]),
  fixture('multiple_mentions_of_the_same_value', 'Reach Jonah at jonah.park@auroralabs.example. CC jonah.park@auroralabs.example on the follow-up.', [['email', 'jonah.park@auroralabs.example']]),
  fixture('luhn_invalid_number_not_flagged_as_card', 'Reference number on the packing slip was 4111 1111 1111 1112, unrelated to payment.'),
  fixture('two_distinct_ssns_in_one_note', 'Dependent coverage form lists primary SSN 123-45-6789 and spouse SSN 987-65-4321.', [['ssn', '123-45-6789'], ['ssn', '987-65-4321']]),
  fixture('vendor_token_without_sk_prefix', 'CI failed after the token ghp_9f8e7d6c5b4a3210fedcba9876543210ab expired overnight.', [['api_key', 'ghp_9f8e7d6c5b4a3210fedcba9876543210ab']]),
  fixture('ipv4_embedded_in_a_url', 'Dashboard is reachable at http://192.168.1.100:8080/status during the incident.', [['ipv4_address', '192.168.1.100']]),
  fixture('obfuscated_email_not_detected', 'Reach me at mira dot chen at auroralabs dot example if the ticket needs escalation.'),
];
const NER_ONLY_FIXTURES = [fixture('location_mention_no_fixed_pattern', 'The relay hardware ships from our Austin warehouse before reaching customers.', [['location', 'Austin']])];

function runEval(fixtures = FIXTURES, policy = STRICT_POLICY, nerBackend = null) {
  let truePositives = 0, falsePositives = 0, falseNegatives = 0;
  const falsePositiveExamples = [], falseNegativeExamples = [];
  for (const item of fixtures) {
    const found = new Set(redactText(item.text, policy, { nerBackend }).findings.map(({ category, original }) => `${category}\0${original}`));
    for (const key of found) {
      if (item.expected.has(key)) truePositives++;
      else { falsePositives++; falsePositiveExamples.push([item.name, ...key.split('\0')]); }
    }
    for (const key of item.expected) {
      if (!found.has(key)) { falseNegatives++; falseNegativeExamples.push([item.name, ...key.split('\0')]); }
    }
  }
  return {
    precision: truePositives + falsePositives ? truePositives / (truePositives + falsePositives) : Number.NaN,
    recall: truePositives + falseNegatives ? truePositives / (truePositives + falseNegatives) : Number.NaN,
    true_positives: truePositives, false_positives: falsePositives, false_negatives: falseNegatives,
    false_positive_examples: falsePositiveExamples, false_negative_examples: falseNegativeExamples,
  };
}

function printReport(report) {
  console.log(`precision=${report.precision.toFixed(2)} recall=${report.recall.toFixed(2)}`);
  console.log(`true_positives=${report.true_positives} false_positives=${report.false_positives} false_negatives=${report.false_negatives}`);
  for (const [label, examples] of [['False positives', report.false_positive_examples], ['False negatives', report.false_negative_examples]]) {
    if (examples.length) { console.log(`\n${label}:`); for (const [name, category, value] of examples) console.log(`  [${name}] ${category}: ${JSON.stringify(value)}`); }
  }
}

if (require.main === module) {
  printReport(runEval());
  console.log('\n=== Optional NER tier (location category) ===');
  console.log('No NER backend is configured for this JavaScript runtime; NER-only fixtures were not scored.');
}

module.exports = { FIXTURES, NER_ONLY_FIXTURES, runEval, printReport, NER_AUGMENTED_POLICY };
