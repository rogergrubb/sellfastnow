import { Router } from "express";
import { isAuthenticated } from "../supabaseAuth";
import { storage } from "../storage";
import { ClaudeVisionProvider } from "../pipeline/providers/vision/claude";

const router = Router();

// Free AI demo limit (5 per month)
const FREE_AI_DEMO_LIMIT = 5;

/**
 * POST /api/ai/analyze-bulk-images-claude
 * Bulk analyze images using Claude Vision (high quality product identification)
 */
router.post("/analyze-bulk-images-claude", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.auth.userId;
    const { imageUrls, manualCategory } = req.body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ message: "imageUrls array is required" });
    }

    console.log(`📦 Starting bulk analysis for ${imageUrls.length} images using Claude Vision`);
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

    // STEP 2: Analyze each product with Claude Vision
    const visionProvider = new ClaudeVisionProvider();
    
    if (!visionProvider.isEnabled()) {
      return res.status(500).json({ 
        message: "Claude Vision is not configured. Please add ANTHROPIC_API_KEY to environment variables." 
      });
    }

    const allProducts = [];
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      if (i < itemsWithAI) {
        // Process with AI
        console.log(`🔍 [${i + 1}/${itemsWithAI}] Analyzing with Claude Vision...`);
        
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

          // Extract Claude-specific product data
          const claudeData = visionResult.claudeData;
          
          if (!claudeData) {
            console.error(`❌ [${i + 1}] No Claude data in response`);
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

          console.log(`✅ [${i + 1}] Detected: "${claudeData.suggested_title}" (Confidence: ${claudeData.confidence_score}/10)`);

          allProducts.push({
            imageIndices: product.imageIndices,
            imageUrls: [product.imageUrl],
            title: claudeData.suggested_title || claudeData.product_name || '',
            description: claudeData.suggested_description || '',
            category: manualCategory || claudeData.category || 'Other',
            tags: claudeData.search_keywords || [],
            retailPrice: claudeData.price_range?.max || claudeData.estimated_value || 0,
            usedPrice: claudeData.price_range?.min || (claudeData.estimated_value * 0.6) || 0,
            condition: claudeData.condition || 'used',
            confidence: claudeData.confidence_score / 10,
            isAIGenerated: true,
            // Include additional Claude data
            brand: claudeData.brand,
            modelNumber: claudeData.model_number,
            conditionDetails: claudeData.condition_details,
            visibleDefects: claudeData.visible_defects,
            needsMoreInfo: claudeData.needs_more_info,
            missingDetails: claudeData.missing_details,
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
        await storage.useCredits(userId, paidUsed, `AI bulk analysis (Claude) - ${paidUsed} product descriptions`);
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

export default router;
