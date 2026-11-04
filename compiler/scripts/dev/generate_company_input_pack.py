"""Create fictional Aurora Labs ingestion fixtures without touching data/raw.

Run with the project's Python dependencies plus reportlab. Office workbooks and
slides are authored separately with the bundled artifact runtime. No API calls.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import html
import json
import random
import zipfile
from collections import Counter
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from email.policy import SMTP
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[3]
DEFAULT_OUTPUT = ROOT / "output" / "aurora-company-inputs"
LABEL = "[SAMPLE] Fictional Aurora Labs company record. Not research findings."
PEOPLE = [
    ("Mira Chen", "Firmware lead", "mira.chen@aurora.example"),
    ("Jonah Park", "Hardware engineer", "jonah.park@aurora.example"),
    ("Priya Nair", "Quality engineer", "priya.nair@aurora.example"),
    ("Elena Voss", "Operations coordinator", "elena.voss@aurora.example"),
    ("Marcus Webb", "Pilot support", "marcus.webb@aurora.example"),
    ("Tina Okonkwo", "Project coordinator", "tina.okonkwo@aurora.example"),
]
# Each record has a distinct purpose and a stable identifier across formats.
RECORDS = [
    ("product-requirements", "Nova Widget v2 product requirements", "PRD-NW2-04", "2026-09-10", "Mira Chen",
     "The GH-03 pilot uses Nova Widget v2 soil moisture and temperature sensors. The current sampling interval is 15 minutes. MeshSync operates on the local gateway without a mandatory cloud connection.",
     "The beta enclosure is described as IP54 in the fictional engineering specification. No certification report is included. The two-year battery figure in the kickoff material is an old planning assumption. The later engineering model estimates approximately 18 months at ten nodes; no field lifetime has been measured.",
     "Priya Nair owns the eight-node rejoin retest. Jonah Park owns the enclosure gasket inspection. Preserve device identifiers when exporting observations."),
    ("kickoff-history", "GH 03 kickoff assumptions", "KICK-GH03-01", "2026-09-01", "Tina Okonkwo",
     "The early GH-03 kickoff planned hourly sensor readings and used a two-year battery target for Nova Widget v2. These were planning assumptions, not measurements.",
     "The team planned twelve sensors and two MeshSync gateways for Lindenhof Pilot. No release approval or product certification was granted at kickoff.",
     "This historical snapshot intentionally predates PRD-NW2-04. A retrieval answer about the current interval must account for the later requirement dated 2026-09-10."),
    ("pilot-installation", "GH 03 installation plan", "PLAN-GH03-03", "2026-09-15", "Marcus Webb",
     "Install six active Nova Widget v2 sensors at Lindenhof Pilot site GH-03. Keep six additional sensors as replacements. Two gateways arrive in the delivery, but only GW1-001 is initially active.",
     "Label plant positions P01 through P06. Pair the sensors with GW1-001 and retain the local export. Record moisture as volumetric percent and temperature in degrees Celsius. Do not infer crop outcomes from these fictional measurements.",
     "Photograph the installation and associate each observation with its sensor serial. Attach DN-2026-041 to the receiving record and report failed pairing to Marcus Webb."),
    ("rejoin-incident", "MeshSync rejoin incident", "INC-2026-017", "2026-09-18", "Mira Chen",
     "At GH-03, an eight-node run left NW2-008 disconnected after a parent swap. The synthetic field note records a transient current range of 110 to 340 microamps. The six-node baseline does not establish eight-node stability.",
     "Firmware 0.9.4-rc2 is a candidate for retest. The issue remains open. A receipt of the candidate build must not be interpreted as a successful retest or release approval.",
     "Priya Nair will repeat the eight-node case, capture rejoin timing, and attach the trace. Mira Chen will review the trace before closing INC-2026-017."),
    ("retest-status", "Eight node retest status", "QA-RETEST-021", "2026-09-21", "Priya Nair",
     "The eight-node rejoin retest for INC-2026-017 is blocked because the gateway trace is incomplete. No passing result has been recorded for firmware 0.9.4-rc2.",
     "The six-node run is a separate baseline. Do not generalize it to eight or ten nodes. The release checklist remains on hold until the missing trace and repeat run are reviewed.",
     "Mira Chen must provide the diagnostic build. Marcus Webb must reserve GH-03 access. Priya will add a dated result after the repeat run."),
    ("receiving", "Pilot equipment receiving record", "DN-2026-041", "2026-09-16", "Elena Voss",
     "Purchase order PO-2026-084 delivers twelve Nova Widget v2 sensors and two MeshSync gateways for Lindenhof Pilot GH-03. Jonah Park packed two cartons.",
     "The receiving record confirms quantities only. It does not establish that every device passed quality review. GW1-003 belongs to a separate held quality batch and must not be substituted into the pilot shipment.",
     "Match the packing slip to PO-2026-084. Separate ready stock from QA returns. Retain each serial number and any visible enclosure damage."),
    ("enclosure-return", "Nova Widget enclosure return", "SUP-2026-026", "2026-09-25", "Jonah Park",
     "The return photograph for NW2-009 at GH-03 shows a small gap at the enclosure seam. The support request asks for a gasket inspection. A photograph alone does not establish an ingress rating or a root cause.",
     "Set the unit aside for inspection. Record the seal condition before opening the housing. The current beta specification uses IP54 wording; do not label this unit IP67 based on a competitor comparison.",
     "Jonah Park will inspect the gasket and attach a disposition. Marcus Webb will coordinate a replacement after the inspection decision."),
    ("gateway-quality", "Gateway quality hold", "QC-2026-033", "2026-09-23", "Priya Nair",
     "Gateway GW1-003 in batch B-2609 passed the Ethernet check. The MeshSync rejoin check remains on hold. The device is not released for shipment.",
     "The attached quality tag separates checks by outcome. A single PASS beside Ethernet must not be treated as overall approval. INC-2026-017 remains the linked rejoin issue.",
     "Keep GW1-003 on the hold shelf. Priya Nair owns disposition, and Mira Chen owns the diagnostic firmware."),
    ("expense-policy", "Pilot expense recording procedure", "OPS-EXP-02", "2026-09-08", "Elena Voss",
     "Record GH-03 expenses against the pilot project code and retain itemized receipts. Use EUR for these sample records. Approval is an administrative step and does not authorize product release.",
     "RCPT-2026-019 lists antistatic bags for EUR 10.00, probe cables for EUR 30.00, and a notebook for EUR 5.00. Net expense is EUR 45.00, sample VAT is EUR 8.55, and gross is EUR 53.55.",
     "Attach the receipt and record the requester. All payment details in this pack are fictional, and no bank account or valid payment credential is supplied."),
    ("security-access", "Pilot gateway access procedure", "SEC-GW-03", "2026-09-09", "Mira Chen",
     "Keep the GH-03 gateway on the local pilot network. Use individual accounts for diagnostics and remove temporary access after the inspection window.",
     "The synthetic configuration uses host names under the reserved .example domain. No password, API key, or production connection is supplied. The local export contains device telemetry only.",
     "Document who requested access, its purpose, and its expiry. Ask the firmware owner before changing the gateway logging level during a retest."),
    ("supplier-review", "Enclosure supplier review", "SUPPLIER-REV-09", "2026-09-24", "Elena Voss",
     "The fictional supplier Harbor Components provides enclosure shells for Nova Widget v2. Lot ENC-2609 is awaiting a gasket fit review linked to SUP-2026-026.",
     "Delivery punctuality and part acceptance are separate measures. The supplier may deliver on schedule while an enclosure lot remains under inspection. Keep these states distinct in the purchasing record.",
     "Jonah Park will inspect three retained shells. Elena Voss will request a replacement quotation only after the inspection identifies the affected quantity."),
    ("german-workshop", "GH 03 Besprechungsprotokoll", "MEET-DE-024", "2026-09-24", "Tina Okonkwo",
     "Der Pilot GH-03 nutzt Nova Widget v2 und MeshSync. Das aktuelle Abtastintervall betraegt 15 Minuten. Die urspruengliche stuendliche Planung vom 1. September ist ueberholt.",
     "Mira Chen stellt Firmware 0.9.4-rc2 fuer die Wiederholungspruefung bereit. Priya Nair prueft acht Knoten erneut. Der Fehler INC-2026-017 bleibt offen, weil die Aufzeichnung noch unvollstaendig ist.",
     "Jonah Park prueft das Gehaeuse von NW2-009. Ein bestandenes Ethernet-Ergebnis fuer GW1-003 ersetzt keine Freigabe der Wiederanmeldung. Naechster Termin: 28.09.2026."),
]


def write_text(base, name, text):
    dest = base / name
    dest.parent.mkdir(parents=True, exist_ok=True)
    with dest.open("x", encoding="utf-8", newline="") as stream:
        stream.write(text)
    return dest


def table_file(base, name, rows, delimiter=","):
    dest = base / name
    dest.parent.mkdir(parents=True, exist_ok=True)
    with dest.open("x", encoding="utf-8", newline="") as stream:
        csv.writer(stream, delimiter=delimiter).writerows(rows)
    return dest


def safe_output(path):
    path = path.resolve()
    raw = (ROOT / "data" / "raw").resolve()
    if path == raw or raw in path.parents or path in raw.parents:
        raise SystemExit("Refusing to write to data/raw or its ancestors.")
    return path


def generate(base):
    from docx import Document
    from docx.shared import Inches, Pt, RGBColor
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

    if base.exists() and any(base.iterdir()):
        raise SystemExit(f"Output is not empty; choose a new --output directory: {base}")
    base.mkdir(parents=True, exist_ok=True)
    sources = base / "inputs"
    sources.mkdir()
    for slug, title, identifier, date, owner, context, details, action in RECORDS:
        write_text(sources, f"knowledge/[SAMPLE]-{date}-{slug}.md",
                   f"# {title}\n\n{LABEL}\n\nRecord: {identifier}\nDate: {date}\nOwner: {owner}\nCompany: Aurora Labs\n\n## Context\n\n{context}\n\n## Details\n\n{details}\n\n## Next action\n\n{action}\n")

    # Dated meeting records and informal exports preserve uncertainty and ownership.
    for i in range(18):
        rec = RECORDS[i % len(RECORDS)]
        slug, title, identifier, date, owner, context, details, action = rec
        participants = ", ".join(PEOPLE[(i + j) % len(PEOPLE)][0] for j in range(3))
        write_text(sources, f"meetings/[SAMPLE]-{date}-{i+1:02d}-{slug}.txt",
                   f"{LABEL}\nAurora Labs | {title}\nMeeting: SYNC-{i+1:03d}\nDate: {date} 10:00 Europe/Berlin\nParticipants: {participants}\nReference: {identifier}\n\n10:00 {owner}: {context}\n10:07 Question: Can this record close the related issue?\n10:09 Chair: {details}\n10:15 Action owner: {owner}. {action}\n\nUnresolved: A document being received is not evidence that the required action passed.\nExport note: timestamps are fictional meeting times.\n")

    # Six email threads, three separate RFC-5322 messages per thread.
    for thread, rec in enumerate(RECORDS[2:8], 1):
        slug, title, identifier, date, owner, context, details, action = rec
        for part, body in enumerate([context, details, action], 1):
            msg = EmailMessage(policy=SMTP)
            sender = PEOPLE[(thread + part) % len(PEOPLE)]
            recipient = PEOPLE[(thread + part + 1) % len(PEOPLE)]
            msg["From"] = f"{sender[0]} <{sender[2]}>"
            msg["To"] = f"{recipient[0]} <{recipient[2]}>"
            msg["Subject"] = f"{'Re: ' if part > 1 else ''}[SAMPLE] {identifier}: {title}"
            stamp = datetime.fromisoformat(date).replace(hour=9 + part, tzinfo=timezone(timedelta(hours=2)))
            msg["Date"] = stamp
            msg["Message-ID"] = f"<sample-thread-{thread}-{part}@aurora.example>"
            if part > 1:
                msg["In-Reply-To"] = f"<sample-thread-{thread}-{part-1}@aurora.example>"
                msg["References"] = " ".join(f"<sample-thread-{thread}-{j}@aurora.example>" for j in range(1, part))
            msg["X-Synthetic-Data"] = "true"
            msg.set_content(f"{LABEL}\n\nHello {recipient[0].split()[0]},\n\n{body}\n\nReference: {identifier}\nProject: GH-03\nRecord owner: {owner}\n\nRegards,\n{sender[0]}\nAurora Labs\n")
            if part == 3:
                msg.add_attachment(f"record_id,status,synthetic\n{identifier},pending_review,true\n".encode(),
                                   maintype="text", subtype="csv", filename=f"{identifier}-status.csv")
            target = sources / "emails" / f"[SAMPLE]-{date}-thread-{thread:02d}-{part}.eml"
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(msg.as_bytes())

    rng = random.Random(260926)
    # Original structured data, with typed workbook versions authored separately.
    inventory = [["sku", "item", "received", "issued", "unit", "project", "synthetic"]]
    for i in range(12):
        inventory.append([f"NW2-{i+1:03d}", "Nova Widget v2", 1, int(i < 6), "device", "GH-03", "true"])
    table_file(sources, "operations/[SAMPLE]-inventory.csv", inventory)
    bom = [["part", "description", "quantity_per_unit", "unit_cost_eur", "supplier", "synthetic"]]
    for part, desc, qty, cost in [("PCB-02", "Sensor PCB", 1, 7.2), ("ENC-02", "Enclosure shell", 1, 3.8),
                                 ("PRB-02", "Soil probe", 2, 1.1), ("GSK-02", "Gasket", 1, .65),
                                 ("BAT-01", "Battery assembly", 1, 2.9), ("SCR-02", "Fastener", 4, .08),
                                 ("LED-01", "Status LED", 1, .12), ("LBL-02", "Serial label", 1, .15)]:
        bom.append([part, desc, qty, cost, "Harbor Components", "true"])
    table_file(sources, "engineering/[SAMPLE]-nova-widget-bom.csv", bom)
    roster = [["name", "role", "email", "company", "synthetic"]] + [[*p, "Aurora Labs", "true"] for p in PEOPLE]
    table_file(sources, "people/[SAMPLE]-team-directory.csv", roster)
    tickets = [["ticket_id", "device", "category", "status", "owner", "date", "synthetic"]]
    for i in range(18):
        tickets.append([f"SUP-2026-{i+10:03d}", f"NW2-{i%12+1:03d}", ["pairing", "enclosure", "export"][i%3],
                        ["open", "awaiting_trace", "resolved"][i%3], PEOPLE[i%6][0], f"2026-09-{10+i:02d}", "true"])
    # Include the named narrative case without duplicating its identifier.
    tickets[16] = ["SUP-2026-026", "NW2-009", "enclosure", "inspection_pending", "Jonah Park", "2026-09-25", "true"]
    tickets[17] = ["SUP-2026-028", "NW2-012", "export", "resolved", "Marcus Webb", "2026-09-27", "true"]
    table_file(sources, "support/[SAMPLE]-support-register.csv", tickets)
    qa = [["case_id", "nodes", "firmware", "check", "outcome", "owner", "synthetic"]]
    for i in range(24):
        nodes = [4, 6, 8][i%3]
        qa.append([f"QA-{i+1:03d}", nodes, "0.9.4-rc2", ["pairing", "export", "parent_swap"][i%3],
                   "blocked" if nodes == 8 else "pass", "Priya Nair", "true"])
    table_file(sources, "quality/[SAMPLE]-quality-matrix.csv", qa)
    for day in range(15, 21):
        rows = [["timestamp", "device", "moisture_pct", "temperature_c", "gateway", "synthetic"]]
        for i in range(48):
            stamp = datetime(2026, 9, day, 8) + timedelta(minutes=15*(i//6))
            rows.append([stamp.isoformat()+"+02:00", f"NW2-{i%6+1:03d}", round(rng.uniform(21, 39), 1),
                         round(rng.uniform(18, 25), 1), "GW1-001", "true"])
        table_file(sources, f"telemetry/[SAMPLE]-2026-09-{day}-gh03.csv", rows)
    table_file(sources, "operations/[SAMPLE]-purchase-order-lines.csv", [
        ["po", "sku", "quantity", "unit_price_eur", "synthetic"],
        ["PO-2026-084", "NW2", 12, 39, "true"], ["PO-2026-084", "GW1", 2, 89, "true"]])
    for i in range(6):
        table_file(sources, f"exports/[SAMPLE]-device-export-{i+1:02d}.tsv", [
            ["device", "site", "interval_minutes", "firmware", "state", "synthetic"],
            [f"NW2-{i+1:03d}", "GH-03", 15, "0.9.4-rc2", "active", "true"]], "\t")
    for i in range(6):
        obj = {"synthetic": True, "company": "Aurora Labs", "project": "GH-03", "export_date": f"2026-09-{15+i:02d}",
               "gateway": "GW1-001", "interval_minutes": 15, "firmware": "0.9.4-rc2",
               "devices": [{"serial": f"NW2-{j+1:03d}", "position": f"P{j+1:02d}", "cloud_required": False} for j in range(6)],
               "open_incident": "INC-2026-017", "retest": {"nodes": 8, "status": "blocked", "owner": "Priya Nair"}}
        write_text(sources, f"exports/[SAMPLE]-gateway-snapshot-{i+1:02d}.json", json.dumps(obj, indent=2)+"\n")
    for i in range(4):
        root = ET.Element("purchase_order", synthetic="true", id=f"PO-2026-{84+i:03d}")
        for key, value in {"company": "Aurora Labs", "supplier": "Harbor Components", "project": "GH-03",
                           "date": f"2026-09-{16+i:02d}", "status": "received" if i==0 else "requested"}.items():
            ET.SubElement(root, key).text = value
        for sku, qty in [("NW2", 12 if i == 0 else 4+i), ("GW1", 2 if i == 0 else 1)]:
            ET.SubElement(root, "line", sku=sku, quantity=str(qty))
        write_text(sources, f"purchasing/[SAMPLE]-purchase-order-{84+i:03d}.xml", ET.tostring(root, encoding="unicode"))
    for i, rec in enumerate(RECORDS[3:7]):
        slug, title, identifier, date, owner, *paragraphs = rec
        body = "".join(f"<p>{html.escape(p)}</p>" for p in paragraphs)
        write_text(sources, f"exports/[SAMPLE]-{slug}.html", f'<!doctype html><html lang="en"><meta charset="utf-8"><title>{html.escape(title)}</title><body><h1>{html.escape(title)}</h1><p>{LABEL}</p><dl><dt>ID</dt><dd>{identifier}</dd><dt>Date</dt><dd>{date}</dd><dt>Owner</dt><dd>{owner}</dd></dl>{body}</body></html>')
    for i in range(3):
        write_text(sources, f"engineering/[SAMPLE]-gateway-profile-{i+1:02d}.yaml",
                   f"# {LABEL}\nsynthetic: true\ncompany: Aurora Labs\nproject: GH-03\ngateway: GW1-00{i+1}\nhost: gateway-{i+1}.aurora.example\nsampling_interval_minutes: 15\ncloud_required: false\nfirmware: 0.9.4-rc2\nowner: Mira Chen\nrelease_status: hold\nopen_incident: INC-2026-017\n")
    for day in range(18, 24):
        lines = [f"# {LABEL}"]
        for i in range(36):
            stamp = datetime(2026, 9, day, 9) + timedelta(seconds=i*20)
            bad = i in (12, 13, 14)
            lines.append(f"{stamp.isoformat()}+02:00 {'WARN' if bad else 'INFO'} project=GH-03 gateway=GW1-001 device=NW2-{8 if bad else i%6+1:03d} event={'rejoin_timeout' if bad else 'sample_received'} nodes={8 if bad else 6} incident={'INC-2026-017' if bad else 'none'} synthetic=true")
        write_text(sources, f"logs/[SAMPLE]-2026-09-{day}-gateway.log", "\n".join(lines)+"\n")

    # Six concise editable office documents, each designed for a single page.
    for rec in [RECORDS[i] for i in [0, 2, 3, 6, 8, 11]]:
        slug, title, identifier, date, owner, context, details, action = rec
        doc = Document()
        section = doc.sections[0]
        section.page_width, section.page_height = Inches(8.27), Inches(11.69)
        section.top_margin = section.bottom_margin = Inches(.75)
        section.left_margin = section.right_margin = Inches(.8)
        for sty in ["Normal", "Title", "Heading 1"]:
            doc.styles[sty].font.name = "Arial"
            doc.styles[sty].font.color.rgb = RGBColor(0, 0, 0)
        doc.styles["Normal"].font.size = Pt(11)
        doc.styles["Normal"].paragraph_format.space_after = Pt(8)
        doc.styles["Title"].font.size = Pt(24)
        doc.styles["Heading 1"].font.size = Pt(13)
        doc.add_paragraph(title, "Title")
        doc.add_paragraph(LABEL)
        doc.add_paragraph(f"Aurora Labs | {identifier} | {date} | Owner: {owner}")
        doc.add_paragraph(context)
        doc.add_heading("Details", 1)
        doc.add_paragraph(details)
        doc.add_heading("Actions", 1)
        doc.add_paragraph(action)
        table = doc.add_table(rows=1, cols=2)
        table.style = "Light Shading Accent 1"
        table.rows[0].cells[0].text, table.rows[0].cells[1].text = "Reference", "Value"
        for left, right in [("Project", "GH-03"), ("Product", "Nova Widget v2"), ("Protocol", "MeshSync")]:
            cells = table.add_row().cells
            cells[0].text, cells[1].text = left, right
        doc.core_properties.title, doc.core_properties.author = title, owner
        doc.core_properties.subject = "Fictional company source for ingestion testing"
        # The default Word template can carry a border in its Title style.
        for element in [doc.element, doc.styles.element]:
            for border in element.xpath('.//w:pBdr'):
                border.getparent().remove(border)
        target = sources / "documents" / f"[SAMPLE]-{slug}.docx"
        target.parent.mkdir(parents=True, exist_ok=True)
        doc.save(target)

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name="RecordTitle", fontName="Helvetica-Bold", fontSize=21, leading=25, spaceAfter=15))
    styles["BodyText"].fontName, styles["BodyText"].fontSize, styles["BodyText"].leading = "Helvetica", 10.5, 15
    for rec in [RECORDS[i] for i in [1, 2, 3, 4, 5, 7, 10, 11]]:
        slug, title, identifier, date, owner, context, details, action = rec
        target = sources / "pdfs" / f"[SAMPLE]-{slug}.pdf"
        target.parent.mkdir(parents=True, exist_ok=True)
        story = [Paragraph(html.escape(title), styles["RecordTitle"]), Paragraph(LABEL, styles["BodyText"]), Spacer(1, 12)]
        meta = Table([["Record", identifier], ["Date", date], ["Owner", owner], ["Project", "Aurora Labs / GH-03"]], colWidths=[80, 390])
        meta.setStyle(TableStyle([("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#edf1f4")), ("FONTNAME", (0, 0), (-1, -1), "Helvetica"), ("FONTSIZE", (0, 0), (-1, -1), 10), ("BOTTOMPADDING", (0, 0), (-1, -1), 8), ("TOPPADDING", (0, 0), (-1, -1), 8)]))
        story.extend([meta, Spacer(1, 18)])
        for heading, text in [("Context", context), ("Details", details), ("Next action", action)]:
            story.extend([Paragraph(heading, styles["Heading2"]), Paragraph(html.escape(text), styles["BodyText"]), Spacer(1, 8)])
        SimpleDocTemplate(str(target), pagesize=A4, rightMargin=56, leftMargin=56, topMargin=48, bottomMargin=48, title=title, author=owner).build(story)

    for i, rec in enumerate(RECORDS[8:10]):
        slug, title, identifier, date, owner, *body = rec
        text = "\\par ".join([LABEL, title, identifier, date, owner, *body])
        text = text.replace("{", "\\{").replace("}", "\\}")
        write_text(sources, f"legacy/[SAMPLE]-{slug}.rtf", "{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Arial;}}\\f0\\fs22 "+text+"}")

    # Explicitly labeled attachment-only ZIP cases; the compiler lists entries.
    for archive_name, rels in [
        ("pilot-handover", ["operations/[SAMPLE]-inventory.csv", "exports/[SAMPLE]-gateway-snapshot-01.json", "knowledge/[SAMPLE]-2026-09-15-pilot-installation.md"]),
        ("incident-evidence", ["logs/[SAMPLE]-2026-09-18-gateway.log", "quality/[SAMPLE]-quality-matrix.csv", "knowledge/[SAMPLE]-2026-09-18-rejoin-incident.md"]),
    ]:
        target = sources / "archives" / f"[SAMPLE]-{archive_name}.zip"
        target.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(target, "x", zipfile.ZIP_DEFLATED) as archive:
            for rel in rels:
                archive.write(sources / rel, rel)
            archive.writestr("README.txt", LABEL+"\nContained files are duplicates of separately supplied source records.\n")

    # Typed data handoff to the artifact-tool author, outside the ingest directory.
    tables = {"inventory": inventory, "bom": bom, "qa": qa, "support": tickets}
    write_text(base, "reference/office-data.json", json.dumps(tables, indent=2)+"\n")
    write_text(base, "reference/scenario.json", json.dumps({"synthetic": True, "company": "Aurora Labs", "people": PEOPLE, "records": RECORDS}, indent=2)+"\n")
    print(json.dumps({"phase": "generated", "source_files": len(list(sources.rglob("*.*"))), "output": str(base)}))


def finish(base):
    """Add scan-only PDFs, checksums, evaluation questions and upload bundles."""
    from PIL import Image
    from reportlab.pdfgen.canvas import Canvas
    from reportlab.lib.pagesizes import A4
    sources = base / "inputs"
    images = sorted((sources / "images").glob("*.png"))
    if len(images) != 10:
        raise SystemExit(f"Expected ten generated source images, found {len(images)}")
    if len(list(sources.rglob("*.xlsx"))) != 4 or len(list(sources.rglob("*.pptx"))) != 2:
        raise SystemExit("Expected four XLSX and two PPTX sources before finalizing")
    for n, phrase in [(4, "packing-slip"), (10, "expense-receipt")]:
        image = next(p for p in images if p.name.startswith(f"{n:02d}-"))
        target = sources / "pdfs" / f"[SAMPLE]-scanned-{phrase}.pdf"
        if target.exists():
            raise SystemExit(f"Refusing to replace {target}")
        canvas = Canvas(str(target), pagesize=A4)
        canvas.setTitle(f"[SAMPLE] Image-only scan: {phrase}")
        with Image.open(image) as img:
            width, height = img.size
        scale = min((A4[0]-40)/width, (A4[1]-40)/height)
        canvas.drawImage(str(image), (A4[0]-width*scale)/2, (A4[1]-height*scale)/2, width*scale, height*scale)
        canvas.showPage()
        canvas.save()

    manifest = []
    for p in sorted(sources.rglob("*")):
        if not p.is_file():
            continue
        rel = p.relative_to(sources).as_posix()
        ext = p.suffix.lower()
        expected = "text"
        if ext == ".png": expected = "vision_caption"
        elif "scanned-" in p.name: expected = "image_only_pdf_no_text_ocr_required"
        elif ext == ".zip": expected = "archive_listing_only"
        elif ext == ".rtf": expected = "opaque_download_only"
        elif ext == ".eml": expected = "email_and_attachment"
        manifest.append({"path": rel, "extension": ext, "bytes": p.stat().st_size,
                         "sha256": hashlib.sha256(p.read_bytes()).hexdigest(), "synthetic": True,
                         "expected_ingestion": expected, "category": p.parent.name})
    counts = dict(sorted(Counter(x["extension"] for x in manifest).items()))
    write_text(base, "manifest.json", json.dumps({"schema_version": 1, "synthetic": True,
               "company": "Aurora Labs", "date_range": ["2026-09-01", "2026-09-30"],
               "file_count": len(manifest), "counts_by_extension": counts, "files": manifest}, indent=2)+"\n")
    table_file(base, "manifest.csv", [["path", "extension", "bytes", "sha256", "expected_ingestion"]]+[
        [r[k] for k in ["path", "extension", "bytes", "sha256", "expected_ingestion"]] for r in manifest])
    qs = [
        ("current-interval", "What is the current sampling interval for GH-03 and why does an older record differ?", "15 minutes in PRD-NW2-04 dated September 10. Hourly was the historical kickoff assumption dated September 1.", ["knowledge/[SAMPLE]-2026-09-10-product-requirements.md", "knowledge/[SAMPLE]-2026-09-01-kickoff-history.md"]),
        ("battery-uncertainty", "Has a two-year battery life been demonstrated?", "No. Two years was an early planning target. Approximately 18 months at ten nodes is a later engineering model, not measured field lifetime.", ["knowledge/[SAMPLE]-2026-09-10-product-requirements.md"]),
        ("incident-status", "Can INC-2026-017 be closed after firmware 0.9.4-rc2 was received?", "No. The eight-node retest is blocked by an incomplete trace and no passing result is recorded. Priya Nair owns retest and Mira Chen owns firmware review.", ["knowledge/[SAMPLE]-2026-09-18-rejoin-incident.md", "knowledge/[SAMPLE]-2026-09-21-retest-status.md"]),
        ("shipment", "How many sensors and gateways were delivered for PO-2026-084?", "Twelve Nova Widget v2 sensors and two MeshSync gateways in two cartons. Receipt does not imply quality approval.", ["knowledge/[SAMPLE]-2026-09-16-receiving.md", "operations/[SAMPLE]-purchase-order-lines.csv"]),
        ("inventory", "How many of the twelve supplied sensors are initially active?", "Six active sensors and six replacements in the installation plan.", ["knowledge/[SAMPLE]-2026-09-15-pilot-installation.md", "operations/[SAMPLE]-inventory.csv"]),
        ("quality-hold", "Is GW1-003 released because its Ethernet check passed?", "No. Its MeshSync rejoin check is on hold; Priya Nair owns disposition.", ["knowledge/[SAMPLE]-2026-09-23-gateway-quality.md"]),
        ("gasket", "Which device needs gasket inspection and who owns it?", "NW2-009, support case SUP-2026-026, Jonah Park. Root cause remains unconfirmed.", ["knowledge/[SAMPLE]-2026-09-25-enclosure-return.md"]),
        ("expense", "What are the net, VAT and gross amounts on RCPT-2026-019?", "EUR 45.00 net, EUR 8.55 sample VAT and EUR 53.55 gross.", ["knowledge/[SAMPLE]-2026-09-08-expense-policy.md"]),
        ("offline", "Does MeshSync require a cloud connection for GH-03?", "No mandatory cloud connection. The gateway operates locally.", ["knowledge/[SAMPLE]-2026-09-10-product-requirements.md", "engineering/[SAMPLE]-gateway-profile-01.yaml"]),
        ("german", "Wer prueft acht Knoten erneut und ist der Fehler bereits geschlossen?", "Priya Nair prueft erneut. INC-2026-017 bleibt offen, die Aufzeichnung ist unvollstaendig.", ["knowledge/[SAMPLE]-2026-09-24-german-workshop.md"]),
    ]
    write_text(base, "reference/expected-answers.json", json.dumps([{"id": key, "question": q, "expected_answer": a, "evidence": ev} for key, q, a, ev in qs], indent=2)+"\n")
    readme = f"""# Aurora Labs company input pack

