import email_engine


def test_list_emails_reads_eml_headers(tmp_path):
    raw_dir = tmp_path / "raw"
    (raw_dir / "emails").mkdir(parents=True)
    (raw_dir / "emails" / "thread.eml").write_text(
        "Subject: Battery drain\n"
        "From: Mira Chen <mira@example.com>\n"
        "To: eng-team@example.com\n"
        "Date: Tue, 02 Jun 2026 09:14:00 -0700\n"
        "\n"
        "Body text here.\n",
        encoding="utf-8",
    )

    result = email_engine.list_emails(raw_dir=raw_dir)
    assert result["total"] == 1
    email = result["emails"][0]
    assert email["path"] == "emails/thread.eml"
    assert email["subject"] == "Battery drain"
    assert email["from"] == "Mira Chen <mira@example.com>"
    assert email["status"] == "Unprocessed"
    assert email["trust"]["level"] == "medium"


def test_list_emails_ignores_non_email_sources(tmp_path):
    raw_dir = tmp_path / "raw"
    raw_dir.mkdir()
    (raw_dir / "notes.txt").write_text("hello", encoding="utf-8")

    result = email_engine.list_emails(raw_dir=raw_dir)
    assert result["total"] == 0


def test_get_email_detail_returns_body_and_attachments(tmp_path):
    raw_dir = tmp_path / "raw"
    raw_dir.mkdir()
    (raw_dir / "thread.eml").write_text(
        "Subject: Firmware notes\nFrom: a@example.com\nTo: b@example.com\nDate: Mon, 01 Jun 2026 00:00:00 -0700\n\nHello there.\n",
        encoding="utf-8",
    )

    detail = email_engine.get_email_detail("thread.eml", raw_dir=raw_dir)
    assert detail["subject"] == "Firmware notes"
    assert "Hello there." in detail["body"]
    assert detail["attachments"] == []
    assert detail["synthesized_pages"] == []


def test_get_email_detail_rejects_non_email_source(tmp_path):
    raw_dir = tmp_path / "raw"
    raw_dir.mkdir()
    (raw_dir / "notes.txt").write_text("hello", encoding="utf-8")

    try:
        email_engine.get_email_detail("notes.txt", raw_dir=raw_dir)
    except email_engine.NotAnEmailError:
        pass
    else:
        raise AssertionError("expected NotAnEmailError for a non-email source")


def test_get_email_detail_raises_for_missing_file(tmp_path):
    raw_dir = tmp_path / "raw"
    raw_dir.mkdir()

    try:
        email_engine.get_email_detail("missing.eml", raw_dir=raw_dir)
    except FileNotFoundError:
        pass
    else:
        raise AssertionError("expected FileNotFoundError for a missing source")
