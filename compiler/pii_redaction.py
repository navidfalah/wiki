"""PII/privacy redaction before text leaves the machine for an LLM call.

Unlike every other task-track module so far, this one is deliberately
*not* LLM-based — it's a fully offline, dependency-free regex pass, which
is the point: it has to run before OPENAI_API_KEY is ever used, so it
can't itself depend on a network call. "Local-model fallback for fully
offline use" (the original R&D framing) describes this module itself, not
something layered on top of it.

A real design tension, named rather than glossed over: this repo's whole
premise is a personal wiki built partly from email, and the entity
resolution work (task #6) specifically wants names and email addresses
visible so it can resolve "Mira Chen" / "Mira" / "mira.chen@auroralabs.example"
into one entity. Redacting every email address and name by default would
gut both the email-knowledge-engine feature and task #6. So this module's
default policy only redacts categories that are simultaneously
high-sensitivity and low-value to knowledge extraction — SSNs, credit card
numbers, API keys/secrets, phone numbers, IPv4 addresses — and leaves names
and email addresses untouched unless a caller explicitly opts into a
stricter policy, with that tradeoff documented in
documentation/30-pii-redaction.md rather than assumed.

**Optional NER tier.** A 2025/2026 literature pass (documentation/30) found
a real regex-only recall gap: NER catches free-text PII mentions (a
location named in a sentence, e.g.) that have no fixed pattern to match
against. This module stays regex-only, dependency-free, and always-available
by default — but redact_text() accepts an optional `ner_backend` callable
so a caller who has spaCy installed can plug in an NER pass without this
module gaining a hard dependency on it. See `load_spacy_ner_backend()`.
Deliberately does NOT add a person-name NER category — that would silently
undercut the name-visibility tradeoff above.
"""

from __future__ import annotations

import re
from collections.abc import Callable
from dataclasses import dataclass, field

_PATTERNS: dict[str, re.Pattern[str]] = {
    "ssn": re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
    # \d then 12-18 more (optional-separator + digit) units: always starts
    # and ends on a digit (13-19 digits total), never swallowing a trailing
    # space/hyphen the way `(?:\d[ -]?){13,16}` would.
    "credit_card": re.compile(r"\b\d(?:[ -]?\d){12,18}\b"),
    "phone_number": re.compile(r"\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b"),
    # Either a common vendor-prefixed key (sk-/pk-/rk-...) or a generic
    # 32+ char token that mixes letters and digits (typical of hex/base64
    # secrets) — the mixed-character requirement avoids false-positiving on
    # long plain-alphabetic words or hyphenated phrases.
    "api_key": re.compile(
        r"\b(?:sk|pk|rk)-[A-Za-z0-9]{16,}\b"
        r"|\b(?=[A-Za-z0-9_-]{32,}\b)(?=[A-Za-z0-9_-]*[0-9])(?=[A-Za-z0-9_-]*[A-Za-z])[A-Za-z0-9_-]{32,}\b"
    ),
    "ipv4_address": re.compile(r"\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b"),
    "email": re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b"),
}

# Categories a credit-card-shaped number's Luhn check must pass to count —
# otherwise "13-16 digit runs" false-positives on things like long order
# numbers or phone numbers with area codes concatenated.
_DIGITS_ONLY_RE = re.compile(r"\D")


def _luhn_valid(digits: str) -> bool:
    total = 0
    parity = len(digits) % 2
    for index, char in enumerate(digits):
        digit = int(char)
        if index % 2 == parity:
            digit *= 2
            if digit > 9:
                digit -= 9
        total += digit
    return total % 10 == 0


DEFAULT_CATEGORIES = frozenset({"ssn", "credit_card", "api_key", "phone_number", "ipv4_address"})
STRICT_CATEGORIES = frozenset(DEFAULT_CATEGORIES | {"email"})

# Categories only an NER backend can find — regex can't recognize "Austin"
# or "the Berlin office" as a location without a fixed pattern. Deliberately
# NOT including a person-name category: this module's whole design tradeoff
# (see module docstring) is leaving names visible for entity resolution, and
# an NER tier that redacted names by default would silently break that.
NER_CATEGORIES = frozenset({"location"})


@dataclass(frozen=True)
class RedactionPolicy:
    categories: frozenset[str] = DEFAULT_CATEGORIES

    def with_categories(self, categories: frozenset[str]) -> "RedactionPolicy":
        return RedactionPolicy(categories=categories)