{len(manifest)} fictional source files in {len(counts)} formats, spanning September 2026.
All companies, employees, contacts, transactions, images and measurements in this pack are synthetic. These are ingestion fixtures, not Wissensbau research findings. Contacts use reserved `.example` domains.

## Files to ingest

`inputs/` contains the actual company sources, organized by department. The sibling `manifest.*` and `reference/` files describe the dataset; keep them out of normal ingestion so expected answers do not contaminate evaluation.

"""
    readme += "| Format | Source files |\n| --- | ---: |\n"+"".join(f"| `{ext}` | {count} |\n" for ext,count in counts.items())
    readme += """
## Using the pack

1. Select individual files from `inputs/` in the project's upload/import flow, or manually copy the chosen files into `data/raw/` while preserving subdirectories. Repository policy reserves raw-source changes for humans.
2. Start with the small starter archive. Extract it locally before uploading its contents.
3. For a full run, extract the full archive and select the source files. Uploading the ZIP itself only tests archive listing.
4. Run the existing compiler through the project UI or its normal command once the desired files have been added.
5. Compare the resulting pages with `reference/expected-answers.json` and check the source registry against `manifest.json`.

## Expected limitations and deliberate disagreements

- Images exercise vision captioning. Small or handwritten text may be transcribed imperfectly; compare against the visible image.
- Two PDFs are image-only scans. The current PDF extractor has no OCR, so they intentionally expose an extraction gap. Their corresponding PNGs test the vision path separately.
- ZIP inputs produce an entry listing, not recursive ingestion. RTF inputs are downloadable opaque attachments.
- The historical kickoff says hourly and a two-year battery target. The later requirement says 15 minutes and describes an 18-month engineering estimate at ten nodes, without a measured lifetime.
- A six-node baseline is distinct from the blocked eight-node rejoin retest. Firmware receipt and Ethernet PASS do not establish an overall release approval.
- Repeated references across emails, office documents and exports are intentional. Archive entries duplicate separately supplied records.
- No compiler run or external API processing is triggered by creating this pack.

