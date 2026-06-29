from __future__ import annotations

from fastapi import FastAPI

from app.api.routes import router
from app.config import settings

app = FastAPI(
    title=settings.app_name,
    description="Rule-first K-beauty recommendation API with optional LLM-generated explanations.",
    version="1.0.0",
)
app.include_router(router)


@app.get("/")
def root() -> dict[str, str]:
    return {
        "message": settings.app_name,
        "docs": "/docs",
        "health": "/health",
        "recommend": "/api/recommend",
    }
