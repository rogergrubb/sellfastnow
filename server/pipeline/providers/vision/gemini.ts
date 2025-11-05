// Gemini Vision Provider (Backup)

import { GoogleGenerativeAI } from "@google/generative-ai";
import { VisionProvider, VisionProviderResult } from '../base';
import { logger } from '../../utils/logger';
import axios from 'axios';

export class GeminiVisionProvider implements VisionProvider {
  name = 'gemini-vision';
  private client: GoogleGenerativeAI | null;
  private enabled: boolean;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    this.enabled = !!apiKey;

    if (this.enabled) {
      this.client = new GoogleGenerativeAI(apiKey!);
    } else {
      this.client = null;
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getPriority(): number {
    return 2; // Lower priority (backup)
  }

  async analyzeImage(imageUrl: string): Promise<VisionProviderResult> {
    if (!this.enabled || !this.client) {
      return {
        status: 'error',
        error: 'Gemini Vision not configured',
      };
    }

    logger.info('PROVIDER', `Using ${this.name} for image analysis`);

    try {
      // Download image and convert to base64
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
      });
      const base64Image = Buffer.from(response.data).toString('base64');
      const mimeType = response.headers['content-type'] || 'image/jpeg';

      const model = this.client.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

      const prompt = `Analyze this product image and provide:
1. Main object/product name
2. All visible text (OCR)
3. Visual tags/labels (colors, materials, features)
4. Product category

Return as JSON:
{
  "mainObject": "product name",
  "text": ["text1", "text2"],
  "labels": ["label1", "label2"],
  "category": "category name"
}`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType,
          },
        },
      ]);

      const text = result.response.text();
      
      // Parse JSON response
      let parsed: any;
      try {
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(cleaned);
      } catch (e) {
        throw new Error('Failed to parse Gemini response');
      }

      // Convert to standardized format
      return {
        status: 'success',
        objects: parsed.mainObject ? [{
          name: parsed.mainObject,
          confidence: 0.8,
        }] : [],
        labels: parsed.labels?.map((label: string) => ({
          name: label,
          confidence: 0.7,
        })) || [],
        text: parsed.text?.map((t: string) => ({
          detectedText: t,
          confidence: 0.9,
        })) || [],
        confidence: 0.75,
      };

    } catch (error: any) {
      logger.error('PROVIDER', `Gemini Vision failed: ${error.message}`);
      return {
        status: 'error',
        error: error.message,
      };
    }
  }
}
