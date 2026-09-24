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

export interface Faq {
  q: string;
  a: string;
}
export interface Principle {
  title: string;
  text: string;
}

export interface LandingCopy {
  htmlLang: string;
  metaTitle: string;
  metaDescription: string;
  nav: {
    features: string;
    how: string;
    ops: string;
    faq: string;
    contact: string;
    contactHref: string;
    login: string;
    dashboard: string;
    switchLabel: string;
    switchHref: string;
  };
  hero: {
    badge: string;
    titleLead: string;
    titleAccent: string;
    text: string;
    ctaPrimary: string;
    ctaSecondary: string;
    formats: string;
  };
  stats: { value: string; label: string }[];
  mock: { question: string; answer: string; sources: string[]; page: string };
  principles: { eyebrow: string; title: string; items: Principle[] };
  usecases: { eyebrow: string; title: string; intro: string; items: Principle[] };
  stack: { eyebrow: string; title: string; text: string; layers: { name: string; tech: string; text: string }[] };
  how: { eyebrow: string; title: string; steps: Step[] };
  features: { eyebrow: string; title: string; items: Feature[] };
  ops: { eyebrow: string; title: string; text: string; points: string[] };
  faq: { eyebrow: string; title: string; items: Faq[] };
  about: { eyebrow: string; title: string; text: string; role: string; button: string };
  cta: { title: string; text: string; button: string; contactButton: string };
  footer: { tagline: string; note: string; imprint: string; privacy: string; contact: string; explore: string };
}

export interface ContactCopy {
  htmlLang: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  intro: string;
  cardLabel: string;
  roleLine: string;
  emailLabel: string;
  emailButton: string;
  copyLabel: string;
  copiedLabel: string;
  topicsTitle: string;
  topics: { title: string; text: string }[];
  noteTitle: string;
  note: string;
  back: string;
}

