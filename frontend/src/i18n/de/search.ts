import type { search as en } from '../en/search';

export const search: Record<keyof typeof en, string> = {
  'search.title': 'Suche',
  'search.intro': 'Eine Abfrage über kompilierte Wiki-Seiten, zitierte Ressourcen und importierte E-Mails hinweg -- bisher hatte jeder dieser Bereiche nur einen eigenen lokalen Filter.',
  'search.placeholder': 'Wiki-Seiten, Ressourcen, E-Mails durchsuchen…',
  'search.filter.all': 'Alle',
  'search.filter.wiki': 'Wiki-Seiten',
  'search.filter.resource': 'Ressourcen',
  'search.filter.email': 'E-Mails',
  'search.type.wiki': 'Wiki-Seite',
  'search.type.resource': 'Ressource',
  'search.type.email': 'E-Mail',
  'search.meta.resource': '{type} · Vertrauen: {trust}',
  'search.meta.email': '{from} · {date}',
  'search.result_one': '{count} Ergebnis',
  'search.result_other': '{count} Ergebnisse',
  'search.empty': 'Tippen Sie, um Wiki-Seiten, Ressourcen und E-Mails zu durchsuchen.',
  'search.noMatch': 'Keine Ergebnisse für „{query}“.',
  'search.viewWiki': 'Seite öffnen',
  'search.viewResource': 'In Ressourcen öffnen',
  'search.viewEmail': 'In Ressourcen öffnen',
};
