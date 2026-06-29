from __future__ import annotations

from fastapi import APIRouter

from agent.workflow import KBeautyRecommendationAgent
from app.config import settings
from app.schemas import RecommendationRequest, RecommendationResponse

router = APIRouter()
recommendation_agent = KBeautyRecommendationAgent(settings.product_data_path)


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}


@router.post("/api/recommend", response_model=RecommendationResponse)
def recommend(request: RecommendationRequest) -> RecommendationResponse:
    return recommendation_agent.recommend(request)
