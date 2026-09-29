"""Seed wiki pages for the sample corpus, written by hand from data/raw/.

The compiler needs an LLM to build wiki-app/docs/. So that the app, the
search, the e2e suite and the offline evals have a wiki to work on in a
checkout without an API key, this script writes one page per topic of the
BürgerEnergie Eschenbrück sample corpus (see build_sample_corpus.py), in
the compiler's own page format: frontmatter, Overview / Key Details /
Related / Contradictions sections, and a References & Trust table rendered
by trust.py. The index is then built with moc_generator.py.

    python scripts/seed_pages.py        # rewrite wiki-app/docs/ (removes other .md pages)

A real compile (`python main.py --force`) replaces these pages.
"""

from __future__ import annotations

import sys
from pathlib import Path

COMPILER_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(COMPILER_DIR))

import yaml  # noqa: E402

from models import OUTPUT_DIR  # noqa: E402
from trust import build_references, load_trust_config, render_references_markdown  # noqa: E402

LAST_UPDATED = "2026-09-29T00:00:00+00:00"
BANNER = (
    "<!-- SEED PAGE — written by hand from data/raw/ for the sample corpus "
    "(compiler/scripts/seed_pages.py). The next compile (`python main.py --force`) "
    "replaces it. -->"
)

S = {
    "jan": "meetings/2026-01-20-board-minutes.docx",
    "survey": "survey/2026-02-member-survey-results.json",
    "grant": "project/2026-02-10-foerderantrag-klimakommunal.pdf",
    "plan": "project/2026-03-02-project-plan.docx",
    "flyer": "public/2026-03-15-mitglieder-flyer.html",
    "gridreq": "emails/2026-03-18-netzanschlussanfrage.eml",
    "lease": "project/2026-03-26-dachnutzungsvertrag-zusammenfassung.txt",
    "statik": "project/2026-04-22-structural-survey-summary.pdf",
    "notes": "project/2026-04-30-selin-field-notes.txt",
    "site": "meetings/2026-05-06-site-meeting-transcript.txt",
    "delay": "emails/2026-05-12-lichtbau-modulverzoegerung.eml",
    "subst": "emails/2026-05-13-re-modulverzoegerung.eml",
    "layout": "media/2026-05-lindenhof-roof-layout.png",
    "budget": "finance/2026-05-18-budget-revision.xlsx",
    "gv": "meetings/2026-06-13-generalversammlung-protokoll.md",
    "slides": "presentations/2026-06-13-agm-slides.pptx",
    "grid": "emails/2026-06-24-netzanschlusszusage.eml",
    "shares": "finance/2026-06-30-member-shares-by-year.csv",
    "question": "emails/2026-07-08-mitgliederfrage-anteil.eml",
    "reply": "emails/2026-07-09-re-mitgliederfrage-anteil.eml",
    "jul": "meetings/2026-07-15-board-minutes.md",
    "faq": "public/faq.md",
    "invoices": "archive/2026-08-invoices.zip",
    "commission": "emails/2026-08-19-inbetriebnahme-bericht.eml",
    "press": "press/2026-08-22-eschenbruecker-anzeiger.md",
    "production": "monitoring/2026-09-pv-daily-production.csv",
    "battery_events": "monitoring/2026-09-battery-events.tsv",
    "log": "monitoring/2026-09-14-datalogger.log",
    "status": "monitoring/2026-09-15-inverter-status.json",
    "config": "monitoring/site-config.yaml",
}


def source_type(path: str) -> str:
    if path.endswith(".eml"):
        return "email"
    if path.endswith((".png", ".jpg")):
        return "image"
    if path.endswith((".md", ".txt")):
        return "text"
    return "file"


PAGES: list[dict] = []


def page(slug: str, title: str, tags: list[str], page_type: str, sources: list[str], body: str) -> None:
    PAGES.append({"slug": slug, "title": title, "tags": tags, "type": page_type, "sources": sources, "body": body.strip()})


# --- Organisation --------------------------------------------------------------

