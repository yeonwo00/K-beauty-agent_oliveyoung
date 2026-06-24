# K-beauty Agent Live API Edition

외국인이 한국 뷰티 제품을 고를 때 쓸 수 있는 설명 가능한 추천 agent입니다.
추천은 광고 문구나 브랜드 선호가 아니라 제품 DB의 ingredient, 피부 타입, 리뷰 신호, 근거 수준을 바탕으로 합니다.

이 폴더는 기존 curated CSV 버전을 복사한 **실시간 product API 실험 버전**입니다. UI, 추천 점수, 세션, compare, routine API는 기존 앱과 같은 shape을 유지하고, 제품 source/database layer만 `LiveProductDatabase`로 교체했습니다.

## 핵심 원칙

- Ingredient 기반 rule-first 추천: 성분 근거가 점수에 직접 반영됩니다.
- LLM hybrid: LLM은 rule engine 결과를 자연어로 정리하는 역할만 하며, 제품/효능/리뷰를 새로 만들어내면 안 됩니다.
- Explainable recommendation: 각 제품별 점수, 추천 이유, 근거 성분, 주의점, 누락 데이터를 표시합니다.
- No ads, no brand bias: 유료/광고 신호를 사용하지 않고, 동점 또는 유사 점수에서는 브랜드 다양성을 적용합니다.
- Fallback-first: 피부 타입, 고민, 알레르기, 성분표가 부족하면 질문하거나 보수적인 fallback을 제공합니다.

## 실행

```bash
cd /home/echo/ai_security/cs146s/k-beauty-agent-live-api
python3 -m k_beauty_agent.cli "지성 피부에 맞는 기초 제품을 추천해줘"
```

## 웹앱 실행

```bash
cd /home/echo/ai_security/cs146s/k-beauty-agent-live-api
python3 -m pip install -r requirements.txt
uvicorn k_beauty_agent.web:app --host 0.0.0.0 --port 8001 --reload
```

브라우저에서 `http://127.0.0.1:8001`을 열면 개인화 세션, 후속질문, liked/disliked 피드백, 유사 제품, 추천 이유 시각화를 사용할 수 있습니다.
기존 curated 앱을 8000번에 띄우고 이 live 앱을 8001번에 띄우면 두 버전을 나란히 비교할 수 있습니다.

환경변수 예시는 `.env.example`에 있습니다. `OPENAI_API_KEY`가 없거나 API 호출이 실패하면 rule-only 설명과 rule-based 후속 조건 parser로 fallback합니다.

## LLM-assisted follow-up parsing

후속 조건 입력은 기본 rule parser를 유지하되, `OPENAI_API_KEY`가 있고 `FOLLOW_UP_LLM_ENABLED=true`이면 LLM을 보조 parser로 사용합니다.
LLM은 제품을 직접 추천하지 않고 사용자의 자연어 후속 요청을 `SkinProfile` 조건으로만 구조화합니다.

- 예: `히알루론산 빼고 3만원 이상의 산뜻한 세럼` → `avoid_ingredients=["hyaluronic acid"]`, `min_price_krw=30000`, `texture_preference="lightweight"`, `desired_categories=["serum"]`
- 허용된 피부 타입, 고민, 카테고리, 제형 값만 통과합니다.
- 알러지/피해야 할 성분은 추천 엔진의 기존 전성분 필터가 계속 처리합니다.
- LLM 응답이 비어 있거나 파싱에 실패하면 기존 rule parser가 그대로 동작합니다.

`PRODUCT_REASON_LLM_ENABLED=true`이면 추천 카드의 “추천 이유” 문장도 LLM으로 보강합니다.
이때 LLM은 내부 점수나 순위를 만들지 않고, 이미 계산된 사용자 조건, 제품 카테고리, 가격, 피부 적합도, 매칭 성분, 주의점만 바탕으로 설명문을 씁니다.
API key가 없거나 실패하면 rule 기반 추천 이유 문장으로 자동 fallback합니다.

## Keyless live product source

