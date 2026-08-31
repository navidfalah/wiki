import resources_engine


def test_parse_references_table_extracts_rows():
    body = (
        "## References & Trust\n\n"
        "| # | Source | Type | Trust |\n"
        "|---|--------|------|-------|\n"
        "| 1 | `notes/meshsync-debug.md` | text | Medium |\n"
        "| 2 | `emails/mira-jonah-thread.eml` | email | Medium |\n"
    )
    rows = resources_engine.parse_references_table(body)
    assert rows == [
        {"source": "notes/meshsync-debug.md", "source_type": "text", "trust": "Medium"},
        {"source": "emails/mira-jonah-thread.eml", "source_type": "email", "trust": "Medium"},
    ]


def test_parse_references_table_ignores_non_reference_rows():
    body = "| a | b | c |\n| # | Source | Type | Trust |\n|---|---|---|---|\n"
    assert resources_engine.parse_references_table(body) == []


def _write_page(docs_dir, name, title, rows):
    table = "\n".join(
        f"| {i} | `{r['source']}` | {r['source_type']} | {r['trust']} |"
        for i, r in enumerate(rows, start=1)
    )
    (docs_dir / name).write_text(
        f"---\ntitle: {title}\n---\n\nBody.\n\n## References & Trust\n\n"
        f"| # | Source | Type | Trust |\n|---|--------|------|-------|\n{table}\n",
        encoding="utf-8",
    )


def test_list_resources_dedupes_and_counts_citations(tmp_path):
    docs_dir = tmp_path / "docs"
    docs_dir.mkdir()
    _write_page(docs_dir, "a.md", "Page A", [{"source": "emails/thread.eml", "source_type": "email", "trust": "Medium"}])
    _write_page(
        docs_dir,
        "b.md",
        "Page B",
        [
            {"source": "emails/thread.eml", "source_type": "email", "trust": "Medium"},
            {"source": "notes/other.md", "source_type": "text", "trust": "High"},
        ],
    )

    result = resources_engine.list_resources(docs_dir=docs_dir)
    by_source = {item["source"]: item for item in result["resources"]}
    assert by_source["emails/thread.eml"]["citation_count"] == 2
    assert {p["title"] for p in by_source["emails/thread.eml"]["citing_pages"]} == {"Page A", "Page B"}
    assert by_source["notes/other.md"]["citation_count"] == 1

    filtered = resources_engine.list_resources(docs_dir=docs_dir, source_type="text")
    assert [item["source"] for item in filtered["resources"]] == ["notes/other.md"]

    with_query = resources_engine.list_resources(docs_dir=docs_dir, q="thread")
    assert [item["source"] for item in with_query["resources"]] == ["emails/thread.eml"]


def test_get_resource_detail_includes_raw_preview_when_available(tmp_path):
    docs_dir = tmp_path / "docs"
    docs_dir.mkdir()
    raw_dir = tmp_path / "raw"
    (raw_dir / "notes").mkdir(parents=True)
    (raw_dir / "notes" / "other.md").write_text("Original raw content.", encoding="utf-8")
    _write_page(docs_dir, "a.md", "Page A", [{"source": "notes/other.md", "source_type": "text", "trust": "High"}])

    detail = resources_engine.get_resource_detail("notes/other.md", docs_dir=docs_dir, raw_dir=raw_dir)
    assert detail is not None
    assert detail["preview"] == "Original raw content."


def test_get_resource_detail_returns_none_for_unknown_source(tmp_path):
    docs_dir = tmp_path / "docs"
    docs_dir.mkdir()
    assert resources_engine.get_resource_detail("missing.md", docs_dir=docs_dir) is None
