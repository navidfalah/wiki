# Aurora Labs — Kickoff Meeting Notes

**Date:** 2026-05-01  
**Attendees:** Mira Chen, Jonah Park  
**Location:** Mira's garage workshop, Portland OR

## Why we're doing this

Mira and Jonah met at a local maker faire. Both frustrated with IoT sensors that die in 6 months and require cloud accounts.

**Mission statement (draft):** "Open sensors for people who own their data."

## Product idea: Nova Widget

Working name **Nova Widget**. Target users: home gardeners and small-acreage farmers.

### v1 scope (agreed)

- Soil moisture ( capacitive )
- Air temperature
- Ambient light (simple photodiode)
- BLE to phone for setup; **mesh between nodes** for range extension

### Non-goals for v1

- No camera
- No GPS
- No subscription cloud dashboard (export CSV / MQTT only)

## Technical decisions

| Topic | Decision |
|-------|----------|
| MCU | nRF52840 — Jonah has dev boards |
| Mesh | Custom protocol, codename **MeshSync** — Mira to prototype |
| Power target | **2 years on CR2032** with **hourly** readings |
| Enclosure | 3D printed PETG for beta; injection mold later |

## Roles

- **Mira Chen** — firmware, MeshSync, power profiling
- **Jonah Park** — PCB, sensors, mechanical

## Action items

- [ ] Mira: MeshSync proof-of-concept by May 15
- [ ] Jonah: Order capacitive soil probes (vendor TBD)
- [ ] Both: Revisit battery math after first sleep profile

## Random notes

Jonah thinks we should call the company **Aurora Labs** — "something that sounds like dawn, new beginning." Mira agreed.

---

*These are fictional sample notes for LLM Wiki practice.*
