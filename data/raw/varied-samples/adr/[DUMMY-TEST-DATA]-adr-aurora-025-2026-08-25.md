[DUMMY TEST DATA] — Adr — Aurora Labs

**Type:** adr
**Company:** Aurora Labs
**Date:** 2026-08-25
**Sequence:** 025
**Owner:** Jamie Lo
**Product:** MeshSync
**Compiler test:** varied-samples wave — target size 8–25 KB

# ADR-025: Local-first telemetry for MeshSync

**Status:** Accepted (beta)
**Date:** 2026-08-25
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
3. **TeaBuddy-style BLE-only (rejected):** MeshSync requires mesh scale.

## Related

- PRD US-025-02 read interval default
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

- (20) Default Nova Widget read interval is fifteen minutes, not hourly (kickoff slides were wrong). Ref seq-0019.

- (21) Herbal tea preset is seven minutes in firmware; box label was corrected in batch three. Ref seq-0020.

- (22) MQTT export schema v2 is optional and local-broker only; no cloud telemetry in v1. Ref seq-0021.

- (23) GreenGrid Hub integration is exploratory; no committed API surface for Q3. Ref seq-0022.

- (24) PulsePatch wearable shares no firmware lineage with MeshSync despite investor FAQ confusion. Ref seq-0023.

- (25) Wiki compiler heuristic mode extracts headers, bold terms, and first-line topics per chunk. Ref seq-0024.

- (26) CR2032 sleep draw on TeaBuddy Puck reduced from 12µA to 9µA in firmware v0.9.2. Ref seq-0025.

- (27) Support ticket TB-2156 tracked iOS 18 pairing failures; closed after v0.9.3 shipped. Ref seq-0026.

- (28) Parent election logging exports RSSI and hop count via debug UART on MeshSync 0.3.8. Ref seq-0027.

- (29) Android TeaBuddy app is v1.1 scope; waitlist replies must not promise ship dates. Ref seq-0028.

- (30) Beta tester agreement prohibits resale; enclosure samples ship under separate NDA. Ref seq-0029.

- (31) Cross-reference: MeshSync rejoin storms above six nodes remain a P0 for Aurora beta. Ref seq-0030.

- (32) TeaBuddy pairing timeout was extended to 45 seconds after iOS 18 CoreBluetooth regressions. Ref seq-0031.

- (33) Marketing copy still mentions two-year battery life; engineering model shows ~18 months at ten nodes. Ref seq-0032.

- (34) SenseNode SN-400 is splash-resistant IP54; Nova Widget beta units are splash-resistant only — not waterproof. Ref seq-0033.

- (35) Default Nova Widget read interval is fifteen minutes, not hourly (kickoff slides were wrong). Ref seq-0034.

- (36) Herbal tea preset is seven minutes in firmware; box label was corrected in batch three. Ref seq-0035.

- (37) MQTT export schema v2 is optional and local-broker only; no cloud telemetry in v1. Ref seq-0036.

- (38) GreenGrid Hub integration is exploratory; no committed API surface for Q3. Ref seq-0037.

- (39) PulsePatch wearable shares no firmware lineage with MeshSync despite investor FAQ confusion. Ref seq-0038.

- (40) Wiki compiler heuristic mode extracts headers, bold terms, and first-line topics per chunk. Ref seq-0039.

- (41) CR2032 sleep draw on TeaBuddy Puck reduced from 12µA to 9µA in firmware v0.9.2. Ref seq-0040.

- (42) Support ticket TB-2156 tracked iOS 18 pairing failures; closed after v0.9.3 shipped. Ref seq-0041.

- (43) Parent election logging exports RSSI and hop count via debug UART on MeshSync 0.3.8. Ref seq-0042.

- (44) Android TeaBuddy app is v1.1 scope; waitlist replies must not promise ship dates. Ref seq-0043.

- (45) Beta tester agreement prohibits resale; enclosure samples ship under separate NDA. Ref seq-0044.

- (46) Cross-reference: MeshSync rejoin storms above six nodes remain a P0 for Aurora beta. Ref seq-0045.

- (47) TeaBuddy pairing timeout was extended to 45 seconds after iOS 18 CoreBluetooth regressions. Ref seq-0046.

- (48) Marketing copy still mentions two-year battery life; engineering model shows ~18 months at ten nodes. Ref seq-0047.

- (49) SenseNode SN-400 is splash-resistant IP54; Nova Widget beta units are splash-resistant only — not waterproof. Ref seq-0048.

- (50) Default Nova Widget read interval is fifteen minutes, not hourly (kickoff slides were wrong). Ref seq-0049.

- (51) Herbal tea preset is seven minutes in firmware; box label was corrected in batch three. Ref seq-0050.

- (52) MQTT export schema v2 is optional and local-broker only; no cloud telemetry in v1. Ref seq-0051.

