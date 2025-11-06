import { Router } from "express";
import { isAuthenticated } from "../supabaseAuth";
import { db } from "../db";
import { userCredits } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { ClaudeVisionProvider } from "../pipeline/providers/vision/claude";

const router = Router();

// Free AI demo limit (5 per month)
const FREE_AI_DEMO_LIMIT = 5;

/**
 * POST /api/ai/analyze-bulk-images-claude
 * Bulk analyze images using Claude Vision (high quality product identification)
 * 
 * FIXED: Uses actual database schema (ai_generation_credits) instead of non-existent creditsRemaining
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

    // Get user credits from database (using actual schema)
    let [userCredit] = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userId, userId))
      .limit(1);

    if (!userCredit) {
      // Create default credits record
      [userCredit] = await db.insert(userCredits).values({
        userId,
        creditsRemaining: 0,
        creditsPurchased: 0,
        creditsUsed: 0,
      }).returning();
    }

    const availableCredits = userCredit.creditsRemaining || 0;
    console.log(`💳 User has ${availableCredits} AI generation credits`);

    // Calculate how many items we can process
    const itemsWithAI = Math.min(imageUrls.length, availableCredits);
    const itemsWithoutAI = imageUrls.length - itemsWithAI;

    console.log(`✅ Will process ${itemsWithAI} items with AI`);
    if (itemsWithoutAI > 0) {
      console.log(`⏭️  ${itemsWithoutAI} items will require manual entry (insufficient credits)`);
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
      await db
        .update(userCredits)
        .set({
          creditsRemaining: sql`${userCredits.creditsRemaining} - ${itemsWithAI}`,
          creditsUsed: sql`${userCredits.creditsUsed} + ${itemsWithAI}`,
          updatedAt: new Date(),
        })
        .where(eq(userCredits.userId, userId));
      
      console.log(`💳 Deducted ${itemsWithAI} AI generation credits`);
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
