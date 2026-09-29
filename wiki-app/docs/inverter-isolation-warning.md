---
id: inverter-isolation-warning
title: Inverter isolation warning
tags:
- inverters
- iso-217
- wr-3
- maintenance
last_updated: '2026-09-29T00:00:00+00:00'
sidebar_label: Inverter isolation warning
slug: /inverter-isolation-warning
page_type: concept
---

<!-- SEED PAGE — written by hand from data/raw/ for the sample corpus (compiler/scripts/seed_pages.py). The next compile (`python main.py --force`) replaces it. -->

# Inverter isolation warning

## Overview

Since 3 September 2026, inverter WR-3 (sports hall roof) has reported warning ISO-217: the isolation resistance on string 7 is low, 180 kOhm against a limit of 500 kOhm. The warning appears in the early morning and clears once the inverter starts feeding in, e.g. on 14 September 2026 at 05:44 and cleared at 06:12.

## Key Details

- Six occurrences by the monitoring snapshot of 15 September 2026.
- String 7 on WR-3 is the string whose faulty fuse the installer replaced before commissioning.
- The alert threshold in the monitoring configuration is 500 kOhm.

## Related Concepts

- [Production monitoring](./production-monitoring.md)

## References & Trust

| # | Source | Type | Trust |
|---|--------|------|-------|
| 1 | `monitoring/2026-09-15-inverter-status.json` | file | High |
| 2 | `monitoring/2026-09-14-datalogger.log` | file | High |
| 3 | `emails/2026-08-19-inbetriebnahme-bericht.eml` | email | Medium |
