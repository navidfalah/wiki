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
"""

from __future__ import annotations

import re
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


@dataclass(frozen=True)
class RedactionPolicy:
    categories: frozenset[str] = DEFAULT_CATEGORIES

    def with_categories(self, categories: frozenset[str]) -> "RedactionPolicy":
        return RedactionPolicy(categories=categories)


DEFAULT_POLICY = RedactionPolicy()
STRICT_POLICY = RedactionPolicy(categories=STRICT_CATEGORIES)


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


def redact_text(text: str, policy: RedactionPolicy = DEFAULT_POLICY) -> RedactionResult:
    """Redact every match of policy's categories, replacing each with a
    stable per-value placeholder (repeated occurrences of the same value
    in one call get the same placeholder, e.g. two mentions of the same
    phone number both become "[PHONE_NUMBER_1]") so the redacted text
    keeps whatever referential structure the original had, without ever
    exposing the value itself.
    """
    all_matches: list[tuple[int, int, str, str]] = []  # (start, end, category, value)
    for category in policy.categories:
        for match in _find_matches(text, category):
            all_matches.append((match.start(), match.end(), category, match.group()))

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