기본값은 `PRODUCT_SOURCE=live_keyless`입니다. live mode에서는 key가 필요 없는 공개 source를 우선순위대로 조회하고, 실패하면 24시간 SQLite cache, 마지막으로 기존 curated CSV를 fallback으로 사용합니다.

우선순위:

1. Olive Young snapshot: 사용자가 직접 확인한 CSV 또는 저장 HTML
2. Open Beauty Facts: 제품명, 브랜드, 이미지, 공개 전성분 후보
3. CosIng: 제품 DB가 아니라 성분 사전/규제 정보 보강용
4. 기존 curated DB fuzzy match: K-beauty 제품명/브랜드가 맞으면 전성분과 리뷰 신호 보강
5. external cache: 24시간 내 조회된 live product
6. curated CSV fallback: live source가 비어 있거나 품질이 부족할 때 안전 fallback

환경변수:

```bash
PRODUCT_SOURCE=live_keyless
EXTERNAL_CACHE_URL=sqlite:///data/external_product_cache.sqlite3
OLIVEYOUNG_SNAPSHOT_CSV=data/oliveyoung_snapshot.csv
OLIVEYOUNG_SNAPSHOT_HTML_DIR=data/oliveyoung_snapshots
OPEN_BEAUTY_FACTS_API_URL=https://world.openbeautyfacts.org/cgi/search.pl
COSING_API_URL=https://ec.europa.eu/growth/tools-databases/cosing/api/ingredients
KRW_PER_USD=1350
FOLLOW_UP_LLM_ENABLED=true
PRODUCT_REASON_LLM_ENABLED=true
```

Live provider 정책:

- Olive Young snapshot provider는 네트워크 요청을 하지 않습니다. 사용자가 브라우저에서 확인한 CSV 또는 저장 HTML 파일만 읽습니다.
- CSV header는 `product_name, brand, category, price_krw, oliveyoung_url, image_url`을 기본으로 사용하며, `ingredients`가 있으면 알러지 필터에 활용합니다.
- 저장 HTML은 JSON-LD, Olive Young 상품 스크립트 조각, og meta 태그 순서로 제품명/가격/링크/이미지 후보를 추출합니다. `잠시만 기다려 주세요 - 올리브영` 같은 대기/차단 HTML은 import하지 않습니다.
- Amazon provider는 사용하지 않습니다. API key가 필요한 source는 기본 flow에서 제외했습니다.
- Open Beauty Facts 응답에서 product name, brand, image, product page, ingredient text를 가져와 기존 `Product` 모델로 normalize합니다.
- Open Beauty Facts는 가격 데이터를 제공하지 않는 경우가 많으므로, live product 가격은 비어 있을 수 있습니다. 기존 UI/API 호환을 위해 curated match가 있으면 기존 KRW 가격을 보강합니다.
- CosIng는 특정 제품의 전성분을 주는 DB가 아니라 성분 사전입니다. 따라서 제품 성분 목록은 Open Beauty Facts 또는 curated match를 우선합니다.

성분/알러지 정책:

- Olive Young snapshot에 전성분이 있으면 그 값을 사용합니다.
- Open Beauty Facts에 전성분이 있으면 그 값을 사용합니다.
- 없으면 기존 curated CSV와 title/brand fuzzy match해서 성분을 보강합니다.
- 알러지/avoid ingredient 조건이 있는데 live product의 전성분을 확인할 수 없으면 해당 live product는 추천에서 제외합니다.
- 성분이 없는 live product는 일반 추천에서 `ingredient list` missing data penalty를 받습니다.

Cache:

- `external_product_cache` SQLite table에 provider, external_id, title, brand, price, currency, image_url, detail_url, matched_curated_product_id, ingredients, fetched_at, expires_at을 저장합니다.
- 이미지는 다운로드하지 않고 provider가 반환한 URL만 사용합니다.
- cache TTL은 24시간입니다.

제품 DB를 바꿔 실행할 수도 있습니다.

```bash
python3 -m k_beauty_agent.cli "oily acne prone skin, fragrance-free toner" --db data/sample_products.json --limit 3
```

## 예시 동작

사용자:

```text
지성 피부에 맞는 기초 제품을 추천해줘
```

