from __future__ import annotations

from fastapi.testclient import TestClient

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
