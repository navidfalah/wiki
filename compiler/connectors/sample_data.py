"""Seeds the bundled sample SQLite database -- the SQLite analog of
docker/postgres/init.sql, so the /database page's default connections
have real content in both a Postgres-shaped and a file-based source
without requiring Docker or any setup.

Distinct content from the Postgres sample (which covers departments/
employees/projects/kb_articles): this is Aurora Labs' field-support
data -- deployed sensor devices and the support tickets raised against
them -- so importing both samples produces genuinely different knowledge,
not two copies of the same tables.

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
    (1, "AUR-SNS-0142", "Nova Widget v2", "Portland Watershed Site 3", "online", "2026-08-29"),
    (2, "AUR-SNS-0143", "Nova Widget v2", "Portland Watershed Site 3", "online", "2026-08-29"),
    (3, "AUR-SNS-0087", "Nova Widget", "Tillamook Coastal Array", "offline", "2026-07-11"),
    (4, "AUR-SNS-0201", "Nova Widget v2", "Willamette Valley Farm Co-op", "online", "2026-09-02"),
    (5, "AUR-SNS-0055", "Nova Widget", "Tillamook Coastal Array", "degraded", "2026-08-15"),
    (6, "AUR-SNS-0210", "Nova Widget v2", "Willamette Valley Farm Co-op", "online", "2026-09-02"),
]

SUPPORT_TICKETS = [
    (
        1,
        "AUR-SNS-0087",
        "open",
        "high",
        "Device offline since firmware 0.3.9 rollout",
        "Field tech reports AUR-SNS-0087 stopped reporting after the 0.3.9 OTA push. Battery reads full; suspect relay-mode radio regression flagged in the beta invite thread.",
        "2026-07-11",
    ),
    (
        2,
        "AUR-SNS-0055",
        "in_progress",
        "medium",
        "Intermittent battery drain, faster than spec",
        "Customer measured ~30% faster battery drain than spec once relay mode is enabled, matching the known relay-mode issue. Recommended disabling relay mode as a workaround pending firmware fix.",
        "2026-08-15",
    ),
    (
        3,
        "AUR-SNS-0142",
        "resolved",
        "low",
        "Requested historical sensor export",
        "Watershed Site 3 team requested a CSV export of the last quarter's readings for a grant report. Resolved by pointing them at the /resources export.",
        "2026-08-20",
    ),
    (
        4,
        "AUR-SNS-0201",
        "open",
        "medium",
        "Mesh reformation after co-op network change",
        "Farm co-op re-cabled their gateway; mesh took ~40 minutes to reform instead of the usual ~5. Investigating whether the new gateway's channel overlaps neighboring nodes.",
        "2026-09-02",
    ),
    (
        5,
        "AUR-SNS-0210",
        "closed",
        "low",
        "False-positive low-battery alert",
        "Alert fired at 22% charge instead of the configured 15% threshold. Traced to a firmware rounding bug already fixed in 0.3.9; customer confirmed resolved after OTA update.",
        "2026-09-03",
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
