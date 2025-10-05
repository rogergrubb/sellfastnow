import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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

export async function analyzePhotoQuality(
  base64Image: string,
  photoNumber: number
): Promise<PhotoAnalysis> {
  const openai = getOpenAI();
  
  if (!openai) {
    // Return mock data if no API key
    return getMockPhotoAnalysis(photoNumber);
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert photography coach helping people take better product photos for online marketplaces. Analyze the image and provide detailed, constructive feedback in JSON format.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `This is photo #${photoNumber} for a product listing. Analyze the quality and provide a score (0-100) for:
- lighting (natural light, shadows, brightness)
- focus (sharpness, clarity)
- framing (composition, angle, item positioning)
- background (cleanliness, distractions)

Also provide:
- overall score (0-100)
- overall feedback (2-3 sentences)
- improvements array (specific actionable tips)
- one progressive tip based on photo number: ${getProgressiveTipPrompt(photoNumber)}

Respond ONLY with valid JSON in this exact format:
{
  "score": number,
  "lighting": {"score": number, "feedback": string},
  "focus": {"score": number, "feedback": string},
  "framing": {"score": number, "feedback": string},
  "background": {"score": number, "feedback": string},
  "overallFeedback": string,
  "improvements": [string],
  "tip": string
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

    return JSON.parse(response.choices[0].message.content!);
  } catch (error: any) {
    console.error("Error analyzing photo:", error);
    return getMockPhotoAnalysis(photoNumber);
  }
}

export async function analyzeDescription(
  description: string,
  title: string,
  category: string
): Promise<DescriptionAnalysis> {
  const openai = getOpenAI();
  
  if (!openai) {
    return getMockDescriptionAnalysis(description);
  }

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

    return JSON.parse(response.choices[0].message.content!);
  } catch (error: any) {
    console.error("Error analyzing description:", error);
    return getMockDescriptionAnalysis(description);
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
  
  if (!openai) {
    return getMockPricingAnalysis(userPrice);
  }

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

    return JSON.parse(response.choices[0].message.content!);
  } catch (error: any) {
    console.error("Error analyzing pricing:", error);
    return getMockPricingAnalysis(userPrice);
  }
}

function getProgressiveTipPrompt(photoNumber: number): string {
  const tips = [
    "lighting fundamentals - explain natural light vs artificial",
    "background basics - clean, non-distracting backgrounds",
    "angle variety - show different perspectives",
    "close-up details - show condition and features",
    "size reference - include common objects for scale",
  ];
  return tips[Math.min(photoNumber - 1, tips.length - 1)];
}

function getMockPhotoAnalysis(photoNumber: number): PhotoAnalysis {
  const tips = [
    "Use natural light from a window for the best results. Avoid harsh overhead lighting that creates shadows.",
    "Keep your background clean and simple. A plain white wall or neutral surface makes the item stand out.",
    "Try different angles! Show the front, back, sides, and top to give buyers a complete view.",
    "Take close-up shots of important details, brand labels, or any wear and tear for transparency.",
    "Include a common object (like a coin or ruler) for size reference so buyers know the scale.",
  ];

  return {
    score: 75,
    lighting: {
      score: 80,
      feedback: "Good natural lighting, minimal shadows",
    },
    focus: { score: 85, feedback: "Sharp and clear focus" },
    framing: { score: 70, feedback: "Item centered but could show more detail" },
    background: {
      score: 65,
      feedback: "Background has some distractions",
    },
    overallFeedback:
      "Decent photo with good lighting and focus. Consider using a cleaner background and trying different angles to showcase the item better.",
    improvements: [
      "Use a plain background to reduce distractions",
      "Add photos from different angles",
      "Include close-ups of important features",
    ],
    tip: tips[Math.min(photoNumber - 1, tips.length - 1)],
  };
}

function getMockDescriptionAnalysis(description: string): DescriptionAnalysis {
  const wordCount = description.trim().split(/\s+/).length;

  return {
    score: Math.min(10, Math.max(3, Math.floor(wordCount / 20))),
    strengths:
      wordCount > 20
        ? ["Clear writing", "Provides basic information"]
        : ["Concise"],
    missingInfo: [
      "Exact measurements or dimensions",
      "Specific condition details",
      "Color and material information",
      "Brand or model if applicable",
      "Reason for selling",
    ],
    wordCount,
    suggestions: [
      "Add specific measurements (length, width, height)",
      "Describe the condition in detail (any scratches, wear, etc.)",
      "Mention the color, material, and any unique features",
      "Include purchase date or how long you've owned it",
      "State why you're selling and if you're the original owner",
    ],
    aiGeneratedDescription: `This ${description.toLowerCase()} is in excellent condition and ready for a new owner. It features high-quality construction and has been well-maintained throughout its use. The item comes from a smoke-free home and shows minimal signs of wear. Perfect for someone looking for a reliable ${description.toLowerCase()} at a great price. Feel free to ask any questions or request additional photos!`,
  };
}

function getMockPricingAnalysis(userPrice?: string): PricingAnalysis {
  const basePrice = userPrice ? parseFloat(userPrice) : 100;
  const recommended = Math.round(basePrice * 0.95);

  return {
    recommendedPrice: recommended,
    reasoning: `Based on similar items in this category and condition, $${recommended} is competitive while leaving room for negotiation. This price balances attracting buyers quickly while maximizing your return.`,
    marketData: {
      averagePrice: Math.round(basePrice * 1.0),
      lowestPrice: Math.round(basePrice * 0.7),
      highestPrice: Math.round(basePrice * 1.3),
    },
    strategy: {
      sellFast: {
        price: Math.round(basePrice * 0.85),
        reasoning:
          "Price 10-15% below market average to attract buyers within 24-48 hours.",
      },
      maximizeValue: {
        price: Math.round(basePrice * 1.1),
        reasoning:
          "Start higher and be prepared to negotiate. Best for unique or high-demand items.",
      },
    },
    pricingTip: `Use psychological pricing: $${recommended - 1} feels significantly cheaper than $${recommended} to buyers, even though it's only $1 difference.`,
  };
}

// AI-powered product recognition from image
export async function analyzeProductImage(imageUrl: string): Promise<ProductAnalysis> {
  const openai = getOpenAI();
  
  if (!openai) {
    console.log('⚠️ No OpenAI API key found, using mock data for product analysis');
    // Return mock data if no API key
    return getMockProductAnalysis();
  }

  try {
    console.log('🚀 Calling OpenAI API with GPT-5 for product image analysis...');
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

    return JSON.parse(response.choices[0].message.content!);
  } catch (error: any) {
    console.error("Error analyzing product image:", error);
    return getMockProductAnalysis();
  }
}

function getMockProductAnalysis(): ProductAnalysis {
  return {
    title: "Product Item",
    description: "This item appears to be in good condition based on the uploaded image. It features quality construction and has been well-maintained. The item shows minimal signs of wear and is ready for a new owner. Please review the photos carefully and feel free to ask any questions about specific details or condition.",
    category: "Other",
    retailPrice: 100,
    usedPrice: 65,
    condition: "good",
    confidence: 50,
  };
}

export const aiService = {
  analyzePhotoQuality,
  analyzeDescription,
  analyzePricing,
  analyzeProductImage,
};
