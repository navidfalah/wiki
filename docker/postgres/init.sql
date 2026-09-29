-- Seed data for the sample "postgres" service in docker-compose.yml.
--
-- Runs automatically (mounted at /docker-entrypoint-initdb.d/) the FIRST
-- time the `postgres-data` volume is created -- Postgres's own image
-- entrypoint only executes *.sql/*.sh files here on an empty data
-- directory, so editing this file after the container has started once
-- has no effect until the volume is removed (`docker compose down -v`).
--
-- This is fictional data for the same sample domain as data/raw/ -- the
-- citizens' energy cooperative BürgerEnergie Eschenbrück eG (see
-- documentation/18-sample-domain.md) -- a small internal knowledge base:
-- its working groups, who is in them, its projects, and a handful of
-- member FAQs. It exists purely so the /database page's "Fill the form with the
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
    ('Technik', 'Plan, build and operate the cooperative''s solar plants: Bürgerhaus, Feuerwehrhaus and Sonnendach Lindenhof.'),
    ('Finanzen', 'Keep the books, manage member shares and loans, and prepare the annual accounts for the general assembly.'),
    ('Mitgliederservice', 'Answer member questions, run information evenings and keep the website, flyer and FAQ up to date.')
ON CONFLICT DO NOTHING;

INSERT INTO employees (name, title, department_id, email, bio) VALUES
    ('Selin Aydın', 'Board member, technology', 1, 'selin.aydin@eschenbrueck-energie.example', 'Technical lead of the Sonnendach Lindenhof project; coordinates the installer, the structural engineer and the grid operator.'),
    ('Tobias Brandt', 'Board member, finance', 2, 'tobias.brandt@eschenbrueck-energie.example', 'Manages member shares, the loan with the Raiffeisenkasse Talgrund and the project budget.'),
    ('Mara Lenz', 'Volunteer, member service', 3, 'mara.lenz@eschenbrueck-energie.example', 'Answers the info@ mailbox and organises the information evenings in the school hall.'),
    ('Jakob Wendt', 'Volunteer, plant monitoring', 1, 'jakob.wendt@eschenbrueck-energie.example', 'Checks the daily production reports and opens a service ticket when an inverter reports a warning.'),
    ('Dr. Hanna Vogt', 'Chair of the board', 2, 'hanna.vogt@eschenbrueck-energie.example', 'Represents the cooperative towards the municipality and signs contracts together with a second board member.')
ON CONFLICT DO NOTHING;

INSERT INTO projects (name, status, department_id, summary) VALUES
    ('Bürgerhaus PV', 'operating', 1, 'The cooperative''s first plant, on the roof of the Bürgerhaus, in operation since 2020.'),
    ('Feuerwehrhaus PV', 'operating', 1, 'Rooftop plant on the fire station, in operation since 2022.'),
    ('Sonnendach Lindenhof', 'operating', 1, '171.6 kWp and a 100 kWh battery on the Grundschule am Lindenhof and the Sporthalle Nord, commissioned on 19 August 2026.'),
    ('Freibad heat pump', 'planned', 1, '60 kW heat pump pilot for the outdoor pool, postponed to spring 2027 because the pool''s electrical connection needs an upgrade.')
ON CONFLICT DO NOTHING;

INSERT INTO kb_articles (title, category, body, updated_at) VALUES
    ('How do I become a member?', 'faq', 'Fill in the membership form and buy at least one share. A share costs 250 euros; each member can hold up to 40 shares. The board confirms the membership within two weeks.', '2026-07-20'),
    ('When is the dividend paid?', 'faq', 'The general assembly decides the dividend each June. The dividend for 2025 was 2.0 % and was paid on 30 June 2026; from 2027 the cooperative aims for 3 %.', '2026-07-09'),
    ('An inverter reports a warning', 'runbook', 'Check the monitoring portal for the warning code. ISO warnings (low isolation resistance) that clear by themselves after sunrise are usually moisture in a connector: open a service ticket and ask the installer to inspect the string. Warnings that do not clear need a site visit the same week.', '2026-09-05'),
    ('Who buys the electricity?', 'faq', 'Each plant sells its power to the building it sits on: the school buys the Sonnendach Lindenhof power at 19.5 ct/kWh for 20 years. Surplus power is fed into the grid of Netze Mittelland.', '2026-07-20')
ON CONFLICT DO NOTHING;