page(
    "buergerenergie-eschenbrueck",
    "BürgerEnergie Eschenbrück eG",
    ["cooperative", "buergerenergie-eschenbrueck", "membership", "sonnendach-lindenhof"],
    "entity",
    ["jan", "shares", "gv", "slides", "jul", "press", "survey"],
    """
## Overview

BürgerEnergie Eschenbrück eG is the citizens' energy cooperative of the village of Eschenbrück. It was founded in 2019 and is run by a three-person board: Dr. Hanna Vogt (chair), Tobias Brandt (finance) and Selin Aydın (technology). Klaus Reimann chairs the supervisory board. In 2026 the cooperative built its largest project so far, the [Sonnendach Lindenhof](./sonnendach-lindenhof.md) solar plant on the Grundschule am Lindenhof.

## Key Details

- **Members:** 388 members at the end of 2025, 412 at the general assembly on 13 June 2026 and 419 by 15 July 2026 (see [Membership and shares](./membership-and-shares.md)).
- **Shares:** one share costs 250 euros; a member can hold at most 40 shares. 6,242 shares were issued by 30 June 2026.
- **Dividend:** 2.0 % for 2025; the target from 2027 is 3 % (see [Dividend policy](./dividend-policy.md)).
- **Growth:** the member register shows 61 founding members in 2019 and between 24 and 84 new members every year since.
- **Member voice:** in the February 2026 [member survey](./member-survey-2026.md), 89 % of the 214 respondents supported the solar plant.

## Related Entities

- [Hanna Vogt](./hanna-vogt.md), [Tobias Brandt](./tobias-brandt.md), [Selin Aydın](./selin-aydin.md) — the board.
- [Gemeinde Eschenbrück](./gemeinde-eschenbrueck.md) — the municipality that leases the school roofs.

## Related Concepts

- [General assembly 2026](./general-assembly-2026.md)
- [Freibad heat pump pilot](./freibad-heat-pump-pilot.md) — the next planned project.
""",
)

page(
    "hanna-vogt",
    "Hanna Vogt",
    ["person", "board", "buergerenergie-eschenbrueck"],
    "entity",
    ["jan", "grant", "lease", "gv", "press"],
    """
## Overview

Dr. Hanna Vogt is the chair of the board (Vorstandsvorsitzende) of [BürgerEnergie Eschenbrück eG](./buergerenergie-eschenbrueck.md). She signed the KlimaKommunal grant application on 10 February 2026 and, with Tobias Brandt, the roof lease with the municipality on 26 March 2026.

## Key Details

- Raised the idea of a heat pump for the Freibad Eschenbrück at the board meeting on 20 January 2026.
- Reported on the Sonnendach Lindenhof project at the general assembly on 13 June 2026.
- Quoted in the Eschenbrücker Anzeiger after commissioning: "Das ist ein Projekt von Eschenbrückern für Eschenbrück."

## Related Entities

- [Tobias Brandt](./tobias-brandt.md), [Selin Aydın](./selin-aydin.md)
- [Gemeinde Eschenbrück](./gemeinde-eschenbrueck.md)
""",
)

page(
    "tobias-brandt",
    "Tobias Brandt",
    ["person", "board", "finance", "buergerenergie-eschenbrueck"],
    "entity",
    ["jan", "gv", "reply", "jul"],
    """
## Overview

Tobias Brandt is the board member for finance (Vorstand Finanzen) of [BürgerEnergie Eschenbrück eG](./buergerenergie-eschenbrueck.md). He negotiated the loan with the [Raiffeisenkasse Talgrund](./raiffeisenkasse-talgrund.md), prepared the budget revision and wrote the minutes of the general assembly.

## Key Details

- Reported 388 members holding 5,912 shares at the end of 2025 (board meeting, 20 January 2026).
- Answered the member question about the flyer: a share costs 250 euros; the 200 euros on the March flyer are a printing error.
- Corrected the reprint of the flyer (board minutes, 15 July 2026).

## Related Concepts

- [Financing and budget](./financing-and-budget.md)
- [Membership and shares](./membership-and-shares.md)
""",
)

