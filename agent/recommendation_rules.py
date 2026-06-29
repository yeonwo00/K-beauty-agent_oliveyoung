from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from app.schemas import RecommendationRequest, ScoreBreakdown


@dataclass(frozen=True)
class Product:
    id: str
    name: str
    brand: str
    category: str
    ingredients: list[str]
    suited_skin_types: list[str]
    concerns: list[str]
    tags: list[str]
    avoid_for: list[str]


@dataclass
class ScoredProduct:
    product: Product
    score: float
    why: list[str]
    cautions: list[str]
    score_breakdown: ScoreBreakdown


ALIASES = {
    "지성": "oily",
    "건성": "dry",
    "민감성": "sensitive",
    "복합성": "combination",
    "유분": "oil_control",
    "피지": "oil_control",
    "모공": "pores",
    "트러블": "acne",
    "여드름": "acne",
    "수분": "hydration",
    "보습": "hydration",
    "장벽": "barrier_support",
    "진정": "redness",
    "산뜻": "lightweight",
    "무향": "fragrance-free",
    "향료": "fragrance",
}


def normalize(value: str) -> str:
    lowered = value.strip().lower().replace("_", "-")
    return ALIASES.get(lowered, lowered).replace("-", "_")


def load_products(path: Path) -> list[Product]:
    raw_products = json.loads(path.read_text(encoding="utf-8"))
    return [
        Product(
            id=item["id"],
            name=item["name"],
            brand=item["brand"],
            category=item["category"],
            ingredients=item["ingredients"],
            suited_skin_types=item["suited_skin_types"],
            concerns=item["concerns"],
            tags=item["tags"],
            avoid_for=item.get("avoid_for", []),
        )
        for item in raw_products
    ]


class RuleBasedRecommender:
    def __init__(self, products: list[Product]):
        self.products = products

    def recommend(self, request: RecommendationRequest) -> tuple[list[ScoredProduct], list[str]]:
        normalized_skin_type = normalize(request.skin_type or "")
        concerns = {normalize(value) for value in request.concerns}
        preferences = {normalize(value) for value in request.preferences}
        avoid_ingredients = {normalize(value) for value in request.avoid_ingredients}

        trace = [
            f"skin_type={normalized_skin_type or 'not_provided'}",
            f"concerns={sorted(concerns)}",
            f"preferences={sorted(preferences)}",
            f"avoid_ingredients={sorted(avoid_ingredients)}",
        ]

        scored = [
            self._score_product(product, normalized_skin_type, concerns, preferences, avoid_ingredients)
            for product in self.products
        ]
        ranked = sorted(scored, key=lambda item: item.score, reverse=True)
        return [item for item in ranked if item.score > 0][: request.limit], trace

    def _score_product(
        self,
        product: Product,
        skin_type: str,
        concerns: set[str],
        preferences: set[str],
        avoid_ingredients: set[str],
    ) -> ScoredProduct:
        why: list[str] = []
        cautions: list[str] = []
        skin_score = 0.0
        concern_score = 0.0
        preference_score = 0.0
        safety_score = 0.0

        product_skin_types = {normalize(value) for value in product.suited_skin_types}
        product_concerns = {normalize(value) for value in product.concerns}
        product_tags = {normalize(value) for value in product.tags}
        product_ingredients = {normalize(value) for value in product.ingredients}
        avoid_for = {normalize(value) for value in product.avoid_for}

        if skin_type and skin_type in product_skin_types:
            skin_score += 2.0
            why.append(f"Matches {skin_type} skin type.")
        elif skin_type and skin_type in avoid_for:
            skin_score -= 2.0
            cautions.append(f"Marked as less suitable for {skin_type} skin.")

        matched_concerns = sorted(concerns & product_concerns)
        if matched_concerns:
            concern_score += 1.5 * len(matched_concerns)
            why.append(f"Targets concern(s): {', '.join(matched_concerns)}.")

        matched_preferences = sorted(preferences & (product_tags | product_ingredients))
        if matched_preferences:
            preference_score += 1.0 * len(matched_preferences)
            why.append(f"Matches preference(s): {', '.join(matched_preferences)}.")

        blocked = sorted(avoid_ingredients & product_ingredients)
        if blocked:
            safety_score -= 10.0
            cautions.append(f"Excluded by avoided ingredient(s): {', '.join(blocked)}.")
        elif "fragrance_free" in product_tags:
            safety_score += 0.5
            why.append("Supports a fragrance-free routine.")

        score = skin_score + concern_score + preference_score + safety_score
        return ScoredProduct(
            product=product,
            score=round(score, 2),
            why=why or ["General match from the sample K-beauty product dataset."],
            cautions=cautions,
            score_breakdown=ScoreBreakdown(
                skin_type=skin_score,
                concerns=concern_score,
                preferences=preference_score,
                safety=safety_score,
            ),
        )
