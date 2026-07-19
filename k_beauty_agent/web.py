from __future__ import annotations

import json
import logging
import secrets
import time
import uuid
from pathlib import Path
from typing import Literal

from fastapi import Depends, FastAPI, Header, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .agent import KBeautyAgent
from .config import (
    DEFAULT_JSON_DB,
    DEFAULT_PRODUCTS_CSV,
    DEFAULT_REVIEWS_CSV,
    admin_token,
    cookie_samesite,
    cors_allow_origins,
    external_cache_path,
    follow_up_llm_enabled,
    product_source,
    product_reason_llm_enabled,
    public_llm_enabled,
    secure_cookies,
    sqlite_path_from_url,
)
from .database import ProductDatabase
from .followup_parser import parse_follow_up_patch
from .live_products import LiveProductDatabase
from .llm import HybridExplainer, ProductReasonExplainer
from .localization import format_recommendation_text
from .openai_client import OpenAIResponsesClient
from .personalization import apply_profile_patch, build_personalization, profile_to_dict
from .serializers import product_to_dict, recommendation_to_dict
from .storage import SQLiteStore, hash_session

SESSION_COOKIE = "kbeauty_session_id"
COOKIE_MAX_AGE = 30 * 86400
STATIC_DIR = Path(__file__).resolve().parents[1] / "static"

logger = logging.getLogger("k_beauty_agent")
logging.basicConfig(level=logging.INFO, format="%(message)s")


def _build_agent() -> KBeautyAgent:
    if DEFAULT_PRODUCTS_CSV.exists():
        fallback = ProductDatabase.from_csv(DEFAULT_PRODUCTS_CSV, DEFAULT_REVIEWS_CSV)
    else:
        fallback = ProductDatabase.from_json(DEFAULT_JSON_DB)
    if product_source() in {"live_keyless", "live_amazon"}:
        return KBeautyAgent(LiveProductDatabase(fallback, cache_path=external_cache_path()))
    return KBeautyAgent(fallback)


app = FastAPI(title="K-Beauty Agent", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_allow_origins(),
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
store = SQLiteStore(sqlite_path_from_url())
agent = _build_agent()

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


class RecommendRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1200)
    limit: int = Field(3, ge=1, le=8)
    use_openai: bool = True
    language: Literal["en", "ko"] = "en"


class FeedbackRequest(BaseModel):
    recommendation_id: int | None = None
    target: Literal["product", "result"]
    product_id: str | None = None
    feedback: Literal["liked", "disliked"]
    reason_tags: list[
        Literal[
            "too_expensive",
            "irritating",
            "wrong_skin_type",
            "bad_texture",
            "already_tried",
            "not_available",
            "liked_ingredients",
            "other",
        ]
    ] = Field(default_factory=list)
    comment: str | None = Field(default=None, max_length=800)


class SelectionRequest(BaseModel):
    product_id: str = Field(..., min_length=1, max_length=160)
    list_type: Literal["saved", "compare"]
    selected: bool = True


def _session_id(request: Request) -> str:
    existing = request.cookies.get(SESSION_COOKIE)
    return existing or secrets.token_urlsafe(32)


def _set_cookie(response: Response, session_id: str, request: Request | None = None) -> None:
    response.set_cookie(
        SESSION_COOKIE,
        session_id,
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        samesite=cookie_samesite(),
        secure=secure_cookies() or (request is not None and request.url.scheme == "https"),
    )


def _require_admin(x_admin_token: str | None = Header(default=None)) -> None:
    if not x_admin_token or x_admin_token != admin_token():
        raise HTTPException(status_code=401, detail="Invalid admin token")


@app.middleware("http")
async def structured_logging(request: Request, call_next):
    request_id = request.headers.get("x-request-id", str(uuid.uuid4()))
    started = time.perf_counter()
    status_code = 500
    try:
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        status_code = response.status_code
        return response
    finally:
        latency_ms = int((time.perf_counter() - started) * 1000)
        session_id = request.cookies.get(SESSION_COOKIE)
        payload = {
            "event": "http_request",
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": status_code,
            "latency_ms": latency_ms,
            "session_hash": hash_session(session_id),
        }
        logger.info(json.dumps(payload, ensure_ascii=False))


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/compare")
def compare_page() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/profile")
def profile_page() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/routine")
def routine_page() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/admin")
def admin_page() -> FileResponse:
    return FileResponse(STATIC_DIR / "admin.html")


