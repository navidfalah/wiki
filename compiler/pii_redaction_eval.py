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

from pii_redaction import (
    NER_AUGMENTED_POLICY,
    STRICT_CATEGORIES,
    NerBackend,
    RedactionPolicy,
    load_spacy_ner_backend,
    redact_text,
)

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
    Fixture(
        "luhn_invalid_number_not_flagged_as_card",
        # Same shape as the famous 4111... Visa test number, last digit
        # changed so the Luhn checksum fails — must NOT be flagged, since
        # the point of Luhn-gating credit_card is precisely to reject
        # digit runs that merely look card-shaped.
        "Reference number on the packing slip was 4111 1111 1111 1112, unrelated to payment.",
        frozenset(),
    ),
    Fixture(
        "two_distinct_ssns_in_one_note",
        "Dependent coverage form lists primary SSN 123-45-6789 and spouse SSN 987-65-4321.",
        frozenset({("ssn", "123-45-6789"), ("ssn", "987-65-4321")}),
    ),
    Fixture(
        "vendor_token_without_sk_prefix",
        # A GitHub-style personal access token — no sk-/pk-/rk- prefix, so
        # this only gets caught by the generic 32+ char mixed-alnum branch
        # of the api_key pattern, not the vendor-prefix branch the other
        # api_key fixture exercises.
        "CI failed after the token ghp_9f8e7d6c5b4a3210fedcba9876543210ab expired overnight.",
        frozenset({("api_key", "ghp_9f8e7d6c5b4a3210fedcba9876543210ab")}),
    ),
    Fixture(
        "ipv4_embedded_in_a_url",
        "Dashboard is reachable at http://192.168.1.100:8080/status during the incident.",
        frozenset({("ipv4_address", "192.168.1.100")}),
    ),
    Fixture(
        "obfuscated_email_not_detected",
        # A documented, known false negative (like order_number_false_positive
        # documents a known false positive above): the email regex requires
        # a literal '@' and '.', so "at"/"dot" spelled-out obfuscation slips
        # through entirely. Stated honestly rather than silently assumed —
        # see documentation/30-pii-redaction.md.
        "Reach me at mira dot chen at auroralabs dot example if the ticket needs escalation.",
        frozenset(),
    ),
]

# Kept separate from FIXTURES (not scored by the always-offline run_eval()
# call in __main__ below): these require the optional NER tier to pass at
# all, so mixing them into FIXTURES would turn a real false-negative *by
# design* (no NER backend available) into a misleading permanent failure of
# the regex-only headline numbers. See "Optional NER tier" in
# documentation/30-pii-redaction.md.
NER_ONLY_FIXTURES: list[Fixture] = [
    Fixture(
        "location_mention_no_fixed_pattern",
        # No email/phone/SSN-shaped substring here at all -- a location
        # mentioned in free text has no fixed pattern for regex to match
        # against, which is exactly the recall gap the literature review
        # named (regex-only vs. regex+NER hybrid).
        "The relay hardware ships from our Austin warehouse before reaching customers.",
        frozenset({("location", "Austin")}),
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


def run_eval(
    fixtures: list[Fixture] = FIXTURES,
    policy: RedactionPolicy = ALL_CATEGORIES_POLICY,
    *,
    ner_backend: NerBackend | None = None,
) -> EvalReport:
    true_positives = 0
    false_positives = 0
    false_negatives = 0
    fp_examples: list[tuple[str, str, str]] = []
    fn_examples: list[tuple[str, str, str]] = []

    for fixture in fixtures:
        result = redact_text(fixture.text, policy, ner_backend=ner_backend)
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

    print("\n=== Optional NER tier (location category) ===")
    ner_backend = load_spacy_ner_backend()
    if ner_backend is None:
        print(
            "No spaCy installed in this environment — NER_ONLY_FIXTURES not run. "
            "See 'Optional NER tier' in documentation/30-pii-redaction.md for how "
            "to install spaCy and reproduce these numbers."
        )
    else:
        ner_report = run_eval(NER_ONLY_FIXTURES, NER_AUGMENTED_POLICY, ner_backend=ner_backend)
        print(f"precision={ner_report.precision:.2f} recall={ner_report.recall:.2f}")
        print(
            f"true_positives={ner_report.true_positives} "
            f"false_positives={ner_report.false_positives} "
            f"false_negatives={ner_report.false_negatives}"
        )
