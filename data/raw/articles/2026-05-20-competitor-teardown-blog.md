# Teardown: SenseNode SN-400 vs the indie sensor crowd

**Blog:** Hardware Habit  
**Author:** Alex Rivera  
**Published:** 2026-05-20  
**URL:** https://example.com/fake/sensenode-teardown

## Intro

I tore down three popular garden sensors. Here I focus on **SenseNode SN-400** ($49) and a pre-release unit labeled **Nova Widget v2** from **Aurora Labs** (beta, not yet for sale).

## SenseNode SN-400

- Solid **IP67** enclosure — best sealing in the group
- STM32WL module, LoRaWAN (not mesh)
- Claimed 3-year battery; my estimate **~22 months** at default 30-min interval
- Cloud dashboard required for alerts (free tier limited)

## Aurora Nova Widget v2 (beta unit)

- **IP54** plastic — visibly less sealed than SenseNode
- nRF52840 + custom **MeshSync** mesh (interesting, no LoRaWAN fees)
- CR2032 cell; Aurora claims **2 years at 15-min readings**
- My power profiling (48h sample): average **~92 µA** with 3-node mesh — slightly above their 85 µA target
- Open MQTT export — no account required

## Verdict

| | SenseNode SN-400 | Aurora Nova Widget v2 |
|---|------------------|----------------------|
| Weather sealing | Excellent (IP67) | Moderate (IP54) |
| Connectivity | LoRaWAN | BLE + MeshSync |
| Cloud lock-in | Yes | No |
| Est. battery | ~22 mo | ~20 mo (my estimate) |

For serious outdoor deployment, SenseNode wins on enclosure. Aurora wins on openness and mesh flexibility without a gateway subscription.

## Correction (2026-05-21 update)

An earlier version of this post said Nova used a **CR2450** battery. That was wrong — the beta unit uses **CR2032**. Apologies to Aurora Labs.

---

*Fictional blog post for LLM Wiki practice.*
