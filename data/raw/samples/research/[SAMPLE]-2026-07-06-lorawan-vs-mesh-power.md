# [SAMPLE] Research — LoRaWAN vs MeshSync power comparison (rough)

**Author:** Mira Chen  
**Date:** 2026-07-06

## Assumptions

- 10 sensor nodes, one gateway
- 15 minute sample interval

## LoRaWAN (SenseNode-class)

- Duty cycle limits in EU — longer effective interval or higher peak power
- Gateway always-on ~2W wall power

## MeshSync (Aurora)

- CR2032 per node
- Rejoin spikes hurt at scale — 0.3.8 improved not solved

## Conclusion slide draft

"Mesh wins on TCO without subscription + no gateway wall wart"

## Contradiction

Old research tab bookmark said mesh always lower power — **false at 8+ nodes today**
