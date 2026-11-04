'use strict';

/** Group exact normalized names without guessing whether similar names match. */
function entityGraphPayload(state) {
  const groups = new Map();
  for (const [source, file] of Object.entries(state?.files ?? {})) {
    for (const chunk of Array.isArray(file?.chunks) ? file.chunks : []) {
      for (const entity of Array.isArray(chunk?.entities) ? chunk.entities : []) {
        const name = typeof entity?.name === 'string' ? entity.name.trim() : '';
        if (!name) continue;
        const key = name.toLocaleLowerCase().replace(/\s+/g, ' ');
        if (!groups.has(key)) groups.set(key, { names: new Set(), sources: new Set(), count: 0 });
        const group = groups.get(key);
        group.names.add(name); group.sources.add(source); group.count++;
      }
    }
  }
  const clusters = [...groups.values()].map((group) => {
    const aliases = [...group.names].sort();
    const fullNames = aliases.filter((name) => name.includes(' ') && !name.includes('@'));
    const candidates = fullNames.length ? fullNames : aliases;
    return {
      canonical_name: candidates.reduce((best, name) => name.length > best.length ? name : best, candidates[0]),
      aliases, sources: [...group.sources].sort(), mention_count: group.count,
    };
  });
  clusters.sort((a, b) => a.canonical_name.localeCompare(b.canonical_name));
  clusters.forEach((cluster, index) => { cluster.id = `entity-${index}`; });
  clusters.sort((a, b) => b.sources.length - a.sources.length || a.canonical_name.localeCompare(b.canonical_name));
  return { entities: clusters, counts: {
    total_entities: clusters.length,
    total_mentions: clusters.reduce((sum, cluster) => sum + cluster.mention_count, 0),
    multi_source_entities: clusters.filter((cluster) => cluster.sources.length > 1).length,
    multi_alias_entities: clusters.filter((cluster) => cluster.aliases.length > 1).length,
  } };
}
module.exports = { entityGraphPayload };
