from __future__ import annotations

from pathlib import Path

from agent.prompt_templates import (
    COMPARE_SYSTEM_PROMPT,
    COMPARE_USER_TEMPLATE,
    SUMMARY_SYSTEM_PROMPT,
    SUMMARY_USER_TEMPLATE,
    WHY_RECOMMENDED_SYSTEM_PROMPT,
    WHY_RECOMMENDED_USER_TEMPLATE,
)
from agent.recommendation_rules import RuleBasedRecommender, load_products
from app.config import settings
from app.schemas import (
    ComparedProduct,
    ProductCompareRequest,
    ProductCompareResponse,
    RecommendationRequest,
    RecommendationResponse,
    RecommendedProduct,
    ReviewSnapshot,
)


class KBeautyRecommendationAgent:
    def __init__(self, product_data_path: Path):
        self.products = load_products(product_data_path)
        self.recommender = RuleBasedRecommender(self.products)

    def recommend(self, request: RecommendationRequest) -> RecommendationResponse:
        scored_products, trace = self.recommender.recommend(request)
        recommendations: list[RecommendedProduct] = []
        product_explanation_llm_used = False
        for item in scored_products:
            why_recommended, why_llm_used = self._build_why_recommended(request, item)
            product_explanation_llm_used = product_explanation_llm_used or why_llm_used
            recommendations.append(
                RecommendedProduct(
                    id=item.product.id,
                    name=item.product.name,
                    brand=item.product.brand,
                    category=item.product.category,
                    price_krw=item.product.price_krw,
                    score=item.score,
                    why=item.why,
                    why_recommended=why_recommended,
                    cautions=item.cautions,
                    ingredients=item.product.ingredients,
                    tags=item.product.tags,
                    review=ReviewSnapshot(
                        positive=item.product.positive_review,
                        critical=item.product.critical_review,
                        summary=item.product.review_summary,
                    ),
                    score_breakdown=item.score_breakdown,
                )
            )
        summary, summary_llm_used = self._build_summary(request, recommendations)
        return RecommendationResponse(
            language=request.language,
            summary=summary,
            recommendations=recommendations,
            rule_trace=trace,
            llm_used=summary_llm_used or product_explanation_llm_used,
        )

    def compare_products(self, request: ProductCompareRequest) -> ProductCompareResponse:
        products = self.recommender.find_products(request.product_ids)
        compared_products = [
            ComparedProduct(
                id=product.id,
                name=product.name,
                brand=product.brand,
                category=product.category,
                price_krw=product.price_krw,
                ingredients=product.ingredients,
                suited_skin_types=product.suited_skin_types,
                concerns=product.concerns,
                tags=product.tags,
                review=ReviewSnapshot(
                    positive=product.positive_review,
                    critical=product.critical_review,
                    summary=product.review_summary,
                ),
            )
            for product in products
        ]
        comparison, llm_used = self._build_comparison(request, compared_products)
        return ProductCompareResponse(
            language=request.language,
            comparison=comparison,
            products=compared_products,
            llm_used=llm_used,
        )

    def _build_why_recommended(self, request: RecommendationRequest, item) -> tuple[str, bool]:
        if settings.openai_api_key:
            llm_explanation = self._try_llm_why_recommended(request, item)
            if llm_explanation:
                return llm_explanation, True
        reasons = " ".join(item.why)
        if request.language == "ko":
            return f"입력 조건과 비교했을 때 {reasons} 리뷰 요약도 이 루틴 적합성을 뒷받침합니다.", False
        return f"For the entered conditions, {reasons} The review summary also supports this routine fit.", False

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

    def _try_llm_why_recommended(self, request: RecommendationRequest, item) -> str | None:
        try:
            from openai import OpenAI

            product = item.product
            client = OpenAI(api_key=settings.openai_api_key)
            user_prompt = WHY_RECOMMENDED_USER_TEMPLATE.format(
                language=request.language,
                skin_type=request.skin_type or "not provided",
                concerns=", ".join(request.concerns) or "not provided",
                preferences=", ".join(request.preferences) or "not provided",
                avoid_ingredients=", ".join(request.avoid_ingredients) or "none",
                name=product.name,
                brand=product.brand,
                category=product.category,
                price_krw=product.price_krw or "not provided",
                ingredients=", ".join(product.ingredients),
                tags=", ".join(product.tags),
                rule_reasons="; ".join(item.why),
                cautions="; ".join(item.cautions) or "none",
                positive_review=product.positive_review,
                critical_review=product.critical_review,
                review_summary=product.review_summary,
            )
            response = client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": WHY_RECOMMENDED_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
                max_tokens=140,
            )
            content = response.choices[0].message.content
            return content.strip() if content else None
        except Exception:
            return None

    def _build_comparison(
        self,
        request: ProductCompareRequest,
        products: list[ComparedProduct],
    ) -> tuple[str, bool]:
        if settings.openai_api_key and len(products) >= 2:
            llm_comparison = self._try_llm_comparison(request, products)
            if llm_comparison:
                return llm_comparison, True
        return self._fallback_comparison(request, products), False

    def _try_llm_comparison(
        self,
        request: ProductCompareRequest,
        products: list[ComparedProduct],
    ) -> str | None:
        try:
            from openai import OpenAI

            product_context = "\n".join(
                (
                    f"- {product.name} by {product.brand} | category={product.category} | "
                    f"price_krw={product.price_krw or 'not provided'} | "
                    f"skin_fit={', '.join(product.suited_skin_types)} | "
                    f"functions={', '.join(product.concerns)} | "
                    f"ingredients={', '.join(product.ingredients)} | "
                    f"tags={', '.join(product.tags)} | "
                    f"reviews={product.review.summary}"
                )
                for product in products
            )
            user_prompt = COMPARE_USER_TEMPLATE.format(
                language=request.language,
                skin_type=request.skin_type or "not provided",
                concerns=", ".join(request.concerns) or "not provided",
                preferences=", ".join(request.preferences) or "not provided",
                products=product_context,
            )
            client = OpenAI(api_key=settings.openai_api_key)
            response = client.chat.completions.create(
                model=settings.openai_model,
                messages=[
                    {"role": "system", "content": COMPARE_SYSTEM_PROMPT},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.2,
                max_tokens=260,
            )
            content = response.choices[0].message.content
            return content.strip() if content else None
        except Exception:
            return None

    def _fallback_comparison(
        self,
        request: ProductCompareRequest,
        products: list[ComparedProduct],
    ) -> str:
        if len(products) < 2:
            return (
                "비교하려면 최소 2개의 유효한 제품 ID가 필요합니다."
                if request.language == "ko"
                else "At least two valid product IDs are required for comparison."
            )

        sorted_products = sorted(products, key=lambda product: product.price_krw or 10**9)
        cheapest = sorted_products[0]
        first = products[0]
        second = products[1]
        if request.language == "ko":
            return (
                f"{first.name}은 {', '.join(first.concerns)}에 강점이 있고, "
                f"{second.name}은 {', '.join(second.concerns)}에 초점이 있습니다. "
                f"가격 기준으로는 {cheapest.name}이 가장 낮습니다. "
                "OPENAI_API_KEY가 설정되면 성분, 피부타입 적합성, 기능, 가격을 더 자연어로 비교합니다."
            )
        return (
            f"{first.name} focuses on {', '.join(first.concerns)}, while "
            f"{second.name} focuses on {', '.join(second.concerns)}. "
            f"{cheapest.name} is the lowest-priced option. "
            "Set OPENAI_API_KEY to generate a richer ingredient, skin-fit, function, and price comparison."
        )

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
