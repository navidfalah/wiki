from mdx_sanitize import sanitize_for_mdx


def test_escapes_angle_brackets_outside_code():
    assert sanitize_for_mdx("value < 5 and > 2") == "value &lt; 5 and &gt; 2"


def test_escapes_braces_outside_code():
    assert sanitize_for_mdx("use {curly} braces") == "use &#123;curly&#125; braces"


def test_preserves_inline_code_spans():
    text = "run `a < b` please"
    assert "`a < b`" in sanitize_for_mdx(text)


def test_preserves_fenced_code_blocks():
    text = "```\nif (a < b) { return; }\n```"
    assert sanitize_for_mdx(text) == text


def test_preserves_markdown_links():
    text = "see [MeshSync](./meshsync.md) for details"
    assert sanitize_for_mdx(text) == text


def test_escapes_email_like_angle_brackets():
    result = sanitize_for_mdx("contact <me@example.com> now")
    assert "&lt;me@example.com&gt;" in result
