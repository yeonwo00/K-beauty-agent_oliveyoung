# K-Beauty Recommendation Agent

A bilingual K-beauty product recommendation web app built with FastAPI. It combines deterministic ingredient and skin-fit scoring with optional OpenAI-generated explanations, while preserving rule-based fallback behavior.

## Live product

- Web app: https://k-beauty-agent-lq0v.onrender.com/
- API documentation: https://k-beauty-agent-lq0v.onrender.com/docs
- Health check: https://k-beauty-agent-lq0v.onrender.com/health
- GitHub Pages client: https://yeonwo00.github.io/K-beauty-agent_oliveyoung/

## Product capabilities

- Korean and English skin quiz
- Ingredient-, concern-, texture-, and budget-aware ranking
- 50 curated K-beauty products with product, ingredient, review, image, and purchase-link evidence
- Follow-up refinement, comparison, saved products, and routine building
- Anonymous session, feedback, and operational metrics storage
- Optional OpenAI explanations with rule-only fallback
- Admin metrics endpoints protected by `X-Admin-Token`
- Render Blueprint, health check, secure cookie options, and GitHub Actions tests

## Architecture

```text
Browser
  |
  v
FastAPI web app
  |-- static bilingual UI
  |-- session / feedback API
  |-- rule-first recommendation engine
  |-- curated product and review data
  `-- optional OpenAI explanation layer
          |
          `-- disabled safely when no key or public LLM flag is off
```

Recommendation ranking is calculated from repository data and deterministic rules. The LLM is limited to parsing optional follow-up constraints and explaining already-ranked results; it does not select unsupported products or invent product attributes.

## Local setup

```bash
git clone https://github.com/yeonwo00/K-beauty-agent_oliveyoung.git
cd K-beauty-agent_oliveyoung
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
uvicorn k_beauty_agent.web:app --host 127.0.0.1 --port 8000 --reload
```

Open http://127.0.0.1:8000 in a browser.

The app works without an OpenAI key. To enable LLM explanations locally, set `OPENAI_API_KEY` and keep `PUBLIC_LLM_ENABLED=true` in `.env`.

## API example

```bash
curl -X POST http://127.0.0.1:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "query": "지성 피부에 맞는 3만원 이하 제품 추천",
    "limit": 3,
    "use_openai": false,
    "language": "ko"
  }'
```

## Tests

```bash
python -m pytest -q
```

The CI workflow runs the same suite on every pull request and push to `main`.

## Deploy to Render

The repository includes `render.yaml`, so it can be deployed as a Render Blueprint.

[Deploy to Render](https://render.com/deploy?repo=https://github.com/yeonwo00/K-beauty-agent_oliveyoung)

The default Blueprint is intentionally cost-safe:

- `PRODUCT_SOURCE=curated` for deterministic startup and recommendations
- `PUBLIC_LLM_ENABLED=false` so public traffic cannot spend OpenAI credits
- generated `ADMIN_TOKEN` and `SESSION_SECRET`
- HTTPS-only cookies and `/health` deployment checks
- Python 3.12 pinned for reproducible builds

To enable public LLM explanations, add `OPENAI_API_KEY` in Render and explicitly set `PUBLIC_LLM_ENABLED=true`. Review rate limits and spending limits before enabling it for unrestricted traffic.

The free Render configuration stores SQLite session and feedback data under `/tmp`; this data can reset after restarts or deploys. Use a persistent disk or a managed database before treating session history as durable production data.

## Repository layout

```text
k_beauty_agent/     production recommendation engine and FastAPI web app
static/             bilingual product UI and admin page
data/               curated products, reviews, and source snapshots
tests/              recommendation, personalization, source, and config tests
render.yaml         Render infrastructure definition
app/ and agent/     compact reference API retained for portfolio examples
```

## Environment variables

| Variable | Purpose | Production default |
| --- | --- | --- |
| `OPENAI_API_KEY` | Optional explanation and follow-up parsing | unset |
| `OPENAI_MODEL` | OpenAI model name | `gpt-5.4-mini` |
| `PUBLIC_LLM_ENABLED` | Allows public endpoints to call OpenAI | `false` on Render |
| `ADMIN_TOKEN` | Protects admin metrics and maintenance APIs | generated |
| `SESSION_SECRET` | HMAC key for anonymized session logging | generated |
| `PRODUCT_SOURCE` | `curated` or optional `live_keyless` data layer | `curated` |
| `DATABASE_URL` | SQLite storage URL | `/tmp` on free Render |
| `CORS_ALLOW_ORIGINS` | Comma-separated trusted browser origins | repository Pages origins |

See `.env.example` for the complete local configuration.

## Data and safety notes

- Recommendations are cosmetic product-selection guidance, not medical diagnosis or treatment.
- Prices, availability, ingredients, and links are snapshots and can change after verification.
- Users with allergies or skin conditions should verify current packaging and seek qualified medical advice when appropriate.
- OpenAI failures fall back to grounded rule-based explanations.
