import { Router } from "express";
import { isAuthenticated } from "../supabaseAuth";
import { storage } from "../storage";

const router = Router();

/**
 * GET /api/ai/usage
 * Get AI usage info for current user
 */
router.get('/usage', isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.auth.userId;
    const usageInfo = await storage.getAIUsageInfo(userId);
    res.json(usageInfo);
  } catch (error) {
    console.error("Error fetching AI usage info:", error);
    res.status(500).json({ message: "Failed to fetch AI usage info" });
  }
});

/**
 * POST /api/ai/analyze-photo
 * Analyze a photo and identify product details
 */
router.post("/analyze-photo", isAuthenticated, async (req, res) => {
  try {
    const { base64Image, photoNumber, manualCategory } = req.body;
    
    if (!base64Image) {
      return res.status(400).json({ message: "base64Image is required" });
    }

    const { aiService } = await import("../aiService");
    const productDetails = await aiService.identifyProductFromPhoto(
      base64Image,
      photoNumber || 1,
      manualCategory
    );
    
    res.json(productDetails);
  } catch (error: any) {
    console.error("Error identifying product:", error);
    res.status(500).json({ message: "Failed to identify product" });
  }
});

/**
 * POST /api/ai/analyze-description
 * Analyze product description quality
 */
router.post("/analyze-description", isAuthenticated, async (req, res) => {
  try {
    const { description, title, category } = req.body;
    
    if (!description) {
      return res.status(400).json({ message: "description is required" });
    }

    const { aiService } = await import("../aiService");
    const analysis = await aiService.analyzeDescription(
      description,
      title || "",
      category || "other"
    );
    
    res.json(analysis);
  } catch (error: any) {
    console.error("Error analyzing description:", error);
    res.status(500).json({ message: "Failed to analyze description" });
  }
});

/**
 * POST /api/ai/analyze-pricing
 * Get AI-powered pricing recommendations
 */
router.post("/analyze-pricing", isAuthenticated, async (req, res) => {
  try {
    const { title, description, category, condition, userPrice } = req.body;

    const { aiService } = await import("../aiService");
    const analysis = await aiService.analyzePricing(
      title || "",
      description || "",
      category || "other",
      condition || "used",
      userPrice
    );
    
    res.json(analysis);
  } catch (error: any) {
    console.error("Error analyzing pricing:", error);
    res.status(500).json({ message: "Failed to analyze pricing" });
  }
});

/**
 * POST /api/ai/analyze-image
 * AI-powered product recognition from image URL
 */
router.post("/analyze-image", isAuthenticated, async (req, res) => {
  try {
    console.log('🤖 AI image analysis request received');
    const { imageUrl, manualCategory } = req.body;
    
    if (!imageUrl) {
      console.error('❌ No imageUrl provided in request');
      return res.status(400).json({ message: "imageUrl is required" });
    }

    console.log('🔍 Analyzing image with OpenAI:', imageUrl);
    if (manualCategory) {
      console.log(`📁 Using manual category override: "${manualCategory}"`);
    }
    const { analyzeProductImage } = await import("../aiService");
    const analysis = await analyzeProductImage(imageUrl, 1, manualCategory);
    
    console.log('✅ Gemini analysis complete:', {
      title: analysis.title,
      category: analysis.category,
      confidence: analysis.confidence,
    });
    
    res.json(analysis);
  } catch (error: any) {
    console.error('❌ Error analyzing image:', error);
    res.status(500).json({ 
      message: "Failed to analyze image",
      error: error.message 
    });
  }
});

export default router;



/**
 * POST /api/ai/analyze-item
 * Sequential AI item analysis with credit deduction
 */
router.post("/analyze-item", isAuthenticated, async (req: any, res) => {
  try {
    console.log('🤖 Sequential AI item analysis request received');
    const { imageUrl, manualCategory, itemIndex } = req.body;
    const userId = req.auth.userId;
    
    if (!imageUrl) {
      console.error('❌ No imageUrl provided in request');
      return res.status(400).json({ message: "imageUrl is required" });
    }

    console.log(`🔍 Item ${itemIndex || 'N/A'}: Checking credits for user ${userId}...`);
    
    // Check and deduct credit atomically
    const creditResult = await storage.checkAndDeductAICredit(userId);
    
    if (!creditResult.success) {
      console.log('❌ Insufficient credits - user has 0 credits remaining');
      return res.status(402).json({ 
        message: "Insufficient AI credits",
        remainingCredits: 0,
      });
    }

    console.log(`✅ Credit deducted (${creditResult.usedPurchased ? 'purchased' : 'free'}). Remaining: ${creditResult.remainingCredits}`);
    console.log(`🔍 Item ${itemIndex || 'N/A'}: Analyzing image with OpenAI...`);
    
    if (manualCategory) {
      console.log(`📁 Using manual category override: "${manualCategory}"`);
    }
    
    const { analyzeProductImage } = await import("../aiService");
    const analysis = await analyzeProductImage(imageUrl, itemIndex || 1, manualCategory);
    
    console.log(`✅ Item ${itemIndex || 'N/A'}: Gemini analysis complete - "${analysis.title}"`);
    
    res.json({
      ...analysis,
      remainingCredits: creditResult.remainingCredits,
      usedPurchased: creditResult.usedPurchased,
    });
  } catch (error: any) {
    console.error("❌ Error in sequential item analysis:", error);
    res.status(500).json({ message: "Failed to analyze item" });
  }
});

