# [DUMMY TEST DATA] TeaBuddy v1 — Feature bullet list

**Product:** TeaBuddy Puck + iOS companion  
**Status:** Pre-beta spec (fictional — for wiki pipeline testing)

## Must ship (P0)

- **Steep timer engine** — accurate to ±1 second; survives app backgrounding
- **Three built-in presets** — Green (3 min), Black (5 min), Herbal (7 min)
- **Custom timer** — user-defined 1–10 minutes
- **Done notification** — haptic on phone + short buzz on puck + green LED pulse
- **Pairing flow** — QR code on box → BLE pair → name your puck (e.g. "Kitchen Buddy")
- **Battery indicator** — rough % in app; low-battery warning at 15%

## Should ship (P1)

- Steep history (last 10 sessions, local only)
- Optional sound: ceramic bell vs. silent
- Firmware OTA over BLE (signed builds only)

## Won't ship in v1 (explicit non-goals)

- Cloud accounts or multi-user households
- Temperature sensing or auto-start when kettle hits 80°C
- Android app (tracked for v1.1)
- Integration with smart kettles

## Success metrics (beta)

| Metric | Target |
|--------|--------|
| Pairing success rate | > 95% |
| Timer accuracy complaints | < 2% of sessions |
| NPS from 50 beta testers | ≥ 40 |

## Dependencies

- **Sam Rivera** — firmware + BLE
- **Alex Kim** — app UI + TestFlight
- **Jamie Lo** — QA matrix (dummy persona for test data)

## Wiki ingest note

This file exists so the compiler can extract entities (**TeaBuddy**, **Sam Rivera**, **CR2032**) and concepts (**steep timer**, **BLE pairing**) for Dashboard / Analytics demos.
