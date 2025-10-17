import OpenAI from "openai";

// Performance monitoring
interface PerformanceMetrics {
  functionName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tokenUsage?: number;
}

const performanceLog: PerformanceMetrics[] = [];

function startMetric(functionName: string): number {
  const startTime = Date.now();
  performanceLog.push({ functionName, startTime });
  return startTime;
}

function endMetric(startTime: number, functionName: string, tokenUsage?: number) {
  const endTime = Date.now();
  const duration = endTime - startTime;
  const metric = performanceLog.find(m => m.startTime === startTime && m.functionName === functionName);
  if (metric) {
    metric.endTime = endTime;
    metric.duration = duration;
    metric.tokenUsage = tokenUsage;
  }
  console.log(`⚡ ${functionName} completed in ${duration}ms${tokenUsage ? ` (${tokenUsage} tokens)` : ''}`);
  return duration;
}

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const getOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  
  // Log API key status for debugging
  console.log('🔑 OpenAI API Key Status:', apiKey ? `Present (starts with: ${apiKey.substring(0, 7)}...)` : 'MISSING');
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured. Please add it to Replit Secrets.');
  }
  
  return new OpenAI({ apiKey });
};

interface PhotoAnalysis {
  score: number;
  lighting: { score: number; feedback: string };
  focus: { score: number; feedback: string };
  framing: { score: number; feedback: string };
  background: { score: number; feedback: string };
  overallFeedback: string;
  improvements: string[];
  tip: string;
}

interface DescriptionAnalysis {
  score: number;
  strengths: string[];
  missingInfo: string[];
  wordCount: number;
  suggestions: string[];
  aiGeneratedDescription?: string;
}

interface PricingAnalysis {
  recommendedPrice: number;
  reasoning: string;
  marketData: {
    averagePrice: number;
    lowestPrice: number;
    highestPrice: number;
  };
  strategy: {
    sellFast: { price: number; reasoning: string };
    maximizeValue: { price: number; reasoning: string };
  };
  pricingTip: string;
}

export interface ProductAnalysis {
  title: string;
  description: string;
  category: string;
  tags: string[];
  retailPrice: number;
  usedPrice: number;
  condition: string;
  confidence: number;
}

export interface DetectedProduct {
  imageIndices: number[];
  title: string;
  description: string;
  category: string;
  retailPrice: number;
  usedPrice: number;
  condition: string;
  confidence: number;
}

export interface MultiImageAnalysis {
  scenario: "same_product" | "multiple_products";
  products: DetectedProduct[];
  message?: string;
}

// OPTIMIZATION 1: Reduced token limits for faster responses
const TOKEN_LIMITS = {
  PRODUCT_IDENTIFICATION: 1024,  // Reduced from 2048
  DESCRIPTION_ANALYSIS: 1536,    // Reduced from 2048
  PRICING_ANALYSIS: 1024,        // Reduced from 2048
  MULTI_IMAGE_ANALYSIS: 3072,    // Reduced from 4096
  BUNDLE_SUMMARY: 1536,          // Reduced from 2048
};

// OPTIMIZATION 2: Streamlined prompts for faster processing
const CATEGORY_LIST = "Electronics, Furniture, Clothing, Automotive, Books & Media, Sports, Home & Garden, Toys, Other";

