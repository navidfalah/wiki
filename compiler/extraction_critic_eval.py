"""Live-model evaluation of the extraction critic's judgment quality.

extraction_critic.py's *mechanism* (prompt building, JSON parsing, verbatim
sentence removal, graceful fallback) is fully covered by
tests/test_extraction_critic.py with a FakeLLM — no API key needed. What
that can't tell you is whether a real model is actually good at catching
hallucinations, and whether it avoids flagging sentences that ARE grounded.
That's what this script measures.

FIXTURES below are hand-authored (source_text, draft_body, expected flagged
substrings) trios in this repo's Aurora Labs/MeshSync domain voice — each
draft mixes grounded sentences with 1-2 injected hallucinations of a kind a
synthesis LLM plausibly produces (a fabricated version number, an invented
date, a wrong attribution, a made-up metric). This is a small, hand-labeled
pilot set in the same spirit as data/trust_eval_dataset.json — useful for a
first read on critic quality, not a large-scale benchmark.

Usage:
    cd compiler && python extraction_critic_eval.py

Requires OPENAI_API_KEY (or OPENAI_BASE_URL pointed at a compatible
endpoint) in .env — same requirement as the rest of the compiler. Without
one, this prints a message and exits without attempting API calls; it is
deliberately NOT part of `pytest` for the same reason main.py's actual
compile isn't run in CI without a key.
"""

from __future__ import annotations

from dataclasses import dataclass

from extraction_critic import review_draft_for_grounding
from llm_client import LLMClient


@dataclass(frozen=True)
class Fixture:
    name: str
    source_text: str
    draft_body: str
    expected_flagged_substrings: list[str]  # hallucinated sentences the critic should catch
    expected_clean_substrings: list[str]  # grounded sentences the critic should NOT flag


FIXTURES: list[Fixture] = [
    Fixture(
        name="fabricated_version_number",
        source_text=(
            "Confirmed on the bench. The relay radio's sleep timer resets on every "
            "received packet, so a busy mesh never lets it sleep. Draft fix in MESH-118 "
            "drops radio wake time from 400ms to 80ms per hop."
        ),
        draft_body=(
            "## MeshSync relay battery drain\n\n"
            "The relay radio's sleep timer resets on every received packet, preventing "
            "sleep in a busy mesh. The fix, shipped in firmware version 4.2.0, drops "
            "radio wake time from 400ms to 80ms per hop."
        ),
        expected_flagged_substrings=["firmware version 4.2.0"],
        expected_clean_substrings=["sleep timer resets on every received packet"],
    ),
    Fixture(
        name="fabricated_date_and_attribution",
        source_text=(
            "Default: every 15 minutes when mesh is active. Configurable 5 min - 24 hr "
            "via companion app. Note: kickoff notes mentioned hourly default; this spec "
            "changes to 15 min for beta feedback."
        ),
        draft_body=(
            "## Nova Widget read interval\n\n"
            "The default read interval is 15 minutes, configurable from 5 minutes to 24 "
            "hours via the companion app. Jonah Park changed this from an hourly default "
            "on March 3rd after a customer complaint."
        ),
        expected_flagged_substrings=["Jonah Park changed this from an hourly default on March 3rd"],
        expected_clean_substrings=["default read interval is 15 minutes"],
    ),
    Fixture(
        name="fabricated_metric",
        source_text=(
            "CR2032 nominal 220mAh (not 240 - datasheet variance). Read interval: 15 min "
            "(spec authoritative). Total ~0.19 mAh/day -> ~18 months (engineering claim)."
        ),
        draft_body=(
            "## Nova Widget battery budget\n\n"
            "Using a CR2032 cell (220mAh nominal) at the spec-authoritative 15-minute read "
            "interval, engineering estimates roughly 18 months of runtime at 0.19 mAh/day. "
            "Field testing across 40 beta units confirmed an average of 19.4 months."
        ),
        expected_flagged_substrings=["Field testing across 40 beta units confirmed an average of 19.4 months"],
        expected_clean_substrings=["roughly 18 months of runtime"],
    ),
    Fixture(
        name="fully_grounded_no_hallucination",
        source_text=(
            "Herbal preset constant aligned to 7:00 (was 5:00 in marketing copy - "
            "CONTRADICTION fixed in firmware only)."
        ),
        draft_body=(
            "## TeaBuddy herbal preset timing\n\n"
            "The firmware's herbal preset constant is now 7:00, correcting an earlier "
            "mismatch with marketing copy that listed 5:00. The fix has not yet propagated "
            "back to marketing materials."
        ),
        expected_flagged_substrings=[],
        expected_clean_substrings=["herbal preset constant is now 7:00"],
    ),
]


def _contains_any(haystack_sentences: list[str], needle: str) -> bool:
    return any(needle.lower() in sentence.lower() for sentence in haystack_sentences)


def run_eval(llm: LLMClient) -> None:
    true_positives = 0
    false_negatives = 0
    false_positives = 0

    for fixture in FIXTURES:
        report = review_draft_for_grounding(fixture.source_text, fixture.draft_body, llm)
        flagged_sentences = [f.sentence for f in report.flagged]

        print(f"\n=== {fixture.name} ===")
        if report.parse_error:
            print(f"  PARSE ERROR: {report.parse_error}")

        for expected in fixture.expected_flagged_substrings:
            hit = _contains_any(flagged_sentences, expected)
            print(f"  {'[hit] ' if hit else '[MISS]'} expected flag: {expected!r}")
            true_positives += int(hit)
            false_negatives += int(not hit)

        for expected_clean in fixture.expected_clean_substrings:
            wrongly_flagged = _contains_any(flagged_sentences, expected_clean)
            print(f"  {'[FALSE POSITIVE] ' if wrongly_flagged else '[ok] '}should stay clean: {expected_clean!r}")
            false_positives += int(wrongly_flagged)

    precision_denom = true_positives + false_positives
    recall_denom = true_positives + false_negatives
    precision = true_positives / precision_denom if precision_denom else float("nan")
    recall = true_positives / recall_denom if recall_denom else float("nan")

    print("\n=== Summary ===")
    print(f"true_positives={true_positives} false_negatives={false_negatives} false_positives={false_positives}")
    print(f"precision={precision:.2f} recall={recall:.2f}")


if __name__ == "__main__":
    client = LLMClient()
    if not client.available:
        print(
            "No OPENAI_API_KEY configured (.env) — skipping the live-model critic "
            "evaluation. This script measures judgment quality against a real model; "
            "the deterministic mechanism is already covered by "
            "tests/test_extraction_critic.py without a key."
        )
    else:
        run_eval(client)
