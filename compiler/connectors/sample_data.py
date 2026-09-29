"""Seeds the bundled sample SQLite database -- the SQLite analog of
docker/postgres/init.sql, so the /database page's default connections
have real content in both a Postgres-shaped and a file-based source
without requiring Docker or any setup.

Distinct content from the Postgres sample (which covers working groups,
people, projects and member FAQs): this is the fictional BürgerEnergie
Eschenbrück eG's operations data -- the devices installed at its solar
plants and the service tickets raised against them -- so importing both
samples produces genuinely different knowledge, not two copies of the
same tables. Same sample domain as data/raw/ (documentation/18).

Idempotent: `CREATE TABLE IF NOT EXISTS` plus a row-count guard on
`INSERT`, so calling this against an already-seeded file is a no-op
(matching init.sql's `ON CONFLICT DO NOTHING` for the same reason -- this
runs on every backend startup via connectors_service.ensure_default_connections(),
not just once).
"""

from __future__ import annotations

import sqlite3
from pathlib import Path

FIELD_DEVICES = [
    (1, "BEE-WR-2020-01", "Inverter Kestrel K-25", "Bürgerhaus Eschenbrück", "online", "2026-09-15"),
    (2, "BEE-WR-2022-01", "Inverter Kestrel K-40", "Feuerwehrhaus Eschenbrück", "online", "2026-09-15"),
    (3, "BEE-WR-2026-01", "Inverter Kestrel K-60 (WR-1)", "Sonnendach Lindenhof", "online", "2026-09-15"),
    (4, "BEE-WR-2026-02", "Inverter Kestrel K-60 (WR-2)", "Sonnendach Lindenhof", "online", "2026-09-15"),
    (5, "BEE-WR-2026-03", "Inverter Kestrel K-60 (WR-3)", "Sonnendach Lindenhof", "degraded", "2026-09-15"),
    (6, "BEE-BAT-2026-01", "Battery storage 100 kWh", "Sonnendach Lindenhof", "online", "2026-09-15"),
    (7, "BEE-MTR-2022-01", "Feed-in meter", "Feuerwehrhaus Eschenbrück", "offline", "2026-08-30"),
]

SUPPORT_TICKETS = [
    (
        1,
        "BEE-WR-2026-03",
        "open",
        "high",
        "WR-3 isolation warning ISO-217 on string 7",
        "Since 3 September the inverter reports low isolation resistance (180 kOhm, limit 500 kOhm) on string 7 in the early morning; it clears once feed-in starts. String 7 is the string whose fuse Lichtbau replaced before commissioning. Lichtbau asked to inspect the connectors for moisture.",
        "2026-09-03",
    ),
    (
        2,
        "BEE-MTR-2022-01",
        "in_progress",
        "medium",
        "Feed-in meter at the fire station not reporting",
        "The meter stopped sending readings on 30 August after a mobile network change. Netze Mittelland will swap the communication module; production is still recorded by the inverter.",
        "2026-08-31",
    ),
    (
        3,
        "BEE-BAT-2026-01",
        "resolved",
        "low",
        "Battery firmware update",
        "Battery management firmware 1.4.2 installed remotely on 1 September at 02:00; the battery resumed normal cycling the same morning.",
        "2026-09-01",
    ),
    (
        4,
        "BEE-WR-2020-01",
        "closed",
        "low",
        "Member asked for the Bürgerhaus plant's yearly yield",
        "Sent the 2025 annual report page with the yield of the Bürgerhaus plant to the member. No technical issue.",
        "2026-02-12",
    ),
    (
        5,
        "BEE-WR-2026-01",
        "closed",
        "medium",
        "Monitoring portal showed WR-1 twice",
        "After commissioning, WR-1 appeared twice in the monitoring portal. The data logger configuration listed it under both roofs; corrected in site-config.yaml.",
        "2026-08-21",
    ),
]


def seed_sample_sqlite_db(db_path: str | Path) -> bool:
    """Creates and populates the sample database at `db_path` if it
    doesn't already have data. Returns True if it just seeded (fresh file
    or empty tables), False if there was already data (no-op)."""
    path = Path(db_path)
    path.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(str(path))
    try:
        cur = conn.cursor()
        cur.execute(
            """CREATE TABLE IF NOT EXISTS field_devices (
                id INTEGER PRIMARY KEY,
                serial TEXT NOT NULL,
                model TEXT NOT NULL,
                site TEXT NOT NULL,
                status TEXT NOT NULL,
                last_seen TEXT NOT NULL
            )"""
        )
        cur.execute(
            """CREATE TABLE IF NOT EXISTS support_tickets (
                id INTEGER PRIMARY KEY,
                device_serial TEXT NOT NULL,
                status TEXT NOT NULL,
                priority TEXT NOT NULL,
                subject TEXT NOT NULL,
                body TEXT NOT NULL,
                opened_at TEXT NOT NULL
            )"""
        )

        cur.execute("SELECT COUNT(*) FROM field_devices")
        already_seeded = cur.fetchone()[0] > 0
        if already_seeded:
            return False

        cur.executemany("INSERT INTO field_devices VALUES (?, ?, ?, ?, ?, ?)", FIELD_DEVICES)
        cur.executemany("INSERT INTO support_tickets VALUES (?, ?, ?, ?, ?, ?, ?)", SUPPORT_TICKETS)
        conn.commit()
        return True
    finally:
        conn.close()
