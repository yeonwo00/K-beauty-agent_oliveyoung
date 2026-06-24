const LANGUAGE_STORAGE_KEY = "kBeautyAgentLanguage";
const IS_STATIC_DEMO = window.location.hostname.endsWith("github.io");

const state = {
  lang: readStoredLanguage(),
  recommendationId: null,
  profile: {},
  productsById: new Map(),
  allProducts: [],
  currentResults: [],
  routineSelectedIds: new Set(),
  routineKnownSavedIds: new Set(),
  selections: { saved_ids: [], compare_ids: [], saved_products: [], compare_products: [], total_cost_krw: 0 },
};

const uiText = {
  ko: {
    statusIdle: "퀴즈를 제출하면 3-5개의 추천 카드가 여기에 표시됩니다.",
    profileEmpty: "세션 프로필이 아직 없습니다.",
    submitStatus: "피부 타입, 성분, 예산을 분석하는 중...",
    followUpStatus: "후속 조건을 반영하는 중...",
    requestFailed: "추천 요청에 실패했습니다.",
    complete: "추천 완료",
    followUpComplete: "후속 조건 반영",
    resultCount: "추천 결과 {count}개",
    followUpResultCount: "후속 조건을 반영한 추천 {count}개",
    staticDemoResultCount: "정적 데모 추천 결과 {count}개",
    criteriaReset: "검색 기준을 초기화했습니다.",
    noCurrentResults: "먼저 추천 결과를 받아주세요.",
    allCompareAdded: "현재 추천 제품 {count}개를 비교에 추가했습니다.",
    allRoutineAdded: "현재 추천 제품 {count}개를 루틴에 담았습니다.",
    criteriaTitle: "검색 기준",
    recommendationGuide: "추천 카드는 사용자 조건과 제품 근거의 적합도를 기준으로 정렬되며, 카드 안의 중요 성분은 추천 근거에서 중요한 순서로 표시됩니다.",
    reset: "세션이 초기화되었습니다.",
    noReason: "추천 이유 데이터가 아직 없습니다.",
    noReview: "리뷰 요약 데이터가 아직 없습니다.",
    noReviewShort: "리뷰 요약 없음",
    actualReviews: "선별 실제 리뷰",
    positiveReview: "좋았다는 리뷰",
    negativeReview: "아쉬웠다는 리뷰",
    reviewSource: "리뷰 출처",
    noSkinFit: "피부 적합도 데이터 없음",
    needPrice: "가격 확인 필요",
    noSpecialCaution: "특별 주의 데이터 없음",
    compareAdd: "비교 추가",
    routineAdd: "루틴 담기",
    selected: "선택됨",
    saved: "저장됨",
    save: "저장",
    compare: "비교",
    remove: "삭제",
    oliveyoung: "올리브영",
    official: "브랜드 공식몰",
    buyLink: "구매 링크",
    recommendedReason: "추천 이유",
    ingredients: "중요 성분",
    review: "리뷰",
    combo: "추천 조합",
    cost: "가격",
    skinCompatibility: "피부 적합도",
    ingredient: "성분",
    compareStandard: "비교 기준",
    image: "이미지",
    verifiedDate: "기준일",
    officialImage: "공식 이미지",
    hwahaeImage: "화해 이미지",
    glowpickImage: "글로우픽 이미지",
    openBeautyFactsImage: "Open Beauty Facts 이미지",
    oliveyoungSnapshotImage: "올리브영 스냅샷 이미지",
    retailerImage: "리테일러 이미지",
    imageMissing: "이미지 없음",
    modalTitle: "성분",
    evidenceLevel: "근거 수준",
    supportConcerns: "도움 고민",
    suitableSkin: "적합 피부",
    caution: "주의",
    compareEmpty: "비교로 선택한 제품들이 여기에 모입니다.",
    routineEmpty: "저장한 제품이 장바구니 형식으로 표시됩니다.",
    total: "총액",
    selectedTotal: "선택 제품 총액",
    blockedIngredients: "차단 성분",
    selectAll: "전체 선택",
    deselectAll: "전체 해제",
    clearAll: "전체 삭제",
    compareSelected: "선택 제품 비교",
    budgetNone: "제한 없음",
  },
  en: {
    statusIdle: "Submit the quiz to see 3-5 recommendation cards here.",
    profileEmpty: "No session profile yet.",
    submitStatus: "Analyzing skin type, ingredients, and budget...",
    followUpStatus: "Applying follow-up conditions...",
    requestFailed: "Recommendation request failed.",
    complete: "Recommendation complete",
    followUpComplete: "Follow-up applied",
    resultCount: "{count} recommendations",
    followUpResultCount: "{count} recommendations after follow-up",
    staticDemoResultCount: "{count} static demo recommendations",
    criteriaReset: "Search criteria have been reset.",
    noCurrentResults: "Get recommendations first.",
    allCompareAdded: "Added {count} current recommendations to compare.",
    allRoutineAdded: "Added {count} current recommendations to routine.",
    criteriaTitle: "Search criteria",
    recommendationGuide: "Recommendation cards are ordered by fit to your criteria. Key ingredients inside each card are shown in order of recommendation importance.",
    reset: "Session has been reset.",
    noReason: "No recommendation rationale yet.",
    noReview: "No review summary yet.",
    noReviewShort: "No review summary",
    actualReviews: "Selected actual reviews",
    positiveReview: "Positive review",
    negativeReview: "Critical review",
    reviewSource: "Review source",
    noSkinFit: "No skin compatibility data",
    needPrice: "Price check needed",
    noSpecialCaution: "No special caution data",
    compareAdd: "Add to compare",
    routineAdd: "Add to routine",
    selected: "Selected",
    saved: "Saved",
    save: "Save",
    compare: "Compare",
    remove: "Remove",
    oliveyoung: "Olive Young",
    official: "Official",
    buyLink: "Purchase link",
    recommendedReason: "Why recommended",
    ingredients: "Key ingredients",
    review: "Review",
    combo: "Recommended combination",
    cost: "Cost",
    skinCompatibility: "Skin compatibility",
    ingredient: "Ingredients",
    compareStandard: "Compare by",
    image: "Image",
    verifiedDate: "Verified",
    officialImage: "Official image",
    hwahaeImage: "Hwahae image",
    glowpickImage: "Glowpick image",
    openBeautyFactsImage: "Open Beauty Facts image",
    oliveyoungSnapshotImage: "Olive Young snapshot image",
    retailerImage: "Retailer image",
    imageMissing: "No image",
    modalTitle: "Ingredient",
    evidenceLevel: "Evidence level",
    supportConcerns: "Supports",
    suitableSkin: "Suitable for",
    caution: "Caution",
    compareEmpty: "Products selected for comparison will appear here.",
    routineEmpty: "Saved products will appear as a routine cart.",
    total: "Total",
    selectedTotal: "Selected total",
    blockedIngredients: "Blocked ingredients",
    selectAll: "Select all",
    deselectAll: "Deselect all",
    clearAll: "Clear all",
    compareSelected: "Compare selected",
    budgetNone: "No limit",
  },
};

const labels = {
  ko: {
    skin_type: "피부 타입",
    concerns: "고민",
    desired_categories: "제품군",
    preferred_ingredients: "선호 성분",
    max_price_krw: "예산",
    min_price_krw: "최소 가격",
    texture_preference: "제형",
    allergies: "알러지",
    avoid_ingredients: "피해야 할 성분",
  },
  en: {
    skin_type: "Skin type",
    concerns: "Concerns",
    desired_categories: "Product type",
    preferred_ingredients: "Preferred ingredients",
    max_price_krw: "Budget",
    min_price_krw: "Minimum price",
    texture_preference: "Texture",
    allergies: "Allergies",
    avoid_ingredients: "Avoid ingredients",
  },
};

