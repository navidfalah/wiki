"""Command line responsibilities for the compiler build."""
from __future__ import annotations

import argparse
import os

import web_search

from .runner import run_pipeline


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Run the full LLM Wiki compiler pipeline"
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Reprocess all raw files regardless of MD5 hashes in state.json",
    )
    parser.add_argument(
        "--critic-pass",
        action="store_true",
        default=os.getenv("WIKI_CRITIC_PASS", "").lower() in {"1", "true", "yes"},
        help=(
            "Run a second LLM pass (extraction_critic.py) over each synthesized page, "
            "stripping sentences it can't ground in the source chunks. Roughly doubles "
            "per-page LLM cost. Also enabled by setting WIKI_CRITIC_PASS=true."
        ),
    )
    parser.add_argument(
        "--critic-samples",
        type=int,
        default=int(os.getenv("WIKI_CRITIC_SAMPLES", "1")),
        help=(
            "Run the critic pass this many times per page and only strip a sentence a "
            "majority of passes flagged (self-consistency; reduces judge flakiness). "
            "Only meaningful with --critic-pass. 1 (default) = single deterministic pass, "
            "matching prior behavior. Also settable via WIKI_CRITIC_SAMPLES."
        ),
    )
    parser.add_argument(
        "--critic-regenerate",
        action="store_true",
        default=os.getenv("WIKI_CRITIC_REGENERATE", "").lower() in {"1", "true", "yes"},
        help=(
            "When the critic strips more than 20%% of a page's length, regenerate it once "
            "with the critic's findings fed back into the prompt, instead of shipping a "
            "heavily-stripped draft. Only meaningful with --critic-pass; adds up to one "
            "extra LLM call per affected page. Also settable via WIKI_CRITIC_REGENERATE."
        ),
    )
    parser.add_argument(
        "--use-corrections",
        action="store_true",
        default=os.getenv("WIKI_USE_CORRECTIONS", "").lower() in {"1", "true", "yes"},
        help=(
            "Feed human review corrections (data/review_corrections.json, see "
            "active_learning.py) into the extraction prompt as few-shot examples. "
            "Also enabled by setting WIKI_USE_CORRECTIONS=true."
        ),
    )
    parser.add_argument(
        "--redact-pii",
        action=argparse.BooleanOptionalAction,
        default=os.getenv("WIKI_REDACT_PII", "true").lower() not in {"0", "false", "no"},
        help=(
            "Redact SSNs, credit cards, API keys, phone numbers, and IPv4 addresses "
            "(pii_redaction.py's default policy — NOT email addresses or names, see "
            "its module docstring) from chunk text before it's sent to the LLM for "
            "extraction. On by default (these categories are unambiguously safe to "
            "strip and never conflict with entity resolution); use --no-redact-pii or "
            "WIKI_REDACT_PII=false to send chunk text unredacted."
        ),
    )
    parser.add_argument(
        "--exclude-folders",
        type=str,
        default="",
        help=(
            "Comma-separated top-level data/raw/ folder names to leave out of this run "
            "entirely (e.g. --exclude-folders=emails,samples). Excluded files are treated "
            "as out of scope, not deleted -- their topics aren't pruned, and they're "
            "picked back up on a later run without needing --force."
        ),
    )
    parser.add_argument(
        "--web-search",
        action="store_true",
        default=os.getenv("WIKI_WEB_SEARCH_ENABLED", "").lower() in {"1", "true", "yes"},
        help=(
            "Enrich synthesis (step 3) with live internet search results for the topics "
            "being (re)generated this run, one search per topic -- a source alongside "
            "data/raw/, tagged source_type=web and trusted at the 'low' default level "
            "(see trust.py, web_search.py). Off by default, so a compile stays fully "
            "offline/deterministic unless explicitly turned on for this run. Requires "
            "outbound network access from the compiler process. Also enabled by setting "
            "WIKI_WEB_SEARCH_ENABLED=true."
        ),
    )
    parser.add_argument(
        "--web-search-provider",
        type=str,
        default=os.getenv("WIKI_WEB_SEARCH_PROVIDER", web_search.DEFAULT_PROVIDER),
        choices=list(web_search.SUPPORTED_PROVIDERS),
        help=(
            "Search provider for --web-search: 'duckduckgo' (default, no API key needed) "
            "or 'serpapi'/'bing' (need WIKI_WEB_SEARCH_API_KEY). Also settable via "
            "WIKI_WEB_SEARCH_PROVIDER."
        ),
    )
    parser.add_argument(
        "--web-search-max-results",
        type=int,
        default=int(os.getenv("WIKI_WEB_SEARCH_MAX_RESULTS", str(web_search.DEFAULT_MAX_RESULTS))),
        help="Max search results fetched per topic when --web-search is on (default 3).",
    )
    parser.add_argument(
        "--web-search-max-topics",
        type=int,
        default=int(os.getenv("WIKI_WEB_SEARCH_MAX_TOPICS", str(web_search.DEFAULT_MAX_TOPICS))),
        help=(
            "Max number of topics enriched with web search in one run, to bound cost and "
            "latency when many topics are dirty at once (default 8)."
        ),
    )
    parser.add_argument(
        "--resolve-entities-llm",
        action="store_true",
        default=os.getenv("WIKI_RESOLVE_ENTITIES_LLM", "").lower() in {"1", "true", "yes"},
        help=argparse.SUPPRESS,
    )
    args = parser.parse_args()
    exclude_prefixes = frozenset(f.strip() for f in args.exclude_folders.split(",") if f.strip())
    raise SystemExit(
        run_pipeline(
            force=args.force,
            apply_critic=args.critic_pass,
            critic_samples=args.critic_samples,
            critic_regenerate=args.critic_regenerate,
            use_corrections=args.use_corrections,
            redact_pii=args.redact_pii,
            exclude_prefixes=exclude_prefixes or None,
            web_search_enabled=args.web_search,
            web_search_max_results=args.web_search_max_results,
            web_search_max_topics=args.web_search_max_topics,
            web_search_provider=args.web_search_provider,
            resolve_entities_llm=args.resolve_entities_llm,
        )
    )
