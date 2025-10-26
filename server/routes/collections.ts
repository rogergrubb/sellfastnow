import { Router } from "express";
import { isAuthenticated } from "../supabaseAuth";
import { storage } from "../storage";
import { nanoid } from "nanoid";

const router = Router();

/**
 * GET /api/collections/:userId
 * Fetch all collections for a user
 */
router.get("/:userId", isAuthenticated, async (req: any, res) => {
  try {
    const { userId } = req.params;
    const requestingUserId = req.auth.userId;

    // Only allow users to fetch their own collections
    if (userId !== requestingUserId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const collections = await storage.getUserCollections(userId);
    
    // Group by collection name for easier frontend consumption
    const grouped = collections.reduce((acc: any, item) => {
      if (!acc[item.collectionName]) {
        acc[item.collectionName] = {
          collectionName: item.collectionName,
          subsets: {},
          items: [],
        };
      }
      
      if (item.subsetName) {
        if (!acc[item.collectionName].subsets[item.subsetName]) {
          acc[item.collectionName].subsets[item.subsetName] = [];
        }
        acc[item.collectionName].subsets[item.subsetName].push(item);
      } else {
        acc[item.collectionName].items.push(item);
      }
      
      return acc;
    }, {});

    res.json({
      collections: Object.values(grouped),
      raw: collections, // Also send raw data for flexibility
    });
  } catch (error: any) {
    console.error("❌ Error fetching collections:", error);
    res.status(500).json({ message: "Failed to fetch collections" });
  }
});

/**
 * POST /api/collections
 * Create a new collection entry
 */
router.post("/", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.auth.userId;
    const { collectionName, subsetName, draftId, metadata, segmentPrediction, aiSuggestionSource } = req.body;

    if (!collectionName || !draftId) {
      return res.status(400).json({ message: "collectionName and draftId are required" });
    }

    const collection = await storage.createDraftCollection({
      id: nanoid(),
      userId,
      collectionName,
      subsetName: subsetName || null,
      draftId,
      metadata: metadata || null,
      segmentPrediction: segmentPrediction || null,
      aiSuggestionSource: aiSuggestionSource || null,
    });

    console.log(`✅ Created collection entry: ${collection.id} for user ${userId}`);
    res.status(201).json(collection);
  } catch (error: any) {
    console.error("❌ Error creating collection:", error);
    res.status(500).json({ message: "Failed to create collection" });
  }
});

/**
 * PATCH /api/collections/:id
 * Update a collection entry (rename, move to different collection/subset)
 */
router.patch("/:id", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth.userId;
    const { collectionName, subsetName, metadata } = req.body;

    // Verify ownership
    const existing = await storage.getCollectionById(id);
    if (!existing) {
      return res.status(404).json({ message: "Collection not found" });
    }
    if (existing.userId !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updated = await storage.updateDraftCollection(id, {
      collectionName: collectionName || existing.collectionName,
      subsetName: subsetName !== undefined ? subsetName : existing.subsetName,
      metadata: metadata || existing.metadata,
    });

    console.log(`✅ Updated collection: ${id}`);
    res.json(updated);
  } catch (error: any) {
    console.error("❌ Error updating collection:", error);
    res.status(500).json({ message: "Failed to update collection" });
  }
});

/**
 * DELETE /api/collections/:id
 * Delete a collection entry
 */
router.delete("/:id", isAuthenticated, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth.userId;

    // Verify ownership
    const existing = await storage.getCollectionById(id);
    if (!existing) {
      return res.status(404).json({ message: "Collection not found" });
    }
    if (existing.userId !== userId) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await storage.deleteDraftCollection(id);
    console.log(`✅ Deleted collection: ${id}`);
    res.status(204).send();
  } catch (error: any) {
    console.error("❌ Error deleting collection:", error);
    res.status(500).json({ message: "Failed to delete collection" });
  }
});

/**
 * POST /api/drafts/save
 * Save a draft with collection assignment
 * (This endpoint bridges the existing draft system with collections)
 */
router.post("/drafts/save", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.auth.userId;
    const { draftId, collectionName, subsetName, metadata } = req.body;

    if (!draftId || !collectionName) {
      return res.status(400).json({ message: "draftId and collectionName are required" });
    }

    // Create collection entry for this draft
    const collection = await storage.createDraftCollection({
      id: nanoid(),
      userId,
      collectionName,
      subsetName: subsetName || null,
      draftId,
      metadata: metadata || null,
      segmentPrediction: null,
      aiSuggestionSource: null,
    });

    console.log(`✅ Saved draft ${draftId} to collection "${collectionName}"`);
    res.status(201).json(collection);
  } catch (error: any) {
    console.error("❌ Error saving draft to collection:", error);
    res.status(500).json({ message: "Failed to save draft to collection" });
  }
});

export default router;



/**
 * POST /api/ai/suggestCollections
 * Generate AI-powered collection name suggestions and detect user segment
 */
router.post("/ai/suggestCollections", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.auth.userId;
    const { objectTypes, geolocation, timestamp, userBehaviorPatterns } = req.body;

    const { generateCollectionSuggestions } = await import("../services/collectionSuggestionService");
    
    const result = await generateCollectionSuggestions({
      objectTypes,
      geolocation,
      timestamp,
      userBehaviorPatterns,
    });

    // Store segment prediction if confidence is high enough
    if (result.confidence >= 0.7) {
      await storage.upsertUserSegment({
        id: nanoid(),
        userId,
        segment: result.segmentPrediction,
        confidence: String(result.confidence),
        detectionSignals: {
          objectTypes,
          geolocation,
        },
      });
    }

    console.log(`✅ Generated suggestions for user ${userId}: ${result.suggestions.join(", ")}`);
    res.json(result);
  } catch (error: any) {
    console.error("❌ Error generating suggestions:", error);
    res.status(500).json({ message: "Failed to generate suggestions" });
  }
});

/**
 * POST /api/monetization/trigger
 * Log when a user interacts with a monetization prompt
 */
router.post("/monetization/trigger", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.auth.userId;
    const { eventType, segment, offerType, collectionId, metadata } = req.body;

    if (!eventType || !segment || !offerType) {
      return res.status(400).json({ message: "eventType, segment, and offerType are required" });
    }

    const event = await storage.logMonetizationEvent({
      id: nanoid(),
      userId,
      eventType,
      segment,
      offerType,
      collectionId: collectionId || null,
      metadata: metadata || null,
    });

    console.log(`✅ Logged monetization event: ${eventType} for segment ${segment}`);
    res.status(201).json(event);
  } catch (error: any) {
    console.error("❌ Error logging monetization event:", error);
    res.status(500).json({ message: "Failed to log event" });
  }
});

/**
 * GET /api/monetization/offer/:segment
 * Get monetization offer details for a specific segment
 */
router.get("/monetization/offer/:segment", isAuthenticated, async (req: any, res) => {
  try {
    const { segment } = req.params;
    
    const { getMonetizationOffer } = await import("../services/collectionSuggestionService");
    const offer = getMonetizationOffer(segment);

    res.json(offer);
  } catch (error: any) {
    console.error("❌ Error fetching monetization offer:", error);
    res.status(500).json({ message: "Failed to fetch offer" });
  }
});

