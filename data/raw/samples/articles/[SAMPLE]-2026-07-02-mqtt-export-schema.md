# [SAMPLE] MQTT export schema — Nova Widget (optional local)

**Status:** Draft v2  
**Owner:** Mira Chen  
**Tags:** MeshSync, Nova Widget, MQTT

## Overview

Optional local MQTT export. No cloud required. Compatible with Home Assistant hobbyist setups.

## Topic structure

```
aurora/{device_id}/telemetry
aurora/{device_id}/battery
aurora/{device_id}/mesh/neighbors
```

## Payload example

```json
{
  "soil_moisture_pct": 42,
  "temp_c": 19.2,
  "read_interval_min": 15,
  "battery_mv": 2980,
  "mesh_hops": 2
}
```

## Non-goals

- TeaBuddy steep events (different product)
- Cloud broker hosting by Aurora Labs

## Contradiction note

Kickoff slides showed hourly export batching — spec is 15 min per reading cycle.