const valueLabels = {
  ko: {
    oily: "지성",
    dry: "건성",
    combination: "복합성",
    sensitive: "민감성",
    normal: "보통",
    oil_control: "유분",
    acne: "트러블",
    clogged_pores: "막힌 모공",
    hydration: "수분",
    barrier_support: "장벽",
    redness: "홍조",
    hyperpigmentation: "잡티",
    dryness: "건조",
    pores: "모공",
    cleanser: "클렌저",
    toner: "토너",
    serum: "세럼",
    moisturizer: "수분크림",
    sunscreen: "선크림",
    basic: "기초 루틴",
    dewy: "촉촉",
    lightweight: "산뜻",
    rich: "꾸덕",
    gel: "젤",
    niacinamide: "나이아신아마이드",
    "salicylic acid": "살리실산/BHA",
    "green tea extract": "녹차 추출물",
    panthenol: "판테놀",
    "ceramide np": "세라마이드",
    glycerin: "글리세린",
    "hyaluronic acid": "히알루론산",
    "centella asiatica": "병풀/시카",
    "houttuynia cordata": "어성초",
    "houttuynia cordata extract": "어성초 추출물",
    water: "정제수",
    "cocamidopropyl betaine": "코카미도프로필베타인",
    "sodium lauroyl methyl isethionate": "소듐라우로일메틸이세티오네이트",
    "butylene glycol": "부틸렌글라이콜",
    "tea tree leaf oil": "티트리잎오일",
    allantoin: "알란토인",
    "betaine salicylate": "베타인살리실레이트",
    "citric acid": "시트릭애씨드",
    betaine: "베타인",
    "portulaca oleracea extract": "쇠비름 추출물",
    madecassoside: "마데카소사이드",
    "shea butter": "시어버터",
    "sunflower seed oil": "해바라기씨오일",
    "sodium hyaluronate": "소듐하이알루로네이트",
    "snail secretion filtrate": "달팽이 점액 여과물",
    "rice extract": "쌀 추출물",
    "probiotic ferment": "프로바이오틱 발효물",
    squalane: "스쿠알란",
    "rice bran extract": "쌀겨 추출물",
    "calendula extract": "카렌듈라 추출물",
    "papaya extract": "파파야 추출물",
    "sea buckthorn extract": "비타민나무 추출물",
    fragrance: "향료",
    alcohol: "알코올",
    snail: "달팽이",
    "tea tree": "티트리",
    propolis: "프로폴리스",
    "tranexamic acid": "트라넥사믹애씨드",
    arbutin: "알부틴",
    "ascorbic acid": "비타민 C",
    "zinc oxide": "징크옥사이드",
    "onion extract": "양파 추출물",
    mugwort: "쑥",
    honey: "꿀",
    ginseng: "인삼",
    "bifida ferment": "비피다 발효물",
    "lactobacillus ferment": "락토바실러스 발효물",
    "glutathione": "글루타치온",
  },
  en: {
    oily: "oily",
    dry: "dry",
    combination: "combination",
    sensitive: "sensitive",
    normal: "normal",
    oil_control: "oil control",
    acne: "acne",
    clogged_pores: "clogged pores",
    hydration: "hydration",
    barrier_support: "barrier support",
    redness: "redness",
    hyperpigmentation: "dark spots",
    dryness: "dryness",
    pores: "pores",
    cleanser: "cleanser",
    toner: "toner",
    serum: "serum",
    moisturizer: "moisturizer",
    sunscreen: "sunscreen",
    basic: "basic routine",
    dewy: "dewy",
    lightweight: "lightweight",
    rich: "rich",
    gel: "gel",
    niacinamide: "niacinamide",
    "salicylic acid": "salicylic acid / BHA",
    "green tea extract": "green tea extract",
    panthenol: "panthenol",
    "ceramide np": "ceramide NP",
    glycerin: "glycerin",
    "hyaluronic acid": "hyaluronic acid",
    "centella asiatica": "centella asiatica / cica",
    fragrance: "fragrance",
    alcohol: "alcohol",
    snail: "snail",
    "tea tree": "tea tree",
    "rice extract": "rice extract",
    propolis: "propolis",
    "tranexamic acid": "tranexamic acid",
    arbutin: "arbutin",
    "ascorbic acid": "vitamin C",
    "zinc oxide": "zinc oxide",
    "onion extract": "onion extract",
    mugwort: "mugwort",
    honey: "honey",
    ginseng: "ginseng",
    "bifida ferment": "bifida ferment",
    "lactobacillus ferment": "lactobacillus ferment",
    "houttuynia cordata": "houttuynia cordata",
    madecassoside: "madecassoside",
    glutathione: "glutathione",
  },
};

const koreanOfficialMallByBrand = {
  "AXIS-Y": "https://www.axis-y.com/",
  Abib: "https://www.abib.com/",
  Aestura: "https://www.aestura.com/web/main.do",
  Anua: "https://www.anua.kr/",
  "Banila Co": "https://www.banila.com/",
  "Beauty of Joseon": "https://beautyofjoseon.com/",
  COSRX: "https://www.cosrx.co.kr/",
  "Dr.G": "https://www.dr-g.co.kr/main",
  ETUDE: "https://www.etude.com/brand/beautizen/korean/",
  Goodal: "https://clubclio.co.kr/",
  "Haruharu Wonder": "https://haruharuwonder.com/",
  "I'm From": "https://www.imfrom.co.kr/",
  Illiyoon: "https://www.illiyoon.com/",
  Isntree: "https://www.isntree.com/",
  Mediheal: "https://www.medihealshop.com/",
  Mixsoon: "https://www.mixsoon.co.kr/",
  Needly: "https://needly.co.kr/",
  Numbuzin: "https://www.numbuzin.com/",
  "Round Lab": "https://roundlab.co.kr/",
  SKIN1004: "https://www.skin1004.com/",
  TIRTIR: "https://tirtir.co.kr/",
  Torriden: "https://www.torriden.com/",
  "ma:nyo": "https://www.manyo.co.kr/",
};

const STATIC_PRODUCTS = [
  {
    id: "cosrx-low-ph-good-morning-gel-cleanser",
    name: "COSRX Low pH Good Morning Gel Cleanser",
    display_name_ko: "코스알엑스 약산성 굿모닝 젤 클렌저",
    brand: "COSRX",
    category: "cleanser",
    ingredients: ["cocamidopropyl betaine", "tea tree leaf oil", "betaine salicylate", "citric acid"],
    display_ingredients_ko: ["코카미도프로필베타인", "티트리잎오일", "베타인살리실레이트", "시트릭애씨드"],
    suited_skin_types: ["oily", "combination", "normal"],
    concerns: ["oil_control", "acne", "pores"],
    texture_tags: ["gel", "lightweight"],
    oliveyoung_price_krw: 11500,
    rating: 4.6,
    review_count: 12000,
    image_url: "",
    image_source_type: "official",
    image_confidence: "",
    oliveyoung_url: "https://www.oliveyoung.co.kr/",
    official_url: "https://www.cosrx.co.kr/",
    review_summary: "가볍고 산뜻한 세정감이 강점이며, 지성/복합성 피부의 아침 세안용으로 많이 선택됩니다.",
    review_summary_en: "Light gel cleansing texture with a fresh finish, commonly favored for oily or combination morning routines.",
    positive_reviews: ["세안 후 답답함이 적고 산뜻하다는 반응이 많습니다.", "젤 타입이라 아침에 쓰기 편하다는 의견이 있습니다."],
    negative_reviews: ["건성 피부에는 세안 후 건조하게 느껴질 수 있습니다."],
    positive_reviews_en: ["Many reviews mention a fresh finish after cleansing.", "The gel texture is considered easy for morning use."],
    negative_reviews_en: ["Dry skin users may find it slightly drying."],
    ingredient_explanations: ingredientExplanations(["cocamidopropyl betaine", "tea tree leaf oil", "betaine salicylate"]),
  },
  {
    id: "anua-heartleaf-77-soothing-toner",
    name: "Anua Heartleaf 77 Soothing Toner",
    display_name_ko: "아누아 어성초 77 수딩 토너",
    brand: "Anua",
    category: "toner",
    ingredients: ["houttuynia cordata extract", "glycerin", "butylene glycol", "betaine"],
    display_ingredients_ko: ["어성초 추출물", "글리세린", "부틸렌글라이콜", "베타인"],
    suited_skin_types: ["sensitive", "combination", "oily"],
    concerns: ["redness", "hydration", "barrier_support"],
    texture_tags: ["lightweight", "dewy"],
    oliveyoung_price_krw: 24000,
    rating: 4.7,
    review_count: 18000,
    image_url: "",
    image_source_type: "official",
    image_confidence: "",
    oliveyoung_url: "https://www.oliveyoung.co.kr/",
    official_url: "https://www.anua.kr/",
    review_summary: "가벼운 토너 제형과 진정 루틴에 대한 만족도가 높고, 민감 피부가 무난하게 쓰기 좋다는 신호가 있습니다.",
    review_summary_en: "A lightweight soothing toner with strong signals for sensitive and redness-focused routines.",
    positive_reviews: ["피부가 예민할 때 부담 없이 쓰기 좋다는 후기가 많습니다.", "흡수가 빠르고 끈적임이 적다는 의견이 있습니다."],
    negative_reviews: ["뚜렷한 기능성 변화를 기대하면 아쉽다는 반응도 있습니다."],
    positive_reviews_en: ["Many users like it for low-irritation soothing routines.", "It absorbs quickly with minimal stickiness."],
    negative_reviews_en: ["Some users find the functional effect subtle."],
    ingredient_explanations: ingredientExplanations(["houttuynia cordata extract", "glycerin", "betaine"]),
  },
  {
    id: "skin1004-madagascar-centella-ampoule",
    name: "SKIN1004 Madagascar Centella Ampoule",
    display_name_ko: "스킨1004 마다가스카르 센텔라 앰플",
    brand: "SKIN1004",
    category: "serum",
    ingredients: ["centella asiatica", "madecassoside", "glycerin"],
    display_ingredients_ko: ["병풀/시카", "마데카소사이드", "글리세린"],
    suited_skin_types: ["sensitive", "oily", "combination"],
    concerns: ["redness", "barrier_support", "hydration"],
    texture_tags: ["lightweight", "dewy"],
    oliveyoung_price_krw: 22000,
    rating: 4.7,
    review_count: 15000,
    image_url: "",
    image_source_type: "official",
    image_confidence: "",
    oliveyoung_url: "https://www.oliveyoung.co.kr/",
    official_url: "https://www.skin1004.com/",
    review_summary: "병풀 중심의 단순한 진정 루틴을 원하는 사용자에게 적합하며, 가벼운 앰플 제형이 특징입니다.",
    review_summary_en: "A simple centella-forward ampoule for lightweight soothing and barrier-support routines.",
    positive_reviews: ["피부가 민감할 때 레이어링하기 편하다는 후기가 있습니다.", "묽고 가벼워 여러 단계 루틴에 넣기 쉽다는 의견이 많습니다."],
    negative_reviews: ["보습감이 강한 제품을 원하는 경우 단독 사용은 가볍게 느껴질 수 있습니다."],
    positive_reviews_en: ["Users like it for gentle layering when skin feels sensitive.", "The watery texture is easy to add to multi-step routines."],
    negative_reviews_en: ["It may feel too light as a standalone moisturizing step."],
    ingredient_explanations: ingredientExplanations(["centella asiatica", "madecassoside", "glycerin"]),
  },
  {
    id: "etude-soonjung-2x-barrier-intensive-cream",
    name: "ETUDE SoonJung 2x Barrier Intensive Cream",
    display_name_ko: "에뛰드 순정 2x 베리어 인텐시브 크림",
    brand: "ETUDE",
    category: "moisturizer",
    ingredients: ["panthenol", "madecassoside", "glycerin", "shea butter"],
    display_ingredients_ko: ["판테놀", "마데카소사이드", "글리세린", "시어버터"],
    suited_skin_types: ["dry", "sensitive", "normal"],
    concerns: ["barrier_support", "dryness", "redness"],
    texture_tags: ["rich"],
    oliveyoung_price_krw: 21000,
    rating: 4.6,
    review_count: 9800,
    image_url: "",
    image_source_type: "official",
    image_confidence: "",
    oliveyoung_url: "https://www.oliveyoung.co.kr/",
    official_url: "https://www.etude.com/",
    review_summary: "장벽 보습을 원하는 건성/민감 피부 루틴에 적합하며, 크림 단계에서 수분감을 오래 잡아주는 편입니다.",
    review_summary_en: "A barrier-focused cream for dry or sensitive routines that need a richer sealing step.",
    positive_reviews: ["자극감이 적고 보습막이 오래간다는 의견이 많습니다.", "민감해진 피부에 기본 크림으로 쓰기 좋다는 후기가 있습니다."],
    negative_reviews: ["지성 피부에는 다소 무겁게 느껴질 수 있습니다."],
    positive_reviews_en: ["Many users mention low irritation and lasting moisture.", "It works well as a basic cream for sensitive skin days."],
    negative_reviews_en: ["It can feel heavy for oily skin."],
    ingredient_explanations: ingredientExplanations(["panthenol", "madecassoside", "glycerin"]),
  },
  {
    id: "isntree-hyaluronic-acid-watery-sun-gel",
    name: "Isntree Hyaluronic Acid Watery Sun Gel",
    display_name_ko: "이즈앤트리 히아루론산 워터리 선 젤",
    brand: "Isntree",
    category: "sunscreen",
    ingredients: ["hyaluronic acid", "niacinamide", "panthenol", "centella asiatica"],
    display_ingredients_ko: ["히알루론산", "나이아신아마이드", "판테놀", "병풀/시카"],
    suited_skin_types: ["dry", "combination", "normal"],
    concerns: ["hydration", "barrier_support", "hyperpigmentation"],
    texture_tags: ["dewy", "lightweight"],
    oliveyoung_price_krw: 26000,
    rating: 4.6,
    review_count: 11000,
    image_url: "",
    image_source_type: "official",
    image_confidence: "",
    oliveyoung_url: "https://www.oliveyoung.co.kr/",
    official_url: "https://www.isntree.com/",
    review_summary: "촉촉한 마무리의 선 젤로, 건조함이 느껴지는 아침 루틴에서 선크림과 수분감을 함께 챙기기 좋습니다.",
    review_summary_en: "A dewy sun gel that combines daily sunscreen use with a hydrated finish.",
    positive_reviews: ["백탁이 적고 촉촉하다는 반응이 많습니다.", "메이크업 전에도 부담이 적다는 의견이 있습니다."],
    negative_reviews: ["번들거림을 싫어하면 마무리가 촉촉하게 느껴질 수 있습니다."],
    positive_reviews_en: ["Many users mention minimal white cast and a hydrated finish.", "It is often considered comfortable before makeup."],
    negative_reviews_en: ["Users who dislike shine may find the finish too dewy."],
    ingredient_explanations: ingredientExplanations(["hyaluronic acid", "niacinamide", "panthenol"]),
  },
];

