import api from '../shared/api';

export interface TitleScoreResult {
  score: number;
  feedback: string;
  suggestedTitle?: string;
}

export interface PriceSuggestionResult {
  suggestedPrice: number;
  discountPct: number;
  categoryAvgDiscount: number;
  reasoning: string;
}

export const scoreListingTitle = (title: string, category: string): Promise<TitleScoreResult> =>
  api.post('/api/listings/ai/score-title', { title, category }).then(r => r.data.data);

export const getPriceSuggestion = (category: string, originalPrice: number): Promise<PriceSuggestionResult> =>
  api.get('/api/listings/ai/price-suggestion', { params: { category, originalPrice } }).then(r => r.data.data);

export const suggestAllergens = (title: string, description?: string): Promise<{ allergens: string[]; confidence: string }> =>
  api.post('/api/listings/ai/suggest-allergens', { title, description }).then(r => r.data.data);

export interface PerformanceResult {
  performanceScore: number;
  breakdown: { sellThrough: number; rating: number; frequency: number; verified: number };
  stats?: { totalListings: number; completedOrders: number; sellThroughRate: number; avgRating: number; listingsPerWeek: number };
  weeklyInsight: string | null;
  weeklyInsightUpdatedAt?: string | null;
}

export const getMyPerformance = (): Promise<PerformanceResult> =>
  api.get('/api/listings/ai/my-performance').then(r => r.data.data);

export const getPublicPerformance = (sellerId: string): Promise<Omit<PerformanceResult, 'stats'>> =>
  api.get(`/api/listings/ai/performance/${sellerId}`).then(r => r.data.data);