agent는 `지성`, `유분/피지`, `기초`를 감지하고 다음 기준으로 제품을 평가합니다.

- niacinamide, green tea, zinc PCA, salicylic acid 등 유분 조절 관련 근거 성분
- oily/combination skin suitability
- fragrance, salicylic allergy, pregnancy/nursing 같은 avoid 조건
- 리뷰에서 반복되는 장점/주의점
- 성분표나 리뷰 데이터 누락 여부

## Product DB 스키마

앱의 기본 운영 데이터는 `data/products_verified.csv`와 `data/review_summaries.csv`입니다. `data/sample_products.json`은 CLI 실험용 샘플 DB로 남겨두었습니다.

현재 검증 CSV는 header를 제외하고 50개 제품을 포함합니다. 카테고리는 cleanser, toner/pad, serum/ampoule/essence, moisturizer, sunscreen 중심으로 구성되어 있으며, 추천 로직과 알러지 차단은 이 CSV의 성분표를 우선 사용합니다.

필수 필드:

```json
{
  "id": "unique-id",
  "name": "Product name",
  "brand": "Brand name",
  "category": "toner",
  "country": "Korea",
  "ingredients": ["Water", "Niacinamide"]
}
```

권장 필드:

```json
{
  "claims": ["fragrance-free"],
  "suited_skin_types": ["oily", "combination"],
  "concerns": ["oil_control"],
  "avoid_for": ["sensitive"],
  "price_usd": 18.0,
  "rating": 4.4,
  "review_count": 1200,
  "reviews": ["Lightweight and absorbs quickly."],
  "evidence_notes": ["Verified ingredient list from official packaging."]
}
```

## 검증 데이터셋

### `data/products_verified.csv`

제품 추천과 필터링의 기준이 되는 메인 데이터셋입니다. 각 row는 하나의 K-beauty 제품을 나타냅니다.

주요 필드:

- `id`: 앱 내부에서 사용하는 고유 제품 ID
- `name`: 영어 또는 공식 제품명
- `display_name_ko`: 한국어 표시명. 확인되지 않은 경우 영어 제품명을 fallback으로 사용합니다.
- `brand`, `category`, `country`: 브랜드, 제품군, 국가
- `ingredients`: 알러지/회피 성분 차단에 쓰이는 성분 문자열
- `claims`: 제품 claims와 제형/사용감 힌트
- `suited_skin_types`: oily, dry, combination, sensitive 등 추천 피부 타입
- `concerns`: acne, oil_control, hydration, barrier_support, redness, pores 등 매칭 고민
- `avoid_for`: 민감성, 특정 성분군 등 주의 조건
- `price_usd`: 과거 호환용 USD 가격
- `rating`, `review_count`: 리뷰 신호가 확인된 경우의 평점/리뷰 수
- `source_url`: 제품 대표 출처
- `ingredient_source_url`: 전성분 확인 출처
- `verified_at`: 제품/성분 데이터 검증일
- `image_url`: 검증된 제품 이미지 URL. 임의 placeholder 이미지는 사용하지 않습니다.
- `image_verified_source`: 이미지 확인에 사용한 페이지
- `image_source_type`: `official`, `hwahae`, `glowpick`, `retailer`, `none`
- `image_confidence`: 검증 이미지이면 `verified`
- `image_view_type`: `single_product`, `verified_product`, `none`
- `oliveyoung_url`: 올리브영 구매/검색 링크
- `oliveyoung_price_krw`: 올리브영 KRW 가격 스냅샷
- `official_url`: 브랜드 공식 페이지
- `texture_tags`: gel, rich, lightweight 등 제형 태그
- `oliveyoung_verified_at`: 올리브영 가격 기준일. UI에서는 날짜와 시간을 함께 표시합니다.

검증 정책:

