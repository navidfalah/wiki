# LLM Wiki — Project Guide

> **This file is a short index.** Detailed documentation lives in **[documentation/](./documentation/README.md)** — split across 18 focused guides with small implementation details.

## Quick start

```bash
cd compiler && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && python main.py --force
cd ../wiki-app && npm install && npm start
```

## Documentation map

| Topic | File |
|-------|------|
| **Index (start here)** | [documentation/README.md](./documentation/README.md) |
| What & why | [01-overview.md](./documentation/01-overview.md) |
| Install & run | [02-getting-started.md](./documentation/02-getting-started.md) |
| Architecture | [03-architecture.md](./documentation/03-architecture.md) |
| File tree | [04-repository-structure.md](./documentation/04-repository-structure.md) |
| Compiler 5 steps | [05-compiler-pipeline.md](./documentation/05-compiler-pipeline.md) |
| Extraction & synthesis | [06-extraction-and-synthesis.md](./documentation/06-extraction-and-synthesis.md) |
| Linking & MOC | [07-linking-moc-and-pages.md](./documentation/07-linking-moc-and-pages.md) |
| LLM client | [08-llm-and-heuristics.md](./documentation/08-llm-and-heuristics.md) |
| Test data generators | [09-test-data-generation.md](./documentation/09-test-data-generation.md) |
| State & data files | [10-data-layout-and-state.md](./documentation/10-data-layout-and-state.md) |
| Docusaurus & dashboards | [11-wiki-app-and-dashboards.md](./documentation/11-wiki-app-and-dashboards.md) |
| API server | [12-api-server.md](./documentation/12-api-server.md) |
| Configuration | [13-configuration.md](./documentation/13-configuration.md) |
| Workflows | [14-workflows.md](./documentation/14-workflows.md) |
| CI/CD | [15-ci-cd-and-deployment.md](./documentation/15-ci-cd-and-deployment.md) |
| Troubleshooting | [16-troubleshooting.md](./documentation/16-troubleshooting.md) |
| Module reference | [17-compiler-module-reference.md](./documentation/17-compiler-module-reference.md) |
| Sample domain | [18-sample-domain.md](./documentation/18-sample-domain.md) |
| Multimedia, email, trust & references | [19-multimedia-email-and-trust.md](./documentation/19-multimedia-email-and-trust.md) |
| Email engine, Resources, Chat (RAG) | [20-email-resources-and-chat-engines.md](./documentation/20-email-resources-and-chat-engines.md) |
| Trust-propagation eval dataset | [21-trust-eval-dataset.md](./documentation/21-trust-eval-dataset.md) |
| Trust propagation algorithm | [22-trust-propagation-algorithm.md](./documentation/22-trust-propagation-algorithm.md) |
| Trust propagation evaluation + ablations | [23-trust-propagation-evaluation.md](./documentation/23-trust-propagation-evaluation.md) |
| Extraction critic (grounded synthesis) | [24-extraction-critic.md](./documentation/24-extraction-critic.md) |
| Hybrid retrieval (BM25 + embeddings + reranker) | [25-hybrid-retrieval.md](./documentation/25-hybrid-retrieval.md) |
| Entity resolution / coreference | [26-entity-resolution.md](./documentation/26-entity-resolution.md) |
| Temporal / bi-temporal fact modeling | [27-temporal-modeling.md](./documentation/27-temporal-modeling.md) |
| Faithfulness evaluation for chat answers | [28-faithfulness-evaluation.md](./documentation/28-faithfulness-evaluation.md) |

## Also see

- [README.md](./README.md) — original comprehensive README
- [AGENTS.md](./AGENTS.md) — Cursor agent workflows
- [PROMPTS.md](./PROMPTS.md) — example prompts
