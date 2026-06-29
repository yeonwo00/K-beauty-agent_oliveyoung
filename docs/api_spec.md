# API Spec

## GET `/health`

Checks whether the API is running.

### Response

```json
{
  "status": "ok",
  "service": "K-Beauty Recommendation Agent"
}
```

## POST `/api/recommend`

Returns personalized K-beauty recommendations from the sample product dataset.

### Request Body

```json
{
  "skin_type": "oily",
  "concerns": ["oil_control", "pores"],
  "preferences": ["lightweight", "fragrance-free"],
  "avoid_ingredients": ["fragrance"],
  "language": "en",
  "limit": 3
}
```

### Fields

- `skin_type`: Optional skin type, such as `oily`, `dry`, `sensitive`, or Korean aliases like `지성`.
- `concerns`: Skin concerns, such as `oil_control`, `pores`, `acne`, `hydration`, `redness`, or Korean aliases.
- `preferences`: Texture or routine preferences, such as `lightweight`, `fragrance-free`, or `산뜻`.
- `avoid_ingredients`: Ingredients the user wants to avoid.
- `language`: `en` or `ko`.
- `limit`: Number of products to return, from 1 to 5.

### Response Body

```json
{
  "language": "en",
  "summary": "Green Tea Oil-Control Gel Cream is the strongest match based on rule-based skin type, concern, and preference scoring.",
  "recommendations": [
    {
      "id": "kb-001",
      "name": "Green Tea Oil-Control Gel Cream",
      "brand": "K-Beauty Lab",
      "category": "moisturizer",
      "score": 6.0,
      "why": [
        "Matches oily skin type.",
        "Targets concern(s): oil_control, pores.",
        "Matches preference(s): lightweight."
      ],
      "cautions": [],
      "ingredients": ["Green Tea Extract", "Niacinamide", "Zinc PCA", "Hyaluronic Acid"],
      "tags": ["lightweight", "gel", "non-greasy"],
      "score_breakdown": {
        "skin_type": 2.0,
        "concerns": 3.0,
        "preferences": 1.0,
        "safety": 0.0
      }
    }
  ],
  "rule_trace": [
    "skin_type=oily",
    "concerns=['oil_control', 'pores']",
    "preferences=['lightweight']",
    "avoid_ingredients=[]"
  ],
  "llm_used": false
}
```