`reference/image-prompts.json` records the prompts used with the built-in image generation tool. Generated images should be retained with their manifest checksums if the text fixtures are regenerated.
"""
    write_text(base, "SOURCE-GUIDE.md", readme)
    starter = [p for p in sorted(sources.rglob("*")) if p.is_file() and (
        p.suffix in {".docx", ".xlsx", ".pptx"} or p.name in {
            "01-nova-widget-product.png", "02-meshsync-planning-whiteboard.png", "04-packing-slip-scan.png",
            "[SAMPLE]-2026-09-10-product-requirements.md", "[SAMPLE]-2026-09-18-rejoin-incident.md",
            "[SAMPLE]-scanned-packing-slip.pdf", "[SAMPLE]-inventory.csv", "[SAMPLE]-gateway-snapshot-01.json",
            "[SAMPLE]-2026-09-18-gateway.log", "[SAMPLE]-2026-09-18-thread-02-1.eml"})]
    for archive_name, files in [("aurora-company-inputs.zip", [p for p in sorted(sources.rglob("*")) if p.is_file()]),
                                ("aurora-starter-inputs.zip", starter)]:
        with zipfile.ZipFile(base.parent / archive_name, "x", zipfile.ZIP_DEFLATED) as archive:
            for p in files:
                archive.write(p, p.relative_to(sources))
    print(json.dumps({"phase": "finalized", "source_files": len(manifest), "counts": counts, "starter_files": len(starter), "output": str(base)}))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("phase", choices=["generate", "finalize"])
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    base = safe_output(args.output)
    (generate if args.phase == "generate" else finish)(base)


if __name__ == "__main__":
    main()
