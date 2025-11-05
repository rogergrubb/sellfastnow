// Provider Abstraction Layer
// Allows swapping between different API providers without changing core logic

export interface VisionProvider {
  name: string;
  isEnabled(): boolean;
  analyzeImage(imageUrl: string): Promise<VisionProviderResult>;
  getPriority(): number; // Lower number = higher priority
}

export interface VisionProviderResult {
  status: 'success' | 'error';
  error?: string;
  objects?: Array<{
    name: string;
    confidence: number;
    boundingBox?: any;
  }>;
  labels?: Array<{
    name: string;
    confidence: number;
  }>;
  text?: Array<{
    detectedText: string;
    confidence?: number;
  }>;
  webEntities?: Array<{
    entityId?: string;
    description: string;
    score: number;
  }>;
  confidence?: number;
}

export interface PricingProvider {
  name: string;
  isEnabled(): boolean;
  searchProduct(productName: string, category?: string): Promise<PricingProviderResult>;
  getPriority(): number;
}

export interface PricingProviderResult {
  status: 'success' | 'error';
  error?: string;
  retailPrice?: number;
  usedPrice?: number;
  priceRange?: {
    min: number;
    max: number;
  };
  currency?: string;
  productId?: string;
  productTitle?: string;
  productDescription?: string;
  productUrl?: string;
  imageUrl?: string;
  specifications?: Record<string, string>;
  availability?: string;
}

export interface LLMProvider {
  name: string;
  isEnabled(): boolean;
  generate(prompt: string, options?: LLMGenerateOptions): Promise<LLMProviderResult>;
  getPriority(): number;
}

export interface LLMGenerateOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface LLMProviderResult {
  status: 'success' | 'error';
  error?: string;
  text?: string;
  tokensUsed?: number;
  model?: string;
}

/**
 * Provider Registry
 * Manages all registered providers and selects the best available one
 */
export class ProviderRegistry<T extends { name: string; isEnabled(): boolean; getPriority(): number }> {
  private providers: T[] = [];

  register(provider: T): void {
    this.providers.push(provider);
    // Sort by priority (lower number = higher priority)
    this.providers.sort((a, b) => a.getPriority() - b.getPriority());
  }

  getProvider(name: string): T | undefined {
    return this.providers.find(p => p.name === name);
  }

  getEnabledProviders(): T[] {
    return this.providers.filter(p => p.isEnabled());
  }

  getBestProvider(): T | undefined {
    return this.getEnabledProviders()[0];
  }

  getAllProviders(): T[] {
    return [...this.providers];
  }
}
