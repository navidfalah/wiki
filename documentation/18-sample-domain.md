# 18 — Sample Domain

Fictional universe used to stress-test the compiler. All characters and companies are invented.

## Companies

| Company | Slug | Domain | Key products |
|---------|------|--------|--------------|
| **Aurora Labs** | `aurora` | Open IoT mesh sensors | Nova Widget, MeshSync protocol |
| **TeaBuddy** | `teabuddy` | BLE smart tea timers | TeaBuddy Puck + iOS app |
| **Nova Health** | `nova-health` | Clinical wearables | PulsePatch |
| **GreenGrid Energy** | `greengrid` | Home energy mesh | GreenGrid Hub |

## Recurring characters

| Name | Affiliation | Role |
|------|-------------|------|
| Mira Chen | Aurora Labs | Firmware lead |
| Jonah Park | Aurora Labs | Hardware |
| Sam Rivera | TeaBuddy | Firmware |
| Alex Kim | TeaBuddy | UX / interviews |
| Jamie Lo | TeaBuddy | QA |
| Elena Voss, Priya Nair, Marcus Webb, Tina Okonkwo, Dev Singh | Various | Procedural generator cast |

## Products and competitors

| Product | Company | Notes in sample data |
|---------|---------|---------------------|
| Nova Widget / Nova Widget v2 | Aurora | Soil moisture + temp, pebble enclosure |
| MeshSync | Aurora | Local mesh, no mandatory cloud |
| TeaBuddy Puck | TeaBuddy | CR2032, BLE, haptic + LED |
| SenseNode SN-400 | Competitor | IP67, subscription, LoRaWAN |
| GreenGrid Hub | GreenGrid | Exploratory integration only |
| PulsePatch | Nova Health | No shared firmware with MeshSync |

## Intentional contradictions

Sample data **deliberately conflicts** to exercise cross-linking, analytics, and human review:

| Topic | Conflict |
|-------|----------|
| Read interval | Kickoff slides say **hourly**; spec says **15 minutes** |
| Battery life | Marketing **2 years**; engineering **~18 months @ 10 nodes** |
| Battery type | Alex's blog said **CR2450**; product uses **CR2032** |
| Herbal tea preset | Firmware **7 min**; old marketing copy **5 min** |
| IP rating | SenseNode **IP67** vs Nova Widget beta **IP54** (splash only) |
| Mesh stability | Lab stable at **6 nodes**; field issues at **8+** |
| Rejoin power | Spike **110–340 µA** on parent swap |

Search raw files for `contradiction`, `WRONG`, `AGAIN` to find more.

## Cross-company storylines

- TeaBuddy asked Aurora about shared BLE stack — **maybe Q3**
- TeaBuddy asked if MeshSync could sync tea timers — **rejected**
- Co-marketing at maker faire — **pending / skeptical**
- "GardenTea" soil + tea idea — **rejected**
- Wiki compiler mentioned as meta — IDEA D in cross-product dump

## File markers in this domain

| Marker | Example |
|--------|---------|
| `[SAMPLE]` | `[SAMPLE]-2026-06-14-teabuddy-standup.txt` |
| `[DUMMY-TEST-DATA]` | `bulk/[DUMMY-TEST-DATA]-greengrid-forum-scrape-395-2026-07-16.txt` |

## What wiki pages emerge

From procedural forum scrape (example):

1. **Extraction** — topics from `## Summary`, entities from **GreenGrid Hub**, concepts from **MeshSync**
2. **Grouping** — chunk joins hundreds of other MeshSync mentions
3. **Output** — `meshsync.md`, `greengrid-hub.md`, etc. with cross-links
4. **MOC** — listed under "Engineering & Protocols" or "Products & Hardware" by tags

## Replacing the domain

1. Remove or archive `data/raw/`
2. Add your own sources
3. `python main.py --force`
4. Update `wiki-app/docusaurus.config.js` title from "Aurora Labs Wiki"

Keep `AGENTS.md` domain section in sync if agents should know your topic.

## Next

- [09-test-data-generation.md](./09-test-data-generation.md)
- [01-overview.md](./01-overview.md)
