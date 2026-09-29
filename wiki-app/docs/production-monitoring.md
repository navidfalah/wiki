---
id: production-monitoring
title: Production monitoring
tags:
- monitoring
- production
- inverters
- battery-storage
last_updated: '2026-09-29T00:00:00+00:00'
sidebar_label: Production monitoring
slug: /production-monitoring
page_type: concept
---

<!-- SEED PAGE — written by hand from data/raw/ for the sample corpus (compiler/scripts/seed_pages.py). The next compile (`python main.py --force`) replaces it. -->

# Production monitoring

## Overview

The plant's data logger records production, school consumption, grid feed-in and battery charging every day. The monitoring configuration lists 399 Nordlicht NL-430 modules, three Kestrel K-60 inverters (WR-1 and WR-2 on the school roof, WR-3 on the sports hall) and the 100 kWh battery.

## Key Details

- Best day so far: 27 August 2026 with 1,061 kWh.
- Weakest full day so far: 23 August 2026 with 402 kWh.
- Energy from 19 August to 14 September 2026: 21,615 kWh in total.
- School consumption jumped when the school year began on 7 September 2026.
- Inverter WR-3 reports warning ISO-217 on some mornings; see [Inverter isolation warning](./inverter-isolation-warning.md).

## Related Entities

- [Grundschule am Lindenhof](./grundschule-am-lindenhof.md)

## Related Concepts

- [Battery storage](./battery-storage.md)

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `monitoring/2026-09-pv-daily-production.csv` | file | High |
| 2 | `monitoring/2026-09-15-inverter-status.json` | file | High |
| 3 | `monitoring/2026-09-14-datalogger.log` | file | High |
| 4 | `monitoring/site-config.yaml` | file | High |
| 5 | `monitoring/2026-09-battery-events.tsv` | file | High |
