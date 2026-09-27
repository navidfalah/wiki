from qa_benchmark_eval import RAW_DIR, facts_found, load_benchmark, normalize, read_source_text

QUESTIONS = load_benchmark()


def test_benchmark_has_unique_ids_and_enough_questions():
    ids = [q.id for q in QUESTIONS]
    assert len(ids) == len(set(ids))
    assert len(QUESTIONS) >= 50


def test_every_question_is_well_formed():
    for q in QUESTIONS:
        assert q.question.endswith("?"), q.id
        assert q.answer and q.keywords, q.id
        assert q.facts and all(alternatives for alternatives in q.facts), q.id
        assert q.category in {"fact", "contradiction", "multi_source"}, q.id


def test_every_source_exists():
    missing = [(q.id, s) for q in QUESTIONS for s in q.sources if not (RAW_DIR / s).is_file()]
    assert missing == []


def test_every_fact_is_grounded_in_one_of_its_sources():
    # The gold answer must come from the corpus, not from the author's head.
    ungrounded = [
        (q.id, fact)
        for q in QUESTIONS
        for fact in q.facts
        if not any(facts_found([fact], read_source_text(s)) for s in q.sources)
    ]
    assert ungrounded == []


def test_normalize_folds_case_dashes_micro_sign_and_markdown():
    assert normalize("**6–9 Months**  at 4.2 µA") == "6-9 months at 4.2 ua"


def test_facts_found_counts_each_fact_once_with_any_alternative():
    facts = [["cr2032", "2032 cell"], ["15 min"], ["missing"]]
    assert facts_found(facts, "Uses a CR2032; reads every 15 minutes.") == 2
