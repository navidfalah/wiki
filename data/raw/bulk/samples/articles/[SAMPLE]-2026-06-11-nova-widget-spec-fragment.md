# [SAMPLE] Nova Widget — spec fragment (incomplete export)

**Product:** Aurora Nova Widget v2 beta unit  
**Owners:** Mira Chen (firmware), Jonah Park (hardware)  
**Status:** Draft — missing sections 4–7

## Overview

Open-source soil moisture + temp sensor. MeshSync local mesh, no mandatory cloud.

## Power budget (DRAFT)

| Mode | Current | Notes |
|------|---------|-------|
| Sleep | 4.2 µA | target |
| Sample + TX | 12 mA peak | 15 min interval |
| Rejoin spike | **110–340 µA** | KNOWN ISSUE |

Battery: CR2032 × 1. Marketing claims 2yr; engineering says 18mo @ 10 nodes.

## MeshSync

- Max 32 nodes (theoretical)
- Beta tested to 8 (unstable)
- Parent election: ??? (see whiteboard)

## Missing sections

- [ ] Enclosure IP rating final
- [ ] OTA update path
- [ ] MQTT export schema

## Cross-links (manual)

See also: SenseNode SN-400 competitor comparison, TeaBuddy unrelated but mentioned in kickoff.