page(
    "selin-aydin",
    "Selin Aydın",
    ["person", "board", "technology", "sonnendach-lindenhof"],
    "entity",
    ["jan", "plan", "gridreq", "notes", "site", "subst", "gv"],
    """
## Overview

Selin Aydın is the technical board member (Vorstand Technik) of [BürgerEnergie Eschenbrück eG](./buergerenergie-eschenbrueck.md) and the technical lead of the [Sonnendach Lindenhof](./sonnendach-lindenhof.md) project. She owns the project plan, sent the grid connection request and ran the site meetings with the installer. The general assembly re-elected her to the board for three years on 13 June 2026.

## Key Details

- Presented the first concept of about 198 kWp in January 2026.
- Sent the grid connection request to Netze Mittelland on 18 March 2026.
- Approved the switch to 399 Nordlicht NL-430 modules on 13 May 2026 after the Helion delivery delay.
- Her field notes of 30 April 2026 record the structural limit of 165 kWp and the question whether the battery could be reduced to 100 kWh.

## Related Entities

- [Lichtbau Solartechnik](./lichtbau-solartechnik.md) — installer.
- [Grid connection](./grid-connection.md) — Netze Mittelland GmbH.
""",
)

page(
    "gemeinde-eschenbrueck",
    "Gemeinde Eschenbrück",
    ["municipality", "roof-lease", "grundschule-am-lindenhof"],
    "entity",
    ["jan", "lease", "notes", "site", "press"],
    """
## Overview

The Gemeinde Eschenbrück is the municipality that owns the Grundschule am Lindenhof and the Sporthalle Nord. Mayor (Bürgermeisterin) Petra Lindqvist signed the roof lease with the cooperative on 26 March 2026. Jonas Feld of the municipal building office (Bauamt) coordinated the building work on site.

## Key Details

- Leases both roofs for 1 euro per year (symbolic) for 20 years, with an option to extend by 5 years (see [Roof lease and power supply](./roof-lease-and-power-supply.md)).
- Buys the solar power for the school at 19.5 ct/kWh.
- Installs the F90 fire door for the battery room in the school basement; Jonas Feld said it would be installed in the week of 18 May 2026.
- Mayor Lindqvist praised the cooperation in the Eschenbrücker Anzeiger after commissioning.

## Related Entities

- [Grundschule am Lindenhof](./grundschule-am-lindenhof.md)
- [BürgerEnergie Eschenbrück eG](./buergerenergie-eschenbrueck.md)
""",
)

page(
    "grundschule-am-lindenhof",
    "Grundschule am Lindenhof",
    ["school", "roof-a", "sonnendach-lindenhof", "production"],
    "entity",
    ["plan", "lease", "statik", "production", "battery_events", "press"],
    """
## Overview

The Grundschule am Lindenhof is the primary school of Eschenbrück and the site of the [Sonnendach Lindenhof](./sonnendach-lindenhof.md) solar plant. Its concrete flat roof (roof A) carries 276 modules; the battery storage and the three inverters are in its basement. The school buys the solar power from the cooperative.

## Key Details

- Roof A was renovated in 2019 and has a load reserve of 0.85 kN/m2, enough for the plant without restrictions.
- Power purchase agreement: 19.5 ct/kWh for 20 years.
- School consumption of solar power rose from about 100 kWh to about 400 kWh per school day when the holidays ended on 7 September 2026; the battery started discharging for the first school day at 07:45 that morning.

## Related Entities

- [Gemeinde Eschenbrück](./gemeinde-eschenbrueck.md) — owner of the building.
- [Production monitoring](./production-monitoring.md)
""",
)

page(
    "lichtbau-solartechnik",
    "Lichtbau Solartechnik GmbH",
    ["installer", "lichtbau", "sonnendach-lindenhof", "solar-modules"],
    "entity",
    ["site", "delay", "subst", "budget", "invoices", "commission"],
    """
## Overview

Lichtbau Solartechnik GmbH is the installer of the [Sonnendach Lindenhof](./sonnendach-lindenhof.md) plant. Its project lead is Marco Petrović. Lichtbau supplied and mounted the modules, the three Kestrel K-60 inverters and the 100 kWh battery, and commissioned the plant on 19 August 2026.

## Key Details

- At the site meeting on 6 May 2026, Marco Petrović reported that Helion had quoted a delivery time of 14 weeks for the H-440 modules.
- On 12 May 2026 Lichtbau offered Nordlicht NL-430 modules from stock: 399 modules, 171.6 kWp in total.
- Contract value for modules, inverters, battery and mounting: 220,182 euros; the 20 % deposit invoice LB-2026-031 was 44,036.40 euros.
- Before energising, Lichtbau replaced a faulty string fuse on string 7 of inverter WR-3.

## Related Concepts

- [Solar modules](./solar-modules.md)
- [Commissioning timeline](./commissioning-timeline.md)
""",
)

