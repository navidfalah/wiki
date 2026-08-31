"""Faithfulness evaluation for rag_engine.answer_question()'s chat answers.

The two answer modes have very different faithfulness guarantees, and this
module evaluates each the way that's actually appropriate rather than
applying one method to both:

- **"extractive" mode is faithful by construction.** Looking at
  rag_engine.answer_question()'s extractive branch: every line of the
  answer is a passage's title/heading plus a verbatim (optionally
  truncated) copy of its text — nothing is generated. That's a structural
  property provable by re-parsing the answer and checking each snippet
  against the corpus it came from, no LLM judge required — see
  `is_extractive_answer_verbatim()` and `evaluate_extractive_faithfulness()`.
- **"generated" mode has no such guarantee.** A chat model asked to write a
  new answer from retrieved context can add an unsupported detail; checking
  that requires a second model acting as an NLI-style judge
  (`judge_faithfulness()`), which needs OPENAI_API_KEY — same "not run
  automatically, honest about it when missing" pattern as
  extraction_critic_eval.py / retrieval_eval.py's embeddings tiers. See
  `evaluate_generated_faithfulness()`.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field

import rag_engine
from llm_client import LLMClient

FAITHFULNESS_JUDGE_SYSTEM_PROMPT = """You are an NLI-style faithfulness judge for a wiki chat assistant.

Given SOURCE PASSAGES and a candidate ANSWER, decide whether every factual
claim in the ANSWER is entailed by (directly supported by) the SOURCE
PASSAGES. General framing sentences ("Based on the wiki...", "In summary...")
are not factual claims and should be ignored.

Return ONLY JSON: {"faithful": true|false, "unsupported_claims": ["<claim text>", ...]}
An empty unsupported_claims list is required when faithful is true."""

_SNIPPET_BLOCK_RE = re.compile(r"\*\*(.+?) — (.+?)\*\*\n(.*?)(?=\n\n\*\*|\Z)", re.DOTALL)


@dataclass(frozen=True)
class FaithfulnessVerdict:
    faithful: bool
    unsupported_claims: list[str] = field(default_factory=list)
    parse_error: str | None = None


def judge_faithfulness(answer: str, sources_text: str, llm) -> FaithfulnessVerdict:
    """Ask an LLM judge whether `answer` is entailed by `sources_text`.
    A malformed judge response degrades to faithful=False with parse_error
    set — an unparsable verdict should never be silently counted as a pass."""
    raw = llm.generate_response(
        f"SOURCE PASSAGES:\n{sources_text}\n\n---\n\nANSWER:\n{answer}",
        FAITHFULNESS_JUDGE_SYSTEM_PROMPT,
        temperature=0.0,
    )
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        return FaithfulnessVerdict(faithful=False, parse_error="judge response did not contain JSON")
    try:
        data = json.loads(match.group())
    except json.JSONDecodeError as exc:
        return FaithfulnessVerdict(faithful=False, parse_error=f"judge response was not valid JSON: {exc}")

    faithful = bool(data.get("faithful", False))
    unsupported = data.get("unsupported_claims", [])
    if not isinstance(unsupported, list):
        unsupported = []
    return FaithfulnessVerdict(faithful=faithful, unsupported_claims=[str(c) for c in unsupported])


def is_extractive_answer_verbatim(answer: str, corpus: list[rag_engine.Passage]) -> bool:
    """Structural check: every `**title — heading**\\n<snippet>` block in an
    extractive answer must be a verbatim (optionally `…`-truncated) prefix
    of some passage's text in the corpus it was drawn from."""
    blocks = _SNIPPET_BLOCK_RE.findall(answer)
    if not blocks:
        return False

    for title, heading, snippet in blocks:
        snippet = snippet.strip()
        truncated = snippet.endswith("…")
        if truncated:
            snippet = snippet[:-1]

        matches = [
            passage
            for passage in corpus
            if passage.title == title.strip() and passage.heading == heading.strip()
        ]
        if not any(passage.text.startswith(snippet) for passage in matches):
            return False
    return True


