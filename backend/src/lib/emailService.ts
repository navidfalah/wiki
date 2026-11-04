import path from 'node:path';
import { DATA_ROOT, OUTPUT_DIR, RAW_DIR, STATE_FILE } from '../paths';
import { collectSourceMetadata, rawFileStatus, synthesizedPagesForTopics } from './docUtils';
import { discoverRawSourceFiles } from './rawFiles';
import { createEmailEngine } from './emailEngine';

export const emailService = createEmailEngine({
  rawDir: RAW_DIR,
  docsDir: OUTPUT_DIR,
  stateFile: STATE_FILE,
  trustFile: path.join(DATA_ROOT, 'data', 'source_trust.json'),
  collectSourceMetadata,
  synthesizedPagesForTopics,
  rawFileStatus,
  discoverRawSourceFiles,
});
