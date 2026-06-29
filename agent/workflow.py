from __future__ import annotations

from pathlib import Path

from agent.prompt_templates import SUMMARY_SYSTEM_PROMPT, SUMMARY_USER_TEMPLATE
from agent.recommendation_rules import RuleBasedRecommender, load_products
from app.config import settings
from app.schemas import RecommendationRequest, RecommendationResponse, RecommendedProduct


class KBeautyRecommendationAgent:
    def __init__(self, product_data_path: Path):
        self.products = load_products(product_data_path)
        self.recommender = RuleBasedRecommender(self.products)

    def recommend(self, request: RecommendationRequest) -> RecommendationResponse:
        scored_products, trace = self.recommender.recommend(request)
        recommendations = [
            RecommendedProduct(
                id=item.product.id,
                name=item.product.name,
                brand=item.product.brand,
                category=item.product.category,
                score=item.score,
                why=item.why,
                cautions=item.cautions,
                ingredients=item.product.ingredients,
                tags=item.product.tags,
                score_breakdown=item.score_breakdown,
            )
            for item in scored_products
        ]
        summary, llm_used = self._build_summary(request, recommendations)
        return RecommendationResponse(
            language=request.language,
            summary=summary,
            recommendations=recommendations,
            rule_trace=trace,
            llm_used=llm_used,
        )

    def _build_summary(
        self,
        request: RecommendationRequest,
        recommendations: list[RecommendedProduct],
    ) -> tuple[str, bool]:
        if settings.openai_api_key and recommendations:
            llm_summary = self._try_llm_summary(request, recommendations)
            if llm_summary:
                return llm_summary, True
        return self._fallback_summary(request, recommendations), False

    def _try_llm_summary(
        self,
        request: RecommendationRequest,
        recommendations: list[RecommendedProduct],
    ) -> str | None:
        try:
            from openai import OpenAI

            client = OpenAI(api_key=settings.openai_api_key)
            products = "\n".join(
                f"- {item.name} by {item.brand}: score {item.score}, reasons: {'; '.join(item.why)}"
                for item in recommendations
            )
            user_prompt = SUMMARY_USER_TEMPLATE.format(
                language=request.language,
                skin_type=request.skin_type or "not provided",
                concerns=", ".join(request.concerns) or "not provided",
                preferences=", ".join(request.preferences) or "not provided",
                avoid_ingredients=", ".join(request.avoid_ingredients) or "none",
                products=products,
            )
            response = client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": SUMMARY_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
                max_tokens=160,
            )
            content = response.choices[0].message.content
            return content.strip() if content else None
        except Exception:
            return None

    def _fallback_summary(
        self,
        request: RecommendationRequest,
        recommendations: list[RecommendedProduct],
    ) -> str:
        if not recommendations:
            return (
                "조건에 맞는 샘플 제품을 찾지 못했습니다. 피부 타입이나 고민을 조금 더 넓혀 주세요."
                if request.language == "ko"
                else "No sample product matched the current filters. Try broader skin concerns or preferences."
            )

        top = recommendations[0]
        if request.language == "ko":
            return f"{top.name}을 가장 먼저 추천합니다. 규칙 기반 점수에서 피부 타입, 고민, 선호 조건이 가장 잘 맞았습니다."
        return f"{top.name} is the strongest match based on rule-based skin type, concern, and preference scoring."