function ingredientExplanations(names) {
  return names.map((name) => {
    const label = valueLabels.ko[name] || name;
    return {
      name,
      label: name,
      display_name_ko: label,
      rationale: `${name} is included as a supporting ingredient for the selected routine.`,
      display_rationale_ko: `${label} 성분은 선택한 루틴의 피부 고민을 보조하는 성분으로 표시됩니다.`,
      evidence_level: "moderate",
      supports: ["hydration", "barrier_support"],
      display_supports_ko: ["수분", "장벽"],
      suitable_for: ["normal", "combination", "sensitive"],
      display_suitable_for_ko: ["보통", "복합성", "민감성"],
      cautions: [],
      display_cautions_ko: [],
    };
  });
}

function text(key) {
  return uiText[state.lang]?.[key] || uiText.ko[key] || key;
}

function setLanguage(lang) {
  state.lang = lang === "en" ? "en" : "ko";
  storeLanguage(state.lang);
  applyLanguage();
  updateBudgetLabel();
  renderProfile(state.profile);
  renderRoutine();
  renderCompareSummary();
  renderCatalogs();
  if (state.selections.compare_products?.length) renderCompareTable();
  if (window.lucide) window.lucide.createIcons();
}

function readStoredLanguage() {
  try {
    return window.localStorage?.getItem(LANGUAGE_STORAGE_KEY) === "en" ? "en" : "ko";
  } catch {
    return "ko";
  }
}

function storeLanguage(lang) {
  try {
    window.localStorage?.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Language persistence is a convenience; private browsing/storage blocks should not break the app.
  }
}

function applyLanguage() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === state.lang);
  });
  applyStaticLanguage();
}

function applyStaticLanguage() {
  const en = state.lang === "en";
  setTextAny([".nav-link[href='/#hero']", ".nav-link[href='./#hero']"], en ? "Home" : "홈");
  setTextAny([".nav-link[href='/#quiz']", ".nav-link[href='./#quiz']"], en ? "Skin Quiz" : "피부 퀴즈");
  setTextAny([".nav-link[href='/#recommendation']", ".nav-link[href='./#recommendation']"], en ? "Recommendations" : "추천");
  setTextAny([".nav-link[href='/compare']", ".nav-link[href='./#compare']"], en ? "Product Compare" : "제품 비교");
  setTextAny([".nav-link[href='/routine']", ".nav-link[href='./#routine']"], en ? "Personal Routine" : "개인 루틴");
  setText(".hero-copy .eyebrow", en ? "K-beauty agent for ingredients and budget" : "성분과 예산을 함께 보는 K-뷰티 에이전트");
  setText(".hero-cta-wrap > span", en ? "Reflects skin type, allergies, and budget in about 30 seconds." : "30초 안에 피부 타입, 알러지, 예산을 반영합니다.");
  setText("#quiz .mini-label", en ? "Skin Quiz" : "피부 퀴즈");
  setText("#quiz h2", en ? "Choose your skin and buying conditions" : "피부와 구매 조건을 선택해 주세요");
  setText("#recommendation .mini-label", en ? "Recommendations" : "추천 결과");
  setText("#recommendation h2", en ? "Recommended products and reasons" : "추천 제품과 선택 이유");
  setText("#compare .mini-label", en ? "Product Compare" : "제품 비교");
  setText("#compare h2", en ? "Compare selected products" : "선택한 제품 비교");
  setText("#compareSelected span", text("compareSelected"));
  setText("#compareClearAll span", text("clearAll"));
  setText("#compare .catalog-title .mini-label", en ? "All Products" : "전체 상품");
  setText("#compare .catalog-title h2", en ? "Choose products to compare" : "비교할 제품을 선택하세요");
  setText("#routine .mini-label", en ? "Personal Routine" : "개인 루틴");
  setText("#routine h2", en ? "Saved product cart" : "저장한 제품 장바구니");
  setTotalLabel();
  setText("#routine .catalog-title .mini-label", en ? "All Products" : "전체 상품");
  setText("#routine .catalog-title h2", en ? "Choose products for your routine" : "루틴에 담을 제품을 선택하세요");
  setText("#status", text("statusIdle"));
  setText(".criteria-title", text("criteriaTitle"));
  setText("#recommendationGuide", text("recommendationGuide"));
  setText("#ingredientModalTitle", text("modalTitle"));

  setLegend(0, en ? "Skin type" : "피부 타입");
  setLegend(1, en ? "Product type" : "제품 타입");
  setLegend(2, en ? "Main concern" : "주요 고민");
  setLegend(3, en ? "Texture preference" : "선호 제형");
  setLegend(4, en ? "Budget and allergies" : "예산과 알러지");
  setText("label[for='budget']", en ? "Max budget" : "최대 예산");
  setText(".text-field span", en ? "Allergy / ingredients to avoid" : "알러지/피해야 할 성분");
  setText("#quizForm button[type='submit'] span", en ? "Get recommendations" : "추천 받기");
  setText("#followUpForm button span", en ? "Apply" : "반영");
  setPlaceholder("#allergyInput", en ? "e.g. fragrance, snail, alcohol, hyaluronic acid" : "예: 향료, 달팽이, 알코올, 히알루론산");
  setPlaceholder("#followUpQuery", en ? "Add follow-up conditions: e.g. under ₩20,000 with niacinamide" : "후속 조건 추가: 예) 나이아신아마이드 들어간 2만원 이하 제품");

  setBudgetOptions(en);
  setChoiceLabels(en);
}

function setText(selector, value) {
  const node = document.querySelector(selector);
  if (node) node.textContent = value;
}

function setTextAny(selectors, value) {
  selectors.forEach((selector) => setText(selector, value));
}

function setPlaceholder(selector, value) {
  const node = document.querySelector(selector);
  if (node) node.placeholder = value;
}

function setLegend(index, value) {
  const legend = document.querySelectorAll("legend")[index];
  if (legend) legend.textContent = value;
}

function setTotalLabel() {
  setText("[data-total-label]", text("total"));
  setText("[data-selected-total-label]", text("selectedTotal"));
}

