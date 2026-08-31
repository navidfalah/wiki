import pytest

from connectors.base import Connector, ConnectorItem


def test_connector_item_defaults():
    item = ConnectorItem(id="1", title="t", snippet="s")
    assert item.source_url == ""
    assert item.metadata == {}


def test_connector_is_abstract():
    with pytest.raises(TypeError):
        Connector()


def test_connector_subclass_must_implement_both_methods():
    class Incomplete(Connector):
        def list_items(self, query="", limit=20):
            return []

    with pytest.raises(TypeError):
        Incomplete()
