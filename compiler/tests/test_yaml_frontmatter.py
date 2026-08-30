from yaml_frontmatter import (
    insert_generated_banner,
    strip_generated_banner,
    yaml_quote,
)


def test_plain_word_is_not_quoted():
    assert yaml_quote("MeshSync") == "MeshSync"


def test_empty_string_is_quoted():
    assert yaml_quote("") == '""'


def test_string_with_colon_is_quoted():
    assert yaml_quote("Battery: Life") == '"Battery: Life"'


def test_string_starting_with_special_char_is_quoted():
    assert yaml_quote("- leading dash").startswith('"')
    assert yaml_quote("#hashtag").startswith('"')


def test_boolish_string_is_quoted():
    assert yaml_quote("true") == '"true"'
    assert yaml_quote("no") == '"no"'


def test_numeric_looking_string_is_quoted():
    assert yaml_quote("42") == '"42"'
    assert yaml_quote("3.14") == '"3.14"'


def test_leading_or_trailing_whitespace_is_quoted():
    assert yaml_quote(" padded ") == '" padded "'


def test_insert_generated_banner_after_frontmatter():
    content = "---\nid: foo\ntitle: Foo\n---\n\n# Foo\n\nBody.\n"
    result = insert_generated_banner(content, "<!-- NOTE -->")
    assert result.startswith("---\nid: foo\ntitle: Foo\n---\n\n<!-- NOTE -->\n\n# Foo")


def test_insert_generated_banner_no_frontmatter():
    content = "# Foo\n\nBody.\n"
    result = insert_generated_banner(content, "<!-- NOTE -->")
    assert result == "<!-- NOTE -->\n\n# Foo\n\nBody.\n"


def test_strip_generated_banner_round_trip():
    body = "<!-- AUTO-GENERATED DRAFT — do not edit. -->\n\n# Foo\n\nBody.\n"
    stripped = strip_generated_banner(body)
    assert stripped == "# Foo\n\nBody.\n"
    assert "<!--" not in stripped


def test_strip_generated_banner_ignores_unrelated_comment():
    body = "<!-- some other comment -->\n\n# Foo\n"
    assert strip_generated_banner(body) == body


def test_strip_generated_banner_noop_when_absent():
    body = "# Foo\n\nBody.\n"
    assert strip_generated_banner(body) == body