function setBudgetOptions(en) {
  const options = [...document.querySelectorAll("#budget option")];
  const labels = en
    ? ["No price limit", "Under ₩10,000", "Under ₩20,000", "Under ₩30,000", "Under ₩40,000", "Under ₩50,000", "Under ₩60,000"]
    : ["가격 선택 안함", "₩10,000 이하", "₩20,000 이하", "₩30,000 이하", "₩40,000 이하", "₩50,000 이하", "₩60,000 이하"];
  options.forEach((option, index) => {
    option.textContent = labels[index] || option.textContent;
  });
}

function setChoiceLabels(en) {
  const labels = {
    skinType: en ? ["Oily", "Dry", "Combination", "Sensitive", "No selection"] : ["지성", "건성", "복합성", "민감성", "선택 안함"],
    productType: en
      ? [
          "Cleanser / foam",
          "Cleansing oil",
          "Toner / skin",
          "Toner pad",
          "Mist",
          "Serum / ampoule",
          "Essence",
          "Moisturizer",
          "Lotion / emulsion",
          "Sunscreen",
          "Sheet mask",
          "Eye cream",
          "Lip care",
          "Basic routine",
          "No selection",
        ]
      : [
          "클렌저/폼",
          "클렌징오일",
          "토너/스킨",
          "토너패드",
          "미스트",
          "세럼/앰플",
          "에센스",
          "수분크림",
          "로션/에멀전",
          "선크림",
          "마스크팩",
          "아이크림",
          "립케어",
          "기초 루틴",
          "선택 안함",
        ],
    mainConcern: en ? ["Acne", "Oil", "Hydration", "Barrier", "Redness", "Dark spots", "Pores", "No selection"] : ["트러블", "유분", "수분", "장벽", "홍조", "잡티", "모공", "선택 안함"],
    texture: en ? ["Dewy", "Lightweight", "Rich", "Gel", "No selection"] : ["촉촉", "산뜻", "꾸덕", "젤", "선택 안함"],
  };
  Object.entries(labels).forEach(([name, values]) => {
    document.querySelectorAll(`input[name="${name}"]`).forEach((input, index) => {
      const label = input.closest("label");
      if (!label) return;
      [...label.childNodes].forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) node.textContent = ` ${values[index] || node.textContent.trim()}`;
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  applyPageMode();
  bindEvents();
  applyLanguage();
  updateBudgetLabel();
  await loadProducts();
  await loadSession();
  await loadSelections();
  if (window.lucide) window.lucide.createIcons();
});

function bindEvents() {
  document.querySelector("#quizForm").addEventListener("submit", (event) => {
    event.preventDefault();
    submitRecommendation(false, buildQuizQuery());
  });
  document.querySelector("#followUpForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = document.querySelector("#followUpQuery");
    const query = input.value.trim();
    if (handleCommand(query)) return;
    submitRecommendation(hasProfileSignal(state.profile), query);
  });
  document.querySelector("#budget").addEventListener("change", updateBudgetLabel);
  document.querySelector("#resetSession").addEventListener("click", resetSession);
  document.querySelector("#compareSelected").addEventListener("click", renderCompareTable);
  document.querySelector("#compareClearAll").addEventListener("click", clearCompareSelections);
  document.querySelectorAll("[data-choice-group]").forEach((group) => {
    group.addEventListener("change", (event) => syncNoneChoice(group, event.target));
  });
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => setLanguage(button.dataset.lang));
  });
}

function buildQuizQuery() {
  const skinTypes = selectedValues("skinType");
  const productTypes = selectedValues("productType");
  const concerns = selectedValues("mainConcern");
  const textures = selectedValues("texture");
  const budget = document.querySelector("#budget").value;
  const allergy = document.querySelector("#allergyInput").value.trim();
  const parts = [];
  if (skinTypes.length) parts.push(`${skinTypes.join(", ")} 피부`);
  if (productTypes.length) parts.push(`${productTypes.join(", ")} 추천`);
  if (concerns.length) parts.push(`주요 고민은 ${concerns.join(", ")}`);
  if (textures.length) parts.push(`${textures.join(", ")} 제형 선호`);
  if (budget) parts.push(`${budget}원 이하`);
  if (allergy) parts.push(`${allergy} 성분은 피하고 싶어`);
  if (!parts.length) parts.push("기초 제품 추천");
  return parts.join(", ");
}

function selectedValues(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value).filter(Boolean);
}

function updateBudgetLabel() {
  const value = document.querySelector("#budget").value;
  document.querySelector("#budgetValue").textContent = value ? krw(Number(value)) : text("budgetNone");
}

function syncNoneChoice(group, target) {
  if (!target.matches("input[type='checkbox']")) return;
  const inputs = [...group.querySelectorAll("input[type='checkbox']")];
  const none = inputs.find((input) => input.dataset.none !== undefined);
  if (!none) return;
  if (target === none && none.checked) {
    inputs.filter((input) => input !== none).forEach((input) => {
      input.checked = false;
    });
  } else if (target !== none && target.checked) {
    none.checked = false;
  }
}

async function apiJson(url, options) {
  const response = await fetch(url, options);
  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }
  if (!response.ok) {
    const error = new Error(data.detail || `${response.status} ${response.statusText}`);
    error.data = data;
    throw error;
  }
  return data;
}

