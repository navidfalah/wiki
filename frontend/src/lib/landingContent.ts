/**
 * Copy for the public landing page (wissensbau.de) -- a non-commercial
 * research project, so the tone is descriptive, not promotional, and it makes
 * no claims about results (no user study has been run; see documentation/32).
 *
 * German is the default (served at `/`), English lives at `/en`; keep the two
 * dictionaries structurally identical.
 */
export type Lang = 'de' | 'en';

export interface Step {
  title: string;
  text: string;
}
export interface Feature {
  icon: 'files' | 'wiki' | 'chat' | 'graph' | 'plug' | 'shield';
  title: string;
  text: string;
}

export interface LandingCopy {
  htmlLang: string;
  metaTitle: string;
  metaDescription: string;
  nav: { features: string; how: string; ops: string; login: string; dashboard: string; switchLabel: string; switchHref: string };
  hero: {
    badge: string;
    titleLead: string;
    titleAccent: string;
    text: string;
    ctaPrimary: string;
    ctaSecondary: string;
    formats: string;
  };
  mock: { question: string; answer: string; sources: string[]; page: string };
  how: { eyebrow: string; title: string; steps: Step[] };
  features: { eyebrow: string; title: string; items: Feature[] };
  ops: { eyebrow: string; title: string; text: string; points: string[] };
  cta: { title: string; text: string; button: string };
  footer: { tagline: string; note: string; imprint: string; privacy: string };
}

const de: LandingCopy = {
  htmlLang: 'de',
  metaTitle: 'Wissensbau – Forschungsprojekt zu LLM-gestützten Wikis',
  metaDescription:
    'Wissensbau ist ein nicht-kommerzielles Forschungsprojekt: Es untersucht, wie Sprachmodelle verstreute Notizen, E-Mails und Dokumente zu einem verlinkten, überprüfbaren Wiki verdichten können.',
  nav: { features: 'Fragestellungen', how: 'Methode', ops: 'Reproduzierbarkeit', login: 'Anmelden', dashboard: 'Zum Dashboard', switchLabel: 'EN', switchHref: '/en' },
  hero: {
    badge: 'Nicht-kommerzielles Forschungsprojekt',
    titleLead: 'Wie werden verstreute Dokumente zum verlässlichen',
    titleAccent: 'Wissensbau?',
    text:
      'Wissensbau untersucht, wie Sprachmodelle rohe Notizen, E-Mails und Dokumente zu einem verlinkten Wiki verdichten – nach dem LLM-Wiki-Muster von Andrej Karpathy. Der Prototyp ist die Testumgebung für unsere Experimente.',
    ctaPrimary: 'Prototyp ausprobieren',
    ctaSecondary: 'Methode ansehen',
    formats: 'PDF · DOCX · XLSX · PPTX · E-Mail · CSV · Bilder · Audio',
  },
  mock: {
    question: 'Wie lange hält der Akku des Sensors im Dauerbetrieb?',
    answer: 'Laut Messreihe rund 14 Monate bei einem Sendeintervall von 5 Minuten.',
    sources: ['Batterie-Spezifikation', 'Testbericht Q3'],
    page: 'wiki / hardware / batterie',
  },
  how: {
    eyebrow: 'Methode',
    title: 'Die Pipeline in vier Schritten',
    steps: [
      { title: 'Sammeln', text: 'Rohdaten liegen unverändert in einem Ordner – Dateien, E-Mails oder angebundene Quellen wie IMAP und PostgreSQL.' },
      { title: 'Kompilieren', text: 'Ein Sprachmodell extrahiert Themen, Entitäten und Konzepte und schreibt daraus Wiki-Seiten.' },
      { title: 'Verknüpfen', text: 'Seiten werden untereinander verlinkt; Beziehungen erscheinen im Wissensgraph.' },
      { title: 'Befragen', text: 'Ein Chat antwortet auf Basis des Wikis und nennt die zugrunde liegenden Quellen.' },
    ],
  },
  features: {
    eyebrow: 'Fragestellungen',
    title: 'Was der Prototyp untersucht',
    items: [
      { icon: 'files', title: 'Extraktion aus vielen Formaten', text: 'Wie zuverlässig lassen sich Text, E-Mails, PDF, Office-Dokumente, Tabellen, Bilder und Audio in strukturiertes Wissen überführen?' },
      { icon: 'wiki', title: 'Synthese und Verlinkung', text: 'Wie gut entstehen aus Rohmaterial konsistente, untereinander verlinkte Seiten mit Verweisen auf ihre Quellen?' },
      { icon: 'chat', title: 'Belegte Antworten', text: 'Stützen sich Chat-Antworten nachweisbar auf das Wiki? Eine Faithfulness-Auswertung prüft das.' },
      { icon: 'graph', title: 'Entitätsauflösung', text: 'Werden Personen, Projekte und Konzepte über Dokumente hinweg korrekt zusammengeführt und im Graph abgebildet?' },
      { icon: 'plug', title: 'Hybrides Retrieval', text: 'Schlagwortsuche und Einbettungen im Vergleich – inklusive Benchmark zur Skalierung mit der Korpusgröße.' },
      { icon: 'shield', title: 'Datenschutz und Vertrauen', text: 'Schwärzung personenbezogener Daten und Quellenvertrauen als Bausteine für den verantwortungsvollen Einsatz.' },
    ],
  },
  ops: {
    eyebrow: 'Reproduzierbarkeit',
    title: 'Nachvollziehbar und schlank betrieben',
    text: 'Der gesamte Prototyp läuft in wenigen Containern mit festen Ressourcengrenzen und lässt sich mit Docker Compose reproduzieren – auch auf einem kleinen Server. Evaluationsskripte für Retrieval, Faithfulness, Entitätsauflösung und PII-Schwärzung sind Teil des Projekts.',
    points: ['Selbst gehostet, ohne Tracker und externe Schriftarten', 'Reproduzierbarer Aufbau mit Docker Compose', 'OpenAI-kompatible oder lokale Sprachmodelle', 'Eingebaute Evaluations-Harnesses'],
  },
  cta: { title: 'Den Prototyp ausprobieren', text: 'Der Zugang ist auf Testkonten beschränkt. Melden Sie sich an, um Pipeline, Wiki und Chat mit Beispieldaten zu erkunden.', button: 'Anmelden' },
  footer: { tagline: 'Ein Forschungsprojekt.', note: 'Nicht-kommerziell. Beispieldaten sind fiktiv.', imprint: 'Impressum', privacy: 'Datenschutz' },
};

