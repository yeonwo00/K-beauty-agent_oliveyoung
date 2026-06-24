from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Protocol

from .models import Recommendation


class LLMClient(Protocol):
    def complete(self, system: str, user: str) -> str:
        ...


@dataclass
class HybridExplainer:
    """Optional LLM explainer that must stay inside rule-generated evidence."""

    client: LLMClient | None = None

    def explain(self, recommendation: Recommendation, language: str = "en") -> str:
        if self.client is None:
            return recommendation.to_text()

        grounded_context = recommendation.to_text()
        output_language = "Korean" if language.lower().startswith("ko") else "English"
        system = (
            "You are a neutral K-beauty shopping assistant for foreign consumers. "
            "Use only the provided recommendation context. Do not invent products, "
            "reviews, ingredient benefits, rankings, awards, clinical claims, or brand claims. "
            "If evidence is insufficient, say so and ask a follow-up question. "
            "Keep the explanation non-promotional and disclose cautions. "
            f"Write the final answer in {output_language}."
        )
        user = (
            "Rewrite the following grounded recommendation in a clear, concise, explainable way. "
            "Preserve cautions and missing-data notes.\n\n"
            f"{grounded_context}"
        )
        return self.client.complete(system=system, user=user)


@dataclass
class ProductReasonExplainer:
    """LLM helper for user-facing product reasons, constrained to rule evidence."""

    client: LLMClient | None = None

    def explain_reasons(self, recommendation: Recommendation, language: str = "en") -> dict[str, str]:
        if self.client is None or not recommendation.results:
            return {}

        output_language = "Korean" if language.lower().startswith("ko") else "English"
        payload = {
            "query": recommendation.query,
            "profile": {
                "skin_type": recommendation.profile.skin_type,
                "concerns": recommendation.profile.concerns,
                "desired_categories": recommendation.profile.desired_categories,
                "preferred_ingredients": recommendation.profile.preferred_ingredients,
                "avoid_ingredients": recommendation.profile.avoid_ingredients,
                "max_price_krw": recommendation.profile.max_price_krw,
                "min_price_krw": recommendation.profile.min_price_krw,
                "texture_preference": recommendation.profile.texture_preference,
            },
            "products": [
                {
                    "id": item.product.id,
                    "name": item.product.name,
                    "brand": item.product.brand,
                    "category": item.product.category,
                    "price_krw": item.product.oliveyoung_price_krw,
                    "suited_skin_types": item.product.suited_skin_types,
                    "concerns": item.product.concerns,
                    "matched_ingredients": item.matched_ingredients,
                    "rule_reasons": item.reasons[:5],
                    "cautions": item.cautions[:3],
                    "missing_data": item.missing_data[:3],
                }
                for item in recommendation.results
            ],
        }
        system = (
            "You write concise K-beauty recommendation rationales. "
            "Use only the provided JSON evidence. Do not add new claims, reviews, awards, rankings, or clinical promises. "
            "Connect the user's conditions to each product's category, price, skin fit, matched ingredients, and cautions. "
            f"Write in {output_language}. Return JSON only as an object mapping product id to one short paragraph."
        )
        user = json.dumps(payload, ensure_ascii=False)
        data = _json_from_text(self.client.complete(system=system, user=user))
        if not isinstance(data, dict):
            return {}
        allowed_ids = {item.product.id for item in recommendation.results}
        return {
            product_id: _clean_reason(reason)
            for product_id, reason in data.items()
            if product_id in allowed_ids and _clean_reason(reason)
        }


def _json_from_text(text: str):
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    match = re.search(r"\{.*\}", cleaned, flags=re.S)
    if match:
        cleaned = match.group(0)
    return json.loads(cleaned)


def _clean_reason(value) -> str:
    if not isinstance(value, str):
        return ""
    text = re.sub(r"\s+", " ", value).strip()
    return text[:420]