export async function identifyProductFromPhoto(
  base64Image: string,
  photoNumber: number,
  manualCategory?: string
): Promise<ProductAnalysis> {
  const startTime = startMetric('identifyProductFromPhoto');
  const openai = getOpenAI();

  console.log(`🚀 [OPTIMIZED] Calling OpenAI API (GPT-5) to identify product from photo #${photoNumber}...`);
  if (manualCategory) {
    console.log(`📁 Manual category override: "${manualCategory}" - AI will skip category detection`);
  }

  try {
    const categoryInstruction = manualCategory 
      ? `5. Category: "${manualCategory}"`
      : `5. Category - ONE OF: ${CATEGORY_LIST}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `Expert product analyzer. Identify products from photos quickly and accurately.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this product photo. Provide:
1. Title (concise, descriptive)
2. Description (2-3 sentences: what it is, condition, key features)
3. Used Price (realistic marketplace price)
4. Retail Price (original/new estimate)
${categoryInstruction}
6. Condition (new, like_new, good, fair, poor)
7. Confidence (0-100)

JSON format:
{"title": string, "description": string, "usedPrice": number, "retailPrice": number, "category": string, "condition": string, "confidence": number}`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "auto" // OPTIMIZATION: Use auto instead of high for faster processing
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: TOKEN_LIMITS.PRODUCT_IDENTIFICATION,
    });

    const result = JSON.parse(response.choices[0].message.content!);
    
    if (manualCategory) {
      result.category = manualCategory;
    }
    
    const tokenUsage = response.usage?.total_tokens;
    endMetric(startTime, 'identifyProductFromPhoto', tokenUsage);
    
    console.log(`✅ [OPTIMIZED] Product identified: "${result.title}"`);
    console.log(`📁 Category: "${result.category}" ${manualCategory ? '(manual)' : '(AI)'} | Condition: ${result.condition} | Confidence: ${result.confidence}%`);
    
    return result;
  } catch (error: any) {
    endMetric(startTime, 'identifyProductFromPhoto');
    console.error("❌ ERROR calling OpenAI API:", error.message);
    throw new Error(`Failed to identify product: ${error.message}`);
  }
}

export async function analyzeDescription(
  description: string,
  title: string,
  category: string
): Promise<DescriptionAnalysis> {
  const startTime = startMetric('analyzeDescription');
  const openai = getOpenAI();

  console.log(`🚀 [OPTIMIZED] Analyzing description...`);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `Expert copywriter for marketplaces. Analyze and improve descriptions efficiently.`,
        },
        {
          role: "user",
          content: `Analyze: Title: ${title}, Category: ${category}, Description: ${description}

Provide: score (0-10), strengths, missing info, suggestions, improved description (150-200 words).

JSON: {"score": number, "strengths": [string], "missingInfo": [string], "wordCount": number, "suggestions": [string], "aiGeneratedDescription": string}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: TOKEN_LIMITS.DESCRIPTION_ANALYSIS,
    });

    const result = JSON.parse(response.choices[0].message.content!);
    const tokenUsage = response.usage?.total_tokens;
    endMetric(startTime, 'analyzeDescription', tokenUsage);
    
    console.log(`✅ [OPTIMIZED] Description analysis complete (score: ${result.score}/10)`);
    
    return result;
  } catch (error: any) {
    endMetric(startTime, 'analyzeDescription');
    console.error("❌ ERROR calling OpenAI API:", error.message);
    throw new Error(`Failed to analyze description: ${error.message}`);
  }
}