const en: LandingCopy = {
  htmlLang: 'en',
  metaTitle: 'Wissensbau – A research project on LLM-built wikis',
  metaDescription:
    'Wissensbau is a non-commercial research project studying how language models can condense scattered notes, emails and documents into a cross-linked, verifiable wiki.',
  nav: { features: 'Research questions', how: 'Method', ops: 'Reproducibility', login: 'Sign in', dashboard: 'Open dashboard', switchLabel: 'DE', switchHref: '/' },
  hero: {
    badge: 'Non-commercial research project',
    titleLead: 'How do scattered documents become a reliable',
    titleAccent: 'knowledge build?',
    text:
      'Wissensbau studies how language models can condense raw notes, emails and documents into a linked wiki – following Andrej Karpathy’s LLM-wiki pattern. The prototype is the testbed for our experiments.',
    ctaPrimary: 'Try the prototype',
    ctaSecondary: 'See the method',
    formats: 'PDF · DOCX · XLSX · PPTX · Email · CSV · Images · Audio',
  },
  mock: {
    question: 'How long does the sensor battery last in continuous use?',
    answer: 'According to the test series, about 14 months at a 5-minute reporting interval.',
    sources: ['Battery specification', 'Test report Q3'],
    page: 'wiki / hardware / battery',
  },
  how: {
    eyebrow: 'Method',
    title: 'The pipeline in four steps',
    steps: [
      { title: 'Collect', text: 'Raw data stays untouched in a folder – files, emails, or connected sources such as IMAP and PostgreSQL.' },
      { title: 'Compile', text: 'A language model extracts topics, entities and concepts and writes wiki pages from them.' },
      { title: 'Link', text: 'Pages are cross-linked; relationships show up in the knowledge graph.' },
      { title: 'Query', text: 'A chat answers from the wiki and names the sources behind each answer.' },
    ],
  },
  features: {
    eyebrow: 'Research questions',
    title: 'What the prototype investigates',
    items: [
      { icon: 'files', title: 'Extraction across formats', text: 'How reliably can text, email, PDF, Office documents, spreadsheets, images and audio be turned into structured knowledge?' },
      { icon: 'wiki', title: 'Synthesis and linking', text: 'How well does raw material become consistent, cross-linked pages that point back to their sources?' },
      { icon: 'chat', title: 'Grounded answers', text: 'Do chat answers demonstrably rest on the wiki? A faithfulness evaluation checks this.' },
      { icon: 'graph', title: 'Entity resolution', text: 'Are people, projects and concepts merged correctly across documents and reflected in the graph?' },
      { icon: 'plug', title: 'Hybrid retrieval', text: 'Keyword search versus embeddings – including a benchmark of how each scales with corpus size.' },
      { icon: 'shield', title: 'Privacy and trust', text: 'Redaction of personal data and source trust as building blocks for responsible use.' },
    ],
  },
  ops: {
    eyebrow: 'Reproducibility',
    title: 'Traceable and lean to run',
    text: 'The whole prototype runs in a few containers with fixed resource limits and can be reproduced with Docker Compose – even on a small server. Evaluation scripts for retrieval, faithfulness, entity resolution and PII redaction are part of the project.',
    points: ['Self-hosted, with no trackers or external fonts', 'Reproducible setup with Docker Compose', 'OpenAI-compatible or local language models', 'Built-in evaluation harnesses'],
  },
  cta: { title: 'Try the prototype', text: 'Access is limited to test accounts. Sign in to explore the pipeline, wiki and chat with sample data.', button: 'Sign in' },
  footer: { tagline: 'A research project.', note: 'Non-commercial. Sample data is fictional.', imprint: 'Imprint', privacy: 'Privacy' },
};

export const LANDING_COPY: Record<Lang, LandingCopy> = { de, en };
