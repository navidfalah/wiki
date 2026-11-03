"""Gold Q&A benchmark: how well does each retrieval architecture put the
answer in front of the model?

data/qa_benchmark.json holds 65 questions over the sample corpus, each with
required answer facts (acceptable phrasings) and the raw source files that
contain them. For every architecture in rag_architectures.py, this
retrieves the top-k passages for each question from two corpora:

- the compiled wiki (rag_engine.build_corpus), which is what chat uses by
  default;
- the raw source files (rag_engine.build_raw_corpus), which is the
  "without the wiki" condition from the user-study protocol (doc 32).

For each architecture and corpus it scores:

- fact_recall: the mean fraction of a question's facts that appear in the
  retrieved text. This is context recall: could a reader answer from what
  was retrieved?
- all_facts: the share of questions whose facts all appear.
- source_hit: the share of questions where a retrieved passage comes from
  (raw) or cites (wiki, via its References table) one of the gold sources.
- chars: the mean retrieved characters per question. Compare recall across
  corpora with this in view: raw passages are whole short files, so the
  same top-k hands the model more text.

It also reports coverage: the share of questions answerable from the whole
corpus. For the wiki this separates facts lost during synthesis (not
covered) from facts retrieval failed to surface (covered but not retrieved).

Without an API key, HyDE and RAG-Fusion fall back to plain BM25, so they
are only reported with --with-llm. Answer generation is not scored here:
it needs an LLM, and an LLM judge is a separate, non-deterministic
measurement.

    python qa_benchmark_eval.py            # offline architectures
    python qa_benchmark_eval.py --with-llm # also HyDE and Fusion (needs an API key)
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from dataclasses import dataclass
from pathlib import Path

from models import OUTPUT_DIR, PROJECT_ROOT, RAW_DIR

BENCHMARK_PATH = PROJECT_ROOT / "data" / "qa_benchmark.json"
OFFLINE_ARCHITECTURES = ("naive", "graph", "corrective")
LLM_ARCHITECTURES = ("hyde", "fusion")

_DASHES = str.maketrans({"–": "-", "—": "-", "µ": "u", "μ": "u"})


def normalize(text: str) -> str:
    text = text.lower().translate(_DASHES).replace("**", "").replace("`", "")
    return re.sub(r"\s+", " ", text)


@dataclass(frozen=True)
class Question:
    id: str
    category: str
    question: str
    answer: str
    facts: list[list[str]]
    sources: list[str]
    keywords: str


def load_benchmark(path: Path = BENCHMARK_PATH) -> list[Question]:
    data = json.loads(path.read_text(encoding="utf-8"))
    return [Question(**q) for q in data["questions"]]


def facts_found(facts: list[list[str]], text: str) -> int:
    haystack = normalize(text)
    return sum(1 for alternatives in facts if any(normalize(a) in haystack for a in alternatives))


def read_source_text(rel_path: str, raw_dir: Path = RAW_DIR) -> str:
    path = raw_dir / rel_path
    if path.suffix.lower() == ".eml":
        from email_ingest import parse_eml

        parsed = parse_eml(path)
        return f"{parsed.subject}\n{parsed.from_addr}\n{parsed.body_text}"
    return path.read_text(encoding="utf-8", errors="replace")


def _content_key(path: Path) -> str:
    return hashlib.md5(path.read_bytes()).hexdigest()


def source_equivalence(raw_dir: Path = RAW_DIR) -> dict[str, str]:
    """Raw path -> content hash, so byte-identical copies (the sample corpus
    has several, e.g. notes/ideas/emails/) count as the same source."""
    return {
        str(p.relative_to(raw_dir)).replace("\\", "/"): _content_key(p)
        for p in raw_dir.rglob("*")
        if p.is_file()
    }


def wiki_page_sources(docs_dir: Path = OUTPUT_DIR) -> dict[str, list[str]]:
    from faithfulness_heuristic import parse_page

    return {p.name: parse_page(p.read_text(encoding="utf-8"))[1] for p in docs_dir.glob("*.md")}


@dataclass(frozen=True)
class ArchitectureScore:
    corpus: str
    architecture: str
    fact_recall: float
    all_facts: float
    source_hit: float
    mean_chars: float


def coverage(questions: list[Question], corpus) -> float:
    """Share of questions whose facts all appear somewhere in the corpus."""
    full = normalize("\n".join(p.text for p in corpus))
    return sum(facts_found(q.facts, full) == len(q.facts) for q in questions) / len(questions)


def evaluate(
    questions: list[Question],
    architectures: tuple[str, ...] = OFFLINE_ARCHITECTURES,
    *,
    top_k: int = 5,
    llm=None,
    docs_dir: Path = OUTPUT_DIR,
    raw_dir: Path = RAW_DIR,
) -> list[ArchitectureScore]:
    import rag_architectures
    import rag_engine

    equivalence = source_equivalence(raw_dir)
    page_sources = wiki_page_sources(docs_dir)
    corpora = {
        "wiki": rag_engine.build_corpus(docs_dir),
        "raw": rag_engine.build_raw_corpus(raw_dir),
    }

    def passage_sources(corpus_name: str, doc_path: str) -> set[str]:
        paths = page_sources.get(doc_path, []) if corpus_name == "wiki" else [doc_path]
        return {equivalence.get(p, p) for p in paths}

    scores = []
    for corpus_name, corpus in corpora.items():
        for architecture in architectures:
            recalls, complete, hits, chars = [], [], [], []
            for q in questions:
                retrieved = rag_architectures.retrieve(architecture, q.question, corpus, top_k=top_k, llm=llm)
                text = "\n".join(sp.passage.text for sp in retrieved)
                chars.append(len(text))
                found = facts_found(q.facts, text)
                recalls.append(found / len(q.facts))
                complete.append(found == len(q.facts))
                gold = {equivalence.get(s, s) for s in q.sources}
                retrieved_sources = set().union(*(passage_sources(corpus_name, sp.passage.doc_path) for sp in retrieved)) if retrieved else set()
                hits.append(bool(gold & retrieved_sources))
            n = len(questions)
            scores.append(ArchitectureScore(corpus_name, architecture, sum(recalls) / n, sum(complete) / n, sum(hits) / n, sum(chars) / n))
    return scores


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--with-llm", action="store_true", help="also run HyDE and RAG-Fusion (needs an API key)")
    parser.add_argument("--top-k", type=int, default=5)
    args = parser.parse_args(argv)

    questions = load_benchmark()
    architectures = OFFLINE_ARCHITECTURES
    llm = None
    if args.with_llm:
        from llm_client import LLMClient

        llm = LLMClient.for_purpose("chat")
        if not llm.available:
            parser.error("--with-llm needs a configured LLM (see documentation/13-configuration.md)")
        architectures = OFFLINE_ARCHITECTURES + LLM_ARCHITECTURES

    print(f"{len(questions)} questions, top_k={args.top_k}\n")
    import rag_engine

    print(f"coverage: wiki {coverage(questions, rag_engine.build_corpus()):.3f}  raw {coverage(questions, rag_engine.build_raw_corpus()):.3f}\n")
    print(f"{'corpus':6s} {'architecture':12s} {'fact_recall':>11s} {'all_facts':>9s} {'source_hit':>10s} {'chars':>6s}")
    for s in evaluate(questions, architectures, top_k=args.top_k, llm=llm):
        print(f"{s.corpus:6s} {s.architecture:12s} {s.fact_recall:11.3f} {s.all_facts:9.3f} {s.source_hit:10.3f} {s.mean_chars:6.0f}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
