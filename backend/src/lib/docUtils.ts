/** Typed facade over the plain JavaScript compiler document utilities. */
export interface FrontmatterMeta {
  [key: string]: string | string[] | undefined;
  tags_list?: string[];
}

export interface ChunkLike {
  topics?: string[];
  entities?: { name?: string }[];
  concepts?: { name?: string }[];
}

interface DocUtilsImplementation {
  slugify(text: string): string;
  parseFrontmatter(content: string): FrontmatterMeta;
  stripFrontmatter(content: string): string;
  extractLinks(body: string): { text: string; href: string }[];
  normalizeTopic(topic: string): string;
  loadTopicIndex(indexJsonPath?: string): Record<string, string>;
  loadTopicIndexOrDocs(docsDir?: string, indexJsonPath?: string): Record<string, string>;
  topicFilename(topicIndex: Record<string, string>, topic: string, docsDir?: string): string | null;
  collectSourceMetadata(stateEntry: { chunks?: ChunkLike[] }): {
    topics: string[];
    entities: { name?: string }[];
    concepts: { name?: string }[];
    chunks: ChunkLike[];
  };
  synthesizedPagesForTopics(topics: string[], entities: { name?: string }[], concepts: { name?: string }[], docsDir?: string, indexJsonPath?: string): Record<string, unknown>[];
  readDocPayload(docPath: string, docsDir?: string): {
    path: string; title: string; id?: string | string[]; slug?: string | string[];
    tags: string[]; body: string; links: { text: string; href: string }[];
  };
  rawFileStatus(relPath: string, currentMd5: string, state: { files?: Record<string, { md5?: string }> }): 'Processed' | 'Unprocessed';
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const implementation = require('../../../compiler/doc_utils.js') as DocUtilsImplementation;

export const slugify = implementation.slugify;
export const parseFrontmatter = implementation.parseFrontmatter;
export const stripFrontmatter = implementation.stripFrontmatter;
export const extractLinks = implementation.extractLinks;
export const normalizeTopic = implementation.normalizeTopic;
export const loadTopicIndex = implementation.loadTopicIndex;
export const loadTopicIndexOrDocs = implementation.loadTopicIndexOrDocs;
export const topicFilename = implementation.topicFilename;
export const collectSourceMetadata = implementation.collectSourceMetadata;
export const synthesizedPagesForTopics = implementation.synthesizedPagesForTopics;
export const readDocPayload = implementation.readDocPayload;
export const rawFileStatus = implementation.rawFileStatus;
