from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


Language = Literal["en", "ko"]


class RecommendationRequest(BaseModel):
    skin_type: str | None = Field(default=None, examples=["oily"])
    concerns: list[str] = Field(default_factory=list, examples=[["oil_control", "pores"]])
    preferences: list[str] = Field(default_factory=list, examples=[["lightweight", "fragrance-free"]])
    avoid_ingredients: list[str] = Field(default_factory=list, examples=[["fragrance"]])
    language: Language = "en"
    limit: int = Field(default=3, ge=1, le=5)


class ScoreBreakdown(BaseModel):
    skin_type: float
    concerns: float
    preferences: float
    safety: float


class RecommendedProduct(BaseModel):
    id: str
    name: str
    brand: str
    category: str
    score: float
    why: list[str]
    cautions: list[str]
    ingredients: list[str]
    tags: list[str]
    score_breakdown: ScoreBreakdown


class RecommendationResponse(BaseModel):
    language: Language
    summary: str
    recommendations: list[RecommendedProduct]
    rule_trace: list[str]
    llm_used: bool