page(
    "raiffeisenkasse-talgrund",
    "Raiffeisenkasse Talgrund",
    ["bank", "loan", "financing"],
    "entity",
    ["jan", "budget", "slides"],
    """
## Overview

The Raiffeisenkasse Talgrund is the bank that lends the cooperative 120,000 euros for the [Sonnendach Lindenhof](./sonnendach-lindenhof.md) project. Tobias Brandt started the loan talks after the board meeting on 20 January 2026.

## Key Details

- Loan: 120,000 euros at 3.1 % over 15 years, signed on 11 May 2026.
- The grant application of February 2026 still assumed a loan of 130,000 euros.

## Related Concepts

- [Financing and budget](./financing-and-budget.md)
""",
)

# --- Project -------------------------------------------------------------------

page(
    "sonnendach-lindenhof",
    "Sonnendach Lindenhof",
    ["sonnendach-lindenhof", "solar", "project", "battery-storage", "commissioning"],
    "concept",
    ["grant", "plan", "subst", "budget", "slides", "commission", "press", "config"],
    """
## Overview

Sonnendach Lindenhof is the rooftop solar plant that [BürgerEnergie Eschenbrück eG](./buergerenergie-eschenbrueck.md) built in 2026 on the Grundschule am Lindenhof and the Sporthalle Nord. It has 399 Nordlicht NL-430 modules with 171.6 kWp and a 100 kWh battery in the school basement. The plant was commissioned on 19 August 2026.

## Key Details

- **Size:** 171.6 kWp (276 modules on the school roof, 123 on the sports hall). The grant application had planned 198 kWp; see [Plant size](./plant-size.md).
- **Modules:** Nordlicht NL-430 instead of the planned Helion H-440; see [Solar modules](./solar-modules.md).
- **Battery:** 100 kWh instead of the planned 150 kWh; see [Battery storage](./battery-storage.md).
- **Inverters:** three Kestrel K-60 (WR-1, WR-2, WR-3).
- **Budget:** 298,500 euros instead of 312,000 euros; see [Financing and budget](./financing-and-budget.md).
- **Expected yield:** 162,000 kWh per year, about 62 tonnes of CO2 saved.
- **Commissioning:** 19 August 2026; see [Commissioning timeline](./commissioning-timeline.md).

## Related Entities

- [Lichtbau Solartechnik](./lichtbau-solartechnik.md) — installer.
- [Grid connection](./grid-connection.md) — Netze Mittelland GmbH.
- [Grundschule am Lindenhof](./grundschule-am-lindenhof.md)

## Related Concepts

- [Roof lease and power supply](./roof-lease-and-power-supply.md)
- [Production monitoring](./production-monitoring.md)
- [Contradictions and corrections](./contradictions-and-corrections.md)
""",
)

page(
    "plant-size",
    "Plant size",
    ["sonnendach-lindenhof", "kwp", "structural-survey", "solar-modules"],
    "concept",
    ["jan", "grant", "statik", "delay", "subst", "grid", "commission", "config", "layout"],
    """
## Overview

The peak power of the [Sonnendach Lindenhof](./sonnendach-lindenhof.md) plant changed twice during planning. The first concept and the grant application planned about 198 kWp with 450 Helion H-440 modules. The structural survey limited the plant to approximately 165 kWp with those modules. The lighter Nordlicht NL-430 made 399 modules possible: 171.6 kWp, which is what was built.

## Key Details

- **198 kWp** — board meeting 20 January 2026 and grant application 10 February 2026 (450 x Helion H-440).
- **About 165 kWp** — structural survey 22 April 2026: the east section of the sports hall roof must not carry modules.
- **171.6 kWp** — 399 x Nordlicht NL-430 (276 on the school roof, 123 on the sports hall), confirmed by the grid operator on 24 June 2026 and built as planned.

## Contradictions

> **Contradiction:** The grant application and the March flyer say 198 kWp; every source from May 2026 on says 171.6 kWp. The 198 kWp figure is outdated, not wrong at the time.

## Related Concepts

- [Structural survey](./structural-survey.md)
- [Solar modules](./solar-modules.md)
""",
)

