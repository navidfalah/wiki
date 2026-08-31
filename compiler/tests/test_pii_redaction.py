from pii_redaction import DEFAULT_POLICY, STRICT_POLICY, RedactionPolicy, redact_text
from synthesizer import RawChunk, extract_chunk_topics


def test_default_policy_redacts_ssn():
    result = redact_text("SSN on file: 123-45-6789.", DEFAULT_POLICY)
    assert "123-45-6789" not in result.text
    assert "[SSN_1]" in result.text
    assert result.findings[0].category == "ssn"


def test_default_policy_redacts_credit_card_with_valid_luhn():
    result = redact_text("Card: 4111 1111 1111 1111 on file.", DEFAULT_POLICY)
    assert "4111" not in result.text
    assert "[CREDIT_CARD_1]" in result.text


def test_default_policy_does_not_flag_a_luhn_invalid_number_as_credit_card():
    # 16 digits, but fails the Luhn check — should not be flagged as a card.
    result = redact_text("Reference number: 1234 5678 9012 3456 for this ticket.", DEFAULT_POLICY)
    assert not any(f.category == "credit_card" for f in result.findings)


def test_default_policy_redacts_phone_number():
    result = redact_text("Call 555-123-4567 for support.", DEFAULT_POLICY)
    assert "555-123-4567" not in result.text
    assert "[PHONE_NUMBER_1]" in result.text


def test_default_policy_redacts_prefixed_api_key():
    result = redact_text("Key: sk-abcdef1234567890abcdef1234567890 goes in .env.", DEFAULT_POLICY)
    assert "sk-abcdef" not in result.text
    assert "[API_KEY_1]" in result.text


def test_default_policy_redacts_ipv4_address():
    result = redact_text("Broker unreachable at 192.168.1.100.", DEFAULT_POLICY)
    assert "192.168.1.100" not in result.text
    assert "[IPV4_ADDRESS_1]" in result.text


def test_default_policy_leaves_email_addresses_untouched():
    """The documented design tension: emails matter to the email-knowledge
    engine and entity resolution (task #6), so the default policy leaves
    them alone."""
    result = redact_text("Contact mira.chen@auroralabs.example for details.", DEFAULT_POLICY)
    assert "mira.chen@auroralabs.example" in result.text
    assert not result.findings


def test_default_policy_leaves_person_names_untouched():
    result = redact_text("Mira Chen filed MESH-118 after the field report.", DEFAULT_POLICY)
    assert "Mira Chen" in result.text


def test_strict_policy_redacts_email_addresses():
    result = redact_text("Contact mira.chen@auroralabs.example for details.", STRICT_POLICY)
    assert "mira.chen@auroralabs.example" not in result.text
    assert "[EMAIL_1]" in result.text


def test_redact_text_is_a_no_op_on_pii_free_text():
    text = "Rejoin storm mitigation triggers when the mesh exceeds 6 nodes."
    result = redact_text(text, STRICT_POLICY)
    assert result.text == text
    assert not result.had_findings


def test_repeated_value_gets_the_same_placeholder():
    text = "Reach Jonah at jonah.park@auroralabs.example. CC jonah.park@auroralabs.example on the follow-up."
    result = redact_text(text, STRICT_POLICY)
    assert result.text.count("[EMAIL_1]") == 2
    assert "jonah.park@auroralabs.example" not in result.text


def test_different_values_of_the_same_category_get_different_placeholders():
    text = "Mira: mira.chen@auroralabs.example. Jonah: jonah.park@auroralabs.example."
    result = redact_text(text, STRICT_POLICY)
    assert "[EMAIL_1]" in result.text
    assert "[EMAIL_2]" in result.text


def test_custom_policy_with_only_one_category():
    policy = RedactionPolicy(categories=frozenset({"ssn"}))
    text = "SSN 123-45-6789, phone 555-123-4567."
    result = redact_text(text, policy)
    assert "123-45-6789" not in result.text
    assert "555-123-4567" in result.text  # phone_number not in this policy's categories


def test_redaction_result_findings_preserve_original_value_for_audit():
    result = redact_text("SSN 123-45-6789 on file.", DEFAULT_POLICY)
    assert result.findings[0].original == "123-45-6789"


class FakeExtractionLLM:
    available = True

    def __init__(self):
        self.calls: list[tuple[str, str]] = []

    def generate_response(self, prompt: str, system_prompt: str) -> str:
        self.calls.append((prompt, system_prompt))
        return '{"topics": ["MeshSync"], "entities": [], "concepts": []}'


def test_extract_chunk_topics_redacts_pii_from_the_prompt_when_enabled():
    llm = FakeExtractionLLM()
    chunk = RawChunk(
        source_path="notes/x.md",
        chunk_index=0,
        text="Field report SSN on file: 123-45-6789. Call 555-123-4567.",
        source_type="text",
    )
    extract_chunk_topics(chunk, llm, redact_pii=True)
    prompt, _system_prompt = llm.calls[0]
    assert "123-45-6789" not in prompt
    assert "555-123-4567" not in prompt
    assert "[SSN_1]" in prompt


def test_extract_chunk_topics_stores_the_unredacted_text_regardless():
    """redact_pii only affects what's sent to the LLM — the ChunkExtraction
    persisted locally (for dashboard browsing, state.json, etc.) keeps the
    original text."""
    llm = FakeExtractionLLM()
    chunk = RawChunk(source_path="notes/x.md", chunk_index=0, text="SSN on file: 123-45-6789.", source_type="text")
    extraction = extract_chunk_topics(chunk, llm, redact_pii=True)
    assert extraction.text == "SSN on file: 123-45-6789."


def test_extract_chunk_topics_without_redact_pii_sends_the_original_text():
    llm = FakeExtractionLLM()
    chunk = RawChunk(source_path="notes/x.md", chunk_index=0, text="SSN on file: 123-45-6789.", source_type="text")
    extract_chunk_topics(chunk, llm, redact_pii=False)
    prompt, _system_prompt = llm.calls[0]
    assert "123-45-6789" in prompt
