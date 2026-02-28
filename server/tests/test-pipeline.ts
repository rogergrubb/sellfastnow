// Pipeline Test Script
// Tests the pipeline with sample product images

import { pipeline } from '../pipeline';
import * as fs from 'fs';
import * as path from 'path';

// Test images (publicly accessible product images)
const TEST_IMAGES = [
  {
    name: 'iPhone 15 Pro',
    url: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-bluetitanium',
    category: 'Electronics',
  },
  {
    name: 'MacBook Pro',
    url: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp14-spacegray-select-202301',
    category: 'Electronics',
  },
  {
    name: 'Office Chair',
    url: 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8',
    category: 'Furniture',
  },
  {
    name: 'Running Shoes',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
    category: 'Clothing',
  },
  {
    name: 'Coffee Maker',
    url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6',
    category: 'Home & Garden',
  },
  {
    name: 'Bicycle',
    url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e',
    category: 'Sports & Outdoors',
  },
  {
    name: 'Book Stack',
    url: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d',
    category: 'Books & Media',
  },
  {
    name: 'LEGO Set',
    url: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b',
    category: 'Toys & Games',
  },
  {
    name: 'Car Tire',
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64',
    category: 'Automotive',
  },
  {
    name: 'Vintage Camera',
    url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f',
    category: 'Electronics',
  },
];

async function runTests() {
  console.log('🧪 Starting Pipeline Tests\n');
  console.log('=' .repeat(80));
  console.log(`Testing with ${TEST_IMAGES.length} sample images\n`);

  const results = [];
  const outputDir = path.join(__dirname, '../../test-outputs');

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  let successCount = 0;
  let failCount = 0;

  // Test each image
  for (let i = 0; i < TEST_IMAGES.length; i++) {
    const testImage = TEST_IMAGES[i];
    
    console.log(`\n[${i + 1}/${TEST_IMAGES.length}] Testing: ${testImage.name}`);
    console.log('-'.repeat(80));
    console.log(`URL: ${testImage.url}`);
    console.log(`Expected Category: ${testImage.category}\n`);

    try {
      // Process image through pipeline
      const result = await pipeline.processImage(testImage.url, {
        llmModel: 'gemini-2.5-flash',
      });

      if (result.status === 'success') {
        successCount++;
        console.log(`✅ SUCCESS`);
        
        if (result.final_product) {
          console.log(`\nGenerated Title: ${result.final_product.title}`);
          console.log(`Category: ${result.final_product.category}`);
          console.log(`Confidence: ${(result.final_product.confidence * 100).toFixed(1)}%`);
          console.log(`Retail Price: $${result.final_product.pricing.retail_price?.toFixed(2) || 'N/A'}`);
          console.log(`Used Price: $${result.final_product.pricing.used_price_estimate?.toFixed(2) || 'N/A'}`);
        }
      } else {
        failCount++;
        console.log(`❌ FAILED: ${result.error}`);
      }

      // Save result to file
      const filename = `test-${i + 1}-${testImage.name.toLowerCase().replace(/\s+/g, '-')}.json`;
      const filepath = path.join(outputDir, filename);
      fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
      console.log(`\nSaved to: ${filename}`);

      results.push({
        test_name: testImage.name,
        expected_category: testImage.category,
        status: result.status,
        result,
      });

      // Add delay between tests to respect rate limits
      if (i < TEST_IMAGES.length - 1) {
        console.log('\n⏳ Waiting 5 seconds before next test...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

    } catch (error: any) {
      failCount++;
      console.log(`❌ ERROR: ${error.message}`);
      
      results.push({
        test_name: testImage.name,
        expected_category: testImage.category,
        status: 'error',
        error: error.message,
      });
    }
  }

  // Generate summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${TEST_IMAGES.length}`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`Success Rate: ${((successCount / TEST_IMAGES.length) * 100).toFixed(1)}%`);

  // Save summary
  const summaryPath = path.join(outputDir, 'test-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    total: TEST_IMAGES.length,
    successful: successCount,
    failed: failCount,
    success_rate: (successCount / TEST_IMAGES.length) * 100,
    results,
  }, null, 2));

  console.log(`\n📁 All results saved to: ${outputDir}`);
  console.log('\n✨ Testing complete!\n');
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