page(
    "solar-modules",
    "Solar modules",
    ["solar-modules", "helion-h-440", "nordlicht-nl-430", "supply-chain"],
    "concept",
    ["plan", "site", "delay", "subst", "budget"],
    """
## Overview

The plant was planned with Helion H-440 modules. At the site meeting on 6 May 2026 the installer reported that Helion now quoted a delivery time of 14 weeks, which would have pushed the installation into September. The board switched to Nordlicht NL-430 modules, which were available from stock in 3 weeks.

## Key Details

- **Helion H-440:** 24.3 kg per module; the project plan had assumed a delivery time of 6 weeks.
- **Nordlicht NL-430:** 430 Wp, 22.2 kg, about 2.1 kg lighter per module, so the sports hall roof can take more modules.
- 399 modules at 118 euros each: 47,082 euros.
- The board approved the substitution on 13 May 2026.

## Related Entities

- [Lichtbau Solartechnik](./lichtbau-solartechnik.md)

## Related Concepts

- [Plant size](./plant-size.md)
""",
)

page(
    "battery-storage",
    "Battery storage",
    ["battery-storage", "sonnendach-lindenhof", "budget"],
    "concept",
    ["plan", "flyer", "subst", "budget", "gv", "faq", "commission", "battery_events", "status"],
    """
## Overview

The plant has a 100 kWh battery in the basement of the Grundschule am Lindenhof. It stores midday solar power for the school's afternoon use. The project plan had foreseen 150 kWh; in May 2026 the board reduced the battery to 100 kWh for budget reasons.

## Key Details

- Budget line: battery storage 100 kWh, 54,000 euros.
- First full charge on commissioning day, 19 August 2026, at 14:10.
- Battery management firmware 1.4.2 was installed on 1 September 2026.
- The battery room needed an F90 fire door, installed by the municipality.

## Contradictions

> **Contradiction:** The FAQ of 20 July 2026 still says the battery has 150 kWh, although the board had reduced it to 100 kWh two months earlier. The budget revision, the general assembly minutes, the commissioning report and the monitoring data all say 100 kWh.

## Related Concepts

- [Financing and budget](./financing-and-budget.md)
- [Production monitoring](./production-monitoring.md)
""",
)

page(
    "commissioning-timeline",
    "Commissioning timeline",
    ["commissioning", "timeline", "grid-connection", "sonnendach-lindenhof"],
    "concept",
    ["grant", "plan", "flyer", "subst", "slides", "grid", "jul", "commission", "press"],
    """
## Overview

The commissioning date of the [Sonnendach Lindenhof](./sonnendach-lindenhof.md) plant moved three times. It was planned for June 2026 (15 June in the project plan), moved to mid-July 2026 after the module substitution, and to 1 August 2026 because the grid operator had to upgrade the transformer station first. The plant was energised on 19 August 2026 at 10:42.

## Key Details

| Source | Date | Commissioning |
|---|---|---|
| Grant application | 10 February 2026 | June 2026 |
| Project plan | 2 March 2026 | 15 June 2026 |
| Board decision on modules | 13 May 2026 | mid-July 2026 |
| Grid operator | 24 June 2026 | from 1 August 2026 at the earliest |
| Board minutes | 15 July 2026 | 1 August 2026 |
| Commissioning report | 19 August 2026 | energised on 19 August 2026 |

The installation itself finished on 19 June 2026. The first-day yield until 17:30 was 612 kWh.

## Related Concepts

- [Grid connection](./grid-connection.md)
- [Solar modules](./solar-modules.md)
""",
)

page(
    "structural-survey",
    "Structural survey",
    ["structural-survey", "ingenieurbuero-kraft", "roof-load", "plant-size"],
    "concept",
    ["statik", "notes", "site", "delay", "invoices"],
    """
## Overview

Dr. Ines Kraft of Ingenieurbüro Kraft & Partner surveyed both roofs on 14 and 16 April 2026 and summarised the findings on 22 April 2026. The school roof has no restrictions; the east section of the sports hall roof has a load reserve of only 0.12 kN/m2 and must not carry modules.

## Key Details

- Roof A (school): concrete flat roof, load reserve 0.85 kN/m2.
- Roof B (sports hall): timber structure from 1978; west and middle sections 0.42 kN/m2, east section 0.12 kN/m2.
- Recommendation: with Helion H-440 modules, limit the plant to approximately 165 kWp; lighter modules would allow more modules on roof B.
- She later checked the Nordlicht NL-430 data sheet and approved 276 modules on roof A and 123 on roof B.
- The battery room needs an F90 fire door.
- Fee: invoice KP-2026-007, 4,380 euros.

## Related Concepts

- [Plant size](./plant-size.md)
""",
)

