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


class ProductCompareRequest(BaseModel):
    product_ids: list[str] = Field(min_length=2, max_length=5, examples=[["kb-001", "kb-004"]])
    skin_type: str | None = Field(default=None, examples=["oily"])
    concerns: list[str] = Field(default_factory=list, examples=[["oil_control", "pores"]])
    preferences: list[str] = Field(default_factory=list, examples=[["lightweight"]])
    language: Language = "en"


class ScoreBreakdown(BaseModel):
    skin_type: float
    concerns: float
    preferences: float
    safety: float


class ReviewSnapshot(BaseModel):
    positive: str
    critical: str
    summary: str


class RecommendedProduct(BaseModel):
    id: str
    name: str
    brand: str
    category: str
    price_krw: int | None
    score: float
    why: list[str]
    why_recommended: str
    cautions: list[str]
    ingredients: list[str]
    tags: list[str]
    review: ReviewSnapshot
    score_breakdown: ScoreBreakdown


class RecommendationResponse(BaseModel):
    language: Language
    summary: str
    recommendations: list[RecommendedProduct]
    rule_trace: list[str]
    llm_used: bool


class ComparedProduct(BaseModel):
    id: str
    name: str
    brand: str
    category: str
    price_krw: int | None
    ingredients: list[str]
    suited_skin_types: list[str]
    concerns: list[str]
    tags: list[str]
    review: ReviewSnapshot


class ProductCompareResponse(BaseModel):
    language: Language
    comparison: str
    products: list[ComparedProduct]
    llm_used: bool
