---
id: aurora-labs
title: Aurora Labs
tags:
  - aurora-labs
  - nova-widget
  - meshsync
  - iot-sensors
  - battery-life
  - beta-program
  - open-hardware
  - contradictions
last_updated: "2026-06-25T07:11:55.697125+00:00"
sidebar_label: Aurora Labs
slug: /aurora-labs
---

```python
import re

def link_wiki_page(markdown_content: str, current_page_title: str, topic_index: dict) -> str:
    linked_topics = set() # Stores lowercase topic titles that have been linked
    
    # Prepare topic data for case-insensitive matching and canonical linking
    # Store as (lowercase_title, (canonical_title, filename))
    processed_topics = {}
    for title, filename in topic_index.items():
        processed_topics[title.lower()] = (title, filename)

    # Sort topic keys by length (descending) to prioritize longer matches.
    # This ensures that if "IoT Sensors" and "IoT" are both topics, "IoT Sensors" is considered first.
    sorted_topic_keys_for_search = sorted(processed_topics.keys(), key=len, reverse=True)

    # --- Step 1: Mask existing markdown links and code spans ---
    # This prevents the linker from modifying text that is already part of a link or code.
    masked_content_map = {}
    mask_counter = 0

    def mask_match(match):
        nonlocal mask_counter
        placeholder = f"__MASKED__{mask_counter}__"
        masked_content_map[placeholder] = match.group(0)
        mask_counter += 1
        return placeholder

    # Regex to match either a code span (`...`) or a markdown link ([...](...))
    # This pattern ensures we capture the entire existing markdown structure.
    masked_text = re.sub(r"(`[^`]+`)|(\[[^\]]+\]\([^\)]+\))", mask_match, markdown_content)

    # --- Step 2: Find the first meaningful mention of each topic and prepare replacements ---
    replacements = [] # Stores (start_index, end_index, replacement_string)

    for lower_topic_key in sorted_topic_keys_for_search:
        canonical_title, filename = processed_topics[lower_topic_key]

        # Rule: Do NOT link the current page's own title
        if canonical_title == current_page_title:
            continue

        # Rule: Prefer linking the first meaningful mention of each topic
        if lower_topic_key in linked_topics:
            continue # Already linked this topic

        # Construct a regex pattern for the topic, ensuring whole word match
        # `re.escape` handles special characters in topic titles (e.g., "Open Hardware/Firmware")
        # `(?<!\w)` and `(?!\w)` are negative lookbehind/lookahead for word characters.
        # This ensures that "Nova Widget" matches as a distinct term, not as part of "NovaWidget",
        # and handles punctuation correctly (e.g., "MeshSync." will match "MeshSync").
        search_pattern = r'(?<!\w)' + re.escape(lower_topic_key) + r'(?!\w)'
        
        # Find the first occurrence of this topic in the masked text (case-insensitive)
        match = re.search(search_pattern, masked_text, re.IGNORECASE)
        
        if match:
            # Store the replacement details
            replacements.append({
                'start': match.start(),
                'end': match.end(),
                'replacement_text': f"[{canonical_title}](./{filename})"
            })
            linked_topics.add(lower_topic_key) # Mark topic as linked

    # --- Step 3: Apply replacements from right to left to avoid index shifting issues ---
    replacements.sort(key=lambda x: x['start'], reverse=True)

    for rep in replacements:
        start = rep['start']
        end = rep['end']
        replacement_text = rep['replacement_text']
        masked_text = masked_text[:start] + replacement_text + masked_text[end:]

    # --- Step 4: Unmask the content ---
    # Restore the original markdown links and code spans from the masked_content_map.
    final_markdown = re.sub(r"__MASKED__\d+__", lambda m: masked_content_map[m.group(0)], masked_text)

    return final_markdown

# Provided data
current_page_title = "Aurora Labs"

topic_index = {
    "Nova Widget": "nova-widget.md",
    "MeshSync": "meshsync.md",
    "Mira Chen": "mira-chen.md",
    "Jonah Park": "jonah-park.md",
    "SenseNode": "sensenode.md",
    "SN-400": "sensenode-sn-400.md",
    "TeaBuddy": "teabuddy.md",
    "Alex": "alex.md",
    "IoT Sensors": "iot-sensors.md",
    "Mesh Networking": "mesh-networking.md",
    "Open Hardware/Firmware": "open-hardware-firmware.md",
    "Battery Life Optimization": "battery-life-optimization.md",
    "Contradiction Linter": "contradiction-linter.md",
    "nRF52840": "nrf52840.md",
    "nRF5340": "nrf5340.md",
    "CR2032": "cr2032.md",
    "CR2450": "cr2450.md",
    "MQTT": "mqtt.md",
    "BLE": "ble.md",
    "IP54": "ip54.md",
    "IP65": "ip65.md",
    "PETG": "petg.md",
    "CSV": "csv.md",
    "UART": "uart.md",
    "RSSI": "rssi.md"
}

