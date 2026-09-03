"""End-to-end check that mixed source types (text, image, email, file) flow
through _chunks_for_file -> extraction -> grouping -> synthesis, and that the
deterministic References & Trust section reflects every source correctly."""

from email.message import EmailMessage
from pathlib import Path

import synthesizer
from synthesizer import (
    _chunks_for_file,
    extract_chunk_topics,
    group_chunks_by_topic,
    synthesize_topic_wiki_pages,
)


class FakeLLM:
    available = True

    def generate_response(self, prompt: str, system_prompt: str, *, temperature: float = 0.2) -> str:
        if "knowledge extractor" in system_prompt.lower():
            return '{"topics": ["MeshSync"], "entities": [], "concepts": []}'
        # Wiki author: minimal valid page.
        return (
            "---\n"
            "id: meshsync\n"
            "title: MeshSync\n"
            "tags:\n  - wiki\n"
            "last_updated: 2026-01-01T00:00:00+00:00\n"
            "---\n\n"
            "# MeshSync\n\n## Overview\nSynthesized content.\n"
        )

    def describe_image(self, path: Path, system_prompt: str) -> str:
        return "A whiteboard photo of the MeshSync node topology."

    def transcribe_audio(self, path: Path) -> str:
        return "Voice memo: MeshSync rejoin storm reproduces at 8 nodes."


def test_mixed_source_types_flow_through_pipeline(tmp_path: Path, monkeypatch):
    raw_dir = tmp_path / "raw"
    raw_dir.mkdir()

    (raw_dir / "notes.md").write_text("# MeshSync\n\nRejoin storm reproduces at 8 nodes.\n")

    img_path = raw_dir / "whiteboard.png"
    img_path.write_bytes(b"\x89PNG fake bytes")

    eml_msg = EmailMessage()
    eml_msg["From"] = "mira@example.com"
    eml_msg["To"] = "jonah@example.com"
    eml_msg["Subject"] = "MeshSync debug notes"
    eml_msg["Date"] = "Mon, 1 Sep 2025 10:00:00 -0700"
    eml_msg.set_content("Parent swap spikes current draw significantly.")
    (raw_dir / "thread.eml").write_bytes(bytes(eml_msg))

    (raw_dir / "data.csv").write_text("node,rssi\nA,-40\nB,-52\n", encoding="utf-8")

    audio_path = raw_dir / "voice-memo.mp3"
    audio_path.write_bytes(b"ID3 fake mp3 bytes")

    static_dir = tmp_path / "static" / "media"
    monkeypatch.setattr(synthesizer.media_ingest, "STATIC_MEDIA_DIR", static_dir)

    llm = FakeLLM()

    all_chunks = []
    for path in sorted(raw_dir.iterdir()):
        all_chunks.extend(_chunks_for_file(path, raw_dir, llm))

    by_type = {c.source_type for c in all_chunks}
    assert by_type == {"text", "image", "email", "file", "audio"}

    extractions_payload = {"files": []}
    for path in sorted(raw_dir.iterdir()):
        rel = str(path.relative_to(raw_dir))
        chunks = [c for c in all_chunks if c.source_path == rel]
        extracted = [extract_chunk_topics(c, llm) for c in chunks]
        extractions_payload["files"].append(
            {
                "source": rel,
                "chunks": [
                    {
                        "chunk_index": e.chunk_index,
                        "text": e.text,
                        "topics": e.topics,
                        "entities": e.entities,
                        "concepts": e.concepts,
                        "source_type": e.source_type,
                    }
                    for e in extracted
                ],
            }
        )

    grouped = group_chunks_by_topic(extractions_payload)
    assert "MeshSync" in grouped
    entries = grouped["MeshSync"]
    entry_source_types = {e["source_type"] for e in entries}
    assert entry_source_types == {"text", "image", "email", "file", "audio"}

    out_dir = tmp_path / "temp_output"
    written, _ = synthesize_topic_wiki_pages(grouped, llm=llm, output_dir=out_dir)
    assert len(written) == 1

    content = written[0].read_text(encoding="utf-8")
    assert "## References & Trust" in content
    # One row per distinct source, each with its own source_type-derived trust label.
    assert "notes.md" in content and "| text |" in content
    assert "whiteboard.png" in content and "| image |" in content
    assert "thread.eml" in content and "| email |" in content
    assert "data.csv" in content and "| file |" in content
    assert "voice-memo.mp3" in content and "| audio |" in content
    # image/audio default to "Low" trust, text/email/file default to "Medium".
    assert "| `whiteboard.png` | image | Low |" in content
    assert "| `voice-memo.mp3` | audio | Low |" in content
