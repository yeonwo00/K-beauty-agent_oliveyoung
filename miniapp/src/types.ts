export type SkinType = 'oily' | 'dry' | 'combination' | 'sensitive' | 'normal';

export type ProductCategory = 'cleanser' | 'toner' | 'serum' | 'moisturizer' | 'sunscreen';

export interface SurveyAnswers {
  skinType: SkinType | '';
  category: ProductCategory | '';
  concerns: string[];
  texture: string;
  budget: number | null;
  avoidIngredients: string[];
  avoidIngredientsText: string;
}

export interface Product {
  id: string;
  name: string;
  displayNameKo?: string;
  brand: string;
  category: string;
  imageUrl?: string;
  oliveyoungUrl?: string;
  priceKrw?: number;
  rating?: number;
  reviewCount?: number;
  reviewSummary?: string;
  ingredients: string[];
}

export interface RecommendationItem {
  product: Product;
  score?: number;
  reason: string;
  cautions: string[];
  matchedIngredients: string[];
}

export interface RecommendationResult {
  decision: string;
  summary: string;
  items: RecommendationItem[];
}

export interface ApiErrorBody {
  detail?: string | Array<{ msg?: string }>;
  message?: string;
}