function loadStaticProducts() {
  state.allProducts = STATIC_PRODUCTS.map(cloneData);
  state.productsById.clear();
  state.allProducts.forEach((product) => state.productsById.set(product.id, product));
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function emptySelections() {
  return { saved_ids: [], compare_ids: [], saved_products: [], compare_products: [], total_cost_krw: 0 };
}

function syncStaticSelections() {
  state.selections.saved_ids = [...new Set(state.selections.saved_ids || [])];
  state.selections.compare_ids = [...new Set(state.selections.compare_ids || [])];
  state.selections.saved_products = state.selections.saved_ids.map((id) => state.productsById.get(id)).filter(Boolean);
  state.selections.compare_products = state.selections.compare_ids.map((id) => state.productsById.get(id)).filter(Boolean);
  state.selections.total_cost_krw = state.selections.saved_products.reduce((sum, product) => sum + productKrwValue(product), 0);
}

function buildStaticProfile(query) {
  const normalizedQuery = normalizeText(query);
  const profile = {
    skin_type: normalizeSkinTypes(selectedValues("skinType")),
    concerns: normalizeConcernValues(selectedValues("mainConcern")),
    desired_categories: normalizeCategoryValues(selectedValues("productType")),
    texture_preference: normalizeTextureValues(selectedValues("texture")),
    max_price_krw: Number(document.querySelector("#budget")?.value || 0) || inferBudgetKrw(normalizedQuery) || null,
    allergies: normalizeAvoidTerms(document.querySelector("#allergyInput")?.value || ""),
    preferred_ingredients: inferPreferredIngredients(normalizedQuery),
  };
  profile.avoid_ingredients = [...new Set(profile.allergies)];
  if (!profile.desired_categories.length) {
    profile.desired_categories = inferCategories(normalizedQuery);
  }
  if (!profile.concerns.length) {
    profile.concerns = inferConcerns(normalizedQuery);
  }
  if (!profile.skin_type.length) {
    profile.skin_type = inferSkinTypes(normalizedQuery);
  }
  return profile;
}

function buildStaticRecommendation(query, isFollowUp = false) {
  if (!state.allProducts.length) loadStaticProducts();
  const profile = isFollowUp && hasProfileSignal(state.profile) ? mergeStaticProfile(state.profile, buildStaticProfile(query)) : buildStaticProfile(query);
  const avoidTerms = (profile.avoid_ingredients || []).map(normalizeText).filter(Boolean);
  const maxPrice = Number(profile.max_price_krw || 0);
  const scored = state.allProducts
    .filter((product) => !avoidTerms.some((term) => product.ingredients?.some((ingredient) => normalizeText(ingredient).includes(term))))
    .map((product) => ({ product, score: staticProductScore(product, profile, query) }))
    .filter((item) => !maxPrice || productKrwValue(item.product) <= maxPrice || item.score >= 3)
    .sort((left, right) => right.score - left.score || productKrwValue(left.product) - productKrwValue(right.product))
    .slice(0, 5)
    .map((item) => staticResultItem(item.product, profile, item.score));
  const results = scored.length ? scored : state.allProducts.slice(0, 5).map((product) => staticResultItem(product, profile, 1));
  return {
    recommendation_id: `static-${Date.now()}`,
    profile,
    results,
  };
}

function mergeStaticProfile(previous, next) {
  const merged = { ...previous, ...next };
  ["skin_type", "concerns", "desired_categories", "texture_preference", "allergies", "avoid_ingredients"].forEach((field) => {
    merged[field] = [...new Set([...(previous?.[field] || []), ...(next?.[field] || [])])];
  });
  merged.max_price_krw = next.max_price_krw || previous?.max_price_krw || null;
  return merged;
}

function staticProductScore(product, profile, query) {
  const normalizedQuery = normalizeText(query);
  let score = 0;
  score += overlapCount(product.suited_skin_types, profile.skin_type) * 2;
  score += overlapCount(product.concerns, profile.concerns) * 3;
  score += (profile.desired_categories || []).includes(product.category) ? 4 : 0;
  score += overlapCount(product.texture_tags, profile.texture_preference) * 2;
  score += overlapCount(product.ingredients, profile.preferred_ingredients) * 2;
  if (product.name && normalizedQuery.includes(normalizeText(product.name))) score += 2;
  if (product.display_name_ko && normalizedQuery.includes(normalizeText(product.display_name_ko))) score += 2;
  return score;
}

function staticResultItem(product, profile, score) {
  const matchedIngredients = product.ingredients?.filter((ingredient) => {
    const normalized = normalizeText(ingredient);
    return (profile.preferred_ingredients || []).some((item) => normalizeText(item) === normalized) || ["glycerin", "panthenol", "centella asiatica", "niacinamide", "hyaluronic acid"].includes(normalized);
  }) || [];
  const reasonKo = staticReasonKo(product, profile, score);
  const reasonEn = staticReasonEn(product, profile, score);
  return {
    product,
    score,
    reasons: [reasonEn],
    display_reasons: [state.lang === "ko" ? reasonKo : reasonEn],
    personalized_reason: state.lang === "ko" ? reasonKo : reasonEn,
    matched_ingredients: matchedIngredients.length ? matchedIngredients : product.ingredients?.slice(0, 3) || [],
    display_matched_ingredients: (matchedIngredients.length ? matchedIngredients : product.ingredients?.slice(0, 3) || []).map(displayIngredient),
  };
}

function staticReasonKo(product, profile, score) {
  const pieces = [];
  if ((profile.desired_categories || []).includes(product.category)) pieces.push(`${displayValue(product.category)} 조건과 맞습니다`);
  if (overlapCount(product.concerns, profile.concerns)) pieces.push(`${product.concerns.map(displayValue).join(", ")} 고민에 맞춘 성분 구성이 있습니다`);
  if (overlapCount(product.suited_skin_types, profile.skin_type)) pieces.push(`${product.suited_skin_types.map(displayValue).join(", ")} 피부 타입에 적합한 제품군입니다`);
  if (product.oliveyoung_price_krw) pieces.push(`${krw(product.oliveyoung_price_krw)} 가격대로 예산 검토가 가능합니다`);
  if (!pieces.length || score <= 0) pieces.push("샘플 데이터 기준으로 기본 루틴에 넣기 쉬운 제품입니다");
  return pieces.join(". ") + ".";
}

function staticReasonEn(product, profile, score) {
  const pieces = [];
  if ((profile.desired_categories || []).includes(product.category)) pieces.push(`It matches the requested ${displayValue(product.category)} category`);
  if (overlapCount(product.concerns, profile.concerns)) pieces.push(`Its ingredient profile supports ${product.concerns.map(displayValue).join(", ")}`);
  if (overlapCount(product.suited_skin_types, profile.skin_type)) pieces.push(`It fits ${product.suited_skin_types.map(displayValue).join(", ")} skin routines`);
  if (product.oliveyoung_price_krw) pieces.push(`The listed price is ${krw(product.oliveyoung_price_krw)}`);
  if (!pieces.length || score <= 0) pieces.push("It is an easy sample-data pick for a basic routine");
  return pieces.join(". ") + ".";
}

function overlapCount(left = [], right = []) {
  const rightSet = new Set((right || []).map(normalizeText));
  return (left || []).filter((item) => rightSet.has(normalizeText(item))).length;
}

function normalizeSkinTypes(values) {
  const map = { 지성: "oily", 건성: "dry", 복합성: "combination", 민감성: "sensitive", Oily: "oily", Dry: "dry", Combination: "combination", Sensitive: "sensitive" };
  return values.map((value) => map[value] || value).filter(Boolean);
}

function normalizeConcernValues(values) {
  const map = { 트러블: "acne", 유분: "oil_control", 수분: "hydration", 장벽: "barrier_support", 홍조: "redness", 잡티: "hyperpigmentation", 모공: "pores" };
  return values.map((value) => map[value] || normalizeText(value).replaceAll(" ", "_")).filter(Boolean);
}

function normalizeCategoryValues(values) {
  const map = { 클렌저: "cleanser", 클렌징오일: "cleanser", 토너: "toner", 토너패드: "toner", 미스트: "toner", 세럼: "serum", 에센스: "serum", 수분크림: "moisturizer", 로션: "moisturizer", 선크림: "sunscreen", 기초루틴: "basic" };
  return values.map((value) => map[String(value).replaceAll(" ", "")] || value).filter(Boolean);
}

function normalizeTextureValues(values) {
  const map = { 촉촉: "dewy", 산뜻: "lightweight", 꾸덕: "rich", 젤: "gel" };
  return values.map((value) => map[value] || normalizeText(value)).filter(Boolean);
}

function normalizeAvoidTerms(value) {
  return String(value || "")
    .split(/[,\n/]+/)
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

function inferCategories(query) {
  const pairs = [
    ["cleanser", ["클렌저", "세안", "cleanser", "cleansing"]],
    ["toner", ["토너", "스킨", "toner"]],
    ["serum", ["세럼", "앰플", "에센스", "serum", "ampoule", "essence"]],
    ["moisturizer", ["크림", "로션", "moisturizer", "cream"]],
    ["sunscreen", ["선크림", "자외선", "sunscreen", "sun"]],
  ];
  return pairs.filter(([, terms]) => terms.some((term) => query.includes(normalizeText(term)))).map(([category]) => category);
}

function inferConcerns(query) {
  const pairs = [
    ["acne", ["트러블", "여드름", "acne"]],
    ["oil_control", ["유분", "피지", "oily", "oil"]],
    ["hydration", ["수분", "보습", "hydration", "dry"]],
    ["barrier_support", ["장벽", "barrier"]],
    ["redness", ["홍조", "진정", "redness", "soothing"]],
    ["hyperpigmentation", ["잡티", "색소", "dark spot"]],
    ["pores", ["모공", "pores"]],
  ];
  return pairs.filter(([, terms]) => terms.some((term) => query.includes(normalizeText(term)))).map(([concern]) => concern);
}

function inferSkinTypes(query) {
  const pairs = [
    ["oily", ["지성", "oily"]],
    ["dry", ["건성", "dry"]],
    ["combination", ["복합성", "combination"]],
    ["sensitive", ["민감", "sensitive"]],
  ];
  return pairs.filter(([, terms]) => terms.some((term) => query.includes(normalizeText(term)))).map(([skinType]) => skinType);
}

function inferPreferredIngredients(query) {
  const ingredients = ["niacinamide", "panthenol", "hyaluronic acid", "centella asiatica", "glycerin", "tea tree", "salicylic acid", "madecassoside"];
  const aliases = {
    niacinamide: ["나이아신아마이드", "niacinamide"],
    panthenol: ["판테놀", "panthenol"],
    "hyaluronic acid": ["히알루론산", "hyaluronic"],
    "centella asiatica": ["병풀", "시카", "centella", "cica"],
    glycerin: ["글리세린", "glycerin"],
    "tea tree": ["티트리", "tea tree"],
    "salicylic acid": ["살리실산", "bha", "salicylic"],
    madecassoside: ["마데카소사이드", "madecassoside"],
  };
  return ingredients.filter((ingredient) => aliases[ingredient].some((term) => query.includes(normalizeText(term))));
}

function inferBudgetKrw(query) {
  const match = query.match(/(\d+)\s*(만원|만|원|krw)/);
  if (!match) return null;
  const value = Number(match[1]);
  if (!value) return null;
  return match[2] === "만원" || match[2] === "만" ? value * 10000 : value;
}

async function loadProducts() {
  if (IS_STATIC_DEMO) {
    loadStaticProducts();
    renderCatalogs();
    return;
  }
  try {
    const data = await apiJson("/api/products");
    state.allProducts = data.products || [];
    state.productsById.clear();
    state.allProducts.forEach((product) => state.productsById.set(product.id, product));
  } catch {
    loadStaticProducts();
  }
  renderCatalogs();
}

async function loadSession() {
  if (IS_STATIC_DEMO) {
    renderProfile(state.profile);
    return;
  }
  try {
    const data = await apiJson("/api/session");
    state.profile = data.profile || {};
  } catch {
    state.profile = {};
  }
  renderProfile(state.profile);
}

async function loadSelections() {
  if (IS_STATIC_DEMO) {
    state.selections = emptySelections();
    renderRoutine();
    renderCompareSummary();
    renderCompareTable();
    renderCatalogs();
    return;
  }
  try {
    state.selections = await apiJson("/api/selections");
  } catch {
    state.selections = emptySelections();
  }
  for (const product of [...(state.selections.saved_products || []), ...(state.selections.compare_products || [])]) {
    state.productsById.set(product.id, product);
  }
  renderRoutine();
  renderCompareSummary();
  renderCompareTable();
  renderCatalogs();
}

async function submitRecommendation(isFollowUp, query) {
  if (!query) return;
  setStatus(isFollowUp ? text("followUpStatus") : text("submitStatus"));
  let data;
  let staticDemo = IS_STATIC_DEMO;
  if (IS_STATIC_DEMO) {
    data = buildStaticRecommendation(query, isFollowUp);
  } else {
    try {
      data = await apiJson(isFollowUp ? "/api/follow-up" : "/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          limit: 5,
          use_openai: false,
          language: state.lang,
        }),
      });
    } catch (error) {
      staticDemo = true;
      data = buildStaticRecommendation(query, isFollowUp);
    }
  }
  state.recommendationId = data.recommendation_id;
  state.profile = data.profile || {};
  state.currentResults = data.results || [];
  (data.results || []).forEach((item) => state.productsById.set(item.product.id, item.product));
  renderProfile(state.profile);
  renderResults(data.results || []);
  document.querySelector("#followUpQuery").value = "";
  const countText = text(staticDemo ? "staticDemoResultCount" : isFollowUp ? "followUpResultCount" : "resultCount").replace("{count}", String((data.results || []).length));
  setStatus(countText);
  document.querySelector("#recommendation").scrollIntoView({ behavior: "smooth", block: "start" });
  if (window.lucide) window.lucide.createIcons();
}

function setStatus(message) {
  document.querySelector("#status").textContent = message;
}

function handleCommand(query) {
  const command = parseCommand(query);
  if (!command) return false;
  if (command === "resetCriteria") {
    resetCriteria();
    return true;
  }
  if (command === "addAllCompare") {
    addCurrentResultsToSelection("compare");
    return true;
  }
  if (command === "addAllRoutine") {
    addCurrentResultsToSelection("saved");
    return true;
  }
  return false;
}

