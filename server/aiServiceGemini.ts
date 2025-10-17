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

// Category list
const CATEGORY_LIST = "Electronics, Furniture, Clothing, Vehicles, Services";

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
    let jsonText = text;
    if (text.includes('```json')) {
      jsonText = text.split('```json')[1].split('```')[0].trim();
    } else if (text.includes('```')) {
      jsonText = text.split('```')[1].split('```')[0].trim();
    }

    const analysis: ProductAnalysis = JSON.parse(jsonText);
    
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
      console.error("❌ JSON parse error. Raw content:", jsonText.substring(0, 500));
      throw new Error(`Invalid JSON response from Gemini: ${parseError.message}`);
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

