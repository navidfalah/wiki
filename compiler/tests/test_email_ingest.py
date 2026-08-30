from email.message import EmailMessage
from pathlib import Path

import email_ingest


def _write_eml(path: Path, msg: EmailMessage) -> None:
    path.write_bytes(bytes(msg))


def test_parse_eml_extracts_headers_and_body(tmp_path: Path):
    msg = EmailMessage()
    msg["From"] = "Alice <alice@example.com>"
    msg["To"] = "Bob <bob@example.com>, carol@example.com"
    msg["Cc"] = "dave@example.com"
    msg["Subject"] = "Q3 roadmap notes"
    msg["Date"] = "Mon, 1 Sep 2025 10:00:00 -0700"
    msg.set_content("Ship MeshSync beta by October.")

    eml_path = tmp_path / "msg.eml"
    _write_eml(eml_path, msg)

    parsed = email_ingest.parse_eml(eml_path)

    assert parsed.subject == "Q3 roadmap notes"
    assert parsed.from_addr == "Alice <alice@example.com>"
    assert parsed.to_addrs == ["Bob <bob@example.com>", "carol@example.com"]
    assert parsed.cc_addrs == ["dave@example.com"]
    assert "Ship MeshSync beta" in parsed.body_text
    assert parsed.attachments == []


def test_parse_eml_html_only_body_is_stripped(tmp_path: Path):
    msg = EmailMessage()
    msg["From"] = "x@example.com"
    msg["To"] = "y@example.com"
    msg["Subject"] = "HTML test"
    msg["Date"] = "Wed, 3 Sep 2025 09:00:00 -0700"
    msg.set_content(
        "<html><body><p>Hello <b>world</b></p><script>evil()</script></body></html>",
        subtype="html",
    )

    eml_path = tmp_path / "html.eml"
    _write_eml(eml_path, msg)

    parsed = email_ingest.parse_eml(eml_path)
    assert "Hello" in parsed.body_text
    assert "world" in parsed.body_text
    assert "evil()" not in parsed.body_text
    assert "<" not in parsed.body_text


def test_parse_eml_missing_headers_dont_crash(tmp_path: Path):
    eml_path = tmp_path / "bare.eml"
    eml_path.write_text("Subject: only a subject\n\nbody text\n", encoding="utf-8")

    parsed = email_ingest.parse_eml(eml_path)
    assert parsed.subject == "only a subject"
    assert parsed.from_addr == ""
    assert parsed.to_addrs == []
    assert "body text" in parsed.body_text


def test_build_email_chunks_includes_headers_in_every_chunk_when_short(tmp_path: Path):
    msg = EmailMessage()
    msg["From"] = "a@example.com"
    msg["To"] = "b@example.com"
    msg["Subject"] = "Short note"
    msg["Date"] = "Mon, 1 Sep 2025 10:00:00 -0700"
    msg.set_content("Just a short message.")

    eml_path = tmp_path / "short.eml"
    _write_eml(eml_path, msg)
    static_dir = tmp_path / "static" / "media"

    chunks = email_ingest.build_email_chunks(eml_path, "emails/short.eml", static_dir)

    assert len(chunks) == 1
    assert chunks[0]["source_type"] == "email"
    assert "Subject: Short note" in chunks[0]["text"]
    assert "Just a short message." in chunks[0]["text"]


def test_build_email_chunks_saves_and_links_attachments(tmp_path: Path):
    msg = EmailMessage()
    msg["From"] = "dana@example.com"
    msg["To"] = "team@example.com"
    msg["Subject"] = "Spec draft attached"
    msg["Date"] = "Tue, 2 Sep 2025 09:00:00 -0700"
    msg.set_content("See attached spec.")
    msg.add_attachment(
        b"%PDF-1.4 fake pdf bytes",
        maintype="application",
        subtype="pdf",
        filename="spec.pdf",
    )

    eml_path = tmp_path / "with_attachment.eml"
    _write_eml(eml_path, msg)
    static_dir = tmp_path / "static" / "media"

    chunks = email_ingest.build_email_chunks(eml_path, "emails/with_attachment.eml", static_dir)

    assert len(chunks) == 1
    assert "Attachments:" in chunks[0]["text"]
    assert "spec.pdf" in chunks[0]["text"]
    saved_files = list(static_dir.iterdir())
    assert len(saved_files) == 1
    assert saved_files[0].suffix == ".pdf"


def test_build_email_chunks_no_attachments_no_section(tmp_path: Path):
    msg = EmailMessage()
    msg["From"] = "a@example.com"
    msg["To"] = "b@example.com"
    msg["Subject"] = "No attachments"
    msg["Date"] = "Mon, 1 Sep 2025 10:00:00 -0700"
    msg.set_content("Nothing attached here.")

    eml_path = tmp_path / "plain.eml"
    _write_eml(eml_path, msg)
    static_dir = tmp_path / "static" / "media"

    chunks = email_ingest.build_email_chunks(eml_path, "emails/plain.eml", static_dir)
    assert "Attachments:" not in chunks[0]["text"]


def test_build_email_chunks_splits_long_body(tmp_path: Path):
    msg = EmailMessage()
    msg["From"] = "a@example.com"
    msg["To"] = "b@example.com"
    msg["Subject"] = "Long thread"
    msg["Date"] = "Mon, 1 Sep 2025 10:00:00 -0700"
    long_body = "\n\n".join(f"Paragraph {i} " + ("x" * 200) for i in range(30))
    msg.set_content(long_body)

    eml_path = tmp_path / "long.eml"
    _write_eml(eml_path, msg)
    static_dir = tmp_path / "static" / "media"

    chunks = email_ingest.build_email_chunks(eml_path, "emails/long.eml", static_dir)
    assert len(chunks) > 1
    assert all(c["source_type"] == "email" for c in chunks)
    assert [c["chunk_index"] for c in chunks] == list(range(len(chunks)))
