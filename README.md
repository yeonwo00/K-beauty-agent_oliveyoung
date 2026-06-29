# K-Beauty Recommendation Agent

## Overview

K-Beauty Recommendation Agent is a FastAPI-based AI service that recommends Korean beauty products based on user skin type, concerns, preferences, and language input.

This repository is structured as a portfolio project: the backend is intentionally compact, readable, and easy to run locally while still showing a practical rule-first AI product workflow.

## Key Features

- Personalized K-beauty product recommendation
- Rule-based recommendation logic
- LLM-powered recommendation explanations
- LLM-assisted product comparison
- Positive/critical review snippets and review summaries
- Korean/English bilingual support
- FastAPI backend
- Render deployment ready

## Design

This project intentionally combines deterministic recommendation rules with LLM-generated explanations.

The recommendation itself is generated through rule-based logic for consistency and reproducibility, while the LLM is responsible for natural-language explanation, product comparison, and review summarization.

This hybrid design improves controllability and reduces hallucinations compared to using an LLM alone.

## Deployment

Backend: Render

- **Backend:** Render
- **API Documentation:** `/docs`
- **Status:** Production-ready demo

## Tech Stack

- Python
- FastAPI
- OpenAI API
- Render
- GitHub

## Architecture

```text
User
   │
   ▼
FastAPI REST API
   │
   ▼
Input Validation
   │
   ▼
Recommendation Engine
   │
   ├── Rule-based Filtering
   ├── Product Ranking
   └── Prompt Generation
            │
            ▼
OpenAI API
            │
            ▼
Response Formatter
            │
            ▼
JSON Response
```


## Project Structure

```text
k-beauty-agent/
|-- README.md
|-- requirements.txt
|-- .gitignore
|-- .env.example
|-- LICENSE
|-- app/
|   |-- main.py
|   |-- config.py
|   |-- schemas.py
|   `-- api/
|       `-- routes.py
|-- agent/
|   |-- workflow.py
|   |-- prompt_templates.py
|   `-- recommendation_rules.py
|-- data/
|   `-- sample_products.json
|-- docs/
|   |-- architecture.png
|   |-- demo.md
|   `-- api_spec.md
`-- tests/
    `-- test_recommendation.py
```

- `app/`: FastAPI application, API routes, configuration, and request/response schemas.
- `agent/`: Recommendation workflow, prompt templates, and rule-based scoring logic.
- `data/`: Small public sample product dataset for local execution and tests.
- `docs/`: Architecture, demo scenarios, and API documentation.
- `tests/`: Automated tests for the recommendation workflow and API behavior.

## Agent Workflow

```text
User Query

↓

Input Validation

↓

Product Filtering

↓

Rule-based Ranking

↓

Prompt Construction

↓

OpenAI API

↓

Post-processing

↓

JSON Response
```

## How to Run

```bash
git clone https://github.com/yeonwo00/K-beauty-agent_oliveyoung.git
cd K-beauty-agent_oliveyoung
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open the API docs:

```text
http://127.0.0.1:8000/docs
```

## Example Request

```bash
curl -X POST http://127.0.0.1:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "skin_type": "oily",
    "concerns": ["oil_control", "pores"],
    "preferences": ["lightweight", "fragrance-free"],
    "language": "en",
    "limit": 3
  }'
```

## Key Takeaways
- Designing an end-to-end LLM application architecture
- Building REST APIs using FastAPI
- Prompt engineering for structured recommendation tasks
- Deploying production-style services using Render
- Designing controllable AI workflows with rule-based reasoning

## Challenges

- Designing a recommendation workflow before calling the LLM
- Structuring prompts for consistent bilingual responses
- Separating recommendation logic from explanation generation
- Building a lightweight backend suitable for deployment

## Future Works
- Real product database integration
- RAG-based product retrieval
- User feedback-based learning
- Automated evaluation pipeline
- Safety filtering for skincare advice
- Multi-agent workflow

## Notes

This project is a recommendation-system demo, not medical advice. Product matches are based on a small sample dataset and simplified skin-care rules for portfolio demonstration purposes.

## Demo
https://k-beauty-agent-lq0v.onrender.com/#quiz
