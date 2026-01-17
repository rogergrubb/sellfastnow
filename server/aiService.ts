import { GoogleGenerativeAI } from "@google/generative-ai";

// Performance monitoring
interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: Date;
  tokens?: number;
}

const performanceLog: PerformanceMetrics[] = [];

function startMetric(operation: string): number {
  return Date.now();
}

function endMetric(startTime: number, operation: string, tokens?: number): number {
  const duration = Date.now() - startTime;
  performanceLog.push({
    operation,
    duration,
    timestamp: new Date(),
    tokens,
  });
  console.log(`⚡ ${operation} completed in ${duration}ms${tokens ? ` (${tokens} tokens)` : ''}`);
  return duration;
}

const getGemini = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY or GOOGLE_AI_API_KEY not found in environment variables");
    throw new Error("Gemini API key not configured");
  }
  
  console.log(`🔑 Gemini API Key Status: Present (starts with: ${apiKey.substring(0, 10)}...)`);
  return new GoogleGenerativeAI(apiKey);
};

// Category list - must match the categories in PostAd.tsx form
const CATEGORY_LIST = "Electronics, Furniture, Clothing, Home & Garden, Sports & Outdoors, Books & Media, Toys & Games, Automotive, Other";

// Type definitions
export interface ProductAnalysis {
  title: string;
  description: string;
  category: string;
  tags?: string[];
  retailPrice: number;
  usedPrice: number;
  condition: string;
  confidence: number;
}

export interface DetectedProduct {
  imageIndices: number[];
  title?: string;
  description?: string;
  category?: string;
  retailPrice?: number;
  usedPrice?: number;
  condition?: string;
  confidence?: number;
}

export interface MultiImageAnalysis {
  scenario: "same_product" | "multiple_products";
  message: string;
  products: DetectedProduct[];
}

// Convert image URL to base64 for Gemini
async function urlToBase64(url: string): Promise<{ data: string; mimeType: string }> {
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    // Determine MIME type from URL or response
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    return {
      data: base64,
      mimeType: contentType
    };
  } catch (error: any) {
    console.error(`❌ Error converting image to base64:`, error.message);
    throw error;
  }
}

/**
 * Robust JSON extraction from AI responses
  * Handles multiple markdown formats and validates JSON structure
   * Used by both analyzeProductImage and analyzeMultipleImages
    */
function extractJSON(text: string): string {
    // Remove markdown code blocks
    let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    // Find first { and last } to extract JSON object
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');

    if (start === -1 || end === -1) {
          throw new Error('No JSON object found in response');
    }

    const json = cleaned.substring(start, end + 1);

    // Try to parse to validate it's valid JSON
    try {
          JSON.parse(json);
          return json;
    } catch (e) {
          throw new Error(`Invalid JSON extracted: ${e.message}`);
    }
}

// AI-powered product recognition from image
export async function analyzeProductImage(
  imageUrl: string,
  photoNumber: number,
  manualCategory?: string
): Promise<ProductAnalysis> {
  const startTime = startMetric('analyzeProductImage');
  const genAI = getGemini();

  console.log(`🚀 [GEMINI] Analyzing product image #${photoNumber}...`);
  if (manualCategory) {
    console.log(`📁 Manual category: "${manualCategory}"`);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const categoryInstruction = manualCategory
      ? `Category: "${manualCategory}"`
      : `Category - ONE OF: ${CATEGORY_LIST}`;

    const prompt = `Analyze this product image and provide detailed information in JSON format.

REQUIRED FIELDS:
1. Title: Specific product name (brand, model, key features)
2. Description: Detailed 2-3 sentence description highlighting condition, features, included items
3. ${categoryInstruction}
4. Tags: Array of 3-5 relevant keywords
5. Retail Price: Estimated new/MSRP price in USD (number only, no $)
6. Used Price: Estimated fair used market price in USD (number only, no $)
7. Condition: One of: new, like-new, excellent, good, fair, poor
8. Confidence: Your confidence level 0-100

PRICING GUIDELINES:
- Research current market prices for this specific item
- Consider condition, age, and completeness
- Used price should be 30-70% of retail depending on condition
- Be realistic and competitive

JSON OUTPUT FORMAT:
{
  "title": "iPhone 13 Pro Max - 256GB Sierra Blue",
  "description": "Flagship smartphone with 6.7-inch Super Retina XDR display, A15 Bionic chip, and pro camera system. Excellent condition with minor wear on edges.",
  "category": "Electronics",
  "tags": ["smartphone", "iphone", "apple", "256gb", "sierra-blue"],
  "retailPrice": 1099,
  "usedPrice": 749,
  "condition": "excellent",
  "confidence": 95
}`;

    // Convert image URL to base64
    const imageData = await urlToBase64(imageUrl);

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageData.data,
          mimeType: imageData.mimeType
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response (Gemini sometimes wraps it in markdown)
    let jsonText = '';
    try {
          jsonText = extractJSON(text);
    } catch (extractError) {
          // Log the actual response for debugging
          console.error('❌ Failed to extract JSON from response:');
          console.error('Response text:', text);
          console.error('Extraction error:', extractError.message);
          endMetric(startTime, 'analyzeProductImage', 0);
          throw new Error(`JSON extraction failed: ${extractError.message}`);
    }

      // Parse the extracted JSON
      let analysis: ProductAnalysis;
      try {
            analysis = JSON.parse(jsonText);
      } catch (parseError) {
            console.error('❌ Failed to parse extracted JSON:');
            console.error('JSON text:', jsonText);
            console.error('Parse error:', parseError.message);
            endMetric(startTime, 'analyzeProductImage', 0);
            throw new Error(`JSON parsing failed: ${parseError.message}`);
      }


    
    // Override category if manual category provided
    if (manualCategory) {
      analysis.category = manualCategory;
    }
    
    endMetric(startTime, 'analyzeProductImage');
    
    console.log(`✅ [GEMINI] Analysis complete: "${analysis.title}"`);
    console.log(`📁 Category: "${analysis.category}" | Condition: ${analysis.condition} | Confidence: ${analysis.confidence}%`);
    
    return analysis;
  } catch (error: any) {
    endMetric(startTime, 'analyzeProductImage');
    console.error("❌ ERROR calling Gemini API:", error.message);
    throw new Error(`Failed to analyze product image: ${error.message}`);
  }
}

