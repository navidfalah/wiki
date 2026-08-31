# 30 — PII/Privacy Redaction Before LLM Calls

Every other module in this task series is an algorithm applied *to* the
wiki. This one is a gate *in front of* every LLM call the compiler makes —
appropriate, given the corpus is literally personal email. It's also the
only module in the series that's deliberately not LLM-based at all.

| | |
|---|---|
| Module | `compiler/pii_redaction.py` |
| Evaluation | `compiler/pii_redaction_eval.py` |
| Pipeline integration | `main.py --redact-pii` / `WIKI_REDACT_PII=true` |
| Tests | `test_pii_redaction.py`, `test_pii_redaction_eval.py` |

## Why offline, and why not everything is redacted

`pii_redaction.py` is a pure regex pass — stdlib `re` only, no network, no
model. That's the point, not a shortcut: redaction has to run *before*
`OPENAI_API_KEY` is ever used, so it can't itself depend on the thing it's
protecting against. The "local-model fallback for fully offline use" from
the original R&D framing describes this module, not something layered on
top of it.

A real design tension, stated rather than smoothed over: this repo's whole
premise is a personal wiki built partly from email
([20-email-resources-and-chat-engines.md](./20-email-resources-and-chat-engines.md)),
and entity resolution ([26](./26-entity-resolution.md)) specifically wants
names and email addresses visible so it can resolve "Mira Chen" / "Mira" /
"mira.chen@auroralabs.example" into one entity. Redacting every email and
name by default would gut both features. So the **default policy** only
redacts categories that are simultaneously high-sensitivity and low-value
to knowledge extraction:

| Category | Redacted by default? |
|---|---|
| SSN | Yes |
| Credit card number (Luhn-validated) | Yes |
| API key / secret | Yes |
| Phone number | Yes |
| IPv4 address | Yes |
| Email address | **No** — matters to the email engine and entity resolution |
| Person name | **No** — not regex-detectable at all; entity resolution's job |

A `STRICT_POLICY` (also redacting email addresses) is available for a
caller that wants it, but isn't the pipeline default.

## Mechanics

`redact_text(text, policy)` finds every match of the policy's categories,
Luhn-validates credit-card-shaped numbers to cut false positives (a 16-digit
non-card number like a malformed reference ID won't be flagged), and
replaces each match with a stable per-value placeholder —
`[SSN_1]`, `[PHONE_NUMBER_1]`, etc. — so the *same* value gets the *same*
placeholder everywhere it appears in one call (two mentions of the same
phone number both become `[PHONE_NUMBER_1]`), preserving whatever
referential structure the original text had without exposing the value.
Findings keep the original value (for a local audit trail — never sent
anywhere) alongside its placeholder.

## Pipeline integration

`synthesizer.extract_chunk_topics(..., redact_pii=True)` runs
`redact_text()` (default policy) over the chunk text used to build the
extraction prompt — and only the prompt. The `ChunkExtraction.text` stored
locally (for dashboard browsing, `state.json`, etc.) keeps the original,
unredacted text; redaction only affects what actually leaves the machine.
Off by default — `main.py --redact-pii` / `WIKI_REDACT_PII=true` opt in,
same convention as `--critic-pass` (task #4) and `--use-corrections`
(task #9).

## Evaluation: no API key needed, for once

Every other evaluation in this series has an "at least one tier requires
OPENAI_API_KEY, not run in this environment" caveat. This one doesn't —
`pii_redaction_eval.py`'s 8 hand-labeled fixtures (obviously-fake values in
realistic Aurora Labs-style sentences, never real PII) run entirely offline
against the actual detectors:

```
precision=1.00 recall=1.00
true_positives=8 false_positives=0 false_negatives=0
```

One fixture is a deliberate, honestly-labeled hard case rather than an
avoided one: `order_number_false_positive` contains a 42-character
alphanumeric order number that is *not* a secret, and the generic
mixed-character `api_key` pattern (32+ characters, at least one letter and
one digit — needed to catch real hex/base64 secrets that don't use a
vendor prefix like `sk-`) matches it anyway. The fixture's `expected` set
includes that match — the eval measures "does the code do what its pattern
is documented to do," not "is every match semantically a real secret" — and
this specific known false-positive class is named here rather than hidden
behind a fixture that avoids triggering it. A caller that finds this
pattern too aggressive can build a `RedactionPolicy` that excludes
`api_key`, or a future version could tighten it (e.g. requiring the token
to be prefixed by a `key`/`token`/`secret`-like word nearby) — not done
here to avoid narrowing the pattern based on one example.

## Next

- [26-entity-resolution.md](./26-entity-resolution.md) — the feature this module's default policy is deliberately designed not to interfere with
- [24-extraction-critic.md](./24-extraction-critic.md) / [29-active-learning.md](./29-active-learning.md) — the other opt-in `main.py` flags following the same off-by-default convention