function parseCommand(query) {
  const normalized = normalizeText(query);
  if (!normalized) return null;
  const wantsAll = includesAny(normalized, ["all", "every", "current", "recommended", "recommendations", "전체", "전부", "모두", "다", "추천", "추천제품", "추천 제품"]);
  const wantsCompare = includesAny(normalized, ["compare", "comparison", "비교", "비교페이지", "비교 페이지"]);
  const wantsRoutine = includesAny(normalized, ["routine", "cart", "save", "saved", "basket", "루틴", "장바구니", "저장", "담아", "넣어"]);
  const wantsReset = includesAny(normalized, ["reset", "clear", "remove", "delete", "리셋", "초기화", "비워", "지워", "삭제"]);
  const targetsCriteria = includesAny(normalized, ["criteria", "condition", "conditions", "filter", "filters", "profile", "search", "follow up", "followup", "조건", "검색", "필터", "프로필", "후속"]);

  if (wantsReset && (targetsCriteria || wantsAll)) return "resetCriteria";
  if (wantsAll && wantsCompare) return "addAllCompare";
  if (wantsAll && wantsRoutine) return "addAllRoutine";
  return null;
}

function includesAny(value, terms) {
  return terms.some((term) => value.includes(term));
}

async function resetCriteria() {
  if (!IS_STATIC_DEMO) {
    try {
      await fetch("/api/profile", { method: "DELETE" });
    } catch {
      // Static fallback keeps the UI responsive even when the API is unavailable.
    }
  }
  state.recommendationId = null;
  state.profile = {};
  document.querySelector("#followUpQuery").value = "";
  renderProfile({});
  setStatus(text("criteriaReset"));
}

async function addCurrentResultsToSelection(listType) {
  const products = state.currentResults.map((item) => item.product).filter(Boolean);
  if (!products.length) {
    setStatus(text("noCurrentResults"));
    return;
  }
  for (const product of products) {
    await setSelection(product.id, listType, true);
  }
  await hydrateSelectedProducts();
  renderRoutine();
  renderCompareSummary();
  renderCatalogs();
  renderResults(state.currentResults);
  if (listType === "compare") renderCompareTable();
  document.querySelector("#followUpQuery").value = "";
  setStatus(text(listType === "compare" ? "allCompareAdded" : "allRoutineAdded").replace("{count}", String(products.length)));
  if (window.lucide) window.lucide.createIcons();
}

function renderProfile(profile) {
  const fields = [
    "skin_type",
    "concerns",
    "desired_categories",
    "preferred_ingredients",
    "texture_preference",
    "max_price_krw",
    "min_price_krw",
    "allergies",
  ];
  const html = fields
    .map((field) => {
      const raw = profile?.[field];
      const value = Array.isArray(raw) ? raw.map(displayValue).join(", ") : displayValue(raw, field);
      return value ? `<span><strong>${labels[state.lang]?.[field] || field}</strong>${escapeHtml(value)}</span>` : "";
    })
    .join("");
  const blocked = Array.isArray(profile?.avoid_ingredients) ? profile.avoid_ingredients.map(displayValue).join(", ") : "";
  const blockedHtml = blocked ? `<span class="blocked-ingredients"><strong>${text("blockedIngredients")}</strong>${escapeHtml(blocked)}</span>` : "";
  const profileHtml = `${html}${blockedHtml}`;
  document.querySelector("#profileView").innerHTML = profileHtml || `<span>${text("profileEmpty")}</span>`;
}

function hasProfileSignal(profile) {
  if (!profile) return false;
  const listFields = ["concerns", "desired_categories", "preferred_ingredients", "sensitivities", "allergies", "avoid_ingredients"];
  if (listFields.some((field) => Array.isArray(profile[field]) && profile[field].length > 0)) return true;
  return Boolean(
    profile.skin_type ||
      profile.texture_preference ||
      profile.location_or_climate ||
      profile.pregnant_or_nursing ||
      profile.max_price_usd != null ||
      profile.max_price_krw != null ||
      profile.min_price_usd != null ||
      profile.min_price_krw != null
  );
}

function displayValue(value, field = "") {
  if (!value) return "";
  if (field === "max_price_krw" || field === "min_price_krw") return krw(Number(value));
  if (typeof value === "number") return String(value);
  const normalized = String(value).toLowerCase();
  const label = valueLabels[state.lang]?.[normalized] || valueLabels[state.lang]?.[value] || valueLabels.ko[normalized] || valueLabels.ko[value];
  return label || String(value).replaceAll("_", " ");
}

function displayProductName(product) {
  return state.lang === "ko" ? product.display_name_ko || product.name : product.name;
}

function displayIngredient(ingredient) {
  return state.lang === "ko" ? displayValue(ingredient) : String(ingredient);
}

function displayIngredients(ingredients, limit = 8) {
  return (ingredients || []).slice(0, limit).map(displayIngredient).join(", ");
}

function normalizeText(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9가-힣]+/g, " ").trim();
}

function orderedIngredientExplanations(product, matchedIngredients) {
  const explanations = product.ingredient_explanations || [];
  const priority = (matchedIngredients || []).map((item) => normalizeText(item));
  return [...explanations].sort((left, right) => {
    const leftIndex = priority.indexOf(normalizeText(left.name));
    const rightIndex = priority.indexOf(normalizeText(right.name));
    if (leftIndex !== -1 || rightIndex !== -1) {
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    }
    return 0;
  });
}

function renderResults(results) {
  const container = document.querySelector("#results");
  container.innerHTML = results.map(renderProductCard).join("");
  container.querySelectorAll("[data-select-product]").forEach((button) => {
    button.addEventListener("click", () => toggleSelection(button.dataset.productId, button.dataset.listType));
  });
  container.querySelectorAll("[data-ingredient]").forEach((button) => {
    button.addEventListener("click", () => showIngredient(button.dataset.productId, button.dataset.ingredient));
  });
}

function renderProductCard(item) {
  const product = item.product;
  const isSaved = state.selections.saved_ids?.includes(product.id);
  const isCompare = state.selections.compare_ids?.includes(product.id);
  const reasons = item.display_reasons || item.reasons || [];
  const personalizedReason = item.personalized_reason || reasons.slice(0, 3).join(" ");
  const matchedRaw = item.matched_ingredients || [];
  const matched = item.display_matched_ingredients || matchedRaw;
  const ingredientButtons = orderedIngredientExplanations(product, matchedRaw)
    .slice(0, 6)
    .map(
      (ingredient) =>
        `<button type="button" class="ingredient-chip" data-product-id="${product.id}" data-ingredient="${escapeHtml(ingredient.name)}">${escapeHtml(displayIngredient(ingredient.label || ingredient.name))}</button>`
    )
    .join("");
  return `
    <article class="product-card">
      <div class="product-media ${product.image_url ? "" : "image-missing"}" data-image-frame>
        ${productImage(product)}
        ${imageSourceBadge(product)}
      </div>
      <div class="product-body">
        <div class="product-head">
          <div>
            <p class="brand">${escapeHtml(product.brand)}</p>
            <h3>${escapeHtml(displayProductName(product))}</h3>
          </div>
          <strong class="price">${price(product)}</strong>
        </div>
        <p class="meta">${escapeHtml(displayValue(product.category))} · ${skinCompatibility(product)}</p>
        <div class="note-list">
          <strong>${text("recommendedReason")}</strong>
          <p>${escapeHtml(personalizedReason || text("noReason"))}</p>
        </div>
        <div class="ingredient-row">
          <strong>${text("ingredients")}</strong>
          <div>${ingredientButtons || matched.map((item) => `<span class="chip">${escapeHtml(displayIngredient(item))}</span>`).join("")}</div>
        </div>
        <div class="review-box">
          <strong>${text("review")}</strong>
          <p>${escapeHtml(reviewSummary(product, "noReview"))}</p>
          ${reviewExcerpts(product)}
        </div>
        <div class="combo-box">
          <strong>${text("combo")}</strong>
          <span>${escapeHtml(recommendedCombo(product))}</span>
        </div>
        <div class="product-actions">
          <button class="secondary ${isSaved ? "selected" : ""}" type="button" data-select-product data-list-type="saved" data-product-id="${product.id}">
            <i data-lucide="${isSaved ? "bookmark-check" : "bookmark"}"></i><span>${isSaved ? text("saved") : text("save")}</span>
          </button>
          <button class="secondary ${isCompare ? "selected" : ""}" type="button" data-select-product data-list-type="compare" data-product-id="${product.id}">
            <i data-lucide="scale"></i><span>${text("compare")}</span>
          </button>
          ${linkButton(product, "oliveyoung", "oliveyoung")}
          ${linkButton(product, "official", "official")}
        </div>
      </div>
    </article>
  `;
}

async function toggleSelection(productId, listType) {
  const ids = state.selections[`${listType}_ids`] || [];
  const selected = !ids.includes(productId);
  await setSelection(productId, listType, selected);
  await hydrateSelectedProducts();
  renderRoutine();
  renderCompareSummary();
  renderCatalogs();
  if (listType === "compare" || !document.querySelector("#compareTable").classList.contains("hidden")) renderCompareTable();
  const cards = [...document.querySelectorAll("[data-select-product]")];
  cards.forEach((button) => {
      if (button.dataset.productId === productId && button.dataset.listType === listType) {
        button.classList.toggle("selected", selected);
        const span = button.querySelector("span");
        if (span && listType === "saved") span.textContent = selected ? text("saved") : text("save");
      }
  });
  if (window.lucide) window.lucide.createIcons();
}

