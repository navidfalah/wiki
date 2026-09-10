from pathlib import Path

import pytest

from synthesizer import (
    RawChunk,
    _parse_extraction_json,
    compute_file_md5,
    discover_raw_source_files,
    extract_chunk_topics,
    scan_raw_file_changes,
    slugify,
    split_text_into_chunks,
)


def test_slugify_lowercases_and_hyphenates():
    assert slugify("MeshSync Protocol") == "meshsync-protocol"


def test_parse_extraction_json_parses_clean_json():
    raw = '{"topics": ["MeshSync"], "entities": [], "concepts": []}'
    assert _parse_extraction_json(raw) == {"topics": ["MeshSync"], "entities": [], "concepts": []}


def test_parse_extraction_json_repairs_a_trailing_comma_before_the_closing_brace():
    # The exact shape that produces json's confusing "Expecting property
    # name enclosed in double quotes" error -- a real failure this project
    # hit against gemini-3.5-flash-lite.
    raw = '{"topics": ["MeshSync"], "entities": [{"name": "Mira Chen"},],}'
    assert _parse_extraction_json(raw) == {"topics": ["MeshSync"], "entities": [{"name": "Mira Chen"}]}


def test_parse_extraction_json_extracts_the_json_blob_from_surrounding_prose():
    raw = 'Here is the extraction:\n{"topics": ["MeshSync"], "entities": [], "concepts": []}\nHope that helps!'
    assert _parse_extraction_json(raw) == {"topics": ["MeshSync"], "entities": [], "concepts": []}


def test_parse_extraction_json_raises_with_the_raw_response_attached_when_unrepairable():
    raw = '{"topics": ["MeshSync" "entities": []}'  # missing comma -- not a trailing-comma shape
    with pytest.raises(ValueError, match="MeshSync"):
        _parse_extraction_json(raw)


def test_parse_extraction_json_raises_when_no_json_object_is_present():
    with pytest.raises(ValueError):
        _parse_extraction_json("I couldn't find any topics.")


class _FakeRetryLLM:
    """Returns `responses` in order, one per generate_response call --
    lets a test script "broken first call, valid retry" without touching a
    real LLM. Records use_cache per call so the retry's use_cache=False can
    be asserted on."""

    available = True

    def __init__(self, responses: list[str]):
        self.responses = list(responses)
        self.calls: list[dict] = []

    def generate_response(self, prompt: str, system_prompt: str, *, temperature: float = 0.2, use_cache: bool | None = None) -> str:
        self.calls.append({"prompt": prompt, "use_cache": use_cache})
        return self.responses.pop(0)


def test_extract_chunk_topics_retries_once_on_malformed_json_and_succeeds():
    # The real failure this project hit: a missing closing brace inside a
    # nested array -- not the trailing-comma shape _parse_extraction_json
    # repairs on its own, so it must fall through to the retry.
    broken = '{"topics": ["A"], "entities": [{"name": "x", "description": "y"\n, {"name": "z"}], "concepts": []}'
    valid = '{"topics": ["A"], "entities": [{"name": "x", "description": "y"}], "concepts": []}'
    llm = _FakeRetryLLM([broken, valid])
    chunk = RawChunk(source_path="notes/x.md", chunk_index=0, text="some text", source_type="text")

    extraction = extract_chunk_topics(chunk, llm)

    assert extraction.topics == ["A"]
    assert len(llm.calls) == 2
    assert llm.calls[1]["use_cache"] is False
    assert "not valid JSON" in llm.calls[1]["prompt"]
    assert broken in llm.calls[1]["prompt"]


def test_extract_chunk_topics_raises_with_both_errors_when_the_retry_also_fails():
    llm = _FakeRetryLLM(["not json at all", "still not json"])
    chunk = RawChunk(source_path="notes/x.md", chunk_index=0, text="some text", source_type="text")

    with pytest.raises(ValueError, match="malformed JSON twice in a row"):
        extract_chunk_topics(chunk, llm)
    assert len(llm.calls) == 2


