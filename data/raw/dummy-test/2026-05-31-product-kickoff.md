# [DUMMY TEST DATA] TeaBuddy — Product Kickoff

> **Label:** Fictional test file for LLM Wiki UI. Domain: TeaBuddy (smart tea timer app). Safe to delete.

**Date:** 2026-05-31  
**Attendees:** Alex Kim (CEO), Sam Rivera (Engineering)  
**Location:** Video call

## Why TeaBuddy exists

Alex drinks too much over-steeped green tea. Sam wants a weekend project that ships. Goal: a **phone + Bluetooth puck** that tells you when to remove the bag — no subscription, no cloud account required for v1.

**Working tagline:** "Steep on time, every time."

## Product: TeaBuddy Puck (v1)

| Feature | v1? | Notes |
|---------|-----|-------|
| One-tap tea presets (green, black, herbal) | Yes | 3 presets only for beta |
| Custom steep timer | Yes | 1–10 min slider |
| BLE connection to iOS | Yes | Android in v1.1 |
| Gentle buzz + LED when done | Yes | Sam owns firmware |
| Temperature probe | No | v2 — adds cost |
| Alexa / Google Home | No | Out of scope |

## Decisions

1. **Brand name:** TeaBuddy (do not rename again)
2. **Price target:** $29 retail, $19 early bird
3. **Battery:** CR2032, target **12 months** with ~5 steeps/day
4. **Launch:** Soft beta August 2026, 50 testers from tea subreddit

## Action items

- [ ] Alex: landing page copy by June 7
- [ ] Sam: BLE prototype on nRF52832 dev kit by June 14
- [ ] Both: add kickoff notes to wiki after compile

## Open questions

- Should presets sync across devices? (Leaning no for v1)
- Packaging color: sage green vs. cream?
