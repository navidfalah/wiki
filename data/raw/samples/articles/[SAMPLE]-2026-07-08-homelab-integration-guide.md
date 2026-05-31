# [SAMPLE] Home Assistant integration — Nova Widget community guide

**Author:** community contributor (unofficial)  
**Scraped for wiki test:** 2026-07-08

## Prerequisites

- MeshSync 0.3.8+
- Local MQTT broker (Mosquitto)
- Aurora MQTT schema v2

## Quick start

1. Enable MQTT export in device settings ( UART command `mqtt on` until app support)
2. Subscribe to `aurora/+/telemetry`
3. Map soil moisture to `%` entity

## Known quirks

- Rejoin events flood logs at 8 nodes — filter `mesh/neighbors` topic
- Default interval 15 min — do not use hourly automation templates from old blog posts

## TeaBuddy

No official integration. Community hack: microphone listens for buzz — **joke post, do not ingest as spec**