def test_slugify_strips_punctuation():
    assert slugify("Battery: Life & Specs!") == "battery-life-specs"


def test_slugify_truncates_to_80_chars():
    assert len(slugify("x" * 200)) <= 80


def test_slugify_empty_string():
    assert slugify("   ") == ""


def test_split_text_into_chunks_respects_paragraph_boundaries():
    content = "Para one.\n\nPara two.\n\nPara three."
    chunks = split_text_into_chunks(content, max_chars=15)
    assert chunks == ["Para one.", "Para two.", "Para three."]


def test_split_text_into_chunks_merges_short_paragraphs():
    content = "a\n\nb\n\nc"
    chunks = split_text_into_chunks(content, max_chars=2000)
    assert chunks == ["a\n\nb\n\nc"]


def test_split_text_into_chunks_empty_content():
    assert split_text_into_chunks("") == []
    assert split_text_into_chunks("   ") == []


def test_compute_file_md5(tmp_path: Path):
    f = tmp_path / "a.txt"
    f.write_text("hello world")
    import hashlib

    assert compute_file_md5(f) == hashlib.md5(b"hello world").hexdigest()


def test_discover_raw_source_files_excludes_archive(tmp_path: Path):
    (tmp_path / "notes").mkdir()
    (tmp_path / "notes" / "a.txt").write_text("a")
    (tmp_path / "notes" / "b.md").write_text("b")
    (tmp_path / "notes" / "c.json").write_text("{}")
    archive = tmp_path / "_archive"
    archive.mkdir()
    (archive / "old.txt").write_text("old")

    found = discover_raw_source_files(tmp_path)
    names = {p.name for p in found}
    assert names == {"a.txt", "b.md", "c.json"}


def test_discover_raw_source_files_includes_media_and_emails(tmp_path: Path):
    (tmp_path / "note.md").write_text("hi")
    (tmp_path / "photo.png").write_bytes(b"\x89PNG")
    (tmp_path / "thread.eml").write_text("Subject: x\n\nbody")
    (tmp_path / "spec.pdf").write_bytes(b"%PDF-1.4")
    (tmp_path / "archive.zip").write_bytes(b"PK\x03\x04")
    (tmp_path / ".gitkeep").write_text("")
    (tmp_path / "ignored.exe").write_bytes(b"MZ")

    found = discover_raw_source_files(tmp_path)
    names = {p.name for p in found}
    assert names == {"note.md", "photo.png", "thread.eml", "spec.pdf", "archive.zip"}


def test_scan_raw_file_changes_detects_new_modified_deleted(tmp_path: Path):
    (tmp_path / "a.txt").write_text("v1")
    (tmp_path / "b.txt").write_text("v1")

    state = {"files": {}}
    first = scan_raw_file_changes(tmp_path, state, force=False)
    assert sorted(first.new) == ["a.txt", "b.txt"]
    assert first.modified == []
    assert first.deleted == []

    # Simulate persisting state after processing.
    for rel in first.new:
        state["files"][rel] = {"md5": compute_file_md5(tmp_path / rel)}

    (tmp_path / "a.txt").write_text("v2")
    (tmp_path / "b.txt").unlink()

    second = scan_raw_file_changes(tmp_path, state, force=False)
    assert second.modified == ["a.txt"]
    assert second.deleted == ["b.txt"]
    assert second.new == []


def test_scan_raw_file_changes_force_treats_known_files_as_modified(tmp_path: Path):
    (tmp_path / "a.txt").write_text("v1")
    state = {"files": {"a.txt": {"md5": compute_file_md5(tmp_path / "a.txt")}}}

    changes = scan_raw_file_changes(tmp_path, state, force=True)
    assert changes.modified == ["a.txt"]
    assert changes.unchanged == []
    assert changes.new == []