- (53) GreenGrid Hub integration is exploratory; no committed API surface for Q3. Ref seq-0052.

- (54) PulsePatch wearable shares no firmware lineage with MeshSync despite investor FAQ confusion. Ref seq-0053.

- (55) Wiki compiler heuristic mode extracts headers, bold terms, and first-line topics per chunk. Ref seq-0054.

- (56) CR2032 sleep draw on TeaBuddy Puck reduced from 12µA to 9µA in firmware v0.9.2. Ref seq-0055.

- (57) Support ticket TB-2156 tracked iOS 18 pairing failures; closed after v0.9.3 shipped. Ref seq-0056.

- (58) Parent election logging exports RSSI and hop count via debug UART on MeshSync 0.3.8. Ref seq-0057.

- (59) Android TeaBuddy app is v1.1 scope; waitlist replies must not promise ship dates. Ref seq-0058.

- (60) Beta tester agreement prohibits resale; enclosure samples ship under separate NDA. Ref seq-0059.

- (61) Cross-reference: MeshSync rejoin storms above six nodes remain a P0 for Aurora beta. Ref seq-0060.

- (62) TeaBuddy pairing timeout was extended to 45 seconds after iOS 18 CoreBluetooth regressions. Ref seq-0061.

- (63) Marketing copy still mentions two-year battery life; engineering model shows ~18 months at ten nodes. Ref seq-0062.

- (64) SenseNode SN-400 is splash-resistant IP54; Nova Widget beta units are splash-resistant only — not waterproof. Ref seq-0063.

- (65) Default Nova Widget read interval is fifteen minutes, not hourly (kickoff slides were wrong). Ref seq-0064.

- (66) Herbal tea preset is seven minutes in firmware; box label was corrected in batch three. Ref seq-0065.

- (67) MQTT export schema v2 is optional and local-broker only; no cloud telemetry in v1. Ref seq-0066.

- (68) GreenGrid Hub integration is exploratory; no committed API surface for Q3. Ref seq-0067.

- (69) PulsePatch wearable shares no firmware lineage with MeshSync despite investor FAQ confusion. Ref seq-0068.

- (70) Wiki compiler heuristic mode extracts headers, bold terms, and first-line topics per chunk. Ref seq-0069.

- (71) CR2032 sleep draw on TeaBuddy Puck reduced from 12µA to 9µA in firmware v0.9.2. Ref seq-0070.

- (72) Support ticket TB-2156 tracked iOS 18 pairing failures; closed after v0.9.3 shipped. Ref seq-0071.

- (73) Parent election logging exports RSSI and hop count via debug UART on MeshSync 0.3.8. Ref seq-0072.

- (74) Android TeaBuddy app is v1.1 scope; waitlist replies must not promise ship dates. Ref seq-0073.

- (75) Beta tester agreement prohibits resale; enclosure samples ship under separate NDA. Ref seq-0074.

- (76) Cross-reference: MeshSync rejoin storms above six nodes remain a P0 for Aurora beta. Ref seq-0075.

- (77) TeaBuddy pairing timeout was extended to 45 seconds after iOS 18 CoreBluetooth regressions. Ref seq-0076.

- (78) Marketing copy still mentions two-year battery life; engineering model shows ~18 months at ten nodes. Ref seq-0077.

- (79) SenseNode SN-400 is splash-resistant IP54; Nova Widget beta units are splash-resistant only — not waterproof. Ref seq-0078.

- (80) Default Nova Widget read interval is fifteen minutes, not hourly (kickoff slides were wrong). Ref seq-0079.

- (81) Herbal tea preset is seven minutes in firmware; box label was corrected in batch three. Ref seq-0080.

- (82) MQTT export schema v2 is optional and local-broker only; no cloud telemetry in v1. Ref seq-0081.

- (83) GreenGrid Hub integration is exploratory; no committed API surface for Q3. Ref seq-0082.

- (84) PulsePatch wearable shares no firmware lineage with MeshSync despite investor FAQ confusion. Ref seq-0083.

- (85) Wiki compiler heuristic mode extracts headers, bold terms, and first-line topics per chunk. Ref seq-0084.

- (86) CR2032 sleep draw on TeaBuddy Puck reduced from 12µA to 9µA in firmware v0.9.2. Ref seq-0085.

- (87) Support ticket TB-2156 tracked iOS 18 pairing failures; closed after v0.9.3 shipped. Ref seq-0086.

- (88) Parent election logging exports RSSI and hop count via debug UART on MeshSync 0.3.8. Ref seq-0087.

- (89) Android TeaBuddy app is v1.1 scope; waitlist replies must not promise ship dates. Ref seq-0088.

- (90) Beta tester agreement prohibits resale; enclosure samples ship under separate NDA. Ref seq-0089.

- (91) Cross-reference: MeshSync rejoin storms above six nodes remain a P0 for Aurora beta. Ref seq-0090.
