import { Router } from "express";
import { isAuthenticated } from "../supabaseAuth";
import { storage } from "../storage";
import { GoogleCloudVisionProvider } from "../pipeline/providers/vision/google-cloud";

const router = Router();

// Free AI demo limit (5 per month)
const FREE_AI_DEMO_LIMIT = 5;

/**
 * POST /api/ai/analyze-bulk-images-v2
 * Bulk analyze images using Google Cloud Vision (no rate limits)
 */
router.post("/analyze-bulk-images-v2", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.auth.userId;
    const { imageUrls, manualCategory } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ message: "imageUrls array is required" });
    }

    console.log(`📦 Starting bulk analysis for ${imageUrls.length} images using Google Cloud Vision`);
    console.log(`👤 User ID: ${userId}`);

    // Check user's AI usage
    const usageInfo = await storage.getAIUsageInfo(userId);
    const freeRemaining = Math.max(0, FREE_AI_DEMO_LIMIT - usageInfo.usesThisMonth);
    
    console.log(`📊 Free AI remaining: ${freeRemaining}/${FREE_AI_DEMO_LIMIT}`);

    // Get user credits
    let credits = await storage.getUserCredits(userId);
    if (!credits) {
      const user = await storage.getUser(userId);
      credits = await storage.createOrUpdateUserCredits(userId, user?.email || '');
    }

    console.log(`💳 User has ${credits.creditsRemaining} purchased credits`);

    // Calculate how many items we can process
    const totalAvailable = freeRemaining + credits.creditsRemaining;
    const itemsWithAI = Math.min(imageUrls.length, totalAvailable);
    const itemsWithoutAI = imageUrls.length - itemsWithAI;

    console.log(`✅ Will process ${itemsWithAI} items with AI (${freeRemaining} free + ${Math.max(0, itemsWithAI - freeRemaining)} paid)`);
    if (itemsWithoutAI > 0) {
      console.log(`⏭️  ${itemsWithoutAI} items will require manual entry`);
    }

    // STEP 1: Group images into products using simple logic
    // For now, assume each image is a separate product
    const products = imageUrls.map((url: string, index: number) => ({
      imageIndices: [index],
      imageUrl: url,
    }));

    console.log(`📦 Detected ${products.length} products`);

    // STEP 2: Analyze each product with Google Cloud Vision
    const visionProvider = new GoogleCloudVisionProvider();
    
    if (!visionProvider.isEnabled()) {
      return res.status(500).json({ 
        message: "Google Cloud Vision is not configured. Please add GOOGLE_APPLICATION_CREDENTIALS." 
      });
    }

    const allProducts = [];
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      if (i < itemsWithAI) {
        // Process with AI
        console.log(`🔍 [${i + 1}/${itemsWithAI}] Analyzing with Google Cloud Vision...`);
        
        try {
          const visionResult = await visionProvider.analyzeImage(product.imageUrl);
          
          if (visionResult.status === 'error') {
            console.error(`❌ [${i + 1}] Vision analysis failed:`, visionResult.error);
            allProducts.push({
              imageIndices: product.imageIndices,
              imageUrls: [product.imageUrl],
              title: '',
              description: '',
              category: manualCategory || '',
              tags: [],
              retailPrice: 0,
              usedPrice: 0,
              condition: '',
              confidence: 0,
              isAIGenerated: false,
            });
            continue;
          }

          // Extract product information from vision results
          const labels = visionResult.labels || [];
          const text = visionResult.text || [];
          const webEntities = visionResult.webEntities || [];

          // Generate title from labels and text
          const detectedText = text.map(t => t.detectedText).join(' ').trim();
          const topLabels = labels.slice(0, 3).map(l => l.name).join(' ');
          const title = detectedText || webEntities[0]?.description || topLabels || 'Product';

          // Generate description from labels
          const description = `This item appears to be ${topLabels}. ${detectedText ? `Text found: ${detectedText}` : ''}`.trim();

          // Determine category from labels
          const category = manualCategory || determineCategory(labels);

          // Extract tags from labels
          const tags = labels.slice(0, 5).map(l => l.name);

          // Estimate pricing (simple heuristic for now)
          const retailPrice = 50; // Default estimate
          const usedPrice = 30; // Default estimate

          console.log(`✅ [${i + 1}] Detected: "${title}"`);

          allProducts.push({
            imageIndices: product.imageIndices,
            imageUrls: [product.imageUrl],
            title,
            description,
            category,
            tags,
            retailPrice,
            usedPrice,
            condition: 'used',
            confidence: visionResult.confidence || 0.5,
            isAIGenerated: true,
          });

        } catch (error: any) {
          console.error(`❌ [${i + 1}] Error:`, error);
          allProducts.push({
            imageIndices: product.imageIndices,
            imageUrls: [product.imageUrl],
            title: '',
            description: '',
            category: manualCategory || '',
            tags: [],
            retailPrice: 0,
            usedPrice: 0,
            condition: '',
            confidence: 0,
            isAIGenerated: false,
          });
        }
      } else {
        // Items without AI
        allProducts.push({
          imageIndices: product.imageIndices,
          imageUrls: [product.imageUrl],
          title: '',
          description: '',
          category: manualCategory || '',
          tags: [],
          retailPrice: 0,
          usedPrice: 0,
          condition: '',
          confidence: 0,
          isAIGenerated: false,
        });
      }
    }

    // STEP 3: Deduct credits
    if (itemsWithAI > 0) {
      const freeUsed = Math.min(itemsWithAI, freeRemaining);
      const paidUsed = itemsWithAI - freeUsed;
      
      if (freeUsed > 0) {
        await storage.incrementAIUsage(userId, freeUsed);
        console.log(`✅ Free AI usage tracked: +${freeUsed} descriptions`);
      }
      
      if (paidUsed > 0) {
        await storage.useCredits(userId, paidUsed, `AI bulk analysis - ${paidUsed} product descriptions`);
        console.log(`💳 Deducted ${paidUsed} purchased credits`);
      }
    }

    console.log(`✅ Bulk analysis complete: ${itemsWithAI} with AI, ${itemsWithoutAI} manual`);

    res.json({
      products: allProducts,
      groupingInfo: {
        totalProducts: products.length,
        itemsWithAI,
        itemsWithoutAI,
      },
      remainingItems: itemsWithoutAI > 0 ? {
        count: itemsWithoutAI,
        imageUrls: imageUrls.slice(itemsWithAI),
        products: allProducts.slice(itemsWithAI),
      } : null,
    });

  } catch (error: any) {
    console.error("❌ Bulk analysis error:", error);
    res.status(500).json({ 
      message: "Failed to analyze images", 
      error: error.message 
    });
  }
});

// Helper function to determine category from labels
function determineCategory(labels: any[]): string {
  const categoryMap: Record<string, string> = {
    'electronics': 'Electronics',
    'computer': 'Electronics',
    'phone': 'Electronics',
    'camera': 'Electronics',
    'clothing': 'Clothing & Accessories',
    'shoe': 'Clothing & Accessories',
    'furniture': 'Home & Garden',
    'book': 'Books & Media',
    'toy': 'Toys & Games',
    'vehicle': 'Vehicles',
    'car': 'Vehicles',
    'tool': 'Tools & Equipment',
    'sports': 'Sports & Outdoors',
    'music': 'Books & Media',
    'jewelry': 'Jewelry & Watches',
  };

  for (const label of labels) {
    const labelLower = label.name.toLowerCase();
    for (const [keyword, category] of Object.entries(categoryMap)) {
      if (labelLower.includes(keyword)) {
        return category;
      }
    }
  }

  return 'Other';
}

export default router;
