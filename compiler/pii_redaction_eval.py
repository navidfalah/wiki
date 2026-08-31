"""Precision/recall evaluation for pii_redaction.py's regex detectors.

Unlike every other evaluation script in this task series, this one needs
no API key at all — pii_redaction.py is deliberately offline-only (see its
module docstring), so its evaluation can be, too. FIXTURES below use
obviously-fake values in realistic Aurora Labs-style sentences (never real
PII), each hand-labeled with exactly which (category, value) pairs should
be found — including one deliberate hard case (a long alphanumeric order
number that isn't a secret) documenting a known false-positive class
honestly rather than avoiding it.

Run `python pii_redaction_eval.py` to reproduce the numbers in
documentation/30-pii-redaction.md.
"""

from __future__ import annotations

from dataclasses import dataclass

from pii_redaction import STRICT_CATEGORIES, RedactionPolicy, redact_text

ALL_CATEGORIES_POLICY = RedactionPolicy(categories=STRICT_CATEGORIES)


@dataclass(frozen=True)
class Fixture:
    name: str
    text: str
    expected: frozenset[tuple[str, str]]  # (category, exact matched value)


FIXTURES: list[Fixture] = [
    Fixture(
        "contact_line",
        "Contact Mira Chen at mira.chen@auroralabs.example or call 555-123-4567.",
        frozenset({("email", "mira.chen@auroralabs.example"), ("phone_number", "555-123-4567")}),
    ),
    Fixture(
        "ssn_in_hr_note",
        "New hire paperwork: SSN on file is 123-45-6789, start date next Monday.",
        frozenset({("ssn", "123-45-6789")}),
    ),
    Fixture(
        "server_ip_in_incident_notes",
        "MQTT broker unreachable at 192.168.1.100 since the rejoin storm began.",
        frozenset({("ipv4_address", "192.168.1.100")}),
    ),
    Fixture(
        "api_key_in_config_snippet",
        "Set OPENAI_API_KEY=sk-abcdef1234567890abcdef1234567890 in .env before compiling.",
        frozenset({("api_key", "sk-abcdef1234567890abcdef1234567890")}),
    ),
    Fixture(
        "test_card_in_billing_note",
        "Billing team used test card 4111 1111 1111 1111 to verify the checkout flow.",
        frozenset({("credit_card", "4111 1111 1111 1111")}),
    ),
    Fixture(
        "plain_technical_note_no_pii",
        "Rejoin storm mitigation triggers when the mesh exceeds 6 nodes; MeshSync logs RSSI and hop count.",
        frozenset(),
    ),
    Fixture(
        "order_number_false_positive",
        "Order number ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEF was shipped yesterday, not a secret.",
        frozenset({("api_key", "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEF")}),
    ),
    Fixture(
        "multiple_mentions_of_the_same_value",
        "Reach Jonah at jonah.park@auroralabs.example. CC jonah.park@auroralabs.example on the follow-up.",
        frozenset({("email", "jonah.park@auroralabs.example")}),
    ),
]


@dataclass(frozen=True)
class EvalReport:
    precision: float
    recall: float
    true_positives: int
    false_positives: int
    false_negatives: int
    false_positive_examples: list[tuple[str, str, str]]  # (fixture_name, category, value)
    false_negative_examples: list[tuple[str, str, str]]


def run_eval(fixtures: list[Fixture] = FIXTURES, policy: RedactionPolicy = ALL_CATEGORIES_POLICY) -> EvalReport:
    true_positives = 0
    false_positives = 0
    false_negatives = 0
    fp_examples: list[tuple[str, str, str]] = []
    fn_examples: list[tuple[str, str, str]] = []

    for fixture in fixtures:
        result = redact_text(fixture.text, policy)
        found = {(f.category, f.original) for f in result.findings}

        for hit in found & fixture.expected:
            true_positives += 1
        for extra in found - fixture.expected:
            false_positives += 1
            fp_examples.append((fixture.name, extra[0], extra[1]))
        for missed in fixture.expected - found:
            false_negatives += 1
            fn_examples.append((fixture.name, missed[0], missed[1]))

    precision = true_positives / (true_positives + false_positives) if (true_positives + false_positives) else float("nan")
    recall = true_positives / (true_positives + false_negatives) if (true_positives + false_negatives) else float("nan")

    return EvalReport(precision, recall, true_positives, false_positives, false_negatives, fp_examples, fn_examples)


if __name__ == "__main__":
    report = run_eval()
    print(f"precision={report.precision:.2f} recall={report.recall:.2f}")
    print(f"true_positives={report.true_positives} false_positives={report.false_positives} false_negatives={report.false_negatives}")
    if report.false_positive_examples:
        print("\nFalse positives:")
        for fixture_name, category, value in report.false_positive_examples:
            print(f"  [{fixture_name}] {category}: {value!r}")
    if report.false_negative_examples:
        print("\nFalse negatives:")
        for fixture_name, category, value in report.false_negative_examples:
            print(f"  [{fixture_name}] {category}: {value!r}")