/**
 * POST /api/ai/analyze-multiple-images
 * Multi-image analysis to detect same vs different products
 */
router.post("/analyze-multiple-images", isAuthenticated, async (req, res) => {
  try {
    console.log('🤖 Multi-image analysis request received');
    const { imageUrls, manualCategory } = req.body;
    
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      console.error('❌ No imageUrls array provided in request');
      return res.status(400).json({ message: "imageUrls array is required" });
    }

    console.log(`🔍 Analyzing ${imageUrls.length} images with OpenAI...`);
    if (manualCategory) {
      console.log(`📁 Using manual category override: "${manualCategory}"`);
    }
    const { analyzeMultipleImages } = await import("../aiService");
    const analysis = await analyzeMultipleImages(imageUrls, manualCategory);
    
    console.log('✅ Multi-image analysis complete:', {
      scenario: analysis.scenario,
      productCount: analysis.products.length,
      message: analysis.message,
    });
    
    res.json(analysis);
  } catch (error: any) {
    console.error("❌ Error analyzing multiple images:", error);
    res.status(500).json({ message: "Failed to analyze multiple images" });
  }
});



/**
 * POST /api/ai/analyze-bulk-images
 * Bulk analysis - detect groupings first, then process items
 */
router.post("/analyze-bulk-images", isAuthenticated, async (req: any, res) => {
  try {
    console.log('🤖 Bulk image analysis request received');
    const { imageUrls, manualCategory } = req.body;
    const userId = req.auth.userId;
    
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      console.error('❌ No imageUrls array provided in request');
      return res.status(400).json({ message: "imageUrls array is required" });
    }

    const totalImages = imageUrls.length;
    
    // STEP 1: Detect product groupings from ALL images (always free)
    console.log(`🔍 Step 1: Detecting products from all ${totalImages} images...`);
    const { analyzeMultipleImages } = await import("../aiService");
    const groupingAnalysis = await analyzeMultipleImages(imageUrls, manualCategory);
    
    console.log(`✅ Detection complete: Found ${groupingAnalysis.products.length} products`);
    
    // STEP 2: Generate AI descriptions for first 5 items only (demo strategy)
    const totalProducts = groupingAnalysis.products.length;
    const FREE_AI_DEMO_LIMIT = 5;
    const itemsWithAI = Math.min(FREE_AI_DEMO_LIMIT, totalProducts);
    const itemsWithoutAI = Math.max(0, totalProducts - itemsWithAI);
    
    console.log(`📦 Total products detected: ${totalProducts}`);
    console.log(`✨ Generating AI for first ${itemsWithAI} items (demo strategy)`);
    console.log(`📝 Remaining ${itemsWithoutAI} items will be empty (manual entry required)`);
    
    // STEP 3: For first 5 items, call AI to generate full descriptions IN PARALLEL
    const { analyzeProductImage } = await import("../aiService");
    
    console.log(`⚡ Running AI analysis in PARALLEL for ${itemsWithAI} items...`);
    const startTime = Date.now();
    
    // Create promises for all AI analyses to run in parallel
    const aiPromises = groupingAnalysis.products.map(async (product, i) => {
      const imageUrlsForProduct = product.imageIndices.map(idx => imageUrls[idx]);
      
      if (i < itemsWithAI) {
        // First 5: Generate full AI descriptions
        console.log(`🤖 [${i + 1}/${itemsWithAI}] Starting AI analysis...`);
        try {
          const primaryImageUrl = imageUrlsForProduct[0];
          const aiAnalysis = await analyzeProductImage(primaryImageUrl, i + 1, manualCategory);
          
          console.log(`✅ [${i + 1}/${itemsWithAI}] AI generated: "${aiAnalysis.title}"`);
          
          return {
            imageIndices: product.imageIndices,
            imageUrls: imageUrlsForProduct,
            title: aiAnalysis.title,
            description: aiAnalysis.description,
            category: aiAnalysis.category,
            tags: aiAnalysis.tags || [],
            retailPrice: aiAnalysis.retailPrice,
            usedPrice: aiAnalysis.usedPrice,
            condition: aiAnalysis.condition,
            confidence: aiAnalysis.confidence,
            isAIGenerated: true,
          };
        } catch (error) {
          console.error(`❌ [${i + 1}/${itemsWithAI}] AI generation failed:`, error);
          // On error, return empty item
          return {
            imageIndices: product.imageIndices,
            imageUrls: imageUrlsForProduct,
            title: '',
            description: '',
            category: '',
            tags: [],
            retailPrice: 0,
            usedPrice: 0,
            condition: '',
            confidence: 0,
            isAIGenerated: false,
          };
        }
      } else {
        // Items 6+: Empty fields for manual entry
        return {
          imageIndices: product.imageIndices,
          imageUrls: imageUrlsForProduct,
          title: '',
          description: '',
          category: '',
          tags: [],
          retailPrice: 0,
          usedPrice: 0,
          condition: '',
          confidence: 0,
          isAIGenerated: false,
        };
      }
    });
    
    // Wait for all AI analyses to complete in parallel
    const allProducts = await Promise.all(aiPromises);
    const endTime = Date.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`⚡ PARALLEL AI analysis complete in ${totalTime}s (was ~${itemsWithAI * 60}s sequentially)`);
    
    // Increment AI usage counter for items that got AI descriptions
    if (itemsWithAI > 0) {
      await storage.incrementAIUsage(userId, itemsWithAI);
      console.log(`✅ AI usage tracked: +${itemsWithAI} descriptions generated`);
    }
    
    const usageInfo = await storage.getAIUsageInfo(userId);
    console.log(`✅ Bulk analysis complete: ${itemsWithAI} with AI, ${itemsWithoutAI} manual`);
    
    // Return all products with AI/manual flags
    res.json({ 
      products: allProducts,
      groupingInfo: {
        scenario: groupingAnalysis.scenario,
        message: groupingAnalysis.message,
        totalGroups: totalProducts,
      },
      aiInfo: {
        itemsWithAI,
        itemsWithoutAI,
        totalUsedThisMonth: usageInfo.usesThisMonth,
        monthlyLimit: 5,
        nextResetDate: usageInfo.resetDate,
      }
    });
  } catch (error: any) {
    console.error("❌ Error in bulk image analysis:", error);
    console.error("❌ Error name:", error.name);
    console.error("❌ Error message:", error.message);
    console.error("❌ Error stack:", error.stack);
    if (error.response) {
      console.error("❌ Error response:", error.response);
    }
    res.status(500).json({ 
      message: "Failed to analyze images",
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/ai/generate-bundle-summary
 * Generate multi-item bundle summary
 */
router.post("/generate-bundle-summary", isAuthenticated, async (req, res) => {
  try {
    console.log('🎁 Bundle summary generation request received');
    const { products } = req.body;
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      console.error('❌ No products array provided in request');
      return res.status(400).json({ message: "products array is required" });
    }

    console.log(`🎁 Generating bundle summary for ${products.length} products...`);
    const { generateMultiItemBundleSummary } = await import("../aiService");
    const bundleSummary = await generateMultiItemBundleSummary(products);
    
    console.log('✅ Bundle summary generated:', {
      title: bundleSummary.title,
      bundlePrice: bundleSummary.suggestedBundlePrice,
    });
    
    res.json(bundleSummary);
  } catch (error: any) {
    console.error("❌ Error generating bundle summary:", error);
    res.status(500).json({ message: "Failed to generate bundle summary" });
  }
});

/**
 * POST /api/ai/identify-product
 * Generate AI description for a single product
 */
router.post("/identify-product", isAuthenticated, async (req: any, res) => {
  try {
    console.log('🤖 Single product identification request received');
    const { imageUrl, manualCategory } = req.body;
    const userId = req.auth.userId;
    
    if (!imageUrl) {
      console.error('❌ No imageUrl provided in request');
      return res.status(400).json({ message: "imageUrl is required" });
    }

    console.log(`🔍 Analyzing single product image: ${imageUrl.substring(0, 80)}...`);
    const { analyzeProductImage } = await import("../aiService");
    
    try {
      const analysis = await analyzeProductImage(imageUrl, 1, manualCategory);
      console.log(`✅ Product identified: "${analysis.title}"`);
      
      res.json({
        title: analysis.title,
        description: analysis.description,
        category: analysis.category,
        tags: analysis.tags || [],
        retailPrice: analysis.retailPrice,
        usedPrice: analysis.usedPrice,
        condition: analysis.condition,
        confidence: analysis.confidence,
      });
    } catch (aiError: any) {
      // If Gemini API fails, log the error but return empty data instead of 500
      console.error("❌ Gemini API error for image:", imageUrl.substring(0, 80));
      console.error("❌ Error details:", aiError.message);
      
      // Check if it's a quota error
      if (aiError.message && aiError.message.includes('quota')) {
        console.error("⚠️ QUOTA EXCEEDED - Consider upgrading Gemini API plan");
      }
      
      // Return empty data so frontend can continue processing other items
      res.json({
        title: '',
        description: '',
        category: '',
        tags: [],
        retailPrice: 0,
        usedPrice: 0,
        condition: '',
        confidence: 0,
        error: 'AI generation failed'
      });
    }
  } catch (error: any) {
    console.error("❌ Error in identify-product endpoint:", error);
    console.error("❌ Error stack:", error.stack);
    res.status(500).json({ message: "Failed to identify product", error: error.message });
  }
});

