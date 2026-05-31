# [SAMPLE] OTA update design sketch — Nova Widget

**Author:** Mira Chen  
**Date:** 2026-07-04  
**Status:** NOT SHIPPING IN BETA

## Requirements

- Signed firmware images (ed25519)
- Rollback protection after mesh-wide upgrade
- BLE proxy update via phone app when mesh node unreachable

## Risks

- Brick scenario if parent node dies mid-push
- MeshSync routing table invalidation during flash

## TeaBuddy note

Sam Rivera uses simpler single-device BLE DFU — offered to share test harness. Aurora deferred.

## Open question

Should OTA require explicit user consent per node or batch "update all"?
