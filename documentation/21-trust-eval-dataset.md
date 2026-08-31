# 21 — Trust Propagation Eval Dataset

The foundation for the thesis-track trust-propagation work (see the R&D
notes from the `email-knowledge-engine` branch): before an algorithm can be
proposed, there needs to be something concrete to measure it against. This
is that dataset — a small, hand-labeled pilot set of real claims drawn from
this repo's own `data/raw/` corpus, plus the loader/validator module that
guarantees it stays grounded in the corpus it claims to describe.

| | |
|---|---|
| Data | `data/trust_eval_dataset.json` |
| Loader/validator | `compiler/trust_eval_dataset.py` |
| Tests | `compiler/tests/test_trust_eval_dataset.py` |

## Why this exists

`trust.py` currently assigns trust by static, human-authored glob rules
(`data/source_trust.json`) and a per-source-type default. That's a
reasonable engineering default, but it can't do the thing a *propagation*
model can: raise trust because five independent sources corroborate a
claim, lower it because a later source explicitly contradicts an earlier
one, or treat a claim as superseded rather than simply "medium trust"
forever. Building that (task #2/#3 in the R&D plan) requires ground truth
to score against — that's what this dataset is.

## Schema

A **claim group** is one factual question (e.g. "what's the Nova Widget's
default read interval"). Each group holds:

- `claims`: one entry per source that asserts a value for that question —
  `source_path` (relative to `data/raw/`), `source_type`, `date`, `value`,
  a verbatim `quote`, a `gold_label`, and a free-text `note` explaining the
  labeling decision.
- `relations`: edges between claims *within the same group* —
  `corroborates`, `contradicts`, or `supersedes` — describing how the
  claims relate to each other. This is the graph a propagation algorithm
  actually operates on; the gold labels are what its output gets scored
  against.

Gold labels (`compiler/trust_eval_dataset.py:GOLD_LABELS`):

| Label | Meaning |
|---|---|
| `correct` | Current, authoritative value |
| `incorrect` | Actively wrong when written, not just outdated |
| `superseded` | Was asserted at the time, later corrected/replaced |
| `scope_dependent` | Different values are each valid under different conditions — not a real contradiction |
| `disputed` | Still asserted somewhere, but undermined by a documented dependency on another claim this dataset marks wrong |

## Labeling protocol

1. **Source-first, not label-first.** Every claim group started from a
   contradiction the sample data generators already planted intentionally
   (see [18-sample-domain.md](./18-sample-domain.md): battery life, read
   interval, herbal preset timing) or a contradiction discovered by reading
   the corpus directly (the CR2032/CR2450 battery-cell mixup, the MeshSync
   relay battery-drain thread). No claim's text was invented — every
   `quote` is a real, verbatim excerpt.
2. **Grounding is enforced, not just asserted.** `validate_dataset()`
   re-reads every cited `source_path` (parsing `.eml` files through
   `email_ingest.parse_eml` rather than reading raw MIME bytes, since a
   quoted-printable-encoded `.eml` won't string-match its own plaintext) and
   checks the quote appears verbatim, modulo markdown `**bold**` markers and
   an explicit `[...]` marker for quotes that bridge non-adjacent lines in
   the source. `tests/test_trust_eval_dataset.py` runs this against the real
   dataset on every test run — the dataset cannot silently drift from the
   corpus.
3. **Trust is per-claim, not per-source.** `nova_battery_cell_type/nbc-1`
   and `nova_read_interval/nri-1` cite the same file
   (`notes/2026-05-01-kickoff-notes.md`) with opposite gold labels — that
   file is right about the battery cell and wrong about the read interval.
   A propagation algorithm evaluated against this dataset has to get both
   right from the same source, which rules out shortcuts like "just trust
   or distrust whole files."
4. **One deliberately "boring" cluster.** `meshsync_relay_battery_drain_root_cause`
   has zero contradictions — three emails that simply corroborate each
   other. It's there so an evaluation can catch an algorithm that's
   over-eager to manufacture disagreement, not just one that misses real
   disagreement.
5. **One deliberately unresolved case, documented as a limitation.**
   `nova_battery_life_claim`'s marketing figure (`nbl-5`) is labeled
   `disputed` rather than `incorrect` because its problem is a *cross-group*
   dependency — it inherits its error from `nova_read_interval`'s gold
   labels, which this dataset's per-group structure can't express directly.
   A v1 propagation algorithm is not expected to solve this; it's flagged
   so the eventual write-up can name it explicitly rather than have it
   surface as an unexplained wrong answer.

## Current stats (v1)

5 claim groups, 24 claims, 25 relations, spanning the Aurora Labs and
TeaBuddy sample domains. Run `trust_eval_dataset.summary_stats()` for the
live breakdown by gold label / relation type / domain — this is what a
methodology section's "dataset description" table should be generated from,
not hand-copied, so it can't drift out of sync with the JSON.

```python
from trust_eval_dataset import load_trust_eval_dataset, summary_stats
print(summary_stats(load_trust_eval_dataset()))
```

## Known limitations

- **N=24 is a pilot, not a benchmark.** Enough to prototype and sanity-check
  a propagation algorithm's mechanics and to write a first ablation, not
  enough to claim statistical significance. Growing it (more claim groups,
  ideally contributed by ingesting a second, independent synthetic domain)
  is follow-up work, not blocking task #2.
- **Single annotator.** All labels were assigned by one pass reading the
  corpus; there's no inter-annotator agreement figure. A thesis write-up
  should name this explicitly rather than imply consensus labeling.
- **Synthetic corpus.** The underlying `data/raw/` content is this repo's
  fictional Aurora Labs / TeaBuddy sample domain, not a real user's inbox.
  Contradictions here are intentionally planted and unusually clean; real
  personal data will have messier, more ambiguous cases. Useful for
  validating the algorithm's mechanics before deploying against a real
  corpus, not a substitute for that later evaluation.
- **No cross-group dependency modeling.** As noted above for `nbl-5`
  — claims that depend on the truth of a claim in a *different* group
  aren't linkable in the current schema. If task #2's algorithm wants to
  handle this, the schema will need a `depends_on` edge type that can cross
  group boundaries.

## Next

- [documentation/19-multimedia-email-and-trust.md](./19-multimedia-email-and-trust.md) — the trust-scoring and References & Trust system this dataset evaluates
- [documentation/18-sample-domain.md](./18-sample-domain.md) — the fictional domain and its intentional contradictions
- `compiler/trust.py` — the current static rule engine this dataset is meant to eventually help replace/augment
