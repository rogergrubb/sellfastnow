// AWS Rekognition Client

import { 
  RekognitionClient, 
  DetectLabelsCommand,
  DetectTextCommand,
  type DetectLabelsCommandInput,
  type DetectTextCommandInput
} from '@aws-sdk/client-rekognition';
import { logger } from '../logger';
import type { RekognitionResult } from '../../types';
import axios from 'axios';

export class RekognitionService {
  private client: RekognitionClient;
  private enabled: boolean;

  constructor() {
    // Check if AWS credentials are configured
    this.enabled = !!(
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY
    );

    if (!this.enabled) {
      logger.warn('REKOGNITION', 'AWS credentials not configured. Rekognition will be skipped.');
      this.client = null as any;
      return;
    }

    this.client = new RekognitionClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    logger.info('REKOGNITION', 'AWS Rekognition client initialized');
  }

  /**
   * Download image from URL and convert to bytes
   */
  private async downloadImageAsBytes(imageUrl: string): Promise<Uint8Array> {
    try {
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
      });
      return new Uint8Array(response.data);
    } catch (error: any) {
      logger.error('REKOGNITION', `Failed to download image: ${error.message}`);
      throw new Error(`Image download failed: ${error.message}`);
    }
  }

  /**
   * Analyze image using AWS Rekognition
   */
  async analyzeImage(imageUrl: string): Promise<RekognitionResult> {
    if (!this.enabled) {
      return {
        status: 'error',
        error: 'AWS Rekognition not configured',
      };
    }

    const startTime = Date.now();
    logger.info('REKOGNITION', `Analyzing image: ${imageUrl}`);

    try {
      // Download image
      const imageBytes = await this.downloadImageAsBytes(imageUrl);

      // Detect labels (objects and scenes)
      const labelsInput: DetectLabelsCommandInput = {
        Image: { Bytes: imageBytes },
        MaxLabels: 20,
        MinConfidence: 70,
      };

      const labelsCommand = new DetectLabelsCommand(labelsInput);
      const labelsResponse = await this.client.send(labelsCommand);

      // Detect text (OCR)
      const textInput: DetectTextCommandInput = {
        Image: { Bytes: imageBytes },
      };

      const textCommand = new DetectTextCommand(textInput);
      const textResponse = await this.client.send(textCommand);

      // Extract objects (instances with bounding boxes)
      const objects = labelsResponse.Labels
        ?.filter(label => label.Instances && label.Instances.length > 0)
        .flatMap(label => 
          label.Instances!.map(instance => ({
            name: label.Name || 'Unknown',
            confidence: label.Confidence || 0,
            boundingBox: instance.BoundingBox ? {
              left: instance.BoundingBox.Left || 0,
              top: instance.BoundingBox.Top || 0,
              width: instance.BoundingBox.Width || 0,
              height: instance.BoundingBox.Height || 0,
            } : undefined,
          }))
        ) || [];

      // Extract labels (general tags)
      const labels = labelsResponse.Labels?.map(label => ({
        name: label.Name || 'Unknown',
        confidence: label.Confidence || 0,
      })) || [];

      // Extract text
      const text = textResponse.TextDetections
        ?.filter(detection => detection.Type === 'LINE')
        .map(detection => ({
          detectedText: detection.DetectedText || '',
          confidence: detection.Confidence || 0,
        })) || [];

      // Calculate average confidence
      const allConfidences = [
        ...labels.map(l => l.confidence),
        ...text.map(t => t.confidence),
      ];
      const avgConfidence = allConfidences.length > 0
        ? allConfidences.reduce((sum, c) => sum + c, 0) / allConfidences.length / 100
        : 0;

      const duration = Date.now() - startTime;
      logger.info('REKOGNITION', `Analysis complete`, { 
        duration_ms: duration,
        objects: objects.length,
        labels: labels.length,
        text: text.length,
        confidence: avgConfidence.toFixed(2),
      });

      return {
        status: 'success',
        objects,
        labels,
        text,
        confidence: avgConfidence,
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error('REKOGNITION', `Analysis failed: ${error.message}`, { duration_ms: duration });
      
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Check if service is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Export singleton instance
export const rekognitionService = new RekognitionService();
