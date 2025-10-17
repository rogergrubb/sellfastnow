import OpenAI from "openai";

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

export async function identifyProductFromPhoto(
  base64Image: string,
  photoNumber: number,
  manualCategory?: string
): Promise<ProductAnalysis> {
  const openai = getOpenAI();

  console.log(`🚀 Calling OpenAI API (GPT-5) to identify product from photo #${photoNumber}...`);
  if (manualCategory) {
    console.log(`📁 Manual category override: "${manualCategory}" - AI will skip category detection`);
  }

  try {
    const categoryInstruction = manualCategory 
      ? `5. Category - USE THIS EXACT CATEGORY: "${manualCategory}" (DO NOT detect or suggest a different category)`
      : `5. Category - MUST BE ONE OF: Electronics, Furniture, Clothing, Automotive, Books & Media, Sports, Home & Garden, Toys, Other
   * Use "Automotive" for: cars, motorcycles, trucks, car parts, automotive accessories, auto tools, vehicle equipment, car audio, tires, wheels, etc.
   * Be specific with automotive items - recognize car parts, tools, accessories`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert product analyzer for online marketplaces. Identify products from photos and provide detailed listing information.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this product photo and provide:

1. Product Title (concise, descriptive, include key details like size/color if visible)
2. Product Description (2-3 sentences: what it is, condition assessment from photo, notable features)
3. Suggested Used Price (realistic marketplace price based on condition)
4. Estimated Retail Price (original/new price estimate)
${categoryInstruction}
6. Condition (new, like_new, good, fair, poor - based on visual assessment)
7. Confidence (0-100, how certain you are about the identification)

Be specific and realistic. If you can't determine something from the photo, make a reasonable estimate.

Respond ONLY with valid JSON in this exact format:
{
  "title": string,
  "description": string,
  "usedPrice": number,
  "retailPrice": number,
  "category": string,
  "condition": string,
  "confidence": number
}`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const result = JSON.parse(response.choices[0].message.content!);
    
    // Override category with manual category if provided (ensure AI follows instructions)
    if (manualCategory) {
      result.category = manualCategory;
    }
    
    console.log(`✅ OpenAI successfully identified product: "${result.title}"`);
    console.log(`📁 Category: "${result.category}" ${manualCategory ? '(manual override)' : '(AI detected)'} | Condition: ${result.condition} | Confidence: ${result.confidence}%`);
    
    return result;
  } catch (error: any) {
    console.error("❌ ERROR calling OpenAI API:", error.message);
    throw new Error(`Failed to identify product: ${error.message}`);
  }
}

export async function analyzeDescription(
  description: string,
  title: string,
  category: string
): Promise<DescriptionAnalysis> {
  const openai = getOpenAI();

  console.log(`🚀 Calling OpenAI API (GPT-5) to analyze description...`);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert copywriter for online marketplaces, helping sellers write compelling, informative product descriptions.`,
        },
        {
          role: "user",
          content: `Analyze this product listing description:

Title: ${title}
Category: ${category}
Description: ${description}

Provide a strength score (0-10), identify what's good, what's missing (size, color, condition details, measurements, materials, features, etc.), and give actionable suggestions.

Also generate an improved AI version of the description (150-250 words) that includes missing information in a natural way.

Respond ONLY with valid JSON:
{
  "score": number,
  "strengths": [string],
  "missingInfo": [string],
  "wordCount": number,
  "suggestions": [string],
  "aiGeneratedDescription": string
}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const result = JSON.parse(response.choices[0].message.content!);
    console.log(`✅ OpenAI description analysis complete (score: ${result.score}/10)`);
    
    return result;
  } catch (error: any) {
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
  const openai = getOpenAI();

  console.log(`🚀 Calling OpenAI API (GPT-5) to analyze pricing...`);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are a marketplace pricing expert. Provide realistic pricing recommendations based on market data and psychology.`,
        },
        {
          role: "user",
          content: `Analyze pricing for:
Title: ${title}
Category: ${category}
Condition: ${condition}
Description: ${description}
${userPrice ? `User's suggested price: $${userPrice}` : ""}

Provide:
- recommended price with reasoning
- market data (average, lowest, highest - make realistic estimates)
- two strategies: sell fast (90% of market) and maximize value (110% of market)
- pricing psychology tip (e.g., $899 vs $900)

Respond ONLY with valid JSON:
{
  "recommendedPrice": number,
  "reasoning": string,
  "marketData": {"averagePrice": number, "lowestPrice": number, "highestPrice": number},
  "strategy": {
    "sellFast": {"price": number, "reasoning": string},
    "maximizeValue": {"price": number, "reasoning": string}
  },
  "pricingTip": string
}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const result = JSON.parse(response.choices[0].message.content!);
    console.log(`✅ OpenAI pricing analysis complete (recommended: $${result.recommendedPrice})`);
    
    return result;
  } catch (error: any) {
    console.error("❌ ERROR calling OpenAI API:", error.message);
    throw new Error(`Failed to analyze pricing: ${error.message}`);
  }
}

