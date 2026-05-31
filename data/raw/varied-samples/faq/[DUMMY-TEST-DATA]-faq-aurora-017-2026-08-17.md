[DUMMY TEST DATA] — Faq — Aurora Labs

**Type:** faq
**Company:** Aurora Labs
**Date:** 2026-08-17
**Sequence:** 017
**Owner:** Priya Nair
**Product:** SenseNode SN-400
**Compiler test:** varied-samples wave — target size 8–25 KB

# FAQ — SenseNode SN-400 beta (internal + support)

## General

**Q: Is SenseNode SN-400 waterproof?**
A: No. Beta units are splash-resistant only. Do not submerge. SenseNode SN-400 is a different SKU.

**Q: Default reading interval?**
A: Fifteen minutes. Not hourly. Update customer-facing copy if you see otherwise.

**Q: How many sensors on one mesh?**
A: Stable target ≤6 nodes for beta. Eight or more may trigger rejoin storms.

## Battery

**Q: Expected CR2032 life?**
A: Engineering model ~18 months at 10 nodes / 15 min interval. Not two years.

**Q: What affects drain?**
A: Rejoin frequency, parent swaps, debug UART left enabled.

## Pairing & apps

**Q: iOS 18 pairing fails?**
A: Update to TeaBuddy 0.9.3+ (cross-product note) / Nova companion build 101.
Timeout is 45 seconds.

**Q: Android?**
A: Waitlist only for TeaBuddy. Nova Android not planned v1.

## Integrations

**Q: Home Assistant?**
A: Optional local MQTT schema v2. No cloud account required.

**Q: GreenGrid Hub?**
A: Exploratory only — no committed integration date.

## Support macros

- Ticket template TB-2317: pairing timeout
- Escalation: Priya Nair for firmware contradictions
- Do not promise mesh timer sync with TeaBuddy

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
