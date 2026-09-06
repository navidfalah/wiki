-- Seed data for the sample "postgres" service in docker-compose.yml.
--
-- Runs automatically (mounted at /docker-entrypoint-initdb.d/) the FIRST
-- time the `postgres-data` volume is created -- Postgres's own image
-- entrypoint only executes *.sql/*.sh files here on an empty data
-- directory, so editing this file after the container has started once
-- has no effect until the volume is removed (`docker compose down -v`).
--
-- This is fictional data for the same "Aurora Labs" sample domain the
-- rest of this project's dummy-data generators use (see
-- scripts/dev/generate_junk_data.py) -- a small internal knowledge base:
-- who's on which team, what they're building, and a handful of support
-- FAQs. It exists purely so the /database page's "Fill the form with the
-- sample database's values" button has a real database to connect to and
-- something meaningful to import.

CREATE TABLE IF NOT EXISTS departments (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    mission     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS employees (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    title           TEXT NOT NULL,
    department_id   INTEGER REFERENCES departments(id),
    email           TEXT NOT NULL,
    bio             TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS projects (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    status          TEXT NOT NULL,
    department_id   INTEGER REFERENCES departments(id),
    summary         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS kb_articles (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    category    TEXT NOT NULL,
    body        TEXT NOT NULL,
    updated_at  DATE NOT NULL
);

INSERT INTO departments (name, mission) VALUES
    ('Hardware Engineering', 'Design and validate the sensor boards and radio modules behind every Aurora Labs product.'),
    ('Firmware', 'Own the MeshSync protocol stack and over-the-air update pipeline running on every deployed node.'),
    ('Customer Success', 'Help field teams commission, monitor, and troubleshoot Aurora Labs sensor mesh deployments.')
ON CONFLICT DO NOTHING;

INSERT INTO employees (name, title, department_id, email, bio) VALUES
    ('Priya Natarajan', 'Principal Hardware Engineer', 1, 'priya.natarajan@auroralabs.example', 'Leads antenna and power-budget design for the Nova Widget sensor line; previously built low-power radios for agricultural IoT.'),
    ('Marcus Webb', 'Firmware Lead', 2, 'marcus.webb@auroralabs.example', 'Owns the MeshSync mesh-networking stack end to end, from the radio driver up through the OTA update client.'),
    ('Elena Sokolova', 'Customer Success Engineer', 3, 'elena.sokolova@auroralabs.example', 'Front-line support for field deployments; writes most of the troubleshooting runbooks other engineers copy.'),
    ('Devon Ashworth', 'Hardware Engineer II', 1, 'devon.ashworth@auroralabs.example', 'Works on enclosure design and environmental sealing for outdoor-rated sensor nodes.'),
    ('Grace Kim', 'Firmware Engineer', 2, 'grace.kim@auroralabs.example', 'Maintains the mesh-routing simulator used to test MeshSync topology changes before they ship.')
ON CONFLICT DO NOTHING;

INSERT INTO projects (name, status, department_id, summary) VALUES
    ('Nova Widget', 'shipping', 1, 'Aurora Labs'' flagship environmental sensor node -- temperature, humidity, and particulate sensing over a MeshSync radio link.'),
    ('MeshSync v3', 'in_progress', 2, 'Next-generation mesh networking protocol adding sub-second failover and encrypted OTA firmware delivery.'),
    ('Field Diagnostics App', 'in_progress', 3, 'Mobile app for field technicians to commission new nodes and pull live diagnostics off a mesh without a laptop.'),
    ('Solar Harvester Module', 'planned', 1, 'Add-on solar charging board for Nova Widget deployments in areas without easy battery-swap access.')
ON CONFLICT DO NOTHING;

INSERT INTO kb_articles (title, category, body, updated_at) VALUES
    ('Nova Widget will not join the mesh', 'troubleshooting', 'Confirm the node is within range of an existing MeshSync gateway (check the blue LED -- solid means joined, blinking means searching). If it stays in search mode for more than 5 minutes, re-run the commissioning QR scan from the Field Diagnostics App and verify the mesh network key matches the gateway''s.', '2025-11-02'),
    ('Battery life expectations for Nova Widget', 'faq', 'A Nova Widget on the standard 2xAA pack reports readings every 5 minutes and should run 9-12 months depending on radio hop count. Increasing the reporting interval to 15 minutes roughly doubles battery life; the Solar Harvester Module removes the limit entirely for outdoor deployments.', '2025-10-14'),
    ('How MeshSync handles a gateway outage', 'architecture', 'Every node keeps a rolling buffer of the last 500 readings. If the gateway it reports to goes offline, MeshSync v3 fails over to the next-strongest neighbor gateway within 3 mesh heartbeats (about 45 seconds) and replays the buffered readings once reconnected, so a gateway restart does not lose data.', '2025-12-01'),
    ('Firmware update rollout process', 'runbook', 'OTA updates are staged: 5% of a deployment''s nodes first, held for 24 hours while Firmware monitors crash-free rate, then the remaining 95% in one batch. A failed stage automatically halts the rollout and pages the on-call Firmware engineer.', '2025-09-20')
ON CONFLICT DO NOTHING;
