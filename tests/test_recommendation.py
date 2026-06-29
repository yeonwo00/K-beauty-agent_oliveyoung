from __future__ import annotations

from fastapi.testclient import TestClient

from app.api.routes import recommendation_agent
from app.config import settings
from app.main import app

client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_english_recommendation_returns_products_without_llm_key(monkeypatch) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setattr(settings, "openai_api_key", None)

    response = client.post(
        "/api/recommend",
        json={
            "skin_type": "oily",
            "concerns": ["oil_control", "pores"],
            "preferences": ["lightweight"],
            "language": "en",
        },
    )

    payload = response.json()
    assert response.status_code == 200
    assert payload["recommendations"]
    assert payload["recommendations"][0]["name"] == "Green Tea Oil-Control Gel Cream"
    assert payload["llm_used"] is False
    assert "rule-based" in payload["summary"]
    assert payload["recommendations"][0]["why_recommended"]
    assert payload["recommendations"][0]["review"]["positive"]
    assert payload["recommendations"][0]["review"]["critical"]
    assert payload["recommendations"][0]["review"]["summary"]


def test_korean_aliases_are_normalized() -> None:
    response = client.post(
        "/api/recommend",
        json={
            "skin_type": "지성",
            "concerns": ["유분", "모공"],
            "preferences": ["산뜻"],
            "language": "ko",
        },
    )

    payload = response.json()
    assert response.status_code == 200
    assert payload["recommendations"]
    assert payload["language"] == "ko"
    assert "skin_type=oily" in payload["rule_trace"]
    assert "추천합니다" in payload["summary"]


def test_avoid_ingredient_penalizes_blocked_product() -> None:
    response = client.post(
        "/api/recommend",
        json={
            "skin_type": "oily",
            "concerns": ["acne", "pores"],
            "avoid_ingredients": ["salicylic acid"],
            "language": "en",
            "limit": 5,
        },
    )

    payload = response.json()
    names = [item["name"] for item in payload["recommendations"]]
    assert response.status_code == 200
    assert "BHA Pore Clarifying Liquid" not in names


def test_llm_can_generate_product_specific_why_recommended(monkeypatch) -> None:
    monkeypatch.setattr(settings, "openai_api_key", "test-key")
    monkeypatch.setattr(recommendation_agent, "_try_llm_summary", lambda request, products: None)
    monkeypatch.setattr(
        recommendation_agent,
        "_try_llm_why_recommended",
        lambda request, item: f"AI reason for {item.product.name}",
    )

    response = client.post(
        "/api/recommend",
        json={
            "skin_type": "oily",
            "concerns": ["oil_control"],
            "preferences": ["lightweight"],
            "language": "en",
            "limit": 1,
        },
    )

    payload = response.json()
    assert response.status_code == 200
    assert payload["llm_used"] is True
    assert payload["recommendations"][0]["why_recommended"].startswith("AI reason for")


def test_compare_endpoint_returns_fallback_comparison() -> None:
    response = client.post(
        "/api/compare",
        json={
            "product_ids": ["kb-001", "kb-004"],
            "skin_type": "oily",
            "concerns": ["pores"],
            "preferences": ["lightweight"],
            "language": "en",
        },
    )

    payload = response.json()
    assert response.status_code == 200
    assert len(payload["products"]) == 2
    assert payload["llm_used"] is False
    assert "lowest-priced" in payload["comparison"]
    assert payload["products"][0]["review"]["summary"]


def test_compare_endpoint_can_use_llm(monkeypatch) -> None:
    monkeypatch.setattr(settings, "openai_api_key", "test-key")
    monkeypatch.setattr(
        recommendation_agent,
        "_try_llm_comparison",
        lambda request, products: "AI comparison across ingredients, skin fit, function, and price.",
    )

    response = client.post(
        "/api/compare",
        json={
            "product_ids": ["kb-001", "kb-004"],
            "skin_type": "oily",
            "concerns": ["pores"],
            "language": "en",
        },
    )

    payload = response.json()
    assert response.status_code == 200
    assert payload["llm_used"] is True
    assert payload["comparison"].startswith("AI comparison")
