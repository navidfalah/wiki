---
id: support-tickets
title: Support Tickets
tags:
  - aurora-nova-widget-v2
  - jonah
  - meshsync
  - mira
  - rejoin-loop
  - sensenode
  - support-tickets
  - wiki
last_updated: "2026-09-10T14:40:52.408087+00:00"
sidebar_label: Support Tickets
slug: /support-tickets
---

<!-- AUTO-GENERATED — compiled by the LLM Wiki compiler from data/raw/ sources into compiler/temp_output/, then linked here. Edits to this file are overwritten on the next compile: edit sources under data/raw/, or manual cross-links in data/link_overrides.json, instead. -->

# Support Tickets

## Overview

Support tickets track customer inquiries, reported issues, and internal resolutions regarding various products. A prominent example is Support Ticket #2099, which addresses a critical [MeshSync](./meshsync.md) rejoin loop issue affecting the [Aurora Nova Widget v2 beta](./aurora-nova-widget-v2.md).

## Key Details

* **Ticket Number:** #2099
* **Status:** OPEN
* **Product:** Aurora Nova Widget v2 beta
* **Customer Profile:** [Homelab](./homelab.md) enthusiast (redacted)
* **Reported Issue:** After adding an 8th node to the network, the entire mesh stops reporting for hours. A power cycle provides only a temporary fix.
* **Agent Handling ([Mira](./aurora-nova-widget-v2.md)):** Identified the problem as a known issue involving a rejoin spike. A [firmware](./firmware.md) fix is targeted for version 0.3.8.
* **Agent Recommendation:** Advise the customer to limit their deployment to 6 nodes until the patch is released.
* **Product Tradeoffs:** MeshSync allows users to avoid cloud subscriptions, but introduces complexity at scale compared to alternatives like [SenseNode](./sensenode.md).

## Related Entities

* **Mira:** Support agent who diagnosed the rejoin spike issue and noted the upcoming 0.3.8 firmware fix.
* **Jonah:** Internal team member who suggested adding a comparison point regarding SenseNode's simpler topology and subscription model to a comparison page.
* **SenseNode:** A competing or neighbor device that handles 10 devices easily with a simpler topology, though it relies on a cloud subscription.
* **Aurora Nova Widget v2 beta:** The product experiencing the MeshSync rejoin loop bug.

## Related Concepts

* **MeshSync:** A decentralization protocol allowing [mesh networking](./mesh-networking.md) without cloud subscriptions, though it presents scaling and topology complexity tradeoffs.
* **Rejoin Loop / Rejoin Spike:** A network stability issue occurring when multiple nodes simultaneously attempt to rejoin the mesh, causing reporting outages.
* **Related Tickets:** Ticket #1042 (waterproof) and Ticket #2101 (battery math docs wrong).

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `samples/support/[SAMPLE]-2026-06-27-ticket-2099-mesh-rejoin.txt` | text | Unverified |