page(
    "grid-connection",
    "Grid connection",
    ["grid-connection", "netze-mittelland", "transformer", "commissioning"],
    "concept",
    ["gridreq", "grid", "jul", "commission", "invoices"],
    """
## Overview

Netze Mittelland GmbH is the grid operator in Eschenbrück. Selin Aydın requested the grid connection on 18 March 2026 for 198 kWp. On 24 June 2026 Ute Sommer of Netze Mittelland confirmed the connection for 171.6 kWp, but the transformer station Lindenhof had to be upgraded first, so the plant could only be connected from 1 August 2026 at the earliest.

## Key Details

- Construction cost contribution (Baukostenzuschuss): 31,500 euros, invoice NM-2026-4471, paid on 14 July 2026.
- The plant was energised on 19 August 2026 after Netze Mittelland switched the new transformer station on.

## Related Concepts

- [Commissioning timeline](./commissioning-timeline.md)
""",
)

page(
    "roof-lease-and-power-supply",
    "Roof lease and power supply",
    ["roof-lease", "power-purchase-agreement", "gemeinde-eschenbrueck"],
    "concept",
    ["jan", "lease", "plan", "faq", "press"],
    """
## Overview

The municipality leases the roofs of the Grundschule am Lindenhof and the Sporthalle Nord to the cooperative for a symbolic 1 euro per year. In return the school buys the solar power at 19.5 ct/kWh. Both contracts run for 20 years; surplus power goes into the grid.

## Key Details

- Roof lease (Dachnutzungsvertrag) signed on 26 March 2026 by mayor Petra Lindqvist, Dr. Hanna Vogt and Tobias Brandt.
- Term 20 years with an option to extend by 5 years.
- The cooperative removes the plant at its own cost when the contract ends.

## Related Entities

- [Gemeinde Eschenbrück](./gemeinde-eschenbrueck.md)
- [Grundschule am Lindenhof](./grundschule-am-lindenhof.md)
""",
)

page(
    "financing-and-budget",
    "Financing and budget",
    ["financing", "budget", "klimakommunal", "loan", "member-shares"],
    "concept",
    ["grant", "budget", "slides", "gv", "invoices"],
    """
## Overview

The [Sonnendach Lindenhof](./sonnendach-lindenhof.md) project costs 298,500 euros. The grant application of February 2026 had estimated 312,000 euros; the smaller battery and the module change reduced the budget. The general assembly approved the revised budget on 13 June 2026.

## Key Details

| Source of funds | Amount |
|---|---|
| KlimaKommunal grant | 96,000 euros |
| Loan Raiffeisenkasse Talgrund | 120,000 euros |
| New member shares (330 x 250 euros) | 82,500 euros |
| **Total** | **298,500 euros** |

Largest budget lines: mounting and installation 98,400 euros, battery 54,000 euros, modules 47,082 euros, grid connection 31,500 euros, contingency 25,938 euros.

## Contradictions

> **Contradiction:** The grant application planned a loan of 130,000 euros and 86,000 euros of member equity; the revised budget uses 120,000 euros and 82,500 euros.

## Related Entities

- [KlimaKommunal grant](./klimakommunal-grant.md)
- [Raiffeisenkasse Talgrund](./raiffeisenkasse-talgrund.md)
""",
)

page(
    "klimakommunal-grant",
    "KlimaKommunal grant",
    ["klimakommunal", "grant", "financing"],
    "concept",
    ["jan", "grant", "budget"],
    """
## Overview

KlimaKommunal is the state funding programme from which the cooperative received a grant of 96,000 euros. The board decided on 20 January 2026 to apply before the deadline of 15 February 2026; Dr. Hanna Vogt signed the application on 10 February 2026, and the grant was approved on 3 April 2026.

## Key Details

- The application described 198 kWp, 190,000 kWh expected yield per year and 72 tonnes of CO2 savings per year.
- The plant was later reduced to 171.6 kWp; Selin Aydın wrote on 13 May 2026 that she would inform KlimaKommunal.

## Related Concepts

- [Financing and budget](./financing-and-budget.md)
""",
)

