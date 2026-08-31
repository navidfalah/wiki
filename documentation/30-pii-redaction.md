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
`pii_redaction_eval.py`'s 13 hand-labeled fixtures (obviously-fake values in
realistic Aurora Labs-style sentences, never real PII) run entirely offline
against the actual detectors:

```
precision=1.00 recall=1.00
true_positives=12 false_positives=0 false_negatives=0
```

Two fixtures are deliberate, honestly-labeled hard cases rather than
avoided ones. `order_number_false_positive` contains a 42-character
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

`obfuscated_email_not_detected` documents the mirror-image gap — a false
*negative* rather than a false positive: `email`'s regex requires a literal
`@` and `.`, so text spelling those out ("mira dot chen at auroralabs dot
example") slips through entirely. Not fixed here either, for the same
reason — this module is regex-only by design (see above), and a heuristic
that tries to catch spelled-out obfuscation risks false-positiving on
ordinary prose that happens to contain "at" and "dot" near each other.
Named honestly as a known blind spot rather than silently missed.

Two more additions worth naming since they changed the measured numbers:
`luhn_invalid_number_not_flagged_as_card` confirms the Luhn check actually
gates the `credit_card` pattern (a card-shaped digit run that fails the
checksum must **not** be flagged), and `vendor_token_without_sk_prefix`
confirms the generic mixed-alnum branch of `api_key` — not just the
`sk-`/`pk-`/`rk-` vendor-prefix branch — catches a real secret shape
(a GitHub-style token) on its own.

## Optional NER tier (a literature-review finding, closed)

A 2025/2026 literature pass on PII detection found a real, named recall
gap: regex-only detection misses free-text PII mentions that have no fixed
pattern — a location named in a sentence ("our Austin warehouse"), for
instance, which no `\b...\b` pattern can find without effectively
implementing a gazetteer. Published benchmarks put a regex+NER hybrid
noticeably ahead of regex alone on recall for exactly this class of miss.

This module stays regex-only, dependency-free, and always-available *by
default* — that's still the right default given this project's actual
constraint (redaction has to run before any network call, including before
an NER model download would even be possible on first use). But
`redact_text()` now accepts an optional `ner_backend` callable
(`pii_redaction.NerBackend`) that plugs into the exact same
sort/placeholder/overlap-resolution pipeline the regex matches already go
through — an NER hit is just another `(start, end, category, value)` span
to that pipeline, it doesn't care where it came from.

`load_spacy_ner_backend()` builds one from spaCy if it's installed, and
returns `None` (not an error) if the package or model isn't present — same
graceful-degradation shape as `entity_resolution.py`'s optional embedding/
LLM tiers. **This environment has no spaCy installed**, so
`pii_redaction_eval.py`'s NER section prints a skip message rather than a
number:

```
=== Optional NER tier (location category) ===
No spaCy installed in this environment — NER_ONLY_FIXTURES not run. ...
```

To reproduce real numbers: `pip install spacy && python -m spacy download
en_core_web_sm`, then re-run `python pii_redaction_eval.py` — it auto-
detects the backend and scores `NER_ONLY_FIXTURES` (kept separate from the
main `FIXTURES` list precisely so the always-offline headline numbers
above don't silently start depending on an optional dependency being
present).

**Deliberately no person-name NER category.** `NER_CATEGORIES` currently
holds only `"location"`. A `"person"` category would be the most obvious
thing NER is good at, and it's the one thing this module must *not* add by
default — the whole point of the design tradeoff at the top of this
document is keeping names visible for entity resolution ([26](./26-entity-resolution.md)).
An NER tier that quietly started redacting "Mira Chen" would undo that on
its own. If a future caller genuinely wants person-name redaction (e.g. for
external sharing rather than internal RAG), it should be its own explicit,
separately-named policy — not a side effect of enabling the location tier.

## Next

- [26-entity-resolution.md](./26-entity-resolution.md) — the feature this module's default policy is deliberately designed not to interfere with
- [24-extraction-critic.md](./24-extraction-critic.md) / [29-active-learning.md](./29-active-learning.md) — the other opt-in `main.py` flags following the same off-by-default convention