async function setSelection(productId, listType, selected) {
  if (IS_STATIC_DEMO) {
    const key = `${listType}_ids`;
    const ids = new Set(state.selections[key] || []);
    if (selected) ids.add(productId);
    else ids.delete(productId);
    state.selections[key] = [...ids];
    syncStaticSelections();
    return;
  }
  try {
    state.selections = await apiJson("/api/selections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, list_type: listType, selected }),
    });
  } catch {
    const key = `${listType}_ids`;
    const ids = new Set(state.selections[key] || []);
    if (selected) ids.add(productId);
    else ids.delete(productId);
    state.selections[key] = [...ids];
    syncStaticSelections();
  }
}

async function hydrateSelectedProducts() {
  for (const product of [...(state.selections.saved_products || []), ...(state.selections.compare_products || [])]) {
    state.productsById.set(product.id, product);
  }
}

function renderCompareSummary() {
  const count = state.selections.compare_products?.length || 0;
  const empty = document.querySelector("#compareEmpty");
  const clearAll = document.querySelector("#compareClearAll");
  empty.textContent = text("compareEmpty");
  empty.classList.toggle("hidden", count > 0);
  clearAll?.classList.toggle("hidden", count === 0);
  if (!count) document.querySelector("#compareTable").classList.add("hidden");
}

function renderCompareTable() {
  const products = state.selections.compare_products || [];
  const wrap = document.querySelector("#compareTable");
  if (!products.length) {
    renderCompareSummary();
    return;
  }
  wrap.classList.remove("hidden");
  wrap.innerHTML = `
    <table class="compare-table">
      <thead>
        <tr>
          <th>${text("compareStandard")}</th>
          ${products.map((product) => `<th>${escapeHtml(displayProductName(product))}<button class="table-remove" type="button" data-remove-selection data-list-type="compare" data-product-id="${product.id}">${text("remove")}</button></th>`).join("")}
        </tr>
      </thead>
      <tbody>
        <tr><th>${text("image")}</th>${products.map((product) => `<td><div class="compare-thumb ${product.image_url ? "" : "image-missing"}" data-image-frame>${productImage(product)}${imageSourceBadge(product)}</div></td>`).join("")}</tr>
        <tr><th>${text("cost")}</th>${products.map((product) => `<td>${price(product)}</td>`).join("")}</tr>
        <tr><th>${text("skinCompatibility")}</th>${products.map((product) => `<td>${skinCompatibility(product)}</td>`).join("")}</tr>
        <tr><th>${text("ingredient")}</th>${products.map((product) => `<td>${escapeHtml(displayIngredients(product.ingredients, 8))}</td>`).join("")}</tr>
        <tr><th>${text("review")}</th>${products.map((product) => `<td>${escapeHtml(reviewSummary(product, "noReviewShort"))}${reviewExcerpts(product, { compact: true })}</td>`).join("")}</tr>
      </tbody>
    </table>
  `;
  wrap.querySelectorAll("[data-remove-selection]").forEach((button) => {
    button.addEventListener("click", () => removeSelection(button.dataset.productId, button.dataset.listType));
  });
}

async function clearCompareSelections() {
  const ids = [...(state.selections.compare_ids || [])];
  for (const productId of ids) {
    await setSelection(productId, "compare", false);
  }
  await hydrateSelectedProducts();
  document.querySelector("#compareTable").innerHTML = "";
  document.querySelector("#compareTable").classList.add("hidden");
  renderCompareSummary();
  renderCatalogs();
  if (window.lucide) window.lucide.createIcons();
}

function renderRoutine() {
  const products = state.selections.saved_products || [];
  syncRoutineSelectedProducts(products);
  const total = products.reduce((sum, product) => sum + productKrwValue(product), 0);
  const selectedTotal = products
    .filter((product) => state.routineSelectedIds.has(product.id))
    .reduce((sum, product) => sum + productKrwValue(product), 0);
  updateRoutineSelectAll(products);
  document.querySelector("#routineTotal").textContent = krw(total || state.selections.total_cost_krw || 0);
  document.querySelector("#routineSelectedTotal").textContent = krw(selectedTotal);
  const empty = document.querySelector("#routineEmpty");
  empty.textContent = text("routineEmpty");
  empty.classList.toggle("hidden", products.length > 0);
  document.querySelector("#routineTotals")?.classList.toggle("hidden", products.length === 0);
  document.querySelector("#routineList").innerHTML = products
    .map(
      (product) => `
      <article class="routine-item">
        <label class="routine-check" aria-label="${escapeHtml(displayProductName(product))}">
          <input type="checkbox" data-routine-select data-product-id="${product.id}" ${state.routineSelectedIds.has(product.id) ? "checked" : ""} />
        </label>
        <div class="routine-thumb ${product.image_url ? "" : "image-missing"}" data-image-frame>
          ${productImage(product)}
        </div>
        <div class="routine-info">
          <span class="step">${escapeHtml(displayValue(product.category))}</span>
          <h3>${escapeHtml(displayProductName(product))}</h3>
          <p>${product.oliveyoung_verified_at ? `${text("verifiedDate")} ${formatVerifiedAt(product.oliveyoung_verified_at)}` : ""}</p>
        </div>
        <div class="routine-price">
          <span>${text("cost")}</span>
          <strong>${price(product)}</strong>
        </div>
        <div class="routine-actions">
          <button class="secondary" type="button" data-remove-selection data-list-type="saved" data-product-id="${product.id}">${text("remove")}</button>
          ${linkButton(product, "oliveyoung", "oliveyoung")}
          ${linkButton(product, "official", "official")}
        </div>
      </article>`
    )
    .join("");
  document.querySelector("#routineList").querySelectorAll("[data-routine-select]").forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) state.routineSelectedIds.add(input.dataset.productId);
      else state.routineSelectedIds.delete(input.dataset.productId);
      renderRoutine();
    });
  });
  document.querySelector("#routineList").querySelectorAll("[data-remove-selection]").forEach((button) => {
    button.addEventListener("click", () => removeSelection(button.dataset.productId, button.dataset.listType));
  });
}

function updateRoutineSelectAll(products) {
  const button = document.querySelector("#routineSelectAll");
  if (!button) return;
  const hasProducts = products.length > 0;
  const allSelected = hasProducts && products.every((product) => state.routineSelectedIds.has(product.id));
  button.classList.toggle("hidden", !hasProducts);
  button.dataset.selectAllMode = allSelected ? "deselect" : "select";
  const label = button.querySelector("span") || button;
  label.textContent = allSelected ? text("deselectAll") : text("selectAll");
  button.onclick = () => {
    if (button.dataset.selectAllMode === "deselect") {
      products.forEach((product) => state.routineSelectedIds.delete(product.id));
    } else {
      products.forEach((product) => {
        state.routineSelectedIds.add(product.id);
        state.routineKnownSavedIds.add(product.id);
      });
    }
    renderRoutine();
  };
}

function syncRoutineSelectedProducts(products) {
  const savedIds = new Set(products.map((product) => product.id));
  state.routineSelectedIds = new Set([...state.routineSelectedIds].filter((id) => savedIds.has(id)));
  state.routineKnownSavedIds = new Set([...state.routineKnownSavedIds].filter((id) => savedIds.has(id)));
  for (const product of products) {
    if (!state.routineKnownSavedIds.has(product.id)) {
      state.routineSelectedIds.add(product.id);
      state.routineKnownSavedIds.add(product.id);
    }
  }
}

function productKrwValue(product) {
  return Number(product?.oliveyoung_price_krw || 0);
}

function showIngredient(productId, ingredientName) {
  const product = state.productsById.get(productId);
  const ingredient = product?.ingredient_explanations?.find((item) => item.name === ingredientName);
  if (!ingredient) return;
  document.querySelector("#ingredientModalTitle").textContent = state.lang === "ko" ? ingredient.display_name_ko || displayValue(ingredient.name) : ingredient.name;
  document.querySelector("#ingredientModalBody").innerHTML = `
    <p>${escapeHtml(state.lang === "ko" ? ingredient.display_rationale_ko || ingredient.rationale : ingredient.rationale)}</p>
    <dl class="ingredient-detail">
      <div><dt>${text("evidenceLevel")}</dt><dd>${escapeHtml(evidenceLabel(ingredient.evidence_level))}</dd></div>
      <div><dt>${text("supportConcerns")}</dt><dd>${escapeHtml(ingredientList(ingredient, "supports") || "-")}</dd></div>
      <div><dt>${text("suitableSkin")}</dt><dd>${escapeHtml(ingredientList(ingredient, "suitable_for") || "-")}</dd></div>
      <div><dt>${text("caution")}</dt><dd>${escapeHtml(ingredientList(ingredient, "cautions") || text("noSpecialCaution"))}</dd></div>
    </dl>
  `;
  bootstrap.Modal.getOrCreateInstance(document.querySelector("#ingredientModal")).show();
}

async function resetSession() {
  if (!IS_STATIC_DEMO) {
    try {
      await fetch("/api/session", { method: "DELETE" });
    } catch {
      // Keep the reset action usable for static deployments.
    }
  }
  state.recommendationId = null;
  state.profile = {};
  state.currentResults = [];
  state.selections = { saved_ids: [], compare_ids: [], saved_products: [], compare_products: [], total_cost_krw: 0 };
  state.routineSelectedIds.clear();
  state.routineKnownSavedIds.clear();
  document.querySelector("#results").innerHTML = "";
  document.querySelector("#compareTable").innerHTML = "";
  document.querySelector("#compareTable").classList.add("hidden");
  setStatus(text("reset"));
  renderProfile({});
  renderRoutine();
  renderCompareSummary();
}

function renderCatalogs() {
  renderSelectionCatalog("compareCatalog", "compare");
  renderSelectionCatalog("routineCatalog", "saved");
}