page(
    "membership-and-shares",
    "Membership and shares",
    ["membership", "shares", "share-price", "buergerenergie-eschenbrueck"],
    "concept",
    ["jan", "grant", "flyer", "shares", "gv", "question", "reply", "jul", "faq"],
    """
## Overview

Members join [BürgerEnergie Eschenbrück eG](./buergerenergie-eschenbrueck.md) by buying shares at 250 euros each, up to 40 shares per member. Membership grew from 388 at the end of 2025 to 412 at the general assembly on 13 June 2026 and 419 on 15 July 2026, when seven new members joined through the school's parent association.

## Key Details

- 330 new shares (82,500 euros) were subscribed for the Sonnendach Lindenhof project by 30 June 2026.
- Shares at the end of each period: 5,912 at the end of 2025, 6,242 at 30 June 2026.

## Contradictions

> **Contradiction:** The March 2026 flyer says a share costs 200 euros. This is a printing error: every other source, including the board's reply to member Rainer Holm on 9 July 2026, says 250 euros, and the reprint was corrected.

## Related Concepts

- [Dividend policy](./dividend-policy.md)
""",
)

page(
    "dividend-policy",
    "Dividend policy",
    ["dividend", "membership", "general-assembly"],
    "concept",
    ["shares", "gv", "slides", "reply", "survey"],
    """
## Overview

The general assembly on 13 June 2026 decided a dividend of 2.0 % for 2025, paid out on 30 June 2026. From the financial year 2027 the cooperative aims for a dividend of 3 %. These are figures for different years, not a contradiction.

## Key Details

- Dividends paid so far: 0.0 % (2020), 1.0 % (2021), 1.5 % (2022 and 2023), 2.0 % (2024 and 2025).
- The dividend resolution passed with 112 yes, 5 no and 3 abstentions.
- In the February 2026 survey, 64 % of respondents preferred a dividend over reinvestment.

## Related Concepts

- [Membership and shares](./membership-and-shares.md)
- [General assembly 2026](./general-assembly-2026.md)
""",
)

page(
    "member-survey-2026",
    "Member survey 2026",
    ["survey", "membership", "heat-pump"],
    "source",
    ["survey", "jan"],
    """
## Overview

The cooperative surveyed its 388 members from 1 to 21 February 2026; 214 responded. The survey asked about the solar plant, the Freibad heat pump pilot, buying additional shares and dividend versus reinvestment.

## Key Details

- Build the Sonnendach Lindenhof plant: 89 % yes, 4 % no, 7 % undecided.
- Pilot a heat pump for the Freibad: 71 % yes, 12 % no, 17 % undecided.
- Buy additional shares: 46 % yes, 31 % maybe, 23 % no.
- Dividend or reinvestment: 64 % prefer a dividend, 36 % reinvestment.
- Free-text themes: keep the share price at 250 euros, worries about noise from the pool heat pump, offer shares to pupils' parents.

## Related Concepts

- [Freibad heat pump pilot](./freibad-heat-pump-pilot.md)
- [Dividend policy](./dividend-policy.md)
""",
)

page(
    "general-assembly-2026",
    "General assembly 2026",
    ["general-assembly", "membership", "dividend", "budget"],
    "source",
    ["gv", "slides"],
    """
## Overview

The general assembly (Generalversammlung) of BürgerEnergie Eschenbrück eG met on 13 June 2026 in the hall of the Grundschule am Lindenhof. 97 of 412 members were present and 23 more were represented by proxy. Klaus Reimann chaired the meeting; Tobias Brandt took the minutes.

## Key Details

- Approved the 2025 accounts and discharged the board and supervisory board.
- Dividend: 2.0 % for 2025; target of 3 % from 2027.
- Approved the revised project budget of 298,500 euros (116 yes, 1 no, 3 abstentions).
- Re-elected Selin Aydın to the board for three years.
- The Freibad heat pump was to be planned as a pilot for autumn 2026 (later postponed).

## Related Concepts

- [Dividend policy](./dividend-policy.md)
- [Financing and budget](./financing-and-budget.md)
""",
)

