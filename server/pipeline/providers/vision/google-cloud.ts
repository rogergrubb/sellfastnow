// Google Cloud Vision Provider (Primary)

import { VisionProvider, VisionProviderResult } from '../base';
import { visionService } from '../../utils/api-clients/vision';
import { logger } from '../../utils/logger';

export class GoogleCloudVisionProvider implements VisionProvider {
  name = 'google-cloud-vision';

  isEnabled(): boolean {
    return visionService.isEnabled();
  }

  getPriority(): number {
    return 1; // Highest priority (primary)
  }

  async analyzeImage(imageUrl: string): Promise<VisionProviderResult> {
    logger.info('PROVIDER', `Using ${this.name} for image analysis`);
    
    const result = await visionService.analyzeImage(imageUrl);
    
    if (result.status === 'error') {
      return {
        status: 'error',
        error: result.error,
      };
    }

    // Convert to standardized format
    return {
      status: 'success',
      objects: result.objects?.map(obj => ({
        name: obj.name,
        confidence: obj.score,
        boundingBox: obj.boundingPoly,
      })),
      labels: result.labels?.map(label => ({
        name: label.description,
        confidence: label.score,
      })),
      text: result.text?.map(t => ({
        detectedText: t.description,
        confidence: 1.0,
      })),
      webEntities: result.webEntities,
      confidence: result.confidence,
    };
  }
}
