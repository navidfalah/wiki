from connectors.gmail import GmailConnector, build_config


class FakeHttpGet:
    def __init__(self, responses):
        self.responses = responses
        self.calls = []

    def __call__(self, url, headers, params):
        self.calls.append((url, headers, params))
        return self.responses.pop(0)


def _connector(http_get):
    config = build_config("cid", "csecret", "https://app.example.com/callback")
    return GmailConnector(config, access_token="tok123", http_get=http_get)


def test_list_items_returns_subjects_and_snippets():
    http_get = FakeHttpGet(
        [
            {"messages": [{"id": "m1"}, {"id": "m2"}]},
            {
                "id": "m1",
                "threadId": "t1",
                "snippet": "hello there",
                "payload": {"headers": [{"name": "Subject", "value": "Hi"}]},
            },
            {
                "id": "m2",
                "threadId": "t2",
                "snippet": "second message",
                "payload": {"headers": [{"name": "Subject", "value": "Re: Hi"}]},
            },
        ]
    )
    connector = _connector(http_get)
    items = connector.list_items(query="hello", limit=2)
    assert [i.title for i in items] == ["Hi", "Re: Hi"]
    assert items[0].snippet == "hello there"
    assert items[0].metadata["threadId"] == "t1"
    assert "Authorization" in http_get.calls[0][1]


def test_list_items_passes_query_param():
    http_get = FakeHttpGet([{"messages": []}])
    connector = _connector(http_get)
    connector.list_items(query="from:boss", limit=5)
    assert http_get.calls[0][2] == {"maxResults": 5, "q": "from:boss"}


def test_fetch_item_decodes_plain_text_body():
    import base64

    body = base64.urlsafe_b64encode(b"hello world").decode("ascii").rstrip("=")
    http_get = FakeHttpGet([{"payload": {"mimeType": "text/plain", "body": {"data": body}}}])
    connector = _connector(http_get)
    text = connector.fetch_item("m1")
    assert text == "hello world"


def test_fetch_item_recurses_into_multipart():
    import base64

    body = base64.urlsafe_b64encode(b"nested body").decode("ascii").rstrip("=")
    http_get = FakeHttpGet(
        [
            {
                "payload": {
                    "mimeType": "multipart/alternative",
                    "parts": [
                        {"mimeType": "text/html", "body": {}},
                        {"mimeType": "text/plain", "body": {"data": body}},
                    ],
                }
            }
        ]
    )
    connector = _connector(http_get)
    assert connector.fetch_item("m1") == "nested body"
