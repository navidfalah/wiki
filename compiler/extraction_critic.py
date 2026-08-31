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


DEFAULT_SAMPLE_TEMPERATURE = 0.3


def review_draft_for_grounding(
    source_text: str,
    draft_body: str,
    llm: LLMClient,
    *,
    extra_system_context: str = "",
    samples: int = 1,
    sample_temperature: float = DEFAULT_SAMPLE_TEMPERATURE,
) -> CriticReport:
    """Ask the critic LLM which sentences in draft_body aren't grounded in
    source_text. Never raises on a malformed model response — a critic pass
    that fails should not take down the whole compile; it degrades to "no
    flags found" with parse_error set so the caller can log/count it.

    extra_system_context, when non-empty, is appended to CRITIC_SYSTEM_PROMPT
    — active_learning.py's render_fewshot_block() is the intended source, so
    a human-reviewed hallucination pattern sharpens the critic's judgment the
    same way it already sharpens extraction.

    samples=1 (default) makes one call at temperature=0.0 — deterministic,
    cheapest, matches the historical behavior. samples>1 runs the critic
    multiple times at sample_temperature (self-consistency: a single flag
    from one noisy pass is a false positive; a sentence a *majority* of
    independent passes agree is unsupported is a much stronger signal). This
    only makes sense above temperature 0 — sampling a deterministic call
    repeatedly would just return the same answer every time for 3x the cost,
    so sample_temperature defaults to a small non-zero value rather than 0.0
    when samples>1.
    """
    if not draft_body.strip() or not source_text.strip():
        return CriticReport()

    system_prompt = CRITIC_SYSTEM_PROMPT
    if extra_system_context:
        system_prompt = f"{system_prompt}\n\n{extra_system_context}"

    prompt = _build_critic_prompt(source_text, draft_body)

    if samples <= 1:
        raw = llm.generate_response(prompt, system_prompt, temperature=0.0)
        entries, parse_error = _parse_critic_response(raw)
        if parse_error:
            return CriticReport(parse_error=parse_error)
        flagged = _entries_to_flagged(entries, draft_body)
        return CriticReport(flagged=flagged)

    return _review_with_self_consistency(prompt, system_prompt, draft_body, llm, samples, sample_temperature)


def _entries_to_flagged(entries: list[dict], draft_body: str) -> list[FlaggedSentence]:
    flagged: list[FlaggedSentence] = []
    for entry in entries:
        sentence = str(entry.get("sentence", "")).strip()
        reason = str(entry.get("reason", "")).strip()
        if not sentence:
            continue
        flagged.append(FlaggedSentence(sentence=sentence, reason=reason, removed=sentence in draft_body))
    return flagged


def _review_with_self_consistency(
    prompt: str,
    system_prompt: str,
    draft_body: str,
    llm: LLMClient,
    samples: int,
    sample_temperature: float,
) -> CriticReport:
    votes: dict[str, int] = {}
    reason_by_sentence: dict[str, str] = {}
    parse_errors: list[str] = []
    successful_passes = 0

    for _ in range(samples):
        raw = llm.generate_response(prompt, system_prompt, temperature=sample_temperature)
        entries, parse_error = _parse_critic_response(raw)
        if parse_error:
            parse_errors.append(parse_error)
            continue
        successful_passes += 1
        seen_this_pass: set[str] = set()
        for entry in entries:
            sentence = str(entry.get("sentence", "")).strip()
            if not sentence or sentence in seen_this_pass:
                continue
            seen_this_pass.add(sentence)
            votes[sentence] = votes.get(sentence, 0) + 1
            reason_by_sentence.setdefault(sentence, str(entry.get("reason", "")).strip())

    if successful_passes == 0:
        return CriticReport(parse_error="; ".join(parse_errors) or "all critic samples failed to parse")

    majority_threshold = successful_passes / 2
    flagged = [
        FlaggedSentence(
            sentence=sentence,
            reason=reason_by_sentence.get(sentence, ""),
            removed=sentence in draft_body,
        )
        for sentence, count in votes.items()
        if count > majority_threshold
    ]
    return CriticReport(flagged=flagged)


def apply_critic_pass(
    source_text: str,
    draft_body: str,
    llm: LLMClient,
    *,
    extra_system_context: str = "",
    samples: int = 1,
    sample_temperature: float = DEFAULT_SAMPLE_TEMPERATURE,
) -> tuple[str, CriticReport]:
    """Run the critic and strip every sentence it could match verbatim from
    draft_body. A flagged sentence the critic paraphrased instead of quoting
    verbatim is reported (removed=False) but left in place rather than
    guessed at — a wrong removal is worse than a missed one.

    samples/sample_temperature: see review_draft_for_grounding()."""
    report = review_draft_for_grounding(
        source_text,
        draft_body,
        llm,
        extra_system_context=extra_system_context,
        samples=samples,
        sample_temperature=sample_temperature,
    )
    if not report.flagged:
        return draft_body, report

    cleaned = draft_body
    for item in report.flagged:
        if item.removed:
            cleaned = cleaned.replace(item.sentence, "").strip()

    cleaned = re.sub(r"[ \t]+\n", "\n", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip(), report


DEFAULT_REGENERATE_THRESHOLD = 0.2


def should_regenerate(
    original_body: str, cleaned_body: str, threshold: float = DEFAULT_REGENERATE_THRESHOLD
) -> bool:
    """True when stripping flagged sentences removed more than `threshold`
    of the draft's length — a signal the draft was heavily unsupported, not
    just one stray fabricated detail, and worth a fresh regeneration attempt
    rather than shipping a mutilated page. Stripping-only (apply_critic_pass
    alone) can leave a draft with dangling transitions or a section that no
    longer makes sense once its supporting sentence is gone; a page that
    lost a fifth of its content to the critic is exactly that case.
    """
    if not original_body:
        return False
    removed_fraction = 1 - (len(cleaned_body) / len(original_body))
    return removed_fraction > threshold


def build_regeneration_feedback(report: CriticReport) -> str:
    """Turn a CriticReport's flagged sentences into system-prompt guidance
    for a regeneration attempt — the same "feed the failure back in and try
    again" shape as Self-RAG/Corrective RAG's regenerate-on-failed-grounding
    loop, applied here as a single bounded retry (see should_regenerate())
    rather than an open-ended one, to keep the extra LLM cost predictable.
    """
    if not report.flagged:
        return ""
    lines = [
        f'- "{item.sentence}" ({item.reason})' if item.reason else f'- "{item.sentence}"'
        for item in report.flagged
    ]
    return (
        "A fact-checking pass over a previous draft found the following claims were NOT "
        "supported by the source excerpts. Do not repeat these claims, or anything "
        "similar in substance, in this draft:\n" + "\n".join(lines)
    )
