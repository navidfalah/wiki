import trust_eval_dataset as ted


def test_real_dataset_loads_and_is_fully_valid():
    """The actual data/trust_eval_dataset.json — schema-valid and every
    quote grounded verbatim in its cited data/raw/ source file."""
    dataset = ted.load_trust_eval_dataset()
    problems = ted.validate_dataset(dataset)
    assert problems == []
    assert len(dataset.claim_groups) >= 5
    assert len(dataset.all_claims()) >= 20


def test_real_dataset_covers_all_gold_labels_and_relation_types():
    dataset = ted.load_trust_eval_dataset()
    stats = ted.summary_stats(dataset)
    assert set(stats["claims_by_gold_label"]) <= ted.GOLD_LABELS
    assert set(stats["relations_by_type"]) <= ted.RELATION_TYPES
    # The dataset is only useful for evaluating propagation if it actually
    # contains disagreement, not just corroboration.
    assert stats["relations_by_type"].get("contradicts", 0) > 0
    assert stats["relations_by_type"].get("corroborates", 0) > 0


def test_validate_flags_unknown_gold_label(tmp_path):
    raw_dir = tmp_path / "raw"
    raw_dir.mkdir()
    (raw_dir / "note.txt").write_text("The sky is blue.", encoding="utf-8")

    dataset = ted.TrustEvalDataset(
        version=1,
        description="test",
        claim_groups=[
            ted.ClaimGroup(
                id="g1",
                domain="test",
                subject="test",
                description="test",
                claims=[
                    ted.Claim(
                        id="c1",
                        source_path="note.txt",
                        source_type="text",
                        date="2026-01-01",
                        value="blue",
                        quote="The sky is blue.",
                        gold_label="not_a_real_label",
                    )
                ],
            )
        ],
    )

    problems = ted.validate_dataset(dataset, raw_dir=raw_dir)
    assert any("unknown gold_label" in p for p in problems)


def test_validate_flags_ungrounded_quote(tmp_path):
    raw_dir = tmp_path / "raw"
    raw_dir.mkdir()
    (raw_dir / "note.txt").write_text("The sky is blue.", encoding="utf-8")

    dataset = ted.TrustEvalDataset(
        version=1,
        description="test",
        claim_groups=[
            ted.ClaimGroup(
                id="g1",
                domain="test",
                subject="test",
                description="test",
                claims=[
                    ted.Claim(
                        id="c1",
                        source_path="note.txt",
                        source_type="text",
                        date="2026-01-01",
                        value="green",
                        quote="The sky is green.",
                        gold_label="correct",
                    )
                ],
            )
        ],
    )

    problems = ted.validate_dataset(dataset, raw_dir=raw_dir)
    assert any("quote not found verbatim" in p for p in problems)


def test_validate_flags_relation_pointing_outside_its_group(tmp_path):
    raw_dir = tmp_path / "raw"
    raw_dir.mkdir()
    (raw_dir / "note.txt").write_text("The sky is blue.", encoding="utf-8")

    dataset = ted.TrustEvalDataset(
        version=1,
        description="test",
        claim_groups=[
            ted.ClaimGroup(
                id="g1",
                domain="test",
                subject="test",
                description="test",
                claims=[
                    ted.Claim(
                        id="c1",
                        source_path="note.txt",
                        source_type="text",
                        date="2026-01-01",
                        value="blue",
                        quote="The sky is blue.",
                        gold_label="correct",
                    )
                ],
                relations=[ted.Relation(from_id="c1", to_id="does-not-exist", type="corroborates")],
            )
        ],
    )

    problems = ted.validate_dataset(dataset, raw_dir=raw_dir)
    assert any("relation 'to' id not in group" in p for p in problems)


def test_quote_is_grounded_handles_bold_markers_and_gap_marker():
    file_text = "Default: every 15 minutes when mesh is active.\n\n> Note: kickoff notes mentioned hourly default."
    quote_with_bold = "Default: every 15 minutes when mesh is active."
    assert ted._quote_is_grounded(f"**{quote_with_bold}**", file_text)

    composite_quote = "Default: every 15 minutes when mesh is active. [...] Note: kickoff notes mentioned hourly default."
    assert ted._quote_is_grounded(composite_quote, file_text)

    assert not ted._quote_is_grounded("Something not in the file.", file_text)


def test_summary_stats_shape():
    dataset = ted.load_trust_eval_dataset()
    stats = ted.summary_stats(dataset)
    assert stats["total_claims"] == sum(stats["claims_per_group"].values())
    assert stats["claim_groups"] == len(stats["claims_per_group"])
