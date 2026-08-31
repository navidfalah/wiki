from connectors.google_drive import DriveConnector, build_config


class FakeHttpGet:
    def __init__(self, responses):
        self.responses = responses
        self.calls = []

    def __call__(self, url, headers, params):
        self.calls.append((url, headers, params))
        return self.responses.pop(0)


def _connector(http_get):
    config = build_config("cid", "csecret", "https://app.example.com/callback")
    return DriveConnector(config, access_token="tok123", http_get=http_get)


def test_list_items_maps_files():
    http_get = FakeHttpGet(
        [
            {
                "files": [
                    {"id": "f1", "name": "Notes.txt", "mimeType": "text/plain", "webViewLink": "https://drive/f1"},
                ]
            }
        ]
    )
    connector = _connector(http_get)
    items = connector.list_items()
    assert items[0].id == "f1"
    assert items[0].title == "Notes.txt"
    assert items[0].source_url == "https://drive/f1"
    assert items[0].metadata["mimeType"] == "text/plain"


def test_list_items_builds_query_with_escaping():
    http_get = FakeHttpGet([{"files": []}])
    connector = _connector(http_get)
    connector.list_items(query="it's a test")
    query_param = http_get.calls[0][2]["q"]
    assert "trashed = false" in query_param
    assert "\\'" in query_param


def test_fetch_item_returns_exported_text():
    http_get = FakeHttpGet([{"text": "file contents here"}])
    connector = _connector(http_get)
    assert connector.fetch_item("f1") == "file contents here"
