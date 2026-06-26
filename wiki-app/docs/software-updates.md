---
id: software-updates
title: Software Updates
tags:
  - software updates
  - firmware
  - bug fixes
  - nova widget
  - teabuddy
  - ios 18
  - version 0.3.8
  - version 0.9.3
last_updated: "2026-06-25T07:59:08.524057+00:00"
sidebar_label: Software Updates
slug: /software-updates
---

```python
import re

def inject_wiki_links(markdown_page: str, current_page_title: str, topic_index: dict) -> str:
    """
    Injects internal markdown links into a wiki page draft based on a topic index.

    Args:
        markdown_page: The markdown content of the wiki page draft.
        current_page_title: The title of the current page, which should not be linked.
        topic_index: A dictionary mapping topic titles to their filenames.

    Returns:
        The markdown page with internal links injected.
    """

    all_matches = []
    # Sort topics by length in descending order to prioritize longer, more specific matches
    # (e.g., "Nova Widget" before "Nova" if "Nova" were also a topic).
    sorted_topics = sorted(topic_index.items(), key=lambda item: len(item[0]), reverse=True)

    # Step 1: Find all potential link candidates in the original text.
    for topic_title, filename in sorted_topics:
        # Escape special characters in the topic title for regex matching.
        escaped_topic = re.escape(topic_title)
        # Use word boundaries (\b) to ensure we match whole words/phrases.
        # This prevents linking "Nova" within "Nova Widgets" if "Nova" is not a topic itself,
        # and correctly handles punctuation adjacent to the topic (e.g., "iOS 18." will match "iOS 18").
        for match in re.finditer(r'\b' + escaped_topic + r'\b', markdown_page):
            all_matches.append({
                "topic": topic_title,
                "filename": filename,
                "start": match.start(),
                "end": match.end()
            })

    # Step 2a: Remove candidates that are the current page title.
    filtered_matches = [m for m in all_matches if m["topic"] != current_page_title]

    # Step 2b: Remove candidates that overlap with existing markdown links or code spans.
    existing_spans = []

    # Find code spans (single or double backticks)
    for match in re.finditer(r'`{1,2}[^`]*?`{1,2}', markdown_page):
        existing_spans.append((match.start(), match.end()))

    # Find markdown links ([text](url))
    for match in re.finditer(r'\[[^\]]+\]\([^\)]+\)', markdown_page):
        existing_spans.append((match.start(), match.end()))

    # Sort existing spans by start index for efficient overlap checking.
    existing_spans.sort()

    def overlaps(match_start, match_end, existing_spans_list):
        """Checks if a given match range overlaps with any existing span."""
        for span_start, span_end in existing_spans_list:
            # Overlap exists if the intersection is not empty.
            if max(match_start, span_start) < min(match_end, span_end):
                return True
        return False

    non_overlapping_matches = []
    for match in filtered_matches:
        if not overlaps(match["start"], match["end"], existing_spans):
            non_overlapping_matches.append(match)

    # Step 2c: For each topic, keep only the *first meaningful mention*.
    # Sort by start index to find the earliest occurrence.
    non_overlapping_matches.sort(key=lambda x: x["start"])

    final_matches_to_link = []
    linked_topics_this_pass = set() # Tracks topics already selected for linking.

    for match in non_overlapping_matches:
        if match["topic"] not in linked_topics_this_pass:
            final_matches_to_link.append(match)
            linked_topics_this_pass.add(match["topic"])

    # Step 3: Sort the remaining candidates by `start_index` in descending order.
    # This is crucial for string replacement to avoid invalidating indices of subsequent replacements.
    final_matches_to_link.sort(key=lambda x: x["start"], reverse=True)

    # Step 4: Iterate through the sorted candidates and perform the replacements.
    modified_markdown = markdown_page
    for match in final_matches_to_link:
        topic = match["topic"]
        filename = match["filename"]
        start = match["start"]
        end = match["end"]

        link_text = f"[{topic}](./{filename})"
        modified_markdown = modified_markdown[:start] + link_text + modified_markdown[end:]

    return modified_markdown

# Provided inputs
current_page_title = "Software Updates"

topic_index = {
    "Nova Widget": "nova-widget.md",
    "TeaBuddy": "teabuddy.md",
    "MeshSync": "meshsync.md",
    "BLE": "ble.md",
    "iOS 18": "ios-18.md",
    "SenseNode": "sensenode.md",
    "IP67": "ip67.md",
    "IP54": "ip54.md",
    "CR2450": "cr2450.md",
    "CR2032": "cr2032.md",
    "Alex": "alex.md",
    "Bug Fixes": "bug-fixes.md",
    "Firmware Versions": "firmware-versions.md",
    "App Compatibility": "app-compatibility.md",
    "Device Pairing": "device-pairing.md",
    "Battery Specifications": "battery-specifications.md",
    "Waterproofing": "waterproofing.md"
}

markdown_page = """
# Software Updates

## Overview
Software updates are crucial for maintaining device functionality, addressing bugs, and ensuring compatibility with new operating systems and hardware. This page details recent updates and known issues for products like the Nova Widget and TeaBuddy, including specific firmware versions and resolutions for common customer support inquiries.

## Key Details

### Nova Widget Updates
*   **Application**: The Nova Widget utilizes the MeshSync garden app for its operations.
*   **Rejoin Loop Issue**:
    *   **Problem**: Customers have reported a "rejoin loop" issue, identified by ticket #2099.
    *   **Resolution**: This issue is a known problem and is resolved by updating the device firmware to **version 0.3.8**.
    *   **Constraint**: To prevent recurrence, users should ensure their setup stays at a maximum of six nodes.

### TeaBuddy Updates
*   **Application**: The TeaBuddy puck uses a BLE kitchen app for connectivity.
*   **iOS 18 Pairing Issue**:
    *   **Problem**: Initial reports indicated difficulties with TeaBuddy pairing on devices running iOS 18.
    *   **Resolution**: This pairing issue has been fixed in **version 0.9.3** of the TeaBuddy firmware.
*   **TB-142 Cancel Bug**:
    *   **Problem**: A specific bug, referred to as the TB-142 cancel bug, has been identified.
    *   **Resolution**: This bug can be resolved by performing a long-press reset on the TeaBuddy device.

### Related Information
*   **Battery Type Clarification**: There was a typo in a blog post (Alex's blog) regarding the battery type, incorrectly listing CR2450. The correct battery type used is **CR2032**. This has been corrected in the wiki and Alex's blog.
*   **Waterproofing Comparison**: While not directly a software update, customer inquiries sometimes involve device specifications. The SenseNode product is noted to have an IP67 waterproof rating, whereas the Nova Widget has an **IP54** rating. For Nova Widget users concerned about water exposure, a cover is recommended, and a comparison page is available.

## Related Entities
*   **Nova Widget**: A device that uses the MeshSync garden app and was affected by a rejoin loop issue.
*   **TeaBuddy**: A device that uses a BLE kitchen app and had pairing issues with iOS 18 and a specific cancel bug.
*   **Alex**: An individual whose blog was updated to correct a battery specification typo.
*   **iOS 18**: An operating system version that initially had compatibility issues with TeaBuddy pairing.

## Related Concepts
*   **Bug Fixes**: Resolutions for identified software defects.
*   **Firmware Versions**: Specific iterations of software embedded in hardware devices.
*   **App Compatibility**: The ability of a device's software to function correctly with specific mobile applications.
*   **Device Pairing**: The process of establishing a connection between two electronic devices, often wirelessly.
*   **Battery Specifications**: Details regarding the type and size of batteries used in devices.
*   **Waterproofing**: The degree to which a device is protected against water ingress, indicated by IP ratings.

## Contradictions
No direct contradictions were found within the provided source material regarding software updates.

## Sources
*   `samples/transcripts/[SAMPLE]-2026-07-09-support-training-roleplay.txt`
"""

# Generate the updated markdown
updated_markdown = inject_wiki_links(markdown_page, current_page_title, topic_index)
print(updated_markdown)
```
# Software Updates

## Overview
Software updates are crucial for maintaining device functionality, addressing bugs, and ensuring compatibility with new operating systems and hardware. This page details recent updates and known issues for products like the [Nova Widget](./nova-widget.md) and [TeaBuddy](./teabuddy.md), including specific firmware versions and resolutions for common customer support inquiries.

## Key Details

### Nova Widget Updates
*   **Application**: The Nova Widget utilizes the [MeshSync](./meshsync.md) garden app for its operations.
*   **Rejoin Loop Issue**:
    *   **Problem**: Customers have reported a "rejoin loop" issue, identified by ticket #2099.
    *   **Resolution**: This issue is a known problem and is resolved by updating the device firmware to **version 0.3.8**.
    *   **Constraint**: To prevent recurrence, users should ensure their setup stays at a maximum of six nodes.

### TeaBuddy Updates
*   **Application**: The TeaBuddy puck uses a [BLE](./ble.md) kitchen app for connectivity.
*   **iOS 18 Pairing Issue**:
    *   **Problem**: Initial reports indicated difficulties with TeaBuddy pairing on devices running [iOS 18](./ios-18.md).
    *   **Resolution**: This pairing issue has been fixed in **version 0.9.3** of the TeaBuddy firmware.
*   **TB-142 Cancel Bug**:
    *   **Problem**: A specific bug, referred to as the TB-142 cancel bug, has been identified.
    *   **Resolution**: This bug can be resolved by performing a long-press reset on the TeaBuddy device.

### Related Information
*   **Battery Type Clarification**: There was a typo in a blog post ([Alex](./alex.md)'s blog) regarding the battery type, incorrectly listing [CR2450](./cr2450.md). The correct battery type used is [CR2032](./cr2032.md). This has been corrected in the wiki and Alex's blog.
*   **Waterproofing Comparison**: While not directly a software update, customer inquiries sometimes involve device specifications. The [SenseNode](./sensenode.md) product is noted to have an [IP67](./ip67.md) waterproof rating, whereas the Nova Widget has an [IP54](./ip54.md) rating. For Nova Widget users concerned about water exposure, a cover is recommended, and a comparison page is available.

## Related Entities
*   **Nova Widget**: A device that uses the MeshSync garden app and was affected by a rejoin loop issue.
*   **TeaBuddy**: A device that uses a BLE kitchen app and had pairing issues with iOS 18 and a specific cancel bug.
*   **Alex**: An individual whose blog was updated to correct a battery specification typo.
*   **iOS 18**: An operating system version that initially had compatibility issues with TeaBuddy pairing.

## Related Concepts
*   **[Bug Fixes](./bug-fixes.md)**: Resolutions for identified software defects.
*   **[Firmware Versions](./firmware-versions.md)**: Specific iterations of software embedded in hardware devices.
*   **[App Compatibility](./app-compatibility.md)**: The ability of a device's software to function correctly with specific mobile applications.
*   **[Device Pairing](./device-pairing.md)**: The process of establishing a connection between two electronic devices, often wirelessly.
*   **[Battery Specifications](./battery-specifications.md)**: Details regarding the type and size of batteries used in devices.
*   **[Waterproofing](./waterproofing.md)**: The degree to which a device is protected against water ingress, indicated by IP ratings.

## Contradictions
No direct contradictions were found within the provided source material regarding software updates.

## Sources
*   `samples/transcripts/[SAMPLE]-2026-07-09-support-training-roleplay.txt`
