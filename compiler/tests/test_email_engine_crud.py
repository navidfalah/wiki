"""Create / update / delete of .eml sources, and path containment."""

import email
from email import policy

import pytest

import email_engine


@pytest.fixture
def raw_dir(tmp_path):
    d = tmp_path / "raw"
    d.mkdir()
    return d


def _headers(path):
    return email.message_from_bytes(path.read_bytes(), policy=policy.default)


def test_create_writes_a_parseable_eml_under_emails(raw_dir):
    detail = email_engine.create_email(
        "Relay: battery drain!", "mia@example.com", ["eng@example.com", "qa@example.com"], ["boss@example.com"], "", "Batch 4 drains.", raw_dir=raw_dir
    )
    assert detail["path"].startswith("emails/")
    assert detail["path"].endswith("-relay-battery-drain.eml")
    assert detail["subject"] == "Relay: battery drain!"
    assert detail["status"] == "Unprocessed"
    assert "Batch 4 drains." in detail["body"]
    msg = _headers(raw_dir / detail["path"])
    assert msg["To"] == "eng@example.com, qa@example.com"
    assert msg["Cc"] == "boss@example.com"
    assert msg["Date"]  # filled in when not given


def test_create_never_overwrites_an_existing_email(raw_dir):
    first = email_engine.create_email("Same", "a@x", [], [], "", "one", raw_dir=raw_dir)
    second = email_engine.create_email("Same", "a@x", [], [], "", "two", raw_dir=raw_dir)
    third = email_engine.create_email("Same", "a@x", [], [], "", "three", raw_dir=raw_dir)
    assert len({first["path"], second["path"], third["path"]}) == 3
    assert third["path"].endswith("-same-3.eml")
    assert "one" in (raw_dir / first["path"]).read_text()


def test_a_subject_without_letters_still_gets_a_filename(raw_dir):
    detail = email_engine.create_email("!!!", "a@x", [], [], "", "", raw_dir=raw_dir)
    assert detail["path"].endswith("-email.eml")


def test_update_rewrites_in_place(raw_dir):
    created = email_engine.create_email("Draft", "a@x", ["b@x"], [], "", "v1", raw_dir=raw_dir)
    updated = email_engine.update_email(created["path"], "Final", "a@x", ["c@x"], [], "Mon, 01 Jun 2026 00:00:00 +0000", "v2", raw_dir=raw_dir)
    assert updated["path"] == created["path"]
    assert updated["subject"] == "Final"
    assert "v2" in updated["body"]
    assert _headers(raw_dir / created["path"])["Date"] == "Mon, 01 Jun 2026 00:00:00 +0000"


def test_delete_removes_the_file(raw_dir):
    created = email_engine.create_email("Bye", "a@x", [], [], "", "", raw_dir=raw_dir)
    assert email_engine.delete_email(created["path"], raw_dir=raw_dir) == {"deleted": True, "path": created["path"]}
    assert not (raw_dir / created["path"]).exists()


@pytest.mark.parametrize("op", ["update", "delete"])
def test_update_and_delete_refuse_missing_and_non_email_files(raw_dir, op):
    (raw_dir / "notes.txt").write_text("not mail")

    def call(path):
        if op == "delete":
            return email_engine.delete_email(path, raw_dir=raw_dir)
        return email_engine.update_email(path, "s", "a@x", [], [], "", "", raw_dir=raw_dir)

    with pytest.raises(FileNotFoundError):
        call("emails/missing.eml")
    with pytest.raises(email_engine.NotAnEmailError):
        call("notes.txt")
    assert (raw_dir / "notes.txt").exists()


@pytest.mark.parametrize("path", ["../outside.eml", "../raw_old/secret.eml", "/etc/passwd"])
def test_paths_outside_the_raw_folder_are_refused(tmp_path, raw_dir, path):
    # A sibling folder whose name starts with "raw" used to pass the check:
    # it was a string-prefix test ("/x/raw_old/..".startswith("/x/raw")).
    (tmp_path / "raw_old").mkdir()
    (tmp_path / "raw_old" / "secret.eml").write_text("Subject: secret\n\nnope")
    (tmp_path / "outside.eml").write_text("Subject: out\n\nnope")
    with pytest.raises(email_engine.NotAnEmailError, match="Invalid raw file path"):
        email_engine.get_email_detail(path, raw_dir=raw_dir)
    with pytest.raises(email_engine.NotAnEmailError):
        email_engine.delete_email(path, raw_dir=raw_dir)
    assert (tmp_path / "raw_old" / "secret.eml").exists()


def test_unparseable_emails_are_skipped_in_the_listing(raw_dir, monkeypatch):
    (raw_dir / "good.eml").write_text("Subject: ok\nFrom: a@x\n\nhi")
    (raw_dir / "bad.eml").write_text("Subject: bad\n\nhi")
    real_parse = email_engine.parse_eml

    def flaky(path):
        if path.name == "bad.eml":
            raise ValueError("broken MIME")
        return real_parse(path)

    monkeypatch.setattr(email_engine, "parse_eml", flaky)
    listing = email_engine.list_emails(raw_dir=raw_dir)
    assert [e["path"] for e in listing["emails"]] == ["good.eml"]
