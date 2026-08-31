# LLM Wiki — Documentation Index

Detailed project documentation, split by topic. Start with [01-overview.md](./01-overview.md), then follow the numbered guides in order or jump to what you need.

---

## Quick links

| Doc | What it covers |
|-----|----------------|
| [01-overview.md](./01-overview.md) | What the project is, design philosophy, end-to-end flow |
| [02-getting-started.md](./02-getting-started.md) | Prerequisites, install, first compile, three-terminal dev setup |
| [03-architecture.md](./03-architecture.md) | Layers, data flow, ownership rules, mental model |
| [04-repository-structure.md](./04-repository-structure.md) | Every top-level folder and important file |
| [05-compiler-pipeline.md](./05-compiler-pipeline.md) | The 5 steps + MOC, CLI flags, incremental builds |
| [06-extraction-and-synthesis.md](./06-extraction-and-synthesis.md) | Chunking, topic extraction, page drafting |
| [07-linking-moc-and-pages.md](./07-linking-moc-and-pages.md) | Cross-links, index.json, MOC, page format, overrides |
| [08-llm-and-heuristics.md](./08-llm-and-heuristics.md) | API client, cache, retries, LLM-only requirement |
| [09-test-data-generation.md](./09-test-data-generation.md) | All four generator scripts, markers, CLI flags |
| [10-data-layout-and-state.md](./10-data-layout-and-state.md) | `data/raw/`, state.json, link_overrides, temp_output |
| [11-wiki-app-and-dashboards.md](./11-wiki-app-and-dashboards.md) | Docusaurus, React pages, components, routes |
| [12-api-server.md](./12-api-server.md) | FastAPI endpoints, SSE builds, CORS |
| [13-configuration.md](./13-configuration.md) | `.env`, Docusaurus config, GitHub Pages env vars |
| [14-workflows.md](./14-workflows.md) | Compile, ingest, query, lint, agent workflows |
| [15-ci-cd-and-deployment.md](./15-ci-cd-and-deployment.md) | GitHub Actions, Pages deploy, production build |
| [16-troubleshooting.md](./16-troubleshooting.md) | Common errors and fixes |
| [17-compiler-module-reference.md](./17-compiler-module-reference.md) | Every Python module in `compiler/` |
| [18-sample-domain.md](./18-sample-domain.md) | Fictional companies, characters, intentional contradictions |
| [19-multimedia-email-and-trust.md](./19-multimedia-email-and-trust.md) | Images, file attachments, email ingestion, source trust & references |
| [20-email-resources-and-chat-engines.md](./20-email-resources-and-chat-engines.md) | Email knowledge engine, Resources explorer, RAG chat engine |
| [21-trust-eval-dataset.md](./21-trust-eval-dataset.md) | Hand-labeled trust-propagation eval dataset: schema, labeling protocol, limitations |
| [22-trust-propagation-algorithm.md](./22-trust-propagation-algorithm.md) | The trust propagation algorithm itself: design, config, and preliminary behavior |
| [23-trust-propagation-evaluation.md](./23-trust-propagation-evaluation.md) | Formal evaluation: precision@1/pairwise accuracy, ablations, alpha sweep, results vs. static baseline |
| [24-extraction-critic.md](./24-extraction-critic.md) | Grounded, self-verifying synthesis: a second LLM pass that strips ungrounded sentences from drafts |
| [25-hybrid-retrieval.md](./25-hybrid-retrieval.md) | Hybrid retrieval: BM25 + embeddings (RRF) + LLM reranker, with a real BM25-vs-legacy-TF-IDF comparison |
| [26-entity-resolution.md](./26-entity-resolution.md) | Entity resolution / coreference: tiered heuristic + embeddings + LLM adjudication, evaluated on real corpus mentions |

---

## Other references

| File | Role |
|------|------|
| [../README.md](../README.md) | Original long-form README (also comprehensive) |
| [../AGENTS.md](../AGENTS.md) | Cursor/agent workflow schema |
| [../PROMPTS.md](../PROMPTS.md) | Example Cursor prompts |
| [../PROJECT_GUIDE.md](../PROJECT_GUIDE.md) | Short pointer to this documentation set |

---

## Typical reading paths

**“I just cloned the repo”**  
→ 01 → 02 → 05 → 11

**“How does test data become wiki pages?”**  
→ 09 → 05 → 06 → 07

**“I want to customize linking or front matter”**  
→ 07 → 13 → 17

**“I want to ingest images, PDFs, or emails”**  
→ 19 → 06 → 09

**“I want the email engine, resources explorer, or chat”**  
→ 20 → 12 → 11

**“Dashboard / API not working”**  
→ 11 → 12 → 16
