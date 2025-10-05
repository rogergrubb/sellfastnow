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
  photoNumber: number
): Promise<ProductAnalysis> {
  const openai = getOpenAI();

  console.log(`🚀 Calling OpenAI API (GPT-5) to identify product from photo #${photoNumber}...`);

  try {
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
5. Category (Electronics, Furniture, Clothing, Books, Toys, Sports, Home & Garden, Other, etc.)
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
    console.log(`✅ OpenAI successfully identified product: "${result.title}"`);
    
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
export async function analyzeProductImage(imageUrl: string): Promise<ProductAnalysis> {
  const openai = getOpenAI();

  console.log('🚀 Calling OpenAI API (GPT-5) for product image analysis...');

  try {
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
3. The most appropriate category from: Electronics, Furniture, Clothing, Home & Garden, Sports & Outdoors, Books & Media, Toys & Games, Automotive, Other
4. Estimated retail price if bought new (realistic market value)
5. Estimated current used price based on apparent condition
6. Condition assessment: new, like-new, good, fair, or poor
7. Confidence score (0-100) in your analysis

Respond ONLY with valid JSON in this exact format:
{
  "title": string,
  "description": string,
  "category": string,
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
    console.log(`✅ OpenAI successfully analyzed product image: "${result.title}"`);
    
    return result;
  } catch (error: any) {
    console.error("❌ ERROR calling OpenAI API:", error.message);
    throw new Error(`Failed to analyze product image: ${error.message}`);
  }
}

// AI-powered multi-image analysis to detect same product vs different products
export async function analyzeMultipleImages(imageUrls: string[]): Promise<MultiImageAnalysis> {
  const openai = getOpenAI();

  console.log(`🚀 Calling OpenAI API (GPT-5) for multi-image analysis (${imageUrls.length} images)...`);

  try {
    // Build the content array with text prompt and all images
    const content: any[] = [
      {
        type: "text",
        text: `Analyze these ${imageUrls.length} images and determine:

A) SAME PRODUCT: All images show the same item from different angles/views
B) DIFFERENT PRODUCTS: Images show distinct, separate items

If SAME PRODUCT:
- Provide ONE title, description, category, retail price, used price, condition
- Note that multiple angles of the same item were detected

If DIFFERENT PRODUCTS:
- List each distinct product detected
- For each product, specify which image index/indices (0-based) show it
- Provide separate title, description, category, retail price, used price, and condition for each product

Guidelines:
- Be thorough in your analysis
- Category should be one of: Electronics, Furniture, Clothing, Home & Garden, Sports & Outdoors, Books & Media, Toys & Games, Automotive, Other
- Condition should be one of: new, like-new, good, fair, poor
- Provide realistic market-based pricing
- Confidence score should reflect how certain you are about the analysis

Respond ONLY with valid JSON in this exact format:
{
  "scenario": "same_product" | "multiple_products",
  "products": [
    {
      "imageIndices": [0, 1, 2],
      "title": "Product Title",
      "description": "Detailed description...",
      "category": "Electronics",
      "retailPrice": 500,
      "usedPrice": 350,
      "condition": "good",
      "confidence": 85
    }
  ]
}`,
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

export const aiService = {
  identifyProductFromPhoto,
  analyzeDescription,
  analyzePricing,
  analyzeProductImage,
  analyzeMultipleImages,
};