markdown_page = """
# Aurora Labs

## Overview

Aurora Labs is a company founded by Mira Chen and Jonah Park, born from a shared frustration with IoT sensors that have short battery lives and require proprietary cloud accounts. Their mission statement (draft) is "Open sensors for people who own their data." The company's primary product is the **Nova Widget**, an IoT sensor system designed for home gardeners and small-acreage farmers, utilizing a custom mesh networking protocol called **MeshSync**.

## Key Details

### Mission and Vision
*   **Mission Statement (draft):** "Open sensors for people who own their data."
*   **Founding Principle:** Address the issues of short battery life and mandatory cloud accounts in IoT sensors.

### Products and Technology

*   **Nova Widget:**
    *   **Target Users:** Home gardeners and small-acreage farmers.
    *   **v1 Scope:** Measures soil moisture (capacitive), air temperature, and ambient light (simple photodiode).
    *   **Connectivity:** Uses BLE to a phone for setup and a custom mesh protocol (MeshSync) for range extension between nodes.
    *   **Data Export:** Supports CSV and MQTT export; no subscription cloud dashboard.
    *   **Enclosure:** 3D printed PETG for beta, with plans for injection molding. The enclosure features a pebble shape.
    *   **Environmental Rating:** IP54 for beta units, with a target of IP65 once tooling is funded.
*   **MeshSync:**
    *   **Description:** A custom mesh networking protocol developed by Mira Chen.
    *   **MCU:** Primarily uses the nRF52840, with profiling for rejoin spikes being done on the nRF5340 eval board.
    *   **Stability:** Stable at 6 nodes in lab environments. While 8-node stability has been achieved in some tests, 8+ nodes are still reported as unstable in field reports (ticket #2099). Six nodes are recommended for beta customers.
    *   **Naming:** The name "MeshSync" has been consistently chosen over "MeshSink" after multiple rejections of the latter.
*   **MeshSync Firmware 0.3.8 Release (2026-07-02):**
    *   **Highlights:**
        *   Mitigation of rejoin storms when the mesh exceeds 6 nodes.
        *   Parent election logging (RSSI + hop count) exported via debug UART.
        *   Power spike on rejoin reduced from 340µA to 180µA (still above the 110µA target).
    *   **Breaking Changes:**
        *   Default read interval confirmed at 15 minutes (not hourly).
        *   MQTT export schema v2 (optional, for local brokers only).
    *   **Known Issues:**
        *   8+ nodes still unstable in field reports.
        *   Battery life claims: Engineering estimates 18 months @ 10 nodes, while marketing may still state 2 years.

### Technical Specifications

*   **MCU:** nRF52840 (Jonah Park has dev boards).
*   **Power Target:** Originally aimed for 2 years on a CR2032 battery with hourly readings.
*   **Battery Type:** CR2032.
*   **Read Interval:** Default read interval is 15 minutes.

### Key Personnel

*   **Mira Chen:** Co-founder, responsible for firmware, MeshSync protocol development, and power profiling.
*   **Jonah Park:** Co-founder, responsible for PCB design, sensor integration, and mechanical design, as well as QA sign-off.

### Beta Program

*   **Enrollment:** Aurora Labs is actively inviting more beta testers, particularly from homelab forums.
*   **Recommendations:** Beta customers are recommended to use a maximum of 6 nodes for optimal stability.
*   **Defaults:** Beta testers receive devices configured with a 15-minute default read interval.

### Competitive Landscape

*   Aurora Labs differentiates itself from competitors like SenseNode (e.g., SN-400) through its local mesh architecture without subscriptions, partially open firmware, and focus on community integrations. Jonah Park is updating a comparison page against SenseNode.

## Related Entities

*   **SenseNode SN-400:** A competitor product against which Aurora Labs benchmarks its Nova Widget.
*   **TeaBuddy:** A potential co-marketing partner. Alex, a friend of the founders, is involved. While a "smart garden tea" partnership was rejected, co-marketing efforts are being revisited.
*   **Alex:** A friend of the founders, involved in discussions regarding TeaBuddy.

## Related Concepts

*   **IoT Sensors:** The core product category for Aurora Labs.
*   **Mesh Networking:** The foundational technology (MeshSync) for node communication and range extension.
*   **Open Hardware/Firmware:** A key differentiator and part of Aurora Labs' mission to give users data ownership.
*   **Battery Life Optimization:** A critical focus area, with ongoing efforts to reduce power consumption and improve longevity.
*   **Contradiction Linter:** An internal tool or process identified as an action item to flag inconsistencies in documentation, particularly regarding battery claims.

## Contradictions

*   **Battery Life Claims:**
    *   **Contradiction:** Engineering estimates 18 months at 10 nodes with 15-minute reads, while marketing materials may still round this up to 2 years. An action item exists to implement a contradiction linter for battery claims and publish the power budget spreadsheet.
*   **Default Read Interval:**
    *   **Contradiction:** Kickoff slides initially stated an hourly default read interval. However, the product specification and MeshSync firmware 0.3.8 confirm the default read interval is 15 minutes. Despite this, internal documentation (e.g., "docs") still incorrectly states an hourly default.
*   **Battery Type:**
    *   **Contradiction:** A teardown by "Alex" incorrectly stated the use of a CR2450 battery, whereas Aurora Labs products use a CR2032 battery.
*   **Rejoin Power Spike:**
    *   **Contradiction:** MeshSync firmware 0.3.8 release notes state the power spike on rejoin was reduced to 180µA, which is "still above 110µA target." However, a weekly sync transcript from 2026-05-28 mentions "still seeing spike to 110 µA when a node rejoins." This suggests either the 110µA is the *actual* spike observed at that time, or the target was being confused with the observed value. The 0.3.8 release notes, being more recent and formal, indicate the spike is 180µA.

## Sources

*   `dummy-test/2026-07-02-aurora-meshsync-release-notes.md`
*   `notes/2026-05-01-kickoff-notes.md`
*   `samples/notes/[SAMPLE]-2026-06-16-sprint-retro-aurora.txt`
*   `samples/notes/[SAMPLE]-2026-07-10-sprint-planning-aurora.txt`
*   `samples/transcripts/[SAMPLE]-2026-07-02-investor-call-fragment.txt`
*   `transcripts/2026-05-28-weekly-sync.md`
"""

