// Step 3: AI Synthesis Layer
// Uses LLM to generate product metadata from combined vision and pricing data

import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { logger } from './utils/logger';
import type { Step1Result, Step2Result, Step3Result, GeneratedContent } from './types';

export class AISynthesisStep {
  private geminiClient: GoogleGenerativeAI | null;
  private openaiClient: OpenAI | null;
  private geminiEnabled: boolean;
  private openaiEnabled: boolean;

  constructor() {
    // Check if Gemini API is configured (native)
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    this.geminiEnabled = !!geminiKey;

    if (!this.geminiEnabled) {
      logger.warn('STEP3', 'Native Gemini API not configured');
      this.geminiClient = null;
    } else {
      this.geminiClient = new GoogleGenerativeAI(geminiKey!);
      logger.info('STEP3', 'Native Gemini AI client initialized');
    }

    // Check if OpenAI-compatible API is available (Manus environment)
    this.openaiEnabled = !!process.env.OPENAI_API_KEY;
    if (this.openaiEnabled) {
      this.openaiClient = new OpenAI();
      logger.info('STEP3', 'OpenAI-compatible client initialized');
    } else {
      this.openaiClient = null;
    }
  }

  /**
   * Build prompt for LLM from pipeline data
   */
  private buildPrompt(step1Result: Step1Result, step2Result: Step2Result): string {
    const { unified: detection } = step1Result;
    const { unified: pricing } = step2Result;

    // Extract additional data from pricing sources
    const shopsavvyData = step2Result.sources?.shopsavvy;
    const amazonData = step2Result.sources?.amazon;
    
    let additionalContext = '';
    
    // Add ShopSavvy product details if available
    if (shopsavvyData && shopsavvyData.status === 'success') {
      additionalContext += `\n**SHOPSAVVY DATA:**\n`;
      if (shopsavvyData.productTitle) {
        additionalContext += `- Product Title: ${shopsavvyData.productTitle}\n`;
      }
      if (shopsavvyData.productDescription) {
        additionalContext += `- Product Description: ${shopsavvyData.productDescription.substring(0, 300)}...\n`;
      }
      if (shopsavvyData.specifications) {
        additionalContext += `- Specifications: ${JSON.stringify(shopsavvyData.specifications).substring(0, 200)}\n`;
      }
      if (shopsavvyData.availability) {
        additionalContext += `- Availability: ${shopsavvyData.availability}\n`;
      }
    }
    
    // Add Amazon product details if available
    if (amazonData && amazonData.status === 'success') {
      additionalContext += `\n**AMAZON DATA:**\n`;
      if (amazonData.title) {
        additionalContext += `- Product Title: ${amazonData.title}\n`;
      }
      if (amazonData.specifications) {
        additionalContext += `- Specifications: ${JSON.stringify(amazonData.specifications).substring(0, 200)}\n`;
      }
    }

    const prompt = `You are a product listing expert. Generate comprehensive, SEO-optimized product metadata based on the following analysis:

**VISUAL ANALYSIS:**
- Primary Object: ${detection.primaryObject}
- Category: ${detection.category}
- Detected Text: ${detection.detectedText.join(', ') || 'None'}
- Visual Tags: ${detection.visualTags.slice(0, 15).join(', ')}
- Confidence: ${(detection.confidence * 100).toFixed(1)}%

**PRICING DATA:**
- Retail Price: ${pricing.retail_price ? `$${pricing.retail_price.toFixed(2)}` : 'Unknown'}
- Used Price Estimate: ${pricing.used_price_estimate ? `$${pricing.used_price_estimate.toFixed(2)}` : 'Unknown'}
- Product Identifiers: ${pricing.product_identifiers ? JSON.stringify(pricing.product_identifiers) : 'None'}${additionalContext}

**TASK:**
Generate a complete product listing with the following JSON structure:

{
  "title": "A clear, descriptive product title (50-80 characters)",
  "description": "A detailed 3-4 paragraph product description highlighting features, benefits, and condition",
  "short_description": "A 1-2 sentence summary (100-150 characters)",
  "bullet_points": ["Key feature 1", "Key feature 2", "Key feature 3", "Key feature 4", "Key feature 5"],
  "seo": {
    "meta_title": "SEO-optimized title (50-60 characters)",
    "meta_description": "SEO-optimized description (150-160 characters)",
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
    "slug": "url-friendly-product-slug"
  },
  "category": "Exact category from: Electronics, Furniture, Clothing, Home & Garden, Sports & Outdoors, Books & Media, Toys & Games, Automotive, Other",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "condition_assessment": "One of: new, like-new, good, fair, poor, unknown",
  "confidence": 0.0-1.0 (your confidence in this analysis)
}

**GUIDELINES:**
- Use ALL available data sources (visual, pricing, ShopSavvy, Amazon) to create accurate descriptions
- Prioritize product titles and descriptions from ShopSavvy/Amazon if available
- Incorporate detected text and visual tags naturally
- Include relevant technical specifications from all sources
- Make the description compelling and SEO-optimized for search engines
- **SEO Meta Tags**: Create highly optimized meta tags that:
  * Include primary keywords naturally
  * Are within character limits (title: 50-60, description: 150-160)
  * Are compelling for click-through rate
  * Include brand name and key features
  * Use action words and benefits
- **Keywords**: Select 5-10 highly relevant keywords including:
  * Brand name
  * Product type
  * Key features
  * Category
  * Common search terms
- The slug should be lowercase with hyphens, SEO-friendly
- Assess condition based on visual cues and available data

Return ONLY the JSON object, no additional text.`;

    return prompt;
  }