@app.get("/health")
def health() -> dict[str, object]:
    return {
        "ok": True,
        "products": len(agent.database.products),
        "product_source": product_source(),
        "product_source_status": _product_source_status(),
        "public_llm_enabled": public_llm_enabled(),
    }


@app.get("/api/session")
def get_session(request: Request, response: Response, session_id: str = Depends(_session_id)) -> dict[str, object]:
    session = store.ensure_session(session_id)
    _set_cookie(response, session_id, request)
    return {
        "session_id_hash": hash_session(session_id),
        "profile": session["profile"],
        "recent_queries": store.recent_queries(session_id, 5),
    }


@app.delete("/api/session")
def reset_session(response: Response, session_id: str = Depends(_session_id)) -> dict[str, object]:
    store.delete_session(session_id)
    response.delete_cookie(
        SESSION_COOKIE,
        httponly=True,
        samesite=cookie_samesite(),
        secure=secure_cookies(),
    )
    return {"ok": True}


@app.delete("/api/profile")
def reset_profile(request: Request, response: Response, session_id: str = Depends(_session_id)) -> dict[str, object]:
    store.ensure_session(session_id)
    store.save_profile(session_id, {})
    store.log_event("profile_reset", {}, session_id=session_id)
    _set_cookie(response, session_id, request)
    return {"ok": True, "profile": {}}


@app.get("/api/products")
def products() -> dict[str, object]:
    return {
        "products": [product_to_dict(product) for product in agent.database.products]
    }


@app.post("/api/recommend")
def recommend(payload: RecommendRequest, request: Request, response: Response, session_id: str = Depends(_session_id)) -> dict[str, object]:
    return _recommend(payload, request, response, session_id, is_follow_up=False)


@app.post("/api/follow-up")
def follow_up(payload: RecommendRequest, request: Request, response: Response, session_id: str = Depends(_session_id)) -> dict[str, object]:
    return _recommend(payload, request, response, session_id, is_follow_up=True)


@app.post("/api/feedback")
def feedback(payload: FeedbackRequest, request: Request, response: Response, session_id: str = Depends(_session_id)) -> dict[str, object]:
    if payload.target == "product" and not payload.product_id:
        raise HTTPException(status_code=400, detail="product_id is required for product feedback")
    store.ensure_session(session_id)
    feedback_id = store.add_feedback(
        session_id=session_id,
        target=payload.target,
        feedback=payload.feedback,
        recommendation_id=payload.recommendation_id,
        product_id=payload.product_id,
        reason_tags=list(payload.reason_tags),
        comment=payload.comment,
    )
    store.log_event(
        "feedback",
        {"target": payload.target, "feedback": payload.feedback, "product_id": payload.product_id},
        session_id=session_id,
    )
    _set_cookie(response, session_id, request)
    return {"ok": True, "feedback_id": feedback_id}


@app.get("/api/selections")
def selections(request: Request, response: Response, session_id: str = Depends(_session_id)) -> dict[str, object]:
    store.ensure_session(session_id)
    result = _selection_payload(session_id)
    _set_cookie(response, session_id, request)
    return result


@app.post("/api/selections")
def update_selection(
    payload: SelectionRequest,
    request: Request,
    response: Response,
    session_id: str = Depends(_session_id),
) -> dict[str, object]:
    store.ensure_session(session_id)
    if agent.database.get(payload.product_id) is None:
        raise HTTPException(status_code=404, detail="Unknown product_id")
    store.set_selection(session_id, payload.product_id, payload.list_type, payload.selected)
    result = _selection_payload(session_id)
    _set_cookie(response, session_id, request)
    return result


@app.get("/api/admin/metrics")
def admin_metrics(_: None = Depends(_require_admin)) -> dict[str, object]:
    return store.metrics()


@app.post("/api/admin/cleanup")
def admin_cleanup(_: None = Depends(_require_admin)) -> dict[str, object]:
    return {"deleted": store.cleanup_expired()}


@app.post("/api/admin/reload")
def admin_reload(_: None = Depends(_require_admin)) -> dict[str, object]:
    global agent
    agent = _build_agent()
    return {"ok": True, "products": len(agent.database.products)}