export async function analyzePricing(
  title: string,
  description: string,
  category: string,
  condition: string,
  userPrice?: string
): Promise<PricingAnalysis> {
  const startTime = startMetric('analyzePricing');
  const openai = getOpenAI();

  console.log(`🚀 [OPTIMIZED] Analyzing pricing...`);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `Marketplace pricing expert. Provide realistic pricing recommendations.`,
        },
        {
          role: "user",
          content: `Price analysis for: ${title} (${category}, ${condition})${userPrice ? ` - User price: $${userPrice}` : ""}

Provide: recommended price, reasoning, market data (avg/low/high), strategies (sell fast & maximize value), tip.

JSON: {"recommendedPrice": number, "reasoning": string, "marketData": {"averagePrice": number, "lowestPrice": number, "highestPrice": number}, "strategy": {"sellFast": {"price": number, "reasoning": string}, "maximizeValue": {"price": number, "reasoning": string}}, "pricingTip": string}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: TOKEN_LIMITS.PRICING_ANALYSIS,
    });

    const result = JSON.parse(response.choices[0].message.content!);
    const tokenUsage = response.usage?.total_tokens;
    endMetric(startTime, 'analyzePricing', tokenUsage);
    
    console.log(`✅ [OPTIMIZED] Pricing analysis complete: $${result.recommendedPrice}`);
    
    return result;
  } catch (error: any) {
    endMetric(startTime, 'analyzePricing');
    console.error("❌ ERROR calling OpenAI API:", error.message);
    throw new Error(`Failed to analyze pricing: ${error.message}`);
  }
}

export async function analyzeProductImage(
  imageUrl: string,
  photoNumber: number,
  manualCategory?: string
): Promise<ProductAnalysis> {
  const startTime = startMetric('analyzeProductImage');
  const openai = getOpenAI();

  console.log(`🚀 [OPTIMIZED] Analyzing product image #${photoNumber}...`);
  if (manualCategory) {
    console.log(`📁 Manual category: "${manualCategory}"`);
  }

  try {
    const categoryInstruction = manualCategory 
      ? `Category: "${manualCategory}"`
      : `Category - ONE OF: ${CATEGORY_LIST}`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `Expert product analyzer. Fast, accurate identification.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze product. Provide: title, description (2-3 sentences), used price, retail price, ${categoryInstruction}, condition, confidence.

JSON: {"title": string, "description": string, "usedPrice": number, "retailPrice": number, "category": string, "condition": string, "confidence": number}`,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
                detail: "auto" // OPTIMIZATION: Use auto for faster processing
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: TOKEN_LIMITS.PRODUCT_IDENTIFICATION,
    });

    const result = JSON.parse(response.choices[0].message.content!);
    
    if (manualCategory) {
      result.category = manualCategory;
    }
    
    const tokenUsage = response.usage?.total_tokens;
    endMetric(startTime, 'analyzeProductImage', tokenUsage);
    
    console.log(`✅ [OPTIMIZED] Product analyzed: "${result.title}"`);
    console.log(`📁 Category: "${result.category}" | Condition: ${result.condition} | Confidence: ${result.confidence}%`);
    
    return result;
  } catch (error: any) {
    endMetric(startTime, 'analyzeProductImage');
    console.error("❌ ERROR calling OpenAI API:", error.message);
    throw new Error(`Failed to analyze product image: ${error.message}`);
  }
}

// OPTIMIZATION 3: Parallel batch processing for multiple products
export async function analyzeMultipleProductsInParallel(
  imageUrls: string[],
  manualCategory?: string
): Promise<ProductAnalysis[]> {
  const startTime = startMetric('analyzeMultipleProductsInParallel');
  
  console.log(`🚀 [OPTIMIZED] Analyzing ${imageUrls.length} products in parallel...`);
  
  try {
    // Process all images concurrently for maximum speed
    const results = await Promise.all(
      imageUrls.map((url, index) => 
        analyzeProductImage(url, index + 1, manualCategory)
      )
    );
    
    endMetric(startTime, 'analyzeMultipleProductsInParallel');
    console.log(`✅ [OPTIMIZED] All ${imageUrls.length} products analyzed in parallel`);
    
    return results;
  } catch (error: any) {
    endMetric(startTime, 'analyzeMultipleProductsInParallel');
    console.error("❌ ERROR in parallel analysis:", error.message);
    throw new Error(`Failed to analyze products in parallel: ${error.message}`);
  }
}

