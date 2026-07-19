from __future__ import annotations

from k_beauty_agent.config import cors_allow_origins, public_llm_enabled


def test_public_llm_is_disabled_by_default_in_production(monkeypatch) -> None:
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.delenv("PUBLIC_LLM_ENABLED", raising=False)

    assert public_llm_enabled() is False


def test_public_llm_can_be_explicitly_enabled(monkeypatch) -> None:
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("PUBLIC_LLM_ENABLED", "true")

    assert public_llm_enabled() is True


def test_default_cors_origins_cover_both_github_accounts(monkeypatch) -> None:
    monkeypatch.delenv("CORS_ALLOW_ORIGINS", raising=False)

    assert cors_allow_origins() == [
        "https://yeonwo00.github.io",
        "https://201younghanlee.github.io",
    ]