const de: LandingCopy = {
  htmlLang: 'de',
  metaTitle: 'Wissensbau – Forschungsprojekt zu LLM-gestützten Wikis',
  metaDescription:
    'Wissensbau ist ein nicht-kommerzielles Forschungsprojekt: Es untersucht, wie Sprachmodelle verstreute Notizen, E-Mails und Dokumente zu einem verlinkten, überprüfbaren Wiki verdichten können.',
  nav: {
    features: 'Fragestellungen',
    how: 'Methode',
    ops: 'Reproduzierbarkeit',
    faq: 'FAQ',
    contact: 'Kontakt',
    contactHref: '/kontakt',
    login: 'Anmelden',
    dashboard: 'Zum Dashboard',
    switchLabel: 'EN',
    switchHref: '/en',
  },
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
  stats: [
    { value: '4', label: 'Pipeline-Schritte vom Rohtext zum Wiki' },
    { value: '6', label: 'Forschungsfragen im Fokus' },
    { value: '2', label: 'Sprachen der Oberfläche: DE und EN' },
    { value: '0', label: 'Tracker, Cookies nur für die Anmeldung' },
  ],
  mock: {
    question: 'Wie lange hält der Akku des Sensors im Dauerbetrieb?',
    answer: 'Laut Messreihe rund 14 Monate bei einem Sendeintervall von 5 Minuten.',
    sources: ['Batterie-Spezifikation', 'Testbericht Q3'],
    page: 'wiki / hardware / batterie',
  },
  principles: {
    eyebrow: 'Grundsätze',
    title: 'Woran wir das Projekt ausrichten',
    items: [
      { title: 'Nachprüfbar statt überzeugend', text: 'Jede Aussage im Wiki soll auf ihre Quelle zurückführbar sein. Antworten ohne Beleg gelten als Fehler, nicht als Feature.' },
      { title: 'Offen und nicht-kommerziell', text: 'Wissensbau ist ein Forschungs- und Lernprojekt ohne Produktversprechen. Es gibt keine Werbung, keine Abos und keine Nutzerprofile.' },
      { title: 'Sparsam mit Daten', text: 'Selbst gehostet, ohne Tracker und ohne externe Schriftarten. Personenbezogene Angaben lassen sich vor der Verarbeitung schwärzen.' },
    ],
  },
  usecases: {
    eyebrow: 'Anwendungsfelder',
    title: 'Wo sich das Muster erproben lässt',
    intro: 'Kein fertiges Produkt, sondern Szenarien, in denen wir die Methode testen und ihre Grenzen ausloten.',
    items: [
      { title: 'Forschungsgruppen', text: 'Laborjournale, Protokolle und Literaturnotizen zu einem gemeinsamen, durchsuchbaren Wiki verdichten.' },
      { title: 'Projektdokumentation', text: 'Verstreute Spezifikationen, Berichte und E-Mail-Verläufe eines Projekts nachvollziehbar zusammenführen.' },
      { title: 'Einarbeitung und Übergaben', text: 'Wissen aus Postfächern und Ablagen so aufbereiten, dass neue Mitarbeitende Fragen selbst beantwortet bekommen.' },
      { title: 'Archive und Sammlungen', text: 'Große, heterogene Bestände erschließen – mit Querverweisen, die im Rohmaterial nicht existieren.' },
    ],
  },
  stack: {
    eyebrow: 'Technik',
    title: 'Der Aufbau im Überblick',
    text: 'Vier Schichten, bewusst einfach gehalten: Die Rohdaten bleiben unverändert, alles Erzeugte ist als Markdown lesbar und versionierbar.',
    layers: [
      { name: 'Compiler', tech: 'Python', text: 'Liest Rohdaten, ruft das Sprachmodell auf und erzeugt Wiki-Seiten, Entitäten und Verlinkungen.' },
      { name: 'Speicher', tech: 'Markdown · JSON · Graph', text: 'Seiten als Markdown-Dateien, Wissensgraph und Zustände als JSON – ohne eigene Datenbank.' },
      { name: 'API', tech: 'Node.js · Express · TypeScript', text: 'Authentifizierung, Pipeline-Steuerung, Retrieval und Chat-Endpunkte hinter einer schlanken REST-Schnittstelle.' },
      { name: 'Oberfläche', tech: 'EJS · Tailwind CSS', text: 'Serverseitig gerendert, zweisprachig (DE/EN) und auf kleine Server und Bildschirme ausgelegt.' },
    ],
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
  faq: {
    eyebrow: 'FAQ',
    title: 'Häufige Fragen',
    items: [
      { q: 'Ist Wissensbau ein Produkt?', a: 'Nein. Es ist ein nicht-kommerzielles Forschungsprojekt. Es gibt weder Preise noch Verkaufsabsichten, und bislang liegen keine Studienergebnisse vor.' },
      { q: 'Woher kommt die Idee?', a: 'Vom LLM-Wiki-Muster, das Andrej Karpathy beschrieben hat: Ein Sprachmodell pflegt ein Wiki aus Rohmaterial, statt bei jeder Frage neu zu suchen. Wir untersuchen, wie gut das im Alltag funktioniert.' },
      { q: 'Kann ich das System ausprobieren?', a: 'Der Zugang ist auf Testkonten beschränkt, damit der kleine Server verlässlich läuft. Schreiben Sie uns über die Kontaktseite, wenn Sie Interesse haben.' },
      { q: 'Was passiert mit meinen Dokumenten?', a: 'Rohdaten bleiben unverändert auf dem Server. Für die Verarbeitung werden Textauszüge an den konfigurierten Sprachmodell-Anbieter gesendet – oder bei lokaler Konfiguration gar nicht nach außen. Die Beispieldaten im Prototyp sind fiktiv.' },
      { q: 'Kann ich den Code nutzen?', a: 'Ja, der Quellcode liegt öffentlich auf GitHub. Der Aufbau ist mit Docker Compose reproduzierbar, auch auf kleiner Hardware.' },
      { q: 'Wie werden die Antworten überprüft?', a: 'Über Evaluationsskripte für Retrieval, Faithfulness, Entitätsauflösung und PII-Schwärzung. Aussagekräftige Ergebnisse veröffentlichen wir erst, wenn eine Auswertung sie trägt.' },
    ],
  },
  about: {
    eyebrow: 'Über das Projekt',
    title: 'Ein Projekt von Navid Falah',
    text: 'Wissensbau entsteht als Forschungs- und Lernprojekt rund um LLM-gestützte Wissenssysteme. Rückmeldungen, Fragen zur Methode und Hinweise auf Fehler sind jederzeit willkommen.',
    role: 'Entwicklung und Forschung',
    button: 'Kontakt aufnehmen',
  },
  cta: { title: 'Den Prototyp ausprobieren', text: 'Der Zugang ist auf Testkonten beschränkt. Melden Sie sich an, um Pipeline, Wiki und Chat mit Beispieldaten zu erkunden.', button: 'Anmelden', contactButton: 'Zugang anfragen' },
  footer: { tagline: 'Ein Forschungsprojekt.', note: 'Nicht-kommerziell. Beispieldaten sind fiktiv.', imprint: 'Impressum', privacy: 'Datenschutz', contact: 'Kontakt', explore: 'Entdecken' },
};

const en: LandingCopy = {
  htmlLang: 'en',
  metaTitle: 'Wissensbau – A research project on LLM-built wikis',
  metaDescription:
    'Wissensbau is a non-commercial research project studying how language models can condense scattered notes, emails and documents into a cross-linked, verifiable wiki.',
  nav: {
    features: 'Research questions',
    how: 'Method',
    ops: 'Reproducibility',
    faq: 'FAQ',
    contact: 'Contact',
    contactHref: '/en/contact',
    login: 'Sign in',
    dashboard: 'Open dashboard',
    switchLabel: 'DE',
    switchHref: '/',
  },
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
  stats: [
    { value: '4', label: 'pipeline steps from raw text to wiki' },
    { value: '6', label: 'research questions in focus' },
    { value: '2', label: 'interface languages: DE and EN' },
    { value: '0', label: 'trackers, cookies only for sign-in' },
  ],
  mock: {
    question: 'How long does the sensor battery last in continuous use?',
    answer: 'According to the test series, about 14 months at a 5-minute reporting interval.',
    sources: ['Battery specification', 'Test report Q3'],
    page: 'wiki / hardware / battery',
  },
  principles: {
    eyebrow: 'Principles',
    title: 'What guides the project',
    items: [
      { title: 'Verifiable over persuasive', text: 'Every statement in the wiki should trace back to its source. An answer without evidence counts as a bug, not a feature.' },
      { title: 'Open and non-commercial', text: 'Wissensbau is a research and learning project with no product promise. There are no ads, no subscriptions and no user profiles.' },
      { title: 'Frugal with data', text: 'Self-hosted, with no trackers and no external fonts. Personal data can be redacted before it is processed.' },
    ],
  },
  usecases: {
    eyebrow: 'Application areas',
    title: 'Where the pattern can be tested',
    intro: 'Not a finished product, but scenarios in which we try the method and probe its limits.',
    items: [
      { title: 'Research groups', text: 'Condense lab notebooks, protocols and reading notes into one shared, searchable wiki.' },
      { title: 'Project documentation', text: 'Bring a project’s scattered specifications, reports and email threads together in a traceable way.' },
      { title: 'Onboarding and handovers', text: 'Turn knowledge locked in inboxes and file shares into something newcomers can query themselves.' },
      { title: 'Archives and collections', text: 'Open up large, heterogeneous holdings – with cross-references that do not exist in the raw material.' },
    ],
  },
  stack: {
    eyebrow: 'Technology',
    title: 'The architecture at a glance',
    text: 'Four layers, deliberately simple: raw data stays untouched, and everything generated is readable and versionable Markdown.',
    layers: [
      { name: 'Compiler', tech: 'Python', text: 'Reads raw data, calls the language model and produces wiki pages, entities and links.' },
      { name: 'Storage', tech: 'Markdown · JSON · Graph', text: 'Pages as Markdown files, knowledge graph and state as JSON – no separate database.' },
      { name: 'API', tech: 'Node.js · Express · TypeScript', text: 'Authentication, pipeline control, retrieval and chat endpoints behind a lean REST interface.' },
      { name: 'Interface', tech: 'EJS · Tailwind CSS', text: 'Server-rendered, bilingual (DE/EN) and built for small servers and small screens.' },
    ],
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
  faq: {
    eyebrow: 'FAQ',
    title: 'Frequently asked questions',
    items: [
      { q: 'Is Wissensbau a product?', a: 'No. It is a non-commercial research project. There are no prices or sales plans, and no study results exist yet.' },
      { q: 'Where does the idea come from?', a: 'From the LLM-wiki pattern described by Andrej Karpathy: a language model maintains a wiki built from raw material instead of searching afresh for every question. We study how well that works in practice.' },
      { q: 'Can I try the system?', a: 'Access is limited to test accounts so the small server stays reliable. Write to us via the contact page if you are interested.' },
      { q: 'What happens to my documents?', a: 'Raw data stays untouched on the server. For processing, text excerpts are sent to the configured language-model provider – or not sent outside at all when a local model is configured. The prototype’s sample data is fictional.' },
      { q: 'Can I use the code?', a: 'Yes, the source code is public on GitHub. The setup is reproducible with Docker Compose, even on small hardware.' },
      { q: 'How are the answers checked?', a: 'Through evaluation scripts for retrieval, faithfulness, entity resolution and PII redaction. We only publish results once an evaluation supports them.' },
    ],
  },
  about: {
    eyebrow: 'About the project',
    title: 'A project by Navid Falah',
    text: 'Wissensbau is being built as a research and learning project around LLM-assisted knowledge systems. Feedback, questions about the method and reports of errors are always welcome.',
    role: 'Development and research',
    button: 'Get in touch',
  },
  cta: { title: 'Try the prototype', text: 'Access is limited to test accounts. Sign in to explore the pipeline, wiki and chat with sample data.', button: 'Sign in', contactButton: 'Request access' },
  footer: { tagline: 'A research project.', note: 'Non-commercial. Sample data is fictional.', imprint: 'Imprint', privacy: 'Privacy', contact: 'Contact', explore: 'Explore' },
};

export const LANDING_COPY: Record<Lang, LandingCopy> = { de, en };

const contactDe: ContactCopy = {
  htmlLang: 'de',
  metaTitle: 'Kontakt – Wissensbau',
  metaDescription: 'Kontakt zu Wissensbau, einem nicht-kommerziellen Forschungsprojekt zu LLM-gestützten Wikis: Fragen, Feedback und Zugangsanfragen an Navid Falah.',
  eyebrow: 'Kontakt',
  title: 'Schreiben Sie uns',
  intro: 'Fragen zur Methode, Rückmeldungen zum Prototyp oder Interesse an einem Testzugang – eine kurze E-Mail genügt. Wir antworten, sobald wir Zeit finden.',
  cardLabel: 'Ansprechperson',
  roleLine: 'Entwicklung und Forschung, Wissensbau',
  emailLabel: 'E-Mail',
  emailButton: 'E-Mail schreiben',
  copyLabel: 'Adresse kopieren',
  copiedLabel: 'Kopiert',
  topicsTitle: 'Worüber Sie schreiben können',
  topics: [
    { title: 'Testzugang', text: 'Der Prototyp ist auf Testkonten beschränkt. Nennen Sie kurz, wofür Sie ihn erproben möchten.' },
    { title: 'Methode und Forschung', text: 'Fragen zu Pipeline, Evaluation, Retrieval oder zur Einordnung des LLM-Wiki-Musters.' },
    { title: 'Fehler und Verbesserungen', text: 'Hinweise auf Fehler, unklare Texte oder Ideen für die Oberfläche und die Übersetzungen.' },
    { title: 'Zusammenarbeit', text: 'Interesse an gemeinsamen Experimenten, Datensätzen oder Auswertungen.' },
  ],
  noteTitle: 'Hinweis',
  note: 'Wissensbau ist ein nicht-kommerzielles Projekt. Bitte senden Sie keine vertraulichen oder personenbezogenen Dokumente per E-Mail.',
  back: '← Zur Startseite',
};

const contactEn: ContactCopy = {
  htmlLang: 'en',
  metaTitle: 'Contact – Wissensbau',
  metaDescription: 'Contact Wissensbau, a non-commercial research project on LLM-built wikis: questions, feedback and access requests to Navid Falah.',
  eyebrow: 'Contact',
  title: 'Get in touch',
  intro: 'Questions about the method, feedback on the prototype or interest in a test account – a short email is enough. We reply as soon as we find the time.',
  cardLabel: 'Contact person',
  roleLine: 'Development and research, Wissensbau',
  emailLabel: 'Email',
  emailButton: 'Send an email',
  copyLabel: 'Copy address',
  copiedLabel: 'Copied',
  topicsTitle: 'What you can write about',
  topics: [
    { title: 'Test access', text: 'The prototype is limited to test accounts. Briefly say what you would like to try it for.' },
    { title: 'Method and research', text: 'Questions about the pipeline, evaluation, retrieval, or how to place the LLM-wiki pattern.' },
    { title: 'Bugs and improvements', text: 'Reports of errors, unclear wording, or ideas for the interface and translations.' },
    { title: 'Collaboration', text: 'Interest in joint experiments, datasets or evaluations.' },
  ],
  noteTitle: 'Note',
  note: 'Wissensbau is a non-commercial project. Please do not send confidential or personal documents by email.',
  back: '← Back to the home page',
};

export const CONTACT_COPY: Record<Lang, ContactCopy> = { de: contactDe, en: contactEn };