// AI-powered multi-image analysis to detect same product vs different products
export async function analyzeMultipleImages(imageUrls: string[], manualCategory?: string): Promise<MultiImageAnalysis> {
  const startTime = startMetric('analyzeMultipleImages');
  const openai = getOpenAI();

  console.log(`🚀 [OPTIMIZED] Multi-image analysis (${imageUrls.length} images)...`);
  if (manualCategory) {
    console.log(`📁 Manual category: "${manualCategory}"`);
  }

  try {
    // Build the content array with text prompt and all images
    const content: any[] = [
      {
        type: "text",
        text: `Analyze ${imageUrls.length} images. Group by product. Respond in JSON format.

RULES:
1. SAME ITEM: Match features (color, shape, texture, labels). Group together with all imageIndices.
2. DIFFERENT ITEMS: Separate products, list only relevant imageIndices.
3. 80%+ similarity = same item.

JSON OUTPUT FORMAT:
Same product: {"scenario": "same_product", "products": [{"imageIndices": [0,1,2], "title": string, "description": string, "category": string, "retailPrice": number, "usedPrice": number, "condition": string, "confidence": number}]}

Multiple products: {"scenario": "multiple_products", "products": [{"imageIndices": [0,2], ...}, {"imageIndices": [1,3], ...}]}

Categories: ${CATEGORY_LIST}
Conditions: new, like-new, good, fair, poor
All imageIndices must cover 0-${imageUrls.length - 1}, no duplicates.`,
      },
    ];

    // Add all images with auto detail for speed
    imageUrls.forEach((url) => {
      content.push({
        type: "image_url",
        image_url: {
          url: url,
          detail: "auto" // OPTIMIZATION: Use auto instead of high
        },
      });
    });

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `Expert product analyst. Determine if photos show same product or different products.`,
        },
        {
          role: "user",
          content: content,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: TOKEN_LIMITS.MULTI_IMAGE_ANALYSIS,
    });

    const result = JSON.parse(response.choices[0].message.content!);
    
    // Override categories with manual category if provided
    if (manualCategory && result.products) {
      result.products = result.products.map((product: DetectedProduct) => ({
        ...product,
        category: manualCategory
      }));
      console.log(`📁 All categories set to: "${manualCategory}"`);
    }
    
    // Add a helpful message
    if (result.scenario === "same_product") {
      result.message = `Detected ${imageUrls.length} photos of the same item`;
    } else {
      result.message = `Detected ${result.products.length} different items`;
    }
    
    const tokenUsage = response.usage?.total_tokens;
    endMetric(startTime, 'analyzeMultipleImages', tokenUsage);
    
    console.log('✅ [OPTIMIZED] Multi-image analysis complete:', {
      scenario: result.scenario,
      productCount: result.products.length,
    });
    
    return result;
  } catch (error: any) {
    endMetric(startTime, 'analyzeMultipleImages');
    console.error("❌ ERROR calling OpenAI API:", error.message);
    throw new Error(`Failed to analyze multiple images: ${error.message}`);
  }
}

export interface BundleSummary {
  title: string;
  description: string;
  totalRetailValue: number;
  suggestedBundlePrice: number;
  category: string;
}

export async function generateMultiItemBundleSummary(
  products: DetectedProduct[]
): Promise<BundleSummary> {
  const startTime = startMetric('generateMultiItemBundleSummary');
  const openai = getOpenAI();

  console.log(`🎁 [OPTIMIZED] Generating bundle summary for ${products.length} products...`);

  // Create a concise summary
  const productList = products
    .map((p, idx) => 
      `${idx + 1}. ${p.title} - $${p.usedPrice} (retail: $${p.retailPrice})`
    )
    .join('\n');

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `Expert at creating compelling multi-item bundle listings.`,
        },
        {
          role: "user",
          content: `Create bundle listing for ${products.length} items:

${productList}

Provide:
1. Title (max 80 chars, format: "X-Item Bundle: [summary]")
2. Description (overview, list items, total retail value, bundle savings)
3. Category (best fit or "Other")
4. Total retail value (sum all retail prices)
5. Bundle price (20-40% below retail)

JSON: {"title": string, "description": string, "totalRetailValue": number, "suggestedBundlePrice": number, "category": string}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: TOKEN_LIMITS.BUNDLE_SUMMARY,
    });

    const result = JSON.parse(response.choices[0].message.content!);
    
    const tokenUsage = response.usage?.total_tokens;
    endMetric(startTime, 'generateMultiItemBundleSummary', tokenUsage);
    
    console.log('✅ [OPTIMIZED] Bundle summary generated:', {
      title: result.title,
      bundlePrice: result.suggestedBundlePrice,
      retailValue: result.totalRetailValue,
    });
    
    return result;
  } catch (error: any) {
    endMetric(startTime, 'generateMultiItemBundleSummary');
    console.error("❌ ERROR generating bundle summary:", error.message);
    throw new Error(`Failed to generate bundle summary: ${error.message}`);
  }
}

// OPTIMIZATION 4: Performance reporting
export function getPerformanceReport(): PerformanceMetrics[] {
  return performanceLog;
}

export function clearPerformanceLog(): void {
  performanceLog.length = 0;
}

export const aiService = {
  identifyProductFromPhoto,
  analyzeDescription,
  analyzePricing,
  analyzeProductImage,
  analyzeMultipleImages,
  analyzeMultipleProductsInParallel, // NEW: Parallel processing
  generateMultiItemBundleSummary,
  getPerformanceReport, // NEW: Performance monitoring
  clearPerformanceLog,  // NEW: Performance monitoring
};