function renderSelectionCatalog(containerId, listType) {
  const container = document.querySelector(`#${containerId}`);
  if (!container) return;
  const selectedIds = state.selections[`${listType}_ids`] || [];
  const showImageBadge = containerId !== "routineCatalog";
  container.innerHTML = state.allProducts
    .map((product) => {
      const selected = selectedIds.includes(product.id);
      return `
        <article class="catalog-item">
          <div class="catalog-thumb ${product.image_url ? "" : "image-missing"}" data-image-frame>
            ${productImage(product)}
            ${showImageBadge ? imageSourceBadge(product) : ""}
          </div>
          <div>
            <span>${escapeHtml(product.brand)} · ${escapeHtml(displayValue(product.category))}</span>
            <h3>${escapeHtml(displayProductName(product))}</h3>
            <p>${price(product)}</p>
          </div>
          <button class="secondary ${selected ? "selected" : ""}" type="button" data-select-product data-list-type="${listType}" data-product-id="${product.id}">
            ${selected ? text("selected") : listType === "compare" ? text("compareAdd") : text("routineAdd")}
          </button>
        </article>`;
    })
    .join("");
  container.querySelectorAll("[data-select-product]").forEach((button) => {
    button.addEventListener("click", () => toggleSelection(button.dataset.productId, button.dataset.listType));
  });
}

async function removeSelection(productId, listType) {
  await setSelection(productId, listType, false);
  renderRoutine();
  renderCompareSummary();
  renderCompareTable();
  renderCatalogs();
  if (window.lucide) window.lucide.createIcons();
}

function applyPageMode() {
  const path = `${window.location.pathname}${window.location.hash}`;
  document.body.dataset.page = path.includes("compare") ? "compare" : path.includes("routine") ? "routine" : "home";
}

function skinCompatibility(product) {
  return (product.suited_skin_types || []).map(displayValue).join(", ") || text("noSkinFit");
}

function recommendedCombo(product) {
  const combos = {
    ko: {
      cleanser: "토너 또는 수분 세럼과 함께 사용",
      toner: "세럼 전 단계에서 가볍게 레이어링",
      serum: "보습제와 함께 장벽 루틴으로 마무리",
      moisturizer: "세럼 후 수분 잠금 단계",
      sunscreen: "아침 루틴 마지막 단계",
      default: "기초 루틴 안에서 피부 반응을 보며 조합",
    },
    en: {
      cleanser: "Pair with a toner or hydrating serum",
      toner: "Layer lightly before serum",
      serum: "Finish with a moisturizer for barrier support",
      moisturizer: "Use after serum to seal in hydration",
      sunscreen: "Use as the final step in the morning routine",
      default: "Combine within a basic routine while watching skin response",
    },
  };
  const localized = combos[state.lang] || combos.ko;
  return localized[product.category] || localized.default;
}

function reviewSummary(product, emptyKey) {
  const summary = state.lang === "en" ? product.review_summary_en : product.review_summary;
  return cleanReviewSummary(summary) || text(emptyKey);
}

function reviewExcerpts(product, options = {}) {
  const positive = localizedReviewList(product, "positive").slice(0, options.compact ? 1 : 2);
  const negative = localizedReviewList(product, "negative").slice(0, options.compact ? 1 : 2);
  if (!positive.length && !negative.length) return "";
  const sections = [
    reviewExcerptGroup(text("positiveReview"), positive, "positive"),
    reviewExcerptGroup(text("negativeReview"), negative, "negative"),
  ].filter(Boolean).join("");
  const source = product.review_source_url || product.source_url || "";
  const sourceLink = source
    ? `<a href="${escapeHtml(source)}" target="_blank" rel="noreferrer">${text("reviewSource")}</a>`
    : "";
  return `<div class="actual-review-box ${options.compact ? "compact" : ""}"><span>${text("actualReviews")}</span>${sections}${sourceLink}</div>`;
}

function localizedReviewList(product, sentiment) {
  const koKey = sentiment === "positive" ? "positive_reviews" : "negative_reviews";
  const enKey = sentiment === "positive" ? "positive_reviews_en" : "negative_reviews_en";
  const preferred = state.lang === "en" ? product[enKey] : product[koKey];
  const fallback = state.lang === "en" ? product[koKey] : product[enKey];
  return Array.isArray(preferred) && preferred.length ? preferred : Array.isArray(fallback) ? fallback : [];
}

function reviewExcerptGroup(label, reviews, sentiment) {
  if (!reviews.length) return "";
  return `
    <div class="actual-review-group ${sentiment}">
      <em>${label}</em>
      ${reviews.map((review) => `<q>${escapeHtml(review)}</q>`).join("")}
    </div>
  `;
}

function cleanReviewSummary(summary) {
  return String(summary || "")
    .replace(/^큐레이션 리뷰 신호:\s*/i, "")
    .replace(/^Curated review signal:\s*/i, "")
    .trim();
}

function price(product) {
  if (product.oliveyoung_price_krw) return krw(product.oliveyoung_price_krw);
  if (product.price_usd) return `$${Number(product.price_usd).toFixed(2)}`;
  return text("needPrice");
}

function linkButton(product, type, labelKey) {
  const href = productLink(product, type);
  const disabled = href === "#";
  const attrs = disabled
    ? 'href="#" aria-disabled="true" tabindex="-1"'
    : `href="${escapeHtml(href)}" target="_blank" rel="noreferrer"`;
  return `<a class="link-button ${disabled ? "disabled" : ""}" ${attrs}>${text(labelKey)}</a>`;
}

function productLink(product, type) {
  if (type === "oliveyoung") {
    if (state.lang === "ko") return product.oliveyoung_url || "#";
    return globalOliveYoungUrl(product);
  }
  if (type === "official") {
    if (state.lang === "ko") return koreanOfficialMall(product) || officialUrl(product.official_url);
    return englishUrl(product.official_url, product.source_url, product.image_verified_source);
  }
  return "#";
}

function globalOliveYoungUrl(product) {
  const query = product?.name || product?.display_name_ko || "";
  if (!query) return "#";
  return `https://global.oliveyoung.com/display/search?query=${encodeURIComponent(query)}`;
}

function officialUrl(url) {
  return isOfficialUrl(url) ? url : "#";
}

function koreanOfficialMall(product) {
  return koreanOfficialMallByBrand[product?.brand] || "";
}

function koreanSourceUrl(...urls) {
  return urls.find((url) => isKoreanUrl(url)) || "#";
}

function englishUrl(...urls) {
  return urls.find((url) => url && !isKoreanUrl(url)) || "#";
}

function isKoreanUrl(url) {
  if (!url) return false;
  const normalized = String(url).toLowerCase();
  if (
    normalized.includes(".kr/") ||
    normalized.includes(".co.kr") ||
    normalized.includes("oliveyoung.co.kr") ||
    normalized.includes("glowpick.co.kr") ||
    normalized.includes("/kr/") ||
    normalized.includes("/ko/")
  ) {
    return true;
  }
  return false;
}

function isOfficialUrl(url) {
  if (!url) return false;
  const normalized = String(url).toLowerCase();
  if (
    normalized.includes("oliveyoung.") ||
    normalized.includes("glowpick.") ||
    normalized.includes("hwahae.") ||
    normalized.includes("incidecoder.") ||
    normalized.includes("amazon.") ||
    normalized.includes("ulta.") ||
    normalized.includes("marksandspencer.")
  ) {
    return false;
  }
  if (isKoreanUrl(normalized)) return true;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();
    return (host === "www.torriden.com" || host === "torriden.com") && path.includes("/goods/");
  } catch (error) {
    return false;
  }
}

function productImage(product) {
  if (!product.image_url) return "";
  return `<img src="${escapeHtml(product.image_url)}" alt="${escapeHtml(displayProductName(product))}" loading="lazy" onerror="markImageMissing(this)" />`;
}

function markImageMissing(image) {
  const frame = image.closest("[data-image-frame]");
  if (frame) frame.classList.add("image-missing");
  image.remove();
}

function imageSourceBadge(product) {
  const labels = {
    official: text("officialImage"),
    hwahae: text("hwahaeImage"),
    glowpick: text("glowpickImage"),
    open_beauty_facts: text("openBeautyFactsImage"),
    oliveyoung_snapshot: text("oliveyoungSnapshotImage"),
    retailer: text("retailerImage"),
  };
  const label = product.image_confidence === "verified" ? labels[product.image_source_type] : "";
  if (!label) return "";
  const source =
    state.lang === "ko"
      ? koreanSourceUrl(product.image_verified_source, product.official_url, product.source_url, product.oliveyoung_url)
      : englishUrl(product.image_verified_source, product.official_url, product.source_url);
  if (source === "#") return "";
  return `<a class="image-source-badge" href="${escapeHtml(source)}" target="_blank" rel="noreferrer">${label}</a>`;
}

function formatVerifiedAt(value) {
  const text = String(value || "");
  return text.includes(" ") ? text : `${text} 00:00 KST`;
}

function evidenceLabel(value) {
  if (state.lang === "en") return value;
  return { high: "높음", moderate: "중간", low: "낮음", insufficient: "부족" }[value] || value;
}

function ingredientList(ingredient, key) {
  if (state.lang === "ko") {
    const koreanKey = {
      supports: "display_supports_ko",
      suitable_for: "display_suitable_for_ko",
      cautions: "display_cautions_ko",
    }[key];
    return (ingredient[koreanKey] || []).join(key === "cautions" ? " " : ", ");
  }
  return (ingredient[key] || []).join(key === "cautions" ? " " : ", ");
}

function krw(value) {
  return `₩${Number(value || 0).toLocaleString("ko-KR")}`;
}

function renderBullets(items) {
  if (!items?.length) return `<p>${text("noReason")}</p>`;
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
