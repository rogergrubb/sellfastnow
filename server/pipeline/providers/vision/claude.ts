// Claude Vision Provider (Anthropic)

import Anthropic from '@anthropic-ai/sdk';
import { VisionProvider, VisionProviderResult } from '../base';
import { logger } from '../../utils/logger';

const PHASE_1_PROMPT = `You are an expert product appraiser for an online marketplace. Analyze this product image and provide detailed identification.

CRITICAL: Respond with ONLY valid JSON. No markdown, no backticks, no explanations outside the JSON.

Required JSON structure:
{
  "product_name": "Full product name with brand and model",
  "brand": "Brand name or 'Unknown'",
  "category": "Primary category",
  "subcategory": "Secondary category",
  "condition": "New|Like New|Excellent|Good|Fair|Poor",
  "condition_details": "Specific visible wear, damage, or defects",
  "visible_defects": ["defect1", "defect2"],
  "estimated_value": 0,
  "price_range": {
    "min": 0,
    "max": 0,
    "currency": "USD"
  },
  "confidence_score": 0,
  "needs_more_info": false,
  "missing_details": [],
  "suggested_title": "SEO-optimized marketplace title (60 chars max)",
  "suggested_description": "2-3 sentence compelling description",
  "search_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "barcode_visible": false,
  "barcode_number": "",
  "model_number": "",
  "year_manufactured": "",
  "packaging_included": false,
  "accessories_visible": []
}

Analysis Guidelines:
1. CONDITION ASSESSMENT: Be brutally honest about condition. Look for:
   - Scratches, dents, chips, cracks
   - Discoloration, fading, yellowing
   - Wear patterns on corners, edges
   - Missing parts or pieces
   - Packaging condition

2. PRICING: Base estimates on:
   - Brand positioning (luxury/mid/budget)
   - Age and obsolescence
   - Condition impact (New=100%, Like New=75%, Excellent=60%, Good=45%, Fair=30%, Poor=15%)
   - Completeness (missing accessories = -20-40%)

3. CONFIDENCE SCORING (0-10):
   - 10: Exact product identified with visible model numbers
   - 8-9: Product clearly identified, minor details uncertain
   - 6-7: Product type clear, specific model uncertain
   - 4-5: Generic category identified
   - 1-3: Unable to identify clearly

4. KEYWORDS: Focus on what buyers search:
   - Brand name
   - Product type
   - Key features
   - Condition indicators
   - Popular search terms

5. MISSING INFO: What would help you identify this better?
   - Additional photo angles
   - Closeups of labels/tags
   - Model numbers
   - Measurements

Remember: Accuracy over speed. If unsure, set confidence_score low and list missing_details.`;

export class ClaudeVisionProvider implements VisionProvider {
  name = 'claude-vision';
  private client: Anthropic | null = null;
  private enabled: boolean = false;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      logger.warn('CLAUDE', 'Anthropic API key not configured. Claude Vision will be skipped.');
      return;
    }

    try {
      this.client = new Anthropic({ apiKey });
      this.enabled = true;
      logger.info('CLAUDE', 'Claude Vision client initialized successfully');
    } catch (error: any) {
      logger.error('CLAUDE', `Failed to initialize client: ${error.message}`);
      this.enabled = false;
    }
  }

  isEnabled(): boolean {
    return this.enabled && this.client !== null;
  }

  getPriority(): number {
    return 1; // Highest priority (primary)
  }

  async analyzeImage(imageUrl: string): Promise<VisionProviderResult> {
    if (!this.enabled || !this.client) {
      return {
        status: 'error',
        error: 'Claude Vision not configured',
      };
    }

    const startTime = Date.now();
    logger.info('CLAUDE', `Analyzing image: ${imageUrl}`);

    try {
      // Fetch image and convert to base64
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
      }

      const imageBuffer = await imageResponse.arrayBuffer();
      const base64Image = Buffer.from(imageBuffer).toString('base64');
      
      // Detect media type from URL or default to jpeg
      const mediaType = imageUrl.toLowerCase().endsWith('.png') 
        ? 'image/png' 
        : 'image/jpeg';

      // Call Claude with vision
      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: PHASE_1_PROMPT,
              },
            ],
          },
        ],
      });

      const duration = Date.now() - startTime;

      // Extract text response
      const textContent = response.content.find(c => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text response from Claude');
      }

      // Parse JSON response
      let productData;
      try {
        // Remove markdown code blocks if present
        let jsonText = textContent.text.trim();
        if (jsonText.startsWith('```')) {
          jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        }
        productData = JSON.parse(jsonText);
      } catch (parseError: any) {
        logger.error('CLAUDE', `Failed to parse JSON response: ${parseError.message}`);
        logger.error('CLAUDE', `Raw response: ${textContent.text}`);
        throw new Error(`Invalid JSON response from Claude: ${parseError.message}`);
      }

      logger.info('CLAUDE', `Analysis complete in ${duration}ms - Confidence: ${productData.confidence_score}/10`);

      // Convert to standardized format
      return {
        status: 'success',
        objects: [],
        labels: productData.search_keywords?.map((keyword: string) => ({
          name: keyword,
          confidence: productData.confidence_score / 10,
        })) || [],
        text: [
          {
            detectedText: productData.barcode_number || productData.model_number || '',
            confidence: productData.barcode_visible ? 0.9 : 0.5,
          },
        ],
        webEntities: [
          {
            entityId: productData.brand || 'Unknown',
            description: productData.product_name,
            score: productData.confidence_score / 10,
          },
        ],
        confidence: productData.confidence_score / 10,
        // Pass through Claude-specific data
        claudeData: productData,
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('CLAUDE', `Analysis failed: ${error.message}`, { duration_ms: duration });
      
      return {
        status: 'error',
        error: error.message,
      };
    }
  }
}