// AI-powered multi-image analysis to detect same product vs different products
export async function analyzeMultipleImages(imageUrls: string[], manualCategory?: string): Promise<MultiImageAnalysis> {
  const startTime = startMetric('analyzeMultipleImages');
  const genAI = getGemini();

  console.log(`🚀 [GEMINI] Multi-image analysis (${imageUrls.length} images)...`);
  if (manualCategory) {
    console.log(`📁 Manual category: "${manualCategory}"`);
  }

  // OPTIMIZATION: If more than 8 images, process in batches to avoid API limits
  const MAX_IMAGES_PER_BATCH = 8;
  if (imageUrls.length > MAX_IMAGES_PER_BATCH) {
    console.log(`⚡ Processing ${imageUrls.length} images in batches of ${MAX_IMAGES_PER_BATCH}...`);
    
    const batches = [];
    for (let i = 0; i < imageUrls.length; i += MAX_IMAGES_PER_BATCH) {
      batches.push(imageUrls.slice(i, i + MAX_IMAGES_PER_BATCH));
    }
    
    console.log(`📦 Split into ${batches.length} batches`);
    
    // Process batches sequentially to avoid overwhelming the API
    const allProducts: DetectedProduct[] = [];
    let globalImageIndex = 0;
    
    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];
      console.log(`🔄 Processing batch ${batchIdx + 1}/${batches.length} (${batch.length} images)...`);
      
      try {
        const batchResult = await analyzeMultipleImages(batch, manualCategory);
        
        // Adjust image indices to be global instead of batch-local
        const adjustedProducts = batchResult.products.map(product => ({
          ...product,
          imageIndices: product.imageIndices.map(idx => idx + globalImageIndex)
        }));
        
        allProducts.push(...adjustedProducts);
        globalImageIndex += batch.length;
        
        console.log(`✅ Batch ${batchIdx + 1} complete: ${adjustedProducts.length} products`);
      } catch (error: any) {
        console.error(`❌ Batch ${batchIdx + 1} failed:`, error.message);
        // Create fallback products for failed batch
        for (let i = 0; i < batch.length; i++) {
          allProducts.push({
            imageIndices: [globalImageIndex + i],
            title: '',
            description: '',
            category: manualCategory || '',
            retailPrice: 0,
            usedPrice: 0,
            condition: '',
            confidence: 0
          });
        }
        globalImageIndex += batch.length;
      }
    }
    
    endMetric(startTime, 'analyzeMultipleImages');
    
    return {
      scenario: 'multiple_products',
      message: `Detected ${allProducts.length} items from ${imageUrls.length} images (batched processing)`,
      products: allProducts
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const prompt = `Analyze ${imageUrls.length} images. Group by product. Respond in JSON format.

RULES:
1. SAME ITEM: Match features (color, shape, texture, labels). Group together with all imageIndices.
2. DIFFERENT ITEMS: Separate products, list only relevant imageIndices.
3. 80%+ similarity = same item.

JSON OUTPUT FORMAT:
Same product: {"scenario": "same_product", "products": [{"imageIndices": [0,1,2], "title": "Product Name", "description": "...", "category": "Electronics", "retailPrice": 100, "usedPrice": 70, "condition": "good", "confidence": 90}]}

Multiple products: {"scenario": "multiple_products", "products": [{"imageIndices": [0,2], ...}, {"imageIndices": [1,3], ...}]}

Categories: ${CATEGORY_LIST}
Conditions: new, like-new, good, fair, poor
All imageIndices must cover 0-${imageUrls.length - 1}, no duplicates.`;

    // Convert all images to base64
    const imageParts = await Promise.all(
      imageUrls.map(async (url) => {
        const imageData = await urlToBase64(url);
        return {
          inlineData: {
            data: imageData.data,
            mimeType: imageData.mimeType
          }
        };
      })
    );

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    let jsonText = text;
    if (text.includes('```json')) {
      jsonText = text.split('```json')[1].split('```')[0].trim();
    } else if (text.includes('```')) {
      jsonText = text.split('```')[1].split('```')[0].trim();
    }

    let analysis: MultiImageAnalysis;
    try {
      analysis = JSON.parse(jsonText);
    } catch (parseError: any) {
          console.error("❌ JSON parse error. Raw content:", text.substring(0, 500));
          console.error("❌ Extracted jsonText:", jsonText.substring(0, 500));
          throw new Error(`Invalid JSON response from Gemini: ${parseError.message}. Raw text: ${text.substring(0, 200)}`);
    }
    }
    
    // Override categories with manual category if provided
    if (manualCategory && analysis.products) {
      analysis.products = analysis.products.map((product: DetectedProduct) => ({
        ...product,
        category: manualCategory
      }));
      console.log(`📁 All categories set to: "${manualCategory}"`);
    }
    
    // Add a helpful message
    if (analysis.scenario === "same_product") {
      analysis.message = `Detected ${imageUrls.length} photos of the same item`;
    } else {
      analysis.message = `Detected ${analysis.products.length} different items`;
    }
    
    endMetric(startTime, 'analyzeMultipleImages');
    
    console.log('✅ [GEMINI] Multi-image analysis complete:', {
      scenario: analysis.scenario,
      productCount: analysis.products.length,
    });
    
    return analysis;
  } catch (error: any) {
    endMetric(startTime, 'analyzeMultipleImages');
    console.error("❌ ERROR calling Gemini API:", error.message);
    throw new Error(`Failed to analyze multiple images: ${error.message}`);
  }
}

