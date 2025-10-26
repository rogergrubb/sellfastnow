import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SuggestionInput {
  objectTypes?: string[];
  geolocation?: string;
  timestamp?: string;
  userBehaviorPatterns?: {
    frequency?: string;
    listingTypes?: string[];
  };
}

export interface CollectionSuggestion {
  suggestions: string[];
  segmentPrediction: string;
  confidence: number;
  source: string;
}

/**
 * Generate neutral, context-aware collection name suggestions
 * Based on object detection, location, timestamps, and user patterns
 */
export async function generateCollectionSuggestions(
  input: SuggestionInput
): Promise<CollectionSuggestion> {
  try {
    const { objectTypes = [], geolocation, timestamp, userBehaviorPatterns } = input;

    // Build context for AI
    const contextParts: string[] = [];
    
    if (objectTypes.length > 0) {
      contextParts.push(`Objects detected: ${objectTypes.join(", ")}`);
    }
    
    if (geolocation) {
      contextParts.push(`Location: ${geolocation}`);
    }
    
    if (timestamp) {
      contextParts.push(`Date: ${timestamp}`);
    }
    
    if (userBehaviorPatterns) {
      if (userBehaviorPatterns.frequency) {
        contextParts.push(`Listing frequency: ${userBehaviorPatterns.frequency}`);
      }
      if (userBehaviorPatterns.listingTypes) {
        contextParts.push(`Common listing types: ${userBehaviorPatterns.listingTypes.join(", ")}`);
      }
    }

    const context = contextParts.join("\n");

    const prompt = `You are an AI assistant helping users organize their draft listings into collections.

Context about the items:
${context}

Based on this context, provide:
1. 3-5 neutral, helpful collection name suggestions (NO personal names or identities)
2. Predict the user segment (choose ONE): realtor, reseller, collector, creator, writer, photographer, general
3. Confidence score (0.0 to 1.0)

Guidelines:
- Suggestions should be descriptive and practical
- Include time periods when relevant (e.g., "Spring 2025", "Q1 Inventory")
- Include location when relevant (e.g., "Downtown Listings", "Client Homes")
- Be professional and neutral
- Never use personal names or facial recognition data

Examples:
- "Garage Sale – Spring 2025"
- "Client Inventory – 2025 Listings"
- "Flip Inventory"
- "Art Pieces – Studio Batch"
- "Writing Prompts – Book Prep"
- "Portfolio Uploads – April"

Respond in JSON format:
{
  "suggestions": ["suggestion1", "suggestion2", "suggestion3", "suggestion4", "suggestion5"],
  "segment": "realtor|reseller|collector|creator|writer|photographer|general",
  "confidence": 0.85,
  "reasoning": "brief explanation"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that generates neutral, context-aware collection names for organizing items. Always respond in valid JSON format.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(responseText);

    // Determine primary source
    let source = "general";
    if (objectTypes.length > 0) source = "objectType";
    else if (geolocation) source = "geo";
    else if (timestamp) source = "timestamp";

    return {
      suggestions: parsed.suggestions || [
        "My Collection",
        "Draft Items",
        "Unsorted",
      ],
      segmentPrediction: parsed.segment || "general",
      confidence: parsed.confidence || 0.5,
      source,
    };
  } catch (error) {
    console.error("Error generating collection suggestions:", error);
    
    // Fallback suggestions
    return {
      suggestions: [
        "My Collection",
        "Draft Items",
        "Unsorted Drafts",
      ],
      segmentPrediction: "general",
      confidence: 0.3,
      source: "fallback",
    };
  }
}

/**
 * Get monetization offer based on user segment
 */
export function getMonetizationOffer(segment: string): {
  offerType: string;
  offerName: string;
  offerDescription: string;
  ctaText: string;
} {
  const offers: Record<string, any> = {
    realtor: {
      offerType: "subdomain",
      offerName: "Realtor Subdomain",
      offerDescription: "Get your own branded subdomain for client listings",
      ctaText: "Upgrade to Pro - Get Your Realtor Subdomain",
    },
    reseller: {
      offerType: "pro_upgrade",
      offerName: "SellFast Pro",
      offerDescription: "Turn your Garage Sale into real sales — instant buyer visibility",
      ctaText: "Try SellFast Pro for Instant Visibility",
    },
    collector: {
      offerType: "affiliate",
      offerName: "Appraisal Services",
      offerDescription: "Get professional appraisals for your collectibles",
      ctaText: "Connect with Expert Appraisers",
    },
    creator: {
      offerType: "storefront",
      offerName: "Branded Storefront",
      offerDescription: "Showcase your art with a professional storefront",
      ctaText: "Create Your Branded Storefront",
    },
    writer: {
      offerType: "cross_sell",
      offerName: "ReplyMaster Pro",
      offerDescription: "Enhance your writing with AI-powered tools",
      ctaText: "Upgrade to ReplyMaster Pro",
    },
    photographer: {
      offerType: "cloud_backup",
      offerName: "Cloud Backup & Watermark",
      offerDescription: "Protect your portfolio with cloud backup and watermarking",
      ctaText: "Secure Your Portfolio",
    },
  };

  return offers[segment] || {
    offerType: "general",
    offerName: "SellFast Pro",
    offerDescription: "Get more features with SellFast Pro",
    ctaText: "Upgrade to Pro",
  };
}

