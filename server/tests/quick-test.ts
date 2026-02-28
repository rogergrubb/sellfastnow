// Quick Pipeline Test - Single Image

import { pipeline } from '../pipeline';

async function quickTest() {
  console.log('🧪 Quick Pipeline Test\n');
  
  // Test with a simple, publicly accessible image
  const testImageUrl = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800';
  
  console.log(`Testing with: ${testImageUrl}\n`);
  console.log('=' .repeat(80));
  
  try {
    // Set environment variables
    process.env.GOOGLE_APPLICATION_CREDENTIALS = '/home/ubuntu/sellfastnow/google-cloud-credentials.json';
    process.env.GOOGLE_CLOUD_PROJECT_ID = 'gen-lang-client-0109172671';
    
    const result = await pipeline.processImage(testImageUrl, {
      llmModel: 'gemini-2.5-flash',
    });
    
    console.log('\n📊 RESULT:');
    console.log('=' .repeat(80));
    console.log(`Status: ${result.status}`);
    console.log(`Duration: ${result.total_duration_ms}ms`);
    
    if (result.final_product) {
      console.log(`\n✨ FINAL PRODUCT:`);
      console.log(`Title: ${result.final_product.title}`);
      console.log(`Category: ${result.final_product.category}`);
      console.log(`Description: ${result.final_product.description.substring(0, 200)}...`);
      console.log(`Retail Price: $${result.final_product.pricing.retail_price?.toFixed(2) || 'N/A'}`);
      console.log(`Used Price: $${result.final_product.pricing.used_price_estimate?.toFixed(2) || 'N/A'}`);
      console.log(`Confidence: ${(result.final_product.confidence * 100).toFixed(1)}%`);
      console.log(`\nSEO Slug: ${result.final_product.seo.slug}`);
      console.log(`Tags: ${result.final_product.tags.join(', ')}`);
    }
    
    if (result.error) {
      console.log(`\n❌ Error: ${result.error}`);
    }
    
    // Show step details
    console.log(`\n📋 STEP DETAILS:`);
    console.log('=' .repeat(80));
    
    if (result.step1) {
      console.log(`\nStep 1 (Image Analysis):`);
      console.log(`  Duration: ${result.step1.duration_ms}ms`);
      
      // Handle v2 step results with dynamic provider names
      const sources = result.step1.sources || {};
      const sourceNames = Object.keys(sources);
      console.log(`  Providers used: ${sourceNames.join(', ')}`);
      
      for (const sourceName of sourceNames) {
        const source = sources[sourceName];
        console.log(`  ${sourceName}: ${source.status || 'unknown'}`);
      }
      
      console.log(`  Primary Object: ${result.step1.unified.primaryObject}`);
      console.log(`  Detected Text: ${result.step1.unified.detectedText.slice(0, 5).join(', ')}`);
    }
    
    if (result.step2) {
      console.log(`\nStep 2 (Product Enrichment):`);
      console.log(`  Duration: ${result.step2.duration_ms}ms`);
      
      // Handle v2 step results with dynamic provider names
      const sources = result.step2.sources || {};
      const sourceNames = Object.keys(sources);
      console.log(`  Providers used: ${sourceNames.join(', ') || 'None (estimation used)'}`);
      
      for (const sourceName of sourceNames) {
        const source = sources[sourceName];
        console.log(`  ${sourceName}: ${source.status || 'unknown'}`);
      }
    }
    
    if (result.step3) {
      console.log(`\nStep 3 (AI Synthesis):`);
      console.log(`  Duration: ${result.step3.duration_ms}ms`);
      console.log(`  LLM: ${result.step3.llm.model}`);
      console.log(`  Status: ${result.step3.llm.status}`);
    }
    
    console.log('\n✅ Test complete!\n');
    
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

quickTest();
