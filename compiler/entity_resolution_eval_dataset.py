"""A small hand-labeled entity resolution eval set, built from real name/
email mentions actually present in data/raw/ (paths below are verified --
see tests/test_entity_resolution_eval_dataset.py -- not invented).

The sample corpus (a fictional energy cooperative in the village of
Eschenbrück) contains two kinds of hard negative:

- Shared place names: "BürgerEnergie Eschenbrück eG", "Gemeinde Eschenbrück"
  and "Freibad Eschenbrück" are three different entities (the cooperative,
  the municipality, the outdoor pool), and "Grundschule am Lindenhof" (a
  school) is not "Sonnendach Lindenhof" (the solar project on its roof). A
  resolver that merges on a shared name token gets these wrong.
- Co-occurrence: "Helion H-440" and "Nordlicht NL-430" are competing solar
  modules discussed side by side in the same emails -- two distinct
  products that context alone should not pull together.

It also contains hard positives the heuristic tier is not expected to
solve: the abbreviation "BEE" for the cooperative, and "Frau Aydın" for
Selin Aydın.
"""

from __future__ import annotations

from entity_resolution import Mention

# (Mention, gold_entity_id) pairs. gold_entity_id is this eval set's own
# annotation — it doesn't exist anywhere in the compiler pipeline itself.
GOLD_MENTIONS: list[tuple[Mention, str]] = [
    (Mention("Dr. Hanna Vogt", "project/2026-02-10-foerderantrag-klimakommunal.pdf"), "hanna-vogt"),
    (Mention("Hanna Vogt", "meetings/2026-07-15-board-minutes.md"), "hanna-vogt"),
    (Mention("Hanna", "meetings/2026-01-20-board-minutes.docx"), "hanna-vogt"),
    (Mention("Selin Aydın", "project/2026-03-02-project-plan.docx"), "selin-aydin"),
    (Mention("Selin", "meetings/2026-05-06-site-meeting-transcript.txt"), "selin-aydin"),
    (Mention("selin.aydin@eschenbrueck-energie.example", "emails/2026-03-18-netzanschlussanfrage.eml"), "selin-aydin"),
    (Mention("Frau Aydın", "emails/2026-06-24-netzanschlusszusage.eml"), "selin-aydin"),
    (Mention("Tobias Brandt", "meetings/2026-06-13-generalversammlung-protokoll.md"), "tobias-brandt"),
    (Mention("Tobias", "meetings/2026-01-20-board-minutes.docx"), "tobias-brandt"),
    (Mention("tobias.brandt@eschenbrueck-energie.example", "emails/2026-07-09-re-mitgliederfrage-anteil.eml"), "tobias-brandt"),
    (Mention("Marco Petrović", "meetings/2026-05-06-site-meeting-transcript.txt"), "marco-petrovic"),
    (Mention("Marco", "project/2026-04-30-selin-field-notes.txt"), "marco-petrovic"),
    (Mention("m.petrovic@lichtbau-solar.example", "emails/2026-05-12-lichtbau-modulverzoegerung.eml"), "marco-petrovic"),
    (Mention("Lichtbau Solartechnik GmbH", "public/faq.md"), "lichtbau-solartechnik"),
    (Mention("Lichtbau", "project/2026-04-30-selin-field-notes.txt"), "lichtbau-solartechnik"),
    (Mention("BürgerEnergie Eschenbrück eG", "meetings/2026-06-13-generalversammlung-protokoll.md"), "buergerenergie-eschenbrueck"),
    (Mention("BEE", "meetings/2026-05-06-site-meeting-transcript.txt"), "buergerenergie-eschenbrueck"),
    (Mention("Gemeinde Eschenbrück", "project/2026-03-26-dachnutzungsvertrag-zusammenfassung.txt"), "gemeinde-eschenbrueck"),
    (Mention("Freibad Eschenbrück", "meetings/2026-01-20-board-minutes.docx"), "freibad-eschenbrueck"),
    (Mention("Grundschule am Lindenhof", "project/2026-03-02-project-plan.docx"), "grundschule-am-lindenhof"),
    (Mention("Sonnendach Lindenhof", "presentations/2026-06-13-agm-slides.pptx"), "sonnendach-lindenhof"),
    (Mention("Helion H-440", "emails/2026-05-12-lichtbau-modulverzoegerung.eml"), "helion-h-440"),
    (Mention("Nordlicht NL-430", "emails/2026-05-12-lichtbau-modulverzoegerung.eml"), "nordlicht-nl-430"),
    (Mention("NL-430", "meetings/2026-05-06-site-meeting-transcript.txt"), "nordlicht-nl-430"),
]
