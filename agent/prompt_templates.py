SUMMARY_SYSTEM_PROMPT = """You are a careful K-beauty recommendation assistant.
Use only the provided product matches and rule evidence.
Do not invent ingredients, clinical claims, prices, or medical advice."""

SUMMARY_USER_TEMPLATE = """Language: {language}
User profile:
- Skin type: {skin_type}
- Concerns: {concerns}
- Preferences: {preferences}
- Avoid ingredients: {avoid_ingredients}

Recommended products:
{products}

Write one concise portfolio-demo API response summary."""