- 전성분이 확인되지 않은 제품은 알러지 필터 신뢰도가 낮아지므로 운영 DB에 넣지 않습니다.
- 알러지 입력은 `ingredients`와 지식베이스 alias를 기준으로 차단합니다. 예를 들어 히알루론산, 나이아신아마이드, 달팽이, 티트리 같은 입력은 해당 성분군을 포함한 제품을 제외하는 데 사용됩니다.
- 가격은 런타임 scraping을 하지 않고 CSV의 KRW 스냅샷만 사용합니다.
- 이미지 우선순위는 공식몰, 화해, 글로우픽, 신뢰 가능한 retailer 순서입니다. 검증되지 않은 유사 제품 이미지나 검색 썸네일은 쓰지 않습니다.
- 이미지가 없거나 정확성이 낮으면 `image_source_type=none`으로 두고 UI에서 이미지 없음 상태를 표시합니다.

### `data/review_summaries.csv`

제품별 리뷰 요약과 bilingual 표시를 위한 보조 데이터셋입니다.

주요 필드:

- `product_id`: `products_verified.csv`의 `id`와 연결되는 키
- `summary`: 한국어 리뷰 요약
- `summary_en`: 영어 리뷰 요약
- `common_positives`: 자주 언급되는 장점 키워드
- `common_cautions`: 자주 언급되는 주의점 키워드
- `source_url`: 리뷰/제품 요약 출처
- `verified_at`: 리뷰 요약 검토일

리뷰 요약은 런타임 자동 번역이 아니라 CSV에 저장된 문구를 사용합니다. 영어 화면에서는 `summary_en`, 한국어 화면에서는 `summary`를 표시합니다.

### 데이터 사용 범위와 한계

- 이 데이터셋은 추천 시스템 데모와 제품 비교/루틴 계산을 위한 큐레이션 데이터입니다.
- 의료적 효능, 치료 효과, 임상 결과를 보장하지 않습니다.
- 구매 링크와 가격은 수집 시점의 스냅샷이므로 실제 판매가와 다를 수 있습니다.
- 제품 리뉴얼이나 성분 변경이 있을 수 있으므로 배포 전에는 `ingredient_source_url`, `source_url`, `oliveyoung_verified_at`을 기준으로 재검증해야 합니다.

## 코드 구조

- `k_beauty_agent/skin.py`: 사용자 질의에서 피부 타입, 고민, 카테고리, 민감/알레르기 신호 추출
- `k_beauty_agent/database.py`: 제품 DB 로딩과 검색
- `k_beauty_agent/live_products.py`: Open Beauty Facts/CosIng keyless provider, external product cache, curated ingredient enrichment
- `k_beauty_agent/knowledge_base.py`: 성분별 효능, 적합 피부, 주의점, 근거 수준
- `k_beauty_agent/recommender.py`: rule-based ingredient scoring과 브랜드 다양성 정렬
- `k_beauty_agent/reviews.py`: DB 리뷰 스니펫 요약
- `k_beauty_agent/llm.py`: 선택적 LLM explainer guardrail
- `k_beauty_agent/agent.py`: 전체 agent orchestration
- `k_beauty_agent/web.py`: FastAPI 웹/API 서버
- `k_beauty_agent/storage.py`: SQLite 세션, 피드백, 로그, 모니터링 저장소
- `static/`: bilingual 웹 UI와 관리자 대시보드

## LLM hybrid 사용 방식

현재 기본 실행은 외부 API 없이 rule-based 결과를 출력합니다.
LLM을 붙일 때는 `LLMClient` 프로토콜을 구현해 `KBeautyAgent(database, llm_client=...)`에 주입하세요.

LLM은 다음을 지켜야 합니다.

- rule engine 결과에 없는 제품을 추가하지 않기
- DB에 없는 효능, 임상 결과, 리뷰를 만들지 않기
- 근거 부족, 성분표 누락, 민감성 risk를 유지하기
- promotional language 금지

## 안전한 fallback

다음 상황에서는 추천을 약하게 하거나 질문합니다.

- 피부 타입과 주요 고민이 모두 불분명함
- 제품 성분표가 없음
- 요청한 고민과 매칭되는 근거 성분이 없음
- 알레르기/임신/수유/민감성 신호와 제품 성분이 충돌함

이 agent는 화장품 선택을 돕는 도구이며 의학적 진단이나 치료를 대체하지 않습니다.
