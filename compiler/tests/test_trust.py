from pathlib import Path

import trust


def test_resolve_trust_defaults_by_source_type():
    info = trust.resolve_trust("notes/foo.md", "text", config=trust.DEFAULT_CONFIG)
    assert info.level == "medium"

    info = trust.resolve_trust("images/shot.png", "image", config=trust.DEFAULT_CONFIG)
    assert info.level == "low"


def test_resolve_trust_unknown_source_type_falls_back_to_medium():
    info = trust.resolve_trust("weird/x.bin", "mystery", config=trust.DEFAULT_CONFIG)
    assert info.level == "medium"


def test_resolve_trust_glob_rule_wins_over_default():
    config = {
        "version": 1,
        "default_by_source_type": {"email": "medium"},
        "rules": [
            {"pattern": "emails/verified/**", "level": "verified", "reason": "Verified thread"},
        ],
    }
    info = trust.resolve_trust("emails/verified/thread1.eml", "email", config)
    assert info.level == "verified"
    assert info.reason == "Verified thread"

    # A non-matching email still falls back to the source_type default.
    info2 = trust.resolve_trust("emails/random/thread2.eml", "email", config)
    assert info2.level == "medium"


def test_resolve_trust_first_matching_rule_wins():
    config = {
        "version": 1,
        "default_by_source_type": {},
        "rules": [
            {"pattern": "samples/**", "level": "unverified"},
            {"pattern": "samples/verified/**", "level": "verified"},
        ],
    }
    # First rule matches before the more specific second rule is reached.
    info = trust.resolve_trust("samples/verified/x.md", "text", config)
    assert info.level == "unverified"


def test_resolve_trust_invalid_level_in_rule_defaults_to_medium():
    config = {
        "version": 1,
        "default_by_source_type": {},
        "rules": [{"pattern": "*", "level": "super-duper-trusted"}],
    }
    info = trust.resolve_trust("anything.md", "text", config)
    assert info.level == "medium"


def test_trust_scores_are_ordered():
    assert trust.TRUST_SCORES["unverified"] < trust.TRUST_SCORES["low"]
    assert trust.TRUST_SCORES["low"] < trust.TRUST_SCORES["medium"]
    assert trust.TRUST_SCORES["medium"] < trust.TRUST_SCORES["high"]
    assert trust.TRUST_SCORES["high"] < trust.TRUST_SCORES["verified"]


def test_load_trust_config_missing_file_returns_defaults(tmp_path: Path):
    config = trust.load_trust_config(tmp_path / "does-not-exist.json")
    assert config["default_by_source_type"] == trust.DEFAULT_TRUST_BY_SOURCE_TYPE
    assert config["rules"] == []


def test_load_trust_config_invalid_json_returns_defaults(tmp_path: Path):
    bad = tmp_path / "source_trust.json"
    bad.write_text("{not valid json", encoding="utf-8")
    config = trust.load_trust_config(bad)
    assert config["rules"] == []


def test_save_and_load_trust_config_round_trip(tmp_path: Path):
    path = tmp_path / "source_trust.json"
    config = {
        "version": 1,
        "default_by_source_type": {"email": "high"},
        "rules": [{"pattern": "verified/**", "level": "verified"}],
    }
    trust.save_trust_config(config, path)
    loaded = trust.load_trust_config(path)
    assert loaded["default_by_source_type"] == {"email": "high"}
    assert loaded["rules"] == [{"pattern": "verified/**", "level": "verified"}]


def test_build_references_dedupes_by_source():
    entries = [
        {"source": "notes/a.md", "chunk_index": 0, "source_type": "text"},
        {"source": "notes/a.md", "chunk_index": 1, "source_type": "text"},
        {"source": "emails/b.eml", "chunk_index": 0, "source_type": "email"},
    ]
    refs = trust.build_references(entries, config=trust.DEFAULT_CONFIG)
    assert [r.source_path for r in refs] == ["notes/a.md", "emails/b.eml"]
    assert [r.index for r in refs] == [1, 2]
    assert refs[0].chunk_index == 0  # first occurrence wins


def test_render_references_markdown_empty():
    assert trust.render_references_markdown([]) == ""


def test_render_references_markdown_table_shape():
    entries = [{"source": "notes/a.md", "chunk_index": 0, "source_type": "text"}]
    refs = trust.build_references(entries, config=trust.DEFAULT_CONFIG)
    md = trust.render_references_markdown(refs)
    assert "## References & Trust" in md
    assert "| 1 | `notes/a.md` | text | Medium |" in md