def _recommend(payload: RecommendRequest, request: Request, response: Response, session_id: str, *, is_follow_up: bool) -> dict[str, object]:
    started = time.perf_counter()
    session = store.ensure_session(session_id)
    feedback_rows = store.feedback_for_session(session_id)
    personalization = build_personalization(agent.database.products, feedback_rows)
    recent_queries = store.recent_queries(session_id, 5) if is_follow_up else []
    stored_profile = session["profile"] if is_follow_up else None
    follow_up_parser_status = "rule_only"
    if is_follow_up and public_llm_enabled() and follow_up_llm_enabled():
        try:
            patch = parse_follow_up_patch(
                payload.query,
                stored_profile=stored_profile,
                recent_queries=recent_queries,
                client=OpenAIResponsesClient(store=store, session_id=session_id),
                language=payload.language,
            )
            if patch:
                stored_profile = apply_profile_patch(stored_profile, patch)
                follow_up_parser_status = "llm_ok"
            else:
                follow_up_parser_status = "llm_empty"
        except Exception as exc:
            follow_up_parser_status = "llm_fallback"
            store.log_event("follow_up_parser_error", {"error": str(exc)[:500]}, session_id=session_id)
    recommendation = agent.recommend(
        payload.query,
        limit=payload.limit,
        stored_profile=stored_profile,
        recent_queries=recent_queries,
        personalization=personalization,
    )
    openai_status = "not_used"
    explanation = format_recommendation_text(recommendation, payload.language)
    if payload.use_openai and public_llm_enabled():
        explainer = HybridExplainer(OpenAIResponsesClient(store=store, session_id=session_id))
        try:
            explanation = explainer.explain(recommendation, language=payload.language)
            openai_status = "ok"
        except Exception as exc:
            openai_status = "fallback"
            store.log_event("openai_error", {"error": str(exc)[:500]}, session_id=session_id)

    product_reason_status = "fallback"
    product_reasons: dict[str, str] = {}
    if public_llm_enabled() and product_reason_llm_enabled():
        try:
            product_reasons = ProductReasonExplainer(OpenAIResponsesClient(store=store, session_id=session_id)).explain_reasons(
                recommendation,
                language=payload.language,
            )
            product_reason_status = "ok" if product_reasons else "empty"
        except Exception as exc:
            product_reason_status = "fallback"
            store.log_event("product_reason_error", {"error": str(exc)[:500]}, session_id=session_id)

    result = recommendation_to_dict(
        recommendation,
        grounded_explanation=explanation,
        openai_status=openai_status,
        language=payload.language,
        product_reasons=product_reasons,
    )
    result["product_source_status"] = _product_source_status()
    result["follow_up_parser_status"] = follow_up_parser_status
    result["product_reason_status"] = product_reason_status
    latency_ms = int((time.perf_counter() - started) * 1000)
    recommendation_id = store.add_recommendation(session_id, payload.query, recommendation.decision, result, latency_ms)
    result["recommendation_id"] = recommendation_id
    store.add_turn(session_id, "user", payload.query, result)
    store.save_profile(session_id, profile_to_dict(recommendation.profile))
    store.log_event(
        "recommendation",
        {
            "decision": recommendation.decision,
            "recommendation_count": len(recommendation.results),
            "openai_status": openai_status,
        },
        session_id=session_id,
        latency_ms=latency_ms,
    )
    _set_cookie(response, session_id, request)
    return result


def _product_source_status() -> dict[str, object]:
    if hasattr(agent.database, "last_source_status"):
        return dict(agent.database.last_source_status)
    return {"product_source": product_source(), "source_used": "curated_csv", "message": "Using curated CSV product database."}


def _selection_payload(session_id: str) -> dict[str, object]:
    selections = store.selections_for_session(session_id)
    saved_products = _products_for_ids(selections["saved"])
    compare_products = _products_for_ids(selections["compare"])
    total_cost_krw = sum(product.oliveyoung_price_krw or 0 for product in saved_products)
    missing_price_ids = [product.id for product in saved_products if product.oliveyoung_price_krw is None]
    return {
        "saved_ids": [product.id for product in saved_products],
        "compare_ids": [product.id for product in compare_products],
        "saved_products": [product_to_dict(product) for product in _routine_sort(saved_products)],
        "compare_products": [product_to_dict(product) for product in compare_products],
        "total_cost_krw": total_cost_krw,
        "missing_price_ids": missing_price_ids,
    }


def _products_for_ids(product_ids: list[str]):
    products = []
    for product_id in product_ids:
        product = agent.database.get(product_id)
        if product is not None:
            products.append(product)
    return products


def _routine_sort(products):
    order = {"cleanser": 0, "toner": 1, "serum": 2, "ampoule": 2, "essence": 2, "moisturizer": 3, "sunscreen": 4}
    return sorted(products, key=lambda product: (order.get(product.category, 20), product.name.lower()))
