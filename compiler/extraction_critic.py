"""Grounded, self-verifying extraction — a critic pass over synthesized pages.

synthesize_topic_wiki_pages() (synthesizer.py) asks an LLM to write a wiki
page from a set of raw source chunks in one shot. Nothing stops that model
from adding a plausible-sounding detail that isn't actually in any source
chunk — a fabricated date, an invented number, an attribution to the wrong
person. This module adds a second LLM pass, run over the *draft* the first
pass already produced: given the same source excerpts and the draft body,
identify any sentence that asserts a specific fact the sources don't
support, and deterministically strip those sentences before the page is
written to disk.

Two things are evaluated separately, on purpose:

- The **mechanism** (prompt construction, JSON parsing, sentence removal,
  graceful fallback on a malformed response) is fully covered by
  tests/test_extraction_critic.py using a FakeLLM, same pattern as
  tests/test_multimedia_pipeline.py — no API key required.
- The **quality** of the critic's judgment (does gpt-4o-mini actually catch
  real hallucinations, and does it avoid false-flagging correct claims) can
  only be measured against a real model. extraction_critic_eval.py holds a
  small hand-labeled fixture corpus for exactly that, and reports precision/
  recall — but it requires OPENAI_API_KEY and is not run automatically; see
  documentation/24-extraction-critic.md for why and how to run it once a
  key is available.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field

from llm_client import LLMClient

CRITIC_SYSTEM_PROMPT = """You are a fact-checking critic for a personal wiki compiler.

You will be given SOURCE EXCERPTS (raw material a wiki page was synthesized
from) and a DRAFT page written from those excerpts by another model.

Find every sentence in the DRAFT that asserts a specific, checkable fact —
a number, a date, a name, an attribution, a causal claim — that is NOT
supported by the SOURCE EXCERPTS. Ignore section headings, bullet-list
formatting, and general framing sentences that don't assert a new fact.
A sentence that merely rephrases or summarizes something the excerpts do
say is grounded, not flagged, even if the wording differs.

Return ONLY JSON in this exact shape, with no commentary:
{"flagged": [{"sentence": "<verbatim sentence copied from the draft>", "reason": "<one line: what's unsupported>"}]}

If every factual sentence in the draft is supported by the excerpts, return:
{"flagged": []}"""


@dataclass(frozen=True)
class FlaggedSentence:
    sentence: str
    reason: str
    removed: bool  # False if the sentence couldn't be matched verbatim in the draft


@dataclass(frozen=True)
class CriticReport:
    flagged: list[FlaggedSentence] = field(default_factory=list)
    parse_error: str | None = None  # set when the critic's response wasn't valid JSON

    @property
    def is_clean(self) -> bool:
        return not self.flagged and self.parse_error is None


def _build_critic_prompt(source_text: str, draft_body: str) -> str:
    return (
        f"SOURCE EXCERPTS:\n{source_text}\n\n"
        f"---\n\n"
        f"DRAFT:\n{draft_body}\n\n"
        f"---\n\n"
        f"List every unsupported factual sentence in the DRAFT, per the format above."
    )


def _parse_critic_response(raw: str) -> tuple[list[dict], str | None]:
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        return [], "critic response did not contain a JSON object"
    try:
        data = json.loads(match.group())
    except json.JSONDecodeError as exc:
        return [], f"critic response was not valid JSON: {exc}"

    flagged = data.get("flagged")
    if not isinstance(flagged, list):
        return [], "critic response's 'flagged' field was missing or not a list"
    return flagged, None


def review_draft_for_grounding(
    source_text: str,
    draft_body: str,
    llm: LLMClient,
) -> CriticReport:
    """Ask the critic LLM which sentences in draft_body aren't grounded in
    source_text. Never raises on a malformed model response — a critic pass
    that fails should not take down the whole compile; it degrades to "no
    flags found" with parse_error set so the caller can log/count it."""
    if not draft_body.strip() or not source_text.strip():
        return CriticReport()

    raw = llm.generate_response(
        _build_critic_prompt(source_text, draft_body),
        CRITIC_SYSTEM_PROMPT,
        temperature=0.0,
    )
    entries, parse_error = _parse_critic_response(raw)
    if parse_error:
        return CriticReport(parse_error=parse_error)

    flagged: list[FlaggedSentence] = []
    for entry in entries:
        sentence = str(entry.get("sentence", "")).strip()
        reason = str(entry.get("reason", "")).strip()
        if not sentence:
            continue
        flagged.append(FlaggedSentence(sentence=sentence, reason=reason, removed=sentence in draft_body))

    return CriticReport(flagged=flagged)


def apply_critic_pass(
    source_text: str,
    draft_body: str,
    llm: LLMClient,
) -> tuple[str, CriticReport]:
    """Run the critic and strip every sentence it could match verbatim from
    draft_body. A flagged sentence the critic paraphrased instead of quoting
    verbatim is reported (removed=False) but left in place rather than
    guessed at — a wrong removal is worse than a missed one."""
    report = review_draft_for_grounding(source_text, draft_body, llm)
    if not report.flagged:
        return draft_body, report

    cleaned = draft_body
    for item in report.flagged:
        if item.removed:
            cleaned = cleaned.replace(item.sentence, "").strip()

    cleaned = re.sub(r"[ \t]+\n", "\n", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip(), report
