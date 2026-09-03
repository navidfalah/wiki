import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  detectTopicLinks,
  mergeEffectiveLinks,
  validateConnections,
  type Connection,
  type DetectedLink,
} from './linkOverrides';

const TOPIC_INDEX = {
  'Battery Chemistry': 'battery-chemistry.md',
  'Firmware Update': 'firmware-update.md',
  'Sensor Array': 'sensor-array.md',
};

function connection(overrides: Partial<Connection> & Pick<Connection, 'source_topic' | 'target_topic'>): any {
  return { rule: 'require', enabled: true, note: '', ...overrides };
}

describe('validateConnections', () => {
  it('drops connections missing a source or target topic', () => {
    const result = validateConnections(
      [{ source_topic: '', target_topic: 'Firmware Update' }, { target_topic: 'Firmware Update' }],
      TOPIC_INDEX,
    );
    expect(result).toEqual([]);
  });

  it('drops connections referencing topics outside the index', () => {
    const result = validateConnections(
      [connection({ source_topic: 'Battery Chemistry', target_topic: 'Unknown Topic' })],
      TOPIC_INDEX,
    );
    expect(result).toEqual([]);
  });

  it('drops self-links', () => {
    const result = validateConnections(
      [connection({ source_topic: 'Battery Chemistry', target_topic: 'Battery Chemistry' })],
      TOPIC_INDEX,
    );
    expect(result).toEqual([]);
  });

  it('dedupes by (source, target, rule)', () => {
    const result = validateConnections(
      [
        connection({ source_topic: 'Battery Chemistry', target_topic: 'Firmware Update' }),
        connection({ source_topic: 'Battery Chemistry', target_topic: 'Firmware Update' }),
      ],
      TOPIC_INDEX,
    );
    expect(result).toHaveLength(1);
  });

  it('keeps require and block as distinct entries for the same topic pair', () => {
    const result = validateConnections(
      [
        connection({ source_topic: 'Battery Chemistry', target_topic: 'Firmware Update', rule: 'require' }),
        connection({ source_topic: 'Battery Chemistry', target_topic: 'Firmware Update', rule: 'block' }),
      ],
      TOPIC_INDEX,
    );
    expect(result).toHaveLength(2);
  });

  it('defaults an invalid rule to require and trims whitespace', () => {
    const result = validateConnections(
      [
        {
          source_topic: '  Battery Chemistry  ',
          target_topic: '  Firmware Update  ',
          rule: 'bogus',
          note: '  a note  ',
        },
      ],
      TOPIC_INDEX,
    );
    expect(result[0]).toMatchObject({
      source_topic: 'Battery Chemistry',
      target_topic: 'Firmware Update',
      rule: 'require',
      note: 'a note',
      enabled: true,
    });
    expect(result[0].id).toBeTruthy();
  });

  it('preserves a supplied id instead of generating a new one', () => {
    const result = validateConnections(
      [connection({ id: 'fixed-id', source_topic: 'Battery Chemistry', target_topic: 'Firmware Update' })],
      TOPIC_INDEX,
    );
    expect(result[0].id).toBe('fixed-id');
  });
});

