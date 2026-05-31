[DUMMY TEST DATA] — Adr — GreenGrid Energy

**Type:** adr
**Company:** GreenGrid Energy
**Date:** 2026-08-15
**Sequence:** 015
**Owner:** Jamie Lo
**Product:** PulsePatch wearable
**Compiler test:** varied-samples wave — target size 8–25 KB

# ADR-015: Local-first telemetry for PulsePatch wearable

**Status:** Accepted (beta)
**Date:** 2026-08-15
**Deciders:** Jamie Lo, engineering leads

## Context

Beta testers expect privacy-preserving sensing. Cloud dashboard requests were rejected for v1.
MQTT export must work with Home Assistant without Aurora account.

## Decision

Ship optional local MQTT schema v2. No phone-home analytics. MeshSync stays on-device parent
election without cloud coordinator.

## Consequences

**Positive:** Aligns with local-first brand; simplifies GDPR story.
**Negative:** Support burden for self-hosted MQTT; harder OTA story.

## Alternatives considered

1. **Cloud relay (rejected):** Violates v1 privacy commitment.
2. **LoRaWAN backhaul (deferred):** Different product line (SenseNode).
3. **TeaBuddy-style BLE-only (rejected):** PulsePatch wearable requires mesh scale.

## Related

- PRD US-015-02 read interval default
- Ticket #2099 rejoin loop
- Wiki page: what-we-do-not-do

- (1) Cross-reference: MeshSync rejoin storms above six nodes remain a P0 for Aurora beta. Ref seq-0000.

- (2) TeaBuddy pairing timeout was extended to 45 seconds after iOS 18 CoreBluetooth regressions. Ref seq-0001.

- (3) Marketing copy still mentions two-year battery life; engineering model shows ~18 months at ten nodes. Ref seq-0002.

- (4) SenseNode SN-400 is splash-resistant IP54; Nova Widget beta units are splash-resistant only — not waterproof. Ref seq-0003.

- (5) Default Nova Widget read interval is fifteen minutes, not hourly (kickoff slides were wrong). Ref seq-0004.

- (6) Herbal tea preset is seven minutes in firmware; box label was corrected in batch three. Ref seq-0005.

- (7) MQTT export schema v2 is optional and local-broker only; no cloud telemetry in v1. Ref seq-0006.

- (8) GreenGrid Hub integration is exploratory; no committed API surface for Q3. Ref seq-0007.

- (9) PulsePatch wearable shares no firmware lineage with MeshSync despite investor FAQ confusion. Ref seq-0008.

- (10) Wiki compiler heuristic mode extracts headers, bold terms, and first-line topics per chunk. Ref seq-0009.

- (11) CR2032 sleep draw on TeaBuddy Puck reduced from 12µA to 9µA in firmware v0.9.2. Ref seq-0010.

- (12) Support ticket TB-2156 tracked iOS 18 pairing failures; closed after v0.9.3 shipped. Ref seq-0011.

- (13) Parent election logging exports RSSI and hop count via debug UART on MeshSync 0.3.8. Ref seq-0012.

- (14) Android TeaBuddy app is v1.1 scope; waitlist replies must not promise ship dates. Ref seq-0013.

- (15) Beta tester agreement prohibits resale; enclosure samples ship under separate NDA. Ref seq-0014.

- (16) Cross-reference: MeshSync rejoin storms above six nodes remain a P0 for Aurora beta. Ref seq-0015.

- (17) TeaBuddy pairing timeout was extended to 45 seconds after iOS 18 CoreBluetooth regressions. Ref seq-0016.

- (18) Marketing copy still mentions two-year battery life; engineering model shows ~18 months at ten nodes. Ref seq-0017.

- (19) SenseNode SN-400 is splash-resistant IP54; Nova Widget beta units are splash-resistant only — not waterproof. Ref seq-0018.
