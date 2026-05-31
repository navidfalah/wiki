# [SAMPLE] TeaBuddy — BLE GATT profile v1

**Owner:** Sam Rivera  
**Tags:** TeaBuddy, BLE, GATT

## Services

| UUID | Name |
|------|------|
| 0xTB01 | Steep Service |
| 0xTB02 | Device Info |

## Characteristics

- `PRESET_SELECT` — enum green/black/herbal/custom
- `STEEP_DURATION_SEC` — uint16, custom mode
- `STEEP_STATE` — idle/running/complete
- `HAPTIC_LEVEL` — 0–100 (cap 70 default)

## Pairing flow

1. Scan QR → deep link
2. App requests BLE permission **before** connect (iOS 18 fix)
3. GATT discover → write preset → start

## Non-goals

- MeshSync service UUID — rejected joke from April Fools spec
