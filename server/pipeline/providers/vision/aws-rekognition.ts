// AWS Rekognition Provider

import { VisionProvider, VisionProviderResult } from '../base';
import { rekognitionService } from '../../utils/api-clients/rekognition';
import { logger } from '../../utils/logger';

export class AWSRekognitionProvider implements VisionProvider {
  name = 'aws-rekognition';

  isEnabled(): boolean {
    return rekognitionService.isEnabled();
  }

  getPriority(): number {
    return 3; // Lowest priority (optional)
  }

  async analyzeImage(imageUrl: string): Promise<VisionProviderResult> {
    logger.info('PROVIDER', `Using ${this.name} for image analysis`);
    
    const result = await rekognitionService.analyzeImage(imageUrl);
    
    if (result.status === 'error') {
      return {
        status: 'error',
        error: result.error,
      };
    }

    // Convert to standardized format
    return {
      status: 'success',
      objects: result.objects,
      labels: result.labels?.map(label => ({
        name: label.name,
        confidence: label.confidence / 100, // Convert to 0-1 range
      })),
      text: result.text,
      confidence: result.confidence,
    };
  }
}
