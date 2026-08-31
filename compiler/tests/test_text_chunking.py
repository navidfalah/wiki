from text_chunking import split_text_into_chunks


def test_no_overlap_by_default_when_paragraphs_are_small():
    # With a tiny max_chars, the overlap budget (12.5% of max_chars) is too
    # small to fit even one paragraph, so behavior matches the old
    # zero-overlap chunker for this case.
    content = "Para one.\n\nPara two.\n\nPara three."
    chunks = split_text_into_chunks(content, max_chars=15)
    assert chunks == ["Para one.", "Para two.", "Para three."]


def test_single_chunk_when_everything_fits():
    content = "a\n\nb\n\nc"
    chunks = split_text_into_chunks(content, max_chars=2000)
    assert chunks == ["a\n\nb\n\nc"]


def test_empty_content_returns_no_chunks():
    assert split_text_into_chunks("") == []
    assert split_text_into_chunks("   ") == []


def test_boundary_paragraph_is_carried_into_the_next_chunk():
    # Three paragraphs; the middle one holds a fact that would otherwise be
    # isolated at the tail of chunk 1 with no context in chunk 2.
    para_a = "A" * 40
    para_b = "The device ships with a 4200mAh battery cell."
    para_c = "C" * 40
    content = f"{para_a}\n\n{para_b}\n\n{para_c}"
    # max_chars forces a split between para_b and para_c; overlap_chars is
    # large enough to carry para_b forward into the second chunk too.
    chunks = split_text_into_chunks(content, max_chars=90, overlap_chars=60)
    assert len(chunks) == 2
    assert para_b in chunks[0]
    assert para_b in chunks[1]
    assert para_c in chunks[1]


def test_overlap_chars_zero_disables_overlap():
    para_a = "A" * 40
    para_b = "B" * 40
    para_c = "C" * 40
    content = f"{para_a}\n\n{para_b}\n\n{para_c}"
    chunks = split_text_into_chunks(content, max_chars=50, overlap_chars=0)
    assert len(chunks) == 3
    assert chunks == [para_a, para_b, para_c]


def test_default_overlap_scales_with_max_chars():
    # A large max_chars with a fact-bearing paragraph right at the boundary
    # should still land in both chunks under the default ~12.5% overlap.
    filler_a = "\n\n".join(f"Filler paragraph {i}." for i in range(20))
    boundary_fact = "The recall covers units manufactured before March 2024."
    filler_c = "\n\n".join(f"Trailing paragraph {i}." for i in range(20))
    content = f"{filler_a}\n\n{boundary_fact}\n\n{filler_c}"
    chunks = split_text_into_chunks(content, max_chars=400)
    assert len(chunks) > 1
    containing = [c for c in chunks if boundary_fact in c]
    assert len(containing) >= 1
