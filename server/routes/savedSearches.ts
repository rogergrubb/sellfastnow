import { Router } from "express";
import { db } from "../db";
import { savedSearches, searchAlertNotifications } from "@shared/schema/saved_searches";
import { eq, and, desc } from "drizzle-orm";
// Auth is handled by req.user from Supabase middleware

const router = Router();

// Get all saved searches for the current user
router.get("/", async (req: any, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const userId = req.user!.id;
    
    const searches = await db
      .select()
      .from(savedSearches)
      .where(eq(savedSearches.userId, userId))
      .orderBy(desc(savedSearches.createdAt));
    
    res.json(searches);
  } catch (error) {
    console.error("Error fetching saved searches:", error);
    res.status(500).json({ error: "Failed to fetch saved searches" });
  }
});

// Get a specific saved search
router.get("/:id", async (req: any, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const userId = req.user!.id;
    const searchId = parseInt(req.params.id);
    
    const [search] = await db
      .select()
      .from(savedSearches)
      .where(and(
        eq(savedSearches.id, searchId),
        eq(savedSearches.userId, userId)
      ));
    
    if (!search) {
      return res.status(404).json({ error: "Saved search not found" });
    }
    
    res.json(search);
  } catch (error) {
    console.error("Error fetching saved search:", error);
    res.status(500).json({ error: "Failed to fetch saved search" });
  }
});

// Create a new saved search
router.post("/", async (req: any, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const userId = req.user!.id;
    const {
      name,
      searchQuery,
      category,
      condition,
      priceMin,
      priceMax,
      location,
      distance,
      emailNotifications,
      smsNotifications,
      notificationFrequency,
    } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }
    
    const [newSearch] = await db
      .insert(savedSearches)
      .values({
        userId,
        name,
        searchQuery: searchQuery || null,
        category: category || null,
        condition: condition || null,
        priceMin: priceMin ? parseInt(priceMin) : null,
        priceMax: priceMax ? parseInt(priceMax) : null,
        location: location || null,
        distance: distance ? parseInt(distance) : null,
        emailNotifications: emailNotifications !== false, // Default true
        smsNotifications: smsNotifications === true, // Default false
        notificationFrequency: notificationFrequency || "instant",
        isActive: true,
      })
      .returning();
    
    res.status(201).json(newSearch);
  } catch (error) {
    console.error("Error creating saved search:", error);
    res.status(500).json({ error: "Failed to create saved search" });
  }
});

// Update a saved search
router.patch("/:id", async (req: any, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const userId = req.user!.id;
    const searchId = parseInt(req.params.id);
    
    // Check if search exists and belongs to user
    const [existingSearch] = await db
      .select()
      .from(savedSearches)
      .where(and(
        eq(savedSearches.id, searchId),
        eq(savedSearches.userId, userId)
      ));
    
    if (!existingSearch) {
      return res.status(404).json({ error: "Saved search not found" });
    }
    
    const {
      name,
      searchQuery,
      category,
      condition,
      priceMin,
      priceMax,
      location,
      distance,
      emailNotifications,
      smsNotifications,
      notificationFrequency,
      isActive,
    } = req.body;
    
    const [updatedSearch] = await db
      .update(savedSearches)
      .set({
        ...(name !== undefined && { name }),
        ...(searchQuery !== undefined && { searchQuery }),
        ...(category !== undefined && { category }),
        ...(condition !== undefined && { condition }),
        ...(priceMin !== undefined && { priceMin: priceMin ? parseInt(priceMin) : null }),
        ...(priceMax !== undefined && { priceMax: priceMax ? parseInt(priceMax) : null }),
        ...(location !== undefined && { location }),
        ...(distance !== undefined && { distance: distance ? parseInt(distance) : null }),
        ...(emailNotifications !== undefined && { emailNotifications }),
        ...(smsNotifications !== undefined && { smsNotifications }),
        ...(notificationFrequency !== undefined && { notificationFrequency }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      })
      .where(eq(savedSearches.id, searchId))
      .returning();
    
    res.json(updatedSearch);
  } catch (error) {
    console.error("Error updating saved search:", error);
    res.status(500).json({ error: "Failed to update saved search" });
  }
});

// Delete a saved search
router.delete("/:id", async (req: any, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const userId = req.user!.id;
    const searchId = parseInt(req.params.id);
    
    // Check if search exists and belongs to user
    const [existingSearch] = await db
      .select()
      .from(savedSearches)
      .where(and(
        eq(savedSearches.id, searchId),
        eq(savedSearches.userId, userId)
      ));
    
    if (!existingSearch) {
      return res.status(404).json({ error: "Saved search not found" });
    }
    
    await db
      .delete(savedSearches)
      .where(eq(savedSearches.id, searchId));
    
    res.json({ success: true, message: "Saved search deleted" });
  } catch (error) {
    console.error("Error deleting saved search:", error);
    res.status(500).json({ error: "Failed to delete saved search" });
  }
});

export default router;

