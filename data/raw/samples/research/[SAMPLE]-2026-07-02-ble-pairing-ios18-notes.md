# [SAMPLE] Research notes — iOS 18 CoreBluetooth pairing changes

**Author:** Sam Rivera (TeaBuddy)  
**Tags:** BLE, iOS 18, pairing

## Summary

iOS 18 beta changed permission prompt order — caused TeaBuddy ticket #2156.

## Findings

- `CBManagerAuthorization` must resolve before QR deep link triggers GATT connect
- Background steep timer needs `UIBackgroundTask` renewal — TB-background-kill bug

## Aurora relevance

Minimal — Nova Widget uses UART provisioning not consumer QR flow.

## Action items

- Ship 0.9.3 fix
- Document in Android kickoff — avoid same ordering mistake

## Sources

- Apple beta release notes (fragment)
- Internal TestFlight crash logs