describe('mergeEffectiveLinks', () => {
  const detected: DetectedLink[] = [
    {
      source_topic: 'Battery Chemistry',
      target_topic: 'Firmware Update',
      source_id: 'battery-chemistry',
      target_id: 'firmware-update',
      origin: 'detected',
    },
  ];

  it('returns detected links unchanged when there are no connections', () => {
    const result = mergeEffectiveLinks(detected, [], TOPIC_INDEX);
    expect(result).toEqual(detected);
  });

  it('a block override removes a detected link', () => {
    const conn = connection({ source_topic: 'Battery Chemistry', target_topic: 'Firmware Update', rule: 'block' });
    const result = mergeEffectiveLinks(detected, [conn], TOPIC_INDEX);
    expect(result).toEqual([]);
  });

  it('a require override adds a link not present in the detected set', () => {
    const conn = connection({ id: 'ov-1', source_topic: 'Sensor Array', target_topic: 'Firmware Update' });
    const result = mergeEffectiveLinks(detected, [conn], TOPIC_INDEX);
    expect(result).toHaveLength(2);
    const added = result.find((l) => l.source_topic === 'Sensor Array')!;
    expect(added).toMatchObject({
      source_topic: 'Sensor Array',
      target_topic: 'Firmware Update',
      source_id: 'sensor-array',
      target_id: 'firmware-update',
      origin: 'override',
      rule: 'require',
      override_id: 'ov-1',
    });
  });

  it('a disabled override neither adds nor removes anything', () => {
    const conn = connection({
      source_topic: 'Sensor Array',
      target_topic: 'Firmware Update',
      enabled: false,
    });
    const result = mergeEffectiveLinks(detected, [conn], TOPIC_INDEX);
    expect(result).toEqual(detected);
  });

  it('a require override on an existing pair replaces the detected entry with an override entry', () => {
    const conn = connection({
      id: 'ov-2',
      source_topic: 'Battery Chemistry',
      target_topic: 'Firmware Update',
      rule: 'require',
    });
    const result = mergeEffectiveLinks(detected, [conn], TOPIC_INDEX);
    expect(result).toHaveLength(1);
    expect(result[0].origin).toBe('override');
    expect(result[0].override_id).toBe('ov-2');
  });

  it('sorts the result case-insensitively by source then target topic', () => {
    const result = mergeEffectiveLinks(
      [],
      [
        connection({ id: '1', source_topic: 'sensor Array', target_topic: 'Firmware Update' }),
        connection({ id: '2', source_topic: 'Battery Chemistry', target_topic: 'Sensor Array' }),
      ],
      TOPIC_INDEX,
    );
    expect(result.map((l) => l.source_topic)).toEqual(['Battery Chemistry', 'sensor Array']);
  });
});

describe('detectTopicLinks', () => {
  let dir: string;

  afterEach(() => {
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  });

  function write(filename: string, content: string) {
    fs.writeFileSync(path.join(dir, filename), content, 'utf-8');
  }

  it('finds cross-links between indexed pages and ignores external/anchor/unindexed hrefs', () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'link-overrides-'));
    write(
      'battery-chemistry.md',
      [
        '---',
        'title: Battery Chemistry',
        '---',
        'See [firmware](./firmware-update.md), [external](https://example.com),',
        '[anchor](#section), and [untracked](./untracked.md).',
      ].join('\n'),
    );
    write('firmware-update.md', '---\ntitle: Firmware Update\n---\nNo links here.');
    write('sensor-array.md', '---\ntitle: Sensor Array\n---\nSee [via docs prefix](/docs/battery-chemistry).');

    const links = detectTopicLinks(TOPIC_INDEX, dir);

    expect(links).toHaveLength(2);
    expect(links[0]).toMatchObject({
      source_topic: 'Battery Chemistry',
      target_topic: 'Firmware Update',
      origin: 'detected',
    });
    expect(links[1]).toMatchObject({
      source_topic: 'Sensor Array',
      target_topic: 'Battery Chemistry',
      origin: 'detected',
    });
  });

  it('skips source pages that are missing on disk', () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'link-overrides-'));
    write('firmware-update.md', '---\ntitle: Firmware Update\n---\nNo links.');
    const links = detectTopicLinks(TOPIC_INDEX, dir);
    expect(links).toEqual([]);
  });

  it('dedupes repeated links between the same pair of topics', () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'link-overrides-'));
    write(
      'battery-chemistry.md',
      '---\ntitle: Battery Chemistry\n---\n[a](./firmware-update.md) and [b](./firmware-update.md) again.',
    );
    write('firmware-update.md', '---\ntitle: Firmware Update\n---\nNo links.');
    const links = detectTopicLinks(TOPIC_INDEX, dir);
    expect(links).toHaveLength(1);
  });
});
