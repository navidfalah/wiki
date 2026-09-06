"""ResponseCache must survive a corrupted sqlite file rather than taking the
whole pipeline run down -- this is what showed up as "database disk image is
malformed" surfacing at the Synthesis step (whichever step happened to touch
the cache first after a build was killed mid-write). The cache is disposable:
get()/set() should quarantine the bad file and keep working on a fresh one."""

from llm_client import ResponseCache


def _corrupt(path):
    path.write_bytes(b"not a sqlite file at all, just garbage bytes")


def test_get_recovers_from_corrupted_file(tmp_path):
    db_path = tmp_path / "cache.sqlite"
    _corrupt(db_path)

    cache = ResponseCache(db_path)
    assert cache.get("some-key") is None

    quarantined = list(tmp_path.glob("cache.sqlite.corrupt-*"))
    assert len(quarantined) == 1


def test_set_recovers_from_corrupted_file_and_write_still_lands(tmp_path):
    db_path = tmp_path / "cache.sqlite"
    _corrupt(db_path)

    cache = ResponseCache(db_path)
    cache.set("key-1", system_prompt="sys", prompt="p", model="m", response="hello")

    assert cache.get("key-1") == "hello"
    assert len(list(tmp_path.glob("cache.sqlite.corrupt-*"))) == 1


def test_init_recovers_from_corrupted_file(tmp_path):
    db_path = tmp_path / "cache.sqlite"
    _corrupt(db_path)

    ResponseCache(db_path)  # must not raise

    assert len(list(tmp_path.glob("cache.sqlite.corrupt-*"))) == 1


def test_normal_cache_roundtrip_is_unaffected(tmp_path):
    cache = ResponseCache(tmp_path / "cache.sqlite")
    cache.set("k", system_prompt="s", prompt="p", model="m", response="r")
    assert cache.get("k") == "r"
    assert cache.get("missing") is None