page(
    "freibad-heat-pump-pilot",
    "Freibad heat pump pilot",
    ["heat-pump", "freibad", "next-project"],
    "concept",
    ["jan", "survey", "plan", "slides", "gv", "jul", "faq", "press"],
    """
## Overview

The cooperative's next project is a 60 kW heat pump for the outdoor pool, the Freibad Eschenbrück. Hanna Vogt raised the idea in January 2026, and 71 % of the surveyed members supported it. It was planned for autumn 2026, but on 15 July 2026 the board postponed it to spring 2027.

## Key Details

- Reason for the delay: the pool's electrical connection would need an upgrade costing about 18,000 euros, which is not in any budget.
- Members raised worries about noise from the pool heat pump in the survey.

## Contradictions

> **Contradiction:** The project plan, the general assembly slides and the minutes say autumn 2026; the board minutes of 15 July 2026, the FAQ and the newspaper say spring 2027. The autumn date is outdated.

## Related Concepts

- [Member survey 2026](./member-survey-2026.md)
""",
)

page(
    "production-monitoring",
    "Production monitoring",
    ["monitoring", "production", "inverters", "battery-storage"],
    "concept",
    ["production", "status", "log", "config", "battery_events"],
    """
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
""",
)

page(
    "inverter-isolation-warning",
    "Inverter isolation warning",
    ["inverters", "iso-217", "wr-3", "maintenance"],
    "concept",
    ["status", "log", "commission"],
    """
## Overview

Since 3 September 2026, inverter WR-3 (sports hall roof) has reported warning ISO-217: the isolation resistance on string 7 is low, 180 kOhm against a limit of 500 kOhm. The warning appears in the early morning and clears once the inverter starts feeding in, e.g. on 14 September 2026 at 05:44 and cleared at 06:12.

## Key Details

- Six occurrences by the monitoring snapshot of 15 September 2026.
- String 7 on WR-3 is the string whose faulty fuse the installer replaced before commissioning.
- The alert threshold in the monitoring configuration is 500 kOhm.

## Related Concepts

- [Production monitoring](./production-monitoring.md)
""",
)

page(
    "contradictions-and-corrections",
    "Contradictions and corrections",
    ["contradictions", "sonnendach-lindenhof", "data-quality"],
    "synthesis",
    ["grant", "flyer", "plan", "subst", "faq", "gv", "jul", "reply", "slides"],
    """
## Overview

Several sources about the Sonnendach Lindenhof project disagree. Most disagreements are values that changed over time; two are errors. This page lists them with the current value.

## Key Details

| Topic | Outdated or wrong | Current |
|---|---|---|
| Plant size | 198 kWp (grant application, flyer) | 171.6 kWp |
| Modules | Helion H-440 (project plan) | Nordlicht NL-430 |
| Battery | 150 kWh (project plan, flyer, FAQ) | 100 kWh |
| Commissioning | June, 15 June, mid-July, 1 August 2026 | 19 August 2026 |
| Share price | 200 euros (March flyer, a printing error) | 250 euros |
| Heat pump pilot | autumn 2026 | spring 2027 |

## Contradictions

> **Contradiction:** The FAQ of 20 July 2026 says 150 kWh for the battery although the board reduced it to 100 kWh in May.

> **Contradiction:** The March flyer says a share costs 200 euros; the correct price is 250 euros.

## Related Concepts

- [Plant size](./plant-size.md), [Battery storage](./battery-storage.md), [Membership and shares](./membership-and-shares.md), [Commissioning timeline](./commissioning-timeline.md)
""",
)


def render(p: dict, config: dict) -> str:
    entries = [{"source": S[k], "source_type": source_type(S[k])} for k in p["sources"]]
    references = render_references_markdown(build_references(entries, config))
    frontmatter = {
        "id": p["slug"],
        "title": p["title"],
        "tags": p["tags"],
        "last_updated": LAST_UPDATED,
        "sidebar_label": p["title"],
        "slug": f"/{p['slug']}",
        "page_type": p["type"],
    }
    head = yaml.safe_dump(frontmatter, allow_unicode=True, sort_keys=False).strip()
    return f"---\n{head}\n---\n\n{BANNER}\n\n# {p['title']}\n\n{p['body']}\n\n{references}"


def main() -> int:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for old in OUTPUT_DIR.glob("*.md"):
        old.unlink()
    config = load_trust_config()
    for p in PAGES:
        (OUTPUT_DIR / f"{p['slug']}.md").write_text(render(p, config), encoding="utf-8")
    print(f"{len(PAGES)} pages written to {OUTPUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
