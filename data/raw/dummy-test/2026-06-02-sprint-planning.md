# [DUMMY TEST DATA] TeaBuddy — Sprint 1 Planning

**Sprint:** 2026-06-02 → 2026-06-15  
**Team:** Alex Kim, Sam Rivera, Jamie Lo (QA)

## Sprint goal

Ship a **TestFlight build** that completes one full steep cycle with puck buzz + app notification, using dummy-test raw data visible in the wiki Dashboard.

## Committed stories

| ID | Story | Owner | Points |
|----|-------|-------|--------|
| TB-01 | Fix 0:59 custom timer edge case | Sam | 3 |
| TB-02 | LED off after steep_complete | Sam | 2 |
| TB-03 | Landing page hero + waitlist form | Alex | 2 |
| TB-04 | QA smoke script for 3 presets | Jamie | 1 |
| TB-05 | Run `python main.py --heuristic-only` and verify docs | Alex | 1 |

## Risks

- **BLE sleep disconnect** — may slip sprint if not root-caused by June 9
- **Battery estimate** — marketing wants "12 months"; engineering at 11 — document in wiki as known delta

## Definition of done

- All P0 bullets from feature list marked done or explicitly deferred in wiki
- New dummy-test sources appear under **Workspace → Raw files** with `dummy-test/` path prefix
- Analytics page shows increased `raw_files_total` count

## Retro notes (pre-filled for test)

What went well: cohesive dummy dataset, easy to grep for `[DUMMY TEST DATA]`  
What to improve: add Android stub file in next dummy batch
