// Pipeline Type Definitions

export interface PipelineOptions {
  skipPricing?: boolean;
  llmModel?: 'gpt-5' | 'gemini-2.0-flash';
  skipStep1?: boolean;
  skipStep2?: boolean;
  skipStep3?: boolean;
}

// ============================================================================
// STEP 1: Image Analysis Types
// ============================================================================

export interface RekognitionResult {
  status: 'success' | 'error';
  error?: string;
  objects?: Array<{
    name: string;
    confidence: number;
    boundingBox?: {
      left: number;
      top: number;
      width: number;
      height: number;
    };
  }>;
  labels?: Array<{
    name: string;
    confidence: number;
  }>;
  text?: Array<{
    detectedText: string;
    confidence: number;
  }>;
  confidence?: number;
}

export interface VisionResult {
  status: 'success' | 'error';
  error?: string;
  labels?: Array<{
    description: string;
    score: number;
  }>;
  objects?: Array<{
    name: string;
    score: number;
    boundingPoly?: any;
  }>;
  text?: Array<{
    description: string;
    locale?: string;
  }>;
  webEntities?: Array<{
    entityId?: string;
    description: string;
    score: number;
  }>;
  confidence?: number;
}

export interface UnifiedDetection {
  primaryObject: string;
  category: string;
  detectedText: string[];
  visualTags: string[];
  confidence: number;
}

export interface Step1Result {
  timestamp: string;
  duration_ms: number;
  sources: {
    rekognition: RekognitionResult;
    vision: VisionResult;
  };
  unified: UnifiedDetection;
}

// ============================================================================
// STEP 2: Product Enrichment Types
// ============================================================================

export interface AmazonProductResult {
  status: 'success' | 'error';
  error?: string;
  asin?: string;
  title?: string;
  retail_price?: number;
  currency?: string;
  availability?: string;
  url?: string;
  imageUrl?: string;
  specifications?: Record<string, string>;
}

export interface GoogleShoppingResult {
  status: 'success' | 'error';
  error?: string;
  price_range?: {
    min: number;
    max: number;
  };
  merchant_count?: number;
  avg_price?: number;
  offers?: Array<{
    merchant: string;
    price: number;
    url: string;
  }>;
}

export interface EbayResult {
  status: 'success' | 'error';
  error?: string;
  used_price_range?: {
    min: number;
    max: number;
  };
  avg_used_price?: number;
  sold_count?: number;
  listings?: Array<{
    title: string;
    price: number;
    condition: string;
    url: string;
  }>;
}

export interface UnifiedPricing {
  retail_price?: number;
  used_price_estimate?: number;
  price_confidence: number;
  product_identifiers?: {
    asin?: string;
    upc?: string;
    ean?: string;
  };
}

export interface Step2Result {
  timestamp: string;
  duration_ms: number;
  sources: {
    amazon: AmazonProductResult;
    google_shopping: GoogleShoppingResult;
    ebay: EbayResult;
  };
  unified: UnifiedPricing;
}

// ============================================================================
// STEP 3: AI Synthesis Types
// ============================================================================

export interface GeneratedContent {
  title: string;
  description: string;
  short_description: string;
  bullet_points: string[];
  seo: {
    meta_title: string;
    meta_description: string;
    keywords: string[];
    slug: string;
  };
  category: string;
  tags: string[];
  condition_assessment: 'new' | 'like-new' | 'good' | 'fair' | 'poor' | 'unknown';
  confidence: number;
}

export interface Step3Result {
  timestamp: string;
  duration_ms: number;
  llm: {
    model: string;
    tokens_used?: number;
    status: 'success' | 'error';
    error?: string;
  };
  generated: GeneratedContent;
}

// ============================================================================
// Final Pipeline Output
// ============================================================================

export interface FinalProduct {
  title: string;
  description: string;
  short_description: string;
  category: string;
  tags: string[];
  pricing: {
    retail_price?: number;
    used_price_estimate?: number;
    currency: string;
  };
  seo: {
    meta_title: string;
    meta_description: string;
    keywords: string[];
    slug: string;
  };
  identifiers?: {
    asin?: string;
    upc?: string;
    ean?: string;
  };
  confidence: number;
}

export interface PipelineResult {
  pipeline_version: string;
  image_url: string;
  processed_at: string;
  total_duration_ms: number;
  status: 'success' | 'partial' | 'error';
  error?: string;
  
  step1?: Step1Result;
  step2?: Step2Result;
  step3?: Step3Result;
  
  final_product?: FinalProduct;
}

// ============================================================================
// Batch Processing
// ============================================================================

export interface BatchRequest {
  image_urls: string[];
  options?: PipelineOptions;
}

export interface BatchResult {
  status: 'success' | 'partial' | 'error';
  total_images: number;
  successful: number;
  failed: number;
  results: Array<{
    image_url: string;
    data?: PipelineResult;
    error?: string;
  }>;
}
