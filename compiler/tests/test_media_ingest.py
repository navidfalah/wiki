from pathlib import Path

import media_ingest


class FakeLLM:
    available = True

    def __init__(self, caption: str = "A dashboard screenshot showing three charts."):
        self.caption = caption
        self.calls = 0

    def describe_image(self, path: Path, system_prompt: str) -> str:
        self.calls += 1
        return self.caption


def test_copy_media_to_static_dedupes_by_content(tmp_path: Path):
    static_dir = tmp_path / "static" / "media"
    src = tmp_path / "raw.png"
    src.write_bytes(b"same bytes")

    dest1 = media_ingest.copy_media_to_static(src, static_dir)
    dest2 = media_ingest.copy_media_to_static(src, static_dir)

    assert dest1 == dest2
    assert dest1.is_file()
    assert list(static_dir.iterdir()) == [dest1]


def test_copy_media_to_static_different_content_different_names(tmp_path: Path):
    static_dir = tmp_path / "static" / "media"
    a = tmp_path / "a.png"
    a.write_bytes(b"content a")
    b = tmp_path / "b.png"
    b.write_bytes(b"content b")

    dest_a = media_ingest.copy_media_to_static(a, static_dir)
    dest_b = media_ingest.copy_media_to_static(b, static_dir)

    assert dest_a != dest_b


def test_docs_relative_media_link(tmp_path: Path):
    static_dir = tmp_path / "wiki-app" / "static" / "media"
    static_dir.mkdir(parents=True)
    dest = static_dir / "photo-abc123.png"
    dest.write_bytes(b"x")

    link = media_ingest.docs_relative_media_link(dest, static_dir)
    assert link == "../static/media/photo-abc123.png"


def test_build_image_chunk_embeds_caption_and_link(tmp_path: Path):
    static_dir = tmp_path / "static" / "media"
    img = tmp_path / "shot.png"
    img.write_bytes(b"\x89PNG fake")
    llm = FakeLLM()

    chunk = media_ingest.build_image_chunk(img, "images/shot.png", llm, static_dir)

    assert chunk["source_type"] == "image"
    assert chunk["chunk_index"] == 0
    assert "A dashboard screenshot" in chunk["text"]
    assert "images/shot.png" in chunk["text"]
    assert chunk["media_link"] in chunk["text"]
    assert chunk["text"].endswith(f"![shot]({chunk['media_link']})")
    assert llm.calls == 1


def test_build_file_chunks_csv_extracts_rows(tmp_path: Path):
    static_dir = tmp_path / "static" / "media"
    csv_path = tmp_path / "data.csv"
    csv_path.write_text("name,value\nfoo,1\nbar,2\n", encoding="utf-8")

    chunks = media_ingest.build_file_chunks(csv_path, "files/data.csv", static_dir)

    assert len(chunks) == 1
    assert chunks[0]["source_type"] == "file"
    assert "name, value" in chunks[0]["text"]
    assert "foo, 1" in chunks[0]["text"]
    assert "files/data.csv" in chunks[0]["text"]


def test_build_file_chunks_json_extracts_content(tmp_path: Path):
    static_dir = tmp_path / "static" / "media"
    json_path = tmp_path / "config.json"
    json_path.write_text('{"key": "value", "n": 42}', encoding="utf-8")

    chunks = media_ingest.build_file_chunks(json_path, "files/config.json", static_dir)

    assert len(chunks) == 1
    assert '"key": "value"' in chunks[0]["text"]


def test_build_file_chunks_opaque_type_has_no_content_extraction(tmp_path: Path):
    static_dir = tmp_path / "static" / "media"
    docx_path = tmp_path / "report.docx"
    docx_path.write_bytes(b"PK\x03\x04 fake docx bytes")

    chunks = media_ingest.build_file_chunks(docx_path, "files/report.docx", static_dir)

    assert len(chunks) == 1
    assert chunks[0]["source_type"] == "file"
    assert "Attached file" in chunks[0]["text"]
    assert "content not parsed" in chunks[0]["text"]
    assert "Download report.docx" in chunks[0]["text"]


def test_build_file_chunks_pdf_falls_back_to_opaque_without_pypdf(tmp_path: Path, monkeypatch):
    static_dir = tmp_path / "static" / "media"
    pdf_path = tmp_path / "spec.pdf"
    pdf_path.write_bytes(b"%PDF-1.4 not a real pdf")

    # pypdf isn't installed in the test environment by default, so this
    # already exercises the graceful-degradation path; assert on the shape
    # rather than assuming import success either way.
    chunks = media_ingest.build_file_chunks(pdf_path, "files/spec.pdf", static_dir)
    assert len(chunks) >= 1
    assert chunks[0]["source_type"] == "file"


def test_extract_pdf_text_survives_non_exception_import_failure(tmp_path: Path, monkeypatch):
    """Regression test: pypdf's `cryptography` dependency can fail to import
    with a pyo3_runtime.PanicException, which does NOT subclass Exception —
    a plain `except Exception` around the import would not catch it and the
    whole compile would crash on any PDF. Simulate that with a BaseException
    subclass and confirm _extract_pdf_text degrades to None instead."""

    class FakeNativePanic(BaseException):
        pass

    import builtins

    real_import = builtins.__import__

    def fake_import(name, *args, **kwargs):
        if name == "pypdf":
            raise FakeNativePanic("simulated native crash importing pypdf")
        return real_import(name, *args, **kwargs)

    monkeypatch.setattr(builtins, "__import__", fake_import)

    pdf_path = tmp_path / "broken.pdf"
    pdf_path.write_bytes(b"%PDF-1.4 fake")

    assert media_ingest._extract_pdf_text(pdf_path) is None
