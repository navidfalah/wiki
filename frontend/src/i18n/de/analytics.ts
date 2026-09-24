import type { analytics as en } from '../en/analytics';

export const analytics: Record<keyof typeof en, string> = {
  'analytics.title': 'Analysen',
  'analytics.intro': 'Zahlen, defekte Links und Tags aus dem letzten Compile-Lauf.',
  'analytics.deadLinks': 'Tote Links',
  'analytics.tags': 'Tags',
  'analytics.card.rawFiles': 'Rohdateien',
  'analytics.card.wikiPages': 'Wiki-Seiten',
  'analytics.card.crossLinks': 'Querverweise',
  'analytics.card.deadLinks': 'Tote Links',
  'analytics.card.tags': 'Tags',
  'analytics.noBroken': 'Keine defekten Links.',
  'analytics.noTags': 'Noch keine Tags.',
};
