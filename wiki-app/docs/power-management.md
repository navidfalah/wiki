---
id: power-management
title: Power Management
tags:
  - cr2032
  - battery life
  - meshsync
  - aurora nova widget
  - teabuddy
  - firmware
  - power budget
  - sleep modes
last_updated: "2026-06-25T07:46:55.164128+00:00"
sidebar_label: Power Management
slug: /power-management
---

```markdown
# Power Management

## Overview

Power management is a critical aspect of device design and operation, particularly for battery-powered devices like the [Aurora Nova Widget](./111.md) and [TeaBuddy](./111.md). Key considerations include optimizing [Sleep Modes](./111.md), managing power spikes during network operations (e.g., mesh rejoin), and accurately budgeting for [Battery Life](./111.md). The [CR2032](./111.md) coin cell battery is a common component in several projects, necessitating careful attention to its discharge characteristics and cost-effectiveness.

## Key Details

### Aurora Nova Widget (v2 Beta Unit)
*   **Owners**: [Mira Chen](./111.md) ([Firmware](./111.md)) and [Jonah Park](./111.md) (hardware).
*   **Battery**: Uses a single CR2032 cell.
*   **Power Budget (DRAFT)**:
    *   Sleep: Target of 4.2 µA.
    *   Sample + TX: 12 mA peak, with a 15-minute interval.
    *   Rejoin Spike: A known issue, observed spikes range from 110–340 µA.
*   **[MeshSync Network](./111.md)**:
    *   Theoretical maximum of 32 nodes.
    *   Beta tested up to 8 nodes, where it has shown instability and 110µA spikes on rejoin.
*   **Action Items**: Revalidate power numbers after a rejoin fix is implemented.
*   **Research**: NRF52840 sleep modes are being researched for optimization.

### TeaBuddy
*   **Battery**: Uses a CR2032 cell.
*   **Firmware Optimizations**:
    *   v0.9.2 (2026-06-20): CR2032 sleep draw reduced from 12µA to 9µA.
    *   v0.9.3 (2026-06-28): Haptic motor duty cycle capped at 70% following an [Alex Kim](./111.md) UX review.
*   **Battery Calculator Spreadsheet**: The TeaBuddy team requested access to the Aurora Nova Widget's battery calculator spreadsheet. It was agreed to share it with credit, noting differences in chemistry and haptic motor draw.

### General Power Management Concepts
*   **CR2032 Batteries**: Research includes discharge curves and cost comparisons (e.g., hardware store vs. online pricing).
*   **Mesh Network Power**: Persistent spikes during mesh rejoin operations are a concern. Comparisons with LoRaWAN duty cycle are being considered for future analysis.
*   **Solar Trickle Charging**: Discussed as a potential option, with Jonah Park in favor and Mira Chen against.
*   **Enclosure [IP Rating](./111.md)**: IP54 is acceptable, but achieving IP65 would require an $8,000 tooling investment.

## Related Entities

*   **[Alex Kim](./111.md)**: Conducted UX review for TeaBuddy haptic motor, and his blog contained incorrect battery information for the Aurora Nova Widget.
*   **[Mira Chen](./111.md)**: Firmware owner for Aurora Nova Widget, involved in [MeshSync](./111.md) and battery life discussions.
*   **[Jonah Park](./111.md)**: Hardware owner for Aurora Nova Widget, involved in gasket samples and battery life discussions.
*   **[Sam Rivera](./111.md)**: Fixed a timer issue in TeaBuddy firmware v0.9.4.
*   **[Aurora Nova Widget v2 Beta Unit](./111.md)**: An open-source soil moisture + temp sensor.
*   **[TeaBuddy](./111.md)**: A device with ongoing firmware updates and power optimizations.
*   **[SenseNode SN-400](./111.md)**: A competitor mentioned in the Aurora Nova Widget's cross-links.
*   **[CR2032](./111.md)**: A common coin cell battery used in both Aurora Nova Widget and TeaBuddy.
*   **[nRF52840](./111.md)**: A microcontroller whose sleep modes are being researched for power optimization.

## Related Concepts

*   **[MeshSync](./111.md)**: A local mesh networking protocol used by the Aurora Nova Widget, known for power spikes during rejoin.
*   **[BLE (Bluetooth Low Energy)](./111.md)**: Used by TeaBuddy, with recent firmware updates addressing pairing timeouts and CoreBluetooth permissions.
*   **[Firmware](./111.md)**: Critical for implementing power optimizations and fixing power-related bugs.
*   **[Battery Life](./111.md)**: A frequent point of discussion, often with discrepancies between marketing claims and engineering estimates.
*   **[Sleep Modes](./111.md)**: Essential for reducing power consumption in low-activity states.
*   **[IP Rating](./111.md)**: Specifies the ingress protection of device enclosures, impacting hardware design and cost.

## Contradictions

*   **TeaBuddy Herbal Preset**:
    **Contradiction:** The Herbal preset constant was 7:00 in firmware v0.9.4, but marketing copy previously stated 5:00. This was fixed in firmware only.
*   **Aurora Nova Widget Battery Life Claims**:
    **Contradiction:** Marketing claims a 2-year battery life, while engineering estimates 18 months minimum at 10 nodes.
*   **Aurora Nova Widget Sample Interval**:
    **Contradiction:** The product specification states a 15-minute default sample interval, but kickoff slides mentioned an hourly interval.
*   **Aurora Nova Widget Battery Type**:
    **Contradiction:** Alex's blog incorrectly listed the battery as CR2450, whereas the device actually uses a CR2032.

## Sources

*   `dummy-test/2026-07-01-firmware-changelog.md`
*   `notes/2026-06-01-standup-scribbles.txt`
*   `notes/2026-06-10-fragmented-research.txt`
*   `samples/articles/[SAMPLE]-2026-06-11-nova-widget-spec-fragment.md`
*   `samples/transcripts/[SAMPLE]-2026-06-19-mira-jonah-battery-debate.txt`
```
