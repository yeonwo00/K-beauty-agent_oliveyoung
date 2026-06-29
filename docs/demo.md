# Demo

## English Request

```bash
curl -X POST http://127.0.0.1:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "skin_type": "oily",
    "concerns": ["oil_control", "pores"],
    "preferences": ["lightweight"],
    "language": "en"
  }'
```

Expected result:

- The API returns `Green Tea Oil-Control Gel Cream` or another oily-skin product near the top.
- `summary` explains why the first product is the strongest rule-based match.
- `rule_trace` shows the normalized skin type, concerns, preferences, and avoided ingredients.

## Korean Request

```bash
curl -X POST http://127.0.0.1:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "skin_type": "지성",
    "concerns": ["유분", "모공"],
    "preferences": ["산뜻"],
    "language": "ko"
  }'
```

Expected result:

- Korean aliases are normalized into rule-friendly tags such as `oily`, `oil_control`, and `pores`.
- The service returns a Korean summary when `language` is `ko`.
- The recommendation still exposes English product and ingredient names for portfolio readability.

## LLM Behavior

If `OPENAI_API_KEY` is set, the workflow asks the LLM to generate a short grounded summary from the rule-based matches.

If the key is missing or the API call fails, the system falls back to a deterministic rule-based summary.