# Generate the linked markdown
linked_markdown_output = link_wiki_page(markdown_page, current_page_title, topic_index)
print(linked_markdown_output)
```
```markdown
# Aurora Labs

## Overview

Aurora Labs is a company founded by [Mira Chen](./mira-chen.md) and [Jonah Park](./jonah-park.md), born from a shared frustration with [IoT Sensors](./iot-sensors.md) that have short battery lives and require proprietary cloud accounts. Their mission statement (draft) is "Open sensors for people who own their data." The company's primary product is the **[Nova Widget](./nova-widget.md)**, an IoT sensor system designed for home gardeners and small-acreage farmers, utilizing a custom mesh networking protocol called **[MeshSync](./meshsync.md)**.

## Key Details

### Mission and Vision
*   **Mission Statement (draft):** "Open sensors for people who own their data."
*   **Founding Principle:** Address the issues of short battery life and mandatory cloud accounts in IoT sensors.

### Products and Technology

*   **Nova Widget:**
    *   **Target Users:** Home gardeners and small-acreage farmers.
    *   **v1 Scope:** Measures soil moisture (capacitive), air temperature, and ambient light (simple photodiode).
    *   **Connectivity:** Uses [BLE](./ble.md) to a phone for setup and a custom mesh protocol (MeshSync) for range extension between nodes.
    *   **Data Export:** Supports [CSV](./csv.md) and [MQTT](./mqtt.md) export; no subscription cloud dashboard.
    *   **Enclosure:** 3D printed [PETG](./petg.md) for beta, with plans for injection molding. The enclosure features a pebble shape.
    *   **Environmental Rating:** [IP54](./ip54.md) for beta units, with a target of [IP65](./ip65.md) once tooling is funded.
