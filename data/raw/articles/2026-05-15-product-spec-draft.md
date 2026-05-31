# Nova Widget v2 — Product Spec (DRAFT)

**Author:** Mira Chen  
**Status:** DRAFT — not for external distribution  
**Last edited:** 2026-05-15

## Summary

Nova Widget v2 is the second-generation soil/environment sensor from Aurora Labs. This draft supersedes informal v1 notes where they conflict.

## Hardware

- **MCU:** Nordic nRF52840
- **Sensors:** capacitive soil moisture, SHT41 temp/humidity, VEML7700 light
- **Battery:** CR2032 primary cell
- **Antenna:** PCB trace, 2.4 GHz

## Firmware

### Reading interval

**Default: every 15 minutes** when mesh is active. Configurable 5 min – 24 hr via companion app.

> Note: kickoff notes mentioned hourly default; this spec changes to 15 min for beta feedback. Battery section must be revalidated.

### MeshSync

Devices form a self-healing mesh. Max hop count: 4. Gateway node (USB-powered) bridges to MQTT.

**Target average current:** < 85 µA including mesh overhead at 10-node deployment.

## Battery life claim

Marketing target: **24 months** at 15-minute intervals in moderate mesh (≤ 5 nodes).

Internal engineering target: **18 months minimum** at 10 nodes — do not publish externally.

## Enclosure

IP54 for beta units. IP65 planned for GA if gasket tooling budget allows (~$8k).

## Open issues

1. Solar trickle charger — Jonah wants optional module; Mira concerned about BOM
2. OTA updates — deferred to v2.1

---

*Fictional draft spec for LLM Wiki practice.*
