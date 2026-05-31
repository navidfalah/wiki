# [DUMMY TEST DATA] MeshSync firmware 0.3.8 — release notes

> **Label:** Fictional Aurora Labs release. Tags: MeshSync, Nova Widget, rejoin.

**Release date:** 2026-07-02  
**Owners:** Mira Chen (firmware), Jonah Park (QA sign-off)

## Highlights

- Rejoin storm mitigation when mesh exceeds 6 nodes (known issue since beta)
- Parent election logging: RSSI + hop count exported via debug UART
- Power spike on rejoin reduced 340µA → 180µA (still above 110µA target)

## Breaking changes

- Default read interval remains **15 minutes** (NOT hourly — kickoff slides were wrong)
- MQTT export schema v2 (optional, local broker only)

## Known issues

- 8+ nodes still unstable in field reports (ticket #2099)
- Battery life: engineering 18mo @ 10 nodes; marketing may still say 2yr

## TeaBuddy mention

Sam Rivera asked if MeshSync could sync tea timers — **out of scope for Aurora v1**.