export function getPerformanceMetrics(): PerformanceMetrics[] {
  return performanceLog;
}

/**
 * Generate a bundle summary for multiple products
 */
export async function generateMultiItemBundleSummary(products: any[]): Promise<{
  title: string;
  description: string;
  suggestedBundlePrice: number;
}> {
  const startTime = startMetric('generateMultiItemBundleSummary');
  
  try {
    if (!products || products.length === 0) {
      throw new Error("No products provided for bundle");
    }
    
    // Create a summary of products for context
    const productSummary = products
      .map((p, i) => `${i + 1}. ${p.title || 'Untitled'} - $${p.usedPrice || p.price || 'N/A'}`)
      .join('\n');
    
    // Get individual prices to calculate bundle discount
    const individualPrices = products.map(p => parseFloat(p.usedPrice || p.price || '0'));
    const totalIndividualPrice = individualPrices.reduce((sum, price) => sum + price, 0);
    
    const genAI = getGemini();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    
    const prompt = `You are an e-commerce expert. I have the following items that a seller wants to bundle together:

${productSummary}

Total individual value: $${totalIndividualPrice.toFixed(2)}

Generate a compelling bundle offer. Respond in JSON format ONLY (no markdown, no extra text):
{
  "title": "A catchy, descriptive bundle title (e.g., 'Complete Home Studio Bundle')",
  "description": "A 2-3 sentence marketing description explaining the bundle value and what buyer gets",
  "suggestedBundlePrice": A recommended bundle price that offers 10-20% discount from individual items (as a number, not string)
}

Rules:
- Title should be under 80 characters
- Description should be 2-3 sentences, marketing-focused
- suggestedBundlePrice should be 10-20% less than the sum of individual prices ($${totalIndividualPrice.toFixed(2)})
- Respond ONLY with valid JSON, no additional text`;

    const response = await model.generateContent(prompt);
    const responseText = response.response.text();
    
    console.log('🎁 Gemini bundle response:', responseText);
    
    // Parse the JSON response
    let bundleSummary;
    try {
      bundleSummary = JSON.parse(responseText);
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        bundleSummary = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse bundle summary response");
      }
    }
    
    // Validate the response
    if (!bundleSummary.title || !bundleSummary.description || !bundleSummary.suggestedBundlePrice) {
      throw new Error("Invalid bundle summary structure");
    }
    
    // Ensure price is a number
    bundleSummary.suggestedBundlePrice = Number(bundleSummary.suggestedBundlePrice);
    
    // Validate price is reasonable (10-90% of individual total)
    if (bundleSummary.suggestedBundlePrice < totalIndividualPrice * 0.1 || 
        bundleSummary.suggestedBundlePrice > totalIndividualPrice * 0.9) {
      console.warn(`⚠️ Bundle price ${bundleSummary.suggestedBundlePrice} seems unusual, adjusting...`);
      bundleSummary.suggestedBundlePrice = totalIndividualPrice * 0.85; // Default to 15% discount
    }
    
    endMetric(startTime, 'generateMultiItemBundleSummary');
    
    return bundleSummary;
  } catch (error: any) {
    endMetric(startTime, 'generateMultiItemBundleSummary');
    console.error("❌ ERROR generating bundle summary:", error.message);
    throw new Error(`Failed to generate bundle summary: ${error.message}`);
  }
}

// Force rebuild Mon Nov  3 03:51:37 EST 2025