@dataclass(frozen=True)
class ExtractiveFaithfulnessReport:
    total: int
    verbatim_count: int

    @property
    def verbatim_rate(self) -> float:
        return self.verbatim_count / self.total if self.total else float("nan")


def evaluate_extractive_faithfulness(queries: list[str], docs_dir) -> ExtractiveFaithfulnessReport:
    """Run answer_question() with no LLM (forcing extractive mode) over
    `queries` and structurally verify every answer is verbatim-grounded.
    No API key needed — this is checking rag_engine's own code behavior,
    not a model's judgment."""
    corpus = rag_engine.build_corpus(docs_dir)
    no_llm = LLMClient(api_key="")

    verbatim_count = 0
    total = 0
    for query in queries:
        result = rag_engine.answer_question(query, docs_dir=docs_dir, llm=no_llm)
        if result["mode"] != "extractive":
            continue
        total += 1
        if is_extractive_answer_verbatim(result["answer"], corpus):
            verbatim_count += 1

    return ExtractiveFaithfulnessReport(total=total, verbatim_count=verbatim_count)


@dataclass(frozen=True)
class GeneratedFaithfulnessReport:
    total: int
    faithful_count: int
    parse_errors: int

    @property
    def hallucination_rate(self) -> float:
        return 1.0 - (self.faithful_count / self.total) if self.total else float("nan")


def evaluate_generated_faithfulness(queries: list[str], docs_dir, llm: LLMClient) -> GeneratedFaithfulnessReport:
    """Run answer_question() in generated mode (requires an available llm)
    and judge each answer's faithfulness with a second LLM call."""
    corpus = rag_engine.build_corpus(docs_dir)

    faithful_count = 0
    parse_errors = 0
    total = 0
    for query in queries:
        result = rag_engine.answer_question(query, docs_dir=docs_dir, llm=llm)
        if result["mode"] != "generated":
            continue
        total += 1

        scored = rag_engine.retrieve_hybrid(query, corpus, llm=llm)
        sources_text = "\n\n".join(item.passage.text for item in scored)
        verdict = judge_faithfulness(result["answer"], sources_text, llm)
        if verdict.parse_error:
            parse_errors += 1
        if verdict.faithful:
            faithful_count += 1

    return GeneratedFaithfulnessReport(total=total, faithful_count=faithful_count, parse_errors=parse_errors)


if __name__ == "__main__":
    from retrieval_eval_dataset import QUERIES
    from trust_eval_dataset import load_trust_eval_dataset

    query_texts = [q.text for q in QUERIES]

    # Build a small on-disk compiled-doc corpus from the trust eval dataset's
    # grounded claims, same repurposing retrieval_eval_dataset.py does.
    import tempfile
    from pathlib import Path

    dataset = load_trust_eval_dataset()
    with tempfile.TemporaryDirectory() as tmp:
        docs_dir = Path(tmp)
        for group in dataset.claim_groups:
            body = "\n\n".join(f"## {claim.id}\n\n{claim.quote}" for claim in group.claims)
            (docs_dir / f"{group.id}.md").write_text(f"---\ntitle: {group.subject}\n---\n\n{body}\n", encoding="utf-8")

        print("=== Extractive mode: structural verbatim check (no API key needed) ===")
        extractive_report = evaluate_extractive_faithfulness(query_texts, docs_dir)
        print(
            f"verbatim={extractive_report.verbatim_count}/{extractive_report.total} "
            f"({extractive_report.verbatim_rate:.2f})"
        )

        client = LLMClient()
        if client.available:
            print("\n=== Generated mode: LLM-judge faithfulness ===")
            generated_report = evaluate_generated_faithfulness(query_texts, docs_dir, client)
            print(
                f"faithful={generated_report.faithful_count}/{generated_report.total} "
                f"hallucination_rate={generated_report.hallucination_rate:.2f} "
                f"(judge parse errors: {generated_report.parse_errors})"
            )
        else:
            print(
                "\nNo OPENAI_API_KEY configured (.env) — skipping generated-mode faithfulness "
                "(it requires both a chat model to generate answers and a judge to score them)."
            )