DEFAULT_POLICY = RedactionPolicy()
STRICT_POLICY = RedactionPolicy(categories=STRICT_CATEGORIES)
# Adds the optional NER-only "location" category on top of STRICT_POLICY.
# Still does nothing unless a caller also passes an ner_backend to
# redact_text() — this policy alone doesn't pull in a dependency.
NER_AUGMENTED_POLICY = RedactionPolicy(categories=STRICT_CATEGORIES | NER_CATEGORIES)


@dataclass(frozen=True)
class PIIFinding:
    category: str
    original: str
    placeholder: str
    start: int
    end: int


@dataclass(frozen=True)
class RedactionResult:
    text: str
    findings: list[PIIFinding] = field(default_factory=list)

    @property
    def had_findings(self) -> bool:
        return bool(self.findings)


def _find_matches(text: str, category: str) -> list[re.Match[str]]:
    pattern = _PATTERNS[category]
    matches = list(pattern.finditer(text))
    if category == "credit_card":
        matches = [m for m in matches if _luhn_valid(_DIGITS_ONLY_RE.sub("", m.group()))]
    return matches


# An NER backend takes text and returns (start, end, category, value) spans —
# the same shape redact_text() already builds from regex matches, so NER
# hits merge into the exact same sort/placeholder/overlap-resolution logic
# without redact_text() needing to know or care where a span came from.
NerBackend = Callable[[str], list[tuple[int, int, str, str]]]

_SPACY_LABEL_TO_CATEGORY = {"GPE": "location", "LOC": "location"}


def load_spacy_ner_backend(model: str = "en_core_web_sm") -> NerBackend | None:
    """Build an NerBackend from spaCy, or return None if spaCy (the pip
    package) or the requested model isn't installed — never raises, so a
    caller can do `backend = load_spacy_ner_backend(); redact_text(text,
    policy, ner_backend=backend)` unconditionally and get regex-only
    behavior on a machine without spaCy, same graceful-degradation shape as
    entity_resolution.py's optional embedding/LLM tiers.

    Not exercised against a real spaCy model in this environment (no NER
    library installed here — see documentation/30-pii-redaction.md); the
    mechanism is tested via a fake NerBackend, the same honest split as
    every other live-model-dependent tier in this project.
    """
    try:
        import spacy
    except ImportError:
        return None
    try:
        nlp = spacy.load(model)
    except OSError:
        return None

    def backend(text: str) -> list[tuple[int, int, str, str]]:
        doc = nlp(text)
        spans = []
        for ent in doc.ents:
            category = _SPACY_LABEL_TO_CATEGORY.get(ent.label_)
            if category is not None:
                spans.append((ent.start_char, ent.end_char, category, ent.text))
        return spans

    return backend


def redact_text(
    text: str, policy: RedactionPolicy = DEFAULT_POLICY, *, ner_backend: NerBackend | None = None
) -> RedactionResult:
    """Redact every match of policy's categories, replacing each with a
    stable per-value placeholder (repeated occurrences of the same value
    in one call get the same placeholder, e.g. two mentions of the same
    phone number both become "[PHONE_NUMBER_1]") so the redacted text
    keeps whatever referential structure the original had, without ever
    exposing the value itself.
    """
    regex_categories = policy.categories - NER_CATEGORIES
    ner_categories = policy.categories & NER_CATEGORIES

    all_matches: list[tuple[int, int, str, str]] = []  # (start, end, category, value)
    for category in regex_categories:
        for match in _find_matches(text, category):
            all_matches.append((match.start(), match.end(), category, match.group()))

    if ner_categories and ner_backend is not None:
        for start, end, category, value in ner_backend(text):
            if category in ner_categories:
                all_matches.append((start, end, category, value))

    all_matches.sort(key=lambda m: m[0])

    placeholder_by_value: dict[tuple[str, str], str] = {}
    counters: dict[str, int] = {}
    findings: list[PIIFinding] = []

    result_parts: list[str] = []
    cursor = 0
    last_end = -1
    for start, end, category, value in all_matches:
        if start < last_end:
            continue  # overlapping match (e.g. api_key's catch-all vs a more specific pattern) — first wins
        key = (category, value)
        placeholder = placeholder_by_value.get(key)
        if placeholder is None:
            counters[category] = counters.get(category, 0) + 1
            placeholder = f"[{category.upper()}_{counters[category]}]"
            placeholder_by_value[key] = placeholder

        result_parts.append(text[cursor:start])
        result_parts.append(placeholder)
        findings.append(PIIFinding(category=category, original=value, placeholder=placeholder, start=start, end=end))
        cursor = end
        last_end = end

    result_parts.append(text[cursor:])
    return RedactionResult(text="".join(result_parts), findings=findings)