*   **MeshSync:**
    *   **Description:** A custom mesh networking protocol developed by Mira Chen.
    *   **MCU:** Primarily uses the [nRF52840](./nrf52840.md), with profiling for rejoin spikes being done on the [nRF5340](./nrf5340.md) eval board.
    *   **Stability:** Stable at 6 nodes in lab environments. While 8-node stability has been achieved in some tests, 8+ nodes are still reported as unstable in field reports (ticket #2099). Six nodes are recommended for beta customers.
    *   **Naming:** The name "MeshSync" has been consistently chosen over "MeshSink" after multiple rejections of the latter.
*   **MeshSync Firmware 0.3.8 Release (2026-07-02):**
    *   **Highlights:**
        *   Mitigation of rejoin storms when the mesh exceeds 6 nodes.
        *   Parent election logging ([RSSI](./rssi.md) + hop count) exported via debug [UART](./uart.md).
        *   Power spike on rejoin reduced from 340µA to 180µA (still above the 110µA target).
    *   **Breaking Changes:**
        *   Default read interval confirmed at 15 minutes (not hourly).
        *   MQTT export schema v2 (optional, for local brokers only).
    *   **Known Issues:**
        *   8+ nodes still unstable in field reports.
        *   Battery life claims: Engineering estimates 18 months @ 10 nodes, while marketing may still state 2 years.

### Technical Specifications

*   **MCU:** nRF52840 (Jonah Park has dev boards).
*   **Power Target:** Originally aimed for 2 years on a [CR2032](./cr2032.md) battery with hourly readings.
*   **Battery Type:** CR2032.
*   **Read Interval:** Default read interval is 15 minutes.

### Key Personnel

*   **Mira Chen:** Co-founder, responsible for firmware, MeshSync protocol development, and power profiling.
*   **Jonah Park:** Co-founder, responsible for PCB design, sensor integration, and mechanical design, as well as QA sign-off.

### Beta Program

*   **Enrollment:** Aurora Labs is actively inviting more beta testers, particularly from homelab forums.
*   **Recommendations:** Beta customers are recommended to use a maximum of 6 nodes for optimal stability.
*   **Defaults:** Beta testers receive devices configured with a 15-minute default read interval.

### Competitive Landscape

*   Aurora Labs differentiates itself from competitors like [SenseNode](./sensenode.md) (e.g., [SN-400](./sensenode-sn-400.md)) through its local mesh architecture without subscriptions, partially [Open Hardware/Firmware](./open-hardware-firmware.md), and focus on community integrations. Jonah Park is updating a comparison page against SenseNode.

## Related Entities

*   **SenseNode SN-400:** A competitor product against which Aurora Labs benchmarks its Nova Widget.
*   **[TeaBuddy](./teabuddy.md):** A potential co-marketing partner. [Alex](./alex.md), a friend of the founders, is involved. While a "smart garden tea" partnership was rejected, co-marketing efforts are being revisited.
*   **Alex:** A friend of the founders, involved in discussions regarding TeaBuddy.

## Related Concepts

*   **IoT Sensors:** The core product category for Aurora Labs.
*   **[Mesh Networking](./mesh-networking.md):** The foundational technology (MeshSync) for node communication and range extension.
*   **Open Hardware/Firmware:** A key differentiator and part of Aurora Labs' mission to give users data ownership.
*   **[Battery Life Optimization](./battery-life-optimization.md):** A critical focus area, with ongoing efforts to reduce power consumption and improve longevity.
*   **[Contradiction Linter](./contradiction-linter.md):** An internal tool or process identified as an action item to flag inconsistencies in documentation, particularly regarding battery claims.

## Contradictions

*   **Battery Life Claims:**
    *   **Contradiction:** Engineering estimates 18 months at 10 nodes with 15-minute reads, while marketing materials may still round this up to 2 years. An action item exists to implement a contradiction linter for battery claims and publish the power budget spreadsheet.
*   **Default Read Interval:**
    *   **Contradiction:** Kickoff slides initially stated an hourly default read interval. However, the product specification and MeshSync firmware 0.3.8 confirm the default read interval is 15 minutes. Despite this, internal documentation (e.g., "docs") still incorrectly states an hourly default.
*   **Battery Type:**
    *   **Contradiction:** A teardown by "Alex" incorrectly stated the use of a [CR2450](./cr2450.md) battery, whereas Aurora Labs products use a CR2032 battery.
*   **Rejoin Power Spike:**
    *   **Contradiction:** MeshSync firmware 0.3.8 release notes state the power spike on rejoin was reduced to 180µA, which is "still above 110µA target." However, a weekly sync transcript from 2026-05-28 mentions "still seeing spike to 110 µA when a node rejoins." This suggests either the 110µA is the *actual* spike observed at that time, or the target was being confused with the observed value. The 0.3.8 release notes, being more recent and formal, indicate the spike is 180µA.

## Sources

*   `dummy-test/2026-07-02-aurora-meshsync-release-notes.md`
*   `notes/2026-05-01-kickoff-notes.md`
*   `samples/notes/[SAMPLE]-2026-06-16-sprint-retro-aurora.txt`
*   `samples/notes/[SAMPLE]-2026-07-10-sprint-planning-aurora.txt`
*   `samples/transcripts/[SAMPLE]-2026-07-02-investor-call-fragment.txt`
*   `transcripts/2026-05-28-weekly-sync.md`
```
