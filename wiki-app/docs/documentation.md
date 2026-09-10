---
id: documentation
title: Documentation
tags:
  - alex
  - aurora-nova-widget
  - battery-specification
  - battery-status-indication
  - contradiction-documentation
  - documentation
  - docusaurus
  - meshsink
last_updated: "2026-09-10T14:37:53.773237+00:00"
sidebar_label: Documentation
slug: /documentation
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Documentation

## Overview
Documentation serves as a foundational component for managing project knowledge, tracking [product specifications](./product-specifications.md), and handling [customer support](./customer-support.md) inquiries. Maintaining accurate wiki pages involves addressing contradictions explicitly, streamlining pipelines (such as compiling raw text files to Markdown and Docusaurus), and eliminating orphan pages through automated linters.

## Key Details
* **[Battery Specifications](./battery-specifications.md) & Corrections:** Early confusion arose regarding the [Aurora Nova Widget](./aurora-nova-widget.md) battery specification due to conflicting reports between an initial teardown blog (which listed a CR2450 battery) and official documentation (specifying a CR2032 battery). The teardown blog was subsequently corrected.
* **Battery Longevity & Usage Factors:** [Marketing](./marketing.md) materials claim a 2-year [battery life](./battery-life.md), whereas forum discussions sometimes cite 18 months.
* **Battery Status Indication:** Proposed [hardware](./hardware.md) features include a color-coded LED indicator on devices to signal critical "I'm dying" battery states.
* **Documentation Maintenance:** Best practices emphasize documenting contradictions explicitly within wiki pages and overcoming the common issue of outdated index files.

## Related Entities
* **Aurora Nova Widget:** The hardware product subject to battery specification inquiries and documentation updates.
* **Alex:** Author of the teardown blog that initially listed the incorrect battery type.
* **[Aurora Labs](./aurora-labs.md):** The organization associated with the beta unit and widget development.
* **[Mira](./aurora-nova-widget-v2.md):** Support agent who handled ticket #2201 clarifying battery specs.
* **[TeaBuddy](./teabuddy.md):** A separate product and company often mistaken for sharing the same application.
* **[MeshSync](./meshsync.md) / MeshSink:** A naming iteration considered and rejected multiple times.

## Related Concepts
* **Docusaurus:** Used as the publishing platform for Markdown-based wiki pages and documentation pipelines.
* **[Wiki Maintenance](./wiki-maintenance.md):** Concepts include linting to detect and prevent orphan pages, and compiling raw text notes (`.txt` to `.md`).

## Contradictions
&gt; **Contradiction:** Discrepancies exist between marketing materials and community forums regarding battery life longevity. Marketing states a 2-year battery life, while forum posts suggest 18 months. Additionally, an earlier teardown blog incorrectly reported a CR2450 battery instead of the official CR2032 specification.

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `notes/ideas/backlog-shower-thoughts.txt` | text | Medium |
| 2 | `samples/support/[SAMPLE]-2026-07-01-ticket-2201-battery-docs.txt` | text | Unverified |