  /**
   * Parse LLM response and validate structure
   */
  private parseResponse(response: string): GeneratedContent {
    try {
      // Remove markdown code blocks if present
      let cleaned = response.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(cleaned);

      // Validate required fields
      if (!parsed.title || !parsed.description) {
        throw new Error('Missing required fields: title or description');
      }

      // Ensure all fields exist with defaults
      return {
        title: parsed.title,
        description: parsed.description,
        short_description: parsed.short_description || parsed.description.substring(0, 150),
        bullet_points: parsed.bullet_points || [],
        seo: {
          meta_title: parsed.seo?.meta_title || parsed.title,
          meta_description: parsed.seo?.meta_description || parsed.short_description || parsed.description.substring(0, 160),
          keywords: parsed.seo?.keywords || [],
          slug: parsed.seo?.slug || parsed.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
        },
        category: parsed.category || 'Other',
        tags: parsed.tags || [],
        condition_assessment: parsed.condition_assessment || 'unknown',
        confidence: parsed.confidence || 0.7,
      };

    } catch (error: any) {
      logger.error('STEP3', `Failed to parse LLM response: ${error.message}`);
      throw new Error(`Invalid LLM response format: ${error.message}`);
    }
  }

  /**
   * Generate content using OpenAI-compatible API (Gemini via Manus)
   */
  private async generateWithOpenAI(prompt: string): Promise<GeneratedContent> {
    if (!this.openaiEnabled || !this.openaiClient) {
      throw new Error('OpenAI API not configured');
    }

    logger.info('STEP3', 'Generating content with OpenAI-compatible API (Gemini)...');

    try {
      const completion = await this.openaiClient.chat.completions.create({
        model: 'gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a product listing expert. Generate comprehensive, accurate product metadata in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const text = completion.choices[0]?.message?.content || '';

      logger.info('STEP3', 'OpenAI-compatible generation complete', {
        response_length: text.length,
        tokens: completion.usage?.total_tokens,
      });

      return this.parseResponse(text);

    } catch (error: any) {
      logger.error('STEP3', `OpenAI-compatible generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate content using Gemini (native)
   */
  private async generateWithGemini(prompt: string): Promise<GeneratedContent> {
    if (!this.geminiEnabled || !this.geminiClient) {
      throw new Error('Gemini API not configured');
    }

    logger.info('STEP3', 'Generating content with native Gemini...');

    try {
      const model = this.geminiClient.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      logger.info('STEP3', 'Native Gemini generation complete', {
        response_length: text.length,
      });

      return this.parseResponse(text);

    } catch (error: any) {
      logger.error('STEP3', `Native Gemini generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate fallback content using templates (when LLM fails)
   */
  private generateFallback(step1Result: Step1Result, step2Result: Step2Result): GeneratedContent {
    logger.warn('STEP3', 'Using template-based fallback generation');

    const { unified: detection } = step1Result;
    const { unified: pricing } = step2Result;

    const title = detection.primaryObject;
    const category = detection.category;
    const price = pricing.retail_price || pricing.used_price_estimate;

    const description = `${title} in ${category} category. ${
      detection.detectedText.length > 0 
        ? `Features: ${detection.detectedText.slice(0, 3).join(', ')}. ` 
        : ''
    }${
      price 
        ? `Estimated retail value: $${price.toFixed(2)}. ` 
        : ''
    }This item is available for sale. Please contact for more details.`;

    const short_description = `${title} - ${category}`;

    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return {
      title,
      description,
      short_description,
      bullet_points: detection.visualTags.slice(0, 5),
      seo: {
        meta_title: `${title} | Buy Now`,
        meta_description: short_description,
        keywords: [title, category, ...detection.visualTags.slice(0, 3)],
        slug,
      },
      category,
      tags: detection.visualTags.slice(0, 5),
      condition_assessment: 'unknown',
      confidence: 0.3,
    };
  }

  /**
   * Execute Step 3: AI Synthesis
   */
  async execute(
    step1Result: Step1Result,
    step2Result: Step2Result,
    llmModel: 'gpt-5' | 'gemini-2.0-flash' = 'gemini-2.0-flash'
  ): Promise<Step3Result> {
    logger.startStep('STEP3');
    const startTime = Date.now();

    try {
      // Build prompt
      const prompt = this.buildPrompt(step1Result, step2Result);

      let generated: GeneratedContent;
      let tokens_used: number | undefined;
      let model = llmModel;
      let status: 'success' | 'error' = 'success';
      let error: string | undefined;

      // Try OpenAI-compatible API first (if available), then native Gemini, then fallback
      try {
        if (this.openaiEnabled) {
          generated = await this.generateWithOpenAI(prompt);
          model = 'gemini-2.5-flash';
        } else if (this.geminiEnabled) {
          generated = await this.generateWithGemini(prompt);
          model = 'gemini-2.0-flash-exp';
        } else {
          throw new Error('No LLM API configured');
        }
      } catch (llmError: any) {
        logger.warn('STEP3', `LLM failed: ${llmError.message}, using fallback`);
        generated = this.generateFallback(step1Result, step2Result);
        status = 'error';
        error = llmError.message;
        model = 'fallback-template';
      }

      const duration_ms = Date.now() - startTime;
      logger.endStep('STEP3', status === 'success');

      return {
        timestamp: new Date().toISOString(),
        duration_ms,
        llm: {
          model,
          tokens_used,
          status,
          error,
        },
        generated,
      };

    } catch (error: any) {
      const duration_ms = Date.now() - startTime;
      logger.endStep('STEP3', false);

      throw new Error(`Step 3 failed: ${error.message}`);
    }
  }
}

// Export singleton instance
export const aiSynthesisStep = new AISynthesisStep();
