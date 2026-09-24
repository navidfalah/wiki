import type { entities as en } from '../en/entities';

export const entities: Record<keyof typeof en, string> = {
  'entities.title': 'Entitäten',
  'entities.introHtml': 'Die Extraktion pro Textabschnitt liefert für jede Erwähnung nur eine Namens-<em>Zeichenkette</em> – „Mira Chen“, „Mira“ und „mira.chen@auroralabs.example“ „wissen“ nicht, dass sie dieselbe Person sind. Hier werden die Erwähnungen aller verarbeiteten Quellen zu Clustern aufgelöst (heuristische Stufe, deterministisch, ohne LLM-Aufruf) – der eigentliche Entitätsgraph hinter dem Themen-/Erwähnungsgraphen, den <code class="rounded bg-gray-100 px-1 py-0.5">linker.py</code> erzeugt. Entitäten, die in mehr Quellen vorkommen, stehen zuerst.',
  'entities.filterPlaceholder': 'Nach Namen filtern …',
  'entities.refresh': '↻ Aktualisieren',
  'entities.card.entities': 'Aufgelöste Entitäten',
  'entities.card.mentions': 'Erwähnungen gesamt',
  'entities.card.multiSource': 'In mehreren Quellen',
  'entities.card.merged': 'Zusammengeführte Namensvarianten',
  'entities.also': 'auch: {names}',
  'entities.sources_one': '{count} Quelle',
  'entities.sources_other': '{count} Quellen',
  'entities.mentions_one': '{count} Erwähnung',
  'entities.mentions_other': '{count} Erwähnungen',
  'entities.noMatch': 'Keine Entitäten passen zu diesem Filter.',
  'entities.none': 'Noch keine Entitäten aufgelöst – führen Sie zuerst die Compiler-Pipeline aus.',
};