// AI-powered product recognition from image
export async function analyzeProductImage(imageUrl: string, manualCategory?: string): Promise<ProductAnalysis> {
  const openai = getOpenAI();

  console.log('🚀 Calling OpenAI API (GPT-5) for product image analysis...');
  if (manualCategory) {
    console.log(`📁 Manual category override: "${manualCategory}" - AI will skip category detection`);
  }

  try {
    const categoryInstruction = manualCategory 
      ? `3. Category - USE THIS EXACT CATEGORY: "${manualCategory}" (DO NOT detect or suggest a different category)`
      : `3. Category - MUST BE ONE OF: Electronics, Furniture, Clothing, Home & Garden, Sports & Outdoors, Books & Media, Toys & Games, Automotive, Other
   * Use "Automotive" for: cars, motorcycles, trucks, car parts, automotive accessories, auto tools, vehicle equipment, car audio, tires, wheels, vehicle maintenance items, etc.
   * Carefully identify automotive-related items`;

    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert product analyst for online marketplaces. Analyze product images and provide detailed, accurate information to help sellers create compelling listings.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this product image and provide:
1. A concise, descriptive product title (5-10 words max)
2. A detailed product description (100-150 words) including:
   - What the item is
   - Visible features and characteristics
   - Apparent condition based on the image
   - Any notable details (brand, model, materials, etc.)
${categoryInstruction}
4. Search/filter tags (3-6 relevant keywords, e.g., "vintage, cast iron, antique, press")
5. Estimated retail price if bought new (realistic market value)
6. Estimated current used price based on apparent condition
7. Condition assessment: new, like-new, good, fair, or poor
8. Confidence score (0-100) in your analysis

Respond ONLY with valid JSON in this exact format:
{
  "title": string,
  "description": string,
  "category": string,
  "tags": string[],
  "retailPrice": number,
  "usedPrice": number,
  "condition": string,
  "confidence": number
}`,
            },
            {
              type: "image_url",
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const result = JSON.parse(response.choices[0].message.content!);
    
    // Override category with manual category if provided (ensure AI follows instructions)
    if (manualCategory) {
      result.category = manualCategory;
    }
    
    console.log(`✅ OpenAI successfully analyzed product image: "${result.title}"`);
    console.log(`📁 Category: "${result.category}" ${manualCategory ? '(manual override)' : '(AI detected)'} | Condition: ${result.condition} | Confidence: ${result.confidence}%`);
    
    return result;
  } catch (error: any) {
    console.error("❌ ERROR calling OpenAI API:", error.message);
    throw new Error(`Failed to analyze product image: ${error.message}`);
  }
}

// AI-powered multi-image analysis to detect same product vs different products
export async function analyzeMultipleImages(imageUrls: string[], manualCategory?: string): Promise<MultiImageAnalysis> {
  const openai = getOpenAI();

  console.log(`🚀 Calling OpenAI API (GPT-5) for multi-image analysis (${imageUrls.length} images)...`);
  if (manualCategory) {
    console.log(`📁 Manual category override: "${manualCategory}" - will apply to all detected products`);
  }

  try {
    // Build the content array with text prompt and all images
    const content: any[] = [
      {
        type: "text",
        text: `Analyze these ${imageUrls.length} images and intelligently group them by product.

CRITICAL INSTRUCTIONS FOR PHOTO GROUPING:

1. SAME ITEM FROM DIFFERENT ANGLES:
   - Look for the SAME physical object photographed from different angles, distances, or lighting
   - Match distinctive features: colors, shapes, textures, patterns, labels, wear marks
   - Group these photos together as ONE product with multiple imageIndices
   - Example: 3 photos of the same grey couch (front view, side view, close-up) = 1 product with imageIndices [0, 1, 2]

2. DIFFERENT ITEMS:
   - If images show completely different objects, create separate products
   - Each product lists only the imageIndices that show that specific item
   - Example: Photo 1 & 3 show a couch, Photo 2 & 4 show a lamp = 2 products

3. VISUAL SIMILARITY ANALYSIS:
   - 80%+ visual similarity = same item from different angles (group together)
   - Different items that happen to look similar = separate products
   - Trust distinctive features over general appearance

OUTPUT FORMAT:

For SAME PRODUCT (all images show one item):
{
  "scenario": "same_product",
  "products": [{
    "imageIndices": [0, 1, 2, 3],
    "title": "Grey Sectional Sofa",
    "description": "Comfortable L-shaped sectional sofa...",
    "category": "Furniture",
    "retailPrice": 1200,
    "usedPrice": 450,
    "condition": "good",
    "confidence": 95
  }]
}

For MULTIPLE PRODUCTS (images show different items):
{
  "scenario": "multiple_products",
  "products": [
    {
      "imageIndices": [0, 2, 4],
      "title": "Grey Sectional Sofa",
      "description": "Comfortable L-shaped sectional...",
      "category": "Furniture",
      "retailPrice": 1200,
      "usedPrice": 450,
      "condition": "good",
      "confidence": 90
    },
    {
      "imageIndices": [1, 3],
      "title": "Modern Table Lamp",
      "description": "Brushed nickel table lamp...",
      "category": "Home & Garden",
      "retailPrice": 80,
      "usedPrice": 35,
      "condition": "like-new",
      "confidence": 85
    }
  ]
}

VALIDATION RULES:
- Category MUST BE ONE OF: Electronics, Furniture, Clothing, Home & Garden, Sports & Outdoors, Books & Media, Toys & Games, Automotive, Other
  * Use "Automotive" for: cars, motorcycles, trucks, car parts, automotive accessories, auto tools, vehicle equipment, car audio, tires, wheels, etc.
- Condition: new, like-new, good, fair, poor
- All imageIndices combined must cover all ${imageUrls.length} images (0-${imageUrls.length - 1})
- No duplicate imageIndices across products
- Confidence score 0-100 based on certainty

Respond ONLY with valid JSON matching the format above.`,
      },
    ];

    // Add all images to the content array
    imageUrls.forEach((url, index) => {
      content.push({
        type: "image_url",
        image_url: {
          url: url,
          detail: "high"
        },
      });
    });

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert product analyst for online marketplaces. You excel at determining whether multiple photos show the same product from different angles or different products entirely.`,
        },
        {
          role: "user",
          content: content,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 4096,
    });

    const result = JSON.parse(response.choices[0].message.content!);
    
    // Override categories with manual category if provided
    if (manualCategory && result.products) {
      result.products = result.products.map((product: DetectedProduct) => ({
        ...product,
        category: manualCategory
      }));
      console.log(`📁 All product categories overridden with manual category: "${manualCategory}"`);
    }
    
    // Add a helpful message
    if (result.scenario === "same_product") {
      result.message = `Detected ${imageUrls.length} photos of the same item`;
    } else {
      result.message = `Detected ${result.products.length} different items in your photos`;
    }
    
    console.log('✅ Multi-image analysis complete:', {
      scenario: result.scenario,
      productCount: result.products.length,
    });
    
    return result;
  } catch (error: any) {
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
  const openai = getOpenAI();

  console.log(`🎁 Generating multi-item bundle summary for ${products.length} products...`);

  // Create a summary of all products for the prompt
  const productList = products
    .map((p, idx) => 
      `Product ${idx + 1}: ${p.title} - ${p.description.substring(0, 100)}... (Used: $${p.usedPrice}, Retail: $${p.retailPrice})`
    )
    .join('\n');

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert at creating compelling multi-item bundle listings for online marketplaces. You excel at summarizing multiple products into a cohesive, attractive bundle listing.`,
        },
        {
          role: "user",
          content: `I have ${products.length} different items that I want to sell as a bundle. Create a compelling bundle listing with:

1. A concise, descriptive title that summarizes all items (max 80 chars, format: "X-Item Bundle: [brief summary]" or "[Item count] Items: [key items]")
2. A well-structured description that:
   - Starts with a brief overview of what's included
   - Lists each item with key details
   - Mentions the total retail value
   - Highlights the bundle savings
3. A category that best fits the bundle (if items are similar) or "Other" if mixed
4. Calculate total retail value (sum of all retail prices)
5. Suggest a competitive bundle price (typically 20-40% below total retail value to incentivize bundle purchase)

Here are the items:
${productList}

Respond ONLY with valid JSON in this exact format:
{
  "title": string,
  "description": string,
  "totalRetailValue": number,
  "suggestedBundlePrice": number,
  "category": string
}`,
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const result = JSON.parse(response.choices[0].message.content!);
    
    console.log('✅ Bundle summary generated:', {
      title: result.title,
      bundlePrice: result.suggestedBundlePrice,
      retailValue: result.totalRetailValue,
    });
    
    return result;
  } catch (error: any) {
    console.error("❌ ERROR generating bundle summary:", error.message);
    throw new Error(`Failed to generate bundle summary: ${error.message}`);
  }
}

export const aiService = {
  identifyProductFromPhoto,
  analyzeDescription,
  analyzePricing,
  analyzeProductImage,
  analyzeMultipleImages,
  generateMultiItemBundleSummary,
};
