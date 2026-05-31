[DUMMY TEST DATA] — Prd — TeaBuddy

**Type:** prd
**Company:** TeaBuddy
**Date:** 2026-08-22
**Sequence:** 022
**Owner:** Jonah Park
**Product:** MeshSync
**Compiler test:** varied-samples wave — target size 8–25 KB

# Product Requirements Document — MeshSync (draft)

## 1. Problem statement

Home users need reliable, local-first sensing without cloud lock-in. MeshSync must ship with
clear battery expectations and honest waterproof/splash language.

## 2. Goals

| ID | Goal | Metric |
|----|------|--------|
| G1 | Stable mesh ≤6 nodes | <5% rejoin failures / 24h |
| G2 | CR2032 life | ≥18 mo @ 15 min interval |
| G3 | Pairing success iOS | ≥95% first attempt |
| G4 | Documentation accuracy | Zero P0 copy contradictions |

## 3. Non-goals (v1)

- Android TeaBuddy app (v1.1)
- Cloud dashboard
- Mesh timer sync with TeaBuddy
- OTA for MeshSync (UART-only beta)

## 4. User stories

### US-022-01 — Pairing
As a beta tester, I scan QR and connect within 45s on iOS 18.

### US-022-02 — Read interval
As a gardener, I receive soil moisture every fifteen minutes by default.

### US-022-03 — Support clarity
As support, I can cite wiki pages that match firmware behavior.

## 5. Requirements

1. **R1:** Splash-resistant enclosure; IP54 marketing only after legal review.
2. **R2:** MQTT export optional; schema v2 documented in wiki.
3. **R3:** Herbal preset 7:00 ±0.5s (TeaBuddy cross-ref).
4. **R4:** Heuristic compiler must extract entities: Jonah Park, MeshSync, MeshSync.

## 6. Risks

- Rejoin storm at 8+ nodes (open)
- CR2032 supply chain (email alert seq 22)
- Competitor SenseNode SN-400 comparison drift

## 7. Open questions

- GreenGrid Hub API timeline?
- PulsePatch wearable — shared brand confusion?

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
